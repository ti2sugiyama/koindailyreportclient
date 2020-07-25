
export class AbstractModel{
    uid: string = "";
    company_uid:string="";
    newflg:boolean = false;

    constructor(uid?:string,company_uid?:string){
        if(uid){
            this.uid = uid;
        }
        if(company_uid){
            this.company_uid = company_uid;
        }
    }

    public generateUid(): void{
        let chars = "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".split("");
        for (let i = 0, len = chars.length; i < len; i++) {
            switch (chars[i]) {
                case "x":
                    chars[i] = Math.floor(Math.random() * 16).toString(16);
                    break;
                case "y":
                    chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
                    break;
            }
        }
        this.uid = chars.join("");
        this.newflg = true;
    }

}