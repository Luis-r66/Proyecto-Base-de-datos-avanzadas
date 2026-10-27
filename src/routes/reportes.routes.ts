import { Router } from "express";
import { crearReporteHandler, getReportesHandler, updateReporteHandler } from "../controllers/reporte.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import { reporteSchema } from "../utils/calificacion.validation";
import { reporteQuerySchema, updateReporteEstadoSchema } from "../utils/reporte.validation";

const router = Router();

router.use(authenticate);

// Cualquier usuario autenticado puede reportar
router.post("/", validate(reporteSchema, "body"), crearReporteHandler);

// Solo Administrador gestiona reportes
router.get("/", requireRole("Admin"), validate(reporteQuerySchema, "query"), getReportesHandler);
router.patch("/:id", requireRole("Admin"), validate(updateReporteEstadoSchema, "body"), updateReporteHandler);

export default router;
