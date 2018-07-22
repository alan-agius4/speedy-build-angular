module.exports = {
    bail: true,
    globals: {
        "ts-jest": {
            tsConfigFile: "./tsconfig.test.json"
        }
    },
    transform: {
        ".ts$": "ts-jest"
    },
    testRegex: ".*spec.ts$",
    moduleFileExtensions: [
        "ts",
        "js",
        "json"
    ],
    transformIgnorePatterns: [
        "/node_modules/",
        "/dist/",
    ],
    modulePathIgnorePatterns: [
        "/dist/",
        "/node_modules/"
    ],
    collectCoverageFrom: [
        "src/**/*.ts"
    ],
    coveragePathIgnorePatterns: [
        "*.spec.ts"
    ],
    coverageReporters: [
        "lcovonly",
        "html"
    ]
};