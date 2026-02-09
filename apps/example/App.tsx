import { useCallback } from 'react'
import { StyleSheet, View, Text, } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { FlashList } from '@shopify/flash-list'
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context'
import { useContacts, PermissionStatus, type Contact } from '@enginnblt/react-native-nitro-contacts'
import { LoadingView, ErrorView, ContactItem, Button, Header } from './components'

export default function App() {
  const { contacts, status, isLoading, error, requestPermission, refresh } =
    useContacts()

  const renderItem = useCallback(({ item }: { item: Contact }) => (
    <ContactItem
      contact={item}
    />
  ), [])

  if (isLoading) {
    return <LoadingView />
  }

  if (error) {
    return (
      <ErrorView
        onPress={refresh}
        message={error.message}
      />
    )
  }

  if (status !== PermissionStatus.GRANTED) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Contacts Permission Required</Text>
        <Text style={styles.subtitle}>
          Grant access to view your contacts.
        </Text>
        <Button onPress={requestPermission} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header onPress={refresh} contacts={contacts} />
        <FlashList
          data={contacts}
          renderItem={renderItem}
          estimatedItemSize={72}
          keyExtractor={(item) => item.id}
        />
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
})
