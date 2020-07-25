import { Worker,WorkerFactoryInterface } from "../worker/worker";
import { Factory } from "./factory";

export const FactorySampledata =  [{
    company_uid:"ikara",
    uid : "honsha",
    name: "本社"
},{
    company_uid:'ikara',
    uid : "tomi",
    name: "富沢"
}, {
    company_uid: 'ikara',
    uid: "uehara",
    name:"上原"
}, {
    company_uid: 'ikara',
    uid: "kisarazu",
    name: "木更津"
}
];

export function createSampleWorkerFactoy(worker:Worker,targetMonth:Date,factories:Factory[]):WorkerFactoryInterface[]{
    var ym = Worker.ymdToYM(targetMonth);

    var factory_uids: string[] = [];
    factories.forEach(factory=>{
        factory_uids.push(factory.uid);
    })
    return [{
        worker_uid: worker.uid,
        ym   : ym,
        factory_uids: factory_uids
    }];
}