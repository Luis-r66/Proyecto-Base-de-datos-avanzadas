import { Router } from "express";
import { sendMessageHandler, getMensajesHandler, marcarMensajeLeidoHandler, getNotificacionesHandler, marcarNotificacionLeidaHandler, marcarTodasNotificacionesLeidasHandler, getMensajesPredeterminadosHandler } from "@/controllers/mensaje.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { sendMessageSchema, messageParamsSchema, messageQuerySchema, notificationParamsSchema, notificationQuerySchema } from "@/utils/mensaje.validation";

const router = Router();

// Todas requieren autenticacion
router.use(authenticate);

// Mensajes dentro de una negociacion
router.post("/negociaciones/:id/mensajes", validate(messageParamsSchema, 'params'), validate(sendMessageSchema, 'body'), sendMessageHandler);
router.get("/negociaciones/:id/mensajes", validate(messageParamsSchema, 'params'), validate(messageQuerySchema, 'query'), getMensajesHandler);
router.patch("/mensajes/:id/leer", validate(messageParamsSchema, 'params'), marcarMensajeLeidoHandler);

// Mensajes predeterminados (publicos para usuarios autenticados)
router.get("/mensajes-predeterminados", getMensajesPredeterminadosHandler);

// Notificaciones
router.get("/notificaciones", validate(notificationQuerySchema, 'query'), getNotificacionesHandler);
router.patch("/notificaciones/:id/leer", validate(notificationParamsSchema, 'params'), marcarNotificacionLeidaHandler);
router.patch("/notificaciones/leer-todas", marcarTodasNotificacionesLeidasHandler);

export default router;
