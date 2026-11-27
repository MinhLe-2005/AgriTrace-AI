"use client";

import type { DistributorShipment } from "./types";

const STORAGE_KEY = "agritrace-distributor-shipments";

function hasBrowserStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getLocalShipments(): DistributorShipment[] {
  if (!hasBrowserStorage()) return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as DistributorShipment[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalShipments(shipments: DistributorShipment[]) {
  if (!hasBrowserStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
}

export function upsertLocalShipment(shipment: DistributorShipment) {
  const shipments = getLocalShipments();
  const index = shipments.findIndex((item) => item.shipmentCode === shipment.shipmentCode);
  if (index === -1) shipments.unshift(shipment);
  else shipments[index] = shipment;
  saveLocalShipments(shipments);
}

export function mergeShipments(...collections: DistributorShipment[][]) {
  const shipments = new Map<string, DistributorShipment>();
  for (const collection of collections) {
    for (const shipment of collection) shipments.set(shipment.shipmentCode, shipment);
  }
  return [...shipments.values()].sort((a, b) => {
    const aTime = new Date(a.createdAt ?? a.dispatchTime ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? b.dispatchTime ?? 0).getTime();
    return bTime - aTime;
  });
}
