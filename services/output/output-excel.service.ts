import XLSX, { WorkBook, WorkSheet } from "xlsx";
import { formatDate } from "../utils/utils.service";
import { WorkerReport } from "../../models/worker-report/worker-report";
import { Factory } from "../../models/factory/factory";
import { Worker } from "../../models/worker/worker";
const COL_ARRAY = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];

const DATE_COL = 1;           //日付表示列
const DATA_WORKING_TIME_COL_INDEX = 0;
const DATA_OVER_WORKING_TIME_COL_INDEX = 1;
const DATA_NIGHT_WORKING_TIME_COL_INDEX = 2;
const DATA_COST_FOOD_COL_INDEX = 3;
const DATA_HOLIDAY_WORKINGFLG_COL_INDEX = 4;
const DATA_NODE_COL_INDEX=5;
const DATE_START_ROW = 5;     //日付開始行
const FACTORY_NAME_ROW = 3   //現場名
const DATA_TITLE_ROW = 4      //従業員の各出力情報列タイトル表示行
const DATA_START_COL = 2;     //従業員情報出力開始列
const DATA_COL_COUNT = 6;   //出力する1人あたりの従業員の情報列数

/*
*   XLSXのWorkBook, WorkSheetはjson形式のデータ
*   XLSX.writeもしくはXLSX.writeFileでデータをxlsx形式にコンバートしている
*   
*
*/

/**
 * 従業員月報を取得
 * @param worker 
 * @param factories 
 * @param dates 
 */
export function createWorkerFactoriesReportOuput(worker:Worker, factories: Factory[], dates: Date[]):WorkBook {
    var workBook = XLSX.utils.book_new();
    factories.forEach(factory => {
        addWorkerFactoryReport(workBook, worker, factory, dates);
    });
    return workBook;
}

function addWorkerFactoryReport(workBook:WorkBook,worker: Worker, factory: Factory, dates: Date[]){
    var sheet = {}; var 
    colIndex = DATA_START_COL;
    addSheetHeader(sheet,worker,dates);
    addRowHeader(sheet,dates);
    addColumnHeaderFactoryNameToJson(sheet,factory,colIndex);
    addColumnHeaderFactoryInfoToJson(sheet, colIndex);
    setWorkerFactoryReportToSheet(sheet, worker, factory.uid, dates, colIndex);
    setWorkeReportSheetRef(sheet, dates); 
    addWorkerReportTotalToJson(sheet,dates,colIndex);
    XLSX.utils.book_append_sheet(workBook, sheet, factory.name);
}


function setWorkeReportSheetRef( sheet: WorkSheet,  dates: Date[]){
    var maxRow = getTotalRow(dates)+1;
    sheet["!ref"] = "A1:" + getCellID(maxRow, DATA_START_COL + DATA_COL_COUNT); //START_ROW+日数+合計行
}

function getTotalRow(dates: Date[]) {
    return DATE_START_ROW + dates.length + 1;
}

function setWorkerFactoryReportToSheet(sheet: WorkSheet, worker:Worker,factory_uid:string,dates: Date[],colIndex:number):WorkSheet{
    var rowIndex = DATE_START_ROW;
    dates.forEach(date=>{
        addDateToJson(sheet,date,rowIndex)
        var workerReport = worker.getWorkerReport(date,factory_uid);
        if(workerReport){
            addWorkerReportToJson(sheet, workerReport, rowIndex, colIndex);
        }else{
            addNoWorkerReportToJson(sheet, rowIndex, colIndex);
        }
        rowIndex++;
    })
    return sheet;
}



/**
 *  シート上部に記載する情報を追記
 * @param sheet 
 * @param team 
 * @param dates 
 * @param workers 
 */
function addSheetHeader(sheet: WorkSheet, worker:Worker,dates: Date[]): void {
    sheet[getCellID(1, 2)] = {
        v: formatDate(dates[0], "yyyy年MM月度")
    };
    sheet[getCellID(1, 4)] = {
        v: worker.getName()+" 勤務（業務）管理報告書"
    };
}

/**
 * 行ヘッダ 合計を カレンダー行の下に記載
 * @param sheet 
 * @param days 
 */
function addRowHeader(sheet: WorkSheet, dates:Date[]): void {
    var row = getTotalRow(dates);
    sheet[getCellID(row, DATE_COL)] = {
        t: 's',
        v: "合計",
        s: { alignment: { wrapText: true, vertical: 'center', horizontal: 'right' } }
    }
}


/**
 * 現場前をセット＆セル結合
 */
function addColumnHeaderFactoryNameToJson(sheet: WorkSheet, factory: Factory, colIndex: number) {
    if (!sheet["!merges"]) {
        sheet["!merges"] = [];
    }
    sheet[getCellID(FACTORY_NAME_ROW, colIndex)] = {
        t: 's',
        v: factory.name,
        s: { alignment: { horizontal: 'center' } }
    };

    //mergesに指定する列Indexは0から始まるので、-1する
    colIndex--;
    sheet["!merges"].push({
        s: {
            r: FACTORY_NAME_ROW - 1, //start index = 0
            c: colIndex
        },
        e: {
            r: FACTORY_NAME_ROW - 1,
            c: colIndex + DATA_COL_COUNT - 1
        }
    });
}

/**
 * 従業員の各データ項目のtitleをセット
 * @param sheet 
 * @param colIndex 
 */
function addColumnHeaderFactoryInfoToJson(sheet: WorkSheet, colIndex: number) {
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_WORKING_TIME_COL_INDEX)] = {
        t: 's',
        v: '出勤',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_OVER_WORKING_TIME_COL_INDEX)] = {
        t: 's',
        v: '残業',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_NIGHT_WORKING_TIME_COL_INDEX)] = {
        t: 's',
        v: '深残業',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_COST_FOOD_COL_INDEX)] = {
        t: 's',
        v: '弁当',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_HOLIDAY_WORKINGFLG_COL_INDEX)] = {
        t: 's',
        v: '休日出勤',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_NODE_COL_INDEX)] = {
        t: 's',
        v: '備考',
    };
}


function addDateToJson(sheet: WorkSheet, date:Date,rowIndex: number): void {
    sheet[getCellID(rowIndex, DATE_COL)] = {
        t:'d',
        v:date,
        z:"dd(aaa)"
    }
}

function addNoWorkerReportToJson(sheet: WorkSheet, rowIndex: number, colIndex: number): void {
    sheet[getCellID(rowIndex, colIndex + DATA_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, colIndex + DATA_OVER_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, colIndex + DATA_NIGHT_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, colIndex + DATA_HOLIDAY_WORKINGFLG_COL_INDEX)] = {
        t: 'n',
    };
    sheet[getCellID(rowIndex, colIndex + DATA_COST_FOOD_COL_INDEX)] = {
        t: 'n',
    };
    sheet[getCellID(rowIndex, colIndex + DATA_NODE_COL_INDEX)] = {
        t: 's',
    };
}

function addWorkerReportToJson(sheet: WorkSheet, workerReport: WorkerReport, rowIndex: number, colIndex: number): void {
    sheet[getCellID(rowIndex, colIndex + DATA_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        v: workerReport.working_time / 1440,
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, colIndex + DATA_OVER_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        v: workerReport.over_working_time / 1440,
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, colIndex + DATA_NIGHT_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        v: workerReport.night_working_time / 1440,
        z: "h:mm"
    };
    if (workerReport.holidayworkflg) {
        sheet[getCellID(rowIndex, colIndex + DATA_HOLIDAY_WORKINGFLG_COL_INDEX)] = {
            t: 'n',
            v: 1,
        };
    }
    sheet[getCellID(rowIndex, colIndex + DATA_COST_FOOD_COL_INDEX)] = {
        t: 'n',
        v: workerReport.cost_food,
    };
    sheet[getCellID(rowIndex, colIndex + DATA_NODE_COL_INDEX)] = {
        t: 's',
        v: workerReport.note,
    };
}


function addWorkerReportTotalToJson(sheet: WorkSheet ,dates: Date[], colIndex: number): void {
    var row = getTotalRow(dates);
    sheet[getCellID(row, colIndex + DATA_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        z: "[h]:mm",
        f: "SUM(" + getDateRange(dates.length, colIndex + DATA_WORKING_TIME_COL_INDEX)+")"
    };
    sheet[getCellID(row, colIndex + DATA_OVER_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        z: "[h]:mm",
        f: "SUM(" + getDateRange(dates.length, colIndex + DATA_OVER_WORKING_TIME_COL_INDEX) + ")"
    };
    sheet[getCellID(row, colIndex + DATA_NIGHT_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        z: "[h]:mm",
        f: "SUM(" + getDateRange(dates.length, colIndex + DATA_NIGHT_WORKING_TIME_COL_INDEX) + ")"
    };
    sheet[getCellID(row, colIndex + DATA_HOLIDAY_WORKINGFLG_COL_INDEX)] = {
        t: 'n',
        f: "COUNTIF(" + getDateRange(dates.length, colIndex + DATA_HOLIDAY_WORKINGFLG_COL_INDEX) + ",1)"
    };
    sheet[getCellID(row, colIndex + DATA_COST_FOOD_COL_INDEX)] = {
        t: 'n',
        f: "SUM(" + getDateRange(dates.length, colIndex + DATA_COST_FOOD_COL_INDEX) + ")"
    };
}

function getDateRange(days:number,colIndex:number):string{
    return getCellID(DATE_START_ROW, colIndex)+":"+getCellID(DATE_START_ROW+days-1,colIndex);
}

/**
 * 数字で渡されるrowIndexとcolIndexをエクセルの範囲形式(A1やC6など)に変換する
 * @param rowIndex 行番号(1から)
 * @param colIndex  列番号(1から)
 */
export function getCellID(rowIndex: number, colIndex: number): string {
    var index = colIndex - 1;
    var retValue = COL_ARRAY[index % COL_ARRAY.length];
    index = Math.floor(index / COL_ARRAY.length);
    while (index > 0) {
        var new_index = index % COL_ARRAY.length;
        index = Math.floor(index / COL_ARRAY.length);
        if (index === 0) {
            new_index--;
        }
        retValue = COL_ARRAY[new_index] + retValue;
    }
    return retValue + rowIndex;
}

