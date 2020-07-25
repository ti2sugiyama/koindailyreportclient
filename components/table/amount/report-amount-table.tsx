import React, { useRef, useEffect } from 'react'
import { Worker, Amount } from '../../../models/worker/worker';
import { formatDate } from '../../../services/utils/utils.service';
import './report-amount-table.scss';
import { EventEmitter } from 'events';
import { getHHMMFromMinutes} from '../../../services/utils/utils.service'
import { Team } from '../../../models/team/team';

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
function ColHeader({ workers,  syncScrollEvent, tableSize}
  : { workers: Worker[],  syncScrollEvent: EventEmitter, tableSize:TableSize }) {
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

  return (
    <div className="thead col-header" ref={headerContent} style={{ width: tableSize.width }}>
      <div className="col-header1">
        {workers.map((worker, worker_index) => {
          return (
            <div key={worker_index} className={`col-group ${worker.uid}`}>
              <div className="row">
                <div className="col-sm-9">
                  <span>{worker.getName()}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="col-header2">
        {workers.map((worker, worker_index) => {
          return (
            <div key={worker_index} className={`col-group ${worker.uid}`}>
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
  worker_uid: string,
  amount: Amount
}

/** 作業員の合計計算 */
function calcAmount(targetDates: Date[], worker: Worker): AmountData {
  return {
    worker_uid: worker.uid,
    amount: worker.getAmount(targetDates)
  }as AmountData;
}

/** 全ての場所でそれぞれ合計計算 */
function getAmounts(targetDates: Date[], workers: Worker[]): AmountData[] {
  return workers.map(worker=>
    calcAmount(targetDates, worker)
  )
}

/**
 * 下部に表示するFooter
 * @param param0 
 */
function ColFooter({ targetDates, workers, syncScrollEvent,tableSize }
  : { targetDates: Date[], workers: Worker[], syncScrollEvent: EventEmitter, tableSize: TableSize}) {
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

  var amounts: AmountData[] = getAmounts(targetDates, workers);

  return (
    <div className="col-footer" ref={footerContent} style={{ width: tableSize.width }}>
      <div className="col-footer1">
        {
          amounts.flatMap((amount: AmountData,amount_index: number) => {
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


/**
 * データセル
 * 日別・人別の時間セルを表示
 * @param param0 
 */
function DailyContents({ amount, rowIndex, index }: { amount: Amount, rowIndex: number, index: number}) {
  let colIndex = index * 5 + 1;
  return (
    <React.Fragment>
      {/* 仕事時間 */}
      <div className={`working-time row-${rowIndex} col-${colIndex}`}>
        <span> {getHHMMFromMinutes(amount.working_time, true)}</span>
      </div>
      {/* 残業時間 */}
      <div className={`over-working-time row-${rowIndex} col-${colIndex + 1}`}>
        <span> {getHHMMFromMinutes(amount.over_working_time, true)}</span>
      </div>
      {/* 深残業時間入力 */}
      <div className={`night-working-time row-${rowIndex} col-${colIndex + 2}`}>
        <span> {getHHMMFromMinutes(amount.night_working_time, true)}</span>
      </div>
      {/* 休日出勤日数 */}
      <div className={`holidaywork row-${rowIndex} col-${colIndex + 3}`}>
        {amount.holidaywork_cnt > 0 &&
          <span>{amount.holidaywork_cnt} </span>
        }
      </div>
      {/* 弁当代 */}
      <div className={`cost-food row-${rowIndex} col-${colIndex + 4}`}>
        {amount.cost_food > 0 &&
          <span>{amount.cost_food} </span>
        }
      </div>
    </React.Fragment>
  )
} 

/**
 * メインコンテンツ
 * @param param0
 */
function TableContents({ targetDates,workers, 
  syncScrollEvent, tableSize }: { targetDates: Date[],  workers: Worker[], syncScrollEvent: EventEmitter,tableSize:TableSize }) {
  const tableContent = useRef < HTMLDivElement>(null);

  //スクロールされた場合、ヘッダと同期する為のsyncScrollEventを発火する
  const onScroll=()=>{
    syncScrollEvent.emit('scroll',  {left:tableContent.current?.scrollLeft,top:tableContent.current?.scrollTop});
  }
  let row_index = 0;
  var getAmount = (worker: Worker, date: Date)=>{
    let amount = worker.getAmount([date]);
    return amount;
  }

  return (
    <div className="tbody" onScroll={onScroll} ref={tableContent} style={{width:tableSize.width, height:tableSize.height}}>
      {targetDates.flatMap((date,date_index)=>{
        row_index++;
        return (
          <div key={date_index} className={`row-date ${formatDate(date)} ${formatDate(date,"aaaa")}`}>
            {
              workers.map((worker,worker_index) => {
                return (
                  <div key={date_index + "_" + worker_index}  className="col-group">
                    <DailyContents amount={getAmount(worker,date)} rowIndex={row_index} index={worker_index}/>
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
function Table({ targetDates, team, workers,  tableSize } : 
               { targetDates: Date[], team: Team, workers: Worker[],tableSize : TableSize
               }){
  const syncScrollEvent: EventEmitter = new EventEmitter();

  return (
        <div className="table">
          <div className="header-area">
            <div className="header-left">
              <RowColHeader/>
            </div>
            <div className="header-right">
          <ColHeader workers={workers} syncScrollEvent={syncScrollEvent} tableSize={tableSize}/>
            </div>
          </div>
          <div className="contents-area">
            <div className="contents-left">
          <RowHeader targetDates={targetDates} syncScrollEvent={syncScrollEvent} tableSize={tableSize}/>
            </div>
            <div className="contents-right">
          <TableContents targetDates={targetDates} workers={workers}  syncScrollEvent={syncScrollEvent} tableSize={tableSize}/>
            </div>
          </div>

          <div className="footer-area">
            <div className="footer-left">
              <RowColFooter/>
            </div>
            <div className="footer-right">
          <ColFooter targetDates={targetDates} workers={workers} syncScrollEvent={syncScrollEvent} tableSize={tableSize}/>
            </div>
          </div>
        </div>  
      )
}

export default function ReportAmountTable({ targetDates, team, workers, tableSize }
  : { targetDates: Date[], team: Team, workers: Worker[], tableSize: TableSize}) {
    return (
      <Table targetDates={targetDates} team={team} workers={workers} tableSize={tableSize}/>
    )
}