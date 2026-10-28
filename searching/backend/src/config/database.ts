import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config: sql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || "localhost",
    database: process.env.DB_DATABASE,
    port: Number(process.env.DB_PORT) || 1433,

    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE === "true"
    }
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
    if (pool) {
        return pool;
    }

    try {
        pool = await sql.connect(config);

        console.log("SQL Server connected successfully.");

        return pool;
    } catch (error) {
        console.error("SQL Server connection failed:", error);
        throw error;
    }
}