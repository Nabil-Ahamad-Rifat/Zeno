import 'dotenv/config'
import dns from 'dns'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

dns.setServers(['8.8.8.8', '8.8.4.4'])
import User from '../src/models/User.js'
import Shop from '../src/models/Shop.js'
import Product from '../src/models/Product.js'
import Customer from '../src/models/Customer.js'

const hash = (pwd) => bcrypt.hash(pwd, 12)

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('Connected to MongoDB\n')

  // ── 1. Admin ────────────────────────────────────────────────────────────────
  let admin = await User.findOne({ role: 'admin' })
  if (admin) {
    await User.findByIdAndUpdate(admin._id, { passwordHash: await hash('admin') })
    console.log('✓ Admin already exists — password reset to: admin')
    console.log('  Email:', admin.email)
  } else {
    admin = await User.create({
      name: 'Admin',
      email: 'admin@zeno.com',
      passwordHash: await hash('admin'),
      role: 'admin',
      status: 'active',
      emailVerified: true,
    })
    console.log('✓ Admin created')
    console.log('  Email:    admin@zeno.com')
    console.log('  Password: admin')
  }

  // ── 2. Demo Shopkeeper + Shop ────────────────────────────────────────────────
  let shopkeeper = await User.findOne({ email: 'shopkeeper@zeno.com' })
  let shop = shopkeeper?.shopId ? await Shop.findById(shopkeeper.shopId) : null

  if (!shop) {
    // Create shopkeeper first with a placeholder ownerId, then fix it
    if (!shopkeeper) {
      shopkeeper = await User.create({
        name: 'Demo Shopkeeper',
        email: 'shopkeeper@zeno.com',
        passwordHash: await hash('admin'),
        role: 'shopkeeper',
        status: 'active',
        emailVerified: true,
      })
    }

    shop = await Shop.create({
      name: 'ZENO Demo Shop',
      ownerId: shopkeeper._id,
      address: 'Dhaka, Bangladesh',
      phone: '01700000000',
      status: 'active',
    })

    await User.findByIdAndUpdate(shopkeeper._id, { shopId: shop._id })
    console.log('✓ Demo shop created:', shop.name)
    console.log('✓ Shopkeeper created')
    console.log('  Email:    shopkeeper@zeno.com')
    console.log('  Password: admin')
  } else {
    await User.findByIdAndUpdate(shopkeeper._id, { passwordHash: await hash('admin') })
    console.log('✓ Demo shop already exists:', shop.name)
    console.log('  Shopkeeper password reset to: admin')
  }

  // ── 3. Products ──────────────────────────────────────────────────────────────
  const productCount = await Product.countDocuments({ shopId: shop._id })
  if (productCount === 0) {
    await Product.insertMany([
      { shopId: shop._id, name: 'Rice (1kg)',        category: 'Groceries',     unit: 'kg',  price: 65,  costPrice: 50,  stockQty: 200, minStock: 30 },
      { shopId: shop._id, name: 'Cooking Oil (1L)',  category: 'Groceries',     unit: 'ltr', price: 175, costPrice: 140, stockQty: 80,  minStock: 20 },
      { shopId: shop._id, name: 'Sugar (1kg)',       category: 'Groceries',     unit: 'kg',  price: 120, costPrice: 95,  stockQty: 100, minStock: 20 },
      { shopId: shop._id, name: 'Milk (1L)',         category: 'Dairy',         unit: 'ltr', price: 75,  costPrice: 58,  stockQty: 50,  minStock: 15 },
      { shopId: shop._id, name: 'Bread',             category: 'Bakery',        unit: 'pcs', price: 45,  costPrice: 32,  stockQty: 25,  minStock: 5  },
      { shopId: shop._id, name: 'Biscuit Pack',      category: 'Snacks',        unit: 'pcs', price: 30,  costPrice: 22,  stockQty: 120, minStock: 30 },
      { shopId: shop._id, name: 'Tea (250g)',        category: 'Beverages',     unit: 'pcs', price: 180, costPrice: 140, stockQty: 40,  minStock: 10 },
      { shopId: shop._id, name: 'Shampoo (200ml)',   category: 'Personal Care', unit: 'pcs', price: 220, costPrice: 170, stockQty: 8,   minStock: 10 },
      { shopId: shop._id, name: 'Soap (100g)',       category: 'Personal Care', unit: 'pcs', price: 40,  costPrice: 28,  stockQty: 60,  minStock: 20 },
      { shopId: shop._id, name: 'Noodles (75g)',     category: 'Snacks',        unit: 'pcs', price: 20,  costPrice: 14,  stockQty: 150, minStock: 50 },
    ])
    console.log('✓ 10 sample products seeded (1 low-stock)')
  } else {
    console.log(`✓ Products already exist (${productCount} products) — skipped`)
  }

  // ── 4. Customers ─────────────────────────────────────────────────────────────
  const customerCount = await Customer.countDocuments()
  if (customerCount === 0) {
    await Customer.insertMany([
      { name: 'Rahim Uddin',    phone: '01711111111', email: 'rahim@example.com',  tag: 'regular' },
      { name: 'Karim Mia',      phone: '01722222222',                               tag: 'new'     },
      { name: 'Fatema Begum',   phone: '01733333333', email: 'fatema@example.com', tag: 'vip'     },
      { name: 'Jamal Hossain',  phone: '01744444444',                               tag: 'new'     },
      { name: 'Nasrin Akter',   phone: '01755555555', email: 'nasrin@example.com', tag: 'regular' },
    ])
    console.log('✓ 5 sample customers seeded')
  } else {
    console.log(`✓ Customers already exist (${customerCount} customers) — skipped`)
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════')
  console.log('  Seed complete!')
  console.log('════════════════════════════════')
  console.log('  Admin login')
  console.log('  Email:    admin@zeno.com')
  console.log('  Password: admin')
  console.log('────────────────────────────────')
  console.log('  Shopkeeper login')
  console.log('  Email:    shopkeeper@zeno.com')
  console.log('  Password: admin')
  console.log('════════════════════════════════\n')

  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
