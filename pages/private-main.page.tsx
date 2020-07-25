import React, {Props} from "react";
import {Switch,Route,Link} from "react-router-dom";
import InputReport from "./input-report/input-report.page";
import { Teams } from "./team/teams.page";
import './private-main.page.scss';
import classNames from 'classnames';
import { Workers } from "./worker/workers.page";
import { Factories } from "./factory/factories.page";
import Spinner from "react-bootstrap/Spinner";
import ReactModal from 'react-modal';
import TeamReport from "./team-report/team-report.page";

interface PrivateMainPageProps{}
interface State{
    //メニューを左に寄せるかどうか
    menu_active:boolean,
    //lodingSpinnerflg
    loading:boolean,
    //(true 待機中 ,false 待機終了)
    loadingSpinner:(state:boolean)=>void
}

/**
 * 認証時にのみ表示するページ(Route)
 */
export class PrivateMainPage extends React.Component<PrivateMainPageProps,State>{
    protected menu_active:boolean;
    protected spinner_cnt:number=0;

    constructor(props: Props<PrivateMainPageProps>){
        super(props);
        this.menu_active = true;
        this.state = {
            menu_active: this.menu_active,
            loading: this.spinner_cnt > 0,
            loadingSpinner: this.loadingSpinner
        }
    }
    loadingSpinner = (state: boolean) => {
        if (state) {
            this.spinner_cnt++;
        } else {
            this.spinner_cnt--;
        }
        //Lodaingのstart,end時のみ
        if ((state && (this.spinner_cnt === 1)) || (!state && this.spinner_cnt===0)){
            this.setState({
                loading: this.spinner_cnt > 0,
            });
        }
    }


    toggle=(e:any)=>{
        this.menu_active = !this.menu_active;
        this.setState({
            menu_active: this.menu_active
        });
    }

    render(){
        return (
                <div className={classNames({"page-wrapper":true,"chiller-theme ":true,
                                "toggled" : this.state.menu_active })}>
                    <button id="show-sidebar" className="btn btn-sm btn-dark" onClick={this.toggle}>
                        <i className="fas fa-bars"></i>
                    </button>
                    <nav id="sidebar" className="sidebar-wrapper">
                        <div className="sidebar-content">
                            <div className="sidebar-brand">
                                <a href="#">メニュー</a>
                                <div id="close-sidebar" onClick={this.toggle}>
                                    <i className="fas fa-times"></i>
                                </div>
                            </div>

                            <div className="sidebar-menu">
                                <ul>
                                    <li>
                                        <Link to="/workersreports">月報入力</Link>
                                    </li>
                                    <li>
                                        <Link to="/teamsreports">月報表示</Link>
                                    </li>
                                    <li>
                                        <Link to="/workers">作業員</Link>
                                    </li>
                                    <li>
                                        <Link to="/teams">グループ</Link>
                                    </li>
                                    <li>
                                        <Link to="/factories">現場</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </nav>


                    <div className="page-content">


                    <ReactModal
                        isOpen={this.state.loading}
                        className="Modal"
                        shouldCloseOnOverlayClick={false}
                    >
                        <div><Spinner className="loading" animation="border" /></div>
                        <div>データ読み込み中...</div>
                    </ReactModal>



                        <div className="container-fluid">
                                <Switch>
                                    <Route path="/workersreports">
                                        <InputReport menuActive={this.menu_active} loadingSpinner={this.loadingSpinner} />
                                    </Route>
                                    <Route path="/teamsreports">
                                    <TeamReport menuActive={this.menu_active} loadingSpinner={this.loadingSpinner} />
                                    </Route>
                                    <Route path="/workers">
                                        <Workers loadingSpinner={this.loadingSpinner} />
                                    </Route>
                                    <Route path="/teams">
                                        <Teams loadingSpinner={this.loadingSpinner} />
                                    </Route>
                                    <Route path="/factories">
                                <Factories loadingSpinner={this.loadingSpinner} />
                                    </Route>
                                </Switch>
                        </div>
                    </div>
                </div>
        );
    }
}
