import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme/colors';
import useStore from '../store/useStore';
import { SummaryCard } from '../components/SummaryCard';
import { FilterTabs } from '../components/FilterTabs';
import { ExpenseCard } from '../components/ExpenseCard';
import { AddExpenseModal } from '../components/AddExpenseModal';
import { OffsetModal } from '../components/OffsetModal';

export default function DashboardScreen() {
  const {
    wallets,
    transactions,
    netBalance,
    activeFilter,
    isLoading,
    isDbReady,
    initApp,
    loadAllData,
    setActiveFilter,
    removeTransaction,
  } = useStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [offsetModalVisible, setOffsetModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isDbReady) {
      initApp();
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleDelete = (id) => {
    removeTransaction(id);
  };

  if (isLoading && !isDbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Veriler yükleniyor...</Text>
      </View>
    );
  }

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

      {/* Main List */}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ExpenseCard expense={item} onDelete={handleDelete} />
        )}
        ListHeaderComponent={
          <>
            <SummaryCard
              netBalance={netBalance}
              wallets={wallets}
              onPress={() => setOffsetModalVisible(true)}
            />
            <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {activeFilter === 'all'
                  ? 'Tüm Harcamalar'
                  : activeFilter === 'personal'
                  ? 'Kişisel Harcamalar'
                  : 'Şantiye Harcamaları'}
              </Text>
              <Text style={styles.listCount}>{transactions.length} kayıt</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={64} color={theme.surfaceLight} />
            <Text style={styles.emptyTitle}>Henüz işlem yok</Text>
            <Text style={styles.emptySubtitle}>Yeni harcama eklemek için + butonuna tıklayın</Text>
          </View>
        }
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

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setAddModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add" size={32} color="#FFF" />
      </TouchableOpacity>

      {/* Modals */}
      <AddExpenseModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />
      <OffsetModal
        visible={offsetModalVisible}
        onClose={() => setOffsetModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  loadingContainer: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.textMuted, marginTop: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: { color: theme.text, fontSize: 24, fontWeight: 'bold' },
  date: { color: theme.textMuted, fontSize: 13 },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  listTitle: { color: theme.text, fontSize: 16, fontWeight: 'bold' },
  listCount: { color: theme.textMuted, fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: theme.textMuted, fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { color: theme.surfaceLight, fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
