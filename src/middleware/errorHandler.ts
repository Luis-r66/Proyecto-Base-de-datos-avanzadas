import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const mongoErr = err as any;
  const isMongoValidation = mongoErr.code === 121;
  const isAppError = err instanceof AppError;
  const isExpectedClientError =
    err instanceof ZodError ||
    (isAppError && (err as AppError).statusCode < 500) ||
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.CastError ||
    mongoErr.code === 11000 ||
    isMongoValidation;

  // Solo loguear errores no esperados (5xx). Los 4xx son respuestas normales del cliente.
  if (!isExpectedClientError) {
    console.error('Error:', err);
  }
  if (isMongoValidation && mongoErr.errInfo?.details) {
    console.error('MongoDB validation details:', JSON.stringify(mongoErr.errInfo.details));
  }
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Datos de entrada invalidos',
      details: err.flatten().fieldErrors,
    });
  }
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
    });
  }
  
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Error de validacion de Mongoose',
      details: Object.values(err.errors).map(e => e.message),
    });
  }
  
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      error: 'INVALID_ID',
      message: 'ID invalido: ' + err.path,
    });
  }
  
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    return res.status(409).json({
      error: 'DUPLICATE_KEY',
      message: field + ' ya existe',
    });
  }
  
  // Handle MongoDB validation error (code 121)
  if (mongoErr.code === 121) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Documento no pasa validacion de MongoDB',
      details: mongoErr.errInfo?.details,
    });
  }
  
  return res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'Error interno del servidor',
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Recurso no encontrado',
  });
}