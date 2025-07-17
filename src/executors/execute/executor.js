"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executor = executor;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const child_process_1 = require("child_process");
const util_1 = require("util");
const electron_1 = tslib_1.__importDefault(require("electron"));
const tree_kill_1 = tslib_1.__importDefault(require("tree-kill"));
let subProcess = null;
function executor(options, context) {
    return tslib_1.__asyncGenerator(this, arguments, function* executor_1() {
        var _a, e_1, _b, _c;
        process.on('SIGTERM', () => {
            subProcess === null || subProcess === void 0 ? void 0 : subProcess.kill();
            process.exit(128 + 15);
        });
        process.on('exit', (code) => {
            process.exit(code);
        });
        if (options.waitUntilTargets && options.waitUntilTargets.length > 0) {
            const results = yield tslib_1.__await(runWaitUntilTargets(options, context));
            for (const [i, result] of results.entries()) {
                if (!result.success) {
                    console.log('throw');
                    throw new Error(`Wait until target failed: ${options.waitUntilTargets[i]}.`);
                }
            }
        }
        try {
            for (var _d = true, _e = tslib_1.__asyncValues(startBuild(options, context)), _f; _f = yield tslib_1.__await(_e.next()), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const event = _c;
                if (!event.success) {
                    devkit_1.logger.error('There was an error with the build. See above.');
                    devkit_1.logger.info(`${event.outfile} was not restarted.`);
                }
                yield tslib_1.__await(handleBuildEvent(event, options));
                yield yield tslib_1.__await(event);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield tslib_1.__await(_b.call(_e));
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
}
function runProcess(event, options) {
    if (subProcess) {
        throw new Error('Already running');
    }
    subProcess = (0, child_process_1.spawn)(String(electron_1.default), normalizeArgs(event.outfile, options));
    subProcess.stdout.on('data', (data) => {
        devkit_1.logger.info(data.toString());
    });
    subProcess.stderr.on('data', (data) => {
        devkit_1.logger.error(data.toString());
    });
}
function normalizeArgs(file, options) {
    let args = [];
    if (options.inspect === true) {
        options.inspect = "inspect" /* InspectType.Inspect */;
    }
    if (options.inspect) {
        args.push(`--${options.inspect}=${options.port}`);
    }
    if (options.remoteDebuggingPort) {
        args.push(`--remote-debugging-port=${options.remoteDebuggingPort}`);
    }
    args.push(file);
    args = args.concat(options.args);
    return args;
}
function handleBuildEvent(event, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if ((!event.success || options.watch) && subProcess) {
            yield killProcess();
        }
        runProcess(event, options);
    });
}
function killProcess() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!subProcess) {
            return;
        }
        const promisifiedTreeKill = (0, util_1.promisify)(tree_kill_1.default);
        try {
            yield promisifiedTreeKill(subProcess.pid, 'SIGTERM');
        }
        catch (err) {
            if (Array.isArray(err) && err[0] && err[2]) {
                const errorMessage = err[2];
                devkit_1.logger.error(errorMessage);
            }
            else if (err.message) {
                devkit_1.logger.error(err.message);
            }
        }
        finally {
            subProcess = null;
        }
    });
}
function startBuild(options, context) {
    return tslib_1.__asyncGenerator(this, arguments, function* startBuild_1() {
        var _a, e_2, _b, _c;
        const buildTarget = (0, devkit_1.parseTargetString)(options.buildTarget, context.projectGraph);
        const buildOptions = (0, devkit_1.readTargetOptions)(buildTarget, context);
        if (buildOptions['optimization']) {
            devkit_1.logger.warn((0, devkit_1.stripIndents) `
            ************************************************
            This is a simple process manager for use in
            testing or debugging Electron applications locally.
            DO NOT USE IT FOR PRODUCTION!
            You should look into proper means of deploying
            your electron application to production.
            ************************************************`);
        }
        try {
            for (var _d = true, _e = tslib_1.__asyncValues(yield tslib_1.__await((0, devkit_1.runExecutor)(buildTarget, Object.assign(Object.assign({}, options.buildTargetOptions), { generatePackageJson: false, watch: options.watch }), context))), _f; _f = yield tslib_1.__await(_e.next()), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const buildEventResponse = _c;
                yield yield tslib_1.__await(buildEventResponse);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield tslib_1.__await(_b.call(_e));
            }
            finally { if (e_2) throw e_2.error; }
        }
    });
}
function runWaitUntilTargets(options, context) {
    return Promise.all(options.waitUntilTargets.map((waitUntilTarget) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const target = (0, devkit_1.parseTargetString)(waitUntilTarget, context.projectGraph);
        const output = yield (0, devkit_1.runExecutor)(target, {}, context);
        return new Promise((resolve) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            let event = yield output.next();
            // Resolve after first event
            resolve(event.value);
            // Continue iterating
            while (!event.done) {
                event = yield output.next();
            }
        }));
    })));
}
exports.default = executor;
//# sourceMappingURL=executor.js.map