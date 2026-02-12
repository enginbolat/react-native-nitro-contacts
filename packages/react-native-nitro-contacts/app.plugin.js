const path = require('path')
const fs = require('fs')
const {
  withInfoPlist,
  withAndroidManifest,
  withDangerousMod,
} = require('@expo/config-plugins')

/**
 * Resolve path to react-native-nitro-modules (hoisted or nested under this package).
 */
function getNitroModulesPath(projectRoot) {
  const nitroName = 'react-native-nitro-modules'

  const hoisted = path.join(projectRoot, 'node_modules', nitroName)
  if (fs.existsSync(path.join(hoisted, 'NitroModules.podspec'))) {
    return hoisted
  }

  const nested = path.join(
    projectRoot,
    'node_modules',
    '@enginnblt',
    'react-native-nitro-contacts',
    'node_modules',
    nitroName
  )
  if (fs.existsSync(path.join(nested, 'NitroModules.podspec'))) {
    return nested
  }

  return null
}

/**
 * Expo config plugin for react-native-nitro-contacts.
 * - Injects contacts permission (iOS: NSContactsUsageDescription, Android: READ_CONTACTS).
 * - Injects NitroModules pod into Podfile so the app does not need to depend on it directly.
 */
function withNitroContacts(config, props) {
  const permissionText =
    props?.contactsPermissionText ??
    'This app needs access to your contacts to display them.'

  config = withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.NSContactsUsageDescription = permissionText
    return plistConfig
  })

  config = withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults.manifest

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = []
    }

    const permissions = manifest['uses-permission']
    const readContactsPerm = 'android.permission.READ_CONTACTS'

    const alreadyHas = permissions.some(
      (p) => p?.$?.['android:name'] === readContactsPerm
    )

    if (!alreadyHas) {
      permissions.push({
        $: { 'android:name': readContactsPerm },
      })
    }

    return manifestConfig
  })

  config = withDangerousMod(config, ['ios', async (config) => {
    const projectRoot = config.modRequest.projectRoot
    const platformRoot = config.modRequest.platformProjectRoot
    const nitroPath = getNitroModulesPath(projectRoot)

    if (!nitroPath) {
      return config
    }

    const podfilePath = path.join(platformRoot, 'Podfile')
    let contents = fs.readFileSync(podfilePath, 'utf8')

    const relativePath = path.relative(platformRoot, nitroPath)
    const podPath = relativePath.split(path.sep).join('/')
    const podLine = `  pod 'NitroModules', :path => '${podPath}'`

    if (contents.includes("pod 'NitroModules'")) {
      return config
    }

    const anchor = 'config = use_native_modules!'
    const insert = `${anchor}\n\n  # NitroModules (required by @enginnblt/react-native-nitro-contacts)\n${podLine}`
    contents = contents.replace(anchor, insert)
    fs.writeFileSync(podfilePath, contents)
    return config
  }])

  return config
}

module.exports = withNitroContacts
