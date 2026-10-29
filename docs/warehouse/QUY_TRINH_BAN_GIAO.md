# Warehouse của Trí: quy trình làm và bàn giao

Luồng đã thống nhất: nhánh feature → kiểm thử → kiểm tra xung đột → merge vào
`PhamBatri`. Chỉ Trí tự push và tạo PR từ `PhamBatri` vào nhánh chính ở bước
cuối, sau khi xem lại toàn bộ thay đổi. Agent không tự push, tạo PR hoặc merge
vào nhánh chính.

## Giai đoạn hiện tại: P01

`feat/tri-p01-warehouse` gồm F003 quản lý kho, F004 vị trí và F005 phân bổ
sức chứa. Giữ Controller → Service → Repository, DTO và MapStruct của dự án.
Annotation và khai báo Java ở dòng riêng theo yêu cầu của Trí.

P01 báo sức chứa thiết kế theo tấn; sức chứa thực tế theo tồn sẽ được nối ở
P02/P03. Chưa sửa User, Security, Farmer, Order, Shipment hay cấu hình dùng chung.

## File database

- `P01_schema.sql`: script bổ sung cấu trúc Warehouse để nhóm review, có
  transaction và không reset schema. Đây **không phải bản xuất dữ liệu thật**.
  Chưa chạy trên Supabase/database nhóm. Bảng `users` dùng chung cần tồn tại.
- `Backup-Warehouse.ps1`: xuất schema và dữ liệu của đúng hai bảng Warehouse
  bằng pg_dump khi người vận hành cung cấp kết nối. Script từ chối ghi đè backup.
  Đây là backup theo module; khi khôi phục cần có bảng và dữ liệu User được tham
  chiếu bởi manager_id. Không phải backup đầy đủ ứng dụng.

Ví dụ người vận hành tự chạy sau khi cấu hình biến môi trường PostgreSQL:

```powershell
.\docs\warehouse\Backup-Warehouse.ps1 -OutputFile .\warehouse-p01.dump
pg_restore --list .\warehouse-p01.dump
```

Không đưa mật khẩu, .env hoặc bản sao dữ liệu cá nhân vào Git.

## Kiểm tra trước khi merge nội bộ

1. Working tree sạch và commit chỉ chứa file thuộc Warehouse.
2. Unit/API tests đạt; PostgreSQL tests phải ghi rõ đạt hay bị bỏ qua.
3. `git merge-tree --write-tree --name-only PhamBatri feat/tri-p01-warehouse`
   trả exit code 0 mới merge nội bộ.
4. Merge feature vào PhamBatri bằng `git merge --no-ff <feature>`.
5. Kiểm tra lại working tree và danh sách file thay đổi.

Trước PR cuối, cập nhật origin/main và dùng merge-tree để kiểm tra xung đột;
không tự merge origin/main hoặc đưa code Warehouse vào main.
