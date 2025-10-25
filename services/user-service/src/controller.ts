import { Request, Response } from "express";
import utils from "./utils";
import {pool }from "./db"
import service from "./services"


const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows[0]) return res.status(400).json({ error: "Email already exists" });

    const user = await service.createUser(username, email, password);
    return res.status(201).json(user);
  } catch (err) {
    console.error("Error Register => ", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user)  return res.status(404).json({ error: "User not found" });

    const valid = await utils.hash.comparePassword(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    const token = utils.jwt.generateToken(user.id);
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("Error Login => ", err);
    res.status(500).json({ error: "Login failed" });
  }
};


export default {
    register,
    login
}