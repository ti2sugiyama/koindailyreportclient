import React from 'react'
import renderer from 'react-test-renderer';
import ReportTable from './report-table';
import { plainToClass } from 'class-transformer';
import { WorkerSampledata } from '../../../models/worker/worker_sampledata';
import { WorkerReport } from '../../../models/worker-report/worker-report';
import { WorkerReportSampledata } from '../../../models/worker-report/worker-report_sampledata';
import { Worker } from '../../../models/worker/worker';
import { createDaysAMonth } from '../../../services/utils/utils.service';
import { setWorkerReportToWorker } from '../../../services/editable-report.service';
import { Factory } from '../../../models/factory/factory';
import { FactorySampledata } from '../../../models/factory/factory_sampledata';

/*
describe('Report Table Test', () => {
  it('should create an instance', () => {
    let workers: Worker[] = plainToClass(Worker, WorkerSampledata);
    let worker_report: WorkerReport[] = plainToClass(WorkerReport, WorkerReportSampledata(workers, new Date()));
  });
});
*/



describe('Report Table Test', () => {
/*
  let workers: Worker[] = plainToClass(Worker, WorkerSampledata);
  let worker_report: WorkerReport[] = plainToClass(WorkerReport, WorkerReportSampledata(workers, new Date()));
  let targetDates = createDaysAMonth(new Date());
  let factories: Factory[] = plainToClass(Factory, FactorySampledata);


  setWorkerReportToWorker(workers, worker_report);
    it("renders correctly",()=>{
    const tree = renderer.create(
      <ReportTable targetDates={targetDates} worker={selectedWorker} factories={selectedFactories}
        changeableFactories={changeableFactories} onChangeFactory={onChangeFactory} onDeleteFactory={onDeleteFactory} />
     ).toJSON();
//    expect(tree).toMatchSnapshot();
  })
  */
});
