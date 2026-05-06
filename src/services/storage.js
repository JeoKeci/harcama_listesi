import AsyncStorage from '@react-native-async-storage/async-storage';

const EXPENSES_KEY = '@expenses_data';

// Harcama veri modeli örneği:
// {
//   id: "uuid-string",
//   amount: 150.50,
//   currency: "₺", // İleride $, € eklenebilir
//   type: "personal", // "personal" | "business"
//   subCategory: "Yemek",
//   description: "Öğle yemeği",
//   date: "2026-05-06T12:00:00Z"
// }

export const saveExpense = async (expense) => {
  try {
    const existingExpenses = await getExpenses();
    const updatedExpenses = [expense, ...existingExpenses];
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updatedExpenses));
    return updatedExpenses;
  } catch (e) {
    console.error('Error saving expense:', e);
    throw e;
  }
};

export const getExpenses = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error reading expenses:', e);
    return [];
  }
};

export const deleteExpense = async (id) => {
  try {
    const existingExpenses = await getExpenses();
    const updatedExpenses = existingExpenses.filter(expense => expense.id !== id);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(updatedExpenses));
    return updatedExpenses;
  } catch (e) {
    console.error('Error deleting expense:', e);
    throw e;
  }
};

// Test / Sıfırlama amaçlı tüm veriyi silmek için
export const clearAllExpenses = async () => {
  try {
    await AsyncStorage.removeItem(EXPENSES_KEY);
  } catch (e) {
    console.error('Error clearing expenses:', e);
  }
};
