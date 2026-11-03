import "dotenv/config";
import "express-async-errors";
import express, { Request, Response } from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { env } from "./config/env";

import authRoutes from "./routes/auth.routes";
import categoriasRoutes from "./routes/categorias.routes";
import carrerasRoutes from "./routes/carreras.routes";
import perfilRoutes from "./routes/perfil.routes";
import negociacionRoutes from "./routes/negociacion.routes";
import mensajeRoutes from "./routes/mensaje.routes";
import calificacionRoutes from "./routes/calificacion.routes";
import busquedaRoutes from "./routes/busqueda.routes";
import favoritoRoutes from "./routes/favorito.routes";
import reportesRoutes from "./routes/reportes.routes";
import adminRoutes from "./routes/admin.routes";
import conversacionRoutes from "./routes/conversacion.routes";
import ofertaRoutes from "./routes/oferta.routes";
import servicioRoutes from "./routes/servicio.routes";
import pedidoRoutes from "./routes/pedido.routes";
import { setSocketServer } from "./config/socket";
import { setupSocket } from "./socket";

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/carreras", carrerasRoutes);
app.use("/api/perfiles", perfilRoutes);
app.use("/api/negociaciones", negociacionRoutes);
app.use("/api/mensajes", mensajeRoutes);
app.use("/api/busquedas", busquedaRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/conversaciones", conversacionRoutes);
app.use("/api/ofertas", ofertaRoutes);
app.use("/api/servicios", servicioRoutes);
app.use("/api/pedidos", pedidoRoutes);
app.use("/api", calificacionRoutes);
app.use("/api", favoritoRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: allowedOrigins.includes("*") ? true : allowedOrigins,
        credentials: true,
      },
    });
    setSocketServer(io);
    setupSocket(io);
    server.listen(env.PORT, "0.0.0.0", () => {
      console.log("Servidor en http://localhost:" + env.PORT);
    });
    server.on("error", (e) => {
      console.error("Server error:", e);
      process.exit(1);
    });
  } catch (e) {
    console.error("Error iniciando:", e);
    process.exit(1);
  }
}
start();
export default app;
