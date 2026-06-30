const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let dbType = 'sqlite';
let mysqlPool = null;
let sqliteDb = null;

// Helper to check if MySQL is configured
function isMySQLConfigured() {
  return process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;
}

// Initialize SQLite database
async function initSQLite() {
  return new Promise((resolve, reject) => {
    const dbPath = path.join(__dirname, 'database.sqlite');
    sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Failed to connect to SQLite:', err.message);
        return reject(err);
      }
      console.log('Connected to local SQLite database at:', dbPath);
      dbType = 'sqlite';

      // Create tables if they do not exist (SQLite Syntax)
      sqliteDb.serialize(() => {
        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS Users (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS Trusted_Contacts (
            contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            contact_name TEXT NOT NULL,
            phone_number TEXT NOT NULL,
            relationship TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
          )
        `);

        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS Emergency_Alerts (
            alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            gps_coordinates TEXT NOT NULL,
            alert_status TEXT DEFAULT 'Active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
          )
        `);

        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS Route_History (
            route_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            destination TEXT NOT NULL,
            distance TEXT NOT NULL,
            safety_score INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
          )
        `);

        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS Audio_Recordings (
            recording_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            recording_file_path TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            console.error('Failed to initialize SQLite tables:', err.message);
            reject(err);
          } else {
            console.log('SQLite tables initialized successfully.');
            resolve();
          }
        });
      });
    });
  });
}

// Main DB initialization function
async function initDB() {
  if (isMySQLConfigured()) {
    try {
      console.log('Attempting to connect to MySQL database...');
      mysqlPool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      // Test the pool connection
      const connection = await mysqlPool.getConnection();
      console.log('Successfully connected to MySQL database!');
      connection.release();
      dbType = 'mysql';
    } catch (err) {
      console.warn('MySQL Connection failed. Warning:', err.message);
      console.log('Falling back to SQLite...');
      await initSQLite();
    }
  } else {
    console.log('MySQL not configured in .env. Falling back to SQLite...');
    await initSQLite();
  }
}

// Unified query function
async function query(sql, params = []) {
  if (dbType === 'mysql') {
    const [results] = await mysqlPool.execute(sql, params);
    return results;
  } else {
    return new Promise((resolve, reject) => {
      // For SQLite, INSERT queries don't automatically return insertion details in the same structure.
      // We will handle it by wrapping run / all.
      const isInsert = sql.trim().toLowerCase().startsWith('insert');
      const isDeleteOrUpdate = sql.trim().toLowerCase().startsWith('delete') || sql.trim().toLowerCase().startsWith('update');

      if (isInsert || isDeleteOrUpdate) {
        sqliteDb.run(sql, params, function (err) {
          if (err) {
            reject(err);
          } else {
            // Return structured info matching mysql2 format
            resolve({
              insertId: this.lastID,
              affectedRows: this.changes
            });
          }
        });
      } else {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      }
    });
  }
}

module.exports = {
  initDB,
  query,
  getDbType: () => dbType
};
