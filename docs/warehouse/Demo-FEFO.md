# Demo kho từ phiếu nhập đến truy xuất QR

Dùng database PostgreSQL **riêng cho demo** có tên bắt đầu bằng `warehouse_demo_`, đã có schema của ứng dụng gồm P14. Trỏ ứng dụng demo và psql vào cùng database này. Nạp `Demo-FEFO.sql` bằng psql. SQL chỉ tạo lô, đơn và chuyến. Tồn kho được tạo bằng phiếu nhập. Chạy lại trong cùng ngày giữ nguyên các giao dịch đã thực hiện. Muốn diễn lại từ đầu, dùng bản sao demo trống.

1. Đăng nhập với vai trò `WAREHOUSE`. Tạo một kho và vị trí đang hoạt động, có sức chứa trên 16 kg. Mã demo dùng tiền tố `DEMO-YYYYMMDD` theo ngày của database.
2. Lập phiếu nhập. Tra mã hoặc quét tem lô có hậu tố `-A` (6 kg) và `-B` (10 kg), chọn vị trí, lưu nháp. Kiểm tra tồn chưa đổi. Xác nhận phiếu, kiểm tra tổng tồn là 16 kg.
3. Trong **FEFO & giữ hàng**, tra đơn có hậu tố `-ORDER`, giữ 8 kg. Tổng quan phải có 16 kg tồn thực tế, 8 kg đang giữ và 8 kg khả dụng.
4. Lập phiếu xuất từ lượt giữ, xác nhận đủ 8 kg. Lô A phải được xuất hết 6 kg, lô B xuất 2 kg và còn 8 kg. Bàn giao với mã biên bản demo và mã chuyến có hậu tố `-SHIP`.
5. Trên trang truy xuất, tra từng mã. Lô A và B phải hiển thị cùng mã chuyến, lần lượt 6 kg và 2 kg đã bàn giao. Lô `-C` chưa nhập phải hiển thị “Chưa ghi nhận nhập kho”. Nếu chưa gửi số đo, trang kho không có nhiệt độ đo thực tế.
6. Để kiểm tra kiểm kê, chọn lô B và vị trí rồi để trống số đếm: giao diện phải yêu cầu nhập. Khi nhập rõ 0, bước xác nhận hiển thị 8 → 0 kg. Có thể đóng hộp thoại nếu muốn giữ bộ dữ liệu cho lượt trình bày tiếp theo.
