import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { mathActions, operatorActions } from '../config/mathActions';
import { useCalculator } from '../contexts/CalculatorContext';

const numpadButtons = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['0', '.', 'x', '+'],
];

export default function MathKeyboard() {
    const { appendToExpression, backspace, clear, evaluate, executeAction, isLoading } = useCalculator();

    const handleNumpadPress = (btn: string) => {
        const mapping: Record<string, string> = {
            '÷': '/',
            '×': '*',
        };
        appendToExpression(mapping[btn] || btn);
    };

    return (
        <View style={styles.container}>
            {/* CAS Section */}
            <Text style={styles.sectionLabel}>Operaciones CAS</Text>
            <View style={styles.casGrid}>
                {mathActions.slice(0, 9).map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        style={styles.casButton}
                        onPress={() => executeAction(action.id)}
                    >
                        <Text style={styles.casButtonText}>{action.labelEs}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Operators */}
            <View style={styles.operatorRow}>
                {operatorActions.map((action) => (
                    <TouchableOpacity
                        key={action.id}
                        style={styles.operatorButton}
                        onPress={() => appendToExpression(action.sympyTemplate.replace('$0', '').replace('$1', ''))}
                    >
                        <Text style={styles.operatorText}>{action.labelEs}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Numpad */}
            <View style={styles.numpad}>
                {numpadButtons.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numpadRow}>
                        {row.map((btn) => {
                            const isOperator = '÷×-+'.includes(btn);
                            return (
                                <TouchableOpacity
                                    key={btn}
                                    style={[styles.numpadButton, isOperator && styles.numpadOperator]}
                                    onPress={() => handleNumpadPress(btn)}
                                >
                                    <Text style={[styles.numpadText, isOperator && styles.numpadOperatorText]}>
                                        {btn}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Control Buttons */}
            <View style={styles.controlRow}>
                <TouchableOpacity style={styles.backspaceButton} onPress={backspace}>
                    <Text style={styles.controlText}>⌫</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.clearButton} onPress={clear}>
                    <Text style={styles.controlText}>🗑️ Limpiar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.evaluateButton, isLoading && styles.evaluateDisabled]}
                    onPress={evaluate}
                    disabled={isLoading}
                >
                    <Text style={styles.controlText}>
                        {isLoading ? '...' : '= Calcular'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.warmBlack1,
        padding: spacing.md,
    },
    sectionLabel: {
        color: colors.textSecondary,
        fontSize: 11,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    casGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    casButton: {
        width: '31%',
        backgroundColor: `${colors.orange600}20`,
        borderWidth: 1,
        borderColor: colors.orange600,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    casButtonText: {
        color: colors.orange400,
        fontSize: 12,
        fontWeight: 'bold',
    },
    operatorRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    operatorButton: {
        flex: 1,
        backgroundColor: colors.warmBlack3,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    operatorText: {
        color: colors.textPrimary,
        fontSize: 16,
    },
    numpad: {
        flex: 1,
        gap: spacing.sm,
    },
    numpadRow: {
        flexDirection: 'row',
        flex: 1,
        gap: spacing.sm,
    },
    numpadButton: {
        flex: 1,
        backgroundColor: colors.warmBlack3,
        borderRadius: borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    numpadOperator: {
        backgroundColor: `${colors.orange600}40`,
    },
    numpadText: {
        color: colors.textPrimary,
        fontSize: 20,
        fontWeight: '500',
    },
    numpadOperatorText: {
        color: colors.orange400,
        fontWeight: 'bold',
    },
    controlRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    backspaceButton: {
        flex: 1,
        backgroundColor: `${colors.error}30`,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        alignItems: 'center',
    },
    clearButton: {
        flex: 2,
        backgroundColor: colors.error,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    evaluateButton: {
        flex: 2,
        backgroundColor: colors.success,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.lg,
        alignItems: 'center',
    },
    evaluateDisabled: {
        opacity: 0.5,
    },
    controlText: {
        color: colors.textPrimary,
        fontSize: 14,
        fontWeight: 'bold',
    },
});
