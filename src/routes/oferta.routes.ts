import { Router } from "express";
import {
  aceptarHandler,
  rechazarHandler,
  retirarHandler,
  contraofertaHandler,
} from "../controllers/oferta.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import { contraofertaSchema } from "../utils/conversacion.validation";

const router = Router();
router.use(authenticate);

router.patch("/:id/aceptar", aceptarHandler);
router.patch("/:id/rechazar", rechazarHandler);
router.patch("/:id/retirar", retirarHandler);
router.patch("/:id/contraoferta", validate(contraofertaSchema, "body"), contraofertaHandler);

export default router;
