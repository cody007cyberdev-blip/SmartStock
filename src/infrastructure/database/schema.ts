import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: text("category_id"),
  status: text("status").notNull().default("active"),
  unit: text("unit").notNull().default("each"),
  currentStock: integer("current_stock").notNull().default(0),
  reorderPoint: integer("reorder_point").notNull().default(0),
  reorderQuantity: integer("reorder_quantity").notNull().default(0),
  costPrice: real("cost_price").notNull().default(0),
  sellingPrice: real("selling_price").notNull().default(0),
  locationId: text("location_id"),
  supplierId: text("supplier_id"),
  imageUrl: text("image_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
});

export const suppliers = sqliteTable("suppliers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  category: text("category"),
  rating: real("rating"),
  status: text("status").notNull().default("active"),
});

export const movements = sqliteTable("movements", {
  id: text("id").primaryKey(),
  itemId: text("item_id").notNull(),
  type: text("type").notNull(), // Received, Shipped, Adjusted, Transferred
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: text("reason"),
  locationId: text("location_id"),
  toLocationId: text("to_location_id"),
  userId: text("user_id"),
  reference: text("reference"),
  createdAt: text("created_at").notNull(),
});

export const shoppingLists = sqliteTable("shopping_lists", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  customerName: text("customer_name"),
  totalPrice: real("total_price").notNull().default(0),
  status: text("status").notNull().default("active"), // active, completed, abandoned
  qrCode: text("qr_code").notNull().unique(),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
  notes: text("notes"),
});

export const shoppingListItems = sqliteTable("shopping_list_items", {
  id: text("id").primaryKey(),
  listId: text("list_id").notNull(),
  itemId: text("item_id").notNull(),
  itemName: text("item_name").notNull(),
  itemSku: text("item_sku").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  subtotal: real("subtotal").notNull(),
  unit: text("unit").notNull(),
});

export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  shoppingListId: text("shopping_list_id").notNull(),
  customerId: text("customer_id").notNull(),
  vendorId: text("vendor_id").notNull(),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull(),
  total: real("total").notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card, transfer
  status: text("status").notNull().default("completed"),
  createdAt: text("created_at").notNull(),
  completedAt: text("completed_at"),
  notes: text("notes"),
});
