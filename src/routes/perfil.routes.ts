import { Router } from "express";
import { createPerfilHandler, getMiPerfilHandler, getPublicoHandler, updateMiPerfilHandler, createTrabajoHandler, getMisTrabajosHandler } from "../controllers/perfil.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { createPerfilSchema, updatePerfilSchema, createTrabajoSchema } from "../utils/perfil.validation";

const router = Router();
router.get("/prestador/:id", getPublicoHandler);
router.use(authenticate);
router.post("/prestador", validateBody(createPerfilSchema), createPerfilHandler);
router.get("/prestador", getMiPerfilHandler);
router.patch("/prestador", validateBody(updatePerfilSchema), updateMiPerfilHandler);
router.post("/prestador/portafolio", validateBody(createTrabajoSchema), createTrabajoHandler);
router.get("/prestador/portafolio", getMisTrabajosHandler);
export default router;
