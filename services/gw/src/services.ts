import { pool } from "./db";
import utils from "./utils";


const createUser = async (username: string, email: string, password: string) => {
  const hashed = await utils.hash.hashPassword(password);
  const query = `
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at;
  `;
  const values = [username, email, hashed];
  const result = await pool.query(query, values);
  return result.rows[0];
};



export default {
  createUser
}