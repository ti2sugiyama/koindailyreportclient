import { formatDate, createDaysAMonth, getHHMMFromMinutes, getMinutesFromHHMM, getStringToSortValue } from "./utils.service";
import { IllegalValueError } from "../../error/illegal-value.error";


describe('FormatDate function check', () => {
    it('date format check', () => {
        let d = new Date(2020,3,20,15,10,8);
        let s = formatDate(d,"yyyy-MM-dd hh:mm:ss[aaa]");
        expect(s).toBe("2020-04-20 15:10:08[月]");
    })
});


describe('createDateAMonth Check', () => {
    it('check has 31 days', () => {
        let d:Date = new Date(2020, 0, 1);
        let dates:Date[] = createDaysAMonth(d);
        expect(dates.length).toBe(31);
        dates.forEach(date=>{
            expect(d).toEqual(date);
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        });
    }),
    it('check has 30 days', () => {
        let d: Date = new Date(2020, 5, 1);
        let dates: Date[] = createDaysAMonth(d);
        expect(dates.length).toBe(30);
        dates.forEach(date => {
            expect(d).toEqual(date);
            d = new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);
        });
    }),
    it('check has 29 days', () => {
        let d: Date = new Date(2020, 1, 1);
        let dates: Date[] = createDaysAMonth(d);
        expect(dates.length).toBe(29);
        dates.forEach(date => {
            expect(d).toEqual(date);
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        });
    }),
    it('check has 28 days', () => {
        let d: Date = new Date(2019, 1, 1);
        let dates: Date[] = createDaysAMonth(d);
        expect(dates.length).toBe(28);
        dates.forEach(date => {
            expect(d).toEqual(date);
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        });
    });
});
describe('getHHMM function Check', () => {
    it('check minutes to HH:MM', () => {
        expect(getHHMMFromMinutes(660)).toBe("11:00");
        expect(getHHMMFromMinutes(3)).toBe("0:03");
        expect(getHHMMFromMinutes(92)).toBe("1:32");
        expect(getHHMMFromMinutes(3185)).toBe("53:05");
    })
});

describe('getMinutes function Check', () => {
    it('check HH:MM to minutes', () => {
        expect(getMinutesFromHHMM("11:00")).toBe(660);
        expect(getMinutesFromHHMM("0:03")).toBe(3);
        expect(getMinutesFromHHMM("1:32")).toBe(92);
        expect(getMinutesFromHHMM("53:05")).toBe(3185);
    }),
    it('check HH:MM to minutes', () => {
        expect(()=>getMinutesFromHHMM("11;00")).toThrow(IllegalValueError)
        expect(() => getMinutesFromHHMM("aa")).toThrow(IllegalValueError);
    })
});

describe('getStringToSortValue Check',()=>{
    it('check',()=>{
        expect(getStringToSortValue("abcde19469")).toBe(764);
        expect(getStringToSortValue("z")).toBe(122);
        expect(getStringToSortValue("Z")).toBe(90);
    })
});
