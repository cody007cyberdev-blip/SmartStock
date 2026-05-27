import { db } from "../client";
import { products } from "../schema";
import { eq, like, or } from "drizzle-orm";

export class ProductRepository {
  async findAll() {
    return await db.query.products.findMany();
  }

  async findById(id: string) {
    return await db.query.products.findFirst({
      where: eq(products.id, id),
    });
  }

  async findBySearch(query: string) {
    const q = `%${query}%`;
    return await db.query.products.findMany({
      where: or(
        like(products.name, q),
        like(products.sku, q)
      ),
    });
  }

  async create(data: typeof products.$inferInsert) {
    return await db.insert(products).values(data).returning();
  }

  async update(id: string, data: Partial<typeof products.$inferInsert>) {
    return await db.update(products).set(data).where(eq(products.id, id)).returning();
  }

  async delete(id: string) {
    return await db.delete(products).where(eq(products.id, id)).returning();
  }
}
