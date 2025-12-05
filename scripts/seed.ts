/**
 * Seed script to populate database with demo data
 * Usage: npm run seed (or ts-node scripts/seed.ts)
 */

import sqlite3 from "sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

sqlite3.verbose();

const dbPath = path.join(__dirname, "..", "crm.db");
const db = new sqlite3.Database(dbPath);

const passwordHash = bcrypt.hashSync("password123", 10);

// Helper to run SQL and return promise
function runSQL(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Helper to get last inserted ID
function getLastId(): Promise<number> {
  return new Promise((resolve, reject) => {
    db.get("SELECT last_insert_rowid() as id", [], (err, row: any) => {
      if (err) reject(err);
      else resolve(row.id);
    });
  });
}

async function seed() {
  console.log("🌱 Starting database seeding...\n");

  try {
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("Clearing existing data...");
    await runSQL("DELETE FROM transactions");
    await runSQL("DELETE FROM complaints");
    await runSQL("DELETE FROM order_items");
    await runSQL("DELETE FROM orders");
    await runSQL("DELETE FROM products");
    await runSQL("DELETE FROM customers");
    await runSQL("DELETE FROM retailers");
    await runSQL("DELETE FROM users WHERE email != 'admin@example.com'"); // Keep default admin

    console.log("✓ Existing data cleared\n");

    // Create users
    console.log("Creating users...");
    const users = [
      { name: "Admin User", email: "admin@example.com", role: "ADMIN", retailer_id: null },
      { name: "Staff Member", email: "staff@example.com", role: "STAFF", retailer_id: null },
      { name: "John Manager", email: "staff2@example.com", role: "STAFF", retailer_id: null },
    ];

    // Create retailers first (needed for retailer users)
    console.log("Creating retailers...");
    const retailers = [
      { name: "Kigali Central Store", contact_name: "Alice Retail", phone: "+250788123456", email: "kigali@retailer.com", address: "KN 4 Ave, Kigali" },
      { name: "Musanze Retail Outlet", contact_name: "Bob Sales", phone: "+250788234567", email: "musanze@retailer.com", address: "Main Street, Musanze" },
      { name: "Gisenyi Shop", contact_name: "Charlie Owner", phone: "+250788345678", email: "gisenyi@retailer.com", address: "Lake Road, Gisenyi" },
      { name: "Butare Market", contact_name: "Diana Manager", phone: "+250788456789", email: "butare@retailer.com", address: "University Road, Butare" },
    ];

    const retailerIds: number[] = [];
    for (const retailer of retailers) {
      await runSQL(
        "INSERT INTO retailers (name, contact_name, phone, email, address) VALUES (?, ?, ?, ?, ?)",
        [retailer.name, retailer.contact_name, retailer.phone, retailer.email, retailer.address]
      );
      const id = await getLastId();
      retailerIds.push(id);
      console.log(`  ✓ Created retailer: ${retailer.name} (ID: ${id})`);
    }

    // Add retailer users
    for (let i = 0; i < retailerIds.length; i++) {
      const retailerId = retailerIds[i];
      const retailerName = retailers[i].name.split(" ")[0]; // Use first word of retailer name
      await runSQL(
        "INSERT INTO users (name, email, password_hash, role, retailer_id) VALUES (?, ?, ?, ?, ?)",
        [`${retailerName} User`, `retailer${i + 1}@example.com`, passwordHash, "RETAILER", retailerId]
      );
      const userId = await getLastId();
      users.push({
        name: `${retailerName} User`,
        email: `retailer${i + 1}@example.com`,
        role: "RETAILER",
        retailer_id: retailerId,
      });
      console.log(`  ✓ Created retailer user: retailer${i + 1}@example.com (Retailer ID: ${retailerId})`);
    }

    // Create admin and staff users (if they don't exist)
    for (const user of users.slice(0, 3)) {
      await runSQL(
        "INSERT OR IGNORE INTO users (name, email, password_hash, role, retailer_id) VALUES (?, ?, ?, ?, ?)",
        [user.name, user.email, passwordHash, user.role, user.retailer_id]
      );
      console.log(`  ✓ Created user: ${user.email} (${user.role})`);
    }
    console.log();

    // Create customers
    console.log("Creating customers...");
    const customers = [
      { name: "Rwanda Business Corp", phone: "+250788111111", email: "contact@rwandabiz.com", address: "KG 7 Ave, Kigali" },
      { name: "Mountain View Hotel", phone: "+250788222222", email: "manager@mountainview.rw", address: "Volcanoes National Park Road" },
      { name: "Lake Kivu Resort", phone: "+250788333333", email: "info@lakekivu.com", address: "Lake Kivu, Karongi" },
      { name: "City Center Restaurant", phone: "+250788444444", email: "orders@citycenter.rw", address: "KN 5 St, Kigali" },
      { name: "Green Valley Farms", phone: "+250788555555", email: "sales@greenvalley.rw", address: "Rubavu District" },
    ];

    const customerIds: number[] = [];
    for (const customer of customers) {
      await runSQL(
        "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
        [customer.name, customer.phone, customer.email, customer.address]
      );
      const id = await getLastId();
      customerIds.push(id);
      console.log(`  ✓ Created customer: ${customer.name}`);
    }
    console.log();

    // Create products (some with low stock for demo)
    console.log("Creating products...");
    const products = [
      { name: "Premium Coffee Beans (1kg)", sku: "COFFEE-1KG", unit_price: 8500, stock_quantity: 5 }, // Low stock
      { name: "Tea Leaves (500g)", sku: "TEA-500G", unit_price: 3500, stock_quantity: 25 },
      { name: "Honey (250ml)", sku: "HONEY-250", unit_price: 4500, stock_quantity: 0 }, // Out of stock
      { name: "Maize Flour (5kg)", sku: "MAIZE-5KG", unit_price: 3200, stock_quantity: 50 },
      { name: "Rice (10kg)", sku: "RICE-10KG", unit_price: 8500, stock_quantity: 30 },
      { name: "Beans (2kg)", sku: "BEANS-2KG", unit_price: 2800, stock_quantity: 8 }, // Low stock
      { name: "Sugar (1kg)", sku: "SUGAR-1KG", unit_price: 1500, stock_quantity: 40 },
      { name: "Cooking Oil (1L)", sku: "OIL-1L", unit_price: 2500, stock_quantity: 15 },
      { name: "Salt (500g)", sku: "SALT-500G", unit_price: 800, stock_quantity: 60 },
      { name: "Tomatoes (1kg)", sku: "TOMATO-1KG", unit_price: 2000, stock_quantity: 12 }, // Low stock
    ];

    const productIds: number[] = [];
    for (const product of products) {
      await runSQL(
        "INSERT INTO products (name, sku, unit_price, stock_quantity) VALUES (?, ?, ?, ?)",
        [product.name, product.sku, product.unit_price, product.stock_quantity]
      );
      const id = await getLastId();
      productIds.push(id);
      console.log(`  ✓ Created product: ${product.name} (Stock: ${product.stock_quantity})`);
    }
    console.log();

    // Create orders with various statuses
    console.log("Creating orders...");
    const orders = [
      { retailer_id: retailerIds[0], status: "DELIVERED", items: [{ product_id: productIds[0], quantity: 10, unit_price: products[0].unit_price }] },
      { retailer_id: retailerIds[0], status: "SHIPPED", items: [{ product_id: productIds[1], quantity: 5, unit_price: products[1].unit_price }] },
      { retailer_id: retailerIds[1], status: "PENDING", items: [{ product_id: productIds[2], quantity: 3, unit_price: products[2].unit_price }] },
      { retailer_id: retailerIds[1], status: "APPROVED", items: [{ product_id: productIds[3], quantity: 20, unit_price: products[3].unit_price }] },
      { retailer_id: retailerIds[2], status: "DELIVERED", items: [{ product_id: productIds[4], quantity: 15, unit_price: products[4].unit_price }] },
      { retailer_id: retailerIds[2], status: "PENDING", items: [{ product_id: productIds[5], quantity: 8, unit_price: products[5].unit_price }] },
    ];

    const orderIds: number[] = [];
    for (const order of orders) {
      const totalAmount = order.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      await runSQL(
        "INSERT INTO orders (retailer_id, status, total_amount) VALUES (?, ?, ?)",
        [order.retailer_id, order.status, totalAmount]
      );
      const orderId = await getLastId();
      orderIds.push(orderId);

      // Create order items
      for (const item of order.items) {
        await runSQL(
          "INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)",
          [orderId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }
      console.log(`  ✓ Created order #${orderId} (${order.status}): ${totalAmount.toLocaleString()} RWF`);
    }
    console.log();

    // Create transactions for delivered orders
    console.log("Creating transactions...");
    const deliveredOrders = orders.filter((o, idx) => o.status === "DELIVERED");
    for (const [idx, order] of deliveredOrders.entries()) {
      const orderId = orderIds[orders.indexOf(order)];
      const totalAmount = order.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      await runSQL(
        "INSERT INTO transactions (order_id, retailer_id, amount, type) VALUES (?, ?, ?, ?)",
        [orderId, order.retailer_id, totalAmount, "SALE"]
      );
      console.log(`  ✓ Created transaction for order #${orderId}: ${totalAmount.toLocaleString()} RWF`);
    }

    // Create some standalone transactions
    await runSQL(
      "INSERT INTO transactions (retailer_id, customer_id, amount, type) VALUES (?, ?, ?, ?)",
      [retailerIds[0], customerIds[0], 50000, "SALE"]
    );
    await runSQL(
      "INSERT INTO transactions (retailer_id, customer_id, amount, type) VALUES (?, ?, ?, ?)",
      [retailerIds[1], customerIds[1], 75000, "SALE"]
    );
    console.log(`  ✓ Created additional transactions`);
    console.log();

    // Create complaints (some old for demo)
    console.log("Creating complaints...");
    const complaints = [
      {
        retailer_id: retailerIds[0],
        customer_id: customerIds[0],
        subject: "Delayed delivery",
        description: "Order was supposed to arrive last week but still waiting",
        status: "OPEN",
        hoursAgo: 48, // 48 hours ago
      },
      {
        retailer_id: retailerIds[1],
        customer_id: customerIds[1],
        subject: "Wrong product received",
        description: "Received tea instead of coffee",
        status: "IN_PROGRESS",
        hoursAgo: 36,
      },
      {
        retailer_id: retailerIds[2],
        customer_id: customerIds[2],
        subject: "Product quality issue",
        description: "Honey jar was leaking",
        status: "OPEN",
        hoursAgo: 72, // Long pending
      },
      {
        retailer_id: retailerIds[0],
        customer_id: null,
        subject: "Stock availability",
        description: "Need to know when coffee beans will be back in stock",
        status: "OPEN",
        hoursAgo: 12,
      },
    ];

    for (const complaint of complaints) {
      const createdAt = new Date(Date.now() - complaint.hoursAgo * 60 * 60 * 1000).toISOString();
      await runSQL(
        "INSERT INTO complaints (retailer_id, customer_id, subject, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [complaint.retailer_id, complaint.customer_id, complaint.subject, complaint.description, complaint.status, createdAt]
      );
      const complaintId = await getLastId();
      console.log(`  ✓ Created complaint #${complaintId}: ${complaint.subject} (${complaint.hoursAgo}h ago, ${complaint.status})`);
    }
    console.log();

    console.log("✅ Database seeding completed successfully!\n");
    console.log("📋 Demo Login Credentials:");
    console.log("   Admin:    admin@example.com / password123");
    console.log("   Staff:    staff@example.com / password123");
    console.log("   Retailer: retailer1@example.com / password123 (linked to Kigali Central Store)");
    console.log("   Retailer: retailer2@example.com / password123 (linked to Musanze Retail Outlet)");
    console.log("   Retailer: retailer3@example.com / password123 (linked to Gisenyi Shop)");
    console.log("   Retailer: retailer4@example.com / password123 (linked to Butare Market)\n");
  } catch (error: any) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

seed();

