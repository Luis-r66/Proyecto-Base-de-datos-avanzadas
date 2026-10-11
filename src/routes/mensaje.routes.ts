import { Router } from "express";
import { sendHandler, listHandler, notifHandler, leerNotifHandler, leerTodasHandler, predetHandler } from "../controllers/mensaje.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { sendMessageSchema } from "../utils/mensaje.validation";

const router = Router();
router.use(authenticate);
router.post("/negociaciones/:id/mensajes", validateBody(sendMessageSchema), sendHandler);
router.get("/negociaciones/:id/mensajes", listHandler);
router.get("/mensajes-predeterminados", predetHandler);
router.get("/notificaciones", notifHandler);
router.patch("/notificaciones/:id/leer", leerNotifHandler);
router.patch("/notificaciones/leer-todas", leerTodasHandler);
export default router;
