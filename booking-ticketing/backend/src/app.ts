import express from "express";
import cors from "cors";
import { env } from "./utils";
import routes from "./routes";
import { errorHandler } from "./middleware";

const bootstrap = async () => {
  const app = express();

  // Cấu hình các middleware cơ bản
  app.use(cors());
  app.use(express.json());

  // Route kiểm tra server có đang sống không
  app.get("/health", (_req, res) => res.json({ ok: true }));

  // Gắn toàn bộ API vào đường dẫn /api/v1
  app.use("/api/v1", routes);

  // Middleware xử lý lỗi (phải đặt cuối cùng)
  app.use(errorHandler);

  // Khởi động server
  app.listen(env.PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Server đang chạy tại: http://localhost:${env.PORT}`);
    console.log(`👉 Lưu ý: Hãy chắc chắn Docker (SQL Server) đang chạy!`);
    console.log(`=========================================`);
  });
};

bootstrap();