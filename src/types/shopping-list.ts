export interface ShoppingListItem {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  unit: string;
}

export interface ShoppingList {
  id: string;
  customerId: string;
  customerName?: string;
  items: ShoppingListItem[];
  totalPrice: number;
  status: "active" | "completed" | "abandoned";
  qrCode: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface Sale {
  id: string;
  shoppingListId: string;
  customerId: string;
  vendorId: string;
  items: ShoppingListItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "transfer";
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
  completedAt?: string;
  notes?: string;
}
