import axios from "../http/axios.webapi"
import { map, first, catchError } from 'rxjs/operators';
import { Observable, of, from, throwError } from "rxjs";
import { plainToClass } from "class-transformer";
import { Team } from "../../models/team/team";
import { APIAccessError } from "../../error/api-access.error";
import { Worker } from "../../models/worker/worker";

export interface TeamWorkerInterface {
    team_uid: string,
    worker_uids: string[]
}

export function getTeams(): Observable<Team[]> {
    return from(axios.get("/teams")).pipe(
        first(),
        map(response => {
            var datas: any[] = response.data;
            var teams: Team[] = plainToClass(Team, datas);
            return teams;
        }),
        catchError((error => {
            return throwError(new APIAccessError("get workers access error", error)); 
        }))
    );
}


export function updateTeams(teams: Team[]): Observable<boolean> {
    if (teams.length === 0) {
        return of(true);
    }
    var data = JSON.stringify(teams);
    return from(axios.post("/teams", data, { headers: { "Content-Type": "application/json" } })).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("post team access error", error));
        }))
    );
}


export function deleteTeams(teams: Team[]): Observable<boolean> {
    var uids: string = teams.filter(team => !team.newflg).map(team => team.uid).join(",");
    if (uids.length === 0) {
        return of(true);
    }
    var data = {
        uids: uids
    }

    return from(axios.delete("/teams", { params: data })).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("delete team access error", error));
        }))
    );
}

export function getTeamWorkers(): Observable<TeamWorkerInterface[]> {
    return from(axios.get("/teamworkers")).pipe(
        first(),
        map(response => {
            var datas: TeamWorkerInterface[] = response.data;
            return datas;
        }),
        catchError((error => {
            return throwError(new APIAccessError("get teamworkers access error", error)); 
        }))
    );
}

/**
 * チームの構成を変更する
 * @param teams 変更があったチーム
 * @param  workers 変更データ(propertyに所属チームが登録されている)
 */
export function updateTeamWorkers(teams:Team[],workers:Worker[]): Observable<boolean> {
    if (teams.length === 0) {
        return of(true);
    }
    var uids: string[] = teams.filter(team => !team.newflg).map(team => team.uid);
    var data = {
        team_uids:uids,
        teamWorkers: teams.map(team => ({
                        company_uid: team.company_uid,
                        team_uid: team.uid,
                        worker_uids: workers.filter(worker => worker.team_uids.find(team_uid => team_uid === team.uid)).map(worker => worker.uid)
                    }))
    };
    return from(axios.post("/teamworkers",data, { headers: { "Content-Type": "application/json" } })).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("get teamworkers access error", error));
        }))
    );
}
