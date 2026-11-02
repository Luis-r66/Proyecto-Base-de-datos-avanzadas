import type { Server, Socket } from "socket.io";
import { Types } from "mongoose";
import { verifyAccessToken } from "../utils/jwt";
import { Conversacion } from "../models/Conversacion";

interface SocketData {
  usuarioId: string;
}

export function setupSocket(io: Server) {
  io.use((socket, next) => {
    const authToken =
      (socket.handshake.auth && socket.handshake.auth.token) ||
      (socket.handshake.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!authToken) return next(new Error("UNAUTHORIZED"));
    try {
      const payload = verifyAccessToken(authToken);
      (socket.data as SocketData).usuarioId = String(payload.sub);
      next();
    } catch {
      next(new Error("TOKEN_EXPIRED"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const usuarioId = (socket.data as SocketData).usuarioId;
    socket.join(`usuario:${usuarioId}`);

    socket.on("conversacion:unirse", async (conversacionId: string) => {
      if (!Types.ObjectId.isValid(conversacionId)) return;
      const existe = await Conversacion.exists({
        _id: new Types.ObjectId(conversacionId),
        $or: [
          { solicitante_id: new Types.ObjectId(usuarioId) },
          { prestador_usuario_id: new Types.ObjectId(usuarioId) },
        ],
      });
      if (existe) socket.join(`conversacion:${conversacionId}`);
    });

    socket.on("conversacion:salir", (conversacionId: string) => {
      socket.leave(`conversacion:${conversacionId}`);
    });

    socket.on("typing", (conversacionId: string) => {
      socket.to(`conversacion:${conversacionId}`).emit("typing", {
        conversacion_id: conversacionId,
        usuario_id: usuarioId,
      });
    });
  });
}
