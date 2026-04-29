import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('Seeding database...');
    // Clear existing data
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.banner.deleteMany();
    await prisma.promoCode.deleteMany();
    await prisma.user.deleteMany();

    // Seed Categories
    const categories = [
      { name: 'Завтраки', slug: 'breakfast', sortOrder: 1, image: 'https://cdn-icons-png.flaticon.com/512/887/887359.png' },
      { name: 'Бургеры', slug: 'burgers', sortOrder: 2, image: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
      { name: 'Пицца', slug: 'pizza', sortOrder: 3, image: 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png' },
      { name: 'Роллы', slug: 'rolls', sortOrder: 4, image: 'https://cdn-icons-png.flaticon.com/512/2252/2252438.png' },
      { name: 'Суши', slug: 'sushi', sortOrder: 5, image: 'https://cdn-icons-png.flaticon.com/512/2252/2252438.png' },
      { name: 'Напитки', slug: 'drinks', sortOrder: 6, image: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png' },
      { name: 'Десерты', slug: 'desserts', sortOrder: 7, image: 'https://cdn-icons-png.flaticon.com/512/992/992717.png' },
      { name: 'Комбо', slug: 'combo', sortOrder: 8, image: 'https://cdn-icons-png.flaticon.com/512/2713/2713931.png' },
    ];

    for (const cat of categories) {
      await prisma.category.create({ data: cat });
    }

    const createdCategories = await prisma.category.findMany();
    const burgersCat = createdCategories.find(c => c.slug === 'burgers');
    const pizzaCat = createdCategories.find(c => c.slug === 'pizza');
    const rollsCat = createdCategories.find(c => c.slug === 'rolls');
    const drinksCat = createdCategories.find(c => c.slug === 'drinks');

    // Seed Products
    const products = [
      {
        name: 'Ростовский Бургер',
        slug: 'rostov-burger',
        description: 'Сочная котлета из донской говядины, свежие томаты, маринованный лук и секретный соус.',
        price: 450,
        oldPrice: 550,
        categoryId: burgersCat!.id,
        images: ['https://picsum.photos/seed/burger1/800/800'],
        weight: '350г',
        kcal: 850,
        proteins: 35,
        fats: 45,
        carbs: 65,
        tags: ['мясо', 'сытно'],
        isPopular: true,
        isNew: false,
        isAvailable: true,
        sortOrder: 1
      },
      {
        name: 'Чизбургер Классик',
        slug: 'cheeseburger',
        description: 'Классический чизбургер с двойным сыром чеддер.',
        price: 320,
        categoryId: burgersCat!.id,
        images: ['https://picsum.photos/seed/burger2/800/800'],
        weight: '280г',
        kcal: 620,
        proteins: 28,
        fats: 35,
        carbs: 45,
        tags: ['сыр'],
        isPopular: false,
        isNew: true,
        isAvailable: true,
        sortOrder: 2
      },
      {
        name: 'Пицца Маргарита',
        slug: 'margarita',
        description: 'Традиционная итальянская пицца с томатами и моцареллой.',
        price: 590,
        categoryId: pizzaCat!.id,
        images: ['https://picsum.photos/seed/pizza1/800/800'],
        weight: '550г',
        kcal: 1200,
        proteins: 45,
        fats: 50,
        carbs: 140,
        tags: ['вегетарианское'],
        isPopular: true,
        isNew: false,
        isAvailable: true,
        sortOrder: 1
      },
      {
        name: 'Филадельфия Лайт',
        slug: 'philadelphia-light',
        description: 'Нежный лосось, сливочный сыр и свежий огурец.',
        price: 480,
        categoryId: rollsCat!.id,
        images: ['https://picsum.photos/seed/rolls1/800/800'],
        weight: '220г',
        kcal: 450,
        proteins: 18,
        fats: 22,
        carbs: 45,
        tags: ['рыба', 'хит'],
        isPopular: true,
        isNew: false,
        isAvailable: true,
        sortOrder: 1
      },
      {
        name: 'Морс Домашний',
        slug: 'mors',
        description: 'Освежающий морс из донских ягод.',
        price: 150,
        categoryId: drinksCat!.id,
        images: ['https://picsum.photos/seed/drink1/800/800'],
        weight: '500мл',
        kcal: 120,
        proteins: 0,
        fats: 0,
        carbs: 30,
        tags: ['натуральное'],
        isPopular: false,
        isNew: false,
        isAvailable: true,
        sortOrder: 1
      }
    ];

    for (const prod of products) {
      await prisma.product.create({ data: prod });
    }

    // Seed Banners
    const banners = [
      {
        title: 'Скидка 20% на первый заказ',
        subtitle: 'Используйте промокод ROSTOV20',
        image: 'https://picsum.photos/seed/banner1/1200/600',
        isActive: true,
        sortOrder: 1
      },
      {
        title: 'Бесплатная доставка от 1500₽',
        subtitle: 'По всему Ростову-на-Дону',
        image: 'https://picsum.photos/seed/banner2/1200/600',
        isActive: true,
        sortOrder: 2
      }
    ];

    for (const banner of banners) {
      await prisma.banner.create({ data: banner });
    }

    await prisma.promoCode.create({
      data: {
        code: 'ROSTOV20',
        discountType: 'percent',
        value: 20,
        minOrderAmount: 0,
        isActive: true,
      },
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
