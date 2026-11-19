package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;

public record CreateTrackingEventRequest(
        @NotBlank @Size(max = 255) String location,
        @DecimalMin(value = ShipmentValidation.MIN_TEMPERATURE_C, message = "Nhiệt độ phải từ -30 đến 40°C")
        @DecimalMax(value = ShipmentValidation.MAX_TEMPERATURE_C, message = "Nhiệt độ phải từ -30 đến 40°C") Double temperatureC,
        @DecimalMin(value = ShipmentValidation.MIN_HUMIDITY_PERCENT, message = "Độ ẩm phải từ 0 đến 100%")
        @DecimalMax(value = ShipmentValidation.MAX_HUMIDITY_PERCENT, message = "Độ ẩm phải từ 0 đến 100%") Double humidityPercent,
        @Size(max = 32) String status,
        @Size(max = 2000) String note,
        @DecimalMin(value = ShipmentValidation.MIN_LATITUDE, message = "Vĩ độ phải từ -90 đến 90")
        @DecimalMax(value = ShipmentValidation.MAX_LATITUDE, message = "Vĩ độ phải từ -90 đến 90") Double latitude,
        @DecimalMin(value = ShipmentValidation.MIN_LONGITUDE, message = "Kinh độ phải từ -180 đến 180")
        @DecimalMax(value = ShipmentValidation.MAX_LONGITUDE, message = "Kinh độ phải từ -180 đến 180") Double longitude,
        @DecimalMin(value = ShipmentValidation.MIN_GPS_ACCURACY_METERS, message = "Độ chính xác GPS không hợp lệ")
        @DecimalMax(value = ShipmentValidation.MAX_GPS_ACCURACY_METERS, message = "Độ chính xác GPS không hợp lệ") Double accuracyMeters
) {
    @AssertTrue(message = "Tọa độ GPS phải có đủ vĩ độ và kinh độ")
    public boolean isGpsCoordinateComplete() {
        return (latitude == null && longitude == null && accuracyMeters == null)
                || (latitude != null && longitude != null);
    }
}
