import { create } from "zustand";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  unit: string;
  qty: number;
  farm: string;
  cert?: string;
  image: string;
  batchCode?: string;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
};

const initialCartItems: CartItem[] = [
  {
    id: "sp-01",
    name: "Dâu Tây Giống Nhật Mộc Châu",
    price: 185000,
    unit: "Hộp 500g",
    qty: 1,
    farm: "Nông Trại Dâu Mộc Châu",
    cert: "VietGAP",
    batchCode: "DT-MC-2026-11",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "sp-02",
    name: "Xà Lách Thủy Canh Lô Lô Xanh",
    price: 38000,
    unit: "Gói 400g",
    qty: 2,
    farm: "Nông Trại Xanh Đà Lạt",
    cert: "GlobalGAP",
    batchCode: "XL-2026-08",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
  },
];

export const useCartStore = create<CartStore>((set, get) => ({
  items: initialCartItems,

  addItem: (product, qty = 1) =>
    set((state) => {
      const existing = state.items.find((it) => it.id === product.id);
      if (existing) {
        return {
          items: state.items.map((it) =>
            it.id === product.id ? { ...it, qty: it.qty + qty } : it
          ),
        };
      }
      return {
        items: [...state.items, { ...product, qty }],
      };
    }),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((it) => it.id !== id),
    })),

  updateQty: (id, delta) =>
    set((state) => ({
      items: state.items
        .map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it))
        .filter((it) => it.qty > 0),
    })),

  clearCart: () => set({ items: [] }),

  getSubtotal: () => {
    return get().items.reduce((sum, it) => sum + it.price * it.qty, 0);
  },

  getItemCount: () => {
    return get().items.reduce((sum, it) => sum + it.qty, 0);
  },
}));
