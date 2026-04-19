import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/client.js';
import { logger } from '../../lib/logger.js';
import { AppError, fromDbError } from '../../lib/AppError.js';
import type { AuthUser } from '@dukkan/shared';

const SALT_ROUNDS = 12;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return secret;
}

function getExpiryDays(): number {
  return parseInt(process.env.JWT_EXPIRY_DAYS || '30', 10);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, tenantId: user.tenantId, username: user.username, role: user.role },
    getJwtSecret(),
    { expiresIn: `${getExpiryDays()}d` }
  );
}

export function verifyToken(token: string): AuthUser & { userId: string } {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload;
    return {
      id: payload.userId as string,
      userId: payload.userId as string,
      tenantId: payload.tenantId as string,
      username: payload.username as string,
      role: payload.role as 'owner' | 'cashier',
    };
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    logger.warn({ isExpired }, 'JWT verification failed');
    throw AppError.unauthorized(
      isExpired ? 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً' : 'رمز المصادقة غير صالح'
    );
  }
}

export async function register(businessName: string, username: string, password: string) {
  const cleanUsername = username.trim().toLowerCase();

  logger.info({ username: cleanUsername, businessName }, 'Register attempt');

  const existingUser = await db
    .selectFrom('users')
    .select('id')
    .where('username', '=', cleanUsername)
    .executeTakeFirst();

  if (existingUser) {
    logger.warn({ username: cleanUsername }, 'Register failed: username taken');
    throw AppError.conflict('اسم المستخدم مستخدم بالفعل، جرب اسماً آخر');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    const result = await db.transaction().execute(async (trx) => {
      const tenant = await trx
        .insertInto('tenants')
        .values({ name: businessName.trim() })
        .returningAll()
        .executeTakeFirstOrThrow();

      const user = await trx
        .insertInto('users')
        .values({ tenant_id: tenant.id, username: cleanUsername, password_hash: passwordHash, role: 'owner' })
        .returningAll()
        .executeTakeFirstOrThrow();

      return { tenant, user };
    });

    const authUser: AuthUser = {
      id: result.user.id,
      tenantId: result.tenant.id,
      username: result.user.username,
      role: 'owner',
    };

    logger.info(
      { userId: authUser.id, tenantId: authUser.tenantId, username: authUser.username },
      'Register success — new tenant created'
    );

    return { token: signToken(authUser), user: authUser };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error({ err }, 'Register DB error');
    throw fromDbError(err);
  }
}

export async function login(username: string, password: string) {
  const cleanUsername = username.trim().toLowerCase();

  logger.info({ username: cleanUsername }, 'Login attempt');

  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('username', '=', cleanUsername)
    .executeTakeFirst();

  if (!user) {
    logger.warn({ username: cleanUsername }, 'Login failed: user not found');
    // Return same error as wrong password to prevent username enumeration
    throw AppError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    logger.warn({ userId: user.id, username: cleanUsername }, 'Login failed: wrong password');
    throw AppError.unauthorized('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  const authUser: AuthUser = {
    id: user.id,
    tenantId: user.tenant_id,
    username: user.username,
    role: user.role as 'owner' | 'cashier',
  };

  logger.info(
    { userId: authUser.id, tenantId: authUser.tenantId, username: authUser.username, role: authUser.role },
    'Login success'
  );

  return { token: signToken(authUser), user: authUser };
}
