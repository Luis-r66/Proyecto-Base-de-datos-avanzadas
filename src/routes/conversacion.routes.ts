import { Router } from "express";
import {
  crearHandler,
  listarHandler,
  obtenerHandler,
  leerHandler,
  leerTodasHandler,
  mensajesHandler,
  enviarHandler,
  ofertasHandler,
  crearOfertaHandler,
} from "../controllers/conversacion.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import { crearConversacionSchema, crearOfertaSchema } from "../utils/conversacion.validation";
import { sendMessageSchema } from "../utils/mensaje.validation";

const router = Router();
router.use(authenticate);

router.post("/", validate(crearConversacionSchema, "body"), crearHandler);
router.get("/", listarHandler);
router.patch("/leer-todas", leerTodasHandler);
router.get("/:id", obtenerHandler);
router.patch("/:id/leer", leerHandler);
router.get("/:id/mensajes", mensajesHandler);
router.post("/:id/mensajes", validate(sendMessageSchema, "body"), enviarHandler);
router.get("/:id/ofertas", ofertasHandler);
router.post("/:id/ofertas", validate(crearOfertaSchema, "body"), crearOfertaHandler);

export default router;
