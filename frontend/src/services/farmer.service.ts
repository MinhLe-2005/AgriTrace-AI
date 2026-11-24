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
  farmCode?: string;
  ownerId?: string;
  transportDestination?: string;
  transportStatus?: string;
  createdAt?: string;
};

export type LotTimelineEvent = {
  stage: string;
  time: string;
  note: string;
  badge?: string;
  operator?: string;
};

export type BatchChangeEvent = {
  code: string;
  product: string;
  status: string;
  statusColor?: string;
  transportStatus?: string;
  transportDestination?: string;
  actionType: "ADMIN_APPROVED" | "ADMIN_REJECTED" | "DRIVER_PICKUP" | "WAREHOUSE_INBOUND" | "STATUS_UPDATED";
  actorRole: "ADMIN" | "DISTRIBUTOR" | "WAREHOUSE" | "FARMER";
  note?: string;
  timestamp: string;
};

export type ApiFarmingLog = {
  id?: number | string;
  batchCode: string;
  farmCode?: string;
  ownerId?: string;
  stage: string;
  time?: string;
  date?: string;
  action?: string;
  note?: string;
  notes?: string;
  materials?: string;
  materialsUsed?: string;
  proofImage?: string;
  image?: string;
  operator?: string;
  createdAt?: string;
};

export type ApiFarmCertificate = {
  id?: number | string;
  certNumber: string;
  name: string;
  farmCode?: string;
  farmName?: string;
  issuedBy?: string;
  issueDate?: string;
  expiryDate?: string;
  status?: string;
  daysLeft?: number;
  approvalStatus?: string;
  pendingRequestedExpiryDate?: string;
  pendingNewCertNumber?: string;
  pendingProofImage?: string;
  pendingNote?: string;
  submittedAt?: string;
  alertEmail?: string;
  adminNote?: string;
  ownerId?: string;
};

export type ApiProductItem = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  unit: string;
  origin?: string;
  farm?: string;
  farmCode?: string;
  ownerId?: string;
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
  async getBatches(params?: { ownerId?: string; farmCode?: string }): Promise<ApiHarvestLot[]> {
    const res = await api.get<ApiHarvestLot[]>("/farmer/batches", { params });
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
    entry: { stage: string; time: string; note?: string; materials?: string; proofImage?: string; image?: string }
  ): Promise<{ stage: string; time: string; note: string; proofImage?: string }> {
    const res = await api.post<{ success: boolean; message?: string; data?: { stage: string; time: string; note: string; proofImage?: string } }>(
      `/farmer/batches/${encodeURIComponent(code)}/logs`,
      entry
    );
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể đồng bộ nhật ký canh tác lên QR");
    }
    return res.data.data;
  },

  async getLogs(params?: { ownerId?: string; farmCode?: string; batchCode?: string }): Promise<ApiFarmingLog[]> {
    const res = await api.get<ApiFarmingLog[]>("/farmer/logs", { params });
    return res.data;
  },

  async createLog(log: Partial<ApiFarmingLog>): Promise<ApiFarmingLog | undefined> {
    const res = await api.post<{ success: boolean; data?: ApiFarmingLog }>("/farmer/logs", log);
    return res.data?.data;
  },

  async deleteLog(id: string | number): Promise<void> {
    await api.delete(`/farmer/logs/${id}`);
  },

  async deleteBatch(code: string): Promise<void> {
    await api.delete(`/farmer/batches/${code}`);
  },

  async getBatchTimeline(code: string): Promise<LotTimelineEvent[]> {
    const res = await api.get<{ success: boolean; data?: LotTimelineEvent[] }>(
      `/farmer/batches/${encodeURIComponent(code)}/timeline`
    );
    return res.data?.data || [];
  },

  async updateBatchStatus(
    code: string,
    payload: {
      status?: string;
      statusColor?: string;
      transportStatus?: string;
      transportDestination?: string;
      adminNote?: string;
      actorRole?: string;
    }
  ): Promise<ApiHarvestLot> {
    const res = await api.patch<{ success: boolean; message?: string; data?: ApiHarvestLot }>(
      `/farmer/batches/${encodeURIComponent(code)}/status`,
      payload
    );
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể cập nhật trạng thái lô");
    }
    return res.data.data;
  },

  async driverPickup(
    code: string,
    payload?: { driverName?: string; vehiclePlate?: string; destination?: string }
  ): Promise<ApiHarvestLot> {
    const res = await api.post<{ success: boolean; message?: string; data?: ApiHarvestLot }>(
      `/farmer/batches/${encodeURIComponent(code)}/driver-pickup`,
      payload || {}
    );
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể thực hiện tiếp nhận lô hàng");
    }
    return res.data.data;
  },

  async warehouseInbound(
    code: string,
    payload?: { warehouseStaff?: string; warehouseName?: string; temperature?: string }
  ): Promise<ApiHarvestLot> {
    const res = await api.post<{ success: boolean; message?: string; data?: ApiHarvestLot }>(
      `/farmer/batches/${encodeURIComponent(code)}/warehouse-inbound`,
      payload || {}
    );
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể thực hiện nhập kho đích");
    }
    return res.data.data;
  },

  async addBatchTimelineEvent(
    code: string,
    event: {
      stage: string;
      time?: string;
      note?: string;
      badge?: string;
      operator?: string;
    }
  ): Promise<LotTimelineEvent> {
    const res = await api.post<{ success: boolean; message?: string; data?: LotTimelineEvent }>(
      `/farmer/batches/${encodeURIComponent(code)}/timeline-events`,
      event
    );
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể thêm sự kiện vòng đời");
    }
    return res.data.data;
  },

  async getProducts(params?: { ownerId?: string; farmCode?: string; category?: string }): Promise<ApiProductItem[]> {
    const res = await api.get<ApiProductItem[]>("/products", { params });
    return res.data;
  },

  async createProduct(product: Partial<ApiProductItem>): Promise<ApiProductItem> {
    const res = await api.post<ApiProductItem>("/products", product);
    return res.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },
  async notifyCertExpiry(payload: {
    certName: string;
    certNumber: string;
    farmName: string;
    daysLeft: number;
    expiryDate: string;
    toEmail?: string;
  }): Promise<{ success: boolean; message: string; data?: Record<string, unknown> }> {
    const res = await api.post<{ success: boolean; message: string; data?: Record<string, unknown> }>(
      "/farmer/certificates/notify-expiry",
      payload
    );
    return res.data;
  },

  async getCertificates(): Promise<ApiFarmCertificate[]> {
    const res = await api.get<ApiFarmCertificate[]>("/farmer/certificates");
    return res.data;
  },

  async saveCertificate(cert: Partial<ApiFarmCertificate>): Promise<ApiFarmCertificate | undefined> {
    const res = await api.post<{ success: boolean; data?: ApiFarmCertificate }>("/farmer/certificates", cert);
    return res.data?.data;
  },

  async renewCertificate(payload: {
    certNumber: string;
    newCertNumber?: string;
    requestedExpiryDate: string;
    proofImage?: string;
    note?: string;
  }): Promise<ApiFarmCertificate> {
    const res = await api.post<{ success: boolean; message?: string; data?: ApiFarmCertificate }>(
      "/farmer/certificates/renew",
      payload
    );
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể nộp hồ sơ gia hạn chứng chỉ");
    }
    return res.data.data;
  },

  async decideCertificate(
    certNumber: string,
    payload: { action: "approve" | "reject"; adminNote?: string; newCertNumber?: string; approvedExpiryDate?: string }
  ): Promise<ApiFarmCertificate> {
    const res = await api.patch<{ success: boolean; message?: string; data?: ApiFarmCertificate }>(
      `/farmer/certificates/${encodeURIComponent(certNumber)}/decision`,
      payload
    );
    if (!res.data?.success || !res.data?.data) {
      throw new Error(res.data?.message || "Không thể cập nhật phê duyệt chứng chỉ");
    }
    return res.data.data;
  },

  async triggerCertAutoScan(): Promise<{ success: boolean; message?: string; data?: Record<string, unknown> }> {
    const res = await api.post<{ success: boolean; message?: string; data?: Record<string, unknown> }>("/farmer/certificates/trigger-auto-scan");
    return res.data;
  },

  async deleteCertificate(certNumber: string): Promise<void> {
    await api.delete(`/farmer/certificates/${encodeURIComponent(certNumber)}`);
  },
};
