import React from 'react';
import Link from 'next/link';
import { 
  MapPin, 
  Search, 
  Filter, 
  Droplet, 
  Armchair, 
  BatteryCharging, 
  Sparkles, 
  Clock, 
  Star, 
  Info,
  ChevronRight
} from 'lucide-react';
import { PublicLayout } from '@/components/layout';
import { Container, PageHeader, Card, Button, Input, Select, Badge } from '@/components/ui';

export const metadata = {
  title: 'Explore Rest Stops — PitStop Discovery',
  description: 'Search and filter verified rest stops with drinking water, seating, phone charging, and clean restrooms.',
};

const sampleRestStops = [
  {
    id: '1',
    name: 'Chai Point Rest Stop',
    address: '100 Feet Road, Indiranagar, Bengaluru',
    distance: '0.8 km away',
    facilities: ['Drinking Water', 'Seating', 'Phone Charging', 'Restroom'],
    rating: 4.8,
    reviewsCount: 42,
    occupancyStatus: 'available',
    occupancyLabel: 'Available (4/12 seats occupied)',
    dealBadge: '50% off Chai & Samosa',
  },
  {
    id: '2',
    name: 'Green Park Eatery & Rest Desk',
    address: 'MG Road, Near Metro Station, Bengaluru',
    distance: '1.4 km away',
    facilities: ['Drinking Water', 'Seating', 'WiFi', 'Parking'],
    rating: 4.6,
    reviewsCount: 28,
    occupancyStatus: 'busy',
    occupancyLabel: 'Busy (8/10 seats occupied)',
    dealBadge: 'Free Water Refill + 20% Off Meals',
  },
  {
    id: '3',
    name: 'QuickBite Merchant Rest Stop',
    address: 'Koramangala 5th Block, Bengaluru',
    distance: '2.1 km away',
    facilities: ['Drinking Water', 'Seating', 'Phone Charging', 'Air Conditioning'],
    rating: 4.9,
    reviewsCount: 65,
    occupancyStatus: 'available',
    occupancyLabel: 'Available (2/15 seats occupied)',
    dealBadge: '₹30 Cold Coffee for Riders',
  },
];

export default function ExplorePage() {
  return (
    <PublicLayout>
      <PageHeader
        title="Discover Verified Rest Stops"
        description="Find nearby merchant rest spots offering free drinking water, seating, fast phone charging, clean restrooms, and rider-exclusive food deals."
        badge="Live Search"
      />

      <section className="py-6 border-b border-pitstop-border bg-white">
        <Container size="xl">
          <div className="grid gap-4 sm:grid-cols-12 items-center">
            <div className="sm:col-span-6">
              <Input
                placeholder="Search area, landmark, or city (e.g. Indiranagar, Bengaluru)..."
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="sm:col-span-4">
              <Select
                placeholder="Filter by Main Amenity"
                options={[
                  { label: 'All Facilities', value: 'all' },
                  { label: '💧 Free Drinking Water', value: 'water' },
                  { label: '🪑 Seating Area', value: 'seating' },
                  { label: '⚡ Fast Phone Charging', value: 'charging' },
                  { label: '🚻 Clean Restroom', value: 'restroom' },
                ]}
              />
            </div>
            <div className="sm:col-span-2">
              <Button variant="primary" fullWidth leftIcon={<Filter className="h-4 w-4" />}>
                Search Stops
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container size="xl">
          {/* Phase Notice */}
          <div className="mb-8 rounded-xl border border-pitstop-border bg-white p-4 shadow-subtle flex items-start gap-3">
            <Info className="h-5 w-5 text-pitstop-yellow-dark shrink-0 mt-0.5" />
            <div className="text-xs text-pitstop-muted">
              <strong>Preview Discovery Listing:</strong> These cards illustrate the rest-stop card component specification. MongoDB 2dsphere geospatial distance sorting and dynamic API queries connect in Phase 4.
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sampleRestStops.map((stop) => (
              <Card key={stop.id} variant="interactive" className="flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="yellow" size="sm" icon={<MapPin className="h-3 w-3" />}>
                      {stop.distance}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                      <Star className="h-3.5 w-3.5 fill-amber-500 stroke-amber-500" />
                      <span>{stop.rating}</span>
                      <span className="text-pitstop-muted font-normal">({stop.reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-pitstop-charcoal">{stop.name}</h3>
                  <p className="mt-1 text-xs text-pitstop-muted flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{stop.address}</span>
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {stop.facilities.map((fac) => (
                      <Badge key={fac} variant="neutral" size="sm">
                        {fac}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg bg-pitstop-yellow-light/60 p-2.5 text-xs text-pitstop-charcoal flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pitstop-yellow-dark shrink-0" />
                    <span className="font-semibold">{stop.dealBadge}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-pitstop-border pt-4 flex items-center justify-between">
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {stop.occupancyStatus === 'available' ? 'Open Now' : 'Busy'}
                  </span>
                  <Link href={`/rest-stops/${stop.id}`}>
                    <Button variant="outline" size="sm" rightIcon={<ChevronRight className="h-3.5 w-3.5" />}>
                      View Stop Details
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}
