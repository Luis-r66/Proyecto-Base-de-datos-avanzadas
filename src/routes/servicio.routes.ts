import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import {
  actualizarHandler,
  buscarHandler,
  crearHandler,
  dePrestadorHandler,
  destacadosHandler,
  eliminarHandler,
  misServiciosHandler,
  obtenerHandler,
} from "../controllers/servicio.controller";

const router = Router();

router.get("/", buscarHandler);
router.get("/destacados", destacadosHandler);
router.get("/prestador/:usuarioId", dePrestadorHandler);
router.get("/mios", authenticate, misServiciosHandler);
router.get("/:id", obtenerHandler);
router.post("/", authenticate, requireRole("Prestador"), crearHandler);
router.patch("/:id", authenticate, requireRole("Prestador"), actualizarHandler);
router.delete("/:id", authenticate, requireRole("Prestador"), eliminarHandler);

export default router;
