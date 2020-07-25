import React, { useState } from 'react';
import ReportAmountTable, {TableSize} from "../../components/table/amount/report-amount-table";
import { Worker } from '../../models/worker/worker';
import { createDaysAMonth as createDatesAMonth, stringToArrayBuffer } from '../../services/utils/utils.service';
import styled from 'styled-components'
import { formatDate } from '../../services/utils/utils.service';
import Swal from 'sweetalert2'
import { getWorkers } from '../../services/workers/workers.service';
import { getWorkerReports } from '../../services/worker-reports/worker-reports.service';
import { getTeams, getTeamWorkers } from '../../services/teams/teams.service';
import { Subscription, Observable, forkJoin} from 'rxjs';
import { map } from 'rxjs/operators';
import ReactModal from 'react-modal';
import './team-report.page.scss';
import { setWorkerReportToWorker } from '../../services/editable-report.service';
import { Team } from '../../models/team/team';
import JSZip from 'jszip';
import XLSX from "xlsx";
import { createTeamWorkerReportOuput, createTeamWorkerReportOneSheetOuput} from '../../services/output/output-teamworker-excel.service';
//const XLSXStyle = require('xlsx-style');

/*
XLSXStyleを使用する為にさらに3Steps
1. node_modules/xlsx-style/dist/cpexcel.jsを書き換える
        //var cpt = require('./cpt' + 'able');
        var cpt = cptable;
2. node_modules/xlsx-style/dist/ods.jsを書き換える
//		return require('../' + 'xlsx').utils;
        return require('./'+'xlsx').utils;
3. public/index.htmlに追記
      <script src="dist/cpexcel.js"></script>
      <script src="dist/ods.js"></script>
*/

var appElement = document.getElementById('root');
if (appElement) {
    ReactModal.setAppElement(appElement);
}

const Styles = styled.div`

`
interface Prop {
    loadingSpinner: (state: boolean) => void
    menuActive : boolean
}

interface State{
    selectedTeamState: (Team | undefined),
    tableSize:TableSize,
    targetDates:Date[],
}

export class TeamReport extends React.Component<Prop, State> {
    workers: Worker[] = [];
    teams: Team[] = [];
    changeableTeams: Team[] = [];
    selectedWorkers:Worker[]=[];
    selectedTeam: (Team|undefined);
    selectedYM: Date;
    targetDates:Date[]
    subscription: Subscription = new Subscription();
    tableSize : TableSize;

    constructor(prop: Prop) {
        super(prop);
        this.selectedYM = new Date();
        this.tableSize = {
            width: 100,
            height: 100
        }
        this.targetDates = [];
        this.state={
            selectedTeamState : this.selectedTeam,
            tableSize : this.tableSize,
            targetDates: this.targetDates,
        }
    }

    updateWindowResize=()=>{
        this.tableSize.height = window.innerHeight - 280; 
        if(this.props.menuActive){
            this.tableSize.width = window.innerWidth - 440;
        }else{
            this.tableSize.width = window.innerWidth - 200;
        }
        
        this.setState({
            tableSize: this.tableSize,
        })
    }

    /**
     * 初期化
     */
    componentDidMount() {
        this.props.loadingSpinner(true);
        this.targetDates = createDatesAMonth(this.selectedYM);
        this.setState({
            targetDates: this.targetDates,
        });
        this.subscription.add(
            this.subscription.add(forkJoin(
                //従業員情報をとチーム一覧取得(初回のみ)
                this.getWorkersFromServer(),
                this.getTeamsFromServer(),
            ).subscribe(
                (result) => {
                    //チーム所属従業員を取得
                    this.subscription.add(
                        this.getTeamWorkersFromServer().subscribe(
                            (result)=>{
                                this.props.loadingSpinner(false);
                                this.loadingData();
                            },
                            (error) => {
                                console.log(error);
                                this.props.loadingSpinner(false);
                                Swal.fire('通信エラー');
                            }
                        )
                    )
                    this.props.loadingSpinner(false);
                },
                (error) => {
                    console.log(error);
                    this.props.loadingSpinner(false);
                    Swal.fire('通信エラー');
                }
            )
        ));

        this.updateWindowResize();
        window.addEventListener('resize', this.updateWindowResize);
    } 
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateWindowResize);
        this.subscription.unsubscribe();
    }

    componentDidUpdate(prevProps: Prop, prevState: State) {
        if (this.props.menuActive !== prevProps.menuActive) {
            this.updateWindowResize();
        }
    }
    /**
     * 対象月の月報を取得
     */
    loadingData = () => {
        this.props.loadingSpinner(true);
        var start_ymd = new Date(this.selectedYM.getFullYear(), this.selectedYM.getMonth(), 1);
        var end_ymd = new Date(this.selectedYM.getFullYear(), this.selectedYM.getMonth() + 1, 0);
        
        this.subscription.add(getWorkerReports(start_ymd, end_ymd).subscribe(
            (workerReports) => {
                this.props.loadingSpinner(false);
                this.clearAllWorkerReport();
                setWorkerReportToWorker(this.workers, workerReports);
                if(this.selectedTeam){
                    this.onChangeTeam(this.selectedTeam.uid);
                }
            },
            (error)=>{
                this.props.loadingSpinner(false);
                console.log(error);
                Swal.fire('通信エラー');
            }
        ));
    }

    outputExcel = () => {
        this.props.loadingSpinner(true);
        var zip = new JSZip();
        var hasData: boolean = false;
        this.teams.forEach(team=>{
            var workBook = createTeamWorkerReportOuput(team, this.workers, this.targetDates);
            if (workBook){
                hasData = true;
                var wb_out = XLSX.write(workBook, { type: 'binary' });
                var blob = new Blob([stringToArrayBuffer(wb_out)], { type: 'application/octet-stream' });
                zip.file(team.name + ".xlsx", blob);
            }
        });

        if(hasData){
            zip.generateAsync({ type: "blob" }).then(
                (blob) => {
                    this.props.loadingSpinner(false);
                    saveAs(blob, formatDate(this.selectedYM, "yyyy年MM月") + "_月報_チーム別.zip");
                },
                () => {
                    this.props.loadingSpinner(false);
                    Swal.fire('zip圧縮失敗');
                }
            );
        }else{
            this.props.loadingSpinner(false);
        }

    }

    outputExcelOneSheet = () => {
        this.props.loadingSpinner(true);
        var zip = new JSZip();
        var workBook = createTeamWorkerReportOneSheetOuput(this.teams, this.workers, this.targetDates);
        if(workBook){
            var wb_out = XLSX.write(workBook, { type: 'binary' });
            var blob = new Blob([stringToArrayBuffer(wb_out)], { type: 'application/octet-stream' });
            zip.file(formatDate(this.selectedYM, "yyyy年MM月") + "_月報.xlsx", blob);
            zip.generateAsync({ type: "blob" }).then(
                (blob) => {
                    this.props.loadingSpinner(false);
                    saveAs(blob, formatDate(this.selectedYM, "yyyy年MM月") + "_月報.zip");
                },
                () => {
                    this.props.loadingSpinner(false);
                    Swal.fire('zip圧縮失敗');
                }
            );
        } else {
            this.props.loadingSpinner(false);
        }
    }
    

    clearAllWorkerReport=()=>{
        this.workers.forEach(worker=>
            worker.clearAllWorkerReport()
        );
    }

    //作業員一覧をサーバーから取得、初回のみ
    getWorkersFromServer = (): Observable<boolean> => {
        return getWorkers().pipe(
            map((workers) => {
                workers.sort(Worker.sort);
                this.workers = workers;
                return true;
            })
        );
    };
    //チーム一覧をサーバーから取得、初回のみ
    getTeamsFromServer = (): Observable<boolean> => {
        return getTeams().pipe(
            map(
                (teams) => {
                    teams.sort(Team.sort);
                    this.teams = teams; 
                    if(this.teams.length>0){
                        this.selectedTeam = this.teams[0];
                    }
                    return true;
                }
            )
        );
    };

    //チーム構成員一覧をサーバーから取得
    getTeamWorkersFromServer = (): Observable<boolean> => {
        this.workers.forEach(worker => worker.clearTeam());
        return getTeamWorkers().pipe(
            map(
                (teamworkers) => {
                    teamworkers.forEach(teamWorker => {
                        teamWorker.worker_uids.forEach(worker_uid => {
                            let worker = this.workers.find(worker => worker.uid === worker_uid);
                            if (worker) {
                                worker.addTeam(teamWorker.team_uid);
                            }
                        })
                    });
                    return true;
                }
            )
        )
    }

    /**
     * 対象年月を変更した時の処理
     * 月報を月単位でサーバーに取りに行っている
     */
    onChangeYM = (newTargetYM: Date) => {
        this.selectedYM = newTargetYM;
        this.targetDates = createDatesAMonth(this.selectedYM);
        this.setState({
            targetDates: this.targetDates,
        });
        this.loadingData();
    }

    onChangeTeam = ( new_uid: string) => {
        this.selectedTeam = this.teams.find(team=>team.uid === new_uid);
        if (this.selectedTeam){
            this.selectedWorkers = this.workers.filter(worker=>worker.inTeam(new_uid));
        }
        this.setState({
            selectedTeamState: this.selectedTeam,
        })
    }

    render() {
        return (
            <Styles>
                <div className="header row">
                    <div className="col">
                        <div className="header-contents row">
                            <div className="col-2 align-middle align-left">
                                <span className="title">月報確認</span>
                            </div>
                            <div className="col-2">
                                <ChangeYM selectedYM={this.selectedYM} onChange={this.onChangeYM} />
                            </div>
                            <div className="col-2">
                                {
                                    this.selectedTeam
                                        ? <ChangeTeam selectedTeamUID={this.selectedTeam.uid} teams={this.teams} onChange={this.onChangeTeam} />
                                        : ""
                                }
                            </div>
                            <div className="col-2 align-left">
                                <button className="btn btn-sm btn-outline-success" type="submit" onClick={this.outputExcel}>Excel出力</button>
                            </div>
                            <div className="col-3 align-left">
                                <button className="btn btn-sm btn-outline-success" type="submit" onClick={this.outputExcelOneSheet}>Excel1シート出力</button>
                            </div>

                        </div>
                    </div>
                </div>
                <div className="main-contents">
                    {
                        this.state.selectedTeamState
                            ? <ReportAmountTable targetDates={this.state.targetDates} team={this.state.selectedTeamState} workers={this.selectedWorkers} tableSize={this.state.tableSize}/>
                        : ""
                    }
                </div>
            </Styles>
        );
    }
}

function ChangeTeam({ selectedTeamUID, teams, onChange }: { selectedTeamUID: string, teams: Team[], onChange: any }) {
    const [teamUID, changeTargetUID] = useState(selectedTeamUID);
    const changeTarget = ((event: React.ChangeEvent<HTMLSelectElement>) => {
        let newTeamUID = event.target.value;
        changeTargetUID(newTeamUID)
        onChange(newTeamUID);
    });
    return (
        <select className="custom-select" value={teamUID} onChange={changeTarget}>
            {teams.map((team, index) => {
                return <option key={index} value={team.uid}>{team.name}</option>
            })}
        </select>
    );
}

function ChangeYM({ selectedYM, onChange }: { selectedYM: Date, onChange: any }) {
    var getYMs = (date: Date): Date[] => {
        var retVal: Date[] = [];
        var startYM = new Date(date.getFullYear(), date.getMonth() - 4, 1);
        for (var i = 0; i < 8; i++) {
            retVal.push(startYM);
            startYM = new Date(startYM.getFullYear(), startYM.getMonth() + 1, 1);
        }
        return retVal;
    }

    const [selectedYMState, changeSelectedYM] = useState(selectedYM);
    const [YMs, changeYMs] = useState(getYMs(selectedYM));

    const changeTarget = ((event: React.ChangeEvent<HTMLSelectElement>) => {
        let YM: string[] = event.target.value.split("-");
        let newSelctedYM = new Date(Number(YM[0]), Number(YM[1]) - 1, 1);
        changeSelectedYM(newSelctedYM);
        changeYMs(getYMs(newSelctedYM));
        onChange(newSelctedYM);
    });
    return (
        <select className="custom-select" value={formatDate(selectedYMState, "yyyy-MM")}  onChange={changeTarget}>
            {YMs.map((date, index) => {
                return <option key={index} value={formatDate(date, "yyyy-MM")}>{formatDate(date, "yyyy年MM月")}</option>
            })}
        </select>
    );
}

export default TeamReport;
