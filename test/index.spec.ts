import { Architect } from "@angular-devkit/architect";
import { WorkspaceNodeModulesArchitectHost } from "@angular-devkit/architect/node";
import { TestingArchitectHost, TestProjectHost } from "@angular-devkit/architect/testing";
import { experimental, logging, normalize, schema, virtualFs } from "@angular-devkit/core";
import { NodeJsSyncHost } from "@angular-devkit/core/node";
import * as fs from "fs";
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
		const vfHost = new NodeJsSyncHost();
		const configPath = path.join(workspaceRoot, "angular.json");
		const configContent = fs.readFileSync(configPath, "utf-8");
		const workspaceJson = JSON.parse(configContent);

		const registry = new schema.CoreSchemaRegistry();
		registry.addPostTransform(schema.transforms.addUndefinedDefaults);

		const workspace = new experimental.workspace.Workspace(normalize(workspaceRoot), vfHost);
		await workspace.loadWorkspaceFromJson(workspaceJson).toPromise();

		testArchitectHost = new TestingArchitectHost(
			workspaceRoot,
			workspaceRoot,
			new WorkspaceNodeModulesArchitectHost(workspace, workspaceRoot)
		);
		architect = new Architect(testArchitectHost, registry);
		await host.initialize().toPromise();
	});

	afterEach(async () => host.restore().toPromise());

	it("should be successful when there is no lint error", async () => {
		const run = await architect.scheduleTarget(stylelintTargetSpec);
		const output = await run.result;
		expect(output.success).toBe(true);
		await run.stop();
	});

	xit("should not be successful when there is a lint error", async () => {
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

	xit("should support fix of lint issues", async () => {
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

	xit("should support force success", async () => {
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
