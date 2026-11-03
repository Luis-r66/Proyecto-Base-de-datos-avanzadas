import { Router } from "express";
import { register, login, refresh, me, updateMeHandler } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { registerSchema, loginSchema, refreshSchema } from "../utils/auth.validation";

const router = Router();
router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", validateBody(refreshSchema), refresh);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, updateMeHandler);
export default router;
