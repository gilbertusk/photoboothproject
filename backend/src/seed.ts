import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import { Admin } from './models/admin.model';

const seed = async () => {
  await connectDB();

  // Check if admin already exists
  const existingAdmin = await Admin.findOne({ email: 'admin@photobooth.app' });
  if (existingAdmin) {
    console.log('⚠️  Admin user already exists, skipping seed.');
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash('admin123', 12);

  await Admin.create({
    email: 'admin@photobooth.app',
    password: hashedPassword,
    name: 'Super Admin',
  });

  console.log('✅ Admin user seeded successfully');
  console.log('   Email: admin@photobooth.app');
  console.log('   Password: admin123');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
