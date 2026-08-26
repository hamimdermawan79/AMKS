import { db } from '../lib/db';

async function seedDummyInventory() {
  const dummyItems = [
    {
      name: 'Kulkas 2 Pintu Bersama',
      category: 'Elektronik',
      quantity: 2,
      condition: 'BAIK',
      location: 'Dapur Utama',
      description: 'Kulkas pendingin bersama untuk kebutuhan bahan makanan dan minuman warga asrama.',
      photoUrl: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Lemari Penyimpanan Warga',
      category: 'Furnitur',
      quantity: 6,
      condition: 'BAIK',
      location: 'Lorong Lantai 1 & 2',
      description: 'Lemari kabinet bersama untuk penyimpanan perlengkapan dan logistik asrama.',
      photoUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Mesin Cuci Otomatis',
      category: 'Elektronik',
      quantity: 2,
      condition: 'BAIK',
      location: 'Area Cuci Jemur',
      description: 'Mesin cuci otomatis untuk mendukung kebersihan pakaian warga asrama.',
      photoUrl: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Dispenser Air Galon',
      category: 'Elektronik',
      quantity: 3,
      condition: 'BAIK',
      location: 'Ruang Bersama & Dapur',
      description: 'Dispenser air galon dengan opsi panas, dingin, dan normal untuk konsumsi sehari-hari.',
      photoUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Kompor Gas 2 Tungku',
      category: 'Alat Masak',
      quantity: 2,
      condition: 'BAIK',
      location: 'Dapur Utama',
      description: 'Kompor gas lengkap dengan regulator pengaman untuk memasak bersama.',
      photoUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Smart TV & Sound System',
      category: 'Elektronik',
      quantity: 1,
      condition: 'BAIK',
      location: 'Ruang Tengah / Aula',
      description: 'Smart TV 43 inch untuk nobar, kegiatan bersama, dan pemutaran media presentasi.',
      photoUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Meja & Kursi Belajar',
      category: 'Furnitur',
      quantity: 8,
      condition: 'BAIK',
      location: 'Ruang Belajar',
      description: 'Set meja dan kursi ergonomis untuk menunjang kegiatan akademik dan tugas kuliah.',
      photoUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&auto=format&fit=crop&q=80',
    },
    {
      name: 'Rak Sepatu & Helm Bersama',
      category: 'Furnitur',
      quantity: 4,
      condition: 'BAIK',
      location: 'Teras Depan',
      description: 'Rak penyimpanan sepatu dan helm agar area pintu masuk tetap tertata rapi.',
      photoUrl: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&auto=format&fit=crop&q=80',
    },
  ];

  console.log('Inserting dummy inventory data...');
  for (const item of dummyItems) {
    const existing = await db.inventory.findFirst({ where: { name: item.name } });
    if (!existing) {
      await db.inventory.create({ data: item });
      console.log('Created:', item.name);
    } else {
      await db.inventory.update({ where: { id: existing.id }, data: item });
      console.log('Updated:', item.name);
    }
  }
  const total = await db.inventory.count();
  console.log(`Success! Total inventory items in database: ${total}`);
  process.exit(0);
}

seedDummyInventory().catch((err) => {
  console.error(err);
  process.exit(1);
});
