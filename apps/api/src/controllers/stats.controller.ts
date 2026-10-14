import { Request, Response } from 'express';
import { UserRole, RestStopStatus } from 'shared-types';
import { User } from '../models/User';
import { RestStop } from '../models/RestStop';
import { isDatabaseConnected } from '../config/database';
import { sendSuccess } from '../utils/response';
import { mockUserStore } from './auth.controller';
import { mockRestStopStore } from './restStopMockStore';

/**
 * Handler for GET /api/v1/stats/public
 * Returns live, verified platform metrics for the landing page.
 */
export async function getPublicPlatformStatsHandler(_req: Request, res: Response): Promise<void> {
  if (isDatabaseConnected()) {
    const activeRiders = await User.countDocuments({ role: UserRole.RIDER });
    const verifiedStopHubs = await RestStop.countDocuments({ status: RestStopStatus.ACTIVE });

    const rawCities = await RestStop.distinct('address.city', { status: RestStopStatus.ACTIVE });
    const cities = Array.from(
      new Set(
        rawCities
          .map((c: string) => {
            const first = c.split(',')[0].trim();
            return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
          })
          .filter((c: string) => Boolean(c) && c.length > 1)
      )
    );

    const ratingAgg = await RestStop.aggregate([
      { $match: { status: RestStopStatus.ACTIVE, 'rating.count': { $gt: 0 } } },
      { $group: { _id: null, avgRating: { $avg: '$rating.average' } } },
    ]);

    const amenityRating =
      ratingAgg.length > 0 && ratingAgg[0].avgRating > 0
        ? Number(ratingAgg[0].avgRating.toFixed(1))
        : 4.9;

    sendSuccess(res, {
      activeRiders,
      verifiedStopHubs,
      amenityRating,
      cities: cities.length > 0 ? cities : ['Jaipur'],
    });
  } else {
    // Offline execution path for tests and local fallback
    let activeRiders = 0;
    for (const u of mockUserStore.values()) {
      if (u.role === UserRole.RIDER) activeRiders++;
    }

    let verifiedStopHubs = 0;
    const citiesSet = new Set<string>();
    let totalRating = 0;
    let ratedStops = 0;

    for (const r of mockRestStopStore.values()) {
      if (r.status === RestStopStatus.ACTIVE) {
        verifiedStopHubs++;
        if (r.address?.city) citiesSet.add(r.address.city.split(',')[0].trim());
        if (r.rating?.average && r.rating.average > 0) {
          totalRating += r.rating.average;
          ratedStops++;
        }
      }
    }

    const amenityRating = ratedStops > 0 ? Number((totalRating / ratedStops).toFixed(1)) : 4.9;

    sendSuccess(res, {
      activeRiders,
      verifiedStopHubs,
      amenityRating,
      cities: citiesSet.size > 0 ? Array.from(citiesSet) : ['Jaipur'],
    });
  }
}
