import { View, Image, Text, StyleSheet } from 'react-native'
import { Contact } from 'react-native-nitro-contacts'

export default function ContactItem({ contact }: { contact: Contact }) {
    return (
        <View style={styles.row}>
            {contact.hasImage && contact.thumbnailPath ? (
                <Image source={{ uri: contact.thumbnailPath }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarText}>
                        {contact.givenName.charAt(0) || contact.familyName.charAt(0) || '#'}
                    </Text>
                </View>
            )}
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {contact.displayName || 'No Name'}
                </Text>
                {contact.company !== '' && (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {contact.company}
                        {contact.jobTitle !== '' ? ` · ${contact.jobTitle}` : ''}
                    </Text>
                )}
                {contact.phoneNumbers.length > 0 && (
                    <Text style={styles.phone} numberOfLines={1}>
                        {contact.phoneNumbers[0]!.value}
                    </Text>
                )}
            </View>
        </View>
    )
}


const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#eee',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    avatarPlaceholder: {
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
    subtitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    phone: {
        fontSize: 13,
        color: '#999',
        marginTop: 2,
    },
})
