import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { FormControl, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material';

import { Store, select } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { startWith, debounceTime, distinctUntilChanged, switchMap, withLatestFrom, tap } from 'rxjs/operators';

import * as _ from 'lodash';

import { percyConfig } from 'config';
import * as appStore from 'store';
import * as AuthActions from 'store/actions/auth.actions';
import { MaintenanceService } from 'services/maintenance.service';
import { NotEmpty } from 'services/util.service';

const urlFormat = /^\s*(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;

/*
  Login page
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  username = new FormControl('', [NotEmpty]);
  password = new FormControl('', [NotEmpty]);
  repositoryURL = new FormControl('', [NotEmpty, Validators.pattern(urlFormat)]);
  branchName = new FormControl('', [NotEmpty]);
  loginError: string = null;
  formProcessing = this.store.pipe(select(appStore.getFormProcessing));

  usernameTypeAhead: string[] = [];
  filteredUsernames = new BehaviorSubject<string[]>([]);

  lockedBranches: string[];

  // use to trigger the change in the input from browser auto fill
  @ViewChild('autoTrigger') private autoTrigger: MatAutocompleteTrigger;

  /**
   * constructs the component
   * @param router the router instance
   * @param store the app store instance
   * @param maintenanceService the maintenance service
   * @param _document the document instance
   */
  constructor(
    private store: Store<appStore.AppState>,
    private router: Router,
    private maintenanceService: MaintenanceService,
    @Inject(DOCUMENT) private _document: Document
  ) { }

  /**
   * handle component initialization
   */
  ngOnInit() {
    // if currentURL is login then route depending on whether user is logged-in or not
    this.store.pipe(select(appStore.getCurrentUser)).pipe(
      withLatestFrom(this.store.pipe(select(appStore.getRedirectUrl))),
      tap(([isAuthenticated, redirectUrl]) => {
        if (isAuthenticated) {
          return this.router.navigate([redirectUrl || '/dashboard']);
        }
      })
    ).subscribe();

    this.username.valueChanges
      .pipe(
        startWith(null),
        debounceTime(200),
        distinctUntilChanged(),
        switchMap(value => this._filter(value))
      ).subscribe(this.filteredUsernames);

    this.repositoryURL.setValue(percyConfig.defaultRepositoryUrl);
    this.branchName.setValue(percyConfig.defaultBranchName);
    this.lockedBranches = percyConfig.lockedBranches;

    this.store.pipe(select(appStore.getLoginError)).pipe(tap((le) => {
      this.loginError = null;

      if (!le) {
        return;
      }

      // Show the error in form field
      if (le['statusCode'] === 401) {
        this.password.setErrors({ invalid: true });
        return this.username.setErrors({ invalid: true });
        return;
      } else if (le['statusCode'] === 403) {
        return this.repositoryURL.setErrors({ forbidden: true });
      } else if (le.message === 'Repository not found') {
        return this.repositoryURL.setErrors({ notFound: true });
      } else if (le['code'] === 'ResolveRefError' && _.get(le, 'data.ref') === this.branchName.value) {
        return this.branchName.setErrors({ notFound: true });
      }

      this.loginError = 'Login failed';
    })).subscribe();
  }

  /*
   * login if the form is valid
   */
  login() {
    // trim fields
    this.username.setValue(_.trim(this.username.value));
    this.repositoryURL.setValue(_.trim(this.repositoryURL.value));
    this.branchName.setValue(_.trim(this.branchName.value));

    if (this.username.valid && this.password.valid && this.repositoryURL.valid && this.branchName.valid) {
      if (this.lockedBranches && this.lockedBranches.indexOf(this.branchName.value) > -1) {
        this.branchName.setErrors({ locked: true });
        return;
      }
      this.store.dispatch(new AuthActions.Login({
        repositoryUrl: this.repositoryURL.value,
        branchName: this.branchName.value,
        username: this.username.value,
        password: this.password.value
      }));
    }
  }

  /*
   * when user types in an input field remove error messages
   */
  inputChange(field?: string) {
    this.loginError = null;

    if (field === 'user-pass') {
      if (_.trim(this.username.value) !== '') {
        this.username.setErrors(null);
      }

      if (this.password.value !== '') {
        this.password.setErrors(null);
      }
    }
  }

  /**
   * handles the input event of input field
   * this is used to support browser auto fill pass the validation
   * otherwise chrome will show required for username when username is
   * filled from browser auto fill
   * @param event the key board input event
   */
  onInput = (event: KeyboardEvent) => {
    const target = event.currentTarget as HTMLInputElement;

    if (this._document.activeElement !== target) {
      this.autoTrigger._onChange(target.value);
    }
  }

  /**
   * filters the usernames with given prefix
   * @param value the prefix
   */
  private async _filter(value: string) {
    const filterValue = _.trim(value).toLowerCase();
    // only call API if first character else filter from cache value
    if (filterValue.length === 1) {
      const typeAhead = await this.maintenanceService.getUserTypeAhead(filterValue);
      this.usernameTypeAhead = typeAhead;
      return this.usernameTypeAhead.filter(option => _.startsWith(option.toLowerCase(), filterValue));
    } else {
      return this.usernameTypeAhead.filter(option => _.startsWith(option.toLowerCase(), filterValue));
    }
  }
}
