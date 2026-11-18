import { useAuthStore } from "@/stores/auth-store";

const STREAM_RETRY_MS = 1_000;

function streamUrl() {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
  return `${baseUrl.replace(/\/$/, "")}/distributor/stream`;
}

/**
 * Uses an authenticated SSE connection rather than a timed refresh. The API
 * sends a message only after its shipment transaction has committed.
 */
export function subscribeToDistributorChanges(onChange: () => void) {
  let active = true;
  let controller: AbortController | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = async () => {
    controller = new AbortController();
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) return;

    try {
      const response = await fetch(streamUrl(), {
        headers: {
          Accept: "text/event-stream",
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });
      if (!response.ok || !response.body)
        throw new Error("Không thể kết nối luồng cập nhật trực tiếp");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (active) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split(/\r?\n\r?\n/);
        buffer = messages.pop() ?? "";
        for (const message of messages) {
          const eventName = message.match(/^event:\s*(.+)$/m)?.[1]?.trim();
          if (eventName === "shipment-change") onChange();
        }
      }
    } catch (error) {
      if (
        !active ||
        (error instanceof DOMException && error.name === "AbortError")
      )
        return;
    }

    if (active) retryTimer = setTimeout(() => void connect(), STREAM_RETRY_MS);
  };

  void connect();
  return () => {
    active = false;
    if (retryTimer) clearTimeout(retryTimer);
    controller?.abort();
  };
}
