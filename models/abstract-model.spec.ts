import { plainToClass } from 'class-transformer';
import { AbstractModel } from './abstract-model';


describe('Abstract Model', () => {
    it('generateID check', () => {
        let model : AbstractModel  = new AbstractModel();
        model.generateUid();
        expect(model.newflg).toBe(true);
        expect(model.uid).toHaveLength(32);
    })
});

