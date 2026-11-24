import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { VerificationRequest, VerificationSubmission, VerificationSubmitInput } from "@/types/verification";

export const verificationsService = {
  async list() {
    const { data } = await api.get<ApiResponse<VerificationRequest[]>>("/verifications");
    return unpack(data);
  },
  async myRequests(email?: string) {
    const { data } = await api.get<ApiResponse<VerificationRequest[]>>("/verifications/my", {
      params: email ? { email } : undefined,
    });
    return unpack(data);
  },
  async listMine() {
    const { data } = await api.get<ApiResponse<VerificationRequest[]>>("/verifications/mine");
    return unpack(data);
  },
  async submit(input: VerificationSubmission | VerificationSubmitInput) {
    const { data } = await api.post<ApiResponse<VerificationRequest>>("/verifications", input);
    return unpack(data);
  },
  async approve({ id, reason }: { id: string; reason: string }) {
    const { data } = await api.post<ApiResponse<VerificationRequest>>(`/verifications/${id}/approve`, { reason });
    return unpack(data);
  },
  async reject({ id, reason }: { id: string; reason: string }) {
    const { data } = await api.post<ApiResponse<VerificationRequest>>(`/verifications/${id}/reject`, { reason });
    return unpack(data);
  },
  async requestChanges({ id, reason }: { id: string; reason: string }) {
    const { data } = await api.post<ApiResponse<VerificationRequest>>(`/verifications/${id}/request-changes`, { reason });
    return unpack(data);
  }
};
