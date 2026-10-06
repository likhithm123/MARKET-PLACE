const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Murgdur database...')

  const men = await prisma.category.upsert({ where: { slug: 'men' }, update: {}, create: { name: 'Men', slug: 'men', sortOrder: 1 } })
  const women = await prisma.category.upsert({ where: { slug: 'women' }, update: {}, create: { name: 'Women', slug: 'women', sortOrder: 2 } })
  const bags = await prisma.category.upsert({ where: { slug: 'bags' }, update: {}, create: { name: 'Bags', slug: 'bags', sortOrder: 3 } })
  const collections = await prisma.category.upsert({ where: { slug: 'collections' }, update: {}, create: { name: 'Collections', slug: 'collections', sortOrder: 5 } })
  await prisma.category.upsert({ where: { slug: 'new-arrivals' }, update: {}, create: { name: 'New Arrivals', slug: 'new-arrivals', sortOrder: 0 } })
  await prisma.category.upsert({ where: { slug: 'mens-ready-to-wear' }, update: {}, create: { name: 'Ready to Wear', slug: 'mens-ready-to-wear', parentId: men.id, sortOrder: 1 } })
  await prisma.category.upsert({ where: { slug: 'mens-accessories' }, update: {}, create: { name: 'Accessories', slug: 'mens-accessories', parentId: men.id, sortOrder: 2 } })
  await prisma.category.upsert({ where: { slug: 'mens-shoes' }, update: {}, create: { name: 'Shoes', slug: 'mens-shoes', parentId: men.id, sortOrder: 3 } })
  await prisma.category.upsert({ where: { slug: 'womens-ready-to-wear' }, update: {}, create: { name: 'Ready to Wear', slug: 'womens-ready-to-wear', parentId: women.id, sortOrder: 1 } })
  await prisma.category.upsert({ where: { slug: 'womens-accessories' }, update: {}, create: { name: 'Accessories', slug: 'womens-accessories', parentId: women.id, sortOrder: 2 } })
  await prisma.category.upsert({ where: { slug: 'womens-shoes' }, update: {}, create: { name: 'Shoes', slug: 'womens-shoes', parentId: women.id, sortOrder: 3 } })
  await prisma.category.upsert({ where: { slug: 'handbags' }, update: {}, create: { name: 'Handbags', slug: 'handbags', parentId: bags.id, sortOrder: 1 } })
  await prisma.category.upsert({ where: { slug: 'travel-bags' }, update: {}, create: { name: 'Travel', slug: 'travel-bags', parentId: bags.id, sortOrder: 2 } })
  await prisma.category.upsert({ where: { slug: 'small-leather-goods' }, update: {}, create: { name: 'Small Leather Goods', slug: 'small-leather-goods', parentId: bags.id, sortOrder: 3 } })
  await prisma.category.upsert({ where: { slug: 'summer-2025' }, update: {}, create: { name: 'Summer 2025', slug: 'summer-2025', parentId: collections.id, sortOrder: 1 } })
  await prisma.category.upsert({ where: { slug: 'noir-series' }, update: {}, create: { name: 'Noir Series', slug: 'noir-series', parentId: collections.id, sortOrder: 2 } })
  await prisma.category.upsert({ where: { slug: 'limited-edition' }, update: {}, create: { name: 'Limited Edition', slug: 'limited-edition', parentId: collections.id, sortOrder: 3 } })

  console.log('✅ Categories seeded')

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@murgdur.com'
  const rawPassword = process.env.ADMIN_PASSWORD
  if (!rawPassword) throw new Error('ADMIN_PASSWORD environment variable is required for seeding')
  const adminPassword = await bcrypt.hash(rawPassword, 12)
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash: adminPassword, firstName: 'Murgdur', lastName: 'Admin', customerId: 'MRG-00000001', role: 'ADMIN', emailVerified: true }
  })

  console.log(`✅ Admin user: ${adminEmail}`)
  console.log('🎉 Database seeded successfully')
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
