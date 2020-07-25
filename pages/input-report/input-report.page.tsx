import XLSX from "xlsx";
import React, { useState } from 'react';
import ReportTable,{TableSize} from '../../components/table/worker-report/report-table';
import { Worker } from '../../models/worker/worker';
import { createDaysAMonth as createDatesAMonth, stringToArrayBuffer } from '../../services/utils/utils.service';
import styled from 'styled-components'
import { Factory } from '../../models/factory/factory';
import { formatDate } from '../../services/utils/utils.service';
import Swal from 'sweetalert2'
import { getWorkers, getWorkerFatories,updateWorkerFatories } from '../../services/workers/workers.service';
import { getFactories } from '../../services/factories/factories.service';
import { getWorkerReports, updateWorkerReports } from '../../services/worker-reports/worker-reports.service';
import { Subscription, Observable, forkJoin, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import ReactModal from 'react-modal';
import './input-report.page.scss';
import { setWorkerReportToWorker } from '../../services/editable-report.service';
import { WorkerReport } from '../../models/worker-report/worker-report'; 
import { createWorkerFactoriesReportOuput } from '../../services/output/output-excel.service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Team } from "../../models/team/team";
import { getTeams, getTeamWorkers } from "../../services/teams/teams.service";

//モック
//import axios from 'axios';
//import MockAdapter from 'axios-mock-adapter';
//import { WorkerReportSampledata } from "../../models/worker-report/worker-report_sampledata";
//import { FactorySampledata } from "../../models/factory/factory_sampledata";
//import { WorkerSampledata } from "../../models/worker/worker_sampledata";
//import { WorkerFactorySampledata } from '../../services/workers/worker-factory_sampledata';
//const mockAxios = new MockAdapter(axios,{delayResponse: 500 });
//mockAxios.onGet("/workers").reply(200, WorkerSampledata);
//mockAxios.onGet("/factories").reply(200, FactorySampledata);
//モック終わり

var appElement = document.getElementById('root');
if (appElement) {
    ReactModal.setAppElement(appElement);
}

const Styles = styled.div`;

   
`
interface Prop {
    loadingSpinner: (state: boolean) => void
    menuActive : boolean
}

interface State{
    selectedWorkerState: (Worker | null | undefined),
    showingWorkers:Worker[],
    hasUnsavedData:boolean,
    tableSize:TableSize
}

class UnsavedData {
    workers: Worker[]=[];
    YMs: Date[]=[];
    clearData(){
        this.workers = [];
        this.YMs =[];
    }
    addYMs(insertYM:Date){
        if (!this.YMs.find((ym) => ym.getTime() === insertYM.getTime())) {
            this.YMs.push(insertYM);
            this.YMs.sort();
        }
    }
    addWorker(insertWorker:(Worker|null)){
        if (insertWorker && !this.workers.find((worker) => worker.uid === insertWorker.uid)) {
            this.workers.push(insertWorker);
        }
    }
    hasData():boolean{
        return this.workers.length > 0 && this.YMs.length>0;
    }
    
    //必ず hasDataを先に読んでデータがあることをチェックする
    getStartYMD():Date{
        return new Date(this.YMs[0].getFullYear(), this.YMs[0].getMonth(), 1);
    }

    //必ず hasDataを先に読んでデータがあることをチェックする
    getEndYMD(): Date{
        return new Date(this.YMs[this.YMs.length - 1].getFullYear(), this.YMs[this.YMs.length - 1].getMonth()+1, 0);
    }

    /**
     * 保存していない月報データを取得
     */
    getUnSavedWorkerReports(): WorkerReport[] {
        var retWorkerReport: WorkerReport[] = [];
        if(this.hasData()){
            this.YMs.forEach(ym=>
                this.workers.forEach((worker)=>{
                    retWorkerReport = retWorkerReport.concat(worker.getMonthlyWorkerReports(ym));
                })
            )
        }
        return retWorkerReport;
    }
}

const UN_SELECTED_TTEAM_UID: string = "-1";

export class InputReport extends React.Component<Prop, State> {
    workers: Worker[] = [];
    teams: Team[] = [];
    selectedTeamUID: string = UN_SELECTED_TTEAM_UID;
    factories: Factory[] = [];
    changeableFactories: Factory[] = [];
    selectableFactories: Factory[] = [];
    targetDates: Date[] = [];
    selectedYM: Date;
    selectedWorker: (Worker | null | undefined) = null;
    subscription: Subscription = new Subscription();
    tableSize : TableSize;
    unsavedData = new UnsavedData();

    
    constructor(prop: Prop) {
        super(prop);
        this.tableSize = {
            width: 100,
            height: 100
        }
        this.state={
            selectedWorkerState:this.selectedWorker,
            showingWorkers:[],
            hasUnsavedData:false,
            tableSize : this.tableSize
        }
        this.selectedYM = new Date();
        this.targetDates = createDatesAMonth(this.selectedYM);
    }

    updateWindowResize=()=>{
        this.tableSize.height = window.innerHeight - 280; 
        if(this.props.menuActive){
            this.tableSize.width = window.innerWidth - 440;
        }else{
            this.tableSize.width = window.innerWidth - 200;
        }
        
        this.setState({
            tableSize: this.tableSize
        })
    }

    /**
     * 初期化
     */
    componentDidMount() {
        this.props.loadingSpinner(true);
        this.subscription.add(
            this.subscription.add(forkJoin(
                //従業員情報をと現場、従業員絞り込み用のチーム一覧取得(初回のみ)
                this.getWorkersFromServer(),
                this.getFactoriesFromServer(),
                this.getTeamsFromServer(),
            ).subscribe(
                (result) => {
                    this.subscription.add(
                        //従業員所属チームを取得する
                        this.getTeamWorkersFromServer().subscribe(
                            (result)=>{
                                this.setState({
                                    showingWorkers: this.createShowingWorker()
                                });
                                this.loadingData();
                                this.props.loadingSpinner(false);
                            },
                            (error)=>{
                                console.log(error);
                                this.props.loadingSpinner(false);
                                Swal.fire('通信エラー');
                            }
                        )
                    );
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
            this.updateWindowResize();//ここでstateを再度計算するので、もう一度Renderが呼ばれてしまう。
        }
    }

    /**
     * 対象月の場所と月報を取得
     */
    loadingData = () => {
        this.props.loadingSpinner(true);
        this.subscription.add(
            forkJoin(
                this.getWorkerFactoriesFromServer([this.selectedYM]),
                this.getWorkerReportsFromServer([this.selectedYM]),
            ).subscribe(
                (result) => {
                    this.props.loadingSpinner(false);
                    this.setWorkerFactoriesAndSetState();
                },
                (error) => {
                    this.props.loadingSpinner(false);
                    console.log(error);
                    Swal.fire('通信エラー');
                })
        );
    }

    addUnsavedData(){
        if(this.selectedWorker){
            this.unsavedData.addYMs(this.selectedYM);
            this.unsavedData.addWorker(this.selectedWorker);
        }

    };
    clearUnsavedData(){
        this.unsavedData.clearData();
        this.setState({
            selectedWorkerState: this.selectedWorker,
            hasUnsavedData: this.unsavedData.hasData()
        })
    }

    save = () => {
        if (this.unsavedData.hasData()) {
            this.props.loadingSpinner(true);
            this.subscription.add(
                forkJoin(
                    updateWorkerReports(this.unsavedData.getUnSavedWorkerReports(), this.unsavedData.workers, this.unsavedData.YMs, this.factories.map((factory)=>factory.uid)),
                    updateWorkerFatories(this.unsavedData.workers, this.unsavedData.YMs),
                ).pipe(tap(() => this.props.loadingSpinner(false), () => this.props.loadingSpinner(false)))
                    .subscribe(() => {
                        this.clearUnsavedData();
                        this.workers.forEach(worker=>{
                            worker.clearAllFactories();
                            worker.clearAllWorkerReport();
                        })
                        this.loadingData();
                    }, (error) => {
                        Swal.fire('通信エラー');
                    })
            );
        }
    }
    outputExcel=()=>{
        this.props.loadingSpinner(true);
        var zip = new JSZip();
        var hasData :boolean = false;
        this.workers.forEach(worker=>{
            var workBook = createWorkerFactoriesReportOuput(worker, this.factories, this.targetDates);
            if (workBook.SheetNames.length){
                hasData = true;
                var wb_out = XLSX.write(workBook, { type: 'binary' });
                var blob = new Blob([stringToArrayBuffer(wb_out)], { type: 'application/octet-stream' });
                zip.file(worker.getName() + ".xlsx", blob);
            }
        });
        if(hasData){
            zip.generateAsync({ type:"blob"}).then(
                (blob) => {
                    this.props.loadingSpinner(false);
                    saveAs(blob, formatDate(this.selectedYM,"yyyy年MM月")+"_月報.zip");
                },
                ()=>{
                    this.props.loadingSpinner(false);
                    Swal.fire('zip圧縮失敗');
                }
            );
        }else{
            this.props.loadingSpinner(false);
        }
    }

    //作業員一覧をサーバーから取得、初回のみ
    getWorkersFromServer = (): Observable<boolean> => {
        return getWorkers().pipe(
            map((workers) => {
                workers.sort(Worker.sort);
                this.workers = workers;
                if(this.workers.length>0){
                    this.selectedWorker = this.workers[0];
                }
                return true;
            })
        );
    };

    //場所一覧をサーバーから取得、初回のみ
    getFactoriesFromServer = (): Observable<boolean> => {
        return getFactories().pipe(
            map((factories) => {
                factories.sort(Factory.sort);
                this.factories = factories;
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
     * 月報情報をサーバーから取得
     * @param YMs　取得対象年月のリスト [0]の1日から [length-1]の最終日まで
     */
    getWorkerReportsFromServer = (YMs:Date[]): Observable<boolean> => {
        if (YMs.length>0){
            var startYM: Date = YMs[0];
            var endYM: Date = YMs[YMs.length-1];
            var start_ymd = new Date(startYM.getFullYear(), startYM.getMonth(),1);
            var end_ymd = new Date(endYM.getFullYear(), endYM.getMonth()+1,0);
            return getWorkerReports(start_ymd,end_ymd).pipe(
                map(
                    (workerReports)=>{
                        setWorkerReportToWorker(this.workers,workerReports);
                        return true;
                    }
                )
            );
        }else{
            return of(true);
        }
    };

    /**
     * 従業員の各現場を取得
     * @param YMs 対象年月リスト
     */
    getWorkerFactoriesFromServer = (YMs: Date[]): Observable<boolean> => {
        return getWorkerFatories(YMs).pipe(
            map(
                (workerfactories) => {
                    this.workers.forEach(worker => {
                        worker.clearFactories(this.selectedYM);
                        worker.addFactories(workerfactories.filter(wf => wf.worker_uid === worker.uid));
                    });
                    return true;
                },
            )
        )
    };

    /**
     * setState
     */
    setWorkerFactoriesAndSetState = () => {
        this.selectableFactories = [];
        if (this.selectedWorker) {
            this.selectedWorker.getFactorieUIDs(this.selectedYM).forEach(facotry_uid => {
                let selectedFactory = this.factories.find(factory => factory.uid === facotry_uid);
                if (selectedFactory) {
                    this.selectableFactories.push(selectedFactory);
                }
            })
            this.calcChangeableFactory();
        }
        this.setState({
            selectedWorkerState: this.selectedWorker,
            hasUnsavedData : this.unsavedData.hasData(),
            tableSize : this.tableSize
        });
    }

    /**
     * まだ登録していない現場を抽出
     */
    calcChangeableFactory() {
        this.changeableFactories = [];
        this.factories.forEach(factory => {
            if (!this.selectableFactories.find((selectedFacotry) => factory.uid === selectedFacotry.uid)) {
                this.changeableFactories.push(factory);
            }
        });
    }

    /**
     * 対象年月を変更した時の処理
     * 月報を月単位でサーバーに取りに行っている
     */
    onChangeYM = (newTargetYM: Date) => {
        this.selectedYM = newTargetYM;
        this.targetDates = createDatesAMonth(this.selectedYM);
        this.loadingData();
    }

    onClickYM = () => {
        if (this.unsavedData.hasData()) {
            Swal.fire({
                title: '確認?',
                text: "保存していないデータがあります。",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: '保存する',
                cancelButtonText: '戻る',
            }).then((result) => {
                if (result.value) {
                    this.save();
                } else {
                }
            });
        }
    }

    /**
     * 作業員を変更した時の処理
     */
    onChangeWorker = (workerUID: (string|null)) => {
        let worker = this.workers.find(worker => worker.uid === workerUID);
        this.selectedWorker = worker;
        this.setWorkerFactoriesAndSetState();
    }

    /**
     * 現場を追加した時の処理
     */
    addFactory = ()=>{
        let data = this.changeableFactories.shift();
        if(data){
            if(this.selectedWorker){
                this.addUnsavedData();
                this.selectedWorker.addFactory(this.selectedYM,data.uid);
                this.setWorkerFactoriesAndSetState();
            }
        }
    }

    onChangeFactory = (old_uid: string, new_uid: string) => {
        this.addUnsavedData();
        let newFactory = this.factories.find(factory=>factory.uid === new_uid);
        if (newFactory && this.selectedWorker){
            this.selectedWorker.changeFactory(this.selectedYM, this.targetDates, old_uid, newFactory.uid);
        }
        this.setWorkerFactoriesAndSetState();
    }

    onDeleteFactory = (uid: string) => {
        if(this.selectedWorker){
            let amount=this.selectedWorker.getAmount(this.targetDates,uid);
            if( amount.working_time===0 && amount.over_working_time===0 && amount.night_working_time===0 && amount.cost_food===0){
                this.selectedWorker.removeFactory(this.selectedYM,this.targetDates, uid);
                this.addUnsavedData();
                this.setWorkerFactoriesAndSetState();
            } else {
                Swal.fire('現場の月報を削除するには全ての値を0にしてください');
            }
        }
    }

    onChangeTeam = (new_uid: string) => {
        this.selectedTeamUID = new_uid;
        let newShoiwngWorkers:Worker[] = this.createShowingWorker();
        if (newShoiwngWorkers.length>0){
            this.onChangeWorker(newShoiwngWorkers[0].uid);
        }else{
            this.onChangeWorker(null);
        }
        this.setState({
            showingWorkers: newShoiwngWorkers,
        });

    }


    createShowingWorker():Worker[]{
        if(this.selectedTeamUID===UN_SELECTED_TTEAM_UID){
            return [...this.workers];
        }
        return this.workers.filter((worker)=>
//            worker.inTeam(this.selectedTeamUID) || worker.uid === this.selectedWorker?.uid
            worker.inTeam(this.selectedTeamUID)
        );
    }


    /**
     * テーブルデータに変更があった場合呼ばれる
     */
    onDataChanged = () => {
        var oldStatus = this.unsavedData.hasData();
        this.addUnsavedData();
        if (oldStatus!==this.unsavedData.hasData()){
            this.setState({
                hasUnsavedData: this.unsavedData.hasData(),
            })
        }
    }

    render() {
        return (
            <Styles>
                <div className="header row">
                    <div className="col">
                        <div className="header-contents row">
                            <div className="col-1 align-middle align-left">
                                <span className="title">入力</span>
                            </div>
                            <div className="col-2">
                                <ChangeYM selectedYM={this.selectedYM} onChange={this.onChangeYM} onClick={this.onClickYM} />
                            </div>
                            <div className="col-2">
                                {
                                    <FilterTeam selectedTeamUID={this.selectedTeamUID} teams={this.teams} onChange={this.onChangeTeam} />
                                }
                            </div>
                            <div className="col-2">
                                {
                                    this.state.selectedWorkerState
                                        ? <ChangeWorker selectedWorkerUID={this.state.selectedWorkerState.uid} workers={this.state.showingWorkers} onChange={this.onChangeWorker} />
                                        : ""
                                }
                            </div>
                            <div className="col-3 align-left">
                                <button className="btn btn-outline-secondary btn-sm " onClick={this.addFactory} disabled={this.selectableFactories.length === this.factories.length}>現場追加</button>
                                    <span className="space-width"></span>
                                <button className="btn btn-sm btn-outline-success" type="submit" onClick={this.outputExcel}>Excel出力</button>
                            </div>

                            <div className="col align-right">
                                <button className={this.state.hasUnsavedData ? "btn btn-warning btn-sm " : " btn btn-outline-info btn-sm "} type="submit" onClick={this.save}>保存</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="main-contents">
                    {
                        this.selectedWorker
                        ?<ReportTable targetDates={this.targetDates} worker={this.selectedWorker} factories={this.selectableFactories}
                        changeableFactories={this.changeableFactories} onChangeFactory={this.onChangeFactory} onDeleteFactory={this.onDeleteFactory}
                                onDateChanged={this.onDataChanged} tableSize={this.state.tableSize}/>
                        : ""
                    }
                </div>
            </Styles>
        );
    }
}


function FilterTeam({ selectedTeamUID, teams, onChange }: { selectedTeamUID: string, teams: Team[], onChange: any }) {
    const [teamUID, changeTargetUID] = useState(selectedTeamUID);
    const changeTarget = ((event: React.ChangeEvent<HTMLSelectElement>) => {
        let newTeamUID = event.target.value;
        changeTargetUID(newTeamUID)
        onChange(newTeamUID);
    });
    return (
        <select className="custom-select" value={teamUID} onChange={changeTarget}>
            <option key="-1" value={UN_SELECTED_TTEAM_UID}>全て</option>
            {teams.map((team, index) => {
                return <option key={index} value={team.uid}>{team.name}</option>
            })}
        </select>
    );
}



function ChangeWorker({ selectedWorkerUID, workers, onChange } : { selectedWorkerUID: string, workers: Worker[], onChange: any }) {
    const [workerUID, changeTargetUID] = useState(selectedWorkerUID);

    //外から渡された引数で更新する場合
    if (workerUID !== selectedWorkerUID){
        changeTargetUID(selectedWorkerUID);
    }

    console.log(selectedWorkerUID);
    const changeTarget = ((event: React.ChangeEvent<HTMLSelectElement>) => {
        let newWorkerUID = event.target.value;
        changeTargetUID(newWorkerUID)
        onChange(newWorkerUID);
    });
    return (
        <select className="custom-select" value={workerUID} onChange={changeTarget}>
            {workers.map((worker, index) => {
                return <option key={index} value={worker.uid}>{worker.getName()}</option>
            })}
        </select>
    );
}

function ChangeYM({ selectedYM, onChange, onClick }: { selectedYM: Date, onChange: any, onClick:any }) {
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
        <select className="custom-select" value={formatDate(selectedYMState, "yyyy-MM")} onClick={onClick} onChange={changeTarget}>
            {YMs.map((date, index) => {
                return <option key={index} value={formatDate(date, "yyyy-MM")}>{formatDate(date, "yyyy年MM月")}</option>
            })}
        </select>
    );
}

export default InputReport;
