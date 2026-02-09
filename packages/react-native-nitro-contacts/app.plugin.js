const {
  withInfoPlist,
  withAndroidManifest,
} = require('@expo/config-plugins')

/**
 * Expo config plugin for react-native-nitro-contacts.
 * Injects contacts permission (iOS: NSContactsUsageDescription, Android: READ_CONTACTS).
 * @param {object} config - Expo config
 * @param {{ contactsPermissionText?: string } | undefined} props - Optional. contactsPermissionText for iOS usage description
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

  return config
}

module.exports = withNitroContacts
