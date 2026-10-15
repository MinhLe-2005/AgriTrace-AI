<img width="1906" height="970" alt="image" src="https://github.com/user-attachments/assets/f7c3db17-2b5b-4b0d-8eb4-181c88f52f09" />
<img width="1917" height="973" alt="image" src="https://github.com/user-attachments/assets/86fcc1a2-70f0-4158-9682-7246a1cf8343" />
<img width="1909" height="963" alt="image" src="https://github.com/user-attachments/assets/c952bc83-f621-49d3-8164-2c1947427150" />
<img width="1887" height="974" alt="image" src="https://github.com/user-attachments/assets/52841df6-978f-4940-906a-f846f8b364a2" />
<img width="1902" height="979" alt="image" src="https://github.com/user-attachments/assets/22bc5ead-d561-4883-8108-4b3d70b77557" />

# 🌿 AgriTrace AI — Hệ Thống Quản Lý Chuỗi Cung Ứng Nông Sản Sạch Tích Hợp Trí Tuệ Nhân Tạo

> Nền tảng web quản lý chuỗi cung ứng nông sản sạch tích hợp trí tuệ nhân tạo (AI).  
> Truy xuất nguồn gốc bằng mã QR độc bản, quản lý nông trại, kho lạnh, vận chuyển và đặt hàng trực tuyến.



---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Cơ sở dữ liệu](#-cơ-sở-dữ-liệu)
- [API Endpoints](#-api-endpoints)
- [Chức năng chính](#-chức-năng-chính)
- [Vai trò người dùng](#-vai-trò-người-dùng)
- [Biến môi trường](#-biến-môi-trường)

---

## 🌱 Tổng quan

**AgriTrace AI** là dự án xây dựng hệ thống web quản lý chuỗi cung ứng nông sản sạch, bao gồm:

- Quản lý tài khoản, phân quyền (5 vai trò)
- Quản lý nông trại, sản phẩm, lô thu hoạch, chứng nhận chất lượng
- Quản lý kho hàng (nhập/xuất/tồn kho)
- Theo dõi vận chuyển đơn hàng
- Truy xuất nguồn gốc nông sản qua **QR Code**
- Đặt hàng, giỏ hàng, thanh toán, voucher
- Chat trực tuyến giữa khách hàng và nhân viên (WebSocket)
- Chương trình khách hàng thân thiết: tích điểm, thăng hạng, đổi voucher
- AI Chatbot giải đáp thắc mắc sản phẩm + phân tích xu hướng tiêu thụ
- Dashboard thống kê doanh thu, tồn kho, hiệu suất chuỗi cung ứng

---

## 🏗 Kiến trúc hệ thống

```
┌──────────────────────────────────────────────────────────┐
│                      Nginx (port 80)                     │
│               Reverse Proxy + Static Files               │
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│   Frontend (port 3000) │    Backend API (port 8080)      │
│   Next.js 15 App       │    Spring Boot 3.4.2            │
│   React 19 + TS        │    Java 21 + Maven              │
│                        │                                 │
├────────────────────────┴─────────────────────────────────┤
│                                                          │
│   PostgreSQL 16 (port 5432)    Redis 7 (port 6379)       │
│   Dữ liệu chính               Cache & Sessions          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🛠 Công nghệ sử dụng

### Backend
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| Java | 21 | Ngôn ngữ chính |
| Spring Boot | 3.4.2 | Framework REST API |
| Spring Security | 6.x | Xác thực & phân quyền |
| Spring Data JPA | 3.x | ORM, truy vấn database |
| Flyway | — | Quản lý migration database |
| JWT (jjwt) | 0.12.6 | Token xác thực |
| MapStruct | 1.6.3 | Mapping DTO ↔ Entity |
| PostgreSQL | 16 | Cơ sở dữ liệu quan hệ |
| Maven | 3.9+ | Quản lý dependencies |
| Springdoc OpenAPI | 2.7.0 | Swagger API documentation |

### Frontend
| Công nghệ | Phiên bản | Mô tả |
|---|---|---|
| Next.js | 15.2.4 | React framework (App Router) |
| React | 19.0.0 | UI library |
| TypeScript | 5.8 | Type‑safe JavaScript |
| Tailwind CSS | 3.4 | Utility‑first CSS |
| Zustand | 5.0 | State management |
| TanStack Query | 5.66 | Server state & caching |
| React Hook Form | 7.54 | Form handling |
| Zod | 3.24 | Schema validation |
| Axios | 1.8 | HTTP client |
| Lucide React | 0.475 | SVG icon library |

### Hạ tầng
| Công nghệ | Mô tả |
|---|---|
| Docker & Docker Compose | Container hoá toàn bộ hệ thống |
| Nginx | Reverse proxy, phân phối frontend |
| Redis 7 | Cache sessions & data |

---

## 📁 Cấu trúc thư mục

```
AI_Vegetable/
├── backend/                          # Spring Boot REST API
│   ├── src/main/java/.../            # Java source
│   │   ├── config/                   # Cấu hình ứng dụng
│   │   ├── controller/               # REST Controllers
│   │   ├── dto/                      # Data Transfer Objects
│   │   ├── entity/                   # JPA Entities
│   │   ├── exception/                # Custom exceptions
│   │   ├── mapper/                   # MapStruct mappers
│   │   ├── repository/               # Spring Data JPA repos
│   │   ├── security/                 # JWT filter, UserDetails
│   │   ├── service/                  # Business logic
│   │   └── util/                     # Utilities
│   ├── src/main/resources/           # config & migrations
│   │   ├── application.yml
│   │   └── db/migration/            # Flyway SQL files (V1, V2, V3)
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                         # Next.js 15 App Router
│   ├── src/app/                      # Pages (App Router)
│   │   ├── page.tsx                  # Landing page (Hero, FAQ, Blog preview)
│   │   ├── products/                 # Danh mục nông sản & trái cây
│   │   ├── seasons/                  # Lịch mùa vụ & sản lượng
│   │   ├── traceability/             # Quét mã QR truy xuất nguồn gốc
│   │   ├── vouchers/                 # Kho mã giảm giá & freeship
│   │   ├── loyalty/                  # Tích điểm & Hạng thành viên (4 hạng)
│   │   ├── ai-hub/                   # 3 Giải pháp AI (Chatbot, Forecast, Risks)
│   │   ├── farming-techniques/       # Kỹ thuật chăm sóc cây trồng (VietGAP)
│   │   ├── knowledge/                # Chuyên đề xuất khẩu & Tips & Tricks
│   │   ├── about/                    # Về chúng tôi (Sứ mệnh, đối tác)
│   │   ├── blog/                     # Tin tức & bản tin nông sản sạch
│   │   ├── guides/                   # Cẩm nang hướng dẫn 4 vai trò
│   │   ├── faq/                      # Câu hỏi thường gặp
│   │   ├── contact/                  # Liên hệ hợp tác nông nghiệp
│   │   ├── chat/                     # Chat trực tuyến WebSocket
│   │   ├── cart/                     # Giỏ hàng & thanh toán
│   │   ├── login/ & register/        # Xác thực JWT & phân quyền
│   │   └── dashboard/                # 5 Cổng phân quyền
│   │       ├── admin/                # Quản trị viên (Audit, duyệt chứng chỉ)
│   │       ├── farmer/               # Nông dân (Nông trại, lô & mã QR)
│   │       ├── warehouse/            # Nhân viên kho (Nhập/xuất FEFO)
│   │       ├── distributor/          # Nhà phân phối (Theo dõi vận chuyển)
│   │       └── customer/             # Khách hàng (Đơn hàng & tích điểm)
│   ├── src/components/               # UI components, layout & floating AI assistant
│   ├── src/stores/                   # Zustand stores (auth, cart, toast)
│   ├── public/images/                # Ảnh minh họa nông trại, QR, nông sản
│   └── package.json
│
├── docker/                           # Docker setup (Nginx config)
├── compose.yaml                      # Docker Compose
├── start-all.ps1                     # Script khởi động tự động toàn bộ hệ thống
├── .env.example                      # Mẫu biến môi trường
├── .gitignore                        # Git ignore rules chuẩn
└── README.md                         # Tài liệu hướng dẫn dự án
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống
| Phần mềm | Phiên bản |
|---|---|
| Node.js | 20+ |
| Java JDK | 21 |
| Maven | 3.9+ |
| PostgreSQL | 16+ |
| Redis | 7+ |
| Docker (tuỳ chọn) | 24+ |

### Cách 1: Chạy từng service (Development)
1. **Tạo file `.env` từ mẫu**
   ```bash
   cp .env.example .env
   # Sửa thông tin PostgreSQL, JWT secret trong .env
   ```
2. **Chạy Backend**
   ```bash
   cd backend
   mvn spring-boot:run -Dspring-boot.run.profiles=dev
   # Backend chạy tại http://localhost:8080
   # Swagger UI: http://localhost:8080/swagger-ui/index.html
   ```
3. **Chạy Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Frontend chạy tại http://localhost:3000
   ```

### Cách 2: Chạy bằng Docker Compose
```bash
cp .env.example .env
# Sửa biến môi trường trong .env

docker compose up -d
# Toàn bộ hệ thống chạy tại http://localhost
```

---

## 🗄 Cơ sở dữ liệu

### Sơ đồ ERD (hiện tại)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│    roles     │     │  user_roles  │     │      users       │
├──────────────┤     ├──────────────┤     ├──────────────────┤
│ id (PK)      │◄────│ role_id (FK) │     │ id (UUID, PK)    │
│ name         │     │ user_id (FK) │────►│ email            │
└──────────────┘     └──────────────┘     │ password_hash    │
                                          │ full_name        │
                                          │ active           │
                                          │ created_at       │
                                          │ updated_at       │
                                          └────────┬─────────┘
                                                   │
                                                   │ 1:N
                                                   ▼
                     ┌──────────────────┐   ┌──────────────────┐
                     │ refresh_tokens   │   │    projects      │
                     ├──────────────────┤   ├──────────────────┤
                     │ id (UUID, PK)    │   │ id (UUID, PK)    │
                     │ token_id         │   │ name             │
                     │ user_id (FK)     │   │ description      │
                     │ expires_at       │   │ status           │
                     │ revoked          │   │ owner_id (FK)    │
                     │ created_at       │   │ created_at       │
                     └──────────────────┘   │ updated_at       │
                                            └──────────────────┘
```

### Migration files
- `V1__create_core_schema.sql` – Tạo bảng `users`, `roles`, `user_roles`, `projects`, `refresh_tokens`
- `V2__seed_roles.sql` – Thêm 5 vai trò: ADMIN, FARMER, WAREHOUSE_STAFF, DISTRIBUTOR, CUSTOMER
- `V3__enforce_case_insensitive_emails.sql` – Email không phân biệt hoa/thường

---

## 📡 API Endpoints
### Authentication (`/api/v1/auth`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/register` | Đăng ký tài khoản mới | ❌ |
| POST | `/login` | Đăng nhập, nhận JWT | ❌ |
| POST | `/refresh` | Làm mới access token | ❌ |
| POST | `/logout` | Đăng xuất, hủy refresh token | ✅ |

### Users (`/api/v1/users`) – Admin only
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách người dùng | ✅ ADMIN |
| GET | `/{id}` | Chi tiết người dùng | ✅ ADMIN |
| POST | `/` | Tạo người dùng mới | ✅ ADMIN |
| PUT | `/{id}` | Cập nhật người dùng | ✅ ADMIN |
| DELETE | `/{id}` | Xóa người dùng | ✅ ADMIN |

### Projects (`/api/v1/projects`)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách dự án | ✅ |
| GET | `/{id}` | Chi tiết dự án | ✅ |
| POST | `/` | Tạo dự án mới | ✅ |
| PUT | `/{id}` | Cập nhật dự án | ✅ |
| DELETE | `/{id}` | Xóa dự án | ✅ |

---

## ✨ Chức năng chính
### Đã hoàn thành ✅
- [x] Đăng ký / Đăng nhập / Đăng xuất (JWT + Refresh Token)
- [x] Phân quyền theo vai trò (RBAC)
- [x] CRUD người dùng (Admin)
- [x] CRUD dự án
- [x] Landing page AgriTrace AI (light theme, Lucide icons, ảnh thật)
- [x] Trang đăng nhập / đăng ký (split‑screen layout)
- [x] Dashboard với sidebar, stat cards, bảng dữ liệu
- [x] Responsive design (mobile + desktop)
- [x] Docker Compose multi‑service deployment
- [x] Flyway database migrations
- [x] Swagger API documentation

### Sắp phát triển 🔜
- [ ] Quản lý nông trại & lô thu hoạch
- [ ] Quản lý sản phẩm theo mùa vụ
- [ ] Truy xuất nguồn gốc QR Code
- [ ] Quản lý kho hàng (nhập/xuất/tồn)
- [ ] Theo dõi vận chuyển
- [ ] Giỏ hàng & đặt hàng & thanh toán
- [ ] Chat trực tuyến (WebSocket)
- [ ] Voucher & mã giảm giá
- [ ] Tích điểm & thăng hạng thành viên
- [ ] AI Chatbot (tích hợp LLM)
- [ ] Dashboard thống kê nâng cao

---

## 👥 Vai trò người dùng
| Vai trò | Mô tả | Quyền chính |
|---|---|---|
| **Admin** | Quản trị viên | Quản lý toàn hệ thống, tài khoản, phân quyền, voucher, báo cáo |
| **Farmer** | Nông dân | Quản lý nông trại, lô thu hoạch, chứng nhận, tạo voucher riêng |
| **Warehouse Staff** | Nhân viên kho | Nhập/xuất kho, kiểm soát tồn kho, cảnh báo hàng hết |
| **Distributor** | Nhà phân phối | Tiếp nhận hàng, cập nhật trạng thái vận chuyển |
| **Customer** | Khách hàng | Tìm kiếm, đặt hàng, quét QR, tích điểm, chat |

---

Đồ án tốt nghiệp © 2026 — AgriTrace AI Team

