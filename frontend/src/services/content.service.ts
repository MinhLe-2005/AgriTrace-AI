import { api } from "@/lib/api";
import type { AdminBlogPost, CampaignItem } from "@/stores/campaign-store";

/** Payload gửi lên backend: id/createdAt do server sinh, slug để trống thì server tự tạo. */
export type CampaignPayload = Omit<CampaignItem, "id" | "createdAt">;
export type BlogPostPayload = Omit<AdminBlogPost, "id">;

export const contentService = {
  async listCampaigns(): Promise<CampaignItem[]> {
    const res = await api.get<CampaignItem[]>("/campaigns");
    return res.data ?? [];
  },
  async createCampaign(payload: CampaignPayload): Promise<CampaignItem> {
    const res = await api.post<CampaignItem>("/campaigns", payload);
    return res.data;
  },
  async updateCampaign(id: string, payload: CampaignPayload): Promise<CampaignItem> {
    const res = await api.put<CampaignItem>(`/campaigns/${encodeURIComponent(id)}`, payload);
    return res.data;
  },
  async toggleCampaign(id: string): Promise<CampaignItem> {
    const res = await api.patch<CampaignItem>(`/campaigns/${encodeURIComponent(id)}/toggle`, {});
    return res.data;
  },
  async deleteCampaign(id: string): Promise<void> {
    await api.delete(`/campaigns/${encodeURIComponent(id)}`);
  },

  /** includeInactive=true chỉ dành cho admin (/blog-posts/all). */
  async listBlogPosts(includeInactive = false): Promise<AdminBlogPost[]> {
    const res = await api.get<AdminBlogPost[]>(includeInactive ? "/blog-posts/all" : "/blog-posts");
    return res.data ?? [];
  },
  async createBlogPost(payload: BlogPostPayload): Promise<AdminBlogPost> {
    const res = await api.post<AdminBlogPost>("/blog-posts", payload);
    return res.data;
  },
  async updateBlogPost(id: string, payload: BlogPostPayload): Promise<AdminBlogPost> {
    const res = await api.put<AdminBlogPost>(`/blog-posts/${encodeURIComponent(id)}`, payload);
    return res.data;
  },
  async toggleBlogPost(id: string): Promise<AdminBlogPost> {
    const res = await api.patch<AdminBlogPost>(`/blog-posts/${encodeURIComponent(id)}/toggle`, {});
    return res.data;
  },
  async deleteBlogPost(id: string): Promise<void> {
    await api.delete(`/blog-posts/${encodeURIComponent(id)}`);
  },
};
