import { create } from 'zustand';
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
  deactivateWallet as dbDeactivateWallet,
  insertProject as dbInsertProject,
  deactivateProject as dbDeactivateProject,
  getDistinctCities,
  exportAllData,
  getTransactionsByDateRange,
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
    } finally {
      set({ isLoading: false });
    }
  },

  loadAllData: async () => {
    try {
      const [wallets, projects, categories, transactions, cities] = await Promise.all([
        getActiveWallets(),
        getActiveProjects(),
        getCategories(),
        getTransactions(get().activeFilter),
        getDistinctCities(),
      ]);

      const netBalance = get().calculateNetBalance(transactions);

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
    }
  },

  // ==================== RECONCILIATION ENGINE ====================

  calculateNetBalance: (transactions) => {
    let balance = 0;

    for (const t of transactions) {
      if (t.is_offset_transaction) {
        // Offset transactions: reduce the balance
        // positive amount = company paid owner (reduces company debt)
        // In offset: if wallet is Personal -> company paid into personal -> reduce net
        if (t.wallet_owner === 'Personal') {
          balance -= t.amount; // Company paid owner, so company debt decreases
        } else {
          balance += t.amount; // Owner paid company, so company debt increases (or owner debt decreases)
        }
      } else {
        const walletOwner = t.wallet_owner;
        const categoryType = t.category_type;

        if (walletOwner === 'Personal' && categoryType === 'Company') {
          // Personal wallet used for company expense -> Company owes Owner
          balance += t.amount;
        } else if (walletOwner === 'Company' && categoryType === 'Personal') {
          // Company wallet used for personal expense -> Owner owes Company
          balance -= t.amount;
        }
        // Same owner-type transactions are neutral
      }
    }

    return balance;
  },

  // ==================== FILTER ====================

  setActiveFilter: async (filter) => {
    set({ activeFilter: filter });
    const transactions = await getTransactions(filter);
    const allTransactions = await getTransactions('all');
    const netBalance = get().calculateNetBalance(allTransactions);
    set({ transactions, netBalance });
  },

  // ==================== TRANSACTIONS ====================

  addTransaction: async (data) => {
    try {
      // Insert transaction into DB
      await insertTransaction(data);

      // Update wallet balance (decrease for expenses, increase for income offset)
      if (!data.is_offset_transaction) {
        await updateWalletBalance(data.wallet_id, -data.amount);
      } else {
        // For physical offset payments, increase the receiving wallet
        if (data.wallet_id) {
          await updateWalletBalance(data.wallet_id, data.amount);
        }
      }

      // Reload all data
      await get().loadAllData();
    } catch (error) {
      console.error('Error adding transaction:', error);
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
      const wallets = await getActiveWallets();
      set({ wallets });
    } catch (error) {
      console.error('Error adding wallet:', error);
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
      const projects = await getActiveProjects();
      set({ projects });
    } catch (error) {
      console.error('Error adding project:', error);
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
