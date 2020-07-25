import React, { useRef, useState, useEffect } from 'react'
import { Worker, Amount } from '../../../models/worker/worker';
import { formatDate } from '../../../services/utils/utils.service';
import { WorkerReport } from '../../../models/worker-report/worker-report';
import './report-table.scss';
import { EventEmitter } from 'events';
import { getHHMMFromMinutes,getMinutesFromHHMM} from '../../../services/utils/utils.service'
import { Factory } from '../../../models/factory/factory';

export interface TableSize {
  width: number,
  height: number
}

function RowColHeader(){
  return (
    <div className="row-col-header">
          日付
    </div>
  )
}

/**
 * 上部に表示する列ヘッダ
 * @param
 */
function ColHeader({ factories, changeableFactories, onChangeFactory,onDeleteFactory, syncScrollEvent, tableSize}
  : { factories: Factory[], changeableFactories: Factory[], onChangeFactory: (old_uid: string, new_uid: string) => void, onDeleteFactory: (uid: string) => void, syncScrollEvent: EventEmitter, tableSize:TableSize }) {
  const headerContent = useRef<HTMLDivElement>(null);
  //メインコンテンツのスクロールと同期する
  //メインコンテンツがスクロールするとsyncScrollEventが発火する
  useEffect(()=>{
    const callBack = (data:any) => {
      headerContent.current?.scrollTo(data.left, headerContent.current?.scrollTop);
    };
    syncScrollEvent.on('scroll', callBack);
    //書き換えのときに実行される関数を返す。イベントを一旦外さないとリスナーが大量に登録される
    return ()=>{syncScrollEvent.off('scroll', callBack)};
  });

  var changeFactory = (event: React.ChangeEvent<HTMLSelectElement>)=>{
    var old_uid = event.currentTarget.getAttribute('data-old_uid');
    if(!old_uid){
      old_uid="undefined";
    }
    onChangeFactory(old_uid, event.target.value);
  }

  return (
    <div className="thead col-header" ref={headerContent} style={{ width: tableSize.width }}>
      <div className="col-header1">
        {factories.map((factory, factory_index) => {
          return (
            <div key={factory_index} className={`col-group ${factory.uid}`}>
              <div className="row">
                <div className="col-sm-9">
                  <select className="custom-select factory-name" data-old_uid={factory.uid} value={factory.uid} onChange={changeFactory}>
                    <option value={factory.uid}>{factory.name}</option>
                    {
                        changeableFactories.map((changeableFactory, chageable_factory_index) => {
                          return <option key={chageable_factory_index} value={changeableFactory.uid}>{changeableFactory.name}</option>
                      })
                    }
                  </select>
                </div>
                <div className="col-sm-3 btn-delete align-left" onClick={() => onDeleteFactory(factory.uid)}>
                    <i className="fas fa-times"></i>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="col-header2">
        {factories.map((factory, factory_index) => {
          return (
            <div key={factory_index} className={`col-group ${factory.uid}`}>
              <div className="working-time">
                <span>出勤</span>
              </div>
              <div className="over-working-time">
                <span>残業</span>
              </div>
              <div className="night-working-time">
                <span>深残業</span>
              </div>
              <div className="holidaywork">
                <span>休出</span>
              </div>
              <div className="cost-food">
                <span>弁当</span>
              </div>
              <div className="note">
                <span>備考</span>
              </div>
            </div>
          )
        })}
        <div className="horizontalscroll-margin">
        </div>
      </div>
    </div>
  )
}

/**
 * 左側に表示する行ヘッダ
 * 
 * @param param0 
 */
function RowHeader({ targetDates, syncScrollEvent,tableSize }: { targetDates: Date[] , syncScrollEvent: EventEmitter, tableSize:TableSize }){
  const headerContent = useRef<HTMLDivElement>(null);

  //メインコンテンツのスクロールと同期する
  //メインコンテンツがスクロールするとsyncScrollEventが発火する
  useEffect(()=>{
    const callBack = (data:any) => {
      headerContent.current?.scrollTo(headerContent.current?.scrollTop, data.top);
    };
    syncScrollEvent.on('scroll', callBack);
    //戻り値の関数は書き換えのときに実行される。イベントを一旦外さないとリスナーが大量に登録される
    return ()=>{syncScrollEvent.off('scroll', callBack)};
  });  

  return (
    <div className="thead row-header" ref={headerContent} style={{ height: tableSize.height}}>
      {targetDates.map((date,date_index)=>{
        return (
          <div key={date_index} className={`row-date ${formatDate(date)}  ${formatDate(date, "aaaa")}`}>
            <div className="row-header1">
              {formatDate(date,"d")}
            </div>
            <div className="row-header2">
              {formatDate(date, "aaa")}
            </div>
          </div>
        )
      })}
      <div className="verticalscroll-margin">
      </div>
    </div>
  )
}

function RowColFooter() {
  return (
    <div className="row-col-footer">
      合計
    </div>
  )
}

/** footerに表示するデータ */
interface AmountData {
  factory_uid: string,
  amount: Amount
}

/** 作業員の合計計算 */
function calcAmount(targetDates: Date[], worker: Worker, factory_uid: string): AmountData {
  return {
    factory_uid: factory_uid,
    amount: worker.getAmount(targetDates,factory_uid)
  }as AmountData;
}

/** 全ての場所でそれぞれ合計計算 */
function getAmounts(targetDates: Date[], worker: Worker,factories:Factory[]): AmountData[] {
  return factories.map(factory=>
    calcAmount(targetDates, worker,factory.uid,)
  )
}

/**
 * 下部に表示するFooter
 * @param param0 
 */
function ColFooter({ targetDates, worker,factories, syncScrollEvent, chengeDataEvent,tableSize }
  : { targetDates: Date[], worker: Worker, factories: Factory[], syncScrollEvent: EventEmitter, chengeDataEvent: EventEmitter, tableSize: TableSize}) {
  const footerContent = useRef<HTMLDivElement>(null);

  //スクロールイベント登録
  useEffect(() => {
    const callBack = (data: any) => {
      footerContent.current?.scrollTo(data.left, footerContent.current?.scrollTop);
    };
    syncScrollEvent.on('scroll', callBack);
    //戻り値の関数は書き換えのときに実行される。イベントを一旦外さないとリスナーが大量に登録される
    return () => { syncScrollEvent.off('scroll', callBack);};
  });
  
  //セルデータ変更イベント登録
  useEffect(()=>{
    const callback = (data: any) => {
      amounts.forEach((amount, index) => {
        //変更があった現場のみ合計を計算する
        if (amount.factory_uid === data.factory_uid) {
          //各データの配列を新たに作って変更する
          let newShowAmounts = showAmounts.slice();
          newShowAmounts[index] = calcAmount(targetDates, worker, amount.factory_uid);
          changeAmount(newShowAmounts);
          return;
        }
      })
    };
    //セルの変更イベントで対象作業員の合計を再計算
    chengeDataEvent.on('changedata', callback);
    //書き換えのときに実行される関数を戻り値として返す。イベントを一旦外さないとリスナーが大量に登録される
    return () => {chengeDataEvent.off('changedata', callback);}
  });

  var amounts: AmountData[] = getAmounts(targetDates, worker, factories);
  const [showAmounts, changeAmount] = useState(amounts);
  //StateのデータをPropで上書きする為の対応
  const [prevFactoryies, changeFactories] = useState(JSON.stringify(factories));
  const [prevtargetDates, changetargetDates] = useState(targetDates);
  const [prevWorker, changeWorker] = useState(worker);

  let newfactoryies = JSON.stringify(factories) ;
  if (prevFactoryies !== newfactoryies ||  prevtargetDates !== targetDates || prevWorker !== worker){
    changeFactories(newfactoryies);
    changeWorker(worker);
    changetargetDates(targetDates);
    changeAmount(amounts);
  }

  return (
    <div className="col-footer" ref={footerContent} style={{ width: tableSize.width }}>
      <div className="col-footer1">
        {
          showAmounts.flatMap((amount: AmountData,amount_index: number) => {
            return (
              <div key={amount_index} className={`col-group `}>
                <React.Fragment>
                  <div className="working-time">
                    <span>{getHHMMFromMinutes(amount.amount.working_time)}</span>
                  </div>
                  <div className="over-working-time">
                    <span>{getHHMMFromMinutes(amount.amount.over_working_time)}</span>
                  </div>
                  <div className="night-working-time">
                    <span>{getHHMMFromMinutes(amount.amount.night_working_time)}</span>
                  </div>
                  <div className="holidaywork">
                    <span>{amount.amount.holidaywork_cnt}日</span>
                  </div>
                  <div className="cost-food">
                    <span>{amount.amount.cost_food}</span>
                  </div>
                  <div className="note">
                    <span></span>
                  </div>
                </React.Fragment>
              </div>
            )
          })
        }
        <div className="horizontalscroll-margin">
        </div>
      </div>
    </div>
  )
}

//上下が押されたときセルを移動する
function keyUpDownPress(event: React.KeyboardEvent<HTMLDivElement>):void{
    let addValue: number = 0;
    if (event.keyCode === 38) {
      addValue = -1;
    } else if (event.keyCode === 40) {
      addValue = 1;
    } else {
      return;
    }
    let row: number = 0;
    let col: number = 0;
    event.currentTarget.classList.forEach(name => {
      let pos = name.indexOf("col");
      if (pos >= 0) {
        col = Number(name.substring(4));
      } else {
        pos = name.indexOf("row");
        if (pos >= 0) {
          row = Number(name.substring(4));
        };
      }
    });

    let colIndex: string = "col-" + col;
    let rowIndex: string = "row-" + (row + addValue);
    let elements: HTMLCollectionOf<Element> = document.getElementsByClassName(colIndex + " " + rowIndex);

    if (elements.length > 0) {
      let divElement: HTMLElement = (elements[0] as HTMLElement);
      (divElement.firstChild as HTMLElement).focus();
    }
    event.preventDefault();
    return;
}

/**
 * データセル
 * 日別・人別の時間セルを表示
 * @param param0 
 */
function DailyContents({ workerReport, rowIndex, index, chengeDataEvent }: { workerReport: WorkerReport, rowIndex: number, index: number, chengeDataEvent: EventEmitter}) {
  const [working_timeState, changeWorkingTime] = useState(getHHMMFromMinutes(workerReport.working_time,true));
  const [over_working_timeState, changeOverWorkingTime] = useState(getHHMMFromMinutes(workerReport.over_working_time, true));
  const [night_working_timeState, changeNightWorkingTime] = useState(getHHMMFromMinutes(workerReport.night_working_time, true));
  const [holidayworkflgState, changeHolidayWorkFlg] = useState(workerReport.holidayworkflg);
  const [cost_foodState, changeCostFood] = useState(workerReport.cost_food);
  const [noteState, changeNote] = useState(workerReport.note);
  
  //StateのデータをPropで上書きする為の対応
  const [prevWorkerReport, setPrevWorkerReport] = useState<WorkerReport|null>(null);
  if (prevWorkerReport !== workerReport){
    setPrevWorkerReport(workerReport);
    changeWorkingTime(getHHMMFromMinutes(workerReport.working_time, true));
    changeOverWorkingTime(getHHMMFromMinutes(workerReport.over_working_time, true));
    changeNightWorkingTime(getHHMMFromMinutes(workerReport.night_working_time, true)); 
    changeHolidayWorkFlg(workerReport.holidayworkflg);
    changeCostFood(workerReport.cost_food);
    changeNote(workerReport.note);
  }

  let colIndex = index * 6 + 1;
  return (
    <React.Fragment>
      {/* 仕事時間入力 */}
      <div className={`working-time row-${rowIndex} col-${colIndex}`}
          onKeyDown={keyUpDownPress} >
        <input type="text" value={working_timeState} 
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            try {
              let str = event.target.value;
              if (str.length > 1 && str.indexOf(':') < 0) {
                str += ":";
              }
              workerReport.working_time = getMinutesFromHHMM(str);
              changeWorkingTime(str);
              chengeDataEvent.emit('changedata',{factory_uid:workerReport.factory_uid, ymd:workerReport.ymd})
            } catch (e) {
            }
          }}
        />
      </div>
      {/* 残業時間入力 */}
      <div className={`over-working-time row-${rowIndex} col-${colIndex + 1}`}
        onKeyDown={keyUpDownPress} >
        <input type="text" value={over_working_timeState} 
          onFocus={(event)=>event.currentTarget.select()}
          onChange={(event) => {
            try{
              let str = event.target.value;
              if (str.length>1 && str.indexOf(':')<0){
                str += ":";
              }
              workerReport.over_working_time = getMinutesFromHHMM(str);
              changeOverWorkingTime(str);
              chengeDataEvent.emit('changedata', { factory_uid: workerReport.factory_uid, ymd: workerReport.ymd })
            }catch(e){
            }
          }}
        />
      </div>
      {/* 深残業時間入力 */}
      <div className={`night-working-time row-${rowIndex} col-${colIndex + 2}`}
        onKeyDown={keyUpDownPress} >
        <input type="text" value={night_working_timeState}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            try {
              let str = event.target.value;
              if (str.length > 1 && str.indexOf(':') < 0) {
                str += ":";
              }
              workerReport.night_working_time = getMinutesFromHHMM(str);
              changeNightWorkingTime(str);
              chengeDataEvent.emit('changedata', { factory_uid: workerReport.factory_uid, ymd: workerReport.ymd })
            }catch(e){
            }
          }}
        />
      </div>


      {/* 休日出勤フラグ */}
      <div className={`holidaywork row-${rowIndex} col-${colIndex + 3}`}
        onKeyDown={keyUpDownPress} >
        <input type="checkbox" checked={holidayworkflgState}
          onChange={(event) => {
            try {
              workerReport.holidayworkflg = !holidayworkflgState;
              changeHolidayWorkFlg(workerReport.holidayworkflg );
              chengeDataEvent.emit('changedata', { factory_uid: workerReport.factory_uid, ymd: workerReport.ymd })
            } catch (e) {
            }
          }}
        />
      </div>

      {/* 弁当代 */}
      <div className={`cost-food row-${rowIndex} col-${colIndex + 4}`}
        onKeyDown={keyUpDownPress} >
        <input type="number" value={cost_foodState}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            workerReport.cost_food = Number(event.target.value)
            changeCostFood(workerReport.cost_food);
            chengeDataEvent.emit('changedata', { factory_uid: workerReport.factory_uid, ymd: workerReport.ymd })
          }}
        />
      </div>

      {/* 備考 */}
      <div className={`note row-${rowIndex} col-${colIndex + 5}`}
        onKeyDown={keyUpDownPress} >
        <input type="text" value={noteState}
          onChange={(event) => {
            workerReport.note = event.target.value;
            changeNote(workerReport.note);
            chengeDataEvent.emit('changedata', { worker_uid: workerReport.worker_uid, ymd: workerReport.ymd })
          }}
        />
      </div>
    </React.Fragment>
  )
} 

/**
 * メインコンテンツ
 * @param param0
 */
function TableContents({ targetDates, worker, factories, 
  syncScrollEvent, chengeDataEvent, tableSize }: { targetDates: Date[], worker: Worker, factories: Factory[], syncScrollEvent: EventEmitter, chengeDataEvent: EventEmitter, tableSize:TableSize }) {
  const tableContent = useRef < HTMLDivElement>(null);

  //スクロールされた場合、ヘッダと同期する為のsyncScrollEventを発火する
  const onScroll=()=>{
    syncScrollEvent.emit('scroll',  {left:tableContent.current?.scrollLeft,top:tableContent.current?.scrollTop});
  }
  let row_index = 0;
  var getWorkerReport = (worker: Worker,factory_uid:string, date: Date)=>{
    let workerReport = worker.getWorkerReport(date, factory_uid);
    if (!workerReport) {
      workerReport = new WorkerReport();
      workerReport.generateUid();
      workerReport.factory_uid = factory_uid;
      workerReport.worker_uid=worker.uid;
      workerReport.ymd = date;
      worker.addWorkerReport(workerReport);
    }
    return workerReport;
  }


  return (
    <div className="tbody" onScroll={onScroll} ref={tableContent} style={{width:tableSize.width, height:tableSize.height}}>
      {targetDates.flatMap((date,date_index)=>{
        row_index++;
        return (
          <div key={date_index} className={`row-date ${formatDate(date)} ${formatDate(date,"aaaa")}`}>
            {
              factories.map((factory,factory_index) => {
                return (
                  <div key={date_index + "_" + factory_index}  className="col-group">
                    <DailyContents workerReport={getWorkerReport(worker,factory.uid,date)} rowIndex={row_index} index={factory_index} chengeDataEvent={chengeDataEvent}/>
                  </div>
                );
              })
            }
          </div>
        )
      })
    }
    </div>
  )
}


/**
 * フレーム
 * @param param0
 */
function Table({ targetDates, worker, factories, changeableFactories, 
                  onChangeFactory, onDeleteFactory ,onDateChanged, tableSize 
               } : 
               { targetDates: Date[], worker: Worker, factories: Factory[], changeableFactories:Factory[], 
                 onChangeFactory:(old_uid: string, new_uid: string) => void, onDeleteFactory: (uid: string) => void,
                 onDateChanged :()=>void, tableSize : TableSize
               }){
  const syncScrollEvent: EventEmitter = new EventEmitter();
  const chengeDataEvent: EventEmitter = new EventEmitter();
  //変更があった時上にイベントを上げる
  chengeDataEvent.on('changedata', onDateChanged);

  return (
        <div className="table">
          <div className="header-area">
            <div className="header-left">
              <RowColHeader/>
            </div>
            <div className="header-right">
          <ColHeader factories={factories} changeableFactories={changeableFactories} onChangeFactory={onChangeFactory} onDeleteFactory={onDeleteFactory} syncScrollEvent={syncScrollEvent} tableSize={tableSize}/>
            </div>
          </div>
          <div className="contents-area">
            <div className="contents-left">
          <RowHeader targetDates={targetDates} syncScrollEvent={syncScrollEvent} tableSize={tableSize}/>
            </div>
            <div className="contents-right">
          <TableContents targetDates={targetDates} worker={worker} factories={factories} syncScrollEvent={syncScrollEvent} chengeDataEvent={chengeDataEvent} tableSize={tableSize}/>
            </div>
          </div>

          <div className="footer-area">
            <div className="footer-left">
              <RowColFooter/>
            </div>
            <div className="footer-right">
          <ColFooter targetDates={targetDates} worker={worker} factories={factories} syncScrollEvent={syncScrollEvent} chengeDataEvent={chengeDataEvent} tableSize={tableSize}/>
            </div>
          </div>
        </div>  
      )
}

export default function ReportTable({ targetDates, worker, factories, changeableFactories, onChangeFactory, onDeleteFactory, onDateChanged, tableSize }
  : { targetDates: Date[], worker: Worker, factories: Factory[], changeableFactories : Factory[], 
      onChangeFactory: (old_uid: string, new_uid: string) => void, onDeleteFactory: (uid: string) => void,
    onDateChanged: () => void, tableSize: TableSize}) {
    return (
      <Table targetDates={targetDates} worker={worker} factories={factories} changeableFactories={changeableFactories} 
        onChangeFactory={onChangeFactory} onDeleteFactory={onDeleteFactory} onDateChanged={onDateChanged}
        tableSize={tableSize}/>
    )
}