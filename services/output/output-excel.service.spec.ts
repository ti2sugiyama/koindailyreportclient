
import { FactorySampledata } from "../../models/factory/factory_sampledata";
import { plainToClass } from "class-transformer";
import { getCellID } from "./output-excel.service";
const COL_ARRAY = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];


describe('OutputExcelService  getCellID', () => {
    it('success', () => {
        expect(getCellID(1, 1)).toEqual("A1");
        expect(getCellID(1, 26)).toEqual("Z1");
        expect(getCellID(1, 27)).toEqual("AA1");
        expect(getCellID(1, 52)).toEqual("AZ1");
        expect(getCellID(1, 53)).toEqual("BA1");
    })
});
