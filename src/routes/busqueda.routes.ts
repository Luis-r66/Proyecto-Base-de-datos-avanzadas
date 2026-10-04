import { Router } from "express";
import { searchPrestadoresHandler, getDestacadosHandler } from "@/controllers/busqueda.controller";
import { authenticate } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { searchPrestadoresSchema, destacadosQuerySchema } from "@/utils/busqueda.validation";

const router = Router();

// Buscar prestadores por categoria (requiere autenticacion)
router.use(authenticate);

router.get("/prestadores", validate(searchPrestadoresSchema), searchPrestadoresHandler);

// Prestadores destacados (publico, sin autenticacion)
router.get("/destacados", validate(destacadosQuerySchema), getDestacadosHandler);

export default router;
