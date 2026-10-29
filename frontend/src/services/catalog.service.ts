import { api } from "@/lib/api";

export type ApiCategory = {
  id: number;
  code: string;
  name: string;
  description: string;
  tag: string;
  tagColor: string;
  image: string;
  displayOrder: number;
};

export type ApiProduct = {
  id: string;
  name: string;
  price: number;
  oldPrice: number;
  unit: string;
  origin: string;
  farm: string;
  cert: string;
  rating: number;
  reviews: number;
  harvest: string;
  image: string;
  categoryCode: string;
  stockLeft: number;
  batchCode: string;
  description: string;
  cultivation: string;
  temperature: string;
  pesticide: string;
  packaging: string;
  active: boolean;
  featured: boolean;
};

export type ApiVoucher = {
  id: number;
  code: string;
  title: string;
  description: string;
  badge: string;
  badgeColor: string;
  discount: string;
  minOrder: string;
  exp: string;
  active: boolean;
};

export type ApiTraceability = {
  id: number;
  batchCode: string;
  productName: string;
  farmName: string;
  location: string;
  harvestDate: string;
  certType: string;
  labResult: string;
  tempAvg: string;
  inspector: string;
  timelineJson?: string;
};

export type ApiOrderItem = {
  name: string;
  origin?: string;
  cert?: string;
  qty: string;
  price: number;
  image?: string;
};

export type ApiOrder = {
  id: number;
  orderCode: string;
  userEmail: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  deliverySlot: string;
  deliveryNote?: string;
  driverName?: string;
  driverPhone?: string;
  status:
    | "PENDING_PAYMENT"
    | "PAID"
    | "CONFIRMED"
    | "PREPARING"
    | "SHIPPING"
    | "DELIVERED"
    | "COMPLETED"
    | "CANCELLED"
    | "REFUNDED"
    | "PENDING";
  paymentMethod: string;
  voucherUsed?: string;
  cancelReason?: string;
  cancelledAt?: string;
  paidAt?: string;
  paymentRef?: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  pointsAwarded: number;
  lotCode: string;
  createdAt: string;
  items: ApiOrderItem[];
};

export const catalogService = {
  async getCategories(): Promise<ApiCategory[]> {
    const res = await api.get<ApiCategory[]>("/categories");
    return res.data;
  },

  async getProducts(params?: { category?: string; featured?: boolean }): Promise<ApiProduct[]> {
    const res = await api.get<ApiProduct[]>("/products", { params });
    return res.data;
  },

  async getProductById(id: string): Promise<ApiProduct> {
    const res = await api.get<ApiProduct>(`/products/${id}`);
    return res.data;
  },

  async getProductByBatch(batchCode: string): Promise<ApiProduct> {
    const res = await api.get<ApiProduct>(`/products/batch/${batchCode}`);
    return res.data;
  },

  async getVouchers(): Promise<ApiVoucher[]> {
    const res = await api.get<ApiVoucher[]>("/vouchers");
    return res.data;
  },

  async getTraceabilityByBatch(batchCode: string): Promise<ApiTraceability> {
    const res = await api.get<ApiTraceability>(`/traceability/${batchCode}`);
    return res.data;
  },

  async getOrders(email?: string): Promise<ApiOrder[]> {
    const res = await api.get<ApiOrder[]>("/orders", { params: email ? { email } : undefined });
    return res.data;
  },

  async createOrder(data: {
    userEmail?: string;
    receiverName: string;
    receiverPhone: string;
    receiverAddress: string;
    deliverySlot?: string;
    deliveryNote?: string;
    paymentMethod?: string;
    voucherUsed?: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    pointsAwarded?: number;
    lotCode?: string;
    items: ApiOrderItem[];
  }): Promise<ApiOrder> {
    const res = await api.post<ApiOrder>("/orders", data);
    return res.data;
  },

  async cancelOrder(orderCode: string, reason?: string): Promise<ApiOrder> {
    const res = await api.patch<{ data?: ApiOrder } | ApiOrder>(`/orders/${encodeURIComponent(orderCode)}/cancel`, { reason });
    const payload = res.data as { data?: ApiOrder };
    return payload?.data || (res.data as ApiOrder);
  },

  async updateOrderStatus(orderCode: string, status: string): Promise<ApiOrder> {
    const res = await api.patch<{ data?: ApiOrder } | ApiOrder>(`/orders/${encodeURIComponent(orderCode)}/status`, { status });
    const payload = res.data as { data?: ApiOrder };
    return payload?.data || (res.data as ApiOrder);
  },
};
