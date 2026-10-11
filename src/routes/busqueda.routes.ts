import { Router } from "express";
import { searchHandler, destacadosHandler } from "../controllers/busqueda.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.get("/destacados", destacadosHandler);
router.use(authenticate);
router.get("/prestadores", searchHandler);
export default router;
