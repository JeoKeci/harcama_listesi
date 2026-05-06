import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

export const ExpenseCard = ({ expense, onDelete }) => {
  const isPersonal = expense.type === 'personal';
  const typeColor = isPersonal ? theme.personal : theme.business;
  const iconName = isPersonal ? 'person' : 'business-center';

  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: typeColor + '20' }]}>
        <MaterialIcons name={iconName} size={24} color={typeColor} />
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.subCategory}>{expense.subCategory || (isPersonal ? 'Kişisel' : 'İş')}</Text>
        <Text style={styles.description} numberOfLines={1}>{expense.description}</Text>
        <Text style={styles.date}>{new Date(expense.date).toLocaleDateString('tr-TR')}</Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.amount}>
          {expense.amount.toFixed(2)} {expense.currency}
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
    padding: 16,
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContainer: {
    flex: 1,
  },
  subCategory: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: theme.textMuted,
    fontSize: 14,
    marginBottom: 4,
  },
  date: {
    color: theme.textMuted,
    fontSize: 12,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    color: theme.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  }
});
