# P01 — Warehouse Management (Trí)

## Đối chiếu source trước triển khai

- Base: `main`, commit `3dff23f`; remote `MinhLe-2005/AgriTrace-AI`.
- Java 21, Spring Boot 3.4.2, Spring Data JPA, PostgreSQL, Bean Validation, MapStruct.
- Giữ package `com.example.myfullstackapp`: `controller`, `service`, `repository`, `entity`, `mapper`, `dto`, `exception`.
- Service là class cụ thể, constructor injection, `@Transactional`; DTO dùng record; mapper dùng MapStruct.
- API theo `/api/v1`, tái sử dụng `ApiResponse`, `ApiError`, `GlobalExceptionHandler` và JWT hiện có.
- Bổ sung `WarehouseExceptionHandler` chỉ áp dụng cho hai controller mới: request body thiếu/JSON lỗi/UUID sai trong body trả 400 theo envelope hiện có, không sửa handler dùng chung.
- Chưa có Java `Warehouse`, `StorageLocation`, inventory hay receipt. `warehouses` đã có trong `supabase_schema.sql`; mapping mới dùng nguyên tên cột, kiểu UUID và đơn vị tấn của bảng này.
- Tái sử dụng `User`, `UserRepository`, `RoleName.WAREHOUSE` và `ADMIN`; không tạo bản sao dữ liệu dùng chung.
- Không thấy `AGENTS.md`, `CONTRIBUTING` hay PR template trong repo. Các nhánh tính năng hiện dùng tiền tố `feat/`; P01 dùng `feat/warehouse-management`, PR vào `main` để nhóm review.
- `main` có migration V1–V3; nhánh `tuanviet` đã có `V4__create_verification_requests.sql`. P01 dành số V5 để tránh trùng phiên bản. Trước khi bật Flyway, nhóm cần gộp/đối chiếu đầy đủ thứ tự V4 rồi V5.
- Cấu hình thực tế `application.yml` và profile dev đang **tắt Flyway**, `ddl-auto: update`. README mô tả Flyway nhưng không phản ánh cấu hình này.

## Phạm vi và quy tắc

Warehouse và StorageLocation có Entity, Repository, Service, Controller, DTO, MapStruct mapper và kiểm thử. Chỉ `WAREHOUSE`/`ADMIN` được dùng các endpoint mới, theo cơ chế method security sẵn có. Theo mô hình quyền hiện tại, các tài khoản thuộc hai vai trò này quản lý chung danh mục kho; chưa có phân công quyền theo từng kho.

- `managerId` có thể bỏ trống; nếu có phải tham chiếu tài khoản đang hoạt động với vai trò Warehouse hoặc Admin. `PUT` với `managerId: null` bỏ gán quản lý.
- Tên và địa chỉ được trim; mã vị trí gồm chữ Latin, số, `_`, `-`, bắt đầu bằng chữ hoặc số, tối đa 50 ký tự, được lưu viết hoa. Mã duy nhất trong từng kho, kể cả vị trí đã ngừng hoạt động; hai kho được dùng cùng mã.
- Sức chứa dùng `BigDecimal`, đơn vị **tấn**, lớn hơn 0, tối đa 8 chữ số phần nguyên và 2 chữ số thập phân. Nhiệt độ theo °C với 1 chữ số thập phân trong miền `NUMERIC(4,1)`; độ ẩm 0–100%, tối đa 1 chữ số thập phân. Các target là thông số cấu hình, không phải dữ liệu cảm biến hay tiêu chuẩn riêng của sản phẩm.
- Tổng sức chứa mọi vị trí trong kho, **bao gồm vị trí ngừng hoạt động**, không được lớn hơn sức chứa kho. Cho phép bằng giới hạn. Giảm sức chứa kho/vị trí cũng kiểm tra lại tổng; ngừng hoạt động không tự giải phóng sức chứa đã phân bổ.
- Thao tác tạo/sửa vị trí và cập nhật kho cùng khóa hàng kho bằng `PESSIMISTIC_WRITE` trong transaction trước khi tính tổng. Các lời gọi đồng thời qua service không được phân bổ vượt giới hạn. Tác vụ ghi trực tiếp DB hoặc module tương lai cũng phải tuân thủ khóa này.
- Vị trí được truy cập theo cả `warehouseId` và `id`, không thể đổi kho bằng request cập nhật.
- Kho ngừng hoạt động vẫn đọc được, không cho tạo/sửa/kích hoạt vị trí. Cho phép ngừng hoạt động vị trí. Trạng thái riêng của vị trí được giữ nguyên khi tắt/bật kho; P02 phải kiểm tra **cả kho và vị trí** đang hoạt động khi nhập hàng.
- `DELETE` là ngừng hoạt động (`active=false`), trả 204; giữ dữ liệu và quan hệ, có thể bật lại qua endpoint status. Không xóa vật lý.

## API

Mọi endpoint cần `Authorization: Bearer <access-token>` có vai trò Warehouse hoặc Admin.

| Method | Path | Kết quả |
|---|---|---|
| POST | `/api/v1/warehouses` | Tạo kho, 201 và header Location |
| GET | `/api/v1/warehouses` | Danh sách kho, sắp xếp theo tên/ID |
| GET | `/api/v1/warehouses/{id}` | Chi tiết kho |
| PUT | `/api/v1/warehouses/{id}` | Cập nhật đầy đủ thông tin kho |
| PUT | `/api/v1/warehouses/{id}/status` | `{ "active": true/false }` |
| DELETE | `/api/v1/warehouses/{id}` | Ngừng hoạt động, 204 |
| GET | `/api/v1/warehouses/{id}/capacity` | Sức chứa tổng/đã phân bổ/chưa phân bổ |
| POST | `/api/v1/warehouses/{warehouseId}/locations` | Tạo vị trí, 201 và header Location |
| GET | `/api/v1/warehouses/{warehouseId}/locations` | Danh sách vị trí, sắp xếp theo mã |
| GET | `/api/v1/warehouses/{warehouseId}/locations/{id}` | Chi tiết vị trí |
| PUT | `/api/v1/warehouses/{warehouseId}/locations/{id}` | Cập nhật đầy đủ vị trí |
| PUT | `/api/v1/warehouses/{warehouseId}/locations/{id}/status` | `{ "active": true/false }` |
| DELETE | `/api/v1/warehouses/{warehouseId}/locations/{id}` | Ngừng hoạt động, 204 |

Dùng `PUT` cho status để phù hợp danh sách CORS methods hiện có, không sửa SecurityConfig của thành viên khác.

Tạo/cập nhật kho:

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

Tạo/cập nhật vị trí:

```json
{
  "code": "A-01",
  "name": "Kệ A-01",
  "capacityTons": 2.50,
  "tempTargetC": 4.0,
  "humidityTarget": 85.0
}
```

Response dùng `ApiResponse.data`. Lỗi 400 khi dữ liệu không hợp lệ, 401 khi chưa đăng nhập, 403 khi sai quyền, 404 khi không tìm thấy kho/vị trí/manager, 409 khi mã trùng, vượt phân bổ hoặc kho ngừng hoạt động. Giữ nguyên envelope và thông báo conflict chung của `GlobalExceptionHandler`.

## Cơ sở dữ liệu và tích hợp

Migration bổ sung: `backend/src/main/resources/db/migration/V5__create_warehouse_management.sql`. Không sửa migration của thành viên khác hay chạy lại `supabase_schema.sql` (script tổng chứa reset schema). V5 tạo kho nếu chưa có, giữ bảng/dữ liệu kho hiện có, thêm ràng buộc sức chứa/điều kiện và bảng `storage_locations` với FK, mã duy nhất trong kho, check constraints.

**Cần áp dụng V5 trước khi tích hợp lên môi trường dùng chung.** Với cấu hình hiện tại, Flyway không tự chạy. Nhóm cần review rồi chạy riêng V5 một lần theo quy trình DB đang dùng. Nếu bảng `storage_locations` đã được Hibernate tạo tự động ở máy thử nghiệm, phải đối chiếu schema và baseline migration trước; V5 không phải script để chạy lặp. Các hàng kho cũ không hợp lệ phải được xử lý trước khi thêm constraints. Không bật lại toàn bộ Flyway hoặc đổi cấu hình chung chỉ để tích hợp P01.

P01 chưa đọc `warehouse_inventory` và không diễn giải `HarvestLot.quantity` thành tồn kho. Endpoint capacity báo phân bổ thiết kế, **không phải sức chứa trống theo lượng hàng thực tế**. P02 sẽ cần hợp đồng đơn vị KG/tấn, tồn theo vị trí, kiểm tra sức chứa khi nhập/chuyển hàng, chặn giảm sức chứa dưới tồn thực, kiểm tra lô đã duyệt và điều kiện sản phẩm. Không tự tạo `HarvestLot`, `Order`, auth hay bảng tồn kho thay thành viên khác; chưa chuyển dữ liệu `warehouse_inventory.zone_bin` thành FK vị trí.

## Kiểm thử

Chạy từ `backend` bằng Java 21 và Maven: `mvn test`.

- Service: quản lý hợp lệ, dữ liệu không tồn tại, chuẩn hóa mã, trùng mã, sức chứa đúng giới hạn/vượt giới hạn, giảm sức chứa, truy cập vị trí sai kho, trạng thái và không xóa dữ liệu.
- MockMvc dùng SecurityConfig thật: 401/403, quyền Warehouse/Admin, CRUD, status, validation request và response/error envelope hiện có.
- `WarehousePersistenceTest` dùng PostgreSQL 16 Testcontainers: Flyway trên DB mới, mapping/thời gian tạo, unique/check constraints, giữ dữ liệu kho cũ, hai tạo vị trí đồng thời và giảm sức chứa kho đồng thời với tạo vị trí. Không kết nối Supabase của nhóm.
- Cần Docker engine đang chạy để thực thi 5 kiểm thử PostgreSQL; nếu không có engine, chúng được đánh dấu skipped, không được xem là đã kiểm chứng DB/concurrency.
