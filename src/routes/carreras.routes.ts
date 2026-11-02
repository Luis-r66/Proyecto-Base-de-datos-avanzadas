import { Router } from "express";
import { CARRERAS } from "../config/carreras";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ data: CARRERAS });
});

export default router;
