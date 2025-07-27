import { Client, Databases, ID } from 'node-appwrite';
import { config } from './config.js';

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

const laptopBrands = [
  {
    brand: 'Apple',
    models: [
      'MacBook Pro 16', 'MacBook Pro 14', 'MacBook Air 15', 'MacBook Air 13', 'MacBook Pro 13', 'MacBook Air M2', 'MacBook Pro M2', 'MacBook 12'
    ]
  },
  {
    brand: 'Samsung',
    models: [
      'Galaxy Book3 Pro', 'Galaxy Book2', 'Galaxy Book Flex', 'Galaxy Book Ion', 'Galaxy Book Go', 'Galaxy Book S'
    ]
  },
  {
    brand: 'MI',
    models: [
      'Mi Notebook Ultra', 'Mi Notebook Pro', 'RedmiBook 15', 'RedmiBook Pro', 'Mi Notebook 14', 'Mi Notebook Horizon', 'RedmiBook e-Learning', 'RedmiBook Air 13'
    ]
  },
  {
    brand: 'Dell',
    models: [
      'XPS 13 Plus', 'XPS 15', 'Inspiron 15', 'Inspiron 14', 'Latitude 7420', 'Latitude 5430', 'Vostro 3510', 'Alienware m15', 'G15 Gaming', 'Precision 5570', 'XPS 17', 'Inspiron 16', 'Latitude 7410', 'Latitude 5400', 'Latitude 5300', 'Latitude 7200', 'Latitude 7300', 'Latitude 7400', 'Latitude 7500', 'Latitude 7600', 'Latitude 7700', 'Latitude 7800', 'Latitude 7900', 'Latitude 8000', 'Latitude 8100', 'Latitude 8200', 'Latitude 8300', 'Latitude 8400', 'Latitude 8500', 'Latitude 8600'
    ]
  },
  {
    brand: 'HP',
    models: [
      'Spectre x360', 'Pavilion 15', 'Envy 16', 'Envy 14', 'Omen 16', 'Victus 16', 'EliteBook 840', 'ProBook 450', 'ZBook Firefly', 'Chromebook x360', 'Pavilion x360', 'OMEN 17', 'EliteBook 830', 'EliteBook 850', 'EliteBook 860', 'EliteBook 870', 'EliteBook 880', 'EliteBook 890', 'EliteBook 900', 'EliteBook 910', 'EliteBook 920', 'EliteBook 930', 'EliteBook 940', 'EliteBook 950', 'EliteBook 960', 'EliteBook 970', 'EliteBook 980', 'EliteBook 990', 'EliteBook 1000'
    ]
  },
  {
    brand: 'Lenovo',
    models: [
      'ThinkPad X1 Carbon', 'Yoga 9i', 'Legion 5', 'IdeaPad Slim 5', 'ThinkBook 14', 'Yoga Slim 7', 'IdeaPad Gaming 3', 'ThinkPad E14', 'Yoga 7i', 'IdeaPad 3', 'Legion 7', 'ThinkPad T14', 'ThinkPad X1 Extreme', 'ThinkPad X1 Yoga', 'ThinkPad X1 Tablet', 'ThinkPad X1 Nano', 'ThinkPad X1 Fold', 'ThinkPad X1 Titanium', 'ThinkPad X1 Carbon Gen 9', 'ThinkPad X1 Carbon Gen 10', 'ThinkPad X1 Carbon Gen 11', 'ThinkPad X1 Carbon Gen 12', 'ThinkPad X1 Carbon Gen 13', 'ThinkPad X1 Carbon Gen 14', 'ThinkPad X1 Carbon Gen 15', 'ThinkPad X1 Carbon Gen 16', 'ThinkPad X1 Carbon Gen 17', 'ThinkPad X1 Carbon Gen 18', 'ThinkPad X1 Carbon Gen 19', 'ThinkPad X1 Carbon Gen 20'
    ]
  },
  {
    brand: 'Acer',
    models: [
      'Aspire 7', 'Swift 5', 'Nitro 5', 'Predator Helios 300', 'Spin 5', 'TravelMate P2', 'Extensa 15', 'Chromebook 314', 'Aspire 5', 'Swift 3', 'Predator Triton 500', 'Spin 3', 'Aspire 3', 'Aspire 1', 'Aspire E15', 'Aspire E5', 'Aspire R13', 'Aspire R14', 'Aspire R15', 'Aspire S13', 'Aspire S14', 'Aspire S15', 'Aspire S17', 'Aspire S18', 'Aspire S19', 'Aspire S20', 'Aspire S21', 'Aspire S22', 'Aspire S23', 'Aspire S24'
    ]
  },
  {
    brand: 'MSI',
    models: [
      'MSI Stealth 16', 'MSI Modern 14', 'MSI GF63', 'MSI Katana 15', 'MSI Pulse GL66', 'MSI Prestige 14', 'MSI Summit E13', 'MSI Creator Z16', 'MSI Bravo 15', 'MSI Sword 15', 'MSI Raider GE76', 'MSI Vector GP66', 'MSI Alpha 15', 'MSI Alpha 17', 'MSI Alpha 19', 'MSI Alpha 21', 'MSI Alpha 23', 'MSI Alpha 25', 'MSI Alpha 27', 'MSI Alpha 29', 'MSI Alpha 31', 'MSI Alpha 33', 'MSI Alpha 35', 'MSI Alpha 37', 'MSI Alpha 39', 'MSI Alpha 41', 'MSI Alpha 43', 'MSI Alpha 45', 'MSI Alpha 47', 'MSI Alpha 49'
    ]
  }
];

async function clearLaptopsCollection() {
  let keepDeleting = true;
  while (keepDeleting) {
    const allLaptops = await databases.listDocuments(DATABASE_ID, 'laptops', []);
    if (allLaptops.documents.length === 0) {
      keepDeleting = false;
    } else {
      for (const doc of allLaptops.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, 'laptops', doc.$id);
        } catch (err) {
          console.error('Failed to delete laptop', doc.$id, err);
        }
      }
    }
  }
}

async function seedLaptops() {
  await clearLaptopsCollection();
  for (const brand of laptopBrands) {
    for (const model of brand.models) {
      await databases.createDocument(
        DATABASE_ID,
        'laptops',
        ID.unique(),
        {
          brand: brand.brand,
          model
        }
      );
    }
  }
  console.log('All laptop brands and models seeded!');
}

seedLaptops().catch(console.error); 