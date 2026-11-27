import { api, unpack } from "@/lib/api";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { User, UserInput } from "@/types/user";

function listFrom<T>(value: T[] | PageResponse<T>) { return Array.isArray(value) ? value : value.content; }
type BackendUser = Omit<User, "name"> & { fullName?: string; name?: string };
function normalizeUser(user: BackendUser): User { return { ...user, name: user.name ?? user.fullName ?? user.email }; }

export const usersService = {
  async list() {
    const { data } = await api.get<ApiResponse<BackendUser[] | PageResponse<BackendUser>>>("/users");
    return listFrom(unpack(data)).map(normalizeUser);
  },
  async create(input: UserInput) {
    const { name, ...rest } = input;
    const { data } = await api.post<ApiResponse<BackendUser>>("/users", { ...rest, fullName: name });
    return normalizeUser(unpack(data));
  },
  async update(id: string, input: UserInput) {
    const { data } = await api.put<ApiResponse<BackendUser>>(`/users/${id}`, { fullName: input.name, active: true, roles: input.roles });
    return normalizeUser(unpack(data));
  },
  async remove(id: string) {
    await api.delete(`/users/${id}`);
  }
};
