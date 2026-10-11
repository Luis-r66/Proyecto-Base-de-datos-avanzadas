import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects, ZodError, ZodTypeAny } from 'zod';
import { AppError } from '@/middleware/errorHandler';

type ZodSchema = AnyZodObject | ZodEffects<AnyZodObject> | ZodTypeAny;
type Source = 'body' | 'query' | 'params' | 'auto';

function getSchemaShape(schema: any): { hasParams: boolean; hasQuery: boolean; hasBody: boolean } {
  try {
    const shape = schema._def?.shape?.() || schema.shape || {};
    return {
      hasParams: 'params' in shape,
      hasQuery: 'query' in shape,
      hasBody: 'body' in shape,
    };
  } catch {
    return { hasParams: false, hasQuery: false, hasBody: false };
  }
}

export function validate(schema: ZodSchema, source: Source = 'auto') {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const shape = getSchemaShape(schema);
      if (source === 'auto') {
        if (shape.hasParams || shape.hasQuery || shape.hasBody) {
          // Schema con wrapper: { params, query, body }
          await (schema as any).parseAsync({
            body: req.body,
            query: req.query,
            params: req.params,
          });
        } else {
          // Schema plano: inferir por método HTTP (GET->query/params, otros->body)
          // Por defecto, intentar body; si está vacío y es GET, usar query
          if (req.method === 'GET' && (!req.body || Object.keys(req.body).length === 0)) {
            // Intentar query primero, si falla intentar params
            try {
              await (schema as any).parseAsync(req.query);
            } catch {
              await (schema as any).parseAsync(req.params);
            }
          } else {
            await (schema as any).parseAsync(req.body);
          }
        }
      } else {
        const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
        await (schema as any).parseAsync(data);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Datos de entrada invalidos', err.flatten().fieldErrors);
      }
      throw err;
    }
  };
};
