import { Router } from "express";
import { subirImagenHandler } from "../controllers/archivo.controller";
import { authenticate } from "../middleware/auth";
import { subirImagenMiddleware } from "../middleware/upload";

const router = Router();
router.use(authenticate);

router.post("/imagen", subirImagenMiddleware, subirImagenHandler);

export default router;
