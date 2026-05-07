import * as SQLite from 'expo-sqlite';

let db = null;

export const getDatabase = async () => {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('harcama_takip.db');
  return db;
};

export const initDatabase = async () => {
  const database = await getDatabase();

  // Enable WAL mode and Foreign Keys
  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Cash', 'Card')),
      owner TEXT NOT NULL CHECK(owner IN ('Personal', 'Company')),
      balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('Personal', 'Company'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      wallet_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      project_id INTEGER,
      city TEXT,
      description TEXT,
      receipt_uri TEXT,
      is_offset_transaction INTEGER DEFAULT 0,
      is_income INTEGER DEFAULT 0,
      is_virtual INTEGER DEFAULT 0,
      FOREIGN KEY (wallet_id) REFERENCES wallets(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    );
  `);

  // Migration: Add is_virtual column if it doesn't exist
  try {
    await database.execAsync('ALTER TABLE transactions ADD COLUMN is_virtual INTEGER DEFAULT 0;');
  } catch (e) {
    // Column might already exist
  }

  // Seed default data if empty
  await seedDefaultData(database);

  return database;
};

export const resetDatabase = async () => {
  const database = await getDatabase();
  await database.execAsync(`
    DROP TABLE IF EXISTS transactions;
    DROP TABLE IF EXISTS wallets;
    DROP TABLE IF EXISTS categories;
    DROP TABLE IF EXISTS projects;
  `);
  await initDatabase();
};

const seedDefaultData = async (database) => {
  // Check if wallets already exist
  const walletCheck = await database.getFirstAsync('SELECT COUNT(*) as count FROM wallets');
  if (walletCheck.count === 0) {
    await database.execAsync(`
      INSERT INTO wallets (name, type, owner, balance) VALUES
        ('Kişisel Nakit', 'Cash', 'Personal', 0),
        ('Kişisel Kart', 'Card', 'Personal', 0),
        ('Şirket Nakit', 'Cash', 'Company', 0),
        ('Şirket Kart', 'Card', 'Company', 0);
    `);
  }

  // Check if categories already exist
  const catCheck = await database.getFirstAsync('SELECT COUNT(*) as count FROM categories');
  if (catCheck.count === 0) {
    await database.execAsync(`
      INSERT INTO categories (name, type) VALUES
        ('Yemek', 'Personal'),
        ('Market', 'Personal'),
        ('Ulaşım', 'Personal'),
        ('Fatura', 'Personal'),
        ('Eğlence', 'Personal'),
        ('Sağlık', 'Personal'),
        ('Giyim', 'Personal'),
        ('Kişisel Diğer', 'Personal'),
        ('Malzeme', 'Company'),
        ('İşçilik', 'Company'),
        ('Nakliye', 'Company'),
        ('Ekipman', 'Company'),
        ('Yakıt', 'Company'),
        ('Şantiye Yemek', 'Company'),
        ('Konaklama', 'Company'),
        ('Şirket Diğer', 'Company'),
        ('Hesap Kapatma', 'Personal'),
        ('Hesap Kapatma', 'Company');
    `);
  }

  // Check if projects already exist
  const projectCheck = await database.getFirstAsync('SELECT COUNT(*) as count FROM projects');
  if (projectCheck.count === 0) {
    await database.execAsync("INSERT INTO projects (name) VALUES ('Genel Şantiye');");
  }
};

// ==================== WALLET CRUD ====================

export const getActiveWallets = async () => {
  const database = await getDatabase();
  return await database.getAllAsync(
    'SELECT * FROM wallets WHERE is_active = 1 ORDER BY owner, type'
  );
};

export const getAllWallets = async () => {
  const database = await getDatabase();
  return await database.getAllAsync('SELECT * FROM wallets ORDER BY owner, type');
};

export const insertWallet = async (name, type, owner) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO wallets (name, type, owner, balance) VALUES (?, ?, ?, 0)',
    [name, type, owner]
  );
  return result.lastInsertRowId;
};

export const updateWalletBalance = async (walletId, amount) => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE wallets SET balance = balance + ? WHERE id = ?',
    [amount, walletId]
  );
};

export const updateWallet = async (id, name, type, owner) => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE wallets SET name = ?, type = ?, owner = ? WHERE id = ?',
    [name, type, owner, id]
  );
};

export const deactivateWallet = async (walletId) => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE wallets SET is_active = 0 WHERE id = ?',
    [walletId]
  );
};

// ==================== PROJECT CRUD ====================

export const getActiveProjects = async () => {
  const database = await getDatabase();
  return await database.getAllAsync(
    'SELECT * FROM projects WHERE is_active = 1 ORDER BY name'
  );
};

export const getAllProjects = async () => {
  const database = await getDatabase();
  return await database.getAllAsync('SELECT * FROM projects ORDER BY name');
};

export const insertProject = async (name) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO projects (name) VALUES (?)',
    [name]
  );
  return result.lastInsertRowId;
};

export const updateProject = async (id, name) => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE projects SET name = ? WHERE id = ?',
    [name, id]
  );
};

export const deactivateProject = async (projectId) => {
  const database = await getDatabase();
  await database.runAsync(
    'UPDATE projects SET is_active = 0 WHERE id = ?',
    [projectId]
  );
};

// ==================== CATEGORY CRUD ====================

export const getCategories = async () => {
  const database = await getDatabase();
  return await database.getAllAsync('SELECT * FROM categories ORDER BY type, name');
};

export const getCategoriesByType = async (type) => {
  const database = await getDatabase();
  return await database.getAllAsync(
    'SELECT * FROM categories WHERE type = ? ORDER BY name',
    [type]
  );
};

export const insertCategory = async (name, type) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO categories (name, type) VALUES (?, ?)',
    [name, type]
  );
  return result.lastInsertRowId;
};

// ==================== TRANSACTION CRUD ====================

export const getTransactions = async (filter = 'all', limit = 100) => {
  const database = await getDatabase();

  let query = `
    SELECT 
      t.*,
      w.name as wallet_name,
      w.type as wallet_type,
      w.owner as wallet_owner,
      c.name as category_name,
      c.type as category_type,
      p.name as project_name
    FROM transactions t
    LEFT JOIN wallets w ON t.wallet_id = w.id
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
  `;

  if (filter === 'company') {
    query += " WHERE c.type = 'Company'";
  } else if (filter === 'personal') {
    query += " WHERE c.type = 'Personal'";
  }

  query += ' ORDER BY t.date DESC LIMIT ?';

  return await database.getAllAsync(query, [limit]);
};

export const getTransactionsByDateRange = async (startDate, endDate, projectId = null) => {
  const database = await getDatabase();

  let query = `
    SELECT 
      t.*,
      w.name as wallet_name,
      w.type as wallet_type,
      w.owner as wallet_owner,
      c.name as category_name,
      c.type as category_type,
      p.name as project_name
    FROM transactions t
    LEFT JOIN wallets w ON t.wallet_id = w.id
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE t.date >= ? AND t.date <= ?
  `;

  const params = [startDate, endDate];

  if (projectId) {
    query += ' AND t.project_id = ?';
    params.push(projectId);
  }

  query += ' ORDER BY t.date DESC';

  return await database.getAllAsync(query, params);
};

export const insertTransaction = async (data) => {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO transactions (date, amount, wallet_id, category_id, project_id, city, description, receipt_uri, is_offset_transaction, is_income, is_virtual)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.date,
      data.amount,
      data.wallet_id,
      data.category_id,
      data.project_id || null,
      data.city || null,
      data.description || null,
      data.receipt_uri || null,
      data.is_offset_transaction ? 1 : 0,
      data.is_income ? 1 : 0,
      data.is_virtual ? 1 : 0,
    ]
  );
  return result.lastInsertRowId;
};

export const deleteTransaction = async (transactionId) => {
  const database = await getDatabase();
  // Get the transaction first to reverse balance changes
  const transaction = await database.getFirstAsync(
    'SELECT * FROM transactions WHERE id = ?',
    [transactionId]
  );
  if (transaction) {
    await database.runAsync('DELETE FROM transactions WHERE id = ?', [transactionId]);
  }
  return transaction;
};

// ==================== CITIES (for autocomplete) ====================

export const getDistinctCities = async () => {
  const database = await getDatabase();
  const results = await database.getAllAsync(
    "SELECT DISTINCT city FROM transactions WHERE city IS NOT NULL AND city != '' ORDER BY city"
  );
  return results.map((r) => r.city);
};

// ==================== EXPORT ====================

export const exportAllData = async () => {
  const database = await getDatabase();
  const wallets = await database.getAllAsync('SELECT * FROM wallets');
  const projects = await database.getAllAsync('SELECT * FROM projects');
  const categories = await database.getAllAsync('SELECT * FROM categories');
  const transactions = await database.getAllAsync(
    `SELECT t.*, w.name as wallet_name, c.name as category_name, p.name as project_name
     FROM transactions t
     LEFT JOIN wallets w ON t.wallet_id = w.id
     LEFT JOIN categories c ON t.category_id = c.id
     LEFT JOIN projects p ON t.project_id = p.id
     ORDER BY t.date DESC`
  );

  return {
    exportDate: new Date().toISOString(),
    wallets,
    projects,
    categories,
    transactions,
  };
};
