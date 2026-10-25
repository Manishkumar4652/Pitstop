import { Request, Response } from 'express';
import { UserRole, RegisterRequest, LoginRequest, Facility, CapacityStatus, RestStopStatus } from 'shared-types';
import { User, IUserDocument } from '../models/User';
import { RestStop } from '../models/RestStop';
import { isDatabaseConnected } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { formatSafeUser } from '../utils/user';
import { slugify, generateUniqueSlug } from '../utils/slug';
import { sendSuccess } from '../utils/response';
import { config } from '../config/env';
import { BadRequestError, UnauthorizedError, ConflictError, AppError } from '../utils/errors';
import { mockRestStopStore, MockRestStopItem } from './restStopMockStore';
import { clearUserAuthCache } from '../middleware/auth';



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

    let createdUserId: string | null = null;

    // 4. Create new user with explicit allowlisted attributes
    try {
      const merchantAddressString = body.merchantProfile?.shopAddress
        ? `${body.merchantProfile.shopAddress.street}, ${body.merchantProfile.shopAddress.area}, ${body.merchantProfile.shopAddress.city}, ${body.merchantProfile.shopAddress.state} - ${body.merchantProfile.shopAddress.pincode}`
        : body.merchantProfile?.address || 'Address pending';

      const newUser = new User({
        name: body.name.trim(),
        phone,
        email,
        passwordHash,
        role: body.role,
        riderProfile: body.riderProfile,
        merchantProfile: body.merchantProfile ? {
          businessName: body.merchantProfile.businessName.trim(),
          businessType: body.merchantProfile.businessType,
          ...(body.merchantProfile.gstNumber && { gstNumber: body.merchantProfile.gstNumber.trim() }),
          address: merchantAddressString,
          verificationStatus: 'pending_review',
        } : undefined,
        isVerified: false,
      });

      await newUser.save();
      createdUserId = newUser._id.toString();

      // Automatically create the initial Shop/RestStop for the merchant
      if (newUser.role === UserRole.MERCHANT && body.merchantProfile) {
        const mp = body.merchantProfile;
        const venueName = mp.businessName?.trim() || `${newUser.name.trim()}'s Rest Stop`;
        const baseSlug = slugify(venueName) || 'rest-stop';
        let slug = baseSlug;
        let slugAttempt = 0;
        while (await RestStop.findOne({ slug })) {
          slugAttempt++;
          slug = `${baseSlug}-${Date.now().toString(36)}-${Math.floor(100 + Math.random() * 900)}`;
          if (slugAttempt > 5) break;
        }

        const shopAddress = mp.shopAddress ? {
          street: mp.shopAddress.street.trim(),
          area: mp.shopAddress.area.trim(),
          city: mp.shopAddress.city.trim(),
          state: mp.shopAddress.state.trim(),
          pincode: mp.shopAddress.pincode.trim(),
          ...(mp.shopAddress.landmark?.trim() && { landmark: mp.shopAddress.landmark.trim() }),
        } : {
          street: mp.address?.trim() || 'Main Market Street',
          area: 'Central Commercial Area',
          city: 'Jaipur',
          state: 'Rajasthan',
          pincode: '302001',
        };

        const coordinates: [number, number] = mp.location?.coordinates || [75.7873, 26.9124];
        const facilities = mp.facilities && mp.facilities.length > 0
          ? mp.facilities
          : [Facility.DRINKING_WATER, Facility.SEATING, Facility.CHARGING];
        const maxRiders = mp.capacity?.maxRiders && mp.capacity.maxRiders >= 1 ? mp.capacity.maxRiders : 10;
        const openTime = mp.operatingHours?.openTime || '08:00';
        const closeTime = mp.operatingHours?.closeTime || '22:00';
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
        const operatingHours = days.map((day) => ({
          day,
          openTime,
          closeTime,
          isOpen: true,
        }));

        const newRestStop = new RestStop({
          merchantId: newUser._id,
          name: venueName,
          slug,
          description: mp.description?.trim() || `${venueName} welcomes gig delivery partners with clean rest amenities, cool drinking water, and phone charging points.`,
          address: shopAddress,
          location: {
            type: 'Point',
            coordinates,
          },
          facilities,
          images: [],
          capacity: {
            maxRiders,
            currentOccupancy: 0,
            status: CapacityStatus.AVAILABLE,
          },
          operatingHours,
          status: RestStopStatus.ACTIVE,
          rating: { average: 0, count: 0 },
          qrRotationVersion: 1,
        });

        await newRestStop.save();
      }

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
      // Roll back created user if rest stop creation or subsequent steps fail
      if (createdUserId) {
        try {
          await User.findByIdAndDelete(createdUserId);
        } catch {
          // ignore cleanup error
        }
      }

      // Catch MongoDB unique constraint race conditions (code 11000)
      if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
        const mongoErr = err as { keyPattern?: Record<string, number> };
        if (mongoErr.keyPattern?.phone) {
          throw new ConflictError('An account with this phone number already exists.');
        }
        if (mongoErr.keyPattern?.email) {
          throw new ConflictError('An account with this email address already exists.');
        }
        if (mongoErr.keyPattern?.slug) {
          throw new ConflictError('A shop with this name or slug already exists. Please choose a slightly different shop name.');
        }
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
      merchantProfile: body.merchantProfile ? {
        businessName: body.merchantProfile.businessName.trim(),
        businessType: body.merchantProfile.businessType,
        ...(body.merchantProfile.gstNumber && { gstNumber: body.merchantProfile.gstNumber.trim() }),
        address: body.merchantProfile.shopAddress
          ? `${body.merchantProfile.shopAddress.street}, ${body.merchantProfile.shopAddress.area}, ${body.merchantProfile.shopAddress.city}, ${body.merchantProfile.shopAddress.state} - ${body.merchantProfile.shopAddress.pincode}`
          : body.merchantProfile.address || 'Address pending',
        verificationStatus: 'pending_review',
      } : undefined,
      isVerified: false,
      createdAt: new Date(),
    };

    mockUserStore.set(mockId, mockUser);

    if (body.role === UserRole.MERCHANT && body.merchantProfile) {
      const mp = body.merchantProfile;
      const venueName = mp.businessName?.trim() || `${body.name.trim()}'s Rest Stop`;
      let slug = slugify(venueName) || generateUniqueSlug(venueName);
      const mockRsId = `mock-rs-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const shopAddress = mp.shopAddress ? {
        street: mp.shopAddress.street.trim(),
        area: mp.shopAddress.area.trim(),
        city: mp.shopAddress.city.trim(),
        state: mp.shopAddress.state.trim(),
        pincode: mp.shopAddress.pincode.trim(),
        ...(mp.shopAddress.landmark?.trim() && { landmark: mp.shopAddress.landmark.trim() }),
      } : {
        street: mp.address?.trim() || 'Main Market Street',
        area: 'Central Commercial Area',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302001',
      };

      const coordinates: [number, number] = mp.location?.coordinates || [75.7873, 26.9124];
      const facilities = mp.facilities && mp.facilities.length > 0
        ? mp.facilities
        : [Facility.DRINKING_WATER, Facility.SEATING, Facility.CHARGING];
      const maxRiders = mp.capacity?.maxRiders && mp.capacity.maxRiders >= 1 ? mp.capacity.maxRiders : 10;
      const openTime = mp.operatingHours?.openTime || '08:00';
      const closeTime = mp.operatingHours?.closeTime || '22:00';
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
      const operatingHours = days.map((day) => ({
        day,
        openTime,
        closeTime,
        isOpen: true,
      }));

      const mockRestStop: MockRestStopItem = {
        _id: mockRsId,
        id: mockRsId,
        merchantId: mockId,
        name: venueName,
        slug,
        description: mp.description?.trim() || `${venueName} welcomes gig delivery partners with clean rest amenities, cool drinking water, and phone charging points.`,
        address: shopAddress,
        location: {
          type: 'Point',
          coordinates,
        },
        facilities,
        images: [],
        capacity: {
          maxRiders,
          currentOccupancy: 0,
          status: CapacityStatus.AVAILABLE,
        },
        operatingHours,
        status: RestStopStatus.ACTIVE,
        rating: { average: 0, count: 0 },
        qrRotationVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRestStopStore.set(mockRsId, mockRestStop);
    }

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

    clearUserAuthCache(user._id.toString());

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

/**
 * Handler for GET /api/v1/auth/check-phone?phone=...
 * Checks if a phone number is already registered in the system.
 */
export async function checkPhoneHandler(req: Request, res: Response): Promise<void> {
  const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    throw new BadRequestError('A valid 10-digit Indian mobile number is required.');
  }

  let exists = false;
  if (isDatabaseConnected()) {
    const existing = await User.findOne({ phone }).lean();
    exists = Boolean(existing);
  } else {
    for (const u of mockUserStore.values()) {
      if (u.phone === phone) {
        exists = true;
        break;
      }
    }
  }

  sendSuccess(res, { available: !exists }, 200);
}

