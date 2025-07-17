import { Tree } from '@nx/devkit';
import { Schema } from './schema';
export declare function generator(tree: Tree, schema: Schema): Promise<() => Promise<void>>;
export default generator;
