# react-native-nitro-contacts

High-performance React Native contacts access using [Nitro Modules](https://github.com/mrousavy/nitro) (JSI). Works with both the New Architecture and the legacy bridge. Target: React Native 0.74+.

## Installation

```bash
npm install react-native-nitro-contacts
# or
yarn add react-native-nitro-contacts
# or
bun add react-native-nitro-contacts
```

**Peer dependencies:** `react`, `react-native`, and `react-native-nitro-modules` must be installed.

### Expo (managed workflow)

If you use Expo, install the config plugin (optional peer):

```bash
npx expo install react-native-nitro-contacts @expo/config-plugins
```

Then in `app.json` / `app.config.js`:

```json
{
  "expo": {
    "plugins": ["react-native-nitro-contacts"]
  }
}
```

## Usage

Use the `useContacts` hook to load contacts, handle permissions, and refresh:

```tsx
import { useContacts, PermissionStatus } from 'react-native-nitro-contacts'

function ContactList() {
  const {
    contacts,
    status,
    isLoading,
    error,
    requestPermission,
    refresh,
  } = useContacts()

  if (isLoading) return <Text>Loading…</Text>
  if (error) return <Text>Error: {error.message}</Text>
  if (status !== PermissionStatus.GRANTED) {
    return (
      <Button title="Grant access to contacts" onPress={requestPermission} />
    )
  }

  return (
    <FlatList
      data={contacts}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => (
        <Text>{item.displayName} — {item.phoneNumbers[0]?.value}</Text>
      )}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refresh} />
      }
    />
  )
}
```

Don’t forget to add the required permission in your app config (e.g. `Info.plist` on iOS and `AndroidManifest.xml` on Android) for reading contacts.

## API

### `useContacts()`

Returns:

| Property            | Type                    | Description                          |
|---------------------|-------------------------|--------------------------------------|
| `contacts`          | `Contact[]`             | List of contacts (after permission). |
| `status`            | `PermissionStatus`      | Current permission status.           |
| `isLoading`         | `boolean`               | Whether contacts are being loaded.   |
| `error`             | `Error \| null`         | Error from the last load/request.    |
| `requestPermission` | `() => Promise<boolean>`| Request contacts permission.         |
| `refresh`           | `() => Promise<void>`   | Reload contacts.                     |

### Types

- **`Contact`** — `id`, `displayName`, `givenName`, `familyName`, `emails`, `phoneNumbers`, `postalAddresses`, `urlAddresses`, `birthday`, `thumbnailPath`, `hasImage`, etc.
- **`LabeledValue`** — `id`, `label`, `value` (used for emails, phones, URLs).
- **`PostalAddress`** — `street`, `city`, `state`, `postalCode`, `country`, `isoCountryCode`, `label`.
- **`PermissionStatus`** — `GRANTED` \| `DENIED` \| `NOT_DETERMINED` \| `LIMITED`.

All of these are exported from `react-native-nitro-contacts`.

## Requirements

- React Native **0.74+**
- **iOS:** Add `NSContactsUsageDescription` in `Info.plist`.
- **Android:** `READ_CONTACTS` is requested at runtime; ensure it’s not removed from your manifest.

## License

MIT · [GitHub](https://github.com/enginbolat/react-native-nitro-contacts)
