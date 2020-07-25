
import { getFactories } from "./factories.service";
import axios from 'axios';
import { FactorySampledata } from "../../models/factory/factory_sampledata";
import { plainToClass } from "class-transformer";
import { Factory } from "../../models/factory/factory";
jest.mock('axios');

function successWithDelay(retValue:{}, delay:number):Promise<any>{
    return new Promise((success, fail) => setTimeout(success(), delay)).then(
        () => {return retValue;}
    );
}

describe('FactoriesService  getService', () => {
    (axios.get as any).mockResolvedValue(
        successWithDelay({ data: FactorySampledata }, 1000)
    );

    it('success', done => {
        var sub = getFactories().subscribe(response=>{
            let factories = plainToClass(Factory, FactorySampledata);
            expect(response).toEqual(factories);
            done();
        });
    })
});
