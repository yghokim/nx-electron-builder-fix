"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWebpack = runWebpack;
const tslib_1 = require("tslib");
const webpack_1 = tslib_1.__importDefault(require("webpack"));
const rxjs_1 = require("rxjs");
function runWebpack(config) {
    return new rxjs_1.Observable((subscriber) => {
        // Passing `watch` option here will result in a warning due to missing callback.
        // We manually call `.watch` or `.run` later so this option isn't needed here.
        const { watch } = config, normalizedConfig = tslib_1.__rest(config, ["watch"]);
        const webpackCompiler = (0, webpack_1.default)(normalizedConfig);
        const callback = (err, stats) => {
            if (err) {
                subscriber.error(err);
            }
            subscriber.next(stats);
        };
        if (config.watch) {
            const watchOptions = config.watchOptions || {};
            const watching = webpackCompiler.watch(watchOptions, callback);
            return () => watching.close(() => subscriber.complete());
        }
        else {
            webpackCompiler.run((err, stats) => {
                callback(err, stats);
                webpackCompiler.close((closeErr) => {
                    if (closeErr)
                        subscriber.error(closeErr);
                    subscriber.complete();
                });
            });
        }
    });
}
//# sourceMappingURL=run-webpack.js.map