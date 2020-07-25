import { AbstractModel} from '../abstract-model';
import { WorkerReport } from '../worker-report/worker-report';
import { formatDate } from '../../services/utils/utils.service';



export interface WorkerFactoryInterface {
    worker_uid: string,
    ym: string,
    factory_uids: string[]
}


export interface Amount{
    working_time:number,
    over_working_time:number,
    night_working_time:number,
    cost_food:number,
    holidaywork_cnt:number,
    note:string,
}

export class Worker extends AbstractModel {
    id : string="";
    seikanji: string = "";
    meikanji: string = "";
    subcontractor: boolean=false;
    team_uids:string[]=[];


    //作業報告 : [日付:[場所:[データ]]]
    workerReports: { 
        [ymd:string]:{
            [factory_uid:string]: WorkerReport
        }
    } = {};

    //月別作業場所 [ym:string]:factory_uid
    factoriesAtMonth:{
        [ym:string]:string[]
    }={}

    

    public constructor(){
        super();
    }

    /**
     * ソート用
     */
    static sort(a: Worker, b: Worker): number {
        let aid = a.id;
        if(aid===undefined || aid===null){
            aid = "";
        }

        let bid = b.id;
        if (bid === undefined || bid === null){
            bid = "";
        }
        let len = Math.min(aid.length, bid.length);
        for (let i = 0; i < len; i++) {
            if (aid.charCodeAt(i) < bid.charCodeAt(i)) {
                return -1;
            } else if(aid.charCodeAt(i) > bid.charCodeAt(i)) {
                return 1;
            }
        }
        

        if (aid.length < bid.length) {
            return -1;
        } else if (aid.length > bid.length) {
            return 1;
        }
        return 0;        
    }


    public getName():string {
        return this.seikanji + this.meikanji;
    }

    /**
     * チーム追加
     * @param newteam 
     */
    public addTeam(new_team_uid:string){
        var insertFlg = true;
        this.team_uids.forEach(team_uid=>{
            if (new_team_uid === team_uid){
                return insertFlg=false;
            }
        })
        if(insertFlg){
            this.team_uids.push(new_team_uid);
        }
    }

    public setTeamUIDs(teams:string[]){
        this.team_uids=teams;
    }
    public getTeamUIDs():string[]{
        return this.team_uids;
    }
    public clearTeam(){
        this.team_uids = [];
    }
    public removeTeam(team_uid:string){
        this.team_uids = this.team_uids.filter(myTeam => myTeam !== team_uid);
    }

    public inTeam(team_uid: string):boolean{
        return this.team_uids.filter(myTeam => (myTeam === team_uid)).length>0;
    }

    /**
     * 月報追加
     * @param workerReport 
     */
    public addWorkerReport(workerReport: WorkerReport): void {
        if (!this.workerReports[workerReport.getYMDString()]) {
            this.workerReports[workerReport.getYMDString()] = {};
        }
        this.workerReports[workerReport.getYMDString()][workerReport.factory_uid] = workerReport;
    }

    public removeWorkerReport(date: Date, factory_uid?: string){
        var ymd = formatDate(date);
        if (this.workerReports[ymd]){
            if(factory_uid){
                delete this.workerReports[ymd][factory_uid];
            }else{
                delete this.workerReports[ymd];
            }
        }
    }

    public clearAllWorkerReport(){
        this.workerReports = {};
    }

    public changeFactoryWorkerReport(date: Date, old_factory_uid: string, new_factory_uid: string) {
        var workerReport = this.getWorkerReport(date, old_factory_uid);
        if(workerReport){
            workerReport.factory_uid = new_factory_uid;
            this.removeWorkerReport(date, old_factory_uid);
            this.removeWorkerReport(date, new_factory_uid);
            this.addWorkerReport(workerReport);
        }
    }


    public getWorkerReport(date: Date, factory_uid: string): (WorkerReport | undefined) {
        if (this.workerReports[formatDate(date)]) {
            return this.workerReports[formatDate(date)][factory_uid];
        } else {
            return undefined;
        }
    }

    public getDailyWorkerReports(date: Date):WorkerReport[]{
        var retVal: WorkerReport[] = [];
        var datas : {
            [factory_uid:string]:WorkerReport
        } = this.workerReports[formatDate(date)];

        for (var factory_uid in datas){
            retVal.push(datas[factory_uid]);
        };
        return retVal;
    }

    public getMonthlyWorkerReports(YM: Date): WorkerReport[]{
        var target_ymd = new Date(YM.getFullYear(),YM.getMonth(),1);
        var end_ymd = new Date(YM.getFullYear(),YM.getMonth()+1,1);
        var retVal: WorkerReport[] = [];

        while(target_ymd.getTime()<end_ymd.getTime()){
            this.getDailyWorkerReports(target_ymd).forEach(workerReport=>{
                retVal.push(workerReport);
            });
            target_ymd.setDate(target_ymd.getDate()+1);
        }
        return retVal;
    }
    /**
     * 集計
     * @param targetDates 
     * @param factory_uid 
     */
    public getAmount(targetDates:Date[],factory_uid?:string):Amount{
        var amount: Amount ={
            working_time:0,
            over_working_time:0,
            night_working_time:0,
            holidaywork_cnt:0,
            cost_food:0,
            note:""
        }

        targetDates.forEach((date) => {
            if(factory_uid){
                var workerReport = this.getWorkerReport(date, factory_uid);
                if (workerReport) {
                    amount.working_time += workerReport.working_time;
                    amount.over_working_time += workerReport.over_working_time;
                    amount.night_working_time += workerReport.night_working_time;
                    amount.cost_food += workerReport.cost_food;
                    amount.note += workerReport.note;
                    if (workerReport.holidayworkflg){
                        amount.holidaywork_cnt++;
                    }
                }
            }else{
                let holidayworkflg = false;
                this.getDailyWorkerReports(date).forEach(workerReport=>{
                    amount.working_time += workerReport.working_time;
                    amount.over_working_time += workerReport.over_working_time;
                    amount.night_working_time += workerReport.night_working_time;
                    amount.cost_food += workerReport.cost_food;
                    amount.note += workerReport.note;
                    holidayworkflg = holidayworkflg || workerReport.holidayworkflg;
                });
                if (holidayworkflg) {
                    amount.holidaywork_cnt++;
                }

            }
        });
        return amount;
    }

    /**
     * 場所追加
     * @param newFactory
     */
    public addFactory(ymDate: Date, factory_uid: string) {
        var ym = Worker.ymdToYM(ymDate);

        if (!this.factoriesAtMonth[ym]){
            this.factoriesAtMonth[ym]=[];
        }
        
        //まだ登録されていなければ追加
        if(!this.factoriesAtMonth[ym].find(has_factory_uid => has_factory_uid === factory_uid)){
            this.factoriesAtMonth[ym].push(factory_uid);
        }
    }

    /**
     * 場所を追加
     * @param worker_factories 
     */
    public addFactories(worker_factories: WorkerFactoryInterface[]) {
        worker_factories.forEach(worker_factory=>{
            if(worker_factory.worker_uid===this.uid){
                this.factoriesAtMonth[worker_factory.ym]=worker_factory.factory_uids;
            }
        });
    }


    public getFactorieUIDs(ymDate:(Date|string)): string[] {
        var ym:string;
        if(ymDate instanceof Date){
            ym = Worker.ymdToYM(ymDate);
        }else{
            ym = ymDate;        
        }

        var retValue = this.factoriesAtMonth[ym];
        if(retValue){
            return retValue;
        }else{
            return [];
        }
    }


    public clearAllFactories(){
        this.factoriesAtMonth={};
    }

    public clearFactories(ymDate:Date) {
        return this.factoriesAtMonth[Worker.ymdToYM(ymDate)]=[];
    }

    public removeFactory(ymDate: Date,targetDates:Date[], factory_uid: string) {
        var ym = Worker.ymdToYM(ymDate);
        if (this.factoriesAtMonth[ym]){
            this.factoriesAtMonth[ym] = this.factoriesAtMonth[ym].filter(
                myFactory => myFactory !== factory_uid
            );
        }
       targetDates.forEach((ymd)=>{
            this.removeWorkerReport(ymd,factory_uid);
       });
    }

    public changeFactory(ymDate:Date,targetDates:Date[], old_factory_uid:string, new_factory_uid:string){
        var ym = Worker.ymdToYM(ymDate);
        if (this.factoriesAtMonth[ym]) {
            for(let index=0; index<this.factoriesAtMonth[ym].length; index++){
                if(this.factoriesAtMonth[ym][index] === old_factory_uid){
                    this.factoriesAtMonth[ym][index] = new_factory_uid;
                }
            }
        }
        targetDates.forEach((ymd) => {
            this.changeFactoryWorkerReport(ymd, old_factory_uid, new_factory_uid);
        })
    }

    static ymdToYM(ymDate:Date){
        return formatDate(ymDate,"yyyyMM");
    }
}