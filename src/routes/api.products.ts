import { createAPIFileRoute } from "@tanstack/react-start/api";
import { ProductRepository } from "@/infrastructure/database/repositories/product.repository";

const productRepo = new ProductRepository();

export const Route = createAPIFileRoute("/api/products")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    let products;
    if (search) {
      products = await productRepo.findBySearch(search);
    } else {
      products = await productRepo.findAll();
    }

    return new Response(JSON.stringify(products), {
      headers: { "Content-Type": "application/json" },
    });
  },
  POST: async ({ request }) => {
    const data = await request.json();
    const result = await productRepo.create({
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  },
});
