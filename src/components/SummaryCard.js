import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

export const SummaryCard = ({ totalAll, totalPersonal, totalBusiness, currency = '₺' }) => {
  return (
    <View style={styles.container}>
      {/* Ana Toplam */}
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Toplam Harcama</Text>
        <Text style={styles.totalAmount}>{totalAll.toFixed(2)} {currency}</Text>
      </View>

      {/* Alt Kırılımlar */}
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: theme.personal }]} />
          <View>
            <Text style={styles.breakdownLabel}>Kişisel</Text>
            <Text style={styles.breakdownAmount}>{totalPersonal.toFixed(2)} {currency}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.breakdownItem}>
          <View style={[styles.dot, { backgroundColor: theme.business }]} />
          <View>
            <Text style={styles.breakdownLabel}>İş</Text>
            <Text style={styles.breakdownAmount}>{totalBusiness.toFixed(2)} {currency}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  totalSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  totalAmount: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  breakdownLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  breakdownAmount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
});
