
import { getTeams, TeamWorkerInterface, getTeamWorkers } from "./teams.service";
import axios, { AxiosError } from 'axios';
import { TeamSampledata} from "../../models/team/team_sampledata";


import { plainToClass } from "class-transformer";
import { Team } from "../../models/team/team";
import { APIAccessError } from "../../error/api-access.error";
import { TeamWorkerSampledata } from "./team-worker_sampledata";
jest.mock('axios');

function successWithDelay(retValue:{}, delay:number):Promise<any>{
    return new Promise((success, fail) => setTimeout(success(), delay)).then(
        () => {return retValue;}
    );
}

describe('TeamsService  getService', () => {
    afterEach(() => jest.restoreAllMocks());
    (axios.get as any).mockResolvedValue(
        successWithDelay({ data: TeamSampledata }, 1000)
    );

    it('success', done => {
        var sub =  getTeams().subscribe(resonse=>{
            let teams = plainToClass(Team, TeamSampledata);
            expect(resonse).toEqual(teams);
            done();
        });
    })
});


describe('TeamsService  getTeamWorkers', () => {
    afterEach(() => jest.restoreAllMocks());
    it('success', done => {
        (axios.get as any).mockResolvedValue(
            successWithDelay({ data: TeamWorkerSampledata }, 1000)
        );
        var sub = getTeamWorkers('tmp').subscribe(response => {
            expect(response).toEqual(TeamWorkerSampledata);
        }, () => {
        }, () => done()
        );
    }),

    it('error', done => {
        (axios.get as any).mockRejectedValue(new Error("error") as AxiosError, 1000);
        var sub = getTeamWorkers('tmp').subscribe(response => {
        }, error => {
            expect(error).toBeInstanceOf(APIAccessError);
            done();
        }, () => {
        });
    })
});
