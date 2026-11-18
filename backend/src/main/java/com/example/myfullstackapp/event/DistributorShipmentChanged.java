package com.example.myfullstackapp.event;

import java.time.Instant;

/** Published after a shipment transaction commits so live screens can refresh safely. */
public record DistributorShipmentChanged(String shipmentCode, String distributorEmail, Instant occurredAt) { }
