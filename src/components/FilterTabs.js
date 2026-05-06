import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme/colors';

const FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'company', label: 'Şantiye' },
  { key: 'personal', label: 'Kişisel' },
];

export const FilterTabs = ({ activeFilter, onFilterChange }) => {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.key;
        let activeColor = theme.primary;
        if (filter.key === 'personal') activeColor = theme.personal;
        if (filter.key === 'company') activeColor = theme.business;

        return (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.tab,
              isActive && { backgroundColor: activeColor + '25', borderColor: activeColor },
            ]}
            onPress={() => onFilterChange(filter.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, isActive && { color: activeColor, fontWeight: 'bold' }]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1.5,
    borderColor: theme.border,
  },
  tabText: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});
