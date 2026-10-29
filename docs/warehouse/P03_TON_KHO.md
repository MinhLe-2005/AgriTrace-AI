# P03 — Tồn kho và nhật ký

Nhánh `feat/tri-p03-inventory`, tạo sau khi P02 được gộp vào PhamBatri.

- F009: tồn theo kho, vị trí và lô, dùng StockBalance.
- F010: ledger chỉ đọc, có thời gian, phiếu nguồn, người thực hiện, biến động và tồn sau.
- F011: tồn khả dụng = tồn thực tế trừ giữ hàng đang hiệu lực; bằng 0 nếu hàng bị
  cách ly, quá hạn, kho/vị trí ngừng hoạt động, lô bị thu hồi duyệt hoặc thông tin
  định danh/hạn dùng Farmer thay đổi. Giữ lại tồn thực và lịch sử để đối soát.
- Không dùng qty của Farmer làm số dư Warehouse. Không có endpoint ghi trực tiếp số dư.

## API

- GET /api/v1/warehouses/{id}/inventory
  - page từ 0, size 1–500 (mặc định 100).
  - lotId, locationId và onlyAvailable là bộ lọc tùy chọn.
- GET /api/v1/warehouses/{id}/movements?from=yyyy-MM-dd&to=yyyy-MM-dd&page=0
  - 100 dòng/trang; from/to bao gồm cả hai ngày theo giờ Việt Nam.
  - Khoảng ngày có thứ tự và tối đa một năm.

Chỉ WAREHOUSE/ADMIN. Lỗi phân trang/ngày trả 400. Không sửa schema chung.

## Kiểm thử

Suite trước kiểm tra API bổ sung: 72 test đạt trên PostgreSQL tạm, không skipped.
Năm test P03 mới kiểm tra giữ hàng hết hạn, cách ly, kho/vị trí ngừng, Farmer thu
hồi duyệt/xóa lô và khoảng ngày không hợp lệ. API bổ sung kiểm tra quyền của
hai endpoint mới và chặn page âm.

Đã chuẩn hóa lại cách xuống dòng annotation theo yêu cầu của Trí.
