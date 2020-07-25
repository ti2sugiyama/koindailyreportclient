import { Team } from './team';
import { plainToClass } from 'class-transformer';
import { TeamSampledata} from './team_sampledata';



describe('Team', () => {
    it('should create an instance', () => {
        let team: Team[] = plainToClass(Team, TeamSampledata);
        expect(team[0].company_uid).toBe("ikara"); 
        expect(team[0].uid).toBe("kozi1");
        expect(team[0].name).toBe("工事1課");
        expect(team[1].company_uid).toBe("ikara");
        expect(team[1].uid).toBe("kozi2");
        expect(team[1].name).toBe("工事2課");
    })
});

