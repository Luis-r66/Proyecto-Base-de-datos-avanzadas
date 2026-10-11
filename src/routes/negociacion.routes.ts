import { Router } from "express";
import { iniciarNegociacionHandler, acordarNegociacionHandler, marcarEnProgresoHandler, completarNegociacionHandler, getNegociacionHandler, getNegociacionByCodigoHandler, getMisNegociacionesHandler } from "@/controllers/negociacion.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { iniciarNegociacionSchema, acordarNegociacionSchema, negociacionParamsSchema, trackingParamsSchema } from "@/utils/negociacion.validation";

const router = Router();

// Publico por codigo de seguimiento (sin auth) - debe ir ANTES del middleware authenticate
router.get("/track/:codigo", validate(trackingParamsSchema, 'params'), getNegociacionByCodigoHandler);

// Todas las demás requieren autenticacion
router.use(authenticate);

router.post("/", validate(iniciarNegociacionSchema, 'body'), iniciarNegociacionHandler);
router.get("/mis", getMisNegociacionesHandler);
router.get("/:id", validate(negociacionParamsSchema, 'params'), getNegociacionHandler);
router.patch("/:id/acordar", validate(acordarNegociacionSchema, 'body'), acordarNegociacionHandler);
router.patch("/:id/en-progreso", marcarEnProgresoHandler);
router.patch("/:id/completar", completarNegociacionHandler);

export default router;
