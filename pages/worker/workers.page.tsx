import React from 'react';
import styled from 'styled-components'
import { Worker } from '../../models/worker/worker';
import { getWorkers, updateWorkers,deleteWorkers } from '../../services/workers/workers.service';
import { tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Subscription, forkJoin } from 'rxjs';


const Styles = styled.div`
  padding: 1rem;

  table {
    border-spacing: 0;
    border: 1px solid black;

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid black;
      border-right: 1px solid black;

      :last-child {
        border-right: 0;
      }
    }
  }
`
interface Props {
    loadingSpinner: (state: boolean) => void
}
interface State {
    workers: Worker[],
    hasUnsavedData: boolean
}

export class Workers extends React.Component<Props, State>{
    workers: Worker[] = [];
    deleteWorkers:Worker[]=[];
    subscription: Subscription = new Subscription();

    constructor(props: Props) {
        super(props);
        this.state = {
            workers: this.workers,
            hasUnsavedData: false
         }
    }
    //画面初期化後
    componentDidMount() {
        this.getWorkersFromServer();
    }
    //終了時
    componentWillUnmount() {
        this.subscription.unsubscribe();
    }

    //作業員一覧をサーバーから取得
    getWorkersFromServer = () => {
        this.props.loadingSpinner(true);
        this.subscription.add(
            getWorkers()
                .pipe(tap(() => this.props.loadingSpinner(false), () => this.props.loadingSpinner(false)))
                .subscribe((workers) => {
                    workers.sort(Worker.sort);
                    this.workers = workers;
                    this.setState({
                        workers: this.workers,
                        hasUnsavedData: false
                    });
                }, (error) => {
                    Swal.fire('通信エラー');
                }));
    };

    save = () =>{
        this.props.loadingSpinner(true);
        this.subscription.add(
            forkJoin(
                deleteWorkers(this.deleteWorkers),
                updateWorkers(this.workers)
            ).pipe(tap(() => this.props.loadingSpinner(false), () => this.props.loadingSpinner(false)))
            .subscribe(() => {
                this.getWorkersFromServer();
            }, (error) => {
                Swal.fire('通信エラー');
        }));
    }

    removeWorker = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        let index: number = Number(event.currentTarget.value);
        this.deleteWorkers.push(this.workers[index]);
        this.workers.splice(index,1);
        this.setState({
            workers: this.workers,hasUnsavedData: true });
    };
    addWorker = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        let worker :Worker = new Worker();
        worker.generateUid();
        this.workers.push(worker);
        this.setState({ workers: this.workers, hasUnsavedData: true });
    };
    editId = (e: React.ChangeEvent<HTMLInputElement>) => {
        let index = Number(e.currentTarget.getAttribute("data-index"));
        this.workers = this.workers.slice();
        this.workers[index].id = e.target.value;
        this.setState({ workers: this.workers, hasUnsavedData: true });

    };
    editSeiWorker = (e: React.ChangeEvent<HTMLInputElement>) => {
        let index = Number(e.currentTarget.getAttribute("data-index"));
        this.workers = this.workers.slice();
        this.workers[index].seikanji = e.target.value;

        this.setState({ workers: this.workers, hasUnsavedData: true});
    }
    editMeiWorker = (e: React.ChangeEvent<HTMLInputElement>) => {
        let index = Number(e.currentTarget.getAttribute("data-index"));
        this.workers = this.workers.slice();
        this.workers[index].meikanji = e.currentTarget.value;

        this.setState({ workers: this.workers, hasUnsavedData: true });
    }

    changeSubConstractor=(e: React.ChangeEvent<HTMLInputElement>) => {
        let index = Number(e.currentTarget.getAttribute("data-index"));
        this.workers = this.workers.slice();
        this.workers[index].subcontractor = !this.workers[index].subcontractor;
        this.setState({ workers: this.workers, hasUnsavedData: true});
    }
    render() {
        return (
            <Styles>

                <nav className="navbar navbar-light bg-light">
                    <span className="navbar-brand mb-0 h1">従業員名</span>
                    <button className={this.state.hasUnsavedData ? "btn btn-warning btn-sm " : " btn btn-outline-info btn-sm "} type="submit" onClick={this.save}>保存</button>
                </nav>
                <table>
                    <thead>
                        <tr>
                            <td>ID</td>
                            <td>姓</td>
                            <td>名</td>
                            <td>業者</td>
                            <td><button className="btn btn-outline-primary btn-sm" onClick={this.addWorker}>追加</button></td>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.workers.map((worker: Worker, index: number) => {
                                return (
                                    <tr key={index}>
                                        <td>
                                            <input data-index={index} value={worker.id} onChange={this.editId} />
                                        </td>
                                        <td>
                                            <input data-index={index} value={worker.seikanji} onChange={this.editSeiWorker} />
                                        </td>
                                        <td>
                                            <input data-index={index} value={worker.meikanji} onChange={this.editMeiWorker} />
                                        </td>
                                        <td>
                                            <input data-index={index} type="checkbox" checked={worker.subcontractor} onChange={this.changeSubConstractor} />
                                        </td>
                                        <td>
                                            <button className="btn btn-outline-danger btn-sm"  value={index} onClick={this.removeWorker}>削除</button>
                                        </td>
                                    </tr>
                                )
                            })
                        }
                    </tbody>
                </table>
            </Styles>
        );
    }
}


