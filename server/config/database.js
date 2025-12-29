const mysql = require("mysql");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || process.env.DB_HOST,
  user: process.env.MYSQLUSER || process.env.DB_USER,
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
  database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  port: process.env.MYSQLPORT || 3306,
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err);
  } else {
    console.log("MySQL connected successfully");
  }
});

module.exports = db;
