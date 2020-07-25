import axios from "../http/axios.webapi"
import { map, first,catchError } from 'rxjs/operators';
import { Observable , from, throwError, of } from "rxjs";
import { plainToClass } from "class-transformer";
import { WorkerReport } from "../../models/worker-report/worker-report";
import { APIAccessError } from "../../error/api-access.error";
import { Worker } from "../../models/worker/worker";

export function getWorkerReports(start_ymd:Date,end_ymd:Date): Observable<WorkerReport[]>{
    var data = {
        start_ymd: start_ymd,
        end_ymd: end_ymd
    }

    return from(axios.get("/workerreports", { params: data })).pipe(
        first(),
        //mapはovservableを返す
        map(response=>{
            var datas:any[] = response.data;
            var workerReports: WorkerReport[] = plainToClass(WorkerReport, datas);
            return workerReports;
        }),
        catchError((error => {
            throw new APIAccessError("get workerreports access error", error);
        }))
    );
}


export function updateWorkerReports(workerReports: WorkerReport[], workers: Worker[], targetYMs:Date[], factory_uids: string[]): Observable<boolean> {

    var yms: string[];
    if (targetYMs.length === 0) {
        return of(true);
    } else {
        yms = targetYMs.map((ym) => Worker.ymdToYM(ym));
    }

    var data ={
        worker_uids: workers.map(worker => worker.uid),
        yyyyMMs: yms,
        factory_uids : factory_uids,
        workerReports : workerReports
    }
    var send_data = JSON.stringify(data);

    return from(axios.post("/workerreports", send_data, { headers: { "Content-Type": "application/json" } })).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("post team access error", error));
        }))
    );
}


export function deleteWorkerReports(worker:Worker,factory_uids:string[], start_ymd: Date, end_ymd: Date): Observable<boolean> {
    var data = {
        worker_uids : [worker.uid],
        start_ymd: start_ymd,
        end_ymd: end_ymd,
        factory_uids:factory_uids
    }

    return from(axios.delete("/workerreports", { params: data })).pipe(
        first(),
        //mapはovservableを返す
        map(response => {
            return true;
        }),
        catchError((error => {
            throw new APIAccessError("get workerreports access error", error);
        }))
    );
}

