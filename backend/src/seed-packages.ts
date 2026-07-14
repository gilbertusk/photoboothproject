import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { PricingPackage } from './models/pricing.model';
import { Template } from './models/template.model';

// ─────────────────────────────────────────────────────────────────────────────
// Layout geometries — mirrors FramePreview.tsx GEOMETRIES (all vertical/strip)
// ─────────────────────────────────────────────────────────────────────────────
const LAYOUTS = {
  // ── 2 slot ───────────────────────────────────────────────────────────────
  duo_portrait: {
    width: 400, height: 900,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 335, width: 340, height: 255 },
    ],
    overlays: [],
  },
  duo_portrait_sq: {
    width: 400, height: 980,
    slots: [
      { x: 30, y: 50,  width: 340, height: 340 },
      { x: 30, y: 420, width: 340, height: 340 },
    ],
    overlays: [],
  },
  duo_portrait_tall: {
    width: 360, height: 1000,
    slots: [
      { x: 25, y: 50,  width: 310, height: 330 },
      { x: 25, y: 410, width: 310, height: 330 },
    ],
    overlays: [],
  },
  // ── 3 slot ───────────────────────────────────────────────────────────────
  strip_3: {
    width: 400, height: 1200,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 340, width: 340, height: 255 },
      { x: 30, y: 630, width: 340, height: 255 },
    ],
    overlays: [],
  },
  strip_3_compact: {
    width: 400, height: 1080,
    slots: [
      { x: 20, y: 40,  width: 360, height: 270 },
      { x: 20, y: 325, width: 360, height: 270 },
      { x: 20, y: 610, width: 360, height: 270 },
    ],
    overlays: [],
  },
  strip_3_loose: {
    width: 400, height: 1350,
    slots: [
      { x: 40, y: 70,  width: 320, height: 250 },
      { x: 40, y: 390, width: 320, height: 250 },
      { x: 40, y: 710, width: 320, height: 250 },
    ],
    overlays: [],
  },
  strip_3_sq: {
    width: 400, height: 1400,
    slots: [
      { x: 30, y: 50,  width: 340, height: 340 },
      { x: 30, y: 420, width: 340, height: 340 },
      { x: 30, y: 790, width: 340, height: 340 },
    ],
    overlays: [],
  },
  // ── 4 slot ───────────────────────────────────────────────────────────────
  collage_4: {
    width: 400, height: 1500,
    slots: [
      { x: 30, y: 50,  width: 340, height: 255 },
      { x: 30, y: 340, width: 340, height: 255 },
      { x: 30, y: 630, width: 340, height: 255 },
      { x: 30, y: 920, width: 340, height: 255 },
    ],
    overlays: [],
  },
  strip_4_compact: {
    width: 400, height: 1320,
    slots: [
      { x: 16, y: 30,  width: 368, height: 270 },
      { x: 16, y: 310, width: 368, height: 270 },
      { x: 16, y: 590, width: 368, height: 270 },
      { x: 16, y: 870, width: 368, height: 270 },
    ],
    overlays: [],
  },
  strip_4_loose: {
    width: 400, height: 1700,
    slots: [
      { x: 45, y: 70,  width: 310, height: 240 },
      { x: 45, y: 370, width: 310, height: 240 },
      { x: 45, y: 670, width: 310, height: 240 },
      { x: 45, y: 970, width: 310, height: 240 },
    ],
    overlays: [],
  },
  strip_4_sq: {
    width: 400, height: 1800,
    slots: [
      { x: 30, y: 50,   width: 340, height: 340 },
      { x: 30, y: 430,  width: 340, height: 340 },
      { x: 30, y: 810,  width: 340, height: 340 },
      { x: 30, y: 1190, width: 340, height: 340 },
    ],
    overlays: [],
  },
  // ── 6 slot ───────────────────────────────────────────────────────────────
  strip_6: {
    width: 400, height: 1900,
    slots: [
      { x: 30, y: 50,   width: 340, height: 255 },
      { x: 30, y: 340,  width: 340, height: 255 },
      { x: 30, y: 630,  width: 340, height: 255 },
      { x: 30, y: 920,  width: 340, height: 255 },
      { x: 30, y: 1210, width: 340, height: 255 },
      { x: 30, y: 1500, width: 340, height: 255 },
    ],
    overlays: [],
  },
  strip_6_compact: {
    width: 400, height: 1680,
    slots: [
      { x: 16, y: 30,   width: 368, height: 235 },
      { x: 16, y: 275,  width: 368, height: 235 },
      { x: 16, y: 520,  width: 368, height: 235 },
      { x: 16, y: 765,  width: 368, height: 235 },
      { x: 16, y: 1010, width: 368, height: 235 },
      { x: 16, y: 1255, width: 368, height: 235 },
    ],
    overlays: [],
  },
  strip_6_loose: {
    width: 400, height: 2100,
    slots: [
      { x: 40, y: 60,   width: 320, height: 240 },
      { x: 40, y: 360,  width: 320, height: 240 },
      { x: 40, y: 660,  width: 320, height: 240 },
      { x: 40, y: 960,  width: 320, height: 240 },
      { x: 40, y: 1260, width: 320, height: 240 },
      { x: 40, y: 1560, width: 320, height: 240 },
    ],
    overlays: [],
  },
};

const seedData = async () => {
  await connectDB();

  await PricingPackage.deleteMany({});
  await Template.deleteMany({});
  console.log('🧹 Cleared existing pricing packages and templates.');

  // ── Pricing Packages ──────────────────────────────────────────────────────
  const packages = [
    {
      name: 'REGULAR',
      price: 35000,
      photoCount: 3,
      duration: 180,
      includeGif: false,
      includeEmail: true,
      isActive: true,
    },
    {
      name: 'PREMIUM',
      price: 45000,
      photoCount: 4,
      duration: 240,
      includeGif: true,
      includeEmail: true,
      isActive: true,
    },
    {
      name: 'ULTIMATE',
      price: 60000,
      photoCount: 6,
      duration: 360,
      includeGif: true,
      includeEmail: true,
      isActive: true,
    },
  ];

  await PricingPackage.insertMany(packages);
  console.log('✅ Pricing Packages seeded!');

  // ── Templates ─────────────────────────────────────────────────────────────
  // Name keywords drive visual theme in FramePreview.tsx.
  // Layout coordinates drive actual photo compositing in StripComposer.
  const templates = [

    // ════════════════════════════════════════════════════════
    // 3-SLOT TEMPLATES  (paket REGULAR)
    // ════════════════════════════════════════════════════════
    {
      name: 'CLASSIC STRIP',
      description: 'Strip putih bersih klasik dengan aksen merah.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'VINTAGE STRIP',
      description: 'Strip bergaya sepia hangat ala foto jadul.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'FILM NOIR STRIP',
      description: 'Strip hitam bergaya negatif film sinema.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'PASTEL STRIP',
      description: 'Strip lembut warna pastel pink manis.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'GOLD STRIP',
      description: 'Strip mewah hitam dengan aksen emas.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'MONO STRIP',
      description: 'Strip hitam-putih kontras tinggi minimalis.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'OCEAN STRIP',
      description: 'Strip biru laut dalam yang tenang.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'SUNSET LOOSE STRIP',
      description: 'Strip bernuansa amber hangat dengan margin lebar.',
      layout: LAYOUTS.strip_3_loose,
      slots: 3,
      isActive: true,
    },
    {
      name: 'MINT COMPACT STRIP',
      description: 'Strip hijau segar dengan susunan rapat.',
      layout: LAYOUTS.strip_3_compact,
      slots: 3,
      isActive: true,
    },
    {
      name: 'NEON GLOW STRIP',
      description: 'Strip gelap dengan aksen neon ungu menyala.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'LAVENDER STRIP',
      description: 'Strip ungu mimpi lembut dan romantis.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'ROSE STRIP',
      description: 'Strip rose gold glamor dengan nuansa gelap.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'CYBER STRIP',
      description: 'Strip cyberpunk hitam dengan aksen kuning elektrik.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'CHERRY STRIP',
      description: 'Strip deep crimson gelap penuh karakter.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'SLATE STRIP',
      description: 'Strip abu terang bersih dan profesional.',
      layout: LAYOUTS.strip_3,
      slots: 3,
      isActive: true,
    },
    {
      name: 'CLASSIC SQUARE STRIP',
      description: 'Strip klasik dengan slot foto berbentuk persegi.',
      layout: LAYOUTS.strip_3_sq,
      slots: 3,
      isActive: true,
    },

    // ════════════════════════════════════════════════════════
    // 4-SLOT TEMPLATES  (paket PREMIUM)
    // ════════════════════════════════════════════════════════
    {
      name: 'CLASSIC STRIP 4',
      description: 'Strip putih bersih 4 foto gaya klasik.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'VINTAGE STRIP 4',
      description: 'Strip sepia hangat 4 foto gaya retro.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'FILM NOIR STRIP 4',
      description: 'Strip film hitam 4 foto bergaya sinema.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'MODERN MINIMAL STRIP 4',
      description: 'Strip modern gelap 4 foto aksen merah.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'GOLD LOOSE STRIP 4',
      description: 'Strip emas mewah 4 foto dengan margin lapang.',
      layout: LAYOUTS.strip_4_loose,
      slots: 4,
      isActive: true,
    },
    {
      name: 'MONO STRIP 4',
      description: 'Strip B&W kontras tinggi 4 foto.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'NEON GLOW STRIP 4',
      description: 'Strip neon ungu 4 foto menyala di gelap.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'MINT COMPACT STRIP 4',
      description: 'Strip hijau segar 4 foto susunan rapat.',
      layout: LAYOUTS.strip_4_compact,
      slots: 4,
      isActive: true,
    },
    {
      name: 'OCEAN STRIP 4',
      description: 'Strip biru dalam 4 foto berasa samudra.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'CHERRY STRIP 4',
      description: 'Strip crimson gelap 4 foto dramatis.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'SUNSET STRIP 4',
      description: 'Strip amber hangat 4 foto saat senja.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'PASTEL SQUARE STRIP 4',
      description: 'Strip pastel pink 4 foto slot persegi.',
      layout: LAYOUTS.strip_4_sq,
      slots: 4,
      isActive: true,
    },
    {
      name: 'LAVENDER LOOSE STRIP 4',
      description: 'Strip ungu mimpi 4 foto margin lebar.',
      layout: LAYOUTS.strip_4_loose,
      slots: 4,
      isActive: true,
    },
    {
      name: 'CYBER FILM STRIP 4',
      description: 'Strip cyberpunk 4 foto dengan efek film.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'ROSE GOLD STRIP 4',
      description: 'Strip rose gold elegan 4 foto.',
      layout: LAYOUTS.collage_4,
      slots: 4,
      isActive: true,
    },
    {
      name: 'SLATE COMPACT STRIP 4',
      description: 'Strip abu profesional 4 foto rapat.',
      layout: LAYOUTS.strip_4_compact,
      slots: 4,
      isActive: true,
    },

    // ════════════════════════════════════════════════════════
    // 6-SLOT TEMPLATES  (paket ULTIMATE)
    // ════════════════════════════════════════════════════════
    {
      name: 'CLASSIC STRIP 6',
      description: 'Strip putih klasik 6 foto lengkap.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'VINTAGE STRIP 6',
      description: 'Strip sepia retro 6 foto kenangan.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'FILM NOIR STRIP 6',
      description: 'Strip negatif film 6 foto sinematik.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'GOLD STRIP 6',
      description: 'Strip emas premium 6 foto mewah.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'MONO STRIP 6',
      description: 'Strip hitam putih 6 foto berteknik tinggi.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'NEON GLOW STRIP 6',
      description: 'Strip neon ungu 6 foto glowing.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'MINT COMPACT STRIP 6',
      description: 'Strip mint segar 6 foto susunan rapat.',
      layout: LAYOUTS.strip_6_compact,
      slots: 6,
      isActive: true,
    },
    {
      name: 'OCEAN STRIP 6',
      description: 'Strip biru lautan 6 foto.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'LAVENDER LOOSE STRIP 6',
      description: 'Strip lavender 6 foto margin lapang.',
      layout: LAYOUTS.strip_6_loose,
      slots: 6,
      isActive: true,
    },
    {
      name: 'ROSE GOLD STRIP 6',
      description: 'Strip rose gold 6 foto glamor.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'CHERRY STRIP 6',
      description: 'Strip crimson gelap 6 foto dramatis.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'SUNSET LOOSE STRIP 6',
      description: 'Strip amber 6 foto margin hangat.',
      layout: LAYOUTS.strip_6_loose,
      slots: 6,
      isActive: true,
    },
    {
      name: 'CYBER FILM STRIP 6',
      description: 'Strip cyberpunk 6 foto kuning elektrik.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'PASTEL STRIP 6',
      description: 'Strip pink pastel 6 foto manis.',
      layout: LAYOUTS.strip_6,
      slots: 6,
      isActive: true,
    },
    {
      name: 'SLATE COMPACT STRIP 6',
      description: 'Strip abu profesional 6 foto rapat.',
      layout: LAYOUTS.strip_6_compact,
      slots: 6,
      isActive: true,
    },
  ];

  await Template.insertMany(templates);
  console.log(`✅ ${templates.length} Templates seeded!`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB.');
  process.exit(0);
};

seedData().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
