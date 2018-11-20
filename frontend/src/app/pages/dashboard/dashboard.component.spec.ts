import { Sort } from '@angular/material';
import * as _ from 'lodash';

import { LoginSuccess } from 'store/actions/auth.actions';
import { API_BASE_URL } from 'services/http-helper.service';
import { TestUser, Setup } from 'test/test-helper';

import { DashboardComponent } from './dashboard.component';
import { LoadFiles, ListApplications } from 'store/actions/backend.actions';
import { ConfigFile } from 'models/config-file';

describe('DashboardComponent', () => {

  const url = `repos/${TestUser.repoName}/branches/${TestUser.branchName}`;

  const ctx = Setup(DashboardComponent, [new LoginSuccess(TestUser), new LoadFiles(), new ListApplications()]);

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

  beforeEach(() => {
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/files`).flush(files);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications`).flush(apps);
  });

  it('should create DashboardComponent', () => {
    expect(ctx().component).toBeTruthy();
    expect(ctx().component.envFileName).toEqual(TestUser.envFileName);
    ctx().component.ngOnDestroy();
    expect(ctx().component.foldersSub.closed).toBeTruthy();
  });

  it('should show apps and files properly', () => {
    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app1',
      },
      {
        app: 'app1',
        appFile: files[1],
      },
      {
        app: 'app1',
        appFile: files[0],
      },
      {
        app: 'app2',
      },
      {
        app: 'app2',
        appFile: files[3],
      },
      {
        app: 'app2',
        appFile: files[2],
      },
      {
        app: 'app3',
      },
    ]);
  });

  it('should expand/collapse application', () => {
    ctx().component.toggleApp('app1');
    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app1',
      },
      {
        app: 'app2',
      },
      {
        app: 'app2',
        appFile: files[3],
      },
      {
        app: 'app2',
        appFile: files[2],
      },
      {
        app: 'app3',
      },
    ]);

    ctx().component.toggleApp('app1');
    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app1',
      },
      {
        app: 'app1',
        appFile: files[1],
      },
      {
        app: 'app1',
        appFile: files[0],
      },
      {
        app: 'app2',
      },
      {
        app: 'app2',
        appFile: files[3],
      },
      {
        app: 'app2',
        appFile: files[2],
      },
      {
        app: 'app3',
      },
    ]);
  });

  it('should expand/collapse all applications', () => {
    ctx().component.toggleAllApps(new Event('click'));
    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app1',
      },
      {
        app: 'app2',
      },
      {
        app: 'app3',
      },
    ]);

    ctx().component.toggleAllApps(new Event('click'));
    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app1',
      },
      {
        app: 'app1',
        appFile: files[1],
      },
      {
        app: 'app1',
        appFile: files[0],
      },
      {
        app: 'app2',
      },
      {
        app: 'app2',
        appFile: files[3],
      },
      {
        app: 'app2',
        appFile: files[2],
      },
      {
        app: 'app3',
      },
    ]);
  });

  it('should only show selected application', () => {
    ctx().component.onSelectApp({value: 'app1'});
    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app1',
      },
      {
        app: 'app1',
        appFile: files[1],
      },
      {
        app: 'app1',
        appFile: files[0],
      },
    ]);

    ctx().component.onSelectApp({value: 'app2'});
    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app2',
      },
      {
        app: 'app2',
        appFile: files[3],
      },
      {
        app: 'app2',
        appFile: files[2],
      },
    ]);

    ctx().component.onSelectApp({value: 'app3'});
    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app3',
      }
    ]);
  });

  it('should sort by application/file name properly', () => {
    let sort: Sort = {
      active: 'applicationName',
      direction: 'desc'
    };
    ctx().component.onSortChange(sort);

    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app3',
      },
      {
        app: 'app2',
      },
      {
        app: 'app2',
        appFile: files[3],
      },
      {
        app: 'app2',
        appFile: files[2],
      },
      {
        app: 'app1',
      },
      {
        app: 'app1',
        appFile: files[1],
      },
      {
        app: 'app1',
        appFile: files[0],
      },
    ]);

    sort = {
      active: 'fileName',
      direction: 'desc'
    };
    ctx().component.onSortChange(sort);

    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app3',
      },
      {
        app: 'app2',
      },
      {
        app: 'app2',
        appFile: files[2],
      },
      {
        app: 'app2',
        appFile: files[3],
      },
      {
        app: 'app1',
      },
      {
        app: 'app1',
        appFile: files[0],
      },
      {
        app: 'app1',
        appFile: files[1],
      },
    ]);
  });

  it('should navigate to add new file', () => {
    ctx().component.addNewFile();
    expect(_.pick(ctx().dialogStub.input.value.data, ['envFileName', 'applications', 'selectedApp'])).toEqual({
      envFileName: TestUser.envFileName,
      applications: apps,
      selectedApp: '',
    });

    ctx().dialogStub.output.next({createEnv: true, appName: 'app3'});
    expect(ctx().routerStub.value).toEqual(['/files/newenv', 'app3', TestUser.envFileName]);

    ctx().dialogStub.output.next({createEnv: false, appName: 'app2'});
    expect(ctx().routerStub.value).toEqual(['/files/new', 'app2']);
  });

  it('should navigate to edit file', () => {

    const file = {
      fileName: 'sample.yaml',
      applicationName: 'app1',
    };
    ctx().component.editFile(file);
    expect(ctx().routerStub.value).toEqual(['/files/edit', file.applicationName, file.fileName]);

    file.fileName = TestUser.envFileName;
    ctx().component.editFile(file);
    expect(ctx().routerStub.value).toEqual(['/files/editenv', file.applicationName, file.fileName]);
  });

  it('should successfully delete file', () => {

    const file = {
      fileName: 'sample.yaml',
      applicationName: 'app1',
      timestamp: Date.now()
    };

    const path = `${API_BASE_URL}/${url}/applications/${file.applicationName}/files/${file.fileName}`;
    ctx().component.deleteFile(file);
    ctx().dialogStub.output.next(false);
    ctx().httpMock.expectNone(path);

    ctx().component.deleteFile(file);
    ctx().dialogStub.output.next(true);
    expect(ctx().observables.isDeleting.value).toBeTruthy();
    ctx().httpMock.expectOne(path).flush({});
    expect(ctx().observables.isDeleting.value).toBeFalsy();

    // File should be removed
    expect(ctx().observables.folders.value.filter(f => f.appFile && f.appFile.fileName === file.fileName &&
      f.appFile.applicationName === file.applicationName).length).toEqual(0);

    // Alert should be shown
    expect(ctx().dialogStub.input.value.data.message).toEqual(
      `${file.applicationName} / ${file.fileName} deleted successfully.`);

    // Should reload from repo
    const newRepoFile = {
      applicationName: 'app2',
      fileName: TestUser.envFileName,
      timestamp: Date.now(),
      size: 100,
    };
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/files`).flush([newRepoFile]);
    ctx().httpMock.expectOne(`${API_BASE_URL}/${url}/applications`).flush(['app2']);

    expect(ctx().observables.folders.value).toEqual([
      {
        app: 'app2',
      },
      {
        app: 'app2',
        appFile: newRepoFile,
      },
    ]);
  });

  it('should show alert if failed to delete file', () => {

    const file = {
      fileName: 'sample.yaml',
      applicationName: 'app1',
      timestamp: Date.now()
    };

    const path = `${API_BASE_URL}/${url}/applications/${file.applicationName}/files/${file.fileName}`;
    ctx().component.deleteFile(file);
    ctx().dialogStub.output.next(true);

    expect(ctx().observables.isDeleting.value).toBeTruthy();
    ctx().httpMock.expectOne(path).flush(
      {
        message: 'Failed to delete file',
        statusCode: 500
      },
      {
        status: 500,
        statusText: 'Internal Server Error'
      }
    );
    expect(ctx().observables.isDeleting.value).toBeFalsy();

    expect(ctx().dialogStub.input.value.data.message).toEqual('Failed to delete file');
  });

  it('should commit changes', () => {
    const file = ctx().observables.folders.value[1].appFile;
    const modifiedFile: ConfigFile = {
      fileName: file.fileName,
      applicationName: file.applicationName,
      draftConfig: {
        default: {$type: 'object', key: {$value: 'value', $type: 'string'}},
        environments: {$type: 'object'}
      },
      modified: true,
      timestamp: Date.now(),
      size: 100
    };

    ctx().observables.folders.value[1].appFile = modifiedFile;

    ctx().component.commitChanges();

    ctx().dialogStub.output.next('commit message');

    const path = `${API_BASE_URL}/${url}/commit`;
    ctx().httpMock.expectOne(path).flush([
      _.pick(modifiedFile, ['fileName', 'applicationName', 'timestamp', 'size'])
    ]);

    const committedFile: ConfigFile = {
      ...modifiedFile,
      modified: false,
      originalConfig: modifiedFile.draftConfig
    };
    expect(ctx().observables.folders.value[1].appFile).toEqual(committedFile);
  });

});
