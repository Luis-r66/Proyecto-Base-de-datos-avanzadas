import { Router } from "express";
import { calificarHandler, misCalifHandler, reportarHandler } from "../controllers/calificacion.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { calificarSchema, reporteSchema } from "../utils/calificacion.validation";

const router = Router();
router.use(authenticate);
router.post("/calificaciones", validateBody(calificarSchema), calificarHandler);
router.get("/calificaciones/mis", misCalifHandler);
router.post("/reportes", validateBody(reporteSchema), reportarHandler);
export default router;
