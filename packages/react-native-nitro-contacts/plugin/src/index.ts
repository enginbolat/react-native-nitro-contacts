import {
  type ConfigPlugin,
  withInfoPlist,
  withAndroidManifest,
} from 'expo/config-plugins'

interface NitroContactsPluginProps {
  contactsPermissionText?: string
}

const withNitroContacts: ConfigPlugin<NitroContactsPluginProps | void> = (
  config,
  props
) => {
  const permissionText =
    props?.contactsPermissionText ??
    'This app needs access to your contacts to display them.'

  // iOS: inject NSContactsUsageDescription into Info.plist
  config = withInfoPlist(config, (plistConfig) => {
    plistConfig.modResults.NSContactsUsageDescription = permissionText
    return plistConfig
  })

  // Android: inject READ_CONTACTS permission into AndroidManifest.xml
  config = withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults.manifest

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = []
    }

    const permissions = manifest['uses-permission']
    const readContactsPerm = 'android.permission.READ_CONTACTS'

    const alreadyHas = permissions.some(
      (p: Record<string, Record<string, string>>) =>
        p.$?.['android:name'] === readContactsPerm
    )

    if (!alreadyHas) {
      permissions.push({
        $: { 'android:name': readContactsPerm },
      } as Record<string, Record<string, string>>)
    }

    return manifestConfig
  })

  return config
}

export default withNitroContacts
