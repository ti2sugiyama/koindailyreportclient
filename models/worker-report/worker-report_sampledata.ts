import { Worker } from "../worker/worker"
import { formatDate, createDaysAMonth } from "../../services/utils/utils.service";
import { Factory } from '../factory/factory';
import { plainToClass } from 'class-transformer';
import { FactorySampledata } from '../factory/factory_sampledata';

/*
export const WorkerReportFactoriesSample = (targetDate: Date):Factory[]=>{
    return plainToClass(Factory, FactorySampledata);
}
*/
export const WorkerReportSampledata = (workers: Worker[], targetDate: Date)=>{
    let factorys: Factory[] = plainToClass(Factory, FactorySampledata);
    //flatMapにしないと[[]]となってしまう
    var cnt=0;
    return factorys.flatMap((factory,factory_index)=>{
        return createDaysAMonth(targetDate).flatMap((date: Date, index: number)=>
            workers.map((worker:Worker)=>{
                cnt++;
                return {
                    company_uid: worker.company_uid,
                    uid: worker.uid +"-"+ formatDate(date),
                    worker_uid: worker.uid,
                    factory_uid:factory.uid,
                    ymd: date,
                    working_time: 600 + cnt,
                    over_working_time: 10 + cnt,
                    night_working_time: cnt,
                    cost_food: cnt*2,
                }
            })
        );
    })
}

