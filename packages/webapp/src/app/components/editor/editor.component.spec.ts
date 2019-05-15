import { Setup, assertDialogOpened, TestContext, utilService } from "test/test-helper";
import * as _ from "lodash";
import { PROPERTY_VALUE_TYPES, appPercyConfig } from "config";
import { TreeNode } from "models/tree-node";
import { Configuration } from "models/config-file";
import { Alert } from "store/actions/common.actions";
import { PageLoadSuccess, ConfigurationChange } from "store/actions/editor.actions";
import { LoadFilesSuccess, GetFileContentSuccess } from "store/actions/backend.actions";
import { AlertDialogComponent } from "components/alert-dialog/alert-dialog.component";
import { EditorComponent } from "./editor.component";
describe("EditorComponent", () => {
    applicationName: "app1",
    fileName: "sample.yaml",
    oid: "111111",
  const applications = ["app1", "app2", "app3"];
    dispatchSpy = spyOn(ctx.store, "dispatch");
  it("should create EditorComponent", () => {
  it("should init EditorComponent with edit file mode", () => {
    ctx.component.appName = "app1";
    ctx.component.fileName = "test.yaml";
    ctx.component.environments = ["dev"];
    expect(ctx.component.filename.value).toEqual("test.yaml");
  it("should init EditorComponent with new file mode", async () => {
    ctx.component.appName = "app1";
    ctx.component.environments = ["dev"];
    const focusSpy = spyOn(ctx.component.fileNameInput, "focus");
    ctx.component.filename.setValue("");
    ctx.component.filename.setValue("new.yaml");
    applicationName: "app1",
    ctx.component.appName = "app1";
    ctx.component.environments = ["dev"];
    ctx.store.next(new PageLoadSuccess({ environments: ["dev"] }));
  it("should not change to existing file name", async () => {
    ctx.component.filename.setValue(file.fileName.replace("\.yaml", ""));
    expect(ctx.component.filename.hasError("alreadyExists")).toBeTruthy();
  it("should validate properly if file name is invalid", async () => {
    const focusSpy = spyOn(ctx.component.fileNameInput, "focus");
    ctx.component.filename.setValue("");
  it("should validate properly if yaml config is invalid", async () => {
    config.default.addChild(new TreeNode("key1", PROPERTY_VALUE_TYPES.STRING, utilService.constructVariable("key1")));
    config.environments.addChild(new TreeNode("dev"));
    ctx.component.filename.setValue("test.yaml");
      data: { message: `YAML validation failed:\nLoop variable reference: key1->key1`, alertType: "error" },
  it("should validate properly if file name and yaml config are valid", async () => {
    config.default.addChild(new TreeNode("key1", PROPERTY_VALUE_TYPES.STRING, "aaa"));
    config.default.addChild(new TreeNode("key2", PROPERTY_VALUE_TYPES.STRING, "bbb"));
    config.environments.addChild(new TreeNode("dev"));
    ctx.component.filename.setValue("test.yaml");
  it("select a leaf node should work", () => {
    const node = new TreeNode("key", PROPERTY_VALUE_TYPES.STRING, "value");
  it("select an object node should work", () => {
    const node = new TreeNode("obj", PROPERTY_VALUE_TYPES.OBJECT);
    node.addChild(new TreeNode("key", PROPERTY_VALUE_TYPES.STRING, "value"));
    expect(ctx.component.previewCode).toEqual("obj: !!map\n  key: !!str \"value\"");
  it("add/edit proprty should work", () => {
  it("open edit proprty should work", () => {
    const spy = jasmine.createSpyObj("", ["openEditPropertyDialog"]);
    const node = new TreeNode("key");
  it("save proprty should work", () => {
    const spy = jasmine.createSpyObj("", ["saveAddEditProperty"]);
    const node = new TreeNode("key");
  it("show compiled YAML should work", async () => {
    config.default.addChild(new TreeNode("key1", PROPERTY_VALUE_TYPES.STRING, "aaa"));
    config.default.addChild(new TreeNode("key2", PROPERTY_VALUE_TYPES.STRING, "bbb"));
    config.environments.addChild(new TreeNode("dev"));
    ctx.component.showCompiledYAML("dev");
    expect(ctx.component.previewCode).toEqual("key1: !!str \"aaa\"\nkey2: !!str \"bbb\"");
    expect(ctx.component.showAsCompiledYAMLEnvironment).toEqual("dev");
  it("show compiled YAML should alert error if yaml is invalid", async () => {
    config.default.addChild(new TreeNode("key1", PROPERTY_VALUE_TYPES.STRING, utilService.constructVariable("key1")));
    config.environments.addChild(new TreeNode("dev"));
    ctx.component.showCompiledYAML("dev");
      data: { message: "Loop variable reference: key1->key1", alertType: "error" },