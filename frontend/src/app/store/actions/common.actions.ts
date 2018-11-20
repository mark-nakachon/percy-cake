import { Action } from '@ngrx/store';
import { HttpErrorResponse } from '@angular/common/http';

export enum CommonActionTypes {
    Alert = '[App] Alert',
    AlertClosed = '[App] Alert Closed',
    APIError = '[App] API Error',
    Navigate = '[App] Navigate',
    Reset = '[App] Reset',
}

export class Alert implements Action {
    readonly type = CommonActionTypes.Alert;

    constructor(public payload: { message: string, editorType?: string }) { }
}

export class AlertClosed implements Action {
    readonly type = CommonActionTypes.AlertClosed;

    constructor(public payload: any) { }
}

export class APIError implements Action {
    readonly type = CommonActionTypes.APIError;

    constructor(public payload: HttpErrorResponse) { }
}

export class Navigate implements Action {
    readonly type = CommonActionTypes.Navigate;

    constructor(public payload: string[]) { }
}

export class Reset implements Action {
    readonly type = CommonActionTypes.Reset;
}


export type DashboardActionsUnion =
    | Alert
    | AlertClosed
    | APIError
    | Navigate
    | Reset;
