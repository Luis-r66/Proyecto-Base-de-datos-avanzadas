import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  cancelarHandler,
  completarHandler,
  crearHandler,
  entregarHandler,
  iniciarHandler,
  misPedidosHandler,
  obtenerHandler,
  revisionHandler,
  ventasHandler,
} from "../controllers/pedido.controller";

const router = Router();
router.use(authenticate);
router.post("/", crearHandler);
router.get("/", misPedidosHandler);
router.get("/ventas", ventasHandler);
router.get("/:id", obtenerHandler);
router.patch("/:id/iniciar", iniciarHandler);
router.patch("/:id/entregar", entregarHandler);
router.patch("/:id/revision", revisionHandler);
router.patch("/:id/completar", completarHandler);
router.patch("/:id/cancelar", cancelarHandler);

export default router;
