import { TouchableOpacity, Text, StyleSheet } from "react-native"

type Props = {
    onPress: () => void
}

export default function Button({ onPress }: Props) {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    button: {
        marginTop: 16,
        backgroundColor: '#007AFF',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
})
