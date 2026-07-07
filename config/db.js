// config/db.js
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const connectDB = async () => {
  try {
    // Test the database connection by querying the current time
    const res = await pool.query('SELECT NOW()');
    console.log(`✅ PostgreSQL Container Connected Successfully!`);
    console.log(`Database server time: ${res.rows[0].now}`);
  } catch (error) {
    console.error(`❌ PostgreSQL Connection Failed!`);
    console.error(`Detailed Error: ${error.message}`);
    process.exit(1);
  }
};

export default pool;