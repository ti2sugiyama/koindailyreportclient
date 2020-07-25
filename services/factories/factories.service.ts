import axios from "../http/axios.webapi"
import { map, first, catchError } from 'rxjs/operators';
import { Observable, from, of, throwError} from "rxjs";
import { plainToClass } from "class-transformer";
import { Factory } from "../../models/factory/factory";
import { APIAccessError } from "../../error/api-access.error";

export function getFactories(): Observable<Factory[]> {
    return from(axios.get("/factories")).pipe(
        first(),
        //mapはovservableを返す
        map(response => {
            var datas: any[] = response.data;
            var factories: Factory[] = plainToClass(Factory, datas);
            return factories;
        }),
        catchError((error => {
            throw new APIAccessError("get factories access error", error);
        }))
    );
}

export function updateFactories(factories: Factory[]): Observable<boolean> {
    if (factories.length === 0) {
        return of(true);
    }
    var data = JSON.stringify(factories);
    return from(axios.post("/factories", data, { headers: { "Content-Type": "application/json" } })).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("post factories access error", error));
        }))
    );
}

export function deleteFactories(factories: Factory[]): Observable<boolean> {
    var uids: string = factories.filter(factory => !factory.newflg).map(factory => factory.uid).join(",");
    if (uids.length === 0) {
        return of(true);
    }
    var data = {
        uids: uids
    }

    return from(axios.delete("/factories", { params: data })).pipe(
        first(),
        map(response => {
            return true;
        }),
        catchError((error => {
            return throwError(new APIAccessError("delete factories access error", error));
        }))
    );
}
