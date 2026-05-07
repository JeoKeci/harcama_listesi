import { create } from 'zustand';
import { Alert } from 'react-native';
import {
  initDatabase,
  getActiveWallets,
  getAllWallets,
  getActiveProjects,
  getAllProjects,
  getCategories,
  getTransactions,
  insertTransaction,
  deleteTransaction as dbDeleteTransaction,
  updateWalletBalance,
  insertWallet as dbInsertWallet,
  updateWallet as dbUpdateWallet,
  deactivateWallet as dbDeactivateWallet,
  insertProject as dbInsertProject,
  updateProject as dbUpdateProject,
  deactivateProject as dbDeactivateProject,
  getDistinctCities,
  exportAllData,
  getTransactionsByDateRange,
  resetDatabase,
} from '../database/database';

const useStore = create((set, get) => ({
  // State
  wallets: [],
  projects: [],
  categories: [],
  transactions: [],
  cities: [],
  netBalance: 0, // positive = company owes owner, negative = owner owes company
  activeFilter: 'all',
  isLoading: true,
  isDbReady: false,

  // ==================== INITIALIZATION ====================

  initApp: async () => {
    try {
      set({ isLoading: true });
      await initDatabase();
      set({ isDbReady: true });
      await get().loadAllData();
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('DB Başlatma Hatası', error.message);
    } finally {
      set({ isLoading: false });
    }
  },

  resetApp: async () => {
    try {
      set({ isLoading: true });
      await resetDatabase();
      await get().loadAllData();
      Alert.alert('Başarılı', 'Uygulama başarıyla sıfırlandı.');
    } catch (error) {
      console.error('Error resetting app:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  loadAllData: async () => {
    try {
      const [wallets, projects, categories, transactions, allTransactions, cities] = await Promise.all([
        getActiveWallets(),
        getActiveProjects(),
        getCategories(),
        getTransactions(get().activeFilter),
        getTransactions('all', 10000), // High limit for balance calculation
        getDistinctCities(),
      ]);

      const netBalance = get().calculateNetBalance(allTransactions, wallets);

      set({
        wallets,
        projects,
        categories,
        transactions,
        cities,
        netBalance,
      });
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Veri Yükleme Hatası', error.message);
    }
  },

  // ==================== RECONCILIATION ENGINE ====================

  calculateNetBalance: (transactions, wallets) => {
    let balance = 0;

    // 1. Transaction based balance
    for (const t of transactions) {
      const walletOwner = t.wallet_owner;
      const categoryType = t.category_type;

      if (t.is_offset_transaction) {
        if (t.is_virtual) {
          // Virtual Offset (Salary Cut / Maaş Kesintisi)
          // Rule: Debt decreases (Balance moves towards 0 from negative)
          balance += t.amount;
        } else {
          // Physical Offset (Company pays User / Nakit Ödeme)
          // Rule: Credit decreases (Balance moves towards 0 from positive)
          balance -= t.amount;
        }
      } else if (t.is_income) {
        // Income (Para Girişi)
        if (walletOwner === 'Personal') {
          // Rule: Advance taken into personal pocket (Debt increases)
          balance -= t.amount;
        }
        // Company wallet income doesn't affect net balance directly
      } else {
        // Expense (Harcama)
        if (walletOwner === 'Personal' && categoryType === 'Company') {
          // Rule: Owner paid for company expense (Credit increases)
          balance += t.amount;
        } else if (walletOwner === 'Company' && categoryType === 'Personal') {
          // Rule: Company paid for owner expense (Debt increases)
          balance -= t.amount;
        }
      }
    }

    // 2. Negative Company Wallet Balances
    // Rule: "şirket NAKİT kasasında ki bakiyeden daha fazla harcama yapıldıysa oluşan fark şirketi bana borçlandırır"
    // Bu kural sadece NAKİT (Cash) cüzdanlar için geçerlidir, Kredi Kartı için geçerli değildir.
    wallets.forEach(w => {
      if (w.owner === 'Company' && w.type === 'Cash' && w.balance < 0) {
        balance += Math.abs(w.balance);
      }
    });

    return balance;
  },

  // ==================== FILTER ====================

  setActiveFilter: async (filter) => {
    set({ activeFilter: filter });
    const transactions = await getTransactions(filter);
    const allTransactions = await getTransactions('all', 10000);
    const netBalance = get().calculateNetBalance(allTransactions, get().wallets);
    set({ transactions, netBalance });
  },

  // ==================== TRANSACTIONS ====================

  addTransaction: async (data) => {
    try {
      await insertTransaction(data);
      if (!data.is_offset_transaction) {
        await updateWalletBalance(data.wallet_id, -data.amount);
      } else {
        if (data.wallet_id) {
          await updateWalletBalance(data.wallet_id, data.amount);
        }
      }
      await get().loadAllData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  },

  addIncomeTransaction: async (data) => {
    try {
      // For income, amount is positive
      await insertTransaction(data);
      await updateWalletBalance(data.wallet_id, data.amount);
      await get().loadAllData();
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  },

  removeTransaction: async (transactionId) => {
    try {
      // Get the transaction before deleting to reverse balance
      const transaction = await dbDeleteTransaction(transactionId);

      if (transaction) {
        // Reverse the wallet balance change
        if (!transaction.is_offset_transaction) {
          await updateWalletBalance(transaction.wallet_id, transaction.amount);
        } else {
          if (transaction.wallet_id) {
            await updateWalletBalance(transaction.wallet_id, -transaction.amount);
          }
        }
      }

      await get().loadAllData();
    } catch (error) {
      console.error('Error removing transaction:', error);
      throw error;
    }
  },

  // ==================== OFFSET / ACCOUNT CLOSING ====================

  addOffsetPhysical: async (amount, walletId, description) => {
    // Physical payment: Company pays Owner cash/card
    // This creates an offset transaction AND increases the personal wallet balance
    const data = {
      date: new Date().toISOString(),
      amount,
      wallet_id: walletId,
      category_id: null,
      project_id: null,
      city: null,
      description: description || 'Hesap Kapatma - Fiziksel Ödeme',
      receipt_uri: null,
      is_offset_transaction: true,
      is_virtual: false,
    };

    // We need a special category for offsets - use category_id = null approach
    // Actually let's create the transaction directly with a special handling
    try {
      // For offset, we set category_id to a special value
      // First, let's find or create an offset category
      const categories = get().categories;
      let offsetCat = categories.find(c => c.name === 'Hesap Kapatma');
      if (!offsetCat) {
        // We'll just use the first personal category as placeholder
        // The is_offset_transaction flag is what matters
        offsetCat = categories[0];
      }
      data.category_id = offsetCat ? offsetCat.id : 1;

      await insertTransaction(data);
      // Increase wallet balance (money coming in)
      await updateWalletBalance(walletId, amount);
      await get().loadAllData();
    } catch (error) {
      console.error('Error adding physical offset:', error);
      throw error;
    }
  },

  addOffsetVirtual: async (amount, description) => {
    // Virtual/Salary deduction: Clears balance without affecting wallets
    try {
      const categories = get().categories;
      let offsetCat = categories.find(c => c.name === 'Hesap Kapatma');
      if (!offsetCat) {
        offsetCat = categories[0];
      }

      const wallets = get().wallets;
      const personalWallet = wallets.find(w => w.owner === 'Personal');

      const data = {
        date: new Date().toISOString(),
        amount,
        wallet_id: personalWallet ? personalWallet.id : 1,
        category_id: offsetCat ? offsetCat.id : 1,
        project_id: null,
        city: null,
        description: description || 'Hesap Kapatma - Maaş Kesintisi',
        receipt_uri: null,
        is_offset_transaction: true,
        is_virtual: true,
      };

      await insertTransaction(data);
      // NO wallet balance change for virtual offset
      await get().loadAllData();
    } catch (error) {
      console.error('Error adding virtual offset:', error);
      throw error;
    }
  },

  // ==================== WALLETS ====================

  addWallet: async (name, type, owner) => {
    try {
      await dbInsertWallet(name, type, owner);
      await get().loadAllData();
    } catch (error) {
      console.error('Error adding wallet:', error);
      throw error;
    }
  },

  editWallet: async (id, name, type, owner) => {
    try {
      await dbUpdateWallet(id, name, type, owner);
      await get().loadAllData();
    } catch (error) {
      console.error('Error updating wallet:', error);
      throw error;
    }
  },

  removeWallet: async (walletId) => {
    try {
      await dbDeactivateWallet(walletId);
      const wallets = await getActiveWallets();
      set({ wallets });
    } catch (error) {
      console.error('Error deactivating wallet:', error);
      throw error;
    }
  },

  // ==================== PROJECTS ====================

  addProject: async (name) => {
    try {
      await dbInsertProject(name);
      await get().loadAllData();
    } catch (error) {
      console.error('Error adding project:', error);
      throw error;
    }
  },

  editProject: async (id, name) => {
    try {
      await dbUpdateProject(id, name);
      await get().loadAllData();
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  removeProject: async (projectId) => {
    try {
      await dbDeactivateProject(projectId);
      const projects = await getActiveProjects();
      set({ projects });
    } catch (error) {
      console.error('Error deactivating project:', error);
      throw error;
    }
  },

  // ==================== EXPORT ====================

  getExportData: async () => {
    return await exportAllData();
  },

  // ==================== REPORTS ====================

  getReportTransactions: async (startDate, endDate, projectId = null) => {
    return await getTransactionsByDateRange(startDate, endDate, projectId);
  },
}));

export default useStore;
