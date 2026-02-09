const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance and reliability
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test the connection
pool.getConnection((err, connection) => {
    if (err) {
        console.log("Database Connection Failed:", err);
    } else {
        console.log("Database Connected Successfully");
        connection.release(); // Release the connection back to the pool
    }
});

// Export promise-based pool for async/await support
module.exports = pool.promise();