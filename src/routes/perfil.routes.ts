import { Router } from "express";
import {
  createPerfilHandler,
  getMiPerfilHandler,
  getPublicoHandler,
  getPortafolioPublicoHandler,
  updateMiPerfilHandler,
  createTrabajoHandler,
  getMisTrabajosHandler,
  getTrabajoHandler,
  updateTrabajoHandler,
  deleteTrabajoHandler,
} from "../controllers/perfil.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import {
  createPerfilSchema,
  updatePerfilSchema,
  createTrabajoSchema,
  updateTrabajoSchema,
  paginationQuerySchema,
} from "../utils/perfil.validation";

const router = Router();

// Portafolio publico de un prestador (sin sesion)
router.get("/prestador/:id/portafolio", validate(paginationQuerySchema, "query"), getPortafolioPublicoHandler);

// Portafolio propio (CRUD, solo dueno). Va antes de /:id para no colisionar.
router.get("/prestador/portafolio", authenticate, validate(paginationQuerySchema, "query"), getMisTrabajosHandler);
router.post("/prestador/portafolio", authenticate, validate(createTrabajoSchema, "body"), createTrabajoHandler);
router.get("/prestador/portafolio/:trabajoId", authenticate, getTrabajoHandler);
router.patch("/prestador/portafolio/:trabajoId", authenticate, validate(updateTrabajoSchema, "body"), updateTrabajoHandler);
router.delete("/prestador/portafolio/:trabajoId", authenticate, deleteTrabajoHandler);

// Perfil publico (sin sesion)
router.get("/prestador/:id", getPublicoHandler);

// Mi perfil (requiere sesion)
router.post("/prestador", authenticate, validate(createPerfilSchema, "body"), createPerfilHandler);
router.get("/prestador", authenticate, getMiPerfilHandler);
router.patch("/prestador", authenticate, validate(updatePerfilSchema, "body"), updateMiPerfilHandler);

export default router;
