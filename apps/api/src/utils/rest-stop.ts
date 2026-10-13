import { RestStopPublicResponse, RestStopAdminResponse, RestStopStatus, CapacityStatus } from 'shared-types';

/**
 * Maps a Mongoose RestStop document or plain record to a safe public response DTO.
 * Guarantees that internal fields, database IDs, and sensitive merchant credentials are excluded.
 */
export function formatPublicRestStop(doc: any): RestStopPublicResponse {
  const id = doc._id ? doc._id.toString() : doc.id || '';

  return {
    id,
    name: doc.name || '',
    slug: doc.slug || '',
    description: doc.description || '',
    address: {
      street: doc.address?.street || '',
      area: doc.address?.area || '',
      city: doc.address?.city || '',
      state: doc.address?.state || '',
      pincode: doc.address?.pincode || '',
      ...(doc.address?.landmark && { landmark: doc.address.landmark }),
    },
    location: {
      type: 'Point',
      coordinates: Array.isArray(doc.location?.coordinates)
        ? [doc.location.coordinates[0], doc.location.coordinates[1]]
        : [0, 0],
    },
    facilities: Array.isArray(doc.facilities) ? doc.facilities : [],
    images: Array.isArray(doc.images) ? doc.images : [],
    capacity: {
      maxRiders: doc.capacity?.maxRiders || 1,
      currentOccupancy: doc.capacity?.currentOccupancy || 0,
      status: doc.capacity?.status || CapacityStatus.AVAILABLE,
    },
    operatingHours: Array.isArray(doc.operatingHours)
      ? doc.operatingHours.map((h: any) => ({
          day: h.day,
          openTime: h.openTime,
          closeTime: h.closeTime,
          isOpen: Boolean(h.isOpen),
        }))
      : [],
    rating: {
      average: doc.rating?.average || 0,
      count: doc.rating?.count || 0,
    },
    ...(doc.dealBadge && { dealBadge: doc.dealBadge }),
    ...(doc.dealDescription && { dealDescription: doc.dealDescription }),
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
 * Maps a Mongoose RestStop document or plain record to an administrative response DTO.
 * Includes merchant identity and moderation status for system admins.
 */
export function formatAdminRestStop(doc: any): RestStopAdminResponse {
  const base = formatPublicRestStop(doc);
  const merchantId = doc.merchantId
    ? typeof doc.merchantId === 'object' && '_id' in doc.merchantId
      ? doc.merchantId._id.toString()
      : doc.merchantId.toString()
    : '';

  return {
    ...base,
    merchantId,
    status: (doc.status as RestStopStatus) || RestStopStatus.PENDING_APPROVAL,
  };
}
