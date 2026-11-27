"use client";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { warehouseMonitoringService } from "@/services/warehouse-monitoring.service";

export type WarehouseLiveStatus =
  "connecting" | "connected" | "reconnecting" | "offline";
export function useWarehouseLive(warehouseId: string) {
  const client = useQueryClient();
  const [status, setStatus] = useState<WarehouseLiveStatus>("offline");
  useEffect(() => {
    if (!warehouseId) {
      setStatus("offline");
      return;
    }
    const controller = new AbortController();
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    function refresh() {
      if (refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = undefined;
        for (const key of ["monitoring", "alerts", "dashboard", "heatmap"]) {
          void client.invalidateQueries({
            queryKey: ["warehouse", warehouseId, key],
          });
        }
      }, 500);
    }
    async function delay(ms: number) {
      await new Promise<void>((resolve) => {
        const done = () => {
          clearTimeout(timer);
          controller.signal.removeEventListener("abort", done);
          resolve();
        };
        const timer = setTimeout(done, ms);
        controller.signal.addEventListener("abort", done, { once: true });
      });
    }
    async function connect() {
      let attempts = 0,
        authRetries = 0;
      setStatus("connecting");
      while (!controller.signal.aborted) {
        try {
          const token = useAuthStore.getState().accessToken;
          if (!token) {
            setStatus("offline");
            return;
          }
          const response = await fetch(
            (api.defaults.baseURL ?? "") +
              "/warehouses/" +
              warehouseId +
              "/monitoring/stream",
            {
              headers: {
                Authorization: "Bearer " + token,
                Accept: "text/event-stream",
              },
              signal: controller.signal,
              cache: "no-store",
            }
          );
          if (response.status === 401 && authRetries++ === 0) {
            await warehouseMonitoringService.status(warehouseId);
            continue;
          }
          if (response.status === 401 || response.status === 403) {
            setStatus("offline");
            return;
          }
          if (!response.ok || !response.body)
            throw new Error("Stream unavailable");
          attempts = 0;
          authRetries = 0;
          setStatus("connected");
          refresh();
          const reader = response.body.getReader(),
            decoder = new TextDecoder();
          let buffer = "";
          try {
            while (!controller.signal.aborted) {
              const part = await reader.read();
              if (part.done) break;
              buffer = (
                buffer + decoder.decode(part.value, { stream: true })
              ).replace(/\r\n/g, "\n");
              let end: number;
              while ((end = buffer.indexOf("\n\n")) !== -1) {
                const event = buffer.slice(0, end);
                buffer = buffer.slice(end + 2);
                if (
                  event.includes("event:warehouse-change") ||
                  event.includes("event:connected")
                )
                  refresh();
              }
              if (buffer.length > 65536)
                throw new Error("Unexpected stream payload");
            }
          } finally {
            await reader.cancel().catch(() => undefined);
            reader.releaseLock();
          }
        } catch {
          if (controller.signal.aborted) return;
        }
        if (controller.signal.aborted) return;
        setStatus("reconnecting");
        await delay(Math.min(30000, 1000 * 2 ** Math.min(attempts++, 5)));
      }
    }
    void connect();
    return () => {
      controller.abort();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [warehouseId, client]);
  return status;
}
