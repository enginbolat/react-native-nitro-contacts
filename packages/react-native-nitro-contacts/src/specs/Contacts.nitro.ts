import type { HybridObject } from 'react-native-nitro-modules'

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum PermissionStatus {
  GRANTED,
  DENIED,
  NOT_DETERMINED,
  LIMITED,
}

// ─── Data Structures ────────────────────────────────────────────────────────

export interface PostalAddress {
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isoCountryCode: string
  label: string
}

export interface LabeledValue {
  id: string
  label: string
  value: string
}

export interface Contact {
  id: string
  displayName: string
  givenName: string
  middleName: string
  familyName: string
  company: string
  jobTitle: string
  department: string
  note: string
  birthday: string | undefined
  emails: LabeledValue[]
  phoneNumbers: LabeledValue[]
  postalAddresses: PostalAddress[]
  urlAddresses: LabeledValue[]
  thumbnailPath: string | undefined
  hasImage: boolean
}

// ─── Hybrid Object ──────────────────────────────────────────────────────────

export interface Contacts
  extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  getAll(): Promise<Contact[]>
  getPermissionStatus(): PermissionStatus
  requestPermission(): Promise<boolean>
}
