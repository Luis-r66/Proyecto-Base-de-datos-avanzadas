import { Router } from "express";
import { createHandler, listHandler, getHandler, updateHandler, deleteHandler } from "../controllers/categoria.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validateBody } from "../middleware/validateBody";
import { createCategoriaSchema, updateCategoriaSchema } from "../utils/categoria.validation";

const router = Router();
router.use(authenticate, requireRole("Admin"));
router.post("/", validateBody(createCategoriaSchema), createHandler);
router.get("/", listHandler);
router.get("/:id", getHandler);
router.patch("/:id", validateBody(updateCategoriaSchema), updateHandler);
router.delete("/:id", deleteHandler);
export default router;
