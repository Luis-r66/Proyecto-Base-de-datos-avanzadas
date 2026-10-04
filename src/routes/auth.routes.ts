import { Router } from 'express';
import { register, login, refresh, logout, me } from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/auth';
import { validate } from '@/middleware/validation';
import { registerSchema, loginSchema, refreshSchema } from '@/utils/validation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);

export default router;
