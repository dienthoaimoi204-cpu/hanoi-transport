import { Request, Response, NextFunction } from "express";
import { verifyToken, fail } from "./utils";

// Khai báo kiểu dữ liệu cho Request có chứa thông tin user (sau khi giải mã token)
export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

// Middleware kiểm tra xem người dùng đã đăng nhập chưa
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
    const token = header.split(" ")[1];
    req.user = verifyToken(token);
    next();
  } catch (error) {
    return fail(res, 401, "Invalid or expired token", "INVALID_TOKEN");
  }
};

// Middleware bắt và xử lý tất cả các lỗi phát sinh trong hệ thống
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("❌ Lỗi hệ thống:", err);
  return fail(
    res,
    err.status || 500,
    err.message || "Internal Server Error",
    err.errorCode || "INTERNAL_ERROR"
  );
};