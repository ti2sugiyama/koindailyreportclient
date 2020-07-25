import { Factory } from './factory';
import { plainToClass } from 'class-transformer';
import { FactorySampledata} from './factory_sampledata';

describe('Factory', () => {
    it('should create an instance', () => {
        let factory: Factory[] = plainToClass(Factory, FactorySampledata);
        expect(factory[0].company_uid).toBe("ikara"); 
        expect(factory[0].uid).toBe("honsha");
        expect(factory[0].name).toBe("本社");
        expect(factory[1].company_uid).toBe("ikara");
        expect(factory[1].uid).toBe("tomi");
        expect(factory[1].name).toBe("富沢");
    })
});

