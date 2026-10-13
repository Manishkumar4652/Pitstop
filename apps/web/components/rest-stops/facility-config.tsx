import React from 'react';
import { 
  Droplet, 
  Armchair, 
  BatteryCharging, 
  DoorClosed, 
  Wifi, 
  SquareParking, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';
import { Facility } from 'shared-types';

export interface FacilityMetadata {
  id: Facility;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export const FACILITY_METADATA: Record<Facility, FacilityMetadata> = {
  [Facility.DRINKING_WATER]: {
    id: Facility.DRINKING_WATER,
    label: 'Drinking Water',
    description: 'Clean, chilled or RO filtered drinking water available for free refills.',
    icon: <Droplet className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />,
  },
  [Facility.SEATING]: {
    id: Facility.SEATING,
    label: 'Seating Area',
    description: 'Dedicated indoor or shaded outdoor benches and rest chairs for riders.',
    icon: <Armchair className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />,
  },
  [Facility.CHARGING]: {
    id: Facility.CHARGING,
    label: 'Mobile Charging',
    description: 'Multi-pin charging docks and power outlets for quick smartphone top-ups.',
    icon: <BatteryCharging className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />,
  },
  [Facility.RESTROOM]: {
    id: Facility.RESTROOM,
    label: 'Restroom',
    description: 'Hygienic and accessible washroom facilities maintained by the venue.',
    icon: <DoorClosed className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />,
  },
  [Facility.WIFI]: {
    id: Facility.WIFI,
    label: 'Wi-Fi',
    description: 'Free wireless internet connectivity for order dispatching and navigation.',
    icon: <Wifi className="h-4 w-4 shrink-0 text-cyan-600" aria-hidden="true" />,
  },
  [Facility.PARKING]: {
    id: Facility.PARKING,
    label: 'Two-Wheeler Parking',
    description: 'Safe, designated parking spaces for delivery motorcycles and scooters.',
    icon: <SquareParking className="h-4 w-4 shrink-0 text-purple-600" aria-hidden="true" />,
  },
  [Facility.AIR_CONDITIONING]: {
    id: Facility.AIR_CONDITIONING,
    label: 'Air Conditioning',
    description: 'Cooled indoor seating area to recover from summer heat.',
    icon: <Sparkles className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />,
  },
  [Facility.FIRST_AID]: {
    id: Facility.FIRST_AID,
    label: 'First Aid Kit',
    description: 'Basic emergency bandages, antiseptic wipes, and first-aid supplies on site.',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />,
  },
};

/**
 * Core facilities available as interactive discovery filters
 */
export const FILTERABLE_FACILITY_LIST: Array<{ id: Facility; label: string; icon: React.ReactNode }> = [
  { id: Facility.DRINKING_WATER, label: 'Drinking Water', icon: FACILITY_METADATA[Facility.DRINKING_WATER].icon },
  { id: Facility.SEATING, label: 'Seating', icon: FACILITY_METADATA[Facility.SEATING].icon },
  { id: Facility.CHARGING, label: 'Charging', icon: FACILITY_METADATA[Facility.CHARGING].icon },
  { id: Facility.RESTROOM, label: 'Restroom', icon: FACILITY_METADATA[Facility.RESTROOM].icon },
  { id: Facility.WIFI, label: 'Wi-Fi', icon: FACILITY_METADATA[Facility.WIFI].icon },
  { id: Facility.PARKING, label: 'Parking', icon: FACILITY_METADATA[Facility.PARKING].icon },
];
