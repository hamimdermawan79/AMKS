import { db } from '@/lib/db';

async function seedIuranConfig() {
  const existing = await db.iuranConfig.findFirst();
  if (!existing) {
    await db.iuranConfig.create({
      data: {
        baseAmount: 50000,
        wifiAddon: 30000,
      },
    });
    console.log('IuranConfig seeded: base=50000, wifi=30000');
  } else {
    console.log('IuranConfig already exists');
  }
}

seedIuranConfig().catch(console.error);
