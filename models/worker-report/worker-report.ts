import "reflect-metadata";
import { AbstractModel} from '../abstract-model';
import { formatDate } from '../../services/utils/utils.service'; 
import { Type } from 'class-transformer';

export class WorkerReport extends AbstractModel {

    worker_uid: string = "";
    factory_uid: string = "";

    @Type(() => Date)
    ymd: Date;

    working_time:number=0;
    over_working_time=0;
    night_working_time=0;
    holidayworkflg=false;
    cost_food=0;
    note:string="";

    public constructor(uid?: string, company_uid?: string, worker_uid?: string,ymd?:Date,factory_uid?:string, generate_flg=false){
        super(uid,company_uid);
        if(worker_uid){
            this.worker_uid=worker_uid;
        }
        if(ymd){
            this.ymd = ymd;
        }else{
            this.ymd = new Date();
        }
        if(factory_uid){
            this.factory_uid = factory_uid;
        }

        if(generate_flg){
            this.generateUid();
        }
    }

    public getYMDString():string{
        return formatDate(this.ymd);
    }
}

