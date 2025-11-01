import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "./config";

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



export default {
  jwt: {
    generateToken,
    verifyToken
  },
  hash: {
    hashPassword,
    comparePassword
  }
}