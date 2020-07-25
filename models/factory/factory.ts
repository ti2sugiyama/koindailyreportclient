import { AbstractModel } from "../abstract-model";

export class Factory extends AbstractModel {
    name: string = "";
    public constructor(uid?:string,company_uid?:string,name?:string,generate_flg=false) {
        super(uid,company_uid);
        if(name){
            this.name = name;
        }
        if(generate_flg){
            this.generateUid();
        }
    }


    /**
     * ソート用
     */
    static sort(a: Factory, b: Factory): number {
        let len = Math.min(a.name.length, b.name.length);
        for (let i = 0; i < len; i++) {
            if (a.name.charCodeAt(i) < b.name.charCodeAt(i)) {
                return -1;
            } else if (a.name.charCodeAt(i) > b.name.charCodeAt(i)) {
                return 1;
            }
        }
        if(a.name.length < b.name.length){
            return -1;
        }else if(a.name.length > b.name.length){
            return 1;
        }
        return 0;
    }
}