
import { formatDate, createDaysAMonth } from "../../services/utils/utils.service";
import { plainToClass } from 'class-transformer';
import { Team } from "../../models/team/team";
import { TeamSampledata } from "../../models/team/team_sampledata";
import { Worker } from "../../models/worker/worker";

export const TeamWorkerSampledata = (workers: Worker[], ymDate: Date)=>{
    let teams: Team[] = plainToClass(Team, TeamSampledata);
    return teams.map((team)=>{
        return {
            team_uid    : team.uid,
            worker_uids : workers.map((worker: Worker) => worker.uid)
        }
    })
}

