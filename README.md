# Nitro Contacts

High-performance React Native contacts library built with **JSI** and [Nitro Modules](https://github.com/mrousavy/nitro). Access the device address book with minimal overhead and full TypeScript support.

## Features

- **JSI (Hybrid Objects)** — No bridge; synchronous where it matters, async for heavy work
- **Universal support** — Works with both **New Architecture** and **Old Architecture** (React Native 0.74+)
- **Typed API** — Full TypeScript types: `Contact`, `PostalAddress`, `LabeledValue`, `PermissionStatus`
- **Single hook** — `useContacts()` handles permissions, loading, errors, and refresh
- **Expo-ready** — Config plugin for managed workflow (permissions + autolinking)

## Requirements

- React Native **0.74+**
- iOS 13+ / Android (API 21+)

**[Nitro Modules](https://github.com/mrousavy/nitro)** is included as a dependency — you do **not** need to install `react-native-nitro-modules` in your app. Everything is bundled with this package.

## Installation

```bash
bun add react-native-nitro-contacts
# or
npm install react-native-nitro-contacts
# or
yarn add react-native-nitro-contacts
```

**iOS:** After installing, run CocoaPods:

```bash
cd ios && pod install
```

### Expo (managed workflow)

1. Install the package and add the config plugin in `app.json` / `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      ["react-native-nitro-contacts", { "contactsPermissionText": "Your custom permission message for iOS." }]
    ]
  }
}
```

2. Run prebuild (if you use a dev build):

```bash
npx expo prebuild
```

### Bare React Native

- **iOS:** Add `NSContactsUsageDescription` to `Info.plist`.
- **Android:** Add `READ_CONTACTS` to `AndroidManifest.xml` (or use the Expo config plugin logic as reference).

Then run `pod install` in the `ios` folder.

## Usage

```tsx
import { useContacts, PermissionStatus, type Contact } from 'react-native-nitro-contacts'

function ContactsScreen() {
  const { contacts, status, isLoading, error, requestPermission, refresh } = useContacts()

  if (isLoading) return <Loading />
  if (error) return <Error onRetry={refresh} message={error.message} />
  if (status !== PermissionStatus.GRANTED) {
    return <Button onPress={requestPermission} title="Grant access" />
  }

  return (
    <FlatList
      data={contacts}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => <ContactRow contact={item} />}
    />
  )
}
```

### `useContacts()` result

| Property            | Type                    | Description                          |
|---------------------|-------------------------|--------------------------------------|
| `contacts`          | `Contact[]`             | List of contacts (empty until granted) |
| `status`            | `PermissionStatus`      | `GRANTED` \| `DENIED` \| `NOT_DETERMINED` \| `LIMITED` |
| `isLoading`         | `boolean`               | Initial load or refresh in progress  |
| `error`             | `Error \| null`         | Last error if any                    |
| `requestPermission` | `() => Promise<boolean>`| Request permission (iOS/Android)      |
| `refresh`           | `() => Promise<void>`   | Reload contacts                      |

### `Contact` shape

- `id`, `displayName`, `givenName`, `middleName`, `familyName`
- `company`, `jobTitle`, `department`, `note`
- `birthday?: string`
- `emails`, `phoneNumbers`, `postalAddresses`, `urlAddresses` (arrays of labeled values)
- `thumbnailPath?`, `hasImage`

See `PostalAddress` and `LabeledValue` in the package exports for nested types.

## Monorepo structure

| Path | Description |
|------|-------------|
| `packages/react-native-nitro-contacts` | Library source (TypeScript, Nitro spec, native iOS/Android) |
| `apps/example` | Expo example app (SDK 50+) |

## Development

This repo uses **Bun** for scripts and workspaces.

```bash
# Install dependencies (root)
bun install

# Typecheck
bun run typecheck

# Build the library
bun run build:lib
```

### Running the example app

```bash
cd apps/example
bun install   # if not already done from root
bun run ios   # or: bun run android
```

### Tech stack

- **Runtime / package manager:** Bun
- **Native:** Swift (iOS), Kotlin (Android) via Nitro Hybrid Objects
- **Example app:** Expo SDK 50+ with config plugins

## License

MIT
