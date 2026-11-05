import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const sqlConfig = {
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "MatKhau123@",
  database: process.env.DB_DATABASE || "PublicTransportDB",
  server: process.env.DB_SERVER || "localhost",
  port: Number(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true, // Quan trọng để không bị lỗi SSL trên local
  },
};

let pool: sql.ConnectionPool | null = null;

export const getPool = async (): Promise<sql.ConnectionPool> => {
  if (!pool) {
    try {
      pool = await sql.connect(sqlConfig);
      console.log("✅ Đã kết nối SQL Server thành công!");
    } catch (err) {
      console.error("❌ Lỗi kết nối SQL Server:", err);
      throw err;
    }
  }
  return pool;
};