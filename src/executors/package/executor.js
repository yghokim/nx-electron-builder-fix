"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executor = executor;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const electron_builder_1 = require("electron-builder");
const fs_1 = require("fs");
const path_1 = require("path");
const util_1 = require("util");
const workspace_1 = require("../../utils/workspace");
const normalize_1 = require("../../utils/normalize");
const os_1 = require("os");
const strip_json_comments_1 = tslib_1.__importDefault(require("strip-json-comments"));
const writeFileAsync = (path, data) => (0, util_1.promisify)(fs_1.writeFile)(path, data, { encoding: 'utf8' });
function executor(rawOptions, context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        devkit_1.logger.warn((0, devkit_1.stripIndents) `
  *********************************************************
  DO NOT FORGET TO REBUILD YOUR FRONTEND & BACKEND PROJECTS
  FOR PRODUCTION BEFORE PACKAGING / MAKING YOUR ARTIFACT!
  *********************************************************`);
        let success = false;
        try {
            const { sourceRoot, projectRoot } = (0, workspace_1.getSourceRoot)(context);
            let options = (0, normalize_1.normalizePackagingOptions)(rawOptions, context.root, sourceRoot);
            options = mergePresetOptions(options);
            options = addMissingDefaultOptions(options);
            const platforms = _createPlatforms(options.platform);
            const targets = _createTargets(platforms, null, options.arch);
            const baseConfig = _createBaseConfig(options, context);
            const config = _createConfigFromOptions(options, baseConfig);
            const normalizedOptions = _normalizeBuilderOptions(targets, config, rawOptions);
            yield beforeBuild(options.root, options.sourcePath, options.name);
            yield (0, electron_builder_1.build)(normalizedOptions);
            success = true;
        }
        catch (error) {
            devkit_1.logger.error(error);
        }
        return { success };
    });
}
function beforeBuild(projectRoot, sourcePath, appName) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield writeFileAsync((0, path_1.join)(projectRoot, sourcePath, appName, 'index.js'), `const Main = require('./${appName}/main.js');`);
    });
}
function _createPlatforms(rawPlatforms) {
    const platforms = [];
    if (!rawPlatforms) {
        const platformMap = new Map([
            ['win32', 'windows'],
            ['darwin', 'mac'],
            ['linux', 'linux'],
        ]);
        rawPlatforms = platformMap.get((0, os_1.platform)());
    }
    if (typeof rawPlatforms === 'string') {
        rawPlatforms = [rawPlatforms];
    }
    if (Array.isArray(rawPlatforms)) {
        if (rawPlatforms.includes(electron_builder_1.Platform.WINDOWS.name)) {
            platforms.push(electron_builder_1.Platform.WINDOWS);
        }
        if (rawPlatforms.includes(electron_builder_1.Platform.MAC.name)) {
            platforms.push(electron_builder_1.Platform.MAC);
        }
        if (rawPlatforms.includes(electron_builder_1.Platform.LINUX.name)) {
            platforms.push(electron_builder_1.Platform.LINUX);
        }
    }
    return platforms;
}
function _createTargets(platforms, type, arch) {
    return (0, electron_builder_1.createTargets)(platforms, null, arch);
}
function _createBaseConfig(options, context) {
    const outputPath = options.prepackageOnly
        ? options.outputPath.replace('executables', 'packages')
        : options.outputPath;
    let files = options.files
        ? Array.isArray(options.files)
            ? options.files
            : [options.files]
        : Array();
    if (options.frontendProject && options.frontendProject != '') {
        files = files.concat([
            {
                from: (0, path_1.resolve)(options.sourcePath, options.frontendProject),
                to: options.frontendProject,
                filter: ['**/!(*.+(js|css).map)'],
            },
        ]);
    }
    if (options.extraProjects) {
        options.extraProjects.forEach((project) => {
            files = files.concat([
                {
                    from: (0, path_1.resolve)(options.sourcePath, project.trim()),
                    to: project,
                    filter: ['**/!(*.+(js|css).map)'],
                },
            ]);
        });
    }
    files.forEach((file) => {
        if (file && typeof file === 'object' && file.from && file.from.length > 0) {
            file.from = (0, path_1.resolve)(options.sourcePath, file.from);
        }
    });
    return {
        directories: Object.assign(Object.assign({}, options.directories), { output: (0, path_1.join)(context.root, outputPath) }),
        files: files.concat([
            './package.json',
            {
                from: (0, path_1.resolve)(options.sourcePath, options.name),
                to: options.name,
                filter: ['main.js', '?(*.)preload.js', 'assets'],
            },
            {
                from: (0, path_1.resolve)(options.sourcePath, options.name),
                to: '',
                filter: ['index.js', 'package.json'],
            },
            '!(**/*.+(js|css).map)',
        ]),
    };
}
function _createConfigFromOptions(options, baseConfig) {
    const config = Object.assign({}, options, baseConfig);
    delete config.name;
    delete config.frontendProject;
    delete config.extraProjects;
    delete config.platform;
    delete config.arch;
    delete config.root;
    delete config.prepackageOnly;
    delete config['sourceRoot'];
    delete config['$schema'];
    delete config['publishPolicy'];
    delete config.sourcePath;
    delete config.outputPath;
    delete config['makerOptionsPath'];
    return config;
}
function _normalizeBuilderOptions(targets, config, rawOptions) {
    const normalizedOptions = {
        config,
        publish: rawOptions.publishPolicy || null,
    };
    if (rawOptions.prepackageOnly) {
        normalizedOptions.dir = true;
    }
    else {
        normalizedOptions.targets = targets;
    }
    return normalizedOptions;
}
function mergePresetOptions(options) {
    // load preset options file
    const externalOptionsPath = options.makerOptionsPath
        ? (0, path_1.resolve)(options.root, options.makerOptionsPath)
        : (0, path_1.join)(options.root, options['sourceRoot'], 'app', 'options', 'maker.options.json');
    if ((0, fs_1.statSync)(externalOptionsPath).isFile()) {
        const rawData = (0, fs_1.readFileSync)(externalOptionsPath, 'utf8');
        const externalOptions = JSON.parse((0, strip_json_comments_1.default)(rawData));
        options = Object.assign(options, externalOptions);
    }
    return options;
}
function addMissingDefaultOptions(options) {
    // remove unset options (use electron builder default values where possible)
    Object.keys(options).forEach((key) => options[key] === '' && delete options[key]);
    return options;
}
exports.default = executor;
//# sourceMappingURL=executor.js.map