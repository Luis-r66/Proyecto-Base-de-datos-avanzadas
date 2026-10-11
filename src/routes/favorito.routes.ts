import { Router } from "express";
import { toggleFavoritoHandler, getFavoritosHandler, verificarUsuarioHandler } from "@/controllers/favorito.controller";
import { authenticate, requireRole } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { favoritoParamsSchema, favoritoQuerySchema, verifyUsuarioSchema, verifyParamsSchema } from "@/utils/favorito.validation";

const router = Router();

// Favoritos (usuario autenticado)
router.use(authenticate);

router.post("/favoritos/:prestadorId", validate(favoritoParamsSchema, 'params'), toggleFavoritoHandler);
router.get("/favoritos", validate(favoritoQuerySchema, 'query'), getFavoritosHandler);

// Verificacion institucional (Admin)
router.patch("/admin/usuarios/:id/verificar", requireRole("Admin"), validate(verifyParamsSchema, 'params'), validate(verifyUsuarioSchema, 'body'), verificarUsuarioHandler);

export default router;
