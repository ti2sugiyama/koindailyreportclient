import { IllegalValueError } from "../../error/illegal-value.error";

export function formatDate(date: Date, format="yyyyMMdd") {
    format = format.replace(/yyyy/g, date.getFullYear() + "");
    format = format.replace(/MM/g, ('0' + (date.getMonth() + 1)).slice(-2));
    format = format.replace(/dd/g, ('0' + date.getDate()).slice(-2));
    format = format.replace(/M/g, (date.getMonth() + 1) + "");
    format = format.replace(/d/g, (date.getDate() + ""));
    format = format.replace(/hh/g, ('0' + date.getHours()).slice(-2));
    format = format.replace(/mm/g, ('0' + date.getMinutes()).slice(-2));
    format = format.replace(/ss/g, ('0' + date.getSeconds()).slice(-2));
    format = format.replace(/SSS/g, ('00' + date.getMilliseconds()).slice(-3));
    format = format.replace(/aaaa/g, (['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])[date.getDay()]);
    format = format.replace(/aaa/g, (['日', '月', '火', '水', '木', '金', '土'])[date.getDay()]);
    return format;
};


/**
 * 分を HH:MM形式に変換する
 * @param minutes 分
 * @return HH:MM
 */
export function getHHMMFromMinutes(minutes: number,hiddenZero=false): string {
    if(hiddenZero && !minutes){
        return "";
    }

    return Math.floor(minutes / 60) +":"+ ("0" + (minutes % 60)).slice(-2);
}
/**
 * HHMM形式を分に変換する
 * @param HHMM HH:MM形式の文字列
 */
export function getMinutesFromHHMM(HHMM: string) {
    let tmp:string[] = HHMM.split(":");
    try{
        if(tmp.length==1){
            return changeNumber(tmp[0]) * 60;
        }
        return changeNumber(tmp[0]) * 60 + changeNumber(tmp[1]);
    }catch(e){
        throw new IllegalValueError(HHMM + " must be HH:MM style");
    }
}

function changeNumber(v:string){
    let retValue = Number(v);
    if (isNaN(retValue)) {
        throw new IllegalValueError("must be number");
    }
    return retValue;
}

export function createDaysAMonth(targetDate: Date): Date[] {
    //次の月の0日,つまり今月の末日
    let max_days = new Date(targetDate.getFullYear(), targetDate.getMonth()+1, 0).getDate();
    //length長の配列が作られる(そのままだと値がundefinded)+callbackのmapで新たにDateの配列を返す
    return Array.from({ length: max_days }, (v, index: number) =>new Date(targetDate.getFullYear(), targetDate.getMonth(),index+1));
};

export function getStringToSortValue(data:string):number{
    var cnt = 0;
    for(let i = 0; i < data.length; i++){
        cnt += data.charCodeAt(i);
    }
    return cnt;
}

export function stringToArrayBuffer(s: string): ArrayBuffer {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i = 0; i != s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
}