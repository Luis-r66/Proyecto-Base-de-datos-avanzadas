import "dotenv/config";
import "express-async-errors";
import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./config/db";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import categoriasRoutes from "./routes/categorias.routes";
import perfilRoutes from "./routes/perfil.routes";

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
app.use("/api/auth", authRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/perfiles", perfilRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  try {
    await connectDB();
    const server = app.listen(env.PORT, "0.0.0.0", () => {
      console.log("Servidor en http://localhost:" + env.PORT);
    });
    server.on("error", (e) => { console.error("Server error:", e); process.exit(1); });
  } catch (e) {
    console.error("Error iniciando:", e);
    process.exit(1);
  }
}
start();
export default app;
