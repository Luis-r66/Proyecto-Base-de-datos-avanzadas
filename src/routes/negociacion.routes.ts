import { Router } from "express";
import { iniciarNegociacionHandler, acordarNegociacionHandler, marcarEnProgresoHandler, completarNegociacionHandler, getNegociacionHandler, getNegociacionByCodigoHandler, getMisNegociacionesHandler } from "@/controllers/negociacion.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { iniciarNegociacionSchema, acordarNegociacionSchema, negociacionParamsSchema, trackingParamsSchema } from "@/utils/negociacion.validation";

const router = Router();

// Todas requieren autenticacion excepto tracking publico
router.use(authenticate);

router.post("/", validate(iniciarNegociacionSchema), iniciarNegociacionHandler);
router.get("/mis", getMisNegociacionesHandler);
router.get("/:id", validate(negociacionParamsSchema), getNegociacionHandler);
router.patch("/:id/acordar", validate(acordarNegociacionSchema), acordarNegociacionHandler);
router.patch("/:id/en-progreso", marcarEnProgresoHandler);
router.patch("/:id/completar", completarNegociacionHandler);

// Publico por codigo de seguimiento (sin auth)
router.get("/track/:codigo", validate(trackingParamsSchema), getNegociacionByCodigoHandler);

export default router;
