import { Router } from "express";
import {
  actualizarHandler,
  crearHandler,
  detalleHandler,
  fusionarHandler,
  listarHandler,
  ocultarHandler,
  popularesHandler,
  resolverHandler,
  sugerenciasHandler,
} from "../controllers/etiqueta.controller";
import { authenticate, optionalAuthenticate, requireRole } from "../middleware/auth";
import {
  actualizarEtiquetaSchema,
  crearEtiquetaSchema,
  fusionarEtiquetaSchema,
  resolverEtiquetasSchema,
} from "../utils/etiqueta.validation";
import { validate } from "../middleware/validateBody";

const router = Router();

// Catálogo público.
router.get("/", optionalAuthenticate, listarHandler);
router.get("/populares", popularesHandler);
router.get("/sugerencias", sugerenciasHandler);

// Cualquier usuario autenticado puede proponer etiquetas.
router.post("/", authenticate, validate(crearEtiquetaSchema, "body"), crearHandler);
router.post(
  "/resolver",
  authenticate,
  validate(resolverEtiquetasSchema, "body"),
  resolverHandler
);

// Moderación del administrador.
router.patch(
  "/:id",
  authenticate,
  requireRole("Admin"),
  validate(actualizarEtiquetaSchema, "body"),
  actualizarHandler
);
router.delete("/:id", authenticate, requireRole("Admin"), ocultarHandler);
router.post(
  "/:id/fusionar",
  authenticate,
  requireRole("Admin"),
  validate(fusionarEtiquetaSchema, "body"),
  fusionarHandler
);

// Debe ir al final para no capturar /populares ni /sugerencias.
router.get("/:slug", detalleHandler);

export default router;
