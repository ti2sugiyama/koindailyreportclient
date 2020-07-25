import { plainToClass } from 'class-transformer';
import { WorkerReportSampledata } from './worker-report_sampledata';
import { WorkerReport } from './worker-report';
import { Worker } from '../worker/worker';
import { WorkerSampledata } from '../worker/worker_sampledata';


describe('WorkerReport', () => {
    it('should create an instance', () => {
        let workers : Worker[] = plainToClass(Worker,WorkerSampledata);
        let worker_report: WorkerReport[] = plainToClass(WorkerReport, WorkerReportSampledata(workers,new Date()));

        //newflgフィールドはclassの方でセットされる為、比較データに追加する
        let compare_worker_report = WorkerReportSampledata(workers, new Date()).map(data=>{
            return {
                ...data,
                 newflg:false
            }
        })
        expect(worker_report).toEqual(compare_worker_report);
    }),
        it('check function getYMDString', () => {
        let worker_report= new WorkerReport();
        worker_report.ymd = new Date(2020,3,10);
        expect(worker_report.getYMDString()).toEqual("2020-04-10");
    })
});

