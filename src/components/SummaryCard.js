import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

export const SummaryCard = ({ netBalance, wallets, onPress }) => {
  const isPositive = netBalance >= 0;
  const balanceText = isPositive
    ? `Şirket size borçlu`
    : `Siz şirkete borçlusunuz`;
  const balanceAmount = Math.abs(netBalance);
  const balanceColor = isPositive ? theme.secondary : theme.danger;

  const personalWallets = wallets.filter((w) => w.owner === 'Personal');
  const companyWallets = wallets.filter((w) => w.owner === 'Company');

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      {/* Net Bakiye */}
      <View style={styles.netSection}>
        <View style={styles.netLabelRow}>
          <MaterialIcons
            name={isPositive ? 'trending-up' : 'trending-down'}
            size={20}
            color={balanceColor}
          />
          <Text style={[styles.netLabel, { color: balanceColor }]}>{balanceText}</Text>
        </View>
        <Text style={[styles.netAmount, { color: balanceColor }]}>
          {balanceAmount.toFixed(2)} ₺
        </Text>
        {netBalance !== 0 && (
          <Text style={styles.tapHint}>Mahsuplaşma için dokunun →</Text>
        )}
      </View>

      {/* Cüzdan Bakiyeleri */}
      <View style={styles.walletsSection}>
        {/* Kişisel Cüzdanlar */}
        <View style={styles.walletGroup}>
          <View style={styles.walletGroupHeader}>
            <View style={[styles.dot, { backgroundColor: theme.personal }]} />
            <Text style={styles.walletGroupLabel}>Kişisel</Text>
          </View>
          {personalWallets.map((w) => (
            <View key={w.id} style={styles.walletRow}>
              <MaterialIcons
                name={w.type === 'Cash' ? 'payments' : 'credit-card'}
                size={14}
                color={theme.textMuted}
              />
              <Text style={styles.walletName}>{w.name}</Text>
              <Text style={styles.walletBalance}>{w.balance.toFixed(2)} ₺</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Şirket Cüzdanları */}
        <View style={styles.walletGroup}>
          <View style={styles.walletGroupHeader}>
            <View style={[styles.dot, { backgroundColor: theme.business }]} />
            <Text style={styles.walletGroupLabel}>Şirket</Text>
          </View>
          {companyWallets.map((w) => (
            <View key={w.id} style={styles.walletRow}>
              <MaterialIcons
                name={w.type === 'Cash' ? 'payments' : 'credit-card'}
                size={14}
                color={theme.textMuted}
              />
              <Text style={styles.walletName}>{w.name}</Text>
              <Text style={styles.walletBalance}>{w.balance.toFixed(2)} ₺</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
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
  netSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  netLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  netLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  netAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tapHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
  walletsSection: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  walletGroup: {
    flex: 1,
  },
  walletGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  walletGroupLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  walletName: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    flex: 1,
  },
  walletBalance: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
});
