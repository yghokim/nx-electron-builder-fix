import { ExecutorContext } from '@nx/devkit';
import { Configuration, PublishOptions } from 'electron-builder';
export interface PackageElectronBuilderOptions extends Configuration {
    name: string;
    frontendProject: string;
    extraProjects: string[];
    platform: string | string[];
    arch: string;
    root: string;
    prepackageOnly: boolean;
    sourcePath: string;
    outputPath: string;
    publishPolicy?: PublishOptions['publish'];
    makerOptionsPath?: string;
}
export interface PackageElectronBuilderOutput {
    target?: any;
    success: boolean;
    outputPath: string | string[];
}
export declare function executor(rawOptions: PackageElectronBuilderOptions, context: ExecutorContext): Promise<{
    success: boolean;
}>;
export default executor;
