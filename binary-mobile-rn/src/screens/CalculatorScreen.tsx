import React from 'react';
import { View, Text, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme/colors';
import MathKeyboard from '../components/MathKeyboard';
import MathPreview from '../components/MathPreview';
import HistoryList from '../components/HistoryList';

export default function CalculatorScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={colors.warmBlack1} />

            {/* TopBar with Gradient */}
            <LinearGradient
                colors={[colors.orange400, colors.orange600, colors.red700]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topBar}
            >
                <Text style={styles.title}>Binary EquaLab</Text>
                <Text style={styles.emoji}>🍒</Text>
            </LinearGradient>

            {/* History Section */}
            <View style={styles.historySection}>
                <Text style={styles.sectionLabel}>HISTORIAL</Text>
                <View style={styles.historyContainer}>
                    <HistoryList />
                </View>
            </View>

            {/* Preview Section */}
            <View style={styles.previewSection}>
                <MathPreview />
            </View>

            {/* Keyboard Section */}
            <View style={styles.keyboardSection}>
                <MathKeyboard />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.warmBlack1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    title: {
        color: colors.textPrimary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    emoji: {
        fontSize: 18,
        marginLeft: spacing.sm,
    },
    historySection: {
        flex: 2,
        backgroundColor: colors.warmBlack2,
    },
    sectionLabel: {
        color: colors.textSecondary,
        fontSize: 10,
        letterSpacing: 1.5,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    historyContainer: {
        flex: 1,
    },
    previewSection: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    keyboardSection: {
        flex: 4,
    },
});
