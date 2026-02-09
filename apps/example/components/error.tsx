import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
    message: string;
    onPress: () => {}
}

export default function ErrorView({ message, onPress }: Props) {
    return (
        <View style={styles.center}>
            <Text style={styles.errorText}>Error: {message}</Text>
            <TouchableOpacity style={styles.button} onPress={onPress}>
                <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    )
}


const styles = StyleSheet.create({
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: '#fff',
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
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        textAlign: 'center',
    },
})
