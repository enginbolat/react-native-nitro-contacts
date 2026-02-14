const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

config.watchFolders = [
  workspaceRoot,
  projectRoot,
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react" || moduleName === "react-native") {
    const redirectPath = path.resolve(projectRoot, "node_modules", moduleName);

    return context.resolveRequest(
      { ...context, originModulePath: projectRoot },
      redirectPath,
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@enginnblt/react-native-nitro-contacts": path.resolve(
    workspaceRoot,
    "packages/react-native-nitro-contacts",
  ),
};

module.exports = config;
