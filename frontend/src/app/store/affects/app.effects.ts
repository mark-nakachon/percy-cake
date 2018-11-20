import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map, tap, exhaustMap } from 'rxjs/operators';
import { Alert, CommonActionTypes, AlertClosed, APIError, Navigate } from '../actions/common.actions';
import { MatDialog } from '@angular/material';
import { AlertDialogComponent } from '../../components/alert-dialog/alert-dialog.component';
import { Router } from '@angular/router';
import { MaintenanceService } from '../../services/maintenance.service';
import { of } from 'rxjs';

// defines the common effects
@Injectable()
export class AppEffects {

    constructor(
        private actions$: Actions,
        private router: Router,
        private dialog: MatDialog,
        private maintenanceService: MaintenanceService
    ) { }

    /**
     * alert effect
     */
    @Effect({ dispatch: false })
    alert$ = this.actions$.pipe(
        ofType<Alert>(CommonActionTypes.Alert),
        map(action => action.payload),
        tap(data => {
            this.dialog.open(AlertDialogComponent, { data });
        })
    );

    /**
     * alert closed effect
     */
    @Effect({ dispatch: false })
    alertClosed$ = this.actions$.pipe(
        ofType<AlertClosed>(CommonActionTypes.AlertClosed),
        map(action => action.payload),
        tap(data => {
            if (data.editorType === 'add') {
                return of(this.router.navigate(['/']));
            }
        })
    );

    // global error effect for API error to log
    @Effect()
    apiError$ = this.actions$.pipe(
        ofType<APIError>(CommonActionTypes.APIError),
        map(action => action.payload),
        exhaustMap(response => {
            const message = `[${response.status}]: ${response.error.message}`;
            this.maintenanceService.logError(message).subscribe(() => { }, error => {
                console.error('An error occurred while saving the log error', error);
            });
            return of(new Alert({ message: response.error.message, editorType: 'error' }));
        }),
    );

    /**
     * navigate effect
     */
    @Effect({ dispatch: false })
    navigate$ = this.actions$.pipe(
        ofType<Navigate>(CommonActionTypes.Navigate),
        tap(action => {
          this.router.navigate(action.payload);
        })
    );
}
