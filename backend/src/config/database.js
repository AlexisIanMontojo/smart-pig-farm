const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const sslEnabled = process.env.DB_SSL === 'true';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dateStrings: true,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    ssl: sslEnabled
        ? {
            ca: fs.readFileSync(
                path.resolve(__dirname, '../../certs/ca.pem')
            ),
            rejectUnauthorized: true,
        }
        : undefined,
});

module.exports = pool;
