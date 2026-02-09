import { useState, useEffect, useCallback, useRef } from 'react'
import { Platform, PermissionsAndroid } from 'react-native'
import { NitroModules } from 'react-native-nitro-modules'
import type { Contacts, Contact } from './specs/Contacts.nitro'
import { PermissionStatus } from './specs/Contacts.nitro'

export type UseContactsResult = {
  contacts: Contact[]
  status: PermissionStatus
  isLoading: boolean
  error: Error | null
  requestPermission: () => Promise<boolean>
  refresh: () => Promise<void>
}

const getModule = (): Contacts =>
  NitroModules.createHybridObject<Contacts>('Contacts')

/**
 * Request contacts permission on Android via PermissionsAndroid API
 * (requires an Activity context which Nitro's HybridObject doesn't have).
 */
async function requestAndroidPermission(): Promise<boolean> {
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
    {
      title: 'Contacts Permission',
      message: 'This app needs access to your contacts.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    }
  )
  return result === PermissionsAndroid.RESULTS.GRANTED
}

export function useContacts(): UseContactsResult {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [status, setStatus] = useState<PermissionStatus>(
    PermissionStatus.NOT_DETERMINED
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const moduleRef = useRef<Contacts | null>(null)

  const getModuleInstance = useCallback((): Contacts => {
    if (!moduleRef.current) {
      moduleRef.current = getModule()
    }
    return moduleRef.current
  }, [])

  const fetchContacts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const mod = getModuleInstance()
      const currentStatus = mod.getPermissionStatus()
      setStatus(currentStatus)

      if (currentStatus !== PermissionStatus.GRANTED) {
        setContacts([])
        return
      }

      const result = await mod.getAll()
      setContacts(result)
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err)
    } finally {
      setIsLoading(false)
    }
  }, [getModuleInstance])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      let granted: boolean

      if (Platform.OS === 'android') {
        // Android: use PermissionsAndroid (needs Activity context)
        granted = await requestAndroidPermission()
      } else {
        // iOS: use native CNContactStore.requestAccess
        const mod = getModuleInstance()
        granted = await mod.requestPermission()
      }

      const mod = getModuleInstance()
      const newStatus = mod.getPermissionStatus()
      setStatus(newStatus)

      if (granted) {
        await fetchContacts()
      }
      return granted
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      setError(err)
      return false
    }
  }, [getModuleInstance, fetchContacts])

  const refresh = useCallback(async () => {
    await fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  return {
    contacts,
    status,
    isLoading,
    error,
    requestPermission,
    refresh,
  }
}
