/**
 * Injects NitroModules pod into the app's Podfile so bare React Native apps
 * don't need to add react-native-nitro-modules as a direct dependency.
 * (Nitro is bundled with this package; it may live in our node_modules.)
 */
const path = require('path');
const fs = require('fs');

const NITRO_NAME = 'react-native-nitro-modules';
const POD_ANCHOR = 'config = use_native_modules!';

function findAppRoot(startDir) {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 12; i++) {
    const podfilePath = path.join(dir, 'ios', 'Podfile');
    if (fs.existsSync(podfilePath)) return path.resolve(dir);
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  dir = path.resolve(startDir);
  for (let i = 0; i < 12; i++) {
    const packagePath = path.join(dir, 'package.json');
    if (fs.existsSync(packagePath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        if (pkg.workspaces) {
          const appsDir = path.join(dir, 'apps');
          if (fs.existsSync(appsDir)) {
            const entries = fs.readdirSync(appsDir, { withFileTypes: true });
            const found = [];
            for (const e of entries) {
              if (e.isDirectory()) {
                const appRoot = path.resolve(appsDir, e.name);
                if (fs.existsSync(path.join(appRoot, 'ios', 'Podfile'))) found.push(appRoot);
              }
            }
            if (found.length) return found;
          }
        }
      } catch (_) {}
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function getNitroModulesPath(appRoot, packageRoot) {
  const hoisted = path.join(appRoot, 'node_modules', NITRO_NAME);
  if (fs.existsSync(path.join(hoisted, 'NitroModules.podspec'))) return hoisted;

  const nested = path.join(packageRoot, 'node_modules', NITRO_NAME);
  if (fs.existsSync(path.join(nested, 'NitroModules.podspec'))) return nested;

  const rootModules = path.join(appRoot, '..', '..', 'node_modules', NITRO_NAME);
  if (fs.existsSync(path.join(rootModules, 'NitroModules.podspec'))) return path.resolve(rootModules);

  return null;
}

function main() {
  const packageRoot = path.resolve(__dirname, '..');
  const result = findAppRoot(packageRoot);
  const appRoots = result ? (Array.isArray(result) ? result : [result]) : [];
  for (const appRoot of appRoots) {
    const nitroPath = getNitroModulesPath(appRoot, packageRoot);
    if (!nitroPath) continue;

    const podfilePath = path.join(appRoot, 'ios', 'Podfile');
    let contents = fs.readFileSync(podfilePath, 'utf8');
    if (contents.includes("pod 'NitroModules'")) continue;
    if (contents.includes('use_expo_modules!')) continue;

    const platformRoot = path.join(appRoot, 'ios');
    const relativePath = path.relative(platformRoot, nitroPath).split(path.sep).join('/');
    const podLine = `  pod 'NitroModules', :path => '${relativePath}'`;
    const insertBlock = `\n\n  # NitroModules (bundled with @enginnblt/react-native-nitro-contacts)\n${podLine}`;
    const anchorRegex = new RegExp(
      '(' + POD_ANCHOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')(.*)$',
      'm'
    );
    contents = contents.replace(anchorRegex, (match, anchor, trailing) => {
      return anchor + (trailing || '') + insertBlock;
    });
    fs.writeFileSync(podfilePath, contents);
  }
}

try {
  main();
} catch (err) {
  console.error('[react-native-nitro-contacts] inject-nitro-ios:', err.message);
}
