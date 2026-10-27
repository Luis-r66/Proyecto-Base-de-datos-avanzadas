import { Router } from "express";
import {
  iniciarHandler,
  acordarHandler,
  negociarHandler,
  enProgresoHandler,
  completarHandler,
  cancelarHandler,
  porCodigoHandler,
  verUnaHandler,
  misHandler,
} from "../controllers/negociacion.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import { iniciarSchema, acordarSchema } from "../utils/negociacion.validation";

const router = Router();

// Publico por codigo de seguimiento (sin sesion)
router.get("/track/:codigo", porCodigoHandler);

router.use(authenticate);

router.post("/", validate(iniciarSchema, "body"), iniciarHandler);
router.get("/", misHandler);
router.get("/mis", misHandler);
router.get("/:id", verUnaHandler);
router.patch("/:id/negociar", negociarHandler);
router.patch("/:id/acordar", validate(acordarSchema, "body"), acordarHandler);
router.patch("/:id/en-progreso", enProgresoHandler);
router.patch("/:id/completar", completarHandler);
router.patch("/:id/cancelar", cancelarHandler);

export default router;
