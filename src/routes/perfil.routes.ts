import { Router } from "express";
import { createPerfilPrestadorHandler, getMyPerfilPrestadorHandler, getPerfilPrestadorPublicHandler, updateMyPerfilPrestadorHandler, createTrabajoPortafolioHandler, getMyTrabajosPortafolioHandler, getTrabajoPortafolioPublicHandler, updateTrabajoPortafolioHandler, deleteTrabajoPortafolioHandler } from "@/controllers/perfil.controller";
import { authenticate, requireActiveAccount } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { createPerfilPrestadorSchema, updatePerfilPrestadorSchema, createTrabajoPortafolioSchema, updateTrabajoPortafolioSchema, portafolioQuerySchema, prestadorParamsSchema } from "@/utils/perfil.validation";

const router = Router();

// Perfil de prestador (requiere autenticacion y cuenta activa)
router.use(authenticate, requireActiveAccount);

router.post("/prestador", validate(createPerfilPrestadorSchema), createPerfilPrestadorHandler);
router.get("/prestador", getMyPerfilPrestadorHandler);
router.patch("/prestador", validate(updatePerfilPrestadorSchema), updateMyPerfilPrestadorHandler);

// Portafolio (requiere perfil de prestador activo)
router.post("/prestador/portafolio", validate(createTrabajoPortafolioSchema), createTrabajoPortafolioHandler);
router.get("/prestador/portafolio", validate(portafolioQuerySchema), getMyTrabajosPortafolioHandler);

// Publicos (sin autenticacion, solo lectura)
router.get("/prestador/:id", validate(prestadorParamsSchema), getPerfilPrestadorPublicHandler);
router.get("/portafolio/:id", validate(prestadorParamsSchema), getTrabajoPortafolioPublicHandler);

// Portafolio - propietario
router.patch("/prestador/portafolio/:id", validate(updateTrabajoPortafolioSchema), updateTrabajoPortafolioHandler);
router.delete("/prestador/portafolio/:id", validate(prestadorParamsSchema), deleteTrabajoPortafolioHandler);

export default router;
