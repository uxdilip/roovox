import { Client, Databases, ID } from 'node-appwrite';
import { config } from './config.js';

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

const phoneBrands = [
  {
    brand: 'Apple',
    models: [
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X', 'iPhone SE 2022', 'iPhone SE 2020', 'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7'
    ]
  },
  {
    brand: 'Samsung',
    models: [
      'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22', 'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21', 'Galaxy Note 20 Ultra', 'Galaxy Note 20', 'Galaxy A54', 'Galaxy A34', 'Galaxy M54', 'Galaxy M34', 'Galaxy F54', 'Galaxy F34', 'Galaxy Z Fold5', 'Galaxy Z Flip5'
    ]
  },
  {
    brand: 'MI',
    models: [
      'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12', 'Redmi Note 11 Pro+', 'Redmi Note 11 Pro', 'Redmi Note 11', 'Redmi 12', 'Redmi 11', 'Mi 11X Pro', 'Mi 11X', 'Mi 10T Pro', 'Mi 10T', 'Mi 10', 'Mi 10i', 'Mi A3', 'Mi A2'
    ]
  },
  {
    brand: 'OnePlus',
    models: [
      'OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 11R', 'OnePlus 10 Pro', 'OnePlus 10T', 'OnePlus 10R', 'OnePlus 9 Pro', 'OnePlus 9', 'OnePlus 9R', 'OnePlus 8 Pro', 'OnePlus 8T', 'OnePlus 8', 'OnePlus 7T Pro', 'OnePlus 7T', 'OnePlus 7 Pro', 'OnePlus 7', 'OnePlus Nord 3', 'OnePlus Nord CE 3', 'OnePlus Nord 2T', 'OnePlus Nord 2', 'OnePlus Nord CE 2'
    ]
  },
  {
    brand: 'Vivo',
    models: [
      'Vivo X100 Pro', 'Vivo X100', 'Vivo X90 Pro', 'Vivo X90', 'Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo V29', 'Vivo T2 Pro', 'Vivo T2', 'Vivo Y200', 'Vivo Y100', 'Vivo Y56', 'Vivo Y22'
    ]
  },
  {
    brand: 'Oppo',
    models: [
      'Oppo Find X7 Ultra', 'Oppo Find X7', 'Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo Reno 10 Pro+', 'Oppo Reno 10 Pro', 'Oppo Reno 10', 'Oppo F25 Pro', 'Oppo F23', 'Oppo F21 Pro', 'Oppo A79', 'Oppo A59', 'Oppo K10'
    ]
  },
  {
    brand: 'Realme',
    models: [
      'Realme 12 Pro+', 'Realme 12 Pro', 'Realme 11 Pro+', 'Realme 11 Pro', 'Realme 10 Pro+', 'Realme 10 Pro', 'Realme 9 Pro+', 'Realme 9 Pro', 'Realme Narzo 70', 'Realme Narzo 60', 'Realme C67', 'Realme C55', 'Realme GT Neo 3', 'Realme GT Neo 2', 'Realme 9i', 'Realme 8i'
    ]
  },
  {
    brand: 'Motorola',
    models: [
      'Moto Edge 50 Pro', 'Moto Edge 50', 'Moto Edge 40', 'Moto Edge 30', 'Moto G84', 'Moto G73', 'Moto G54', 'Moto G32', 'Moto G Stylus', 'Moto E13', 'Moto G60', 'Moto G51', 'Moto G40 Fusion', 'Moto G31', 'Moto G22', 'Moto G20', 'Moto G10 Power', 'Moto E40', 'Moto E32', 'Moto E22s', 'Moto E7 Power'
    ]
  },
  {
    brand: 'Nokia',
    models: [
      'Nokia G42', 'Nokia X30', 'Nokia C32', 'Nokia G21', 'Nokia 5.4', 'Nokia 3.4', 'Nokia 2.4', 'Nokia G20', 'Nokia G10', 'Nokia 7.2', 'Nokia 6.1 Plus', 'Nokia 5.1 Plus', 'Nokia 4.2', 'Nokia 3.2', 'Nokia 2.3', 'Nokia 1.4', 'Nokia 1 Plus', 'Nokia 8.1', 'Nokia 7 Plus', 'Nokia 6', 'Nokia 5.1', 'Nokia 3.1'
    ]
  },
  {
    brand: 'Honor',
    models: [
      'Honor 90', 'Honor X9b', 'Honor X8b', 'Honor 70', 'Honor X7a', 'Honor Magic 5', 'Honor Play 40', 'Honor 50', 'Honor 9X', 'Honor 8X', 'Honor 7X', 'Honor 6X', 'Honor 5X', 'Honor 4X', 'Honor 3C', 'Honor 3X', 'Honor 6', 'Honor 7', 'Honor 8', 'Honor 9', 'Honor 10', 'Honor 20'
    ]
  },
  {
    brand: 'Asus',
    models: [
      'ROG Phone 7', 'ROG Phone 6', 'Zenfone 10', 'Zenfone 9', 'Asus 8z', 'Asus 6Z', 'Asus Max Pro M2'
    ]
  },
  {
    brand: 'Google',
    models: [
      'Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 6a', 'Pixel 6', 'Pixel 5', 'Pixel 4a', 'Pixel 4', 'Pixel 3a', 'Pixel 3'
    ]
  },
  {
    brand: 'Nothing',
    models: [
      'Nothing Phone (2a)',
      'Nothing Phone (2)',
      'Nothing Phone (1)'
    ]
  },
  {
    brand: 'iQOO',
    models: [
      'iQOO 12',
      'iQOO 11',
      'iQOO 9 Pro',
      'iQOO 9',
      'iQOO 7',
      'iQOO Z9',
      'iQOO Z7',
      'iQOO Neo 7',
      'iQOO Neo 6'
    ]
  }
];

async function clearPhonesCollection() {
  let keepDeleting = true;
  while (keepDeleting) {
    const allPhones = await databases.listDocuments(DATABASE_ID, 'phones', []);
    if (allPhones.documents.length === 0) {
      keepDeleting = false;
    } else {
      for (const doc of allPhones.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, 'phones', doc.$id);
        } catch (err) {
          console.error('Failed to delete phone', doc.$id, err);
        }
      }
    }
  }
}

async function seedPhones() {
  await clearPhonesCollection();
  for (const brand of phoneBrands) {
    for (const model of brand.models) {
      await databases.createDocument(
        DATABASE_ID,
        'phones',
        ID.unique(),
        {
          brand: brand.brand,
          model
        }
      );
    }
  }
  console.log('All phone brands and models seeded!');
}

seedPhones().catch(console.error); 