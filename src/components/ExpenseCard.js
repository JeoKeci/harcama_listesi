import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

export const ExpenseCard = ({ expense, onDelete }) => {
  const isPersonal = expense.category_type === 'Personal';
  const isOffset = expense.is_offset_transaction;
  const typeColor = isOffset ? '#F59E0B' : isPersonal ? theme.personal : theme.business;
  const iconName = isOffset
    ? 'swap-horiz'
    : isPersonal
    ? 'person'
    : 'business-center';

  return (
    <View style={[styles.card, isOffset && styles.offsetCard]}>
      <View style={[styles.iconContainer, { backgroundColor: typeColor + '20' }]}>
        <MaterialIcons name={iconName} size={24} color={typeColor} />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.topRow}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {isOffset ? 'Mahsuplaşma' : expense.category_name || 'Kategori'}
          </Text>
          {expense.receipt_uri ? (
            <MaterialIcons name="receipt" size={14} color={theme.textMuted} />
          ) : null}
        </View>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description || '-'}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.date}>
            {new Date(expense.date).toLocaleDateString('tr-TR')}
          </Text>
          {expense.wallet_name ? (
            <View style={styles.walletBadge}>
              <MaterialIcons
                name={expense.wallet_type === 'Cash' ? 'payments' : 'credit-card'}
                size={10}
                color={theme.textMuted}
              />
              <Text style={styles.walletText}>{expense.wallet_name}</Text>
            </View>
          ) : null}
          {expense.project_name && !isPersonal ? (
            <View style={styles.projectBadge}>
              <MaterialIcons name="construction" size={10} color={theme.business} />
              <Text style={[styles.walletText, { color: theme.business }]}>
                {expense.project_name}
              </Text>
            </View>
          ) : null}
          {expense.city ? (
            <View style={styles.cityBadge}>
              <MaterialIcons name="location-on" size={10} color={theme.personal} />
              <Text style={[styles.walletText, { color: theme.personal }]}>
                {expense.city}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, isOffset && { color: '#F59E0B' }]}>
          {isOffset ? '+' : '-'}{expense.amount.toFixed(2)} ₺
        </Text>
        <TouchableOpacity onPress={() => onDelete(expense.id)} style={styles.deleteButton}>
          <MaterialIcons name="delete-outline" size={20} color={theme.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  offsetCard: {
    borderColor: '#F59E0B40',
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  categoryName: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
    flex: 1,
  },
  description: {
    color: theme.textMuted,
    fontSize: 13,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  date: {
    color: theme.textMuted,
    fontSize: 11,
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.surfaceLight + '60',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.business + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.personal + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  walletText: {
    color: theme.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  amount: {
    color: theme.text,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
});
