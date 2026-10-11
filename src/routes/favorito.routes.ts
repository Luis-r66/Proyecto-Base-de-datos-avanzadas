import { Router } from "express";
import { toggleHandler, listHandler, verificarHandler } from "../controllers/favorito.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { favoritoBodySchema, verifyBodySchema } from "../utils/favorito.validation";

const router = Router();
router.use(authenticate);
router.post("/favoritos", validateBody(favoritoBodySchema), toggleHandler);
router.get("/favoritos", listHandler);
router.patch("/admin/usuarios/:id/verificar", requireRole("Admin"), validateBody(verifyBodySchema), verificarHandler);
export default router;
