import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { Template } from './models/template.model';

const editorialTemplates = [
  {
    name: 'PEACH EDITORIAL 3',
    description: 'Tiga foto asimetris bergaya halaman majalah Peach Stories.',
    slots: 3,
    layout: {
      width: 500,
      height: 1200,
      slots: [
        { x: 36, y: 130, width: 400, height: 250 },
        { x: 64, y: 420, width: 400, height: 250 },
        { x: 36, y: 710, width: 400, height: 250 },
      ],
      overlays: [],
    },
    isActive: true,
  },
  {
    name: 'PEACH EDITORIAL 4',
    description: 'Empat foto bertingkat dengan ritme editorial playful.',
    slots: 4,
    layout: {
      width: 500,
      height: 1460,
      slots: [
        { x: 36, y: 130, width: 390, height: 250 },
        { x: 74, y: 425, width: 390, height: 250 },
        { x: 36, y: 720, width: 390, height: 250 },
        { x: 74, y: 1015, width: 390, height: 250 },
      ],
      overlays: [],
    },
    isActive: true,
  },
  {
    name: 'PEACH EDITORIAL 6',
    description: 'Enam foto dalam grid majalah dua kolom yang dinamis.',
    slots: 6,
    layout: {
      width: 500,
      height: 1240,
      slots: [
        { x: 32, y: 130, width: 210, height: 250 },
        { x: 258, y: 130, width: 210, height: 250 },
        { x: 52, y: 410, width: 210, height: 250 },
        { x: 238, y: 410, width: 210, height: 250 },
        { x: 32, y: 690, width: 210, height: 250 },
        { x: 258, y: 690, width: 210, height: 250 },
      ],
      overlays: [],
    },
    isActive: true,
  },
];

const seedEditorialTemplates = async () => {
  await connectDB();

  for (const template of editorialTemplates) {
    await Template.updateOne(
      { name: template.name },
      { $set: template },
      { upsert: true }
    );
  }

  console.log(`✅ ${editorialTemplates.length} Peach Editorial templates upserted.`);
  await mongoose.disconnect();
};

seedEditorialTemplates().catch((error) => {
  console.error('❌ Peach Editorial seed failed:', error);
  process.exit(1);
});
