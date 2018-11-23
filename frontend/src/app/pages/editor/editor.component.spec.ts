import { convertToParamMap } from '@angular/router';
import { select } from '@ngrx/store';

import { Setup, TestUser, assertDialogOpened } from 'test/test-helper';

import * as appStore from 'store';
import { LoginSuccess } from 'store/actions/auth.actions';
import { ConfigurationChange } from 'store/actions/editor.actions';
import { API_BASE_URL } from 'services/http-helper.service';

import { CommitDialogComponent } from 'components/commit-dialog/commit-dialog.component';
import { ConfirmationDialogComponent } from 'components/confirmation-dialog/confirmation-dialog.component';
import { take } from '../../../../node_modules/rxjs/operators';
  const ctx = Setup(EditorComponent, false, [new LoginSuccess(TestUser)]);

  const url = `repos/${TestUser.repoName}/branches/${TestUser.branchName}`;

  const files = [
    {
      applicationName: 'app1',
      fileName: 'sample.yaml',
      timestamp: Date.now(),
      size: 100,
    },
    {
      applicationName: 'app1',
      fileName: TestUser.envFileName,
      timestamp: Date.now(),
      size: 100,
    },
    {
      applicationName: 'app2',
      fileName: 'sample.yaml',
      timestamp: Date.now(),
      size: 100,
    },
    {
      applicationName: 'app2',
      fileName: TestUser.envFileName,
      timestamp: Date.now(),
      size: 100,
    },
  ];
  const apps = ['app1', 'app2', 'app3'];

  it('should init EditorComponent with edit file mode', () => {
    ctx().activatedRouteStub.snapshot = {
      data: {
        inEditMode: true,
        inEnvMode: false
      },
      paramMap: convertToParamMap({
        appName: 'app1',
        fileName: 'sample.yaml'
      })
    };
    ctx().detectChanges();

    expect(ctx().component.filename.disabled).toBeTruthy();
  });

  it('should init EditorComponent with new file mode', () => {
    ctx().activatedRouteStub.snapshot = {
      data: {
        inEditMode: false,
        inEnvMode: false
      },
      paramMap: convertToParamMap({
        appName: 'app1',
      })
    };
    ctx().detectChanges();

    expect(ctx().component.filename.disabled).toBeFalsy();
  });

  it('should prevent to leave page', () => {
    const event: any = {};

    ctx().component.isPageDirty = false;
    ctx().component.onLeavePage(event);
    expect(event.returnValue).toBeFalsy();
    expect(ctx().component.canDeactivate()).toBeTruthy();

    ctx().component.isPageDirty = true;
    ctx().component.onLeavePage(event);
    expect(event.returnValue).toBeTruthy();

    ctx().component.canDeactivate();
    assertDialogOpened(ConfirmationDialogComponent, {
      data: {
        confirmationText: 'There may be unsaved changes. Are you sure you want to navigate?'
      }
    });
  });

  it('should change file name', () => {
    ctx().activatedRouteStub.snapshot = {
      data: {
        inEditMode: false,
        inEnvMode: false
      },
      paramMap: convertToParamMap({
        appName: 'app1',
      })
    };
    ctx().detectChanges();

    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/files`).flush(files);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications`).flush(apps);

    ctx().component.filename.setValue('new.yaml');
    ctx().component.fileNameChange();
    expect(ctx().component.filename.valid).toBeTruthy();
  });

  it('should not change to existing file name', () => {
    ctx().activatedRouteStub.snapshot = {
      data: {
        inEditMode: false,
        inEnvMode: false
      },
      paramMap: convertToParamMap({
        appName: 'app1',
      })
    };
    ctx().detectChanges();

    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/files`).flush(files);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications`).flush(apps);

    ctx().component.filename.setValue('sample.yaml');
    ctx().component.fileNameChange();
    expect(ctx().component.filename.valid).toBeFalsy();
  });

  it('should save draft when editing file', () => {
    ctx().activatedRouteStub.snapshot = {
      data: {
        inEditMode: true,
        inEnvMode: false
      },
      paramMap: convertToParamMap({
        appName: 'app1',
        fileName: 'sample.yaml'
      })
    };
    ctx().detectChanges();

    const config = {
      default: { $type: 'object' },
      environments: { $type: 'object' }
    };
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/files`).flush(files);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications`).flush(apps);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications/app1/environments`).flush(['dev', 'qat']);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications/app1/files/sample.yaml`).flush(config);

    ctx().component.saveConfig();

    expect(ctx().routerStub.value).toEqual(['/dashboard']);
  });

  it('should save draft when adding new file', () => {
    ctx().activatedRouteStub.snapshot = {
      data: {
        inEditMode: false,
        inEnvMode: false
      },
      paramMap: convertToParamMap({
        appName: 'app1',
      })
    };
    ctx().detectChanges();

    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/files`).flush(files);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications`).flush(apps);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications/app1/environments`).flush(['dev', 'qat']);

    ctx().component.filename.setValue('new');
    ctx().component.saveConfig();

    expect(ctx().routerStub.value).toEqual(['/dashboard']);
  });

  it('should commit new file', () => {
    ctx().activatedRouteStub.snapshot = {
      data: {
        inEditMode: false,
        inEnvMode: false
      },
      paramMap: convertToParamMap({
        appName: 'app1',
      })
    };
    ctx().detectChanges();

    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/files`).flush(files);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications`).flush(apps);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications/app1/environments`).flush(['dev', 'qat']);

    ctx().component.filename.setValue('new');
    ctx().component.commitFile();

    assertDialogOpened(CommitDialogComponent, undefined);
    ctx().dialogStub.output.next('commit message');


    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/commit`).flush({
      fileName: 'new.yaml',
      applicationName: 'app1',
      timestamp: Date.now(),
      size: 100
    });
    expect(ctx().routerStub.value).toEqual(['/dashboard']);
  });

  it('should view compiled yaml code', async () => {
    const config = {
      'default': {
        'dcp.host': {
          '$type': 'string',
          '$value': 'prod.dcp.com'
        },
        'size': {
          '$type': 'number',
          '$value': 10
        },
        'sort': {
          '$type': 'boolean',
          '$value': true
        },
        'api': {
          '$type': 'object',
          'urls': {
            '$type': 'object',
            'dcpcart': {
              '$type': 'string',
              '$value': '_{dcp.host}_/api/cart?size=_{size}_&sort=_{sort}_'
            },
            'dcpupdate': {
              '$type': 'string',
              '$value': '_{dcp.host}_/api/update?size=_{size}_&sort=_{sort}_'
            },
          },
        }
      },
      'environments': {
        'dev': {
          'size': {
            '$type': 'number',
            '$value': 20
          },
          '$type': 'object'
        },
        'qat': {
          'inherits' : {
            '$type': 'string',
            '$value': 'dev'
          },
          'sort': {
            '$type': 'boolean',
            '$value': false
          },
          '$type': 'object'
        },
        '$type': 'object'
      }
    };
    ctx().store.dispatch(new ConfigurationChange(config));

    ctx().component.showCompiledYAML('dev');
    let editorState = await ctx().store.pipe(select(appStore.editorState), take(1)).toPromise();
    expect(editorState.previewCode).toEqual(`dcp.host: !!str "prod.dcp.com"
size: !!int 20
sort: !!bool true
api: !!map
  urls: !!map
    dcpcart: !!str "prod.dcp.com/api/cart?size=20&sort=true"
    dcpupdate: !!str "prod.dcp.com/api/update?size=20&sort=true"
`);

    ctx().component.showCompiledYAML('qat');
    editorState = await ctx().store.pipe(select(appStore.editorState), take(1)).toPromise();
    expect(editorState.previewCode).toEqual(`dcp.host: !!str "prod.dcp.com"
size: !!int 20
sort: !!bool false
api: !!map
  urls: !!map
    dcpcart: !!str "prod.dcp.com/api/cart?size=20&sort=false"
    dcpupdate: !!str "prod.dcp.com/api/update?size=20&sort=false"
`);
  });