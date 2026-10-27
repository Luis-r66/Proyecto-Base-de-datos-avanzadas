import { Router } from "express";
import { calificarHandler, misCalifHandler, calificacionesDePrestadorHandler } from "../controllers/calificacion.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import { calificarSchema } from "../utils/calificacion.validation";
import { paginationQuerySchema } from "../utils/perfil.validation";

const router = Router();
router.use(authenticate);

router.post("/calificaciones", validate(calificarSchema, "body"), calificarHandler);
router.get("/calificaciones/mis", validate(paginationQuerySchema, "query"), misCalifHandler);
router.get("/calificaciones/prestador/:usuarioId", validate(paginationQuerySchema, "query"), calificacionesDePrestadorHandler);

export default router;
