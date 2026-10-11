import { Router } from "express";
import { createPerfilPrestadorHandler, getMyPerfilPrestadorHandler, getPerfilPrestadorPublicHandler, updateMyPerfilPrestadorHandler, createTrabajoPortafolioHandler, getMyTrabajosPortafolioHandler, getTrabajoPortafolioPublicHandler, updateTrabajoPortafolioHandler, deleteTrabajoPortafolioHandler } from "@/controllers/perfil.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { createPerfilPrestadorSchema, updatePerfilPrestadorSchema, createTrabajoPortafolioSchema, updateTrabajoPortafolioSchema, portafolioQuerySchema, prestadorParamsSchema } from "@/utils/perfil.validation";

const router = Router();

// Publicos (sin autenticacion, solo lectura) - antes del middleware auth
router.get("/prestador/:id", validate(prestadorParamsSchema, 'params'), getPerfilPrestadorPublicHandler);
router.get("/portafolio/:id", validate(prestadorParamsSchema, 'params'), getTrabajoPortafolioPublicHandler);

// Todo lo demás requiere autenticacion (la cuenta activa la valida el service)
router.use(authenticate);

router.post("/prestador", validate(createPerfilPrestadorSchema, 'body'), createPerfilPrestadorHandler);
router.get("/prestador", getMyPerfilPrestadorHandler);
router.patch("/prestador", validate(updatePerfilPrestadorSchema, 'body'), updateMyPerfilPrestadorHandler);

// Portafolio (requiere perfil de prestador activo)
router.post("/prestador/portafolio", validate(createTrabajoPortafolioSchema, 'body'), createTrabajoPortafolioHandler);
router.get("/prestador/portafolio", validate(portafolioQuerySchema, 'query'), getMyTrabajosPortafolioHandler);

// Portafolio - propietario
router.patch("/prestador/portafolio/:id", validate(updateTrabajoPortafolioSchema, 'body'), updateTrabajoPortafolioHandler);
router.delete("/prestador/portafolio/:id", validate(prestadorParamsSchema, 'params'), deleteTrabajoPortafolioHandler);

export default router;
