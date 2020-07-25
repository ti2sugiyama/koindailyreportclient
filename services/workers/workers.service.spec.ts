
import { getWorkers, getWorkerFatories } from "./workers.service";
import axios, { AxiosError } from 'axios';
import { WorkerSampledata } from "../../models/worker/worker_sampledata";
import {WorkerFactorySampledata} from "./worker-factory_sampledata";
import { plainToClass } from "class-transformer";
import { Worker } from "../../models/worker/worker";
import { APIAccessError } from "../../error/api-access.error";
jest.mock('axios');

function successWithDelay(retValue:{}, delay:number):Promise<any>{
    return new Promise((success, fail) => setTimeout(success(), delay)).then(
        () => {return retValue;}
    );
}

describe('WorkersService  getService', () => {
    afterEach(() => jest.restoreAllMocks());

    it('success', done => {
        (axios.get as any).mockResolvedValue(
            successWithDelay({ data: WorkerSampledata }, 1000)
        );
        var sub = getWorkers().subscribe(response=>{
            let workers = plainToClass(Worker, WorkerSampledata);
            expect(response).toEqual(workers);
        },()=>{
        },() => done()
        );
    }),

    it('error', done => {
        (axios.get as any).mockRejectedValue(new Error("error") as AxiosError, 1000);
        var sub = getWorkers().subscribe(resonse=>{
        },error=>{
            expect(error).toBeInstanceOf(APIAccessError);
            done();
        },()=>{
        });
    })
});

describe('WorkersService  getWorkerFactories', () => {
    afterEach(() => jest.restoreAllMocks());
    let workers = plainToClass(Worker, WorkerSampledata);
    it('success', done => {
        (axios.get as any).mockResolvedValue(
            successWithDelay({ data: WorkerFactorySampledata(workers,new Date()) }, 1000)
        );
        var sub = getWorkerFatories('tmp').subscribe(response => {
            expect(response).toEqual(WorkerFactorySampledata(workers, new Date()));
        }, () => {
        }, () => done()
        );
    }),

    it('error', done => {
        (axios.get as any).mockRejectedValue(new Error("error") as AxiosError, 1000);
        var sub = getWorkerFatories('tmp').subscribe(response => {
        }, error => {
            expect(error).toBeInstanceOf(APIAccessError);
            done();
        }, () => {
        });
    })
});

