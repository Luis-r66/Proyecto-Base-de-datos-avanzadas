import { Router } from "express";
import { calificarHandler, getMisCalificacionesHandler, crearReporteHandler, getReportesHandler, updateReporteHandler } from "@/controllers/calificacion.controller";
import { authenticate, requireRole } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { calificarSchema, reporteSchema, reporteParamsSchema, reporteQuerySchema } from "@/utils/calificacion.validation";

const router = Router();

// Calificaciones (usuario autenticado)
router.use(authenticate);

router.post("/calificaciones", validate(calificarSchema, 'body'), calificarHandler);
router.get("/calificaciones/mis", getMisCalificacionesHandler);

// Reportes (usuario autenticado)
router.post("/reportes", validate(reporteSchema, 'body'), crearReporteHandler);

// Admin para gestionar reportes
router.get("/reportes", authenticate, requireRole("Admin"), validate(reporteQuerySchema, 'query'), getReportesHandler);
router.patch("/reportes/:id", authenticate, requireRole("Admin"), validate(reporteParamsSchema, 'params'), updateReporteHandler);

export default router;
