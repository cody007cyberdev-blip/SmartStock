import type { ShoppingList, ShoppingListItem, Sale } from "@/types/shopping-list";
import { v4 as uuidv4 } from "crypto";

export class ShoppingListStore {
  private shoppingLists: ShoppingList[] = [];
  private sales: Sale[] = [];
  private version = 0;

  // ─── Shopping Lists ────────────────────────────────────
  getShoppingLists(): ShoppingList[] {
    return [...this.shoppingLists];
  }

  getShoppingListById(id: string): ShoppingList | undefined {
    return this.shoppingLists.find((l) => l.id === id);
  }

  getShoppingListByQRCode(qrCode: string): ShoppingList | undefined {
    return this.shoppingLists.find((l) => l.qrCode === qrCode);
  }

  createShoppingList(customerId: string, customerName?: string): ShoppingList {
    const list: ShoppingList = {
      id: `list-${Date.now()}`,
      customerId,
      customerName,
      items: [],
      totalPrice: 0,
      status: "active",
      qrCode: `SHOP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      notes: "",
    };
    this.shoppingLists.push(list);
    this.version++;
    return list;
  }

  addItemToList(listId: string, item: ShoppingListItem): ShoppingList | undefined {
    const list = this.shoppingLists.find((l) => l.id === listId);
    if (!list) return undefined;

    // Check if item already exists
    const existingItem = list.items.find((i) => i.itemId === item.itemId);
    if (existingItem) {
      existingItem.quantity += item.quantity;
      existingItem.subtotal = existingItem.quantity * existingItem.unitPrice;
    } else {
      list.items.push(item);
    }

    list.totalPrice = list.items.reduce((sum, i) => sum + i.subtotal, 0);
    this.version++;
    return list;
  }

  removeItemFromList(listId: string, itemId: string): ShoppingList | undefined {
    const list = this.shoppingLists.find((l) => l.id === listId);
    if (!list) return undefined;

    list.items = list.items.filter((i) => i.itemId !== itemId);
    list.totalPrice = list.items.reduce((sum, i) => sum + i.subtotal, 0);
    this.version++;
    return list;
  }

  updateItemQuantity(listId: string, itemId: string, quantity: number): ShoppingList | undefined {
    const list = this.shoppingLists.find((l) => l.id === listId);
    if (!list) return undefined;

    const item = list.items.find((i) => i.itemId === itemId);
    if (!item) return undefined;

    item.quantity = quantity;
    item.subtotal = quantity * item.unitPrice;
    list.totalPrice = list.items.reduce((sum, i) => sum + i.subtotal, 0);
    this.version++;
    return list;
  }

  completeShoppingList(listId: string): ShoppingList | undefined {
    const list = this.shoppingLists.find((l) => l.id === listId);
    if (!list) return undefined;

    list.status = "completed";
    list.completedAt = new Date().toISOString();
    this.version++;
    return list;
  }

  abandonShoppingList(listId: string): ShoppingList | undefined {
    const list = this.shoppingLists.find((l) => l.id === listId);
    if (!list) return undefined;

    list.status = "abandoned";
    this.version++;
    return list;
  }

  deleteShoppingList(listId: string): boolean {
    const len = this.shoppingLists.length;
    this.shoppingLists = this.shoppingLists.filter((l) => l.id !== listId);
    if (this.shoppingLists.length < len) {
      this.version++;
      return true;
    }
    return false;
  }

  // ─── Sales ────────────────────────────────────────────
  getSales(): Sale[] {
    return [...this.sales].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  getSaleById(id: string): Sale | undefined {
    return this.sales.find((s) => s.id === id);
  }

  getSalesByVendor(vendorId: string): Sale[] {
    return this.sales.filter((s) => s.vendorId === vendorId);
  }

  getSalesByCustomer(customerId: string): Sale[] {
    return this.sales.filter((s) => s.customerId === customerId);
  }

  createSale(shoppingListId: string, customerId: string, vendorId: string, paymentMethod: "cash" | "card" | "transfer", items: ShoppingListItem[]): Sale {
    const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
    const tax = subtotal * 0.1; // 10% tax

    const sale: Sale = {
      id: `sale-${Date.now()}`,
      shoppingListId,
      customerId,
      vendorId,
      items,
      subtotal,
      tax,
      total: subtotal + tax,
      paymentMethod,
      status: "completed",
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      notes: "",
    };
    this.sales.push(sale);
    this.version++;
    return sale;
  }

  updateSaleStatus(saleId: string, status: "pending" | "completed" | "cancelled"): Sale | undefined {
    const sale = this.sales.find((s) => s.id === saleId);
    if (!sale) return undefined;

    sale.status = status;
    if (status === "completed") {
      sale.completedAt = new Date().toISOString();
    }
    this.version++;
    return sale;
  }

  getVersion(): number {
    return this.version;
  }

  reset(): void {
    this.shoppingLists = [];
    this.sales = [];
    this.version++;
  }
}
