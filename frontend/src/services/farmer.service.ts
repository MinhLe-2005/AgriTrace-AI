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
  createdAt?: string;
};

export const farmerService = {
  async getBatches(): Promise<ApiHarvestLot[]> {
    const res = await api.get<ApiHarvestLot[]>("/farmer/batches");
    return res.data;
  },

  async createBatch(lot: ApiHarvestLot): Promise<ApiHarvestLot> {
    const res = await api.post<{ success: boolean; data: ApiHarvestLot }>("/farmer/batches", lot);
    return res.data.data;
  },

  async deleteBatch(code: string): Promise<void> {
    await api.delete(`/farmer/batches/${code}`);
  },
};
