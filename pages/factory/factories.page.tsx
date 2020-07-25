import React from 'react'
import styled from 'styled-components'
import { Factory } from '../../models/factory/factory';
import { Subscription, forkJoin } from 'rxjs';
import { getFactories, updateFactories,deleteFactories } from '../../services/factories/factories.service';
import { tap } from 'rxjs/operators';
import Swal from 'sweetalert2';


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
    factories: Factory[],
    hasUnsavedData: boolean,
}

export class Factories extends React.Component<Props,State>{
    factories: Factory[] = [];
    deleteFactories: Factory[] = [];
    subscription: Subscription = new Subscription();
    constructor(props:Props){
        super(props); 
        this.state = { 
            factories:this.factories,
            hasUnsavedData : false
        };
    }
    //画面初期化後
    componentDidMount() {
        this.getFactoriesFromServer();
    }
    //終了時
    componentWillUnmount() {
        this.subscription.unsubscribe();
    }


    //作業員一覧をサーバーから取得
    getFactoriesFromServer = () => {
        this.props.loadingSpinner(true);
        this.subscription.add(
            getFactories()
                .pipe(tap(() => this.props.loadingSpinner(false), () => this.props.loadingSpinner(false)))
                .subscribe((factories) => {
                    factories.sort(Factory.sort);
                    this.factories = factories;
                    this.setState({ 
                        factories: this.factories,
                        hasUnsavedData:false
                    });
                }, (error) => {
                    Swal.fire('通信エラー');
                }));
    };

    save = () => {
        this.props.loadingSpinner(true);
        this.subscription.add(
            forkJoin(
                deleteFactories(this.deleteFactories),
                updateFactories(this.factories)
            ).pipe(tap(() => this.props.loadingSpinner(false), () => this.props.loadingSpinner(false)))
                .subscribe(() => {
                    this.getFactoriesFromServer();
                    
                }, (error) => {
                    Swal.fire('通信エラー');
                }));
    }



    removeFactory = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>)=>{
        let index: number = Number(event.currentTarget.value);
        this.deleteFactories.push(this.factories[index]);
        this.factories.splice(index, 1);
        this.setState({ factories: this.factories, hasUnsavedData:true});
    };
    
    addFactory = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        let team = new Factory();
        team.generateUid();
        this.factories.push(team);
        this.setState({ factories: this.factories, hasUnsavedData: true });
    };
    editFactory = (e:React.ChangeEvent<HTMLInputElement>)=>{
        let index: number = Number(e.currentTarget.getAttribute("data-index"));
        this.factories = this.factories.slice();
        this.factories[index].name = e.target.value;
        
        this.setState({ factories: this.factories, hasUnsavedData: true});
    }
    render() {
        return (
            <Styles>

                <nav className="navbar navbar-light bg-light">
                    <span className="navbar-brand mb-0 h1 align-left">現場名</span>
                    <button className={this.state.hasUnsavedData ? "btn btn-warning btn-sm " : " btn btn-outline-info btn-sm "} type="submit" onClick={this.save}>保存</button>
                </nav>
                <table>
                    <thead>
                        <tr>
                            <td>名前</td>
                            <td><button className="btn btn-outline-primary btn-sm" onClick={this.addFactory}>追加</button></td>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.factories.map((factory: Factory,index:number) => {
                                return (
                                    <tr key={index}>
                                        <td>
                                            <input data-index={index} value={factory.name} onChange={this.editFactory}/>
                                        </td>
                                        <td>
                                            <button className="btn btn-outline-danger btn-sm" value={index} onClick={this.removeFactory}>削除</button>
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