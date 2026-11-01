import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { VerificationRequest } from "@/types/verification";

export const verificationsService = {
  async list() {
    const { data } = await api.get<ApiResponse<VerificationRequest[]>>("/verifications");
    return unpack(data);
  },
  async approve({ id, reason }: { id: string; reason: string }) {
    const { data } = await api.post<ApiResponse<VerificationRequest>>(`/verifications/${id}/approve`, { reason });
    return unpack(data);
  },
  async reject({ id, reason }: { id: string; reason: string }) {
    const { data } = await api.post<ApiResponse<VerificationRequest>>(`/verifications/${id}/reject`, { reason });
    return unpack(data);
  }
};
