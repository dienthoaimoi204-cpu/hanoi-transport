import { Router } from "express";
import { planRoute } from "../controllers/routing.controller";

const router = Router();

router.post("/plan", planRoute);

export default router;