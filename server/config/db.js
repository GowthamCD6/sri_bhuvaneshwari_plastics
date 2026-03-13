const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance and reliability
// TiDB Cloud Configuration with optimized settings
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 4000,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    maxIdle: 5,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 20000,
    acquireTimeout: 30000,
    timeout: 60000,
    ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false
    }
});

// Old Local MySQL Configuration (Commented)
// const pool = mysql.createPool({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     waitForConnections: true,
//     connectionLimit: 10,
//     queueLimit: 0,
//     enableKeepAlive: true,
//     keepAliveInitialDelay: 0
// });

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