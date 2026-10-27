import { Router } from "express";
import { getPrestadoresHandler, verificarHandler } from "../controllers/admin.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import { adminPrestadoresQuerySchema, verifyBodySchema } from "../utils/admin.validation";

const router = Router();

router.use(authenticate, requireRole("Admin"));

router.get("/prestadores", validate(adminPrestadoresQuerySchema, "query"), getPrestadoresHandler);
router.patch("/usuarios/:id/verificar", validate(verifyBodySchema, "body"), verificarHandler);

export default router;
