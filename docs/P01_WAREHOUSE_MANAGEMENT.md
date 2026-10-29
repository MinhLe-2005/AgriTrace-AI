# P01 — Warehouse Management của Trí

Ngày 29/10/2026. Nhánh feature: `feat/tri-p01-warehouse`, tạo từ nhánh cá nhân
`PhamBatri` ở commit `3dff23f`. Source nằm ngay trong project ổ D.

## Phạm vi

- F003: quản lý kho, gán quản lý hợp lệ, bật/tắt hoạt động.
- F004: quản lý vị trí, chuẩn hóa mã viết hoa, mã duy nhất trong từng kho.
- F005: tổng sức chứa vị trí không vượt sức chứa kho; không giảm sức chứa kho
  dưới phần đã phân bổ. Bao gồm vị trí ngừng hoạt động trong tổng phân bổ.
- Đơn vị sức chứa: tấn, BigDecimal. Nhiệt độ và độ ẩm là thông số cấu hình.
- Controller → Service → Repository, Entity, DTO record, MapStruct và tests.
- Tái sử dụng quyền WAREHOUSE/ADMIN, User, JWT, ApiResponse/ApiError của nhóm.
- Annotation và khai báo Java trên các dòng riêng.

DELETE là ngừng hoạt động, không xóa vật lý. Vị trí luôn được tìm bằng cả ID
kho và ID vị trí. Không thể sửa/kích hoạt vị trí trong kho đang ngừng hoạt động.

Các thao tác phân bổ dùng khóa PESSIMISTIC_WRITE trên kho trong transaction.
Đọc capacity dùng REPEATABLE_READ. Đây là sức chứa thiết kế; kiểm tra lượng hàng
thực tế và điều kiện riêng của lô thuộc phần tích hợp P02/P03.

## API

Tất cả cần token có quyền WAREHOUSE hoặc ADMIN.

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | /api/v1/warehouses | Tạo kho |
| GET | /api/v1/warehouses | Danh sách kho |
| GET | /api/v1/warehouses/{id} | Chi tiết |
| PUT | /api/v1/warehouses/{id} | Cập nhật |
| PUT | /api/v1/warehouses/{id}/status | Bật/tắt |
| DELETE | /api/v1/warehouses/{id} | Ngừng hoạt động |
| GET | /api/v1/warehouses/{id}/capacity | Tổng/đã phân bổ/chưa phân bổ |
| POST | /api/v1/warehouses/{warehouseId}/locations | Tạo vị trí |
| GET | /api/v1/warehouses/{warehouseId}/locations | Danh sách vị trí |
| GET | /api/v1/warehouses/{warehouseId}/locations/{id} | Chi tiết vị trí |
| PUT | /api/v1/warehouses/{warehouseId}/locations/{id} | Cập nhật vị trí |
| PUT | /api/v1/warehouses/{warehouseId}/locations/{id}/status | Bật/tắt vị trí |
| DELETE | /api/v1/warehouses/{warehouseId}/locations/{id} | Ngừng hoạt động vị trí |

Tạo kho:

```json
{
  "name": "Kho lạnh HCM",
  "location": "TP. Hồ Chí Minh",
  "managerId": null,
  "capacityTons": 10.00,
  "tempTargetC": 4.0,
  "humidityTarget": 85.0
}
```

Tạo vị trí dùng `code`, `name`, `capacityTons`, `tempTargetC` và
`humidityTarget`. Body status là `{"active": true}`.

## Kiểm thử trên source ổ D

Java 21.0.10, Maven 3.9.15: clean test BUILD SUCCESS.
46 test: **41 đạt, 5 skipped**, 0 thất bại, 0 lỗi.

- WarehouseControllersTest: 18 đạt, kiểm tra quyền và request thực qua MockMvc.
- WarehouseServiceTest: 8 đạt.
- StorageLocationServiceTest: 9 đạt.
- CapacityValidationServiceTest: 2 đạt.
- ProjectServiceTest/JwtTokenServiceTest sẵn có: 4 đạt.
- WarehousePersistenceTest: 5 chưa chạy vì Docker engine không hoạt động.

Log Docker xác nhận backend bị lỗi khi khởi tạo Inference manager. Chưa
kiểm chứng mapping, ràng buộc SQL hoặc transaction đồng thời trên PostgreSQL.
Không tính các test skipped là đã đạt.

## Database và bàn giao

`docs/warehouse/P01_schema.sql` là script schema bổ sung để review, không phải
backup dữ liệu thật. Chưa áp dụng lên database chung. Không thay đổi migration,
supabase_schema.sql, pom.xml, cấu hình hay code thành viên khác.

Cấu hình hiện tại có ddl-auto:update. Cần thống nhất schema trước khi chạy
ứng dụng với database chung. Không chạy script reset schema để cài P01.

Xem `docs/warehouse/QUY_TRINH_BAN_GIAO.md` và script backup theo module.
Không tự push, mở PR hoặc merge main. Feature được kiểm tra trước khi merge
nội bộ vào PhamBatri theo yêu cầu của Trí.
