import {
  JobPublicResponse,
  JobAdminResponse,
  JobMerchantResponse,
  JobApplicationResponse,
  RiderJobApplicationResponse,
  JobCategory,
  JobStatus,
  JobApplicationStatus,
} from 'shared-types';

/**
 * Maps a Mongoose Job document or plain mock record to a safe public response DTO.
 * Excludes internal database metadata and merchant credentials, while resolving venue details.
 */
export function formatPublicJob(doc: any, restStopName?: string): JobPublicResponse {
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
    category: doc.category as JobCategory,
    payAmount: doc.payAmount || 0,
    payType: doc.payType || 'fixed',
    durationMinutes: doc.durationMinutes || 0,
    startTime:
      doc.startTime instanceof Date
        ? doc.startTime.toISOString()
        : doc.startTime || new Date().toISOString(),
    endTime:
      doc.endTime instanceof Date
        ? doc.endTime.toISOString()
        : doc.endTime || new Date().toISOString(),
    requiredRiders: doc.requiredRiders || 1,
    acceptedRidersCount: doc.acceptedRidersCount || 0,
    status: (doc.status as JobStatus) || JobStatus.OPEN,
    instructions: doc.instructions || '',
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
 * Maps a Mongoose Job document or plain mock record to an administrative response DTO.
 * Includes merchant owner reference and full moderation metadata.
 */
export function formatAdminJob(doc: any, restStopName?: string): JobAdminResponse {
  const base = formatPublicJob(doc, restStopName);
  const merchantId = doc.merchantId
    ? typeof doc.merchantId === 'object' && '_id' in doc.merchantId
      ? doc.merchantId._id.toString()
      : doc.merchantId.toString()
    : '';

  return {
    ...base,
    merchantId,
  };
}

/**
 * Maps a Mongoose Job document or plain mock record to a merchant response DTO.
 * Includes merchant owner reference, resolved rest stop name, and optional application counts.
 */
export function formatMerchantJob(
  doc: any,
  restStopName?: string,
  applicationsCount?: number,
  pendingApplicationsCount?: number
): JobMerchantResponse {
  const base = formatAdminJob(doc, restStopName);
  return {
    ...base,
    ...(applicationsCount !== undefined && { applicationsCount }),
    ...(pendingApplicationsCount !== undefined && { pendingApplicationsCount }),
  };
}

/**
 * Maps a Mongoose JobApplication document or plain mock record to a safe response DTO.
 */
export function formatJobApplication(
  doc: any,
  riderName?: string,
  vehicleType?: string
): JobApplicationResponse {
  const id = doc._id ? doc._id.toString() : doc.id || '';
  const jobId = doc.jobId
    ? typeof doc.jobId === 'object' && '_id' in doc.jobId
      ? doc.jobId._id.toString()
      : doc.jobId.toString()
    : '';
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

  const resolvedRiderName =
    riderName ||
    (doc.riderId && typeof doc.riderId === 'object' && 'name' in doc.riderId
      ? doc.riderId.name
      : undefined);

  const resolvedVehicleType =
    vehicleType ||
    (doc.riderId && typeof doc.riderId === 'object' && doc.riderId.riderProfile?.vehicleType
      ? doc.riderId.riderProfile.vehicleType
      : undefined);

  return {
    id,
    jobId,
    riderId,
    ...(resolvedRiderName && { riderName: resolvedRiderName }),
    ...(resolvedVehicleType && { vehicleType: resolvedVehicleType }),
    merchantId,
    status: (doc.status as JobApplicationStatus) || JobApplicationStatus.PENDING,
    ...(doc.notes && { notes: doc.notes }),
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
 * Maps a JobApplication to a rider-focused DTO including job summary details.
 */
export function formatRiderJobApplication(
  doc: any,
  jobSummary?: {
    title?: string;
    restStopName?: string;
    payAmount?: number;
    payType?: 'fixed' | 'hourly';
    durationMinutes?: number;
    startTime?: string | Date;
    endTime?: string | Date;
    instructions?: string;
  }
): RiderJobApplicationResponse {
  const base = formatJobApplication(doc);
  const resolvedJob =
    doc.jobId && typeof doc.jobId === 'object' && 'title' in doc.jobId
      ? doc.jobId
      : jobSummary || {};

  return {
    ...base,
    ...(resolvedJob.title && { jobTitle: resolvedJob.title }),
    ...(jobSummary?.restStopName && { restStopName: jobSummary.restStopName }),
    ...(resolvedJob.payAmount !== undefined && { payAmount: resolvedJob.payAmount }),
    ...(resolvedJob.payType && { payType: resolvedJob.payType }),
    ...(resolvedJob.durationMinutes !== undefined && { durationMinutes: resolvedJob.durationMinutes }),
    ...(resolvedJob.startTime && {
      startTime:
        resolvedJob.startTime instanceof Date
          ? resolvedJob.startTime.toISOString()
          : resolvedJob.startTime,
    }),
    ...(resolvedJob.endTime && {
      endTime:
        resolvedJob.endTime instanceof Date
          ? resolvedJob.endTime.toISOString()
          : resolvedJob.endTime,
    }),
    ...(resolvedJob.instructions && { instructions: resolvedJob.instructions }),
  };
}
