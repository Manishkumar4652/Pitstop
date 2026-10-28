import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../apps/api/src/models/User';
import { RestStop } from '../apps/api/src/models/RestStop';
import { Deal } from '../apps/api/src/models/Deal';
import { Job } from '../apps/api/src/models/Job';
import { connectDatabase, disconnectDatabase } from '../apps/api/src/config/database';
import {
  UserRole,
  RestStopStatus,
  CapacityStatus,
  Facility,
  JobStatus,
  JobCategory,
} from 'shared-types';

async function seedDatabase() {
  console.log('🌱 Starting PitStop Database Seeding...');
  await connectDatabase();

  console.log('🧹 Cleaning existing records for fresh seed...');
  await User.deleteMany({});
  await RestStop.deleteMany({});
  await Deal.deleteMany({});
  await Job.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Password@123', salt);

  // 1. Seed Users
  console.log('👤 Creating demo accounts (password: Password@123)...');
  const admin = await User.create({
    name: 'PitStop Admin',
    phone: '9876543210',
    email: 'admin@pitstop.in',
    passwordHash,
    role: UserRole.ADMIN,
    isVerified: true,
  });

  const merchant = await User.create({
    name: 'Chai Point Owner',
    phone: '9876543211',
    email: 'merchant@chaipoint.in',
    passwordHash,
    role: UserRole.MERCHANT,
    isVerified: true,
    merchantProfile: {
      businessName: 'Chai Point Indiranagar',
      businessType: 'restaurant',
      verificationStatus: 'verified',
    },
  });

  const rider = await User.create({
    name: 'Ravi Kumar (Rider)',
    phone: '9876543212',
    email: 'ravi.rider@pitstop.in',
    passwordHash,
    role: UserRole.RIDER,
    isVerified: true,
    riderProfile: {
      platform: 'zomato',
      vehicleType: '2-wheeler-ev',
      vehicleNumber: 'KA-01-EQ-1234',
    },
  });

  console.log('✅ Created Admin (9876543210), Merchant (9876543211), and Rider (9876543212)');

  // 2. Seed Rest Stops
  console.log('📍 Seeding initial rest stops in Bengaluru...');
  const stop1 = await RestStop.create({
    merchantId: merchant._id,
    name: 'Chai Point Rest Stop',
    slug: 'chai-point-indiranagar',
    description: 'Designated pitstop for gig workers. Clean washroom, charging stations, and filtered cold water available.',
    address: {
      street: '100 Feet Road, HAL 2nd Stage',
      area: 'Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
      landmark: 'Near Indiranagar Metro Station',
    },
    location: {
      type: 'Point',
      coordinates: [77.6412, 12.9716], // [lng, lat]
    },
    facilities: [
      Facility.RESTROOM,
      Facility.DRINKING_WATER,
      Facility.CHARGING,
      Facility.SEATING,
      Facility.WIFI,
    ],
    status: RestStopStatus.ACTIVE,
    capacity: {
      maxRiders: 10,
      currentOccupancy: 2,
      status: CapacityStatus.AVAILABLE,
    },
    operatingHours: [
      { day: 'mon', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'tue', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'wed', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'thu', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'fri', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'sat', openTime: '07:00', closeTime: '23:00', isOpen: true },
      { day: 'sun', openTime: '07:00', closeTime: '23:00', isOpen: true },
    ],
    qrRotationVersion: 1,
  });

  const stop2 = await RestStop.create({
    merchantId: merchant._id,
    name: 'QuickBite Rest Hub',
    slug: 'quickbite-koramangala',
    description: 'Convenient rest zone with bike parking and shaded waiting area in Koramangala.',
    address: {
      street: '80 Feet Road, 4th Block',
      area: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      landmark: 'Opposite Sony World Signal',
    },
    location: {
      type: 'Point',
      coordinates: [77.6245, 12.9352],
    },
    facilities: [
      Facility.RESTROOM,
      Facility.DRINKING_WATER,
      Facility.SEATING,
      Facility.PARKING,
    ],
    status: RestStopStatus.ACTIVE,
    capacity: {
      maxRiders: 8,
      currentOccupancy: 3,
      status: CapacityStatus.AVAILABLE,
    },
    operatingHours: [
      { day: 'mon', openTime: '08:00', closeTime: '22:00', isOpen: true },
      { day: 'tue', openTime: '08:00', closeTime: '22:00', isOpen: true },
      { day: 'wed', openTime: '08:00', closeTime: '22:00', isOpen: true },
      { day: 'thu', openTime: '08:00', closeTime: '22:00', isOpen: true },
      { day: 'fri', openTime: '08:00', closeTime: '22:00', isOpen: true },
      { day: 'sat', openTime: '08:00', closeTime: '22:00', isOpen: true },
      { day: 'sun', openTime: '08:00', closeTime: '22:00', isOpen: true },
    ],
    qrRotationVersion: 1,
  });

  const stop3 = await RestStop.create({
    merchantId: merchant._id,
    name: 'Green Oasis Pitstop',
    slug: 'green-oasis-hsr',
    description: 'Quiet recharge hub with lush outdoor seating, EV 2-wheeler charging, cold mineral water, and hygienic restrooms.',
    address: {
      street: '27th Main Road, Sector 1',
      area: 'HSR Layout',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560102',
      landmark: 'Near HSR BDA Complex',
    },
    location: {
      type: 'Point',
      coordinates: [77.6514, 12.9116],
    },
    facilities: [
      Facility.RESTROOM,
      Facility.DRINKING_WATER,
      Facility.CHARGING,
      Facility.SEATING,
      Facility.WIFI,
      Facility.PARKING,
    ],
    status: RestStopStatus.ACTIVE,
    capacity: {
      maxRiders: 12,
      currentOccupancy: 1,
      status: CapacityStatus.AVAILABLE,
    },
    operatingHours: [
      { day: 'mon', openTime: '06:00', closeTime: '23:30', isOpen: true },
      { day: 'tue', openTime: '06:00', closeTime: '23:30', isOpen: true },
      { day: 'wed', openTime: '06:00', closeTime: '23:30', isOpen: true },
      { day: 'thu', openTime: '06:00', closeTime: '23:30', isOpen: true },
      { day: 'fri', openTime: '06:00', closeTime: '23:30', isOpen: true },
      { day: 'sat', openTime: '06:00', closeTime: '23:30', isOpen: true },
      { day: 'sun', openTime: '06:00', closeTime: '23:30', isOpen: true },
    ],
    qrRotationVersion: 1,
  });

  console.log(`✅ Created Rest Stops: ${stop1.name}, ${stop2.name}, ${stop3.name}`);

  // 3. Seed Deals
  console.log('🏷️ Seeding promotional deals...');
  await Deal.create({
    merchantId: merchant._id,
    restStopId: stop1._id,
    title: '15% Off Afternoon Chai & Bun Maska',
    description: 'Show your rider ID badge or active delivery check-in to get 15% discount on hot snacks.',
    discountType: 'percentage',
    discountPercentage: 15,
    validHours: '14:00 - 17:00',
    terms: 'Valid between 2 PM and 5 PM on all days.',
    isActive: true,
  });

  await Deal.create({
    merchantId: merchant._id,
    restStopId: stop2._id,
    title: 'Flat ₹20 Off Thali Meals',
    description: 'Exclusive fuel meal combo for delivery partners during lunch rush.',
    discountType: 'fixed_price',
    discountAmount: 20,
    validHours: '12:00 - 16:00',
    terms: 'Valid with active rider check-in pass.',
    isActive: true,
  });

  await Deal.create({
    merchantId: merchant._id,
    restStopId: stop3._id,
    title: 'Free Filter Coffee with Any Snack',
    description: 'Complimentary South Indian filter coffee with any snack order over ₹50.',
    discountType: 'free_item',
    validHours: '15:00 - 19:00',
    terms: 'One coffee per verified check-in.',
    isActive: true,
  });

  // 4. Seed Micro-Jobs
  console.log('💼 Seeding micro-jobs...');
  await Job.create({
    merchantId: merchant._id,
    restStopId: stop1._id,
    title: 'Evening Parcel Sorting & Packing Assistant',
    description: 'Assist in packaging and tagging takeaway tea flasks and food cartons during peak dinner rush.',
    category: JobCategory.PARCEL_SORTING,
    payAmount: 250,
    payType: 'fixed',
    durationMinutes: 90,
    startTime: new Date(Date.now() + 1 * 60 * 60 * 1000), // In 1 hour
    endTime: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h window
    requiredRiders: 3,
    acceptedRidersCount: 0,
    status: JobStatus.OPEN,
    instructions: 'Report to store counter 10 minutes prior to shift start.',
  });

  await Job.create({
    merchantId: merchant._id,
    restStopId: stop2._id,
    title: 'Inventory Stacking & Box Unloading Assistant',
    description: 'Help unload afternoon grocery crates and organize pantry shelves in order.',
    category: JobCategory.LOADING_UNLOADING,
    payAmount: 350,
    payType: 'fixed',
    durationMinutes: 120,
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
    endTime: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72h window
    requiredRiders: 2,
    acceptedRidersCount: 0,
    status: JobStatus.OPEN,
    instructions: 'Wear comfortable shoes. Store supervisor will guide you on placement.',
  });

  await Job.create({
    merchantId: merchant._id,
    restStopId: stop3._id,
    title: 'Afternoon Store Counter & Token Assistant',
    description: 'Assist in handing over pre-packed takeaway orders and managing digital queue tokens during tea hours.',
    category: JobCategory.STORE_ASSISTANT,
    payAmount: 200,
    payType: 'fixed',
    durationMinutes: 60,
    startTime: new Date(Date.now() + 30 * 60 * 1000), // In 30 mins
    endTime: new Date(Date.now() + 96 * 60 * 60 * 1000), // 96h window
    requiredRiders: 2,
    acceptedRidersCount: 0,
    status: JobStatus.OPEN,
    instructions: 'Be polite and prompt. Mobile token scanner will be provided at the counter.',
  });

  // 5. Seed Welcome document into the 'pitstop' collection
  console.log('📌 Seeding pitstop collection document...');
  const pitstopCollection = mongoose.connection.collection('pitstop');
  await pitstopCollection.deleteMany({});
  await pitstopCollection.insertOne({
    appName: 'PitStop India',
    tagline: 'Rest stop and micro-jobs platform for gig workers and local merchants',
    version: '1.0.0',
    status: 'active',
    database: 'pitstop_db',
    collections: ['users', 'reststops', 'deals', 'jobs', 'jobapplications', 'checkins', 'auditlogs', 'pitstop'],
    createdAt: new Date(),
  });

  console.log('🎉 Database seeding completed successfully!');
  await disconnectDatabase();
}

seedDatabase().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
