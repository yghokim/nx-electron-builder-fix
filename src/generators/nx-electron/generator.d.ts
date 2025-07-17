import { GeneratorCallback, Tree } from '@nx/devkit';
import { Schema } from './schema';
export interface NormalizedSchema extends Schema {
    appProjectRoot: string;
    parsedTags: string[];
}
export declare function generator(tree: Tree, schema: Schema): Promise<GeneratorCallback>;
export default generator;
