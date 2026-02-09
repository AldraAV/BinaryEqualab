import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useCalculator } from '../contexts/CalculatorContext';

export default function MathPreview() {
    const { expression, displayLatex, error } = useCalculator();

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Vista Previa</Text>

            <View style={styles.previewBox}>
                <Text style={styles.latex}>
                    {displayLatex || expression || '□'}
                </Text>
            </View>

            {error && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
            )}

            {!expression && !displayLatex && (
                <Text style={styles.hint}>
                    Escribe una expresión o presiona una operación CAS
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.warmBlack2,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: `${colors.orange400}30`,
    },
    label: {
        color: colors.textSecondary,
        fontSize: 11,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    previewBox: {
        minHeight: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    latex: {
        color: colors.textPrimary,
        fontSize: 24,
        fontWeight: '500',
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    hint: {
        color: colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: spacing.sm,
        fontStyle: 'italic',
    },
    errorBox: {
        backgroundColor: `${colors.error}20`,
        borderRadius: borderRadius.sm,
        padding: spacing.sm,
        marginTop: spacing.sm,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        textAlign: 'center',
    },
});
