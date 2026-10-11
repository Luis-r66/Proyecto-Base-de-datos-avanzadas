import { Router } from "express";
import { createCategoriaHandler, getCategoriasHandler, getCategoriaHandler, updateCategoriaHandler, deleteCategoriaHandler } from "@/controllers/categoria.controller";
import { authenticate, requireRole } from "@/middleware/auth";
import { validate } from "@/middleware/validation";
import { createCategoriaSchema, updateCategoriaSchema, categoriaParamsSchema } from "@/utils/categoria.validation";

const router = Router();

router.use(authenticate, requireRole("Admin"));

router.post("/", validate(createCategoriaSchema, 'body'), createCategoriaHandler);
router.get("/", getCategoriasHandler);
router.get("/:id", validate(categoriaParamsSchema, 'params'), getCategoriaHandler);
router.patch("/:id", validate(updateCategoriaSchema, 'body'), updateCategoriaHandler);
router.delete("/:id", validate(categoriaParamsSchema, 'params'), deleteCategoriaHandler);

export default router;
