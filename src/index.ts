
import {
	Builder,
	BuilderConfiguration,
	BuilderContext,
	BuildEvent
} from "@angular-devkit/architect";
import { getSystemPath } from "@angular-devkit/core";
import { readFileSync } from "fs";
import * as glob from "glob";
import * as path from "path";
import { from, Observable } from "rxjs";
import { concatMap } from "rxjs/operators";
import * as stylelint from "stylelint";

export interface StylelintBuilderOptions {
	stylelintConfig: string;
	fix: boolean;
	force: boolean;
	format: stylelint.FormatterType;
	silent: boolean;
	exclude: string[];
	files: string[];
}

export default class StylelintBuilder implements Builder<StylelintBuilderOptions> {

	constructor(
		public context: BuilderContext
	) {
	}

	run(builderConfig: BuilderConfiguration<StylelintBuilderOptions>): Observable<BuildEvent> {
		const root = this.context.workspace.root;
		const systemRoot = getSystemPath(root);

		const { stylelintConfig, format: formatter, fix, force, silent } = builderConfig.options;

		const config = stylelintConfig
			? JSON.parse(readFileSync(path.resolve(systemRoot, stylelintConfig), "utf-8"))
			: undefined;

		return from(
			stylelint.lint({
				config,
				formatter,
				configBasedir: systemRoot,
				files: this.getFilesToLint(systemRoot, builderConfig.options),
				fix
			})
		)
			.pipe(
				concatMap(result => new Observable(obs => {
					if (!silent) {
						if (result.errored) {
							this.context.logger.error("Lint errors found in the listed files.");
						} else {
							this.context.logger.info("All files pass linting.");
						}

						const errored = result.results.filter(x => x.errored);

						if (errored.length) {
							this.context.logger.info(stylelint.formatters.string(errored));
						}
					}

					const success = force || !result.errored;
					obs.next({ success });

					return obs.complete();
				}))
			);
	}

	getFilesToLint(root: string, options: StylelintBuilderOptions): string[] {
		const { files, exclude: ignore } = options;

		return files
			.map(file => glob.sync(file, { cwd: root, ignore, nodir: true }))
			.reduce((prev, curr) => prev.concat(curr), [])
			.map(file => path.join(root, file));
	}
}