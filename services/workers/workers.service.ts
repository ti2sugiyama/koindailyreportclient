import axios from "../http/axios.webapi"
import { map, first,catchError } from 'rxjs/operators';
import { Observable, from, throwError, of} from "rxjs";
import { plainToClass } from "class-transformer";
import { Worker, WorkerFactoryInterface } from "../../models/worker/worker";
import { APIAccessError } from "../../error/api-access.error";


export function getWorkers():Observable<Worker[]>{
    return from(axios.get("/workers")).pipe(
        first(),
        map(response=>{
            var datas:any[] = response.data;
            var workers: Worker[] = plainToClass(Worker, datas);
            return workers;
        }),
        catchError((error => {
            return throwError(new APIAccessError("get workers access error",error)); 
        }))
    );
}

export function updateWorkers(workers: Worker[]): Observable<boolean> {
    if(workers.length===0){
        return of(true);
    }
    var data = JSON.stringify(workers);
    return from(axios.post("/workers", data, { headers:{"Content-Type": "application/json"}})).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("post workers access error", error));
        }))
    );
}

export function deleteWorkers(workers: Worker[]): Observable<boolean> {
    var uids: string = workers.filter(worker => !worker.newflg).map(worker => worker.uid).join(",");
    if (uids.length === 0) {
        return of(true);
    }
    var data = {
        uids: uids
    }

    return from(axios.delete("/workers", {params:data})).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("delete workers access error", error));
        }))
    );
}



export function getWorkerFatories(targetYMs: Date[]): Observable<WorkerFactoryInterface[]> {
    var yms: string[];
    if (targetYMs.length === 0) {
        return of([]);
    } else {
        yms = targetYMs.map((ym) => Worker.ymdToYM(ym));
    }

    var data = {
        yyyyMMs: yms
    }
    return from(axios.get("/workerfactories", { params: data })).pipe(
        first(),
        map(response => {
            var datas: WorkerFactoryInterface[] = response.data;
            return datas;
        }),
        catchError((error => {
            return throwError(new APIAccessError("get workerfactories access error", error));
        }))
    );
}

export function updateWorkerFatories(workers: Worker[], targetYMs: Date[]): Observable<boolean> {
    var yms:string[];
    if (targetYMs.length === 0) {
        return of(true);
    }else{
        yms = targetYMs.map((ym)=>Worker.ymdToYM(ym));
    }


    var send_data= {
        worker_uids: workers.map(worker=>worker.uid),
        yyyyMMs: yms,
        workerFactories: workers.flatMap(worker =>
            yms.map(ym => ({
                worker_uid: worker.uid,
                ym: ym,
                factory_uids: worker.getFactorieUIDs(ym)
            }))
        )
    };

    return from(axios.post("/workerfactories", send_data, { headers: { "Content-Type": "application/json" } })).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("get workerfactories access error", error));
        }))
    );
}
