const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

module.exports = {
    registerUser: async (email, password) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        const client = await pool.connect();
        try {
            await client.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, hashedPassword]);
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    },
    getUserByEmail: async (email) => {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT * FROM users WHERE email = $1', [email]);
            return res.rows[0];
        } catch (error) {
            throw error;
        } finally {
            client.release();
        }
    }
};