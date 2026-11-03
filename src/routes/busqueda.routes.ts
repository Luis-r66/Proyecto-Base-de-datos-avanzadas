import { Router } from "express";
import { searchHandler, destacadosHandler } from "../controllers/busqueda.controller";
import { optionalAuthenticate } from "../middleware/auth";

const router = Router();
router.get("/destacados", destacadosHandler);
router.get("/prestadores", optionalAuthenticate, searchHandler);
export default router;
