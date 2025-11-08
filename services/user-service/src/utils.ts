import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "./config";
import { Application } from "express";
import { register as metricsRegister } from 'prom-client';

const SECRET = config.auth.jwt_secret || "supersecret";


const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};


const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, SECRET, { expiresIn: "1d" });
};

const verifyToken = (token: string) => {
  return jwt.verify(token, SECRET);
};


const metricsEndpoint = (app: Application) => {
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', metricsRegister.contentType);
    res.send(await metricsRegister.metrics());
  });
}


export default {
  jwt: {
    generateToken,
    verifyToken
  },
  hash: {
    hashPassword,
    comparePassword
  },
  metrics: {
    metricsEndpoint
  }
}