import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import stationRoutes from "./routes/station.routes";
import attractionRoutes from "./routes/attraction.routes";
import routingRoutes from "./routes/routing.routes";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use("/api/v1/stations", stationRoutes);
app.use("/api/v1/attractions", attractionRoutes);
app.use("/api/v1/routes", routingRoutes);

// Test API
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Public Transport API is running"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});