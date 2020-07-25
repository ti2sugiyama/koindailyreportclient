import { Worker, Amount } from './worker';
import { plainToClass } from 'class-transformer';
import { WorkerSampledata} from './worker_sampledata';
import { WorkerReport } from '../worker-report/worker-report';
import { WorkerReportSampledata } from '../worker-report/worker-report_sampledata';
import { createDaysAMonth, getStringToSortValue} from '../../services/utils/utils.service';
import { setWorkerReportToWorker } from '../../services/editable-report.service';
import { Team } from '../team/team';
import { TeamSampledata } from '../team/team_sampledata';
import { Factory } from '../factory/factory';
import { FactorySampledata, createSampleWorkerFactoy } from '../factory/factory_sampledata';
import { AbstractModel } from '../abstract-model';

describe('Worker', () => {
    it('should create an instance', () => {
        let worker: Worker[] = plainToClass(Worker, WorkerSampledata);
        expect(worker[0].company_uid).toBe("ikara"); 
        expect(worker[0].uid).toBe("11111");
        expect(worker[0].seikanji).toBe("高橋");
        expect(worker[0].meikanji).toBe("裕也");
        expect(worker[0].getName()).toBe("高橋裕也");
        expect(worker[0].subcontractor).toBe(false);

        expect(worker[1].company_uid).toBe("ikara");
        expect(worker[1].uid).toBe("22222");
        expect(worker[1].seikanji).toBe("岡田");
        expect(worker[1].meikanji).toBe("真明");
        expect(worker[1].getName()).toBe("岡田真明");
        expect(worker[1].subcontractor).toBe(false);
        expect(worker[3].subcontractor).toBe(true);
    }),

    /**
     * チーム関連
     */
    it('setTeam function', () => {
        let worker: Worker = new Worker();
        let teams: Team[] = plainToClass(Team, TeamSampledata);
        let team_uids:string[] = [];
        teams.forEach(team => team_uids.push(team.uid));
        worker.setTeamUIDs(team_uids);
        expect(worker.getTeamUIDs()).toBe(team_uids);
    }),
    it('clearTeam function', () => {
        let worker: Worker = new Worker();
        let teams: Team[] = plainToClass(Team, TeamSampledata);
        let team_uids: string[] = [];
        teams.forEach(team => team_uids.push(team.uid));
        worker.setTeamUIDs(team_uids);
        worker.clearTeam();
        expect(worker.getTeamUIDs()).toEqual([]);
    }),
    it('addTeam function', () => {
        let worker: Worker = new Worker();
        //チームが正しく追加されているかチェック
        let team: Team = new Team();
        team.generateUid();
        team.name = "test";
        worker.addTeam(team.uid);
        expect(worker.getTeamUIDs().length).toBe(1);
        expect(worker.getTeamUIDs()[0]).toBe(team.uid);

        //同じチームは追加しない
        worker.addTeam(team.uid);
        expect(worker.getTeamUIDs().length).toBe(1);
        expect(worker.getTeamUIDs()[0]).toBe(team.uid);

    }),it('Inteam function', () => {
        let worker: Worker = new Worker(); 
        let teams: Team[] = plainToClass(Team, TeamSampledata);
        let team_uids: string[] = [];
        teams.forEach(team => team_uids.push(team.uid));
        worker.setTeamUIDs(team_uids);

        expect(worker.inTeam("kozi1")).toBe(true);
        expect(worker.inTeam("kozi4")).toBe(false);

    }), it('Remove team function', () => {
        let worker: Worker = new Worker();
        let team: Team = new Team();
        team.uid = "test";
        team.name = "test";
        worker.addTeam(team.uid);

        team = new Team();
        team.uid="test2";
        worker.addTeam(team.uid);
        expect(worker.getTeamUIDs().length).toBe(2);
        worker.removeTeam("test");
        expect(worker.getTeamUIDs().length).toBe(1);
        expect(worker.getTeamUIDs()[0]).toBe("test2");
        worker.removeTeam("test");
        expect(worker.getTeamUIDs().length).toBe(1);
        expect(worker.getTeamUIDs()[0]).toBe("test2");
    }),

    /**
     * 場所関連
     */
    it('setFactory function', () => {
        let worker: Worker = new Worker();
        let factories: Factory[] = plainToClass(Factory, FactorySampledata);
        let date1 = new Date(2020, 10, 1);
        let date2 = new Date(2020, 11, 1);

        let factory_uids: string[] = [];
        factories.forEach(factory => factory_uids.push(factory.uid));      

        worker.addFactories(createSampleWorkerFactoy(worker, date1, factories));
        expect(worker.getFactorieUIDs(date1)).toStrictEqual(factory_uids);
        expect(worker.getFactorieUIDs(date2)).toEqual([]);
    }),
    it('clearFactory function', () => {
        let worker: Worker = new Worker();
        let factories: Factory[] = plainToClass(Factory, FactorySampledata);
        let factory_uids: string[] = [];
        factories.forEach(factory => factory_uids.push(factory.uid));      

        let date1 = new Date(2020, 10, 1);
        let date2 = new Date(2020, 11, 1);

        worker.addFactories(createSampleWorkerFactoy(worker, date1, factories));
        worker.addFactories(createSampleWorkerFactoy(worker, date2, factories));
        expect(worker.getFactorieUIDs(date1)).toStrictEqual(factory_uids);
        worker.clearFactories(date1);
        expect(worker.getFactorieUIDs(date1)).toEqual([]);
        expect(worker.getFactorieUIDs(date2)).toStrictEqual(factory_uids);

    }),
    it('addFactory function', () => {
        let worker: Worker = new Worker();
        let factory: Factory = new Factory("test","ikara","テスト");
        let date1 = new Date(2020, 10, 1);
        let date2 = new Date(2020, 11, 1);
        worker.addFactory(date1, factory.uid);
        expect(worker.getFactorieUIDs(date1).length).toBe(1);
        expect(worker.getFactorieUIDs(date1)[0]).toBe(factory.uid);
        expect(worker.getFactorieUIDs(date2)).toEqual([]);

        //同じ場所は追加しない
        worker.addFactory(date1, factory.uid);
        expect(worker.getFactorieUIDs(date1).length).toBe(1);

    }),
    it('check removeFactory function ', () => {
        let workers: Worker[] = plainToClass(Worker, WorkerSampledata);
        let factories: Factory[] = plainToClass(Factory, FactorySampledata); 
        let targetYM = new Date();
        let worker_reports: WorkerReport[] = plainToClass(WorkerReport, WorkerReportSampledata(workers, targetYM));
        let targetDates = createDaysAMonth(targetYM); // WorkerReportSampledata内で使っている一ヶ月分の日付生成関数
        setWorkerReportToWorker(workers, worker_reports);
        let targetWorker = workers[0];
        let deletedFactoy: Factory = factories[0];


        targetWorker.addFactories(createSampleWorkerFactoy(targetWorker, targetYM, factories));   

        let deletedDates = targetDates.slice(0, 15);
        let exitedDates = targetDates.slice(15);

        targetWorker.removeFactory(targetYM, deletedDates, deletedFactoy.uid);
        var getWorkerReport = (workerReports: WorkerReport[], ymd: Date, factory: Factory): (WorkerReport | undefined) => {
            return workerReports.find(workerReport => workerReport.ymd.getTime() === ymd.getTime() && workerReport.factory_uid === factory.uid);
        }

        let existFactories = factories.filter(factory => factory.uid !== deletedFactoy.uid);
        let exist_factory_uids: string[] = [];
        existFactories.forEach(factory => exist_factory_uids.push(factory.uid));      

        expect(targetWorker.getFactorieUIDs(targetYM)).toEqual(exist_factory_uids);

        deletedDates.forEach(date=>{
            factories.forEach(factory=>{
                if (factory.uid === deletedFactoy.uid){
                    expect(targetWorker.getWorkerReport(date,factory.uid)).toBe(undefined);
                }else{
                    expect(targetWorker.getWorkerReport(date, factory.uid)).toBe(getWorkerReport(worker_reports,date,factory))
                }
            })
        })

        exitedDates.forEach(date => {
            factories.forEach(factory => {
                expect(targetWorker.getWorkerReport(date, factory.uid)).toBe(getWorkerReport(worker_reports, date, factory))
            })
        })
    }),

    it('changeFactory function', () => {
        let workers: Worker[] = plainToClass(Worker, WorkerSampledata);
        let workerfactories: Factory[] = plainToClass(Factory, FactorySampledata); 
        let targetYM = new Date();
        let nextMonthYM = new Date(targetYM.getFullYear(),targetYM.getMonth()+1,1);
        let worker_reports: WorkerReport[] = plainToClass(WorkerReport, WorkerReportSampledata(workers, targetYM));
        let worker_reports_next: WorkerReport[] = plainToClass(WorkerReport, WorkerReportSampledata(workers, nextMonthYM));
        setWorkerReportToWorker(workers, worker_reports);
        setWorkerReportToWorker(workers, worker_reports_next);
        let targetWorker = workers[0];


        targetWorker.addFactories(createSampleWorkerFactoy(targetWorker, targetYM, workerfactories.slice()));   
        targetWorker.addFactories(createSampleWorkerFactoy(targetWorker, nextMonthYM, workerfactories.slice()));   

        let targetDates = createDaysAMonth(targetYM);
        let nextMonthDates = createDaysAMonth(nextMonthYM); 

        let changedFactoy: Factory = workerfactories[0];
        let newFactoy: Factory = new Factory("a", "ikara", "new", true);
        targetWorker.changeFactory(targetYM, targetDates, changedFactoy.uid, newFactoy.uid);

        var getWorkerReport = (workerReports: WorkerReport[], ymd: Date, factory: Factory): (WorkerReport | undefined) => {
            return workerReports.find(workerReport => workerReport.ymd.getTime() === ymd.getTime() && workerReport.factory_uid === factory.uid);
        }
        var sortFunction = (a: string, b: string):number =>{
            return (getStringToSortValue(a) - getStringToSortValue(b))
        }

        let factories = workerfactories.slice();
        factories.push(newFactoy);

        var amonth_factories = factories.filter(factory => factory.uid !== changedFactoy.uid);
        var next_month_factories = factories.filter(factory => factory.uid !== newFactoy.uid);
        let amonth_factoriy_uids: string[] = [];
        let next_month_factory_uids: string[] = [];

        amonth_factories.forEach(factory => amonth_factoriy_uids.push(factory.uid));
        next_month_factories.forEach(factory => next_month_factory_uids.push(factory.uid));      


        //変更した月は、変更元factoryは存在しない
        expect(targetWorker.getFactorieUIDs(targetYM).sort(sortFunction)).toEqual(amonth_factoriy_uids.sort(sortFunction));
        //翌月は、変化なしなので変更先factoryは存在しない
        expect(targetWorker.getFactorieUIDs(nextMonthYM).sort(sortFunction)).toEqual(next_month_factory_uids.sort(sortFunction));

        targetDates.forEach(date=>{
            factories.forEach(factory=>{
                //変更元予定は存在しない
                if (factory.uid === changedFactoy.uid){
                    expect(targetWorker.getWorkerReport(date,factory.uid)).toBe(undefined);
                }else{
                    let compareReport = getWorkerReport(worker_reports, date, factory);
                    expect(targetWorker.getWorkerReport(date, factory.uid)).toBe(compareReport);
                    expect(factory.uid).toBe(compareReport?.factory_uid);
                }
            })
        })

        nextMonthDates.forEach(date => {
            factories.forEach(factory => {
                //先月の変更予定は存在しない
                if (factory.uid === newFactoy.uid) {
                    expect(targetWorker.getWorkerReport(date, factory.uid)).toBe(undefined);
                } else {
                    let compareReport = getWorkerReport(worker_reports_next, date, factory);
                    expect(targetWorker.getWorkerReport(date, factory.uid)).toBe(compareReport);
                    expect(factory.uid).toBe(compareReport?.factory_uid);
                }
            })
        })
    }),
        


    /**
     * workerReport関連
     */
    it('setWorkerReport function', () => {
        let worker: Worker = new Worker();
        let factory: Factory = new Factory();
        worker.generateUid();
        factory.generateUid();
        let workerReport: WorkerReport = new WorkerReport();

        workerReport.uid="test";
        workerReport.worker_uid = worker.uid;
        workerReport.factory_uid = factory.uid;
        workerReport.ymd = new Date(2020,0,10);
        worker.addWorkerReport(workerReport);
         expect(worker.workerReports[workerReport.getYMDString()][workerReport.factory_uid]).toBe(workerReport);
    }),
    it('getWorkerReport function', () => {
        let worker: Worker = new Worker();
        let factory: Factory = new Factory();
        worker.generateUid();
        factory.generateUid();
        let workerReport: WorkerReport = new WorkerReport();

        workerReport.uid="test";
        workerReport.worker_uid = worker.uid;
        workerReport.factory_uid = factory.uid;
        workerReport.ymd = new Date(2020,0,10);
        worker.addWorkerReport(workerReport);
        expect(worker.getWorkerReport(workerReport.ymd, workerReport.factory_uid)).toBe(workerReport);
        expect(worker.getWorkerReport(new Date(2020, 0, 11), workerReport.factory_uid)).toBe(undefined);
        expect(worker.getWorkerReport(workerReport.ymd, workerReport.factory_uid + "1")).toBe(undefined);
    }),

    it('getDailyWorkerRepors function', () => {
        let worker: Worker = new Worker();
        worker.generateUid();

        let factory1: Factory = new Factory("f1","ikara","場所A",true);
        let factory2: Factory = new Factory("f2", "ikara", "場所B",true);
        let date1 = new Date(2020, 0, 10);
        let date2 = new Date(2020, 0, 11);

        let workerReport1: WorkerReport = new WorkerReport("w1", "iakra", worker.uid,date1,factory1.uid,true);
        let workerReport2: WorkerReport = new WorkerReport("w2", "ikara",worker.uid,date1,factory2.uid,true);
        let workerReport3: WorkerReport = new WorkerReport("w3", "ikara",worker.uid,date2,factory1.uid,true);

        worker.addWorkerReport(workerReport1);
        worker.addWorkerReport(workerReport2);
        worker.addWorkerReport(workerReport3);
        expect(worker.getDailyWorkerReports(workerReport1.ymd).find(workerReport => workerReport.factory_uid === workerReport1.factory_uid)).toBe(workerReport1);
        expect(worker.getDailyWorkerReports(workerReport1.ymd).find(workerReport => workerReport.factory_uid === workerReport2.factory_uid)).toBe(workerReport2);
        expect(worker.getDailyWorkerReports(workerReport3.ymd).find(workerReport => workerReport.factory_uid === workerReport3.factory_uid)).toBe(workerReport3);
        expect(worker.getDailyWorkerReports(workerReport3.ymd).find(workerReport => workerReport.factory_uid === workerReport2.factory_uid)).toBe(undefined);
    }),

    it('removeWorkerReport function',()=>{
        let worker: Worker = new Worker();
        let factory1: Factory = new Factory();
        let factory2: Factory = new Factory();
        factory1.generateUid();
        factory2.generateUid();
        worker.generateUid();

        let date1 = new Date(2020, 10, 1);
        let date2 = new Date(2020, 10, 2);

        
        let wokerReport1 = new WorkerReport("wr1", "ikara", worker.uid, date1, factory1.uid, false);
        let awokerReporta = new WorkerReport("wr1", "ikara", worker.uid, date2, factory1.uid, false);
        let awokerReport = new WorkerReport("wr1", "ikara", worker.uid, date1, factory2.uid, false); //別現場

        worker.addWorkerReport(wokerReport1);
        worker.addWorkerReport(awokerReporta);
        worker.addWorkerReport(awokerReport);

        worker.removeWorkerReport(date1,factory1.uid);
        expect(worker.getWorkerReport(date1, factory1.uid)).toBe(undefined);
        expect(worker.getWorkerReport(date2, factory1.uid)).toBe(awokerReporta);
        expect(worker.getWorkerReport(date1, factory2.uid)).toBe(awokerReport);

        worker.removeWorkerReport(date1);
        expect(worker.getWorkerReport(date1, factory1.uid)).toBe(undefined);
        expect(worker.getWorkerReport(date2, factory1.uid)).toBe(awokerReporta);
        expect(worker.getWorkerReport(date1, factory2.uid)).toBe(undefined);
    }),    

    it('changeFactoryWorkerReport function',()=>{
        let worker: Worker = new Worker();
        worker.generateUid();
        let factory1: Factory = new Factory("f1","ikara","f1");
        let factory2: Factory = new Factory("f2","ikara","f2");
        let factory3: Factory = new Factory("f3","ikara","f3");

        let date1 = new Date(2020, 10, 1);
        let date2 = new Date(2020, 10, 2);

        
        let wokerReport1 = new WorkerReport("wr1", "ikara", worker.uid, date1, factory1.uid, false);
        let wokerReport1a = new WorkerReport("wr1", "ikara", worker.uid, date1, factory3.uid, false);
        let wokerReport2 = new WorkerReport("wr1", "ikara", worker.uid, date2, factory1.uid, false);
        let wokerReport3 = new WorkerReport("wr1", "ikara", worker.uid, date1, factory2.uid, false);

        worker.addWorkerReport(wokerReport1);
        worker.addWorkerReport(wokerReport2);
        worker.addWorkerReport(wokerReport3);

        expect(worker.getWorkerReport(date1, factory1.uid)).toBe(wokerReport1);
        worker.changeFactoryWorkerReport(date1,factory1.uid,factory3.uid)
        expect(worker.getWorkerReport(date1, factory1.uid)).toBe(undefined);
        expect(worker.getWorkerReport(date2, factory1.uid)).toBe(wokerReport2);
        expect(worker.getWorkerReport(date1, factory3.uid)).toEqual(wokerReport1a);
    }),



    it('getAmount', () => {
        let workers: Worker[] = plainToClass(Worker, WorkerSampledata);
        let worker_report: WorkerReport[] = plainToClass(WorkerReport, WorkerReportSampledata(workers, new Date()));
        let targetDates = createDaysAMonth(new Date());
        setWorkerReportToWorker(workers, worker_report);

        let amount:Amount = workers[0].getAmount(targetDates);
        expect(amount.working_time).toBe(105028);
        expect(amount.over_working_time).toBe(31868);
        expect(amount.night_working_time).toBe(30628);
        expect(amount.cost_food).toBe(61256);


        let amount2 = workers[0].getAmount(targetDates, worker_report[0].factory_uid);
        expect(amount2.working_time).toBe(20491);
        expect(amount2.over_working_time).toBe(2201);
        expect(amount2.night_working_time).toBe(1891);
        expect(amount2.cost_food).toBe(3782);

    })

});
