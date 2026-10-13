import { UserPublicProfile, UserRole } from 'shared-types';

/**
 * Transforms a User document or user object into a safe public profile DTO.
 * Explicitly allowlists fields to guarantee that password hashes, internal DB metadata,
 * and sensitive fields are never leaked to clients.
 */
export function formatSafeUser(user: any): UserPublicProfile {
  const id = user._id ? user._id.toString() : user.id || '';
  
  return {
    id,
    name: user.name || '',
    phone: user.phone || '',
    ...(user.email && { email: user.email }),
    role: (user.role as UserRole) || UserRole.RIDER,
    isVerified: Boolean(user.isVerified),
    ...(user.avatarUrl && { avatarUrl: user.avatarUrl }),
    ...(user.riderProfile && {
      riderProfile: {
        platform: user.riderProfile.platform,
        vehicleType: user.riderProfile.vehicleType,
        ...(user.riderProfile.vehicleNumber && { vehicleNumber: user.riderProfile.vehicleNumber }),
      },
    }),
    ...(user.merchantProfile && {
      merchantProfile: {
        businessName: user.merchantProfile.businessName,
        businessType: user.merchantProfile.businessType,
        ...(user.merchantProfile.gstNumber && { gstNumber: user.merchantProfile.gstNumber }),
        ...(user.merchantProfile.address && { address: user.merchantProfile.address }),
      },
    }),
    createdAt:
      user.createdAt instanceof Date
        ? user.createdAt.toISOString()
        : user.createdAt || new Date().toISOString(),
  };
}
