import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Contact } from 'react-native-nitro-contacts'

type Props = {
    contacts: Contact[]
    onPress: () => void
}

export default function Header({ contacts, onPress }: Props) {
    return (
        <View style={styles.header}>
            <Text style={styles.headerTitle}>
                Contacts ({contacts.length})
            </Text>
            <TouchableOpacity onPress={onPress}>
                <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
        </View>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    refreshText: {
        fontSize: 16,
        color: '#007AFF',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
})
