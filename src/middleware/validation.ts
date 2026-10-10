import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects, ZodError } from 'zod';
import { AppError } from '@/middleware/errorHandler';

type ZodSchema = AnyZodObject | ZodEffects<AnyZodObject>;

export function validate(schema: ZodSchema) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Datos de entrada invalidos', err.flatten().fieldErrors);
      }
      throw err;
    }
  };
};
