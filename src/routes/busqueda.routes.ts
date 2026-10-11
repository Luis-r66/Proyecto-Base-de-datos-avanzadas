import { Router } from "express";
import { searchPrestadoresHandler, getDestacadosHandler } from "@/controllers/busqueda.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { searchPrestadoresSchema, destacadosQuerySchema } from "@/utils/busqueda.validation";

const router = Router();

// Prestadores destacados (publico, sin autenticacion) - antes del middleware auth
router.get("/destacados", validate(destacadosQuerySchema, 'query'), getDestacadosHandler);

// Buscar prestadores por categoria (requiere autenticacion)
router.use(authenticate);

router.get("/prestadores", validate(searchPrestadoresSchema, 'query'), searchPrestadoresHandler);

export default router;
