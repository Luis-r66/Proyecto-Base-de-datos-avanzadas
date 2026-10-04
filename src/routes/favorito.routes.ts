import { Router } from "express";
import { toggleFavoritoHandler, getFavoritosHandler, verificarUsuarioHandler } from "@/controllers/favorito.controller";
import { authenticate, requireRole } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { favoritoParamsSchema, favoritoQuerySchema, verifyUsuarioSchema, verifyParamsSchema } from "@/utils/favorito.validation";

const router = Router();

// Favoritos (usuario autenticado)
router.use(authenticate);

router.post("/favoritos/:prestadorId", validate(favoritoParamsSchema), toggleFavoritoHandler);
router.get("/favoritos", validate(favoritoQuerySchema), getFavoritosHandler);

// Verificacion institucional (Admin)
router.patch("/admin/usuarios/:id/verificar", requireRole("Admin"), validate(verifyParamsSchema), validate(verifyUsuarioSchema), verificarUsuarioHandler);

export default router;
