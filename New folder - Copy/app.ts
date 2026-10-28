import express from "express";
import cors from "cors";
import { env, hashPassword } from "./utils";
import { mockData } from "./types";
import routes from "./routes";
import { errorHandler } from "./middleware";

const bootstrap = async () => {
  // Seed user mẫu: an@example.com / 123456
  const seedHash = await hashPassword("123456");
  mockData.users.push({
    UserId: mockData.counters.user++,
    FullName: "Nguyen Van An",
    Email: "an@example.com",
    PasswordHash: seedHash,
    Phone: "0901000001",
    Role: "USER",
    CreatedAt: new Date(),
    UpdatedAt: null,
    Status: "ACTIVE",
  });

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/v1", routes);
  app.use(errorHandler);

  app.listen(env.PORT, () => {
    console.log(`🚀 Server: http://localhost:${env.PORT}`);
    console.log(`👤 Login: an@example.com / 123456`);
  });
};

bootstrap();