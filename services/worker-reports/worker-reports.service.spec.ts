
import { getWorkerReports } from "./worker-reports.service";
import axios from 'axios';
import { WorkerReportSampledata } from "../../models/worker-report/worker-report_sampledata";
import { plainToClass } from "class-transformer";
import { WorkerReport } from "../../models/worker-report/worker-report";
import { WorkerSampledata } from "../../models/worker/worker_sampledata";
import { Worker } from "../../models/worker/worker";
jest.mock('axios');

function successWithDelay(retValue:{}, delay:number):Promise<any>{
    return new Promise((success, fail) => setTimeout(success(), delay)).then(
        () => {return retValue;}
    );
}

describe('WorkerReportsService  getService', () => {
    var workers:Worker[] = plainToClass(Worker, WorkerSampledata);
    var workerReports = WorkerReportSampledata(workers, new Date()) ;

    (axios.get as any).mockResolvedValue(
        successWithDelay({ data: workerReports}, 1000)
    );

    it('success', done => {
        let expectedWorkerReports: WorkerReport[] = plainToClass(WorkerReport,workerReports);
        var sub =  getWorkerReports().subscribe(resonse=>{
            expect(resonse).toEqual(expectedWorkerReports);
            done();
        });
    })
});
