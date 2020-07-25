import { AbstractModel } from "../abstract-model";

export class Team extends AbstractModel {
    name:string="";

    public constructor() {
        super();
    }

    /**
     * ソート用
     */
    static sort(a:Team,b:Team):number{
        let len = Math.min(a.name.length,b.name.length);
        for(let i = 0; i<len; i++){
            if(a.name.charCodeAt(i) < b.name.charCodeAt(i)){
                return -1;
            }else if(a.name.charCodeAt(i)>b.name.charCodeAt(i)){
                return 1;
            }
        }

        if (a.name.length < b.name.length) {
            return -1;
        } else if (a.name.length > b.name.length) {
            return 1;
        }
        return 0;

    }
}