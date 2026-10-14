import { z } from 'zod';

export const PublicPlatformStatsSchema = z.object({
  activeRiders: z.number().int().min(0),
  verifiedStopHubs: z.number().int().min(0),
  amenityRating: z.number().min(0).max(5),
  cities: z.array(z.string()),
});

export type PublicPlatformStats = z.infer<typeof PublicPlatformStatsSchema>;
