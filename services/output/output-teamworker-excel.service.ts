import XLSX, { WorkBook, WorkSheet } from "xlsx";
import { formatDate } from "../utils/utils.service";
import { Worker, Amount } from "../../models/worker/worker";
import { Team } from "../../models/team/team";
import { getCellID } from "./output-excel.service";

const DATE_COL=1;           //日付表示列
const DATA_WORKING_TIME_COL_INDEX = 0;
const DATA_OVER_WORKING_TIME_COL_INDEX = 1;
const DATA_NIGHT_WORKING_TIME_COL_INDEX = 2;
const DATA_COST_FOOD_COL_INDEX = 3;
const DATA_HOLIDAY_WORKINGFLG_COL_INDEX=4;
const DATE_START_ROW=5;     //日付開始行
const WORKER_NAME_ROW = 3   //１シートに複数の従業員を出力する際の従業員名表示行
const DATA_TITLE_ROW=4      //従業員の各出力情報列タイトル表示行
const DATA_START_COL=2;     //従業員情報出力開始列
const DATA_COL_COUNT = 5;   //出力する1人あたりの従業員の情報列数

const TOTAL_WORKING_TIME_ROW_INDEX = 0;
const TOTAL_OVER_WORKING_TIME_ROW_INDEX = 1;
const TOTAL_NIGHT_WORKING_TIME_ROW_INDEX = 2;
const TOTAL_COST_FOOD_ROW_INDEX = 3;
const TOTAL_DATA_ROW_COUNT = 4;
const TOTAL_DATA_COL = 4;

/**
 * チームごとの従業員月報を取得
 * @param team 
 * @param workers 
 * @param dates 
 */
export function createTeamWorkerReportOuput(team: Team, workers: Worker[], dates: Date[]): WorkBook|undefined {
    var workBook = XLSX.utils.book_new();
    workers.forEach(worker=>{
        if(worker.inTeam(team.uid)){
            addTeamWorkerReport(workBook,team,worker,dates);
        }
    });
    if(workBook.SheetNames && workBook.SheetNames.length>0){
        return workBook;
    }else{
        return undefined;
    }
}

/**
 * 従業員月報をシートに書き出す
 * @param workBook 
 * @param team 
 * @param worker 
 * @param dates 
 */
function addTeamWorkerReport(workBook: WorkBook, team:Team, worker: Worker, dates: Date[]) {
    var sheet = {};
    var colIndex = DATA_START_COL;
    addSheetHeader(sheet,team,dates,[worker]);
    addRowHeader(sheet, dates);
    addColumnHeaderWorkerNameToJson(sheet, worker, colIndex);
    addColumnHeaderWorkerInfoToJson(sheet, colIndex);
    setTeamWorkerReportToSheet(sheet,worker,dates);
    setWorkeReportSheetRef(sheet, 1, dates,false); 
    addWorkerReportTotalToJson(sheet, dates, colIndex);
    XLSX.utils.book_append_sheet(workBook, sheet, worker.getName());
}

/**
 * 従業員の勤務データをシートに書き出す
 * @param sheet 
 * @param worker 
 * @param dates 
 */
function setTeamWorkerReportToSheet(sheet: WorkSheet,  worker: Worker, dates: Date[]): WorkSheet {
    var rowIndex = DATE_START_ROW;
    dates.forEach(date => {
        addDateToJson(sheet, date, rowIndex);
        var amount:Amount = worker.getAmount([date]);
        addAmountWorkerReportToJson(sheet, amount, rowIndex, DATA_START_COL);
        rowIndex++;
    })
    return sheet;
}

/**
 *
 * チームごとの従業員月報を1シートにまとめて取得
 * @param team 
 * @param workers 
 * @param dates 
 */
export function createTeamWorkerReportOneSheetOuput(teams: Team[], workers: Worker[], dates: Date[]): WorkBook | undefined {
    var workBook = XLSX.utils.book_new();

    teams.forEach(team=>{
        var teamWorkers : Worker[] = workers.filter(worker=>worker.inTeam(team.uid));
        addTeamWorkerReportOneSheet(workBook, team, teamWorkers, dates);
    })
    
    if (workBook.SheetNames && workBook.SheetNames.length > 0) {
        return workBook;
    } else {
        return undefined;
    }
}
/**
 * チーム全従業員の月報をシートに書き出す
 * @param workBook 
 * @param team 
 * @param workers 
 * @param dates 
 */
function addTeamWorkerReportOneSheet(workBook: WorkBook, team: Team, workers: Worker[], dates: Date[]) {
    var sheet = {};
    var colIndex = DATA_START_COL;
    addSheetHeader(sheet, team, dates,workers);
    setTeamWorkerReportToOneSheet(sheet, workers, dates);
    addRowHeader(sheet, dates);
    //ColHeaderとColFooter(合計)を人数分繰り返す
    workers.forEach(worker=>{
        addColumnHeaderWorkerInfoToJson(sheet, colIndex);
        addColumnHeaderWorkerNameToJson(sheet,worker,colIndex);
        addWorkerReportTotalToJson(sheet, dates, colIndex);
        colIndex += DATA_COL_COUNT;
    });
    addSheetFooter(sheet, dates, workers);
    setWorkeReportSheetRef(sheet, workers.length, dates,true); 
    XLSX.utils.book_append_sheet(workBook, sheet, team.name);
}

/**
 * 従業員の勤務情報をシートに書き出す
 * @param sheet 
 * @param workers 
 * @param dates 
 */
function setTeamWorkerReportToOneSheet(sheet: WorkSheet, workers: Worker[], dates: Date[]): WorkSheet {
    var rowIndex = DATE_START_ROW;
    dates.forEach(date => {
        addDateToJson(sheet, date, rowIndex);
        var colIndex = DATA_START_COL;
        workers.forEach(worker=>{
            var amount: Amount = worker.getAmount([date]);
            addAmountWorkerReportToJson(sheet, amount, rowIndex,colIndex);
            colIndex+=DATA_COL_COUNT;
        });
        rowIndex++;
    })
    return sheet;
}


/**
 * xlsx形式に変換するセル範囲を設定する
 * @param sheet 
 * @param workersCnt 
 * @param dates 
 */
function setWorkeReportSheetRef( sheet: WorkSheet, workersCnt:number, dates: Date[],hasTotalSum:boolean){
    //START_ROW+日数+合計行
    //日付列+従業員*従業員情報+備考
    var maxRow = getMaxRow(dates, hasTotalSum);

    sheet["!ref"] = "A1:" + getCellID(maxRow, DATA_START_COL + DATA_COL_COUNT * workersCnt); 
}

/**
 * 従業員の各データ項目のtitleをセット
 * @param sheet 
 * @param colIndex 
 */
function addColumnHeaderWorkerInfoToJson(sheet:WorkSheet,colIndex:number){
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_WORKING_TIME_COL_INDEX )]={
        t:'s',
        v:'出勤',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_OVER_WORKING_TIME_COL_INDEX)] = {
        t: 's',
        v: '残業',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_NIGHT_WORKING_TIME_COL_INDEX )] = {
        t: 's',
        v: '深残業',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex + DATA_COST_FOOD_COL_INDEX)] = {
        t: 's',
        v: '弁当',
    };
    sheet[getCellID(DATA_TITLE_ROW, colIndex +  DATA_HOLIDAY_WORKINGFLG_COL_INDEX )] = {
        t: 's',
        v: '休日出勤',
    };
}

/**
 * 従業員の名前をセット＆セル結合
 */
function addColumnHeaderWorkerNameToJson(sheet:WorkSheet,worker:Worker,colIndex:number){
    if (!sheet["!merges"]){
        sheet["!merges"] = [];
    }
    sheet[getCellID(WORKER_NAME_ROW, colIndex)] = {
        t: 's',
        v: worker.getName(),
        s: { alignment: { horizontal: 'center' } }
    };

    //mergesに指定する列Indexは0から始まるので、-1する
    colIndex--;
    sheet["!merges"].push({
        s:{
            r: WORKER_NAME_ROW-1, //start index = 0
            c: colIndex 
        },
        e:{
            r:WORKER_NAME_ROW-1,
            c: colIndex + DATA_COL_COUNT -1
        }
    });
}

/**
 * カレンダーを行頭に展開する
 * @param sheet 
 * @param date 
 * @param rowIndex 
 */
function addDateToJson(sheet: WorkSheet, date:Date,rowIndex: number): void {
    sheet[getCellID(rowIndex, DATE_COL)] = {
        t:'d',
        //xlsxへの変換をXLSXで行うのであれば、そのままdateを入れて良い。        
        v:date,
        //XLSXStyleを使用する場合は標準時にする必要あり
//        v:new Date(date.getFullYear(),date.getMonth(),date.getDate(),date.getHours(),date.getMinutes()-date.getTimezoneOffset(),0,0),
        z:"dd(aaa)"
    }
}


/**
 * 従業員の勤務情報(全現場を集計)をセルに書き出す
 * @param sheet 
 * @param amont 
 * @param rowIndex 
 * @param colIndex 
 */
function addAmountWorkerReportToJson(sheet:WorkSheet,amont:Amount,rowIndex:number,colIndex:number):void{
    sheet[getCellID(rowIndex, colIndex + DATA_WORKING_TIME_COL_INDEX)] = {
        t : 'n',
        v: amont.working_time / 1440,
        z:"h:mm"
    };
    sheet[getCellID(rowIndex, colIndex + DATA_OVER_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        v: amont.over_working_time / 1440,
        z: "h:mm"
    };
    sheet[getCellID(rowIndex, colIndex + DATA_NIGHT_WORKING_TIME_COL_INDEX)] = {
        t: 'n',
        v: amont.night_working_time / 1440,
        z: "h:mm"
    };
    if (amont.holidaywork_cnt>0){
        sheet[getCellID(rowIndex, colIndex + DATA_HOLIDAY_WORKINGFLG_COL_INDEX)] = {
            t: 'n',
            v: amont.holidaywork_cnt,
        };
    }
    sheet[getCellID(rowIndex, colIndex + DATA_COST_FOOD_COL_INDEX)] = {
        t: 'n',
        v: amont.cost_food,
    };
}


/**
 *  シート上部に記載する情報を追記
 * @param sheet 
 * @param team 
 * @param dates 
 * @param workers 
 */
function addSheetHeader(sheet: WorkSheet,team:Team,dates:Date[],workers:Worker[]): void {
    sheet[getCellID(1, 2)] ={
        v: formatDate(dates[0], "yyyy年MM月度")
    };
    sheet[getCellID(1, 4)] = {
        v: "勤務（業務）管理報告書"
    };
    sheet[getCellID(2, DATA_START_COL + (workers.length * DATA_COL_COUNT))]={
        v:team.name
    };
    var bikoCol = DATA_START_COL + (workers.length * DATA_COL_COUNT);
    sheet[getCellID(WORKER_NAME_ROW, bikoCol)] = {
        v:"備考"
    };

    if (!sheet["!merges"]) {
        sheet["!merges"] = [];
    }

    //備考のセルをマージする
    sheet["!merges"].push({
        s: {
            r: WORKER_NAME_ROW - 1, //start index = 0
            c: bikoCol - 1
        },
        e: {
            r: WORKER_NAME_ROW ,
            c: bikoCol- 1
        }
    });
}



/**
 * 行ヘッダ 合計を カレンダー行の下に記載
 * @param sheet 
 * @param days 
 */
function addRowHeader(sheet: WorkSheet, date:Date[]): void {
    var row = getTotalRow(date);
    sheet[getCellID(row, DATE_COL)] = {
            t: 's',
            v:"合計",
            s: { alignment: { wrapText: true, vertical: 'center', horizontal: 'right' } }
    }
}

/**
 * 各列の集計関数を書き込む
 * @param sheet 
 * @param days 
 * @param colIndex 
 */
function addWorkerReportTotalToJson(sheet: WorkSheet,  dates:Date[],colIndex:number): void {
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
        f: "SUM(" + getDateRange(dates.length, colIndex +DATA_COST_FOOD_COL_INDEX) + ")"
    };
}


/**
 * 合計行の行番号を取得
 * @param dates  
 */
function getTotalRow(dates:Date[]){
    return DATE_START_ROW + dates.length+1;
}

function getMaxRow(dates:Date[],hasTotalSum:boolean):number{
    if(hasTotalSum){
        return getTotalRow(dates) + TOTAL_DATA_ROW_COUNT+1;
    }else{
       return getTotalRow(dates);
    }
}
/**
 *  シート下部に記載する情報を追記
 * @param sheet 
 * @param team 
 * @param dates 
 * @param workers 
 */
function addSheetFooter(sheet: WorkSheet, dates: Date[], workers: Worker[]): void {

    var sumWorkingTimeTarget:string="";
    var sumOverWorkingTimeTarget:string="";
    var sumNightWorkingTimeTarget:string="";
    var sumCostFoodTarget:string="";

    var totalRow = getTotalRow(dates);

    workers.forEach((worker,index)=>{
        sumWorkingTimeTarget += getCellID(totalRow, DATA_START_COL + DATA_COL_COUNT * index + DATA_WORKING_TIME_COL_INDEX) +"+";
        sumOverWorkingTimeTarget += getCellID(totalRow, DATA_START_COL + DATA_COL_COUNT * index + DATA_OVER_WORKING_TIME_COL_INDEX) + "+";
        sumNightWorkingTimeTarget += getCellID(totalRow, DATA_START_COL + DATA_COL_COUNT * index + DATA_NIGHT_WORKING_TIME_COL_INDEX) + "+";
        sumCostFoodTarget += getCellID(totalRow, DATA_START_COL + DATA_COL_COUNT * index + DATA_COST_FOOD_COL_INDEX) + "+";
    })

    var row = totalRow + 2;
    sheet[getCellID(row + TOTAL_WORKING_TIME_ROW_INDEX, TOTAL_DATA_COL)] = {
        v: "工数計"
    };
    sheet[getCellID(row + TOTAL_WORKING_TIME_ROW_INDEX, TOTAL_DATA_COL + 1)] = {
        t: 'n',
        z: "[h]:mm",
        f: sumWorkingTimeTarget.substring(0, sumWorkingTimeTarget.length - 1)
    };
    sheet[getCellID(row + TOTAL_OVER_WORKING_TIME_ROW_INDEX, TOTAL_DATA_COL)] = {
        v: "残業計"
    };
    sheet[getCellID(row + TOTAL_OVER_WORKING_TIME_ROW_INDEX, TOTAL_DATA_COL + 1)] = {
        t: 'n',
        z: "[h]:mm",
        f: sumOverWorkingTimeTarget.substring(0, sumOverWorkingTimeTarget.length - 1)
    };
    sheet[getCellID(row + TOTAL_NIGHT_WORKING_TIME_ROW_INDEX, TOTAL_DATA_COL)] = {
        v: "深残業計"
    };
    sheet[getCellID(row + TOTAL_NIGHT_WORKING_TIME_ROW_INDEX, TOTAL_DATA_COL + 1)] = {
        t: 'n',
        z: "[h]:mm",
        f: sumNightWorkingTimeTarget.substring(0, sumNightWorkingTimeTarget.length - 1)
    };
    sheet[getCellID(row + TOTAL_COST_FOOD_ROW_INDEX, TOTAL_DATA_COL)] = {
        v: "弁当計"
    };
    sheet[getCellID(row + TOTAL_COST_FOOD_ROW_INDEX, TOTAL_DATA_COL + 1)] = {
        t: 'n',
        f: sumCostFoodTarget.substring(0, sumCostFoodTarget.length - 1)
    };
}


/**
 * 1日から月末までの範囲を表す文字列を返す。集計のSUM範囲指定するときに使用する
 * @param days 
 * @param colIndex 
 */
function getDateRange(days:number,colIndex:number):string{
    return getCellID(DATE_START_ROW, colIndex)+":"+getCellID(DATE_START_ROW+days-1,colIndex);
}