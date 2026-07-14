import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { PricingPackage } from './models/pricing.model';
import { Template } from './models/template.model';

const debugDB = async () => {
  await connectDB();

  const db = mongoose.connection.db;
  if (!db) {
    console.error('❌ Mongoose connection db is undefined');
    process.exit(1);
  }

  console.log(`Connected to database name: ${db.databaseName}`);

  // List all collections
  const collections = await db.listCollections().toArray();
  console.log('Collections present in database:');
  for (const coll of collections) {
    const count = await db.collection(coll.name).countDocuments({});
    console.log(` - ${coll.name}: ${count} documents`);
  }

  // Check PricingPackages directly
  const packages = await PricingPackage.find({});
  console.log(`PricingPackage.find({}) returned: ${packages.length} documents`);
  console.log(JSON.stringify(packages, null, 2));

  // Check Templates directly
  const templates = await Template.find({});
  console.log(`Template.find({}) returned: ${templates.length} documents`);
  console.log(JSON.stringify(templates, null, 2));

  await mongoose.disconnect();
  process.exit(0);
};

debugDB().catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
