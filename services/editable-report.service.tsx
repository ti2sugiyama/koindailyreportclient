
import { Worker } from '../models/worker/worker';
import { WorkerReport } from '../models/worker-report/worker-report';

export function setWorkerReportToWorker(workers:Worker[],workerReports:WorkerReport[]):void{
  var workerMap: { [key: string]: Worker } = {};

  workers.forEach(worker => workerMap[worker.uid]=worker);
  workerReports.forEach(workerReport => workerMap[workerReport.worker_uid].addWorkerReport(workerReport));
}