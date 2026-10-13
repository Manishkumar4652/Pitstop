import {
  CheckInRiderResponse,
  CheckInMerchantResponse,
  CheckInAdminResponse,
  CheckinStatus,
} from 'shared-types';

/**
 * Maps a Mongoose CheckIn document or mock record to a safe rider response DTO.
 * Excludes sensitive server verification tokens and private coordinate logs.
 */
export function formatRiderCheckIn(
  doc: any,
  restStopName?: string
): CheckInRiderResponse {
  const id = doc._id ? doc._id.toString() : doc.id || '';
  const restStopId = doc.restStopId
    ? typeof doc.restStopId === 'object' && '_id' in doc.restStopId
      ? doc.restStopId._id.toString()
      : doc.restStopId.toString()
    : '';

  const resolvedRestStopName =
    restStopName ||
    (doc.restStopId && typeof doc.restStopId === 'object' && 'name' in doc.restStopId
      ? doc.restStopId.name
      : undefined);

  return {
    id,
    restStopId,
    ...(resolvedRestStopName && { restStopName: resolvedRestStopName }),
    method: doc.method || 'qr_code',
    status: (doc.status as CheckinStatus) || CheckinStatus.PENDING,
    checkInTime:
      doc.checkInTime instanceof Date
        ? doc.checkInTime.toISOString()
        : doc.checkInTime || new Date().toISOString(),
    ...(doc.verifiedAt && {
      verifiedAt:
        doc.verifiedAt instanceof Date
          ? doc.verifiedAt.toISOString()
          : doc.verifiedAt,
    }),
    ...(doc.checkOutTime && {
      checkOutTime:
        doc.checkOutTime instanceof Date
          ? doc.checkOutTime.toISOString()
          : doc.checkOutTime,
    }),
  };
}

/**
 * Maps a Mongoose CheckIn document or mock record to a merchant response DTO.
 * Omits rider phone numbers, emails, and exact historical location coordinates.
 */
export function formatMerchantCheckIn(
  doc: any,
  restStopName?: string,
  riderName?: string
): CheckInMerchantResponse {
  const base = formatRiderCheckIn(doc, restStopName);

  const resolvedRiderName =
    riderName ||
    (doc.riderId && typeof doc.riderId === 'object' && 'name' in doc.riderId
      ? doc.riderId.name
      : undefined);

  return {
    ...base,
    ...(resolvedRiderName && { riderName: resolvedRiderName }),
  };
}

/**
 * Maps a Mongoose CheckIn document or mock record to an administrative response DTO.
 * Excludes sensitive cryptographic verification secrets.
 */
export function formatAdminCheckIn(
  doc: any,
  restStopName?: string
): CheckInAdminResponse {
  const base = formatRiderCheckIn(doc, restStopName);

  const riderId = doc.riderId
    ? typeof doc.riderId === 'object' && '_id' in doc.riderId
      ? doc.riderId._id.toString()
      : doc.riderId.toString()
    : '';

  const merchantId = doc.merchantId
    ? typeof doc.merchantId === 'object' && '_id' in doc.merchantId
      ? doc.merchantId._id.toString()
      : doc.merchantId.toString()
    : '';

  return {
    ...base,
    riderId,
    merchantId,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt || new Date().toISOString(),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : doc.updatedAt || new Date().toISOString(),
  };
}
