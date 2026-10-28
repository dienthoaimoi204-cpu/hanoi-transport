import dotenv from "dotenv";
import { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

export const env = {
  PORT: Number(process.env.PORT || 3000),
  JWT_SECRET: process.env.JWT_SECRET || "dev_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};

export const ok = (res: Response, data: any = null, message = "Success") =>
  res.status(200).json({ success: true, data, message });

export const created = (res: Response, data: any = null, message = "Created") =>
  res.status(201).json({ success: true, data, message });

export const fail = (res: Response, status: number, message: string, errorCode = "ERROR") => 
  res.status(status).json({ success: false, message, errorCode });

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

export interface JwtPayload {
  userId: number;
  role: string;
}

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, env.JWT_SECRET) as JwtPayload;

export const generateTicketCode = (id: number) =>
  `TICKET-${String(id).padStart(6, "0")}`;

export const generateTransactionCode = (id: number) =>
  `MOCK-TXN-${String(id).padStart(6, "0")}`;