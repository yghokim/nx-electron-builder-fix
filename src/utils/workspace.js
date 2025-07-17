"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSourceRoot = getSourceRoot;
function getSourceRoot(context) {
    const { sourceRoot, root } = context.projectsConfigurations.projects[context.projectName];
    if (sourceRoot && root) {
        return { sourceRoot, projectRoot: root };
    }
    throw new Error('Project does not have a sourceRoot or root. Please define both.');
}
//# sourceMappingURL=workspace.js.map