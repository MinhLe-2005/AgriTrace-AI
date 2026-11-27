import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";

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
  activeOwnerId: string;
  cartsByOwner: Record<string, CartItem[]>;
  items: CartItem[];

  syncUser: (ownerId?: string | null) => void;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
};

function resolveCurrentOwnerId(): string {
  if (typeof window === "undefined") return "guest";
  try {
    const user = useAuthStore.getState().user;
    if (user?.id) return `user:${user.id}`;
    if (user?.email) return `email:${user.email}`;
  } catch {
    // ignore
  }
  return "guest";
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      activeOwnerId: "guest",
      cartsByOwner: {},
      items: [],

      syncUser: (explicitOwnerId) => {
        const ownerId = explicitOwnerId || resolveCurrentOwnerId();
        const currentOwner = get().activeOwnerId;
        const currentCarts = get().cartsByOwner;

        if (ownerId !== currentOwner || get().items !== (currentCarts[ownerId] || [])) {
          const userItems = currentCarts[ownerId] || [];
          set({
            activeOwnerId: ownerId,
            items: userItems,
          });
        }
      },

      addItem: (product, qty = 1) =>
        set((state) => {
          const owner = resolveCurrentOwnerId();
          const currentItems = state.cartsByOwner[owner] || [];
          const existing = currentItems.find((it) => it.id === product.id);

          let newItems: CartItem[];
          if (existing) {
            newItems = currentItems.map((it) =>
              it.id === product.id ? { ...it, qty: it.qty + qty } : it
            );
          } else {
            newItems = [...currentItems, { ...product, qty }];
          }

          return {
            activeOwnerId: owner,
            items: newItems,
            cartsByOwner: {
              ...state.cartsByOwner,
              [owner]: newItems,
            },
          };
        }),

      removeItem: (id) =>
        set((state) => {
          const owner = resolveCurrentOwnerId();
          const currentItems = state.cartsByOwner[owner] || [];
          const newItems = currentItems.filter((it) => it.id !== id);

          return {
            activeOwnerId: owner,
            items: newItems,
            cartsByOwner: {
              ...state.cartsByOwner,
              [owner]: newItems,
            },
          };
        }),

      updateQty: (id, delta) =>
        set((state) => {
          const owner = resolveCurrentOwnerId();
          const currentItems = state.cartsByOwner[owner] || [];
          const newItems = currentItems
            .map((it) => (it.id === id ? { ...it, qty: it.qty + delta } : it))
            .filter((it) => it.qty > 0);

          return {
            activeOwnerId: owner,
            items: newItems,
            cartsByOwner: {
              ...state.cartsByOwner,
              [owner]: newItems,
            },
          };
        }),

      clearCart: () =>
        set((state) => {
          const owner = resolveCurrentOwnerId();
          return {
            activeOwnerId: owner,
            items: [],
            cartsByOwner: {
              ...state.cartsByOwner,
              [owner]: [],
            },
          };
        }),

      getSubtotal: () => {
        return get().items.reduce((sum, it) => sum + it.price * it.qty, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, it) => sum + it.qty, 0);
      },
    }),
    {
      name: "agritrace-cart-v3",
      partialize: (state) => ({
        activeOwnerId: state.activeOwnerId,
        cartsByOwner: state.cartsByOwner,
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const owner = resolveCurrentOwnerId();
          state.activeOwnerId = owner;
          state.items = state.cartsByOwner[owner] || [];
        }
      },
    }
  )
);

// Tự động lắng nghe thay đổi phiên đăng nhập để chuyển đổi giỏ hàng tức thời theo tài khoản
if (typeof window !== "undefined") {
  useAuthStore.subscribe((authState) => {
    const user = authState.user;
    const owner = user?.id ? `user:${user.id}` : user?.email ? `email:${user.email}` : "guest";
    useCartStore.getState().syncUser(owner);
  });
}
