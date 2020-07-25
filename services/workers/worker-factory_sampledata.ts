import { Worker } from "../../models/worker/worker"
import { formatDate } from "../utils/utils.service";
import { plainToClass } from 'class-transformer';
import { FactorySampledata } from '../../models/factory/factory_sampledata';
import { Factory } from "../../models/factory/factory";

export const WorkerFactorySampledata = (workers: Worker[], ymDate: Date)=>{
    let factories: Factory[] = plainToClass(Factory, FactorySampledata);
    //flatMapにしないと[[]]となってしまう
    var ym = formatDate(ymDate, "yyyyMM"); //worker.tsの中で使用している年月変換
    return workers.map((worker:Worker)=>{
        return {
            worker_uid : worker.uid,
            ym : ym,
            factory_uids: factories.map((factory: Factory)=>factory.uid)
        }
    })
}
