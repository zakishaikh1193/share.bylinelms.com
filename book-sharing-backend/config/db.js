require("dotenv").config();
const mysql = require('mysql2/promise');

console.log("⏳ Attempting DB connection...");
console.log("🔍 DB_HOST:", process.env.DB_HOST);
console.log("🔍 DB_USER:", process.env.DB_USER);
console.log("🔍 DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("🔍 DB_NAME:", process.env.DB_NAME);

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ Connected to MySQL');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL connection error:', err);
    if (err && err.sqlMessage) {
      console.error('💥 SQL Error Message:', err.sqlMessage);
    }
    if (err && err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error(`
❗ MySQL ACCESS DENIED ERROR
   🔸 Check if the user '${process.env.DB_USER}' is created in cPanel
   🔸 Check if this user has been assigned to DB '${process.env.DB_NAME}'
   🔸 Check if password is correct (no typos or invisible whitespace)
      - If unsure, reset it in cPanel and update .env

✅ Use phpMyAdmin or SSH to verify:
   mysql -u ${process.env.DB_USER} -p
`);
    }
  }
})();

module.exports = db;