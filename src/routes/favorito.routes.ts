import { Router } from "express";
import { toggleHandler, removeHandler, listHandler } from "../controllers/favorito.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validateBody";
import { favoritoBodySchema } from "../utils/favorito.validation";
import { paginationQuerySchema } from "../utils/perfil.validation";

const router = Router();
router.use(authenticate);

router.post("/favoritos", validate(favoritoBodySchema, "body"), toggleHandler);
router.get("/favoritos", validate(paginationQuerySchema, "query"), listHandler);
router.delete("/favoritos/:prestadorId", removeHandler);

export default router;
