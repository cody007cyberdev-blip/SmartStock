import { db } from "./client";
import { products, categories, suppliers } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Add categories
  const catData = [
    { id: "cat-1", name: "Eletrônicos", description: "Dispositivos eletrônicos" },
    { id: "cat-2", name: "Móveis", description: "Móveis de escritório" },
  ];

  for (const cat of catData) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }

  // Add suppliers
  const supData = [
    { id: "sup-1", name: "Tech Supply Co", contactName: "John Doe", email: "john@techsupply.com" },
    { id: "sup-2", name: "Office Comfort", contactName: "Jane Smith", email: "jane@officecomfort.com" },
  ];

  for (const sup of supData) {
    await db.insert(suppliers).values(sup).onConflictDoNothing();
  }

  // Add products
  const prodData = [
    {
      id: "prod-1",
      sku: "LAP-XPS-13",
      name: "Dell XPS 13",
      description: "Laptop de alta performance",
      categoryId: "cat-1",
      supplierId: "sup-1",
      currentStock: 10,
      reorderPoint: 5,
      costPrice: 1500,
      sellingPrice: 2000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "prod-2",
      sku: "CHR-AERON",
      name: "Herman Miller Aeron",
      description: "Cadeira ergonômica",
      categoryId: "cat-2",
      supplierId: "sup-2",
      currentStock: 20,
      reorderPoint: 10,
      costPrice: 800,
      sellingPrice: 1200,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const prod of prodData) {
    await db.insert(products).values(prod).onConflictDoNothing();
  }

  console.log("✅ Seeding complete!");
}

seed().catch(console.error);
