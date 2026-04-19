import { Router } from 'express';
import { register, login } from './service.js';
import { AppError } from '../../lib/AppError.js';
import type { LoginInput, RegisterInput } from '@dukkan/shared';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
  try {
    const { businessName, username, password } = req.body as RegisterInput;

    if (!businessName?.trim()) throw AppError.validation('اسم المحل مطلوب');
    if (!username?.trim() || username.trim().length < 3) throw AppError.validation('اسم المستخدم يجب أن يكون 3 أحرف على الأقل');
    if (!password || password.length < 6) throw AppError.validation('كلمة المرور يجب أن تكون 6 أحرف على الأقل');

    const result = await register(businessName, username, password);
    res.status(201).json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body as LoginInput;

    if (!username?.trim()) throw AppError.validation('اسم المستخدم مطلوب');
    if (!password) throw AppError.validation('كلمة المرور مطلوبة');

    const result = await login(username, password);
    res.json({ data: result, error: null });
  } catch (err) {
    next(err);
  }
});
