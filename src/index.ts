
import { BuilderContext, BuilderOutput, createBuilder } from "@angular-devkit/architect";
import { json } from "@angular-devkit/core";
import { readFileSync } from "fs";
import * as glob from "glob";
import * as path from "path";
import * as stylelint from "stylelint";

export interface StylelintBuilderOptions extends json.JsonObject {
	stylelintConfig: string;
	fix: boolean;
	force: boolean;
	format: stylelint.FormatterType;
	silent: boolean;
	exclude: string[];
	files: string[];
}

async function _run(
	options: StylelintBuilderOptions,
	context: BuilderContext
): Promise<BuilderOutput> {
	const systemRoot = context.workspaceRoot;
	const { stylelintConfig, format: formatter, fix, force, silent } = options;

	const config = stylelintConfig
		? JSON.parse(readFileSync(path.resolve(systemRoot, stylelintConfig), "utf-8"))
		: undefined;

	const result = await stylelint.lint({
		config,
		formatter,
		configBasedir: systemRoot,
		files: getFilesToLint(systemRoot, options),
		fix
	});

	if (!silent) {
		console.log(result.errored);
		if (result.errored) {
			context.logger.error("Lint errors found in the listed files.");
		} else {
			context.logger.info("All files pass linting.");
		}

		const errored = result.results.filter(x => x.errored);

		if (errored.length) {
			context.logger.info(stylelint.formatters.string(errored));
		}
	}

	return {
		success: force || !result.errored
	};
}

function getFilesToLint(root: string, options: StylelintBuilderOptions): string[] {
	const { files, exclude: ignore } = options;

	return files
		.map(file => glob.sync(file, { cwd: root, ignore, nodir: true }))
		.reduce((prev, curr) => prev.concat(curr), [])
		.map(file => path.join(root, file));
}

export default createBuilder<StylelintBuilderOptions>(_run);
