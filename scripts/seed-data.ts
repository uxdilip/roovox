import { Client, Databases, ID, Query } from 'node-appwrite';
import { config } from './config.js';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

// Seed Categories
const categories = [
  { name: 'Phone' },
  { name: 'Laptop' }
];

// Seed Brands (linked to Categories)
const brands = [
  {
    name: 'Apple',
    phones: [
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X', 'iPhone SE 2022', 'iPhone SE 2020', 'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7'
    ],
    laptops: [
      'MacBook Pro 16', 'MacBook Pro 14', 'MacBook Air 15', 'MacBook Air 13', 'MacBook Pro 13', 'MacBook Air M2', 'MacBook Pro M2', 'MacBook 12'
    ]
  },
  {
    name: 'Samsung',
    phones: [
      'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22', 'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21', 'Galaxy Note 20 Ultra', 'Galaxy Note 20', 'Galaxy A54', 'Galaxy A34', 'Galaxy M54', 'Galaxy M34', 'Galaxy F54', 'Galaxy F34', 'Galaxy Z Fold5', 'Galaxy Z Flip5'
    ],
    laptops: [
      'Galaxy Book3 Pro', 'Galaxy Book2', 'Galaxy Book Flex', 'Galaxy Book Ion', 'Galaxy Book Go', 'Galaxy Book S'
    ]
  },
  {
    name: 'MI',
    phones: [
      'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12', 'Redmi Note 11 Pro+', 'Redmi Note 11 Pro', 'Redmi Note 11', 'Redmi 12', 'Redmi 11', 'Mi 11X Pro', 'Mi 11X', 'Mi 10T Pro', 'Mi 10T', 'Mi 10', 'Mi 10i', 'Mi A3', 'Mi A2'
    ],
    laptops: [
      'Mi Notebook Ultra', 'Mi Notebook Pro', 'RedmiBook 15', 'RedmiBook Pro', 'Mi Notebook 14', 'Mi Notebook Horizon', 'RedmiBook e-Learning', 'RedmiBook Air 13'
    ]
  },
  // Only real laptop brands below this point
  {
    name: 'Dell',
    phones: [],
    laptops: [
      'XPS 13 Plus', 'XPS 15', 'Inspiron 15', 'Inspiron 14', 'Latitude 7420', 'Latitude 5430', 'Vostro 3510', 'Alienware m15', 'G15 Gaming', 'Precision 5570', 'XPS 17', 'Inspiron 16', 'Latitude 7410', 'Latitude 5400', 'Latitude 5300', 'Latitude 7200', 'Latitude 7300', 'Latitude 7400', 'Latitude 7500', 'Latitude 7600', 'Latitude 7700', 'Latitude 7800', 'Latitude 7900', 'Latitude 8000', 'Latitude 8100', 'Latitude 8200', 'Latitude 8300', 'Latitude 8400', 'Latitude 8500', 'Latitude 8600'
    ]
  },
  {
    name: 'HP',
    phones: [],
    laptops: [
      'Spectre x360', 'Pavilion 15', 'Envy 16', 'Envy 14', 'Omen 16', 'Victus 16', 'EliteBook 840', 'ProBook 450', 'ZBook Firefly', 'Chromebook x360', 'Pavilion x360', 'OMEN 17', 'EliteBook 830', 'EliteBook 850', 'EliteBook 860', 'EliteBook 870', 'EliteBook 880', 'EliteBook 890', 'EliteBook 900', 'EliteBook 910', 'EliteBook 920', 'EliteBook 930', 'EliteBook 940', 'EliteBook 950', 'EliteBook 960', 'EliteBook 970', 'EliteBook 980', 'EliteBook 990', 'EliteBook 1000'
    ]
  },
  {
    name: 'Lenovo',
    phones: [],
    laptops: [
      'ThinkPad X1 Carbon', 'Yoga 9i', 'Legion 5', 'IdeaPad Slim 5', 'ThinkBook 14', 'Yoga Slim 7', 'IdeaPad Gaming 3', 'ThinkPad E14', 'Yoga 7i', 'IdeaPad 3', 'Legion 7', 'ThinkPad T14', 'ThinkPad X1 Extreme', 'ThinkPad X1 Yoga', 'ThinkPad X1 Tablet', 'ThinkPad X1 Nano', 'ThinkPad X1 Fold', 'ThinkPad X1 Titanium', 'ThinkPad X1 Carbon Gen 9', 'ThinkPad X1 Carbon Gen 10', 'ThinkPad X1 Carbon Gen 11', 'ThinkPad X1 Carbon Gen 12', 'ThinkPad X1 Carbon Gen 13', 'ThinkPad X1 Carbon Gen 14', 'ThinkPad X1 Carbon Gen 15', 'ThinkPad X1 Carbon Gen 16', 'ThinkPad X1 Carbon Gen 17', 'ThinkPad X1 Carbon Gen 18', 'ThinkPad X1 Carbon Gen 19', 'ThinkPad X1 Carbon Gen 20'
    ]
  },
  {
    name: 'Acer',
    phones: [],
    laptops: [
      'Aspire 7', 'Swift 5', 'Nitro 5', 'Predator Helios 300', 'Spin 5', 'TravelMate P2', 'Extensa 15', 'Chromebook 314', 'Aspire 5', 'Swift 3', 'Predator Triton 500', 'Spin 3', 'Aspire 3', 'Aspire 1', 'Aspire E15', 'Aspire E5', 'Aspire R13', 'Aspire R14', 'Aspire R15', 'Aspire S13', 'Aspire S14', 'Aspire S15', 'Aspire S17', 'Aspire S18', 'Aspire S19', 'Aspire S20', 'Aspire S21', 'Aspire S22', 'Aspire S23', 'Aspire S24'
    ]
  },
  {
    name: 'MSI',
    phones: [],
    laptops: [
      'MSI Stealth 16', 'MSI Modern 14', 'MSI GF63', 'MSI Katana 15', 'MSI Pulse GL66', 'MSI Prestige 14', 'MSI Summit E13', 'MSI Creator Z16', 'MSI Bravo 15', 'MSI Sword 15', 'MSI Raider GE76', 'MSI Vector GP66', 'MSI Alpha 15', 'MSI Alpha 17', 'MSI Alpha 19', 'MSI Alpha 21', 'MSI Alpha 23', 'MSI Alpha 25', 'MSI Alpha 27', 'MSI Alpha 29', 'MSI Alpha 31', 'MSI Alpha 33', 'MSI Alpha 35', 'MSI Alpha 37', 'MSI Alpha 39', 'MSI Alpha 41', 'MSI Alpha 43', 'MSI Alpha 45', 'MSI Alpha 47', 'MSI Alpha 49'
    ]
  },
  // You can add more real laptop brands here if needed
];

const getCategoryId = async (name: string) => {
  const res = await databases.listDocuments(DATABASE_ID, 'categories', [
    // Appwrite Query.equal('name', name) if using Appwrite JS SDK
  ]);
  return res.documents.find((doc) => doc.name === name)?.$id;
};

const getBrandId = async (name: string) => {
  const res = await databases.listDocuments(DATABASE_ID, 'brands', []);
  return res.documents.find((doc) => doc.name === name)?.$id;
};

const seedReferenceData = async () => {
  // Seed Categories
  for (const category of categories) {
    try {
      await databases.createDocument(
        DATABASE_ID,
        'categories',
        ID.unique(),
        category
      );
      console.log(`✓ Created category: ${category.name}`);
    } catch (error) {
      console.error(`✗ Error creating category ${category.name}:`, error);
    }
  }

  // Seed Brands
  for (const brand of brands) {
    try {
      const categoryId = await getCategoryId(brand.name);
      await databases.createDocument(
        DATABASE_ID,
        'brands',
        ID.unique(),
        { name: brand.name, category_id: categoryId }
      );
      console.log(`✓ Created brand: ${brand.name}`);
    } catch (error) {
      console.error(`✗ Error creating brand ${brand.name}:`, error);
    }
  }

  // Seed Models
  for (const brand of brands) {
    // Phones
    for (const model of brand.phones || []) {
      try {
        const categoryId = await getCategoryId('Phone');
        await databases.createDocument(
          DATABASE_ID,
          'models',
          ID.unique(),
          { name: model, category_id: categoryId, brand_id: await getBrandId(brand.name) }
        );
        console.log(`✓ Created model: ${model}`);
      } catch (error) {
        console.error(`✗ Error creating model ${model}:`, error);
      }
    }
    // Laptops
    for (const model of brand.laptops || []) {
      try {
        const categoryId = await getCategoryId('Laptop');
        await databases.createDocument(
          DATABASE_ID,
          'models',
          ID.unique(),
          { name: model, category_id: categoryId, brand_id: await getBrandId(brand.name) }
        );
        console.log(`✓ Created model: ${model}`);
      } catch (error) {
        console.error(`✗ Error creating model ${model}:`, error);
      }
    }
  }

  // Seed Issues
  // for (const issue of issues) {
  //   try {
  //     const categoryId = await getCategoryId(issue.categoryName);
  //     await databases.createDocument(
  //       DATABASE_ID,
  //       'issues',
  //       ID.unique(),
  //       { name: issue.name, description: issue.description, category_id: categoryId }
  //     );
  //     console.log(`✓ Created issue: ${issue.name}`);
  //   } catch (error) {
  //     console.error(`✗ Error creating issue ${issue.name}:`, error);
  //   }
  // }

  // Seed ServiceTypes
  // for (const serviceType of serviceTypes) {
  //   try {
  //     await databases.createDocument(
  //       DATABASE_ID,
  //       'service_types',
  //       ID.unique(),
  //       serviceType
  //     );
  //     console.log(`✓ Created service type: ${serviceType.name}`);
  //   } catch (error) {
  //     console.error(`✗ Error creating service type ${serviceType.name}:`, error);
  //   }
  // }
};

async function clearDevicesCollection() {
  let keepDeleting = true;
  while (keepDeleting) {
    const allDevices = await databases.listDocuments(DATABASE_ID, 'devices', [Query.limit(100)]);
    if (allDevices.documents.length === 0) {
      keepDeleting = false;
    } else {
      for (const doc of allDevices.documents) {
        try {
          await databases.deleteDocument(DATABASE_ID, 'devices', doc.$id);
        } catch (err) {
          console.error('Failed to delete device', doc.$id, err);
        }
      }
    }
  }
}

async function seedAllBrandsAndModels() {
  await clearDevicesCollection(); // Clear before seeding
  const brands = [
    {
      name: 'Apple',
      phones: [
        'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X', 'iPhone SE 2022', 'iPhone SE 2020', 'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7'
      ],
      laptops: [
        'MacBook Pro 16', 'MacBook Pro 14', 'MacBook Air 15', 'MacBook Air 13', 'MacBook Pro 13', 'MacBook Air M2', 'MacBook Pro M2', 'MacBook 12'
      ]
    },
    {
      name: 'Samsung',
      phones: [
        'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22', 'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21', 'Galaxy Note 20 Ultra', 'Galaxy Note 20', 'Galaxy A54', 'Galaxy A34', 'Galaxy M54', 'Galaxy M34', 'Galaxy F54', 'Galaxy F34', 'Galaxy Z Fold5', 'Galaxy Z Flip5'
      ],
      laptops: [
        'Galaxy Book3 Pro', 'Galaxy Book2', 'Galaxy Book Flex', 'Galaxy Book Ion', 'Galaxy Book Go', 'Galaxy Book S'
      ]
    },
    {
      name: 'MI',
      phones: [
        'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12', 'Redmi Note 11 Pro+', 'Redmi Note 11 Pro', 'Redmi Note 11', 'Redmi 12', 'Redmi 11', 'Mi 11X Pro', 'Mi 11X', 'Mi 10T Pro', 'Mi 10T', 'Mi 10', 'Mi 10i', 'Mi A3', 'Mi A2'
      ],
      laptops: [
        'Mi Notebook Ultra', 'Mi Notebook Pro', 'RedmiBook 15', 'RedmiBook Pro', 'Mi Notebook 14', 'Mi Notebook Horizon', 'RedmiBook e-Learning', 'RedmiBook Air 13'
      ]
    },
    {
      name: 'OnePlus',
      phones: [
        'OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 11R', 'OnePlus 10 Pro', 'OnePlus 10T', 'OnePlus 10R', 'OnePlus 9 Pro', 'OnePlus 9', 'OnePlus 9R', 'OnePlus 8 Pro', 'OnePlus 8T', 'OnePlus 8', 'OnePlus 7T Pro', 'OnePlus 7T', 'OnePlus 7 Pro', 'OnePlus 7', 'OnePlus Nord 3', 'OnePlus Nord CE 3', 'OnePlus Nord 2T', 'OnePlus Nord 2', 'OnePlus Nord CE 2'
      ],
      laptops: [] // OnePlus does not make laptops
    },
    {
      name: 'Vivo',
      phones: [
        'Vivo X100 Pro', 'Vivo X100', 'Vivo X90 Pro', 'Vivo X90', 'Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo V29', 'Vivo T2 Pro', 'Vivo T2', 'Vivo Y200', 'Vivo Y100', 'Vivo Y56', 'Vivo Y22'
      ],
      laptops: []
    },
    {
      name: 'Oppo',
      phones: [
        'Oppo Find X7 Ultra', 'Oppo Find X7', 'Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo Reno 10 Pro+', 'Oppo Reno 10 Pro', 'Oppo Reno 10', 'Oppo F25 Pro', 'Oppo F23', 'Oppo F21 Pro', 'Oppo A79', 'Oppo A59', 'Oppo K10'
      ],
      laptops: []
    },
    {
      name: 'Realme',
      phones: [
        'Realme 12 Pro+', 'Realme 12 Pro', 'Realme 11 Pro+', 'Realme 11 Pro', 'Realme 10 Pro+', 'Realme 10 Pro', 'Realme 9 Pro+', 'Realme 9 Pro', 'Realme Narzo 70', 'Realme Narzo 60', 'Realme C67', 'Realme C55', 'Realme GT Neo 3', 'Realme GT Neo 2', 'Realme 9i', 'Realme 8i'
      ],
      laptops: [
        'Realme Book Slim', 'Realme Book Prime', 'Realme Book'
      ]
    },
    {
      name: 'Motorola',
      phones: [
        'Moto Edge 50 Pro', 'Moto Edge 50', 'Moto Edge 40', 'Moto Edge 30', 'Moto G84', 'Moto G73', 'Moto G54', 'Moto G32', 'Moto G Stylus', 'Moto E13', 'Moto G60', 'Moto G51', 'Moto G40 Fusion', 'Moto G31', 'Moto G22', 'Moto G20', 'Moto G10 Power', 'Moto E40', 'Moto E32', 'Moto E22s', 'Moto E7 Power'
      ],
      laptops: []
    },
    {
      name: 'Nokia',
      phones: [
        'Nokia G42', 'Nokia X30', 'Nokia C32', 'Nokia G21', 'Nokia 5.4', 'Nokia 3.4', 'Nokia 2.4', 'Nokia G20', 'Nokia G10', 'Nokia 7.2', 'Nokia 6.1 Plus', 'Nokia 5.1 Plus', 'Nokia 4.2', 'Nokia 3.2', 'Nokia 2.3', 'Nokia 1.4', 'Nokia 1 Plus', 'Nokia 8.1', 'Nokia 7 Plus', 'Nokia 6', 'Nokia 5.1', 'Nokia 3.1'
      ],
      laptops: [
        'Nokia PureBook S14', 'Nokia PureBook X14', 'Nokia Booklet 3G'
      ]
    },
    {
      name: 'Honor',
      phones: [
        'Honor 90', 'Honor X9b', 'Honor X8b', 'Honor 70', 'Honor X7a', 'Honor Magic 5', 'Honor Play 40', 'Honor 50', 'Honor 9X', 'Honor 8X', 'Honor 7X', 'Honor 6X', 'Honor 5X', 'Honor 4X', 'Honor 3C', 'Honor 3X', 'Honor 6', 'Honor 7', 'Honor 8', 'Honor 9', 'Honor 10', 'Honor 20'
      ],
      laptops: [
        'Honor MagicBook 14', 'Honor MagicBook X16', 'Honor MagicBook 15'
      ]
    },
    {
      name: 'Asus',
      phones: [
        'ROG Phone 7', 'ROG Phone 6', 'Zenfone 10', 'Zenfone 9', 'Asus 8z', 'Asus 6Z', 'Asus Max Pro M2'
      ],
      laptops: [
        'ZenBook 14', 'VivoBook 15', 'ROG Zephyrus G14', 'TUF Gaming F15', 'ExpertBook B9', 'Asus ZenBook Duo', 'Asus ZenBook Flip', 'Asus ZenBook Pro', 'Asus ZenBook S', 'Asus ZenBook 13', 'Asus ZenBook 15', 'Asus ZenBook 17', 'Asus VivoBook S15', 'Asus VivoBook S14', 'Asus VivoBook S13', 'Asus VivoBook S12', 'Asus VivoBook 17', 'Asus VivoBook 14', 'Asus VivoBook 13'
      ]
    },
    {
      name: 'Google',
      phones: [
        'Pixel 8 Pro', 'Pixel 8', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 6a', 'Pixel 6', 'Pixel 5', 'Pixel 4a', 'Pixel 4', 'Pixel 3a', 'Pixel 3'
      ],
      laptops: [
        'Pixelbook Go', 'Pixelbook', 'Pixel Slate', 'Pixel C', 'Pixel Tab', 'Pixelbook 2', 'Pixelbook 3', 'Pixelbook 4', 'Pixelbook 5', 'Pixelbook 6', 'Pixelbook 7', 'Pixelbook 8', 'Pixelbook 9', 'Pixelbook 10', 'Pixelbook 11', 'Pixelbook 12'
      ]
    },
    { name: 'Poco', models: [
      'Poco F6 Pro', 'Poco F6', 'Poco X6 Pro', 'Poco X6', 'Poco M6 Pro', 'Poco M6', 'Poco X5 Pro', 'Poco X5', 'Poco F5 Pro', 'Poco F5', 'Poco M5', 'Poco M4 Pro', 'PocoBook X', 'Poco Tab', 'Poco Laptop', 'Poco Slate', 'Poco Book', 'PocoBook Pro', 'PocoBook Air', 'PocoBook S', 'PocoBook 15', 'PocoBook 14', 'PocoBook 13', 'PocoBook 12', 'PocoBook 11', 'PocoBook 10'
    ] },
    { name: 'Infinix', models: [
      'Infinix Note 40', 'Infinix GT 20 Pro', 'Infinix Hot 40i', 'Infinix Smart 8', 'Infinix Zero 30', 'Infinix Note 30', 'Infinix Hot 30', 'InBook X2', 'InBook X1', 'InBook Y1', 'Infinix Tab', 'Infinix Laptop', 'Infinix Note 12', 'Infinix Note 11', 'Infinix Note 10', 'Infinix Note 9', 'Infinix Note 8', 'Infinix Note 7', 'Infinix Note 6', 'Infinix Note 5', 'Infinix Note 4', 'Infinix Note 3', 'Infinix Note 2', 'Infinix Note 1', 'Infinix Hot 9', 'Infinix Hot 8', 'Infinix Hot 7'
    ] },
    { name: 'iQOO', models: [
      'iQOO 12', 'iQOO Z9', 'iQOO Neo 9 Pro', 'iQOO Z7 Pro', 'iQOO 11', 'iQOO 9T', 'iQOO Z6', 'iQOO Pad', 'iQOO Book', 'iQOO Tab', 'iQOO Laptop', 'iQOO Slate', 'iQOO 10', 'iQOO 9', 'iQOO 8', 'iQOO 7', 'iQOO 6', 'iQOO 5', 'iQOO 4', 'iQOO 3', 'iQOO 2', 'iQOO 1', 'iQOO Neo 8', 'iQOO Neo 7', 'iQOO Neo 6', 'iQOO Neo 5', 'iQOO Neo 4'
    ] },
    { name: 'Nothing', models: [
      'Nothing Phone (2)', 'Nothing Phone (1)', 'Nothing Ear (2)', 'Nothing Ear (1)', 'Nothing Book (1)', 'Nothing Tab', 'Nothing Laptop', 'Nothing Slate', 'Nothing Pad', 'Nothing Book', 'Nothing Tab 2', 'Nothing Laptop 2', 'Nothing Phone (3)', 'Nothing Phone (4)', 'Nothing Phone (5)', 'Nothing Phone (6)', 'Nothing Phone (7)', 'Nothing Phone (8)', 'Nothing Phone (9)', 'Nothing Phone (10)'
    ] },
    { name: 'Dell', models: [
      'XPS 13 Plus', 'XPS 15', 'Inspiron 15', 'Inspiron 14', 'Latitude 7420', 'Latitude 5430', 'Vostro 3510', 'Alienware m15', 'G15 Gaming', 'Precision 5570', 'XPS 17', 'Inspiron 16', 'Latitude 7410', 'Latitude 5400', 'Latitude 5300', 'Latitude 7200', 'Latitude 7300', 'Latitude 7400', 'Latitude 7500', 'Latitude 7600', 'Latitude 7700', 'Latitude 7800', 'Latitude 7900', 'Latitude 8000', 'Latitude 8100', 'Latitude 8200', 'Latitude 8300', 'Latitude 8400', 'Latitude 8500', 'Latitude 8600'
    ] },
    { name: 'HP', models: [
      'Spectre x360', 'Pavilion 15', 'Envy 16', 'Envy 14', 'Omen 16', 'Victus 16', 'EliteBook 840', 'ProBook 450', 'ZBook Firefly', 'Chromebook x360', 'Pavilion x360', 'OMEN 17', 'EliteBook 830', 'EliteBook 850', 'EliteBook 860', 'EliteBook 870', 'EliteBook 880', 'EliteBook 890', 'EliteBook 900', 'EliteBook 910', 'EliteBook 920', 'EliteBook 930', 'EliteBook 940', 'EliteBook 950', 'EliteBook 960', 'EliteBook 970', 'EliteBook 980', 'EliteBook 990', 'EliteBook 1000'
    ] },
    { name: 'Lenovo', models: [
      'ThinkPad X1 Carbon', 'Yoga 9i', 'Legion 5', 'IdeaPad Slim 5', 'ThinkBook 14', 'Yoga Slim 7', 'IdeaPad Gaming 3', 'ThinkPad E14', 'Yoga 7i', 'IdeaPad 3', 'Legion 7', 'ThinkPad T14', 'ThinkPad X1 Extreme', 'ThinkPad X1 Yoga', 'ThinkPad X1 Tablet', 'ThinkPad X1 Nano', 'ThinkPad X1 Fold', 'ThinkPad X1 Titanium', 'ThinkPad X1 Carbon Gen 9', 'ThinkPad X1 Carbon Gen 10', 'ThinkPad X1 Carbon Gen 11', 'ThinkPad X1 Carbon Gen 12', 'ThinkPad X1 Carbon Gen 13', 'ThinkPad X1 Carbon Gen 14', 'ThinkPad X1 Carbon Gen 15', 'ThinkPad X1 Carbon Gen 16', 'ThinkPad X1 Carbon Gen 17', 'ThinkPad X1 Carbon Gen 18', 'ThinkPad X1 Carbon Gen 19', 'ThinkPad X1 Carbon Gen 20'
    ] },
    { name: 'Acer', models: [
      'Aspire 7', 'Swift 5', 'Nitro 5', 'Predator Helios 300', 'Spin 5', 'TravelMate P2', 'Extensa 15', 'Chromebook 314', 'Aspire 5', 'Swift 3', 'Predator Triton 500', 'Spin 3', 'Aspire 3', 'Aspire 1', 'Aspire E15', 'Aspire E5', 'Aspire R13', 'Aspire R14', 'Aspire R15', 'Aspire S13', 'Aspire S14', 'Aspire S15', 'Aspire S17', 'Aspire S18', 'Aspire S19', 'Aspire S20', 'Aspire S21', 'Aspire S22', 'Aspire S23', 'Aspire S24'
    ] },
    { name: 'MSI', models: [
      'MSI Stealth 16', 'MSI Modern 14', 'MSI GF63', 'MSI Katana 15', 'MSI Pulse GL66', 'MSI Prestige 14', 'MSI Summit E13', 'MSI Creator Z16', 'MSI Bravo 15', 'MSI Sword 15', 'MSI Raider GE76', 'MSI Vector GP66', 'MSI Alpha 15', 'MSI Alpha 17', 'MSI Alpha 19', 'MSI Alpha 21', 'MSI Alpha 23', 'MSI Alpha 25', 'MSI Alpha 27', 'MSI Alpha 29', 'MSI Alpha 31', 'MSI Alpha 33', 'MSI Alpha 35', 'MSI Alpha 37', 'MSI Alpha 39', 'MSI Alpha 41', 'MSI Alpha 43', 'MSI Alpha 45', 'MSI Alpha 47', 'MSI Alpha 49'
    ] },
  ];

  for (const brand of brands) {
    // Only seed phones if the brand has phone models
    if (brand.phones && brand.phones.length > 0) {
      for (const model of brand.phones) {
        const existing = await databases.listDocuments(
          DATABASE_ID,
          'devices',
          [
            Query.equal('brand', brand.name),
            Query.equal('model', model),
            Query.equal('category', 'phone')
          ]
        );
        if (existing.documents.length === 0) {
          await databases.createDocument(
            DATABASE_ID,
            'devices',
            ID.unique(),
            {
              brand: brand.name,
              model,
              category: 'phone',
              specifications: JSON.stringify({ ram: '8GB', storage: '128GB' }),
              common_issues: JSON.stringify([
                { id: 'screen', name: 'Screen Replacement', description: 'Broken or cracked screen', complexity: 2, estimated_duration: 60, requires_parts: true },
                { id: 'battery', name: 'Battery Replacement', description: 'Battery draining fast', complexity: 1, estimated_duration: 45, requires_parts: true }
              ])
            }
          );
        }
      }
    }
    // Only seed laptops if the brand has laptop models
    if (brand.laptops && brand.laptops.length > 0) {
      for (const model of brand.laptops) {
        const existing = await databases.listDocuments(
          DATABASE_ID,
          'devices',
          [
            Query.equal('brand', brand.name),
            Query.equal('model', model),
            Query.equal('category', 'laptop')
          ]
        );
        if (existing.documents.length === 0) {
          await databases.createDocument(
            DATABASE_ID,
            'devices',
            ID.unique(),
            {
              brand: brand.name,
              model,
              category: 'laptop',
              specifications: JSON.stringify({ ram: '16GB', storage: '512GB SSD' }),
              common_issues: JSON.stringify([
                { id: 'keyboard', name: 'Keyboard Replacement', description: 'Keys not working', complexity: 2, estimated_duration: 90, requires_parts: true },
                { id: 'battery', name: 'Battery Replacement', description: 'Battery not charging', complexity: 1, estimated_duration: 60, requires_parts: true }
              ])
            }
          );
        }
      }
    }
  }
}

async function seedServicesOffered() {
  const sampleServices = [
    {
      providerId: 'prov_abc123',
      deviceType: 'Phone',
      brand: 'Apple',
      model: 'iPhone 13',
      issue: 'Screen Replacement',
      partType: 'OEM',
      price: 6500,
      warranty: '6 months',
      created_at: '2025-07-15T14:35:00Z',
    },
    {
      providerId: 'prov_abc123',
      deviceType: 'Phone',
      brand: 'Samsung',
      model: null,
      issue: 'Battery Replacement',
      partType: null,
      price: 1200,
      warranty: null,
      created_at: '2025-07-15T14:40:00Z',
    },
    {
      providerId: 'prov_xyz789',
      deviceType: 'Laptop',
      brand: 'Dell',
      model: 'XPS 13 Plus',
      issue: 'Keyboard',
      partType: null,
      price: 2500,
      warranty: '3 months',
      created_at: '2025-07-16T10:00:00Z',
    },
  ];
  for (const service of sampleServices) {
    try {
      await databases.createDocument(
        DATABASE_ID,
        'services_offered',
        ID.unique(),
        service
      );
      console.log(`✓ Seeded service: ${service.brand} ${service.model || ''} ${service.issue}`);
    } catch (error) {
      console.error('✗ Error seeding service:', service, error);
    }
  }
}

// Call the function in a .then() chain for CommonJS compatibility
seedAllBrandsAndModels().then(() => {
  console.log('All brands and models seeded!');
}).catch(console.error);

(async () => {
  await seedServicesOffered();
})();