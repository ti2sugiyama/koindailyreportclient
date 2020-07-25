import React, {  useState } from 'react'
import { Team } from '../../models/team/team';
import { Worker } from '../../models/worker/worker';
import styled from 'styled-components'
import { getWorkers } from '../../services/workers/workers.service';
import {  map } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { getTeams, updateTeams, deleteTeams,getTeamWorkers,updateTeamWorkers } from '../../services/teams/teams.service';
import { Subscription, forkJoin, Observable } from 'rxjs';


const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
.title{
    text-align: left
}
li.selected {
    background-color : #AAAAAA;
}
`
interface Props {
    loadingSpinner: (state: boolean) => void
}
interface State { 
    teams:Team[],
    memberCnt:{[key:string]:number},
    selectedTeam: (Team | undefined),
    hasUnsavedData: boolean
}

export class Teams extends React.Component<Props,State>{
    workers: Worker[] = [];
    deleteTeams: Team[] = [];
    teams:Team[]=[];
    selectedTeam:(Team | undefined);
    memberCnt: { [key: string]: number }={};
    subscription: Subscription = new Subscription();

    constructor(props:Props){
        super(props);
        this.state={
            teams : [],
            memberCnt : {},
            selectedTeam: undefined,
            hasUnsavedData: false
        }
    }

    //画面初期化後
    componentDidMount() {
        this.props.loadingSpinner(true);
        //従業員情報をを取得(初回のみ)
        this.subscription.add(getWorkers().subscribe(
            //成功したら
            (workers) => {
                this.props.loadingSpinner(false);
                workers.sort(Worker.sort);
                this.workers = workers;
                //チーム＋構成員ロード
                this.loadingData();
            },
            (error) => {
                console.log(error);
                this.props.loadingSpinner(false);
                Swal.fire('通信エラー');
            }
        ));
    }
    //終了時
    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    //チーム＋構成員ロード
    loadingData=()=>{
        this.props.loadingSpinner(true);
        this.subscription.add(
            this.getTeamsFromServer().subscribe(
                () => {
                    this.subscription.add(this.getTeamWorkersFromServer().subscribe(
                        () => {
                            this.props.loadingSpinner(false);
                            this.setState({ hasUnsavedData:false});
                            this.calcMemberCnt();
                        },
                        (error) => {
                            this.props.loadingSpinner(false);
                            Swal.fire('通信エラー');
                        }
                    ))
                }, (error) => {
                    this.props.loadingSpinner(false);
                    console.log(error);
                    Swal.fire('通信エラー');
                })
        );
    }

    //Team一覧をサーバーから取得
    getTeamsFromServer = (): Observable<boolean> => {
        return getTeams().pipe(
            map(
                (teams) => {
                    teams.sort(Team.sort);
                    this.teams = teams;
                    this.setState({ teams: this.teams});
                    return true;
                }
            )
        )
    }

    //チーム構成員一覧をサーバーから取得
    getTeamWorkersFromServer = (): Observable<boolean> => {
        this.workers.forEach(worker=>worker.clearTeam());
        return getTeamWorkers().pipe(
            map(
                (teamworkers) => {
                    teamworkers.forEach(teamWorker=>{
                        teamWorker.worker_uids.forEach(worker_uid=>{
                            let worker = this.workers.find(worker=>worker.uid === worker_uid);
                            if(worker){
                                worker.addTeam(teamWorker.team_uid);
                            }
                        })
                    });
                    return true;
                }
            )
        )
    };

    /**
     * 保存
     */
    save = () => {
        this.props.loadingSpinner(true);
        this.subscription.add(
            //チームの削除更新が終わるまで待つ
            forkJoin(
                deleteTeams(this.deleteTeams),
                updateTeams(this.teams)
            ).subscribe(
                () => {
                    //続いてチームの構成員情報を更新
                    this.subscription.add(
                        updateTeamWorkers(this.teams.concat(this.deleteTeams), this.workers).subscribe(
                            ()=>{
                                this.props.loadingSpinner(false);
                                //全て成功したらデータを再ロード
                                this.loadingData();
                            },
                            (error) => {
                                this.props.loadingSpinner(false);
                                console.log(error);
                                Swal.fire('通信エラー');
                            }
                        )
                    )
                },
                (error) => {
                    this.props.loadingSpinner(false);
                    console.log(error);
                    Swal.fire('通信エラー');
                }
            )
        )
    }

    //所属人数を計算する
    calcMemberCnt = ()=>{
        this.memberCnt={};        
        this.teams.forEach(team=>{
            this.memberCnt[team.uid]=this.countMember(team);
        });
        this.setState({ memberCnt: this.memberCnt});        
    }
    countMember = (team: Team) => {
        return this.workers.filter(worker => worker.inTeam(team.uid)).length;
    }
    changeMemberCnt = (team:Team)=>{
        this.memberCnt[team.uid]=this.countMember(team);
        this.setState({ memberCnt: this.memberCnt, hasUnsavedData: true});
    }

    removeTeam = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>)=>{
        let index: number = Number(event.currentTarget.value);
        this.deleteTeams.push(this.teams[index]);
        this.teams.splice(index, 1);

        this.selectedTeam = undefined; //ダミー
        this.setState({ selectedTeam: this.selectedTeam, hasUnsavedData: true});
    };

    addTeam = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        let team = new Team();
        team.generateUid();
        this.teams.push(team);
        this.changeMemberCnt(team);
        this.setState({ teams: this.teams, hasUnsavedData: true});
    };

    editTeam = (event:React.ChangeEvent<HTMLInputElement>)=>{
        let index: number = Number(event.currentTarget.getAttribute("data-index"));
        this.teams = this.teams.slice();
        this.teams[index].name = event.target.value;
        this.setState({ teams: this.teams, hasUnsavedData: true});
    }

    changeTeamWorker = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>)=>{
        let index: number = Number(event.currentTarget.value);
        this.selectedTeam = this.teams[index];
        this.setState({ selectedTeam: this.selectedTeam});
    }


    render() {
        return (
            <Styles>
                <nav className="navbar navbar-light bg-light">
                    <span className="navbar-brand mb-0 h1">チーム名</span>
                    <button className={this.state.hasUnsavedData ? "btn btn-warning btn-sm " : " btn btn-outline-info btn-sm "} type="submit" onClick={this.save}>保存</button>
                </nav>
                <div className="row">
                    <div className="col">
                        <table>
                            <thead>
                                <tr>
                                    <td>名前</td>
                                    <td>メンバー編集</td>
                                    <td><button className="btn btn-outline-primary btn-sm"  onClick={this.addTeam}>追加</button></td>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    this.state.teams.map((team: Team,index:number) => {
                                        return (
                                            <tr key={index}>
                                                <td>
                                                    <input  data-index={index} value={team.name} onChange={this.editTeam}/>
                                                </td>
                                                <td>
                                                    <button className="btn btn-outline-secondary btn-sm" value={index} onClick={this.changeTeamWorker}>メンバー({this.state.memberCnt[team.uid]}人)</button>
                                                </td>
                                                <td>
                                                    <button className="btn btn-outline-danger btn-sm" value={index} onClick={this.removeTeam}>削除</button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                    <div className="col">
                        {
                            this.state.selectedTeam
                                ? <SelectWorker allWorkers={this.workers} team={this.state.selectedTeam} changeMemberCnt={this.changeMemberCnt} />
                            : ""
                        }
                    </div>
                </div>
            </Styles>
        );
    }

}

function SelectWorker({ allWorkers, team, changeMemberCnt }: { allWorkers: Worker[], team: Team, changeMemberCnt:any}){
    const [allWorkersState,changeState] = useState(allWorkers);
//    propsに変更があった場合、stateを上書きする
    if (allWorkersState!==allWorkers){
        changeState(allWorkers);
    }


    var changeWorker = (event: React.MouseEvent<HTMLLIElement, MouseEvent>)=>{
        var worker_uid = event.currentTarget.getAttribute("data-worker_uid");
        var newAllWorkersState = allWorkersState.slice();
        newAllWorkersState.forEach(worker=>{
            if(worker.uid === worker_uid){
                if(worker.inTeam(team.uid)){
                    worker.removeTeam(team.uid);
                }else{
                    worker.addTeam(team.uid);
                }
                return;
            }
        });
        changeMemberCnt(team);
        changeState(newAllWorkersState);
    };

    return (
        <React.Fragment>
            <h6>{team.name} メンバー</h6>
            <ul className="list-group">
                {
                    allWorkersState.map((worker,index)=>{
                        return <li key={index} className={"list-group-item " + (worker.inTeam(team.uid) ?"selected":"")} data-worker_uid ={worker.uid} onClick={changeWorker}>{worker.getName()}</li>
                    })
                }
            </ul>
        </React.Fragment>
    );
}