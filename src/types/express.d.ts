import { Types } from 'mongoose';
import { TipoUsuario } from '@/models/Usuario';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: Types.ObjectId;
        email: string;
        tipo_usuario: TipoUsuario[];
      };
    }
  }
}
