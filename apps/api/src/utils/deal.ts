import { DealPublicResponse, DealAdminResponse, DealDiscountType } from 'shared-types';

/**
 * Maps a Mongoose Deal document or plain mock record to a safe public response DTO.
 * Excludes internal fields, merchant credentials, and unneeded database internals.
 */
export function formatPublicDeal(doc: any, restStopName?: string): DealPublicResponse {
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
    title: doc.title || '',
    description: doc.description || '',
    discountType: doc.discountType as DealDiscountType,
    ...(doc.discountPercentage !== undefined && { discountPercentage: doc.discountPercentage }),
    ...(doc.flatDiscountAmount !== undefined && { flatDiscountAmount: doc.flatDiscountAmount }),
    ...(doc.originalPrice !== undefined && { originalPrice: doc.originalPrice }),
    ...(doc.dealPrice !== undefined && { dealPrice: doc.dealPrice }),
    ...(doc.validHours && { validHours: doc.validHours }),
    ...(doc.terms && { terms: doc.terms }),
    validFrom:
      doc.validFrom instanceof Date
        ? doc.validFrom.toISOString()
        : doc.validFrom || new Date().toISOString(),
    ...(doc.validUntil && {
      validUntil:
        doc.validUntil instanceof Date ? doc.validUntil.toISOString() : doc.validUntil,
    }),
    isActive: Boolean(doc.isActive),
    ...(doc.maxRedemptionsPerRider !== undefined && {
      maxRedemptionsPerRider: doc.maxRedemptionsPerRider,
    }),
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

/**
 * Maps a Mongoose Deal document or plain mock record to an administrative response DTO.
 * Includes merchant identity and status representation.
 */
export function formatAdminDeal(doc: any, restStopName?: string): DealAdminResponse {
  const base = formatPublicDeal(doc, restStopName);
  const merchantId = doc.merchantId
    ? typeof doc.merchantId === 'object' && '_id' in doc.merchantId
      ? doc.merchantId._id.toString()
      : doc.merchantId.toString()
    : '';

  return {
    ...base,
    merchantId,
    status: base.isActive ? 'active' : 'inactive',
  };
}
