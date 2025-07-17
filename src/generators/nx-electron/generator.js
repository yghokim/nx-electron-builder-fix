"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generator = generator;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const path_1 = require("path");
const eslint_1 = require("@nx/eslint");
const jest_1 = require("@nx/jest");
const generator_1 = require("../init/generator");
function getBuildConfig(project, options) {
    return {
        executor: 'nx-electron:build',
        outputs: ['{options.outputPath}'],
        options: {
            outputPath: (0, devkit_1.joinPathFragments)('dist', options.appProjectRoot),
            main: (0, devkit_1.joinPathFragments)(project.sourceRoot, 'main.ts'),
            tsConfig: (0, devkit_1.joinPathFragments)(options.appProjectRoot, 'tsconfig.app.json'),
            assets: [(0, devkit_1.joinPathFragments)(project.sourceRoot, 'assets')],
        },
        configurations: {
            production: {
                optimization: true,
                extractLicenses: true,
                inspect: false,
                fileReplacements: [
                    {
                        replace: (0, devkit_1.joinPathFragments)(project.sourceRoot, 'environments/environment.ts'),
                        with: (0, devkit_1.joinPathFragments)(project.sourceRoot, 'environments/environment.prod.ts'),
                    },
                ],
            },
        },
    };
}
function getServeConfig(options) {
    return {
        executor: 'nx-electron:execute',
        options: {
            buildTarget: `${options.name}:build`,
        },
    };
}
function getPackageConfig(options) {
    return {
        executor: 'nx-electron:package',
        options: {
            name: options.name,
            frontendProject: options.frontendProject || '',
            sourcePath: 'dist/apps',
            outputPath: 'dist/packages',
            prepackageOnly: true,
        },
    };
}
function getMakeConfig(options) {
    return {
        executor: 'nx-electron:make',
        options: {
            name: options.name,
            frontendProject: options.frontendProject || '',
            sourcePath: 'dist/apps',
            outputPath: 'dist/executables',
        },
    };
}
function addProject(tree, options) {
    const project = {
        root: options.appProjectRoot,
        sourceRoot: (0, devkit_1.joinPathFragments)(options.appProjectRoot, 'src'),
        projectType: 'application',
        targets: {},
    };
    project.targets.build = getBuildConfig(project, options);
    project.targets.serve = getServeConfig(options);
    project.targets.package = getPackageConfig(options);
    project.targets.make = getMakeConfig(options);
    (0, devkit_1.addProjectConfiguration)(tree, options.name, project);
    const nxJsonConfiguration = (0, devkit_1.readNxJson)(tree);
    if (!nxJsonConfiguration.defaultProject) {
        nxJsonConfiguration.defaultProject = options.name;
        (0, devkit_1.updateNxJson)(tree, nxJsonConfiguration);
    }
}
function updateConstantsFile(tree, options) {
    const rendererAppName = !options.frontendProject
        ? ''
        : options.frontendProject;
    tree.write((0, path_1.join)(options.appProjectRoot, 'src/app/constants.ts'), (0, devkit_1.stripIndents) `export const rendererAppPort = 4200;
    export const rendererAppName = '${rendererAppName}';                        // options.name.split('-')[0] + '-web'
    export const electronAppName = '${options.name}';
    export const updateServerUrl = 'https://deployment-server-url.com';         // TODO: insert your update server url here
    `);
}
function addAppFiles(tree, options) {
    (0, devkit_1.generateFiles)(tree, (0, path_1.join)(__dirname, './files/app'), options.appProjectRoot, {
        tmpl: '',
        name: options.name,
        root: options.appProjectRoot,
        offset: (0, devkit_1.offsetFromRoot)(options.appProjectRoot),
    });
}
function addProxy(tree, options) {
    const projectConfig = (0, devkit_1.readProjectConfiguration)(tree, options.frontendProject);
    if (projectConfig.targets && projectConfig.targets.serve) {
        const pathToProxyFile = `${projectConfig.root}/proxy.conf.json`;
        projectConfig.targets.serve.options = Object.assign(Object.assign({}, projectConfig.targets.serve.options), { proxyConfig: pathToProxyFile });
        if (!tree.exists(pathToProxyFile)) {
            tree.write(pathToProxyFile, JSON.stringify({
                '/api': {
                    target: `http://localhost:${options.proxyPort || 3000}`,
                    secure: false,
                },
            }, null, 2));
        }
        else {
            //add new entry to existing config
            const proxyFileContent = tree.read(pathToProxyFile).toString();
            const proxyModified = Object.assign(Object.assign({}, JSON.parse(proxyFileContent)), { [`/${options.name}-api`]: {
                    target: `http://localhost:${options.proxyPort || 3000}`,
                    secure: false,
                } });
            tree.write(pathToProxyFile, JSON.stringify(proxyModified, null, 2));
        }
        (0, devkit_1.updateProjectConfiguration)(tree, options.frontendProject, projectConfig);
    }
}
function addLintingToApplication(tree, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const lintTask = yield (0, eslint_1.lintProjectGenerator)(tree, {
            linter: options.linter,
            project: options.name,
            tsConfigPaths: [
                (0, devkit_1.joinPathFragments)(options.appProjectRoot, 'tsconfig.app.json'),
            ],
            eslintFilePatterns: [`${options.appProjectRoot}/**/*.ts`],
            skipFormat: true,
            setParserOptionsProject: options.setParserOptionsProject,
        });
        return lintTask;
    });
}
function generator(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = normalizeOptions(tree, schema);
        const tasks = [];
        const initTask = yield (0, generator_1.generator)(tree, Object.assign(Object.assign({}, options), { skipFormat: true }));
        tasks.push(initTask);
        addAppFiles(tree, options);
        updateConstantsFile(tree, options);
        addProject(tree, options);
        if (options.linter !== eslint_1.Linter.None) {
            const lintTask = yield addLintingToApplication(tree, Object.assign(Object.assign({}, options), { skipFormat: true }));
            tasks.push(lintTask);
        }
        if (options.unitTestRunner === 'jest') {
            const jestTask = yield (0, jest_1.jestProjectGenerator)(tree, {
                project: options.name,
                setupFile: 'none',
                skipSerializers: true,
                supportTsx: false,
                babelJest: false,
                testEnvironment: 'node',
                skipFormat: true,
            });
            tasks.push(jestTask);
        }
        if (options.frontendProject) {
            addProxy(tree, options);
        }
        if (!options.skipFormat) {
            yield (0, devkit_1.formatFiles)(tree);
        }
        return (0, devkit_1.runTasksInSerial)(...tasks);
    });
}
function normalizeOptions(host, options) {
    var _a, _b;
    const { appsDir } = (0, devkit_1.getWorkspaceLayout)(host);
    const appDirectory = options.directory
        ? `${(0, devkit_1.names)(options.directory).fileName}/${(0, devkit_1.names)(options.name).fileName}`
        : (0, devkit_1.names)(options.name).fileName;
    const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');
    const appProjectRoot = (0, devkit_1.joinPathFragments)(appsDir, appDirectory);
    const parsedTags = options.tags
        ? options.tags.split(',').map((s) => s.trim())
        : [];
    return Object.assign(Object.assign({}, options), { name: (0, devkit_1.names)(appProjectName).fileName, frontendProject: options.frontendProject
            ? (0, devkit_1.names)(options.frontendProject).fileName
            : undefined, appProjectRoot,
        parsedTags, linter: (_a = options.linter) !== null && _a !== void 0 ? _a : eslint_1.Linter.EsLint, unitTestRunner: (_b = options.unitTestRunner) !== null && _b !== void 0 ? _b : 'jest' });
}
exports.default = generator;
//# sourceMappingURL=generator.js.map