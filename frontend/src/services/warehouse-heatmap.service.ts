import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type {
  LocationCoordinates,
  WarehouseHeatmap,
} from "@/types/warehouse-heatmap";
const path = (id: string) => `/warehouses/${id}/heatmap`;
export const warehouseHeatmapService = {
  map: async (id: string) =>
    unpack((await api.get<ApiResponse<WarehouseHeatmap>>(path(id))).data),
  place: async (id: string, locationId: string, input: LocationCoordinates) =>
    unpack(
      (
        await api.put<ApiResponse<LocationCoordinates>>(
          `${path(id)}/layout/${locationId}`,
          input
        )
      ).data
    ),
  unplace: async (id: string, locationId: string) =>
    unpack(
      (await api.delete<ApiResponse<null>>(`${path(id)}/layout/${locationId}`))
        .data
    ),
};
