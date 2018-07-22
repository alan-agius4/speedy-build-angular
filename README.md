
# Angular CLI Stylelint builder

[![CircleCI](https://circleci.com/gh/alan-agius4/speedy-build-angular/tree/master.svg?style=svg)](https://circleci.com/gh/alan-agius4/speedy-build-angular/tree/master)
[![npm version](https://img.shields.io/npm/v/@speedy/build-angular.svg)](https://www.npmjs.com/package/@speedy/build-angular)
[![Dependency Status](https://img.shields.io/david/alan-agius4/speedy-build-angular.svg?style=flat-square)](https://david-dm.org/alan-agius4/speedy-build-angular)
[![devDependency Status](https://img.shields.io/david/dev/alan-agius4/speedy-build-angular.svg?style=flat-square)](https://david-dm.org/alan-agius4/speedy-build-angular?type=dev)

This is third party builder (not officially supported by Angular), for [Styelint](https://github.com/stylelint/stylelint) in Angular CLI.

## Get started

```bash
npm install @speedy/build-angular stylelint --save-dev
```

Open your `angular.json` and add the new builder example;

```json
"lint-styles": {
    "builder": "@speedy/build-angular:stylelint",
        "options": {
        "stylelintConfig": ".stylelintrc",
        "exclude": [
            "**/node_modules/**"
        ]
    }
}
```

More details about angular workspace can be found in the [Angular CLI docs](https://github.com/angular/angular-cli/wiki/angular-workspace).

To run the new builder use the following command;

```bash
ng run <project>:lint-styles
```