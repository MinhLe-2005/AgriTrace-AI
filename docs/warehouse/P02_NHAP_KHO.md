# P02 — Nhập kho

Nhánh `feat/tri-p02-inbound`, tạo từ PhamBatri sau P01. Giữ phạm vi Warehouse.

## Hoạt động

- Lập phiếu nháp nhiều dòng theo lô và vị trí.
- Xác nhận phiếu trong một transaction: tăng số dư và ghi ledger.
- Xác nhận lại cùng phiếu trả kết quả cũ, không tăng tồn lần hai.
- Hủy phiếu nháp; không hủy phiếu đã ghi nhận.
- Kiểm tra kho/vị trí hoạt động, lô đã duyệt, hạn dùng và sức chứa thực theo kg.
- Tổng nhập của cùng lô ở mọi kho không vượt sản lượng Farmer khai báo.
- Khóa kho và khóa lô theo thứ tự ổn định; kiểm thử hai kho nhập đồng thời.
- Chặn giảm sức chứa vị trí dưới lượng hàng đang chứa.

## Hợp đồng Farmer đã đối chiếu

Đã đọc origin/main commit `bcbb27f`: entity Farmer là bảng `agri_harvest_lots`
với ID Long; product, qty, expiryDate và status là chuỗi. Warehouse dùng adapter
JDBC chỉ đọc/khóa hàng, không tạo hoặc sửa entity, controller hay bảng Farmer.

- ID lô được chuẩn hóa thành chuỗi biểu diễn ID số để lưu tham chiếu ngoài module.
- `Đã duyệt xuất kho` được ánh xạ thành trạng thái đủ điều kiện.
- Hạn dùng chấp nhận ISO yyyy-MM-dd hoặc dd/MM/yyyy hợp lệ.
- qty phải là số dương không có dấu phân nhóm hoặc chữ đơn vị.
- Đơn vị kg, g, t/ton/tấn được đổi sang KG; hộp/bó cần hợp đồng trọng lượng,
  không tự ước lượng.
- Do Farmer hiện chỉ lưu tên sản phẩm, productId trong DTO Warehouse tạm là
  tên sản phẩm nguyên bản. Đây không phải UUID của bảng products trong SQL cũ.
  Cần nhóm bổ sung khóa sản phẩm ổn định nếu muốn phân biệt các SKU trùng tên.
- Nếu schema chưa có hoặc dữ liệu không chuyển đổi an toàn: trả 503 với mã
  WAREHOUSE_INTEGRATION_UNAVAILABLE. Không tạo dữ liệu mẫu để che lỗi.

## API

Gốc: `/api/v1/warehouses/{warehouseId}/inbound-receipts`.

| Method | Suffix | Chức năng |
|---|---|---|
| POST | / | Lập phiếu |
| GET | /?page=0 | Danh sách, 100 phiếu/trang |
| GET | /{id} | Chi tiết |
| PUT | /{id}/confirm | Xác nhận |
| PUT | /{id}/cancel | Hủy nháp |
| GET | /eligible-lots | Tối đa 200 lô đã duyệt gần nhất, bỏ lô quá hạn |

Body ví dụ:

```json
{
  "note": "Nhập từ nông trại",
  "lines": [
    { "lotId": "1", "locationId": "<UUID vị trí>", "quantityKg": 100.000 }
  ]
}
```

Mọi endpoint cần quyền WAREHOUSE hoặc ADMIN. Người lập/xác nhận lấy từ token,
không nhận actor từ request body.

## Database và kiểm thử

`P02_schema.sql` bổ sung bảng Warehouse riêng sau P01. Có phiếu, dòng phiếu,
số dư, ledger và phần lưu trữ nền tảng cho giữ hàng ở P04. Chưa tạo API giữ hàng
hay thay đổi Order. Không sửa bảng tồn cũ hoặc chuyển dữ liệu cũ tự động.

Ngày 29/10/2026: **67 test đạt, 0 lỗi, 0 skipped** trên PostgreSQL 16.15 tạm,
chỉ bind 127.0.0.1:55439. Cả 5 test PostgreSQL P01 trước đây bị bỏ qua đã chạy đạt.

Có kiểm thử API với SecurityConfig thật; SQL P01/P02 được thực thi trên database
riêng và kiểm tra constraint. Các bài nhập kho kiểm chứng rollback nhiều dòng,
quy đổi trọng lượng, giới hạn lô, xác nhận lặp, mã lô chuẩn hóa, trạng thái và
các tình huống đồng thời. Không sử dụng database chung hoặc dữ liệu thật.

Tests nhận WAREHOUSE_TEST_DATABASE_URL có dạng
jdbc:postgresql://127.0.0.1:<port>/warehouse_test_<tên>; từ chối địa chỉ khác.
Mỗi bộ test dùng database con riêng. Nếu không có biến này, thử Testcontainers.

Schema bàn giao là script cấu trúc, không phải bản dump dữ liệu của nhóm.
