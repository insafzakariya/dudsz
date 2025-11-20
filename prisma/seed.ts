import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create Site Config
  const siteConfig = await prisma.siteConfig.upsert({
    where: { id: 'site_config' },
    update: {},
    create: {
      id: 'site_config',
      siteName: 'DUDSZ.lk',
      primaryColor: '#2596be',
      secondaryColor: '#0b1120',
      accentColor: '#ffffff',
      buttonColor: '#2596be',
      textColor: '#000000',
      baseShippingRate: 300,
      discountEnabled: false,
      discountPercent: 0,
      contactEmail: 'info@dudsz.lk',
      whatsappNumber: '+94771234567',
    },
  });
  console.log('✓ Site config created');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@dudsz.lk' },
    update: {},
    create: {
      email: 'admin@dudsz.lk',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✓ Super Admin created (email: admin@dudsz.lk, password: admin123)');

  // Seed Sri Lankan Cities
  const cities = [
    { name: 'Colombo', district: 'Colombo', shippingCost: 300 },
    { name: 'Dehiwala-Mount Lavinia', district: 'Colombo', shippingCost: 300 },
    { name: 'Moratuwa', district: 'Colombo', shippingCost: 350 },
    { name: 'Negombo', district: 'Gampaha', shippingCost: 350 },
    { name: 'Gampaha', district: 'Gampaha', shippingCost: 400 },
    { name: 'Kandy', district: 'Kandy', shippingCost: 450 },
    { name: 'Galle', district: 'Galle', shippingCost: 500 },
    { name: 'Matara', district: 'Matara', shippingCost: 550 },
    { name: 'Jaffna', district: 'Jaffna', shippingCost: 600 },
    { name: 'Trincomalee', district: 'Trincomalee', shippingCost: 600 },
    { name: 'Batticaloa', district: 'Batticaloa', shippingCost: 600 },
    { name: 'Anuradhapura', district: 'Anuradhapura', shippingCost: 550 },
    { name: 'Polonnaruwa', district: 'Polonnaruwa', shippingCost: 550 },
    { name: 'Ratnapura', district: 'Ratnapura', shippingCost: 500 },
    { name: 'Badulla', district: 'Badulla', shippingCost: 550 },
    { name: 'Kurunegala', district: 'Kurunegala', shippingCost: 450 },
    { name: 'Kalutara', district: 'Kalutara', shippingCost: 400 },
    { name: 'Kegalle', district: 'Kegalle', shippingCost: 450 },
    { name: 'Nuwara Eliya', district: 'Nuwara Eliya', shippingCost: 500 },
    { name: 'Ampara', district: 'Ampara', shippingCost: 600 },
  ];

  for (const city of cities) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: {},
      create: city,
    });
  }
  console.log(`✓ ${cities.length} cities seeded`);

  // Seed Cancellation Reasons
  const cancellationReasons = [
    { reason: 'Customer requested cancellation', displayOrder: 1 },
    { reason: 'Product out of stock', displayOrder: 2 },
    { reason: 'Delivery address issues', displayOrder: 3 },
    { reason: 'Payment failed', displayOrder: 4 },
    { reason: 'Duplicate order', displayOrder: 5 },
    { reason: 'Customer not reachable', displayOrder: 6 },
    { reason: 'Pricing error', displayOrder: 7 },
    { reason: 'Shipping delay', displayOrder: 8 },
    { reason: 'Customer changed mind', displayOrder: 9 },
    { reason: 'Wrong item ordered', displayOrder: 10 },
    { reason: 'Fraudulent order', displayOrder: 11 },
    { reason: 'Other', displayOrder: 12 },
  ];

  for (const cancellationReason of cancellationReasons) {
    await prisma.cancellationReason.upsert({
      where: { reason: cancellationReason.reason },
      update: {},
      create: cancellationReason,
    });
  }
  console.log(`✓ ${cancellationReasons.length} cancellation reasons seeded`);

  // Create Categories
  const shortSleeveCategory = await prisma.category.upsert({
    where: { slug: 'short-sleeve' },
    update: {},
    create: {
      name: 'Short Sleeve T-Shirts',
      sleeveType: 'SHORT_SLEEVE',
      slug: 'short-sleeve',
      description: 'Comfortable short sleeve t-shirts for everyday wear',
    },
  });

  const longSleeveCategory = await prisma.category.upsert({
    where: { slug: 'long-sleeve' },
    update: {},
    create: {
      name: 'Long Sleeve T-Shirts',
      sleeveType: 'LONG_SLEEVE',
      slug: 'long-sleeve',
      description: 'Stylish long sleeve t-shirts for a sleek look',
    },
  });
  console.log('✓ Categories created');

  // Create Sample Products
  const products = [
    {
      code: '1001',
      name: 'Classic White Tee',
      description: 'Premium cotton white t-shirt',
      price: 800,
      stock: 50,
      weight: 200,
      images: ['/images/products/white-tee.jpg'],
      enabled: true,
      featured: true,
      categoryId: shortSleeveCategory.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['White', 'Black', 'Navy'],
    },
    {
      code: '1002',
      name: 'Black Essential Tee',
      description: 'Versatile black t-shirt for any occasion',
      price: 800,
      stock: 50,
      weight: 200,
      images: ['/images/products/black-tee.jpg'],
      enabled: true,
      featured: true,
      categoryId: shortSleeveCategory.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'White', 'Gray'],
    },
    {
      code: '1003',
      name: 'Navy Blue Tee',
      description: 'Classic navy blue cotton t-shirt',
      price: 850,
      stock: 40,
      weight: 200,
      images: ['/images/products/navy-tee.jpg'],
      enabled: true,
      featured: false,
      categoryId: shortSleeveCategory.id,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Navy', 'Royal Blue', 'Sky Blue'],
    },
    {
      code: '2001',
      name: 'Long Sleeve Gray Tee',
      description: 'Comfortable long sleeve gray t-shirt',
      price: 1200,
      stock: 30,
      weight: 250,
      images: ['/images/products/long-gray-tee.jpg'],
      enabled: true,
      featured: true,
      categoryId: longSleeveCategory.id,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Gray', 'Charcoal', 'Light Gray'],
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { code: product.code },
      update: {},
      create: product,
    });
  }
  console.log(`✓ ${products.length} sample products created`);

  // Create Variant Types and Options
  const sizeVariant = await prisma.variantType.upsert({
    where: { name: 'Size' },
    update: {},
    create: {
      name: 'Size',
      enabled: true,
    },
  });

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  for (const size of sizes) {
    await prisma.variantOption.upsert({
      where: {
        variantTypeId_name: {
          variantTypeId: sizeVariant.id,
          name: size,
        },
      },
      update: {},
      create: {
        name: size,
        variantTypeId: sizeVariant.id,
        enabled: true,
      },
    });
  }
  console.log('✓ Size variant type and options created');

  // Create Sample Offer
  const offer = await prisma.offer.upsert({
    where: { slug: 'buy-4-for-2000' },
    update: {},
    create: {
      name: 'Buy 4 T-Shirts for Rs. 2000',
      slug: 'buy-4-for-2000',
      description: 'Special bundle offer - Get 4 t-shirts for just Rs. 2000!',
      logic: 'Buy 4 for 2000',
      quantity: 4,
      price: 2000,
      enabled: true,
      featured: true,
    },
  });
  console.log('✓ Sample offer created');

  // Link products to offer
  const shortSleeveProducts = await prisma.product.findMany({
    where: { categoryId: shortSleeveCategory.id },
  });

  for (const product of shortSleeveProducts) {
    await prisma.offerProduct.upsert({
      where: {
        offerId_productId: {
          offerId: offer.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        offerId: offer.id,
        productId: product.id,
      },
    });
  }
  console.log('✓ Products linked to offer');

  console.log('\n✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
