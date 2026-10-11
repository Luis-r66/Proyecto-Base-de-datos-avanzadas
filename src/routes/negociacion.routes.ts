import { Router } from "express";
import { iniciarHandler, acordarHandler, enProgresoHandler, completarHandler, porCodigoHandler, misHandler } from "../controllers/negociacion.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { iniciarSchema, acordarSchema } from "../utils/negociacion.validation";

const router = Router();
router.get("/track/:codigo", porCodigoHandler);
router.use(authenticate);
router.post("/", validateBody(iniciarSchema), iniciarHandler);
router.get("/mis", misHandler);
router.patch("/:id/acordar", validateBody(acordarSchema), acordarHandler);
router.patch("/:id/en-progreso", enProgresoHandler);
router.patch("/:id/completar", completarHandler);
export default router;
