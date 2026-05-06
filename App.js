import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { MaterialIcons } from '@expo/vector-icons';

import { theme } from './src/theme/colors';
import { saveExpense, getExpenses, deleteExpense } from './src/services/storage';
import { SummaryCard } from './src/components/SummaryCard';
import { FilterTabs } from './src/components/FilterTabs';
import { ExpenseCard } from './src/components/ExpenseCard';
import { AddExpenseModal } from './src/components/AddExpenseModal';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Uygulama açıldığında kayıtlı harcamaları yükle
  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const data = await getExpenses();
    setExpenses(data);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  }, []);

  // Yeni harcama ekle
  const handleAddExpense = async (expenseData) => {
    const newExpense = {
      id: uuidv4(),
      ...expenseData,
    };
    const updated = await saveExpense(newExpense);
    setExpenses(updated);
  };

  // Harcama sil
  const handleDeleteExpense = async (id) => {
    const updated = await deleteExpense(id);
    setExpenses(updated);
  };

  // Filtreleme
  const filteredExpenses = expenses.filter((exp) => {
    if (filter === 'all') return true;
    return exp.type === filter;
  });

  // Toplamlar
  const totalAll = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPersonal = expenses.filter((e) => e.type === 'personal').reduce((sum, e) => sum + e.amount, 0);
  const totalBusiness = expenses.filter((e) => e.type === 'business').reduce((sum, e) => sum + e.amount, 0);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons name="receipt-long" size={64} color={theme.surfaceLight} />
      <Text style={styles.emptyTitle}>Henüz harcama yok</Text>
      <Text style={styles.emptySubtitle}>Yeni harcama eklemek için + butonuna tıklayın</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Harcama Takip</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('tr-TR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <MaterialIcons name="account-balance-wallet" size={28} color={theme.primary} />
        </View>
      </View>

      {/* Harcama Listesi */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onDelete={handleDeleteExpense} />
        )}
        ListHeaderComponent={
          <>
            <SummaryCard
              totalAll={totalAll}
              totalPersonal={totalPersonal}
              totalBusiness={totalBusiness}
            />
            <FilterTabs activeFilter={filter} onFilterChange={setFilter} />
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {filter === 'all' ? 'Tüm Harcamalar' : filter === 'personal' ? 'Kişisel Harcamalar' : 'İş Harcamaları'}
              </Text>
              <Text style={styles.listCount}>{filteredExpenses.length} kayıt</Text>
            </View>
          </>
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={30} color="#FFF" />
      </TouchableOpacity>

      {/* Harcama Ekleme Modalı */}
      <AddExpenseModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleAddExpense}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    color: theme.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: theme.textMuted,
    fontSize: 14,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  listCount: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    color: theme.textMuted,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: theme.surfaceLight,
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
});
