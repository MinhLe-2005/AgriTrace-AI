"""Warehouse sensor simulator: standard library only; keys come from environment.
Register a sensor with 'simulated' enabled in the Warehouse monitoring screen.
WAREHOUSE_SENSOR_DEVICE_ID and WAREHOUSE_SENSOR_DEVICE_KEY are required.
The default destination is the local application, never the shared Supabase API.
"""
import argparse
import datetime as dt
import json
import os
import threading
import time
import urllib.error
import urllib.request
import uuid

def main():
    parser = argparse.ArgumentParser(description="Send clearly labelled simulated Warehouse sensor readings.")
    parser.add_argument("--url", default="http://127.0.0.1:8080/api/v1/warehouse-telemetry")
    parser.add_argument("--mode", choices=("normal", "hot"), default="normal")
    parser.add_argument("--interval", type=float, default=5, help="Seconds between new readings, minimum 1")
    parser.add_argument("--history-minutes", type=int, default=0, help="Replay up to 120 minutes of labelled simulated readings at one-minute spacing")
    parser.add_argument("--once", action="store_true", help="Send history and one current sample, then stop")
    args = parser.parse_args()
    if not 0 <= args.history_minutes <= 120 or args.interval < 1:
        parser.error("history-minutes must be 0..120 and interval at least 1")
    device = os.environ.get("WAREHOUSE_SENSOR_DEVICE_ID", "")
    key = os.environ.get("WAREHOUSE_SENSOR_DEVICE_KEY", "")
    if not device or not key:
        parser.error("Set WAREHOUSE_SENSOR_DEVICE_ID and WAREHOUSE_SENSOR_DEVICE_KEY; keys are never printed.")
    try:
        uuid.UUID(device)
    except ValueError:
        parser.error("Invalid device UUID")
    if not (args.url.startswith("http://127.0.0.1:") or args.url.startswith("http://localhost:") or args.url.startswith("https://")):
        parser.error("Use HTTPS except for localhost")
    state = {"mode": args.mode, "stop": False}
    def send(timestamp):
        temperature = 12.0 if state["mode"] == "hot" else 4.0
        payload = {"deviceId": device, "deviceKey": key, "messageId": str(uuid.uuid4()),
                   "recordedAt": timestamp.isoformat().replace("+00:00", "Z"),
                   "temperature": temperature, "humidity": 85.0, "simulated": True}
        request = urllib.request.Request(args.url, data=json.dumps(payload).encode(),
                                         headers={"Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=15) as response:
                body = json.load(response)
            if not body.get("data", {}).get("simulated"):
                raise RuntimeError("Server did not acknowledge simulated data")
            print(f"SIMULATED {payload['recordedAt']}  {temperature:.1f} C  85.0 %", flush=True)
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"Sensor request rejected (HTTP {error.code}); check registered sensor mode, key and rate limit") from None
        except urllib.error.URLError:
            raise RuntimeError("Cannot reach the Warehouse application; verify URL and server status") from None
    reference = dt.datetime.now(dt.timezone.utc)
    for minute in range(args.history_minutes, 0, -1):
        send(reference - dt.timedelta(minutes=minute))
    send(dt.datetime.now(dt.timezone.utc))
    if args.once:
        return
    print("SIMULATION: 0 + Enter = normal, 1 + Enter = hot, q + Enter = stop. No physical device is controlled.", flush=True)
    def commands():
        while not state["stop"]:
            try:
                command = input().strip().lower()
            except EOFError:
                return
            if command == "q":
                state["stop"] = True
            elif command in ("0", "1"):
                state["mode"] = "hot" if command == "1" else "normal"
    threading.Thread(target=commands, daemon=True).start()
    while not state["stop"]:
        time.sleep(args.interval)
        if not state["stop"]:
            send(dt.datetime.now(dt.timezone.utc))

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Simulator stopped.")
    except RuntimeError as error:
        raise SystemExit(str(error))
