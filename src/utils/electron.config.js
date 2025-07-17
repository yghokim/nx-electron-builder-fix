"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElectronWebpackConfig = getElectronWebpackConfig;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const webpack_merge_1 = require("webpack-merge");
const webpack_node_externals_1 = tslib_1.__importDefault(require("webpack-node-externals"));
const terser_webpack_plugin_1 = tslib_1.__importDefault(require("terser-webpack-plugin"));
const config_1 = require("./config");
function getElectronPartial(options) {
    const webpackConfig = {
        output: {
            libraryTarget: 'commonjs',
        },
        target: 'electron-main',
        node: false,
    };
    if (options.optimization) {
        webpackConfig.optimization = {
            minimize: false,
            concatenateModules: false,
        };
    }
    if (options.obfuscate) {
        const obfuscationOptimization = {
            minimize: true,
            minimizer: [
                new terser_webpack_plugin_1.default({
                    // Exclude uglification for the `vendor` chunk
                    // chunkFilter: (chunk) => chunk.name !== 'vendor', // use test/include/exclude options instead
                    exclude: /node_modules/,
                    parallel: true,
                    terserOptions: {
                        mangle: true,
                        keep_fnames: false,
                        toplevel: true,
                        output: {
                            comments: false,
                        },
                    },
                }),
            ],
        };
        if (webpackConfig.optimization) {
            webpackConfig.optimization = Object.assign(webpackConfig.optimization, obfuscationOptimization);
        }
        else {
            webpackConfig.optimization = obfuscationOptimization;
        }
    }
    if (options.externalDependencies === 'all') {
        const modulesDir = `${devkit_1.workspaceRoot}/node_modules`;
        webpackConfig.externals = [(0, webpack_node_externals_1.default)({ modulesDir })];
    }
    else if (Array.isArray(options.externalDependencies)) {
        webpackConfig.externals = [
            function (context, callback) {
                if (options.externalDependencies.includes(context.request)) {
                    // not bundled
                    return callback(null, `commonjs ${context.request}`);
                }
                // bundled
                callback();
            },
        ];
    }
    return webpackConfig;
}
function getElectronWebpackConfig(options) {
    return (0, webpack_merge_1.merge)([(0, config_1.getBaseWebpackPartial)(options), getElectronPartial(options)]);
}
//# sourceMappingURL=electron.config.js.map