import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "@/config/db";
import { errorHandler, notFoundHandler } from "@/middleware/errorHandler";
import { env } from "@/config/env";
import authRoutes from "@/routes/auth.routes";
import categoriasRoutes from "@/routes/categorias.routes";
import perfilRoutes from "@/routes/perfil.routes";
import busquedaRoutes from "@/routes/busqueda.routes";
import negociacionRoutes from "@/routes/negociacion.routes";
import mensajeRoutes from "@/routes/mensaje.routes";
import calificacionRoutes from "@/routes/calificacion.routes";
import favoritoRoutes from "@/routes/favorito.routes";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/perfiles", perfilRoutes);
app.use("/api/busquedas", busquedaRoutes);
app.use("/api/negociaciones", negociacionRoutes);
app.use("/api/mensajes", mensajeRoutes);
app.use("/api", calificacionRoutes);
app.use("/api", favoritoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    
    app.listen(env.PORT, () => {
      console.log("Servidor corriendo en http://localhost:" + env.PORT);
      console.log("Entorno: " + env.NODE_ENV);
    });
  } catch (error) {
    console.error("Error iniciando servidor:", error);
    process.exit(1);
  }
}

start();

export default app;
