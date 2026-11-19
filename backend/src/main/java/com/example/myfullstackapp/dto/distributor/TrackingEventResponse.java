package com.example.myfullstackapp.dto.distributor;

import java.time.Instant;

public record TrackingEventResponse(
        Long id,
        String location,
        Double temperatureC,
        Double humidityPercent,
        Double latitude,
        Double longitude,
        Double accuracyMeters,
        String status,
        String note,
        Instant eventTime
) { }
