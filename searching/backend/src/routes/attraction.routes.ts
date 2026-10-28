import { Router } from "express";
import { getAttractions } from "../controllers/attraction.controller";

const router = Router();

router.get("/", getAttractions);

export default router;