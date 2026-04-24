import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');
const scriptsRoot = path.join(projectRoot, 'Canopy[BP]/scripts');

export async function resolve(specifier, context, nextResolve) {
    // Resolve bare path aliases used in BP scripts (lib/ and src/ map to Canopy[BP]/scripts/{lib,src}/)
    if (specifier.startsWith('lib/') || specifier.startsWith('src/')) {
        const resolved = path.join(scriptsRoot, specifier);
        const candidate = fs.existsSync(resolved) ? resolved : resolved + '.js';
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
    }
    // Redirect all @minecraft/* packages to mocks in __mocks__/@minecraft/
    if (specifier.startsWith('@minecraft/')) {
        const pkgName = specifier.slice('@minecraft/'.length);
        const mockPath = path.join(projectRoot, `__mocks__/@minecraft/${pkgName}.js`);
        if (fs.existsSync(mockPath)) {
            return { url: pathToFileURL(mockPath).href, shortCircuit: true };
        }
    }
    // Add .js extension for relative imports that resolve to no file (Minecraft BP scripts omit extensions,
    // and some files have multi-part names like foo.ipc.js that confuse path.extname)
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
        const parentDir = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : projectRoot;
        const resolved = path.resolve(parentDir, specifier);
        if (!fs.existsSync(resolved)) {
            const candidate = resolved + '.js';
            if (fs.existsSync(candidate)) {
                return { url: pathToFileURL(candidate).href, shortCircuit: true };
            }
        }
    }
    return nextResolve(specifier, context);
}
