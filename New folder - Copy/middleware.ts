import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./utils";
import { fail } from "./utils";

export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return fail(res, 401, "Unauthorized", "UNAUTHORIZED");
  }
  try {
    req.user = verifyToken(header.split(" ")[1]);
    next();
  } catch {
    return fail(res, 401, "Invalid or expired token", "INVALID_TOKEN");
  }
};

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);
  return fail(
    res,
    err.status || 500,
    err.message || "Internal Server Error",
    err.errorCode || "INTERNAL_ERROR"
  );
};