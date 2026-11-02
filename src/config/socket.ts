import type { Server } from "socket.io";

let io: Server | null = null;

export function setSocketServer(server: Server) {
  io = server;
}

export function emitirAUsuario(usuarioId: unknown, evento: string, payload: unknown) {
  io?.to(`usuario:${String(usuarioId)}`).emit(evento, payload);
}

export function emitirAConversacion(conversacionId: unknown, evento: string, payload: unknown) {
  io?.to(`conversacion:${String(conversacionId)}`).emit(evento, payload);
}
