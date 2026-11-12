import { api } from "@/lib/api";

export type ApiHarvestLot = {
  id?: number;
  code: string;
  product: string;
  plantingDate?: string;
  harvestDate: string;
  expiryDate?: string;
  qty: string;
  unit: string;
  status: string;
  statusColor?: string;
  cert?: string;
  cultivation?: string;
  farmName?: string;
  transportDestination?: string;
  transportStatus?: string;
  createdAt?: string;
};

export type ApiProductItem = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  unit: string;
  origin?: string;
  farm?: string;
  cert?: string;
  rating?: number;
  reviews?: number;
  harvest?: string;
  image?: string;
  categoryCode?: string;
  stockLeft?: number;
  batchCode?: string;
  description?: string;
};

export const farmerService = {
  async getBatches(): Promise<ApiHarvestLot[]> {
    const res = await api.get<ApiHarvestLot[]>("/farmer/batches");
    return res.data;
  },

  async createBatch(lot: ApiHarvestLot): Promise<ApiHarvestLot> {
    const res = await api.post<{ success: boolean; message?: string; data?: ApiHarvestLot }>("/farmer/batches", lot);
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể tạo lô thu hoạch");
    }
    return res.data.data;
  },

  async addBatchLog(
    code: string,
    entry: { stage: string; time: string; note?: string; materials?: string }
  ): Promise<{ stage: string; time: string; note: string }> {
    const res = await api.post<{ success: boolean; message?: string; data?: { stage: string; time: string; note: string } }>(
      `/farmer/batches/${encodeURIComponent(code)}/logs`,
      entry
    );
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể đồng bộ nhật ký canh tác lên QR");
    }
    return res.data.data;
  },

  async deleteBatch(code: string): Promise<void> {
    await api.delete(`/farmer/batches/${code}`);
  },

  async getProducts(): Promise<ApiProductItem[]> {
    const res = await api.get<ApiProductItem[]>("/products");
    return res.data;
  },

  async createProduct(product: Partial<ApiProductItem>): Promise<ApiProductItem> {
    const res = await api.post<ApiProductItem>("/products", product);
    return res.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
};
