import { Router } from "express";
import { createHandler, listHandler, getHandler, updateHandler, deleteHandler } from "../controllers/categoria.controller";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import { createCategoriaSchema, updateCategoriaSchema } from "../utils/categoria.validation";

const router = Router();

// La lectura es publica para la landing y los selectores del frontend.
router.get("/", listHandler);
router.get("/:id", getHandler);

// Solo Administrador puede crear, editar y eliminar
router.use(authenticate);
router.post("/", requireRole("Admin"), validate(createCategoriaSchema, "body"), createHandler);
router.patch("/:id", requireRole("Admin"), validate(updateCategoriaSchema, "body"), updateHandler);
router.delete("/:id", requireRole("Admin"), deleteHandler);

export default router;
