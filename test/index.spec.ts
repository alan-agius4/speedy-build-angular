import { Architect } from "@angular-devkit/architect";
import { WorkspaceNodeModulesArchitectHost } from "@angular-devkit/architect/node";
import { TestingArchitectHost, TestProjectHost } from "@angular-devkit/architect/testing";
import { getSystemPath, logging, normalize, schema, virtualFs, workspaces } from "@angular-devkit/core";
import * as path from "path";

import { StylelintBuilderOptions } from "../src/index";

describe("Stylelint Target", () => {
	const filesWithErrors = { "src/foo.scss": "a { color: #ffffff }" };
	const stylelintTargetSpec = { project: "app", target: "lint" };
	let testArchitectHost: TestingArchitectHost;
	let architect: Architect;
	const workspaceRoot = path.join(__dirname, "hello-world-app");
	const host = new TestProjectHost(normalize(workspaceRoot));

	beforeEach(async () => {
		const registry = new schema.CoreSchemaRegistry();
		registry.addPostTransform(schema.transforms.addUndefinedDefaults);

		const { workspace } = await workspaces.readWorkspace(
			workspaceRoot,
			workspaces.createWorkspaceHost(host)
		);

		await host.initialize().toPromise();

		testArchitectHost = new TestingArchitectHost(
			getSystemPath(host.root()),
			getSystemPath(host.root()),
			new WorkspaceNodeModulesArchitectHost(workspace, workspaceRoot)
		);

		architect = new Architect(testArchitectHost, registry);
	});

	afterEach(async () => host.restore().toPromise());

	it("should be successful when there is no lint error", async () => {
		const run = await architect.scheduleTarget(stylelintTargetSpec);
		const output = await run.result;
		expect(output.success).toBe(true);
		await run.stop();
	});

	it("should not be successful when there is a lint error", async () => {
		host.writeMultipleFiles(filesWithErrors);
		const run = await architect.scheduleTarget(stylelintTargetSpec);
		const output = await run.result;
		expect(output.success).toBe(false);
		await run.stop();
	});

	it("should support exclude files", async () => {
		host.writeMultipleFiles(filesWithErrors);
		const overrides: Partial<StylelintBuilderOptions> = { exclude: ["**/foo.scss"] };
		const run = await architect.scheduleTarget(stylelintTargetSpec, overrides);
		const output = await run.result;
		expect(output.success).toBe(true);
		await run.stop();
	});

	it("should support fix of lint issues", async () => {
		host.writeMultipleFiles(filesWithErrors);
		const overrides: Partial<StylelintBuilderOptions> = { fix: true };
		const run = await architect.scheduleTarget(stylelintTargetSpec, overrides);
		const output = await run.result;
		expect(output.success).toBe(true);

		const fileName = normalize("src/foo.scss");
		const content = virtualFs.fileBufferToString(host.scopedSync().read(fileName));
		expect(content).toContain(`a { color: #fff }`);

		await run.stop();
	});

	it("should support force success", async () => {
		host.writeMultipleFiles(filesWithErrors);
		const logger = new logging.Logger("lint-force");
		const allLogs: string[] = [];
		logger.subscribe(entry => allLogs.push(entry.message));

		const overrides: Partial<StylelintBuilderOptions> = { force: true };
		const run = await architect.scheduleTarget(stylelintTargetSpec, overrides, { logger });
		const output = await run.result;
		expect(output.success).toBe(true);
		expect(allLogs.join(" ")).toContain("Lint errors found in the listed files");
		await run.stop();
	});
});
