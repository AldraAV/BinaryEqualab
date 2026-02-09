import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../theme/colors';
import { useCalculator } from '../contexts/CalculatorContext';
import { HistoryItem } from '../types/types';

function formatTime(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
}

function HistoryCard({ item }: { item: HistoryItem }) {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>CÁLCULO</Text>
                </View>
                <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
            </View>
            <Text style={styles.expression}>{item.expression}</Text>
            <Text style={styles.result}>= {item.result}</Text>
        </View>
    );
}

export default function HistoryList() {
    const { history } = useCalculator();

    if (history.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay historial aún</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={history}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <HistoryCard item={item} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    listContent: {
        padding: spacing.md,
        paddingBottom: spacing.xl,
    },
    card: {
        backgroundColor: `${colors.warmBlack2}99`,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: `${colors.orange400}20`,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    tag: {
        backgroundColor: `${colors.orange600}30`,
        borderRadius: borderRadius.sm,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: colors.orange600,
    },
    tagText: {
        color: colors.orange400,
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    timestamp: {
        color: colors.textSecondary,
        fontSize: 11,
    },
    expression: {
        color: colors.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    result: {
        color: colors.orange400,
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    emptyText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontStyle: 'italic',
    },
});
