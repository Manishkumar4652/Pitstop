import { Request, Response } from 'express';
import { UserRole, RegisterRequest, LoginRequest } from 'shared-types';
import { User, IUserDocument } from '../models/User';
import { isDatabaseConnected } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { formatSafeUser } from '../utils/user';
import { sendSuccess } from '../utils/response';
import { config } from '../config/env';
import { BadRequestError, UnauthorizedError, ConflictError, AppError } from '../utils/errors';



// In-memory test store used exclusively when running offline without MongoDB (e.g. CI/unit tests)
export const mockUserStore = new Map<string, any>();

/**
 * Normalizes phone number by trimming whitespace.
 */
function normalizePhone(phone: string): string {
  return phone.trim();
}

/**
 * Normalizes email address by trimming and converting to lowercase.
 */
function normalizeEmail(email?: string): string | undefined {
  if (!email || email.trim() === '') return undefined;
  return email.trim().toLowerCase();
}

/**
 * Handler for POST /api/v1/auth/register
 * Enforces role restriction (only 'rider' and 'merchant' allowed), checks unique identifiers,
 * hashes password with bcryptjs, and creates user with safe allowlisted fields.
 */
export async function registerHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as RegisterRequest;

  // Strict role check: public registration must never allow 'admin'
  if ((body.role as string) === UserRole.ADMIN || (body.role as string) === 'admin') {
    throw new BadRequestError('Admin registration is not allowed through the public API.');
  }

  const phone = normalizePhone(body.phone);
  const email = normalizeEmail(body.email);

  if (isDatabaseConnected()) {
    // 1. Check for existing account by phone
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw new ConflictError('An account with this phone number already exists.');
    }

    // 2. Check for existing account by email if provided
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        throw new ConflictError('An account with this email address already exists.');
      }
    }

    // 3. Hash password
    const passwordHash = await hashPassword(body.password);

    // 4. Create new user with explicit allowlisted attributes
    try {
      const newUser = new User({
        name: body.name.trim(),
        phone,
        email,
        passwordHash,
        role: body.role,
        riderProfile: body.riderProfile,
        merchantProfile: body.merchantProfile,
        isVerified: false,
      });

      await newUser.save();

      // 5. Generate signed JWT token
      const token = signAccessToken({
        userId: newUser._id.toString(),
        role: newUser.role,
      });

      sendSuccess(
        res,
        {
          token,
          user: formatSafeUser(newUser),
        },
        201,
        'User registered successfully.'
      );
    } catch (err: unknown) {
      // Catch MongoDB unique constraint race conditions (code 11000)
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
        throw new ConflictError('An account with this phone number or email already exists.');
      }
      throw err;
    }
  } else {
    // In production, database connection is mandatory. Never use test mocks in production.
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    // Offline execution path for tests without MongoDB

    for (const user of mockUserStore.values()) {
      if (user.phone === phone) {
        throw new ConflictError('An account with this phone number already exists.');
      }
      if (email && user.email === email) {
        throw new ConflictError('An account with this email address already exists.');
      }
    }

    const passwordHash = await hashPassword(body.password);
    const mockId = `mock-user-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const mockUser = {
      _id: mockId,
      id: mockId,
      name: body.name.trim(),
      phone,
      email,
      passwordHash,
      role: body.role,
      riderProfile: body.riderProfile,
      merchantProfile: body.merchantProfile,
      isVerified: false,
      createdAt: new Date(),
    };

    mockUserStore.set(mockId, mockUser);

    const token = signAccessToken({
      userId: mockId,
      role: body.role,
    });

    sendSuccess(
      res,
      {
        token,
        user: formatSafeUser(mockUser),
      },
      201,
      'User registered successfully.'
    );
  }
}

/**
 * Handler for POST /api/v1/auth/login
 * Validates credentials using phone and password.
 * Returns generic error message for invalid credentials to prevent phone enumeration.
 */
export async function loginHandler(req: Request, res: Response): Promise<void> {
  const body = req.body as LoginRequest;
  const phone = normalizePhone(body.phone);

  if (isDatabaseConnected()) {
    // Explicitly select passwordHash which is hidden by default (select: false)
    const user = await User.findOne({ phone }).select('+passwordHash');

    if (!user || !user.passwordHash) {
      // Prevent timing attacks by executing a comparison even on missing user
      await comparePassword(body.password, '$2a$08$1234567890123456789012345678901234567890123456789012');
      throw new UnauthorizedError('Invalid phone number or password. Please check your credentials.');
    }

    const isMatch = await comparePassword(body.password, user.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedError('Invalid phone number or password. Please check your credentials.');
    }

    const token = signAccessToken({
      userId: user._id.toString(),
      role: user.role,
    });

    sendSuccess(
      res,
      {
        token,
        user: formatSafeUser(user),
      },
      200,
      'Login successful.'
    );
  } else {
    // In production, database connection is mandatory. Never use test mocks in production.
    if (config.NODE_ENV === 'production') {
      throw new AppError('Database service unavailable.', 503);
    }

    // Offline execution path for tests without MongoDB

    let matchedUser: any = null;
    for (const user of mockUserStore.values()) {
      if (user.phone === phone) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      await comparePassword(body.password, '$2a$08$1234567890123456789012345678901234567890123456789012');
      throw new UnauthorizedError('Invalid phone number or password. Please check your credentials.');
    }

    const isMatch = await comparePassword(body.password, matchedUser.passwordHash);

    if (!isMatch) {
      throw new UnauthorizedError('Invalid phone number or password. Please check your credentials.');
    }

    const token = signAccessToken({
      userId: matchedUser.id || matchedUser._id,
      role: matchedUser.role,
    });

    sendSuccess(
      res,
      {
        token,
        user: formatSafeUser(matchedUser),
      },
      200,
      'Login successful.'
    );
  }
}

/**
 * Handler for GET /api/v1/auth/me
 * Protected by authenticateJwt middleware.
 * Returns safe public user representation of the authenticated context.
 */
export async function getMeHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError('Authentication is required.');
  }

  sendSuccess(
    res,
    {
      user: formatSafeUser(req.user),
    },
    200
  );
}
