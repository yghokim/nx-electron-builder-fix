"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executor = executor;
const path_1 = require("path");
const operators_1 = require("rxjs/operators");
// eslint-disable-next-line @nx/enforce-module-boundaries
const rxjs_for_await_1 = require("rxjs-for-await");
const fs_1 = require("fs");
const devkit_1 = require("@nx/devkit");
const run_webpack_1 = require("../../utils/run-webpack");
const buildable_libs_utils_1 = require("@nx/js/src/utils/buildable-libs-utils");
const electron_config_1 = require("../../utils/electron.config");
const normalize_1 = require("../../utils/normalize");
const workspace_1 = require("../../utils/workspace");
const config_1 = require("../../utils/config");
const js_1 = require("@nx/js");
function executor(rawOptions, context) {
    const { sourceRoot, projectRoot } = (0, workspace_1.getSourceRoot)(context);
    const normalizedOptions = (0, normalize_1.normalizeBuildOptions)(rawOptions, context.root, sourceRoot, projectRoot);
    const projGraph = context.projectGraph;
    if (!normalizedOptions.buildLibsFromSource) {
        const { target, dependencies } = (0, buildable_libs_utils_1.calculateProjectDependencies)(projGraph, context.root, context.projectName, context.targetName, context.configurationName);
        normalizedOptions.tsConfig = (0, buildable_libs_utils_1.createTmpTsConfig)(normalizedOptions.tsConfig, context.root, target.data.root, dependencies);
    }
    if (normalizedOptions.generatePackageJson) {
        const packageJsonContent = (0, js_1.createPackageJson)(context.projectName, projGraph, Object.assign(Object.assign({}, normalizedOptions), { 'isProduction': true }));
        (0, devkit_1.writeJsonFile)((0, path_1.join)(normalizedOptions.outputPath, 'package.json'), packageJsonContent);
    }
    let config = (0, electron_config_1.getElectronWebpackConfig)(normalizedOptions);
    if (normalizedOptions.webpackConfig) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        config = require(normalizedOptions.webpackConfig)(config, {
            normalizedOptions,
            configuration: context.configurationName,
        });
    }
    try {
        const preloadFilesDirectory = (0, path_1.join)(normalizedOptions.sourceRoot, 'app/api');
        (0, fs_1.readdirSync)(preloadFilesDirectory, { withFileTypes: true })
            .filter((entry) => entry.isFile() && entry.name.match(/(.+[.])?preload.ts/))
            .forEach((entry) => (config.entry[(0, path_1.parse)(entry.name).name] = (0, path_1.resolve)(preloadFilesDirectory, entry.name)));
    }
    catch (error) {
        console.warn('Failed to load preload scripts');
    }
    return (0, rxjs_for_await_1.eachValueFrom)((0, run_webpack_1.runWebpack)(config).pipe((0, operators_1.tap)((stats) => {
        console.info(stats.toString(config.stats));
    }), (0, operators_1.map)((stats) => {
        return {
            success: !stats.hasErrors(),
            outfile: (0, path_1.resolve)(context.root, normalizedOptions.outputPath, config_1.MAIN_OUTPUT_FILENAME),
        };
    })));
}
exports.default = executor;
//# sourceMappingURL=executor.js.map