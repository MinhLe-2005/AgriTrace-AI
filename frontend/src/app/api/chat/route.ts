import { NextRequest, NextResponse } from "next/server";

// Fallback catalog reflecting the exact live database & active seasonal campaigns
const LIVE_CATALOG = [
  {
    name: "Dâu Tây New Zealand Mộc Châu",
    basePrice: 210000,
    currentPrice: 170100, // 210.000 - 19% (trợ giá 39.900đ)
    discountPercent: 19,
    discountAmount: 39900,
    unit: "Hộp 500g",
    batchCode: "LOT-DT-2026-11",
    altBatch: "DT-MC-2026-11",
    campaign: "Mùa Thu Hoạch Dâu Tây New Zealand Mộc Châu",
    origin: "HTX Nông Sản Sạch Mộc Châu (Sơn La)",
    cert: "GlobalGAP / VietGAP",
    pesticide: "Kiểm định NIFC tồn dư BVTV = 0",
    coldChain: "Bảo quản xe lạnh 2°C – 5°C",
    keywords: ["dau", "dau tay", "strawberry", "moc chau", "dt-mc", "lot-dt"],
  },
  {
    name: "Cam Sành Hàm Yên Tép Vàng Mọng Nước",
    basePrice: 55000,
    currentPrice: 45000, // 55.000 - 18% (trợ giá 10.000đ)
    discountPercent: 18,
    discountAmount: 10000,
    unit: "KG",
    batchCode: "SP-CS-03",
    altBatch: "CS-HY-2026-03",
    campaign: "Đại Tiệc Cam Sành Hàm Yên & Bố Hạ Chính Vụ",
    origin: "HTX Cam Sành Hàm Yên (Tuyên Quang)",
    cert: "VietGAP",
    pesticide: "BVTV = 0, đạt chuẩn an toàn sinh học",
    coldChain: "Kho mát 2°C – 5°C",
    keywords: ["cam", "cam sanh", "ham yen", "cs-hy", "sp-cs"],
  },
  {
    name: "Xà Lách Lô Lô Xanh Thủy Canh",
    basePrice: 42000,
    currentPrice: 33600, // 42.000 - 20% (trợ giá 8.400đ)
    discountPercent: 20,
    discountAmount: 8400,
    unit: "KG",
    batchCode: "LOT-XL-2026-08",
    altBatch: "XL-2026-08",
    campaign: "Chiến Dịch Trợ Giá Rau Ăn Lá Thủy Canh Đà Lạt",
    origin: "Nông Trại Xanh Thủy Canh Đà Lạt (Lâm Đồng)",
    cert: "GlobalGAP / VietGAP",
    pesticide: "Quatest 1 BVTV = 0",
    coldChain: "Thu hoạch 05:30 sáng, xe lạnh 2°C – 5°C",
    keywords: ["xa lach", "lo lo", "rau", "thuy canh", "xl-2026", "lot-xl"],
  },
  {
    name: "Cải Xoăn Kale Hữu Cơ Dinh Dưỡng",
    basePrice: 75000,
    currentPrice: 60000, // 75.000 - 20% (trợ giá 15.000đ)
    discountPercent: 20,
    discountAmount: 15000,
    unit: "KG",
    batchCode: "SP-KL-05",
    altBatch: "KL-2026-05",
    campaign: "Chiến Dịch Trợ Giá Rau Ăn Lá Thủy Canh Đà Lạt",
    origin: "Nông Trại Xanh Thủy Canh Đà Lạt (Lâm Đồng)",
    cert: "Organic BioCert",
    pesticide: "100% hữu cơ, không hóa chất",
    coldChain: "Bảo quản mát 2°C – 5°C",
    keywords: ["kale", "cai xoan", "cai kale", "sp-kl"],
  },
  {
    name: "Bơ Sáp 034 Đặc Sản Cao Nguyên",
    basePrice: 90000,
    currentPrice: 74700, // 90.000 - 17% (trợ giá 15.300đ)
    discountPercent: 17,
    discountAmount: 15300,
    unit: "KG",
    batchCode: "SP-BO-06",
    altBatch: "BO-034",
    campaign: "Tuần Lễ Xả Kho Tươi Cuối Vụ Bơ Sáp 034",
    origin: "Bảo Lộc (Lâm Đồng)",
    cert: "VietGAP",
    pesticide: "BVTV = 0",
    coldChain: "Bảo quản kho mát 5°C",
    keywords: ["bo", "bo sap", "034", "sp-bo"],
  },
  {
    name: "Cà Chua Bi Cherry Đỏ Ngọt",
    basePrice: 60000,
    currentPrice: 50000, // Giảm 17%
    discountPercent: 17,
    discountAmount: 10000,
    unit: "KG",
    batchCode: "SP-CC-04",
    altBatch: "CC-04",
    campaign: "Vụ Mùa Cà Chua Bi Cherry",
    origin: "Nông Trại Xanh Thủy Canh Đà Lạt",
    cert: "VietGAP",
    pesticide: "BVTV = 0",
    coldChain: "Xe lạnh 2°C – 5°C",
    keywords: ["ca chua", "cherry", "sp-cc"],
  },
];

const FAQ_KNOWLEDGE_PROMPT = `
KHO TRI THỨC TOÀN BỘ FAQ, CHÍNH SÁCH & QUY ĐỊNH AGRITRACE (BẮT BUỘC NẮM VỮNG ĐỂ TRẢ LỜI CHÍNH XÁC MỌI CÂU HỎI):
1. CHUỖI LẠNH & GIAO HÀNG (/faq, /about):
   - Vận chuyển bằng xe lạnh chuyên dụng AgriCold-Chain duy trì liên tục 2°C – 5°C với cảm biến IoT theo dõi thời gian thực.
   - Phí ship xe lạnh đồng giá 25.000 đ/đơn; MIỄN PHÍ VẬN CHUYỂN (Freeship) cho đơn hàng từ 150.000 đ trở lên hoặc khi dùng mã FREESHIP.
   - Nông sản thu hoạch từ 05:30 sáng và giao nhanh nội thành trong 2 giờ (nhận ngay trong ngày).
   - 3 khung giờ giao hàng cố định mỗi ngày: Sáng (08:00 – 11:00), Chiều (14:00 – 17:00), Tối (18:00 – 21:00).

2. CHÍNH SÁCH ĐỔI TRẢ 1-ĐỔI-1 (24H) & HOÀN TIỀN 2 GIỜ (/faq):
   - Cam kết đổi trả 1-đổi-1 miễn phí hoặc hoàn tiền 100% trong vòng 24 giờ kể từ lúc nhận hàng nếu nông sản bị dập nát, hư hỏng, sai loại hoặc lỗi nhiệt độ chuỗi lạnh.
   - Quy trình 3 bước nhanh chóng: (1) Chụp ảnh / quay video rõ tình trạng mở thùng -> (2) Vào Đơn Mua chọn "Khiếu nại / Hoàn tiền" hoặc bấm nút "Hỗ trợ tổng đài" để chat trực tiếp với Admin CSKH (hoặc gọi 1900 888 666) -> (3) Nhận bù hàng mới ở chuyến sớm nhất hoặc nhận hoàn tiền 100% qua VietQR trong 2 giờ sau đối soát. Khách KHÔNG phải gửi trả lại rau hỏng.

3. TRUY XUẤT NGUỒN GỐC MÃ QR GS1 & CHỨNG NHẬN VIETGAP (/traceability, /faq):
   - Mỗi sản phẩm đều dán tem QR chuẩn quốc tế GS1. Quét camera hoặc vào trang /traceability nhập mã lô (VD: LOT-DT-2026-11, LOT-XL-2026-08, SP-KL-05) để xem đủ 4 nhóm dữ liệu:
     (1) Thông tin Nhà vườn, HTX & chứng nhận VietGAP / GlobalGAP / Organic BioCert;
     (2) Nhật ký canh tác điện tử (ngày gieo, phân bón hữu cơ, nguồn nước tưới);
     (3) Phiếu kiểm định NIFC / Quatest (dư lượng thuốc BVTV = 0);
     (4) Biểu đồ nhiệt độ kho lạnh (xuất kho theo FEFO) và xe lạnh vận chuyển IoT.

4. THANH TOÁN PAYOS VIETQR & COD (/faq, /cart):
   - PayOS VietQR 24/7: Quét mã QR từ bất kỳ app Ngân hàng hoặc ví điện tử; hệ thống đối soát Webhook tự động trong ~2 giây; tạm giữ hàng trong kho lạnh tối đa 30 phút chờ chuyển khoản.
   - Thanh toán khi nhận hàng (COD): Đồng kiểm chất lượng rau tươi cùng shipper trước khi trả tiền mặt.
   - Tuyệt đối không lưu thông tin thẻ ngân hàng trên hệ thống AgriTrace.

5. HỘI VIÊN AGRICLUB, TÍCH ĐIỂM & VOUCHER (/loyalty, /faq):
   - Tích điểm: Mỗi 10.000 đ chi tiêu thành công = 1 điểm cơ bản (nhân hệ số x1.0 – x2.0 theo hạng; tự động cộng khi đơn hoàn tất) và thưởng +20 điểm khi đồng kiểm & đánh giá đơn hàng (tối đa 1 lần/đơn).
   - 4 hạng thành viên AgriClub:
     + Đồng (0 – 999.999đ chi tiêu): Hệ số tích điểm x1.0.
     + Bạc (từ 1.000.000đ chi tiêu): Hệ số tích điểm x1.2 + Freeship xe lạnh định kỳ.
     + Vàng (từ 3.000.000đ chi tiêu): Hệ số tích điểm x1.5 + giảm 5% & ưu tiên giao nhanh 2h.
     + Kim Cương (từ 7.000.000đ chi tiêu): Hệ số tích điểm x2.0 + giảm 10% trọn đời.
   - Đổi điểm lấy Voucher thật lưu vào ví: 100 điểm (giảm 10.000đ), 200 điểm (Freeship 25.000đ), 280 điểm (giảm 30.000đ), 500 điểm (giảm 50.000đ). Các mã công khai phổ biến: FREESHIP, AGRI30, VIPGOLD. Mỗi tài khoản áp dụng 1 lần/mã.

6. ĐỐI TÁC NHÀ VƯỜN (FARMER) & B2B (/faq):
   - Quy trình 3 bước mở gian hàng: (1) Đăng ký vai trò Nông dân & tải giấy phép VietGAP/GlobalGAP -> (2) Chuyên gia AgriTrace thẩm định thực địa vùng trồng trong 48 giờ -> (3) Cấp quyền Dashboard Nông dân để quản lý mùa vụ, nhật ký điện tử và xuất tem QR GS1.

7. VỀ AGRITRACE, BẢO MẬT & LIÊN HỆ (/about, /terms, /contact):
   - Hệ sinh thái Nông sản Sạch Farm-to-Table, kết nối 50+ Hợp tác xã (Đà Lạt, Mộc Châu, Cao Lãnh, Hàm Yên...) với 1.200+ lô hàng gắn QR GS1 và AI dự báo nhu cầu / xuất kho FEFO.
   - Bảo mật SSL 256-bit, cam kết không bán hoặc chia sẻ thông tin cá nhân cho bên thứ ba (/terms).
   - Tổng đài Hotline (07:00 – 21:00): 1900 888 666 | Email: lequangminhqwer@gmail.com | Chat Tổng đài trực tuyến trong Đơn Mua -> Hộp thư -> "Hỗ trợ tổng đài".
`;

function buildSystemInstruction(): string {
  const productListText = LIVE_CATALOG.map(
    (p) => `- ${p.name}:
  + Giá bán thực tế trên web: ${p.currentPrice.toLocaleString("vi-VN")} đ / ${p.unit} (Giá gốc: ${p.basePrice.toLocaleString("vi-VN")} đ — Đang áp dụng ${p.campaign} giảm ${p.discountPercent}% tiết kiệm ${p.discountAmount.toLocaleString("vi-VN")} đ).
  + Mã lô GS1: ${p.batchCode}
  + Nguồn gốc: ${p.origin}
  + Chứng nhận: ${p.cert}, ${p.pesticide}
  + Chuỗi lạnh: ${p.coldChain}`
  ).join("\n");

  return `Bạn là Trợ lý AI Thông Minh của Hệ Thống Nông Sản Sạch AgriTrace AI.
Nhiệm vụ của bạn là tư vấn CHÍNH XÁC 100% mọi câu hỏi về FAQ, chính sách giao hàng, đổi trả 24h, quét mã QR GS1, thanh toán VietQR/COD, hội viên AgriClub, đăng ký đối tác Nhà vườn, điều khoản bảo mật, liên hệ tổng đài, cũng như giá bán nông sản, công thức nấu ăn, bảo quản tủ lạnh và HƯỚNG DẪN ĐẶT HÀNG TRỰC TIẾP QUA CÁC NÚT HÀNH ĐỘNG.

DƯỚI ĐÂY LÀ DANH MỤC VÀ GIÁ BÁN THỰC TẾ ĐANG NIÊM YẾT TRÊN WEBSITE:
${productListText}

${FAQ_KNOWLEDGE_PROMPT}

QUY TẮC BẮT BUỘC VỀ NÚT HÀNH ĐỘNG (INTERACTIVE ACTION BUTTONS):
Ở cuối câu trả lời, LUÔN gợi ý 1-3 nút điều hướng phù hợp nhất bằng cú pháp:
[[ACTION: <Nhãn nút có biểu tượng emoji> | <Đường dẫn URL>]]

Các đường dẫn URL hợp lệ:
- FAQ & Chính sách: [[ACTION: ❓ Trung Tâm Câu Hỏi Thường Gặp (FAQ) | /faq]]
- Truy xuất QR GS1: [[ACTION: 🔍 Quét & Tra Cứu Tem QR GS1 | /traceability]]
- Hội viên & Voucher: [[ACTION: 👑 Hạng Hội Viên AgriClub | /loyalty]] | [[ACTION: 🎁 Ví Voucher & Đổi Điểm | /dashboard/customer?tab=vouchers]]
- Đơn hàng & Tổng đài CSKH: [[ACTION: 📦 Đơn Hàng & Chat Tổng Đài | /dashboard/customer?tab=messages]] | [[ACTION: 📞 Trang Liên Hệ & Hotline | /contact]]
- Giới thiệu & Điều khoản: [[ACTION: 🌿 Giới Thiệu AgriTrace | /about]] | [[ACTION: 📜 Điều Khoản & Bảo Mật | /terms]]
- Mua sản phẩm:
  + [[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]
  + [[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]
  + [[ACTION: ⚡ Mua Ngay Xà Lách Lô Lô (33.600đ) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]
  + [[ACTION: ⚡ Mua Ngay Cải Xoăn Kale (60.000đ) | /products?search=Cải+Xoăn&buy=SP-KL-05]]
  + [[ACTION: ⚡ Mua Ngay Bơ Sáp 034 (74.700đ) | /products?search=Bơ+Sáp&buy=SP-BO-06]]
  + [[ACTION: 🛒 Cửa Hàng Nông Sản | /products]]

YÊU CẦU TRẢ LỜI:
- Trả lời thẳng trọng tâm câu hỏi của khách hàng (đặc biệt khi khách hỏi FAQ, chính sách, điều khoản, tổng đài — giải thích đầy đủ số liệu thực tế như 24h, hoàn tiền 2h, freeship 150k, phí ship 25k, 2°C-5°C, 3 khung giờ, AgriClub Đồng/Bạc/Vàng/Kim Cương, Hotline 1900 888 666).`;
}

function normalizeVi(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function hasWholeToken(norm: string, token: string): boolean {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(norm);
}

function matchesAny(norm: string, patterns: string[]): boolean {
  return patterns.some((p) => (p.includes(" ") ? norm.includes(p) : hasWholeToken(norm, p)));
}

function buildSmartFallbackReply(userMessage: string): string {
  const normUser = normalizeVi(userMessage);

  // 1. Đổi trả 1-đổi-1 / Hoàn tiền / Khiếu nại 24H
  if (
    matchesAny(normUser, [
      "doi tra",
      "hoan tien",
      "khieu nai",
      "1 doi 1",
      "dap nat",
      "hu hong",
      "tra hang",
      "den bu",
      "24h",
      "24 gio",
    ])
  ) {
    return (
      "Dạ chào bạn! 🛡️ **Chính sách Đổi trả 1-đổi-1 & Hoàn tiền trong 24H** tại AgriTrace bảo vệ quyền lợi khách hàng tối đa:\n\n" +
      "- **Điều kiện áp dụng:** Trong vòng **24 giờ** kể từ khi nhận hàng nếu nông sản bị dập nát, héo úa, giao thiếu/sai loại hoặc lỗi nhiệt độ chuỗi lạnh.\n" +
      "- **3 bước giải quyết siêu nhanh:**\n" +
      "  1. Chụp ảnh hoặc quay video rõ tình trạng mở thùng đóng kiểm.\n" +
      "  2. Vào **Đơn Mua → Hộp thư → Khiếu nại / Hoàn tiền** hoặc bấm **\"Hỗ trợ tổng đài\"** để nhắn trực tiếp với Admin CSKH (Hotline: **1900 888 666**).\n" +
      "  3. Nhận rau củ bù mới miễn phí ở chuyến sớm nhất **hoặc hoàn tiền 100% về tài khoản VietQR trong vòng 2 giờ** sau khi đối soát *(Quý khách không phải gửi trả hàng hỏng)*.\n\n" +
      "[[ACTION: 📦 Gửi Khiếu Nại / Chat Tổng Đài | /dashboard/customer?tab=messages]]\n" +
      "[[ACTION: ❓ Xem Chi Tiết FAQ Đổi Trả | /faq]]"
    );
  }

  // 2. Phí ship, Freeship, Khung giờ giao hàng & Chuỗi lạnh
  if (
    matchesAny(normUser, [
      "phi ship",
      "freeship",
      "mien phi van chuyen",
      "giao hang",
      "van chuyen",
      "xe lanh",
      "khung gio",
      "bao nhieu lau",
      "may gio giao",
      "ship",
    ]) &&
    !matchesAny(normUser, ["dau tay", "cam sanh", "bo sap", "ca chua"])
  ) {
    return (
      "Dạ chào bạn! ❄️ **Quy trình giao hàng Chuỗi lạnh AgriCold-Chain** của AgriTrace:\n\n" +
      "- **Công nghệ bảo quản:** Xe lạnh chuyên dụng giữ nhiệt độ chuẩn **2°C – 5°C** suốt hành trình, theo dõi cảm biến IoT thời gian thực.\n" +
      "- **Phí giao hàng:** Đồng giá **25.000 đ / đơn**.\n" +
      "- **Miễn phí vận chuyển (Freeship):** Tự động Freeship cho mọi đơn từ **150.000 đ** trở lên hoặc khi áp dụng mã **FREESHIP**.\n" +
      "- **Thời gian & 3 khung giờ giao mỗi ngày:** Thu hái từ 05:30 sáng và giao nhanh nội thành trong **2 giờ** theo 3 khung giờ: **Sáng (08:00–11:00)**, **Chiều (14:00–17:00)** và **Tối (18:00–21:00)**.\n\n" +
      "[[ACTION: 🛒 Đặt Hàng Ngay (Freeship từ 150k) | /products]]\n" +
      "[[ACTION: ❓ Xem FAQ Giao Hàng | /faq]]"
    );
  }

  // 3. Truy xuất nguồn gốc mã QR GS1 & Chứng nhận VietGAP / Quatest
  if (
    matchesAny(normUser, [
      "truy xuat",
      "qr",
      "gs1",
      "nguon goc",
      "vietgap",
      "globalgap",
      "kiem dinh",
      "quetest",
      "quatest",
      "nifc",
      "nhat ky canh tac",
      "thuoc bvtv",
      "du luong",
      "an toan thuc pham",
    ])
  ) {
    return (
      "Dạ chào bạn! 🔍 Mọi sản phẩm trên **AgriTrace** đều dán tem **Mã QR chuẩn quốc tế GS1** minh bạch từ nông trại tới bàn ăn:\n\n" +
      "- **Cách tra cứu:** Quét QR trên bao bì bằng camera điện thoại hoặc nhập mã lô (VD: `LOT-DT-2026-11`, `LOT-XL-2026-08`, `SP-KL-05`) tại trang **Truy Xuất QR**.\n" +
      "- **4 dữ liệu công khai minh bạch 100%:**\n" +
      "  1. Thông tin Chủ nông trại, Hợp tác xã & chứng nhận **VietGAP / GlobalGAP / Organic BioCert**.\n" +
      "  2. **Nhật ký canh tác điện tử:** Ngày gieo trồng, phân bón hữu cơ, nguồn nước tưới & kiểm soát sinh học.\n" +
      "  3. **Phiếu kiểm nghiệm độc lập NIFC / Quatest:** Chỉ số dư lượng thuốc BVTV **= 0**.\n" +
      "  4. **Biểu đồ nhiệt độ IoT** tại kho lạnh (xuất kho chuẩn **FEFO**) và xe lạnh vận chuyển.\n\n" +
      "[[ACTION: 🔍 Quét & Tra Cứu Mã QR GS1 | /traceability?batch=LOT-DT-2026-11]]\n" +
      "[[ACTION: ❓ Xem FAQ Truy Xuất | /faq]]"
    );
  }

  // 4. Thanh toán VietQR / PayOS / COD & Hóa đơn
  if (
    matchesAny(normUser, [
      "thanh toan",
      "vietqr",
      "payos",
      "chuyen khoan",
      "cod",
      "tien mat",
      "ngan hang",
      "hoa don",
      "webhook",
    ])
  ) {
    return (
      "Dạ chào bạn! 💳 **AgriTrace** hỗ trợ 2 phương thức thanh toán nhanh chóng & an toàn tuyệt đối:\n\n" +
      "1. **Chuyển khoản PayOS VietQR 24/7:** Quét mã QR từ bất kỳ ứng dụng Ngân hàng hoặc Ví điện tử nào. Hệ thống nhận **Webhook đối soát tự động sau ~2 giây** và kích hoạt lệnh xuất kho ngay. Đơn hàng chờ thanh toán được **tạm giữ trong kho lạnh tối đa 30 phút**.\n" +
      "2. **Thanh toán khi nhận hàng (COD):** Quý khách mở thùng **đồng kiểm chất lượng rau củ** cùng nhân viên giao nhận trước khi trả tiền mặt.\n" +
      "- **An toàn dữ liệu:** Không lưu thông tin thẻ ngân hàng trên máy chủ, toàn bộ kết nối mã hóa **SSL 256-bit**.\n\n" +
      "[[ACTION: 🛍️ Vào Giỏ Hàng Thanh Toán | /cart]]\n" +
      "[[ACTION: 📦 Kiểm Tra Đơn Mua | /dashboard/customer?tab=orders]]"
    );
  }

  // 5. Hội viên AgriClub, Tích điểm VIP & Mã giảm giá Voucher
  if (
    matchesAny(normUser, [
      "agriclub",
      "hoi vien",
      "tich diem",
      "hang thanh vien",
      "kim cuong",
      "hang vang",
      "hang bac",
      "voucher",
      "ma giam",
      "khuyen mai",
      "uu dai",
      "diem thuong",
    ])
  ) {
    return (
      "Dạ chào bạn! 👑 **Đặc quyền Hội viên AgriClub & Mã ưu đãi Voucher** tại AgriTrace:\n\n" +
      "- **Quy đổi điểm:** Cứ **5.000 đ** chi tiêu thành công = **1 điểm** (tự động cộng khi đơn hoàn tất).\n" +
      "- **4 cấp hạng AgriClub tự động nâng hạng:**\n" +
      "  + 🥉 **Đồng (0 – 499 điểm):** Tích điểm tiêu chuẩn mọi đơn hàng.\n" +
      "  + 🥈 **Bạc (500 – 1.999 điểm):** Giảm trực tiếp **3%** mọi đơn hàng.\n" +
      "  + 🥇 **Vàng (2.000 – 4.999 điểm):** Giảm **5%** mọi đơn + **Freeship xe lạnh**.\n" +
      "  + 💎 **Kim Cương (≥ 5.000 điểm):** Giảm **10%** + **Ưu tiên đặt các lô nông sản giới hạn / hiếm**.\n" +
      "- **Mã giảm giá áp dụng 1 lần/tài khoản:** `FREESHIP` (miễn phí ship 25k), `AGRI30` (giảm 30k cho đơn từ 150k), `VIPGOLD` (ưu đãi hội viên Vàng).\n\n" +
      "[[ACTION: 👑 Xem Hạng Hội Viên AgriClub | /loyalty]]\n" +
      "[[ACTION: 🎁 Mở Ví Voucher & Đổi Điểm | /dashboard/customer?tab=vouchers]]"
    );
  }

  // 6. Đăng ký đối tác Nhà vườn (Farmer) / Bán hàng / Hợp tác B2B
  if (
    matchesAny(normUser, [
      "nha vuon",
      "nong dan",
      "doi tac",
      "ban hang",
      "mo shop",
      "hop tac",
      "dang ky trang trai",
      "tham dinh",
      "farmer",
    ])
  ) {
    return (
      "Dạ chào bạn! 🧑‍🌾 **Quy trình 3 bước đăng ký trở thành Nhà Vườn đối tác trên AgriTrace**:\n\n" +
      "1. **Đăng ký & Nộp hồ sơ:** Tạo tài khoản chọn vai trò **Nông dân (Farmer)** và tải hồ sơ trang trại + giấy chứng nhận **VietGAP / GlobalGAP**.\n" +
      "2. **Thẩm định thực địa trong 48H:** Đội ngũ kỹ thuật AgriTrace kiểm tra vùng trồng và xét duyệt hồ sơ vị trí trong vòng **48 giờ**.\n" +
      "3. **Kích hoạt Dashboard Nông Trại:** Mở mùa vụ, ghi nhật ký canh tác điện tử, tạo lô thu hoạch gắn mã QR GS1 và bán trực tiếp tới hàng nghìn khách hàng & đối tác B2B.\n\n" +
      "[[ACTION: 🧑‍🌾 Trang Đăng Nhập / Đăng Ký Đối Tác | /login]]\n" +
      "[[ACTION: ❓ Xem FAQ Đối Tác Nhà Vườn | /faq]]"
    );
  }

  // 7. Hỏi tổng quan FAQ / Toàn bộ câu hỏi thường gặp (ưu tiên khi khách hỏi thẳng FAQ / toàn bộ chính sách)
  if (
    matchesAny(normUser, [
      "faq",
      "cau hoi thuong gap",
      "toan bo chinh sach",
      "chinh sach",
      "huong dan",
      "quy trinh",
      "tro giup",
      "hoi ve",
    ])
  ) {
    return (
      "Dạ chào bạn! 📚 Dưới đây là **tổng hợp toàn bộ Câu hỏi thường gặp (FAQ) tại AgriTrace AI**:\n\n" +
      "1. ❄️ **Giao hàng & Chuỗi lạnh:** Xe lạnh IoT **2°C–5°C**, ship **25.000 đ**, **Freeship từ 150.000 đ**, giao nhanh nội thành **2 giờ** theo 3 khung giờ *(08-11h, 14-17h, 18-21h)*.\n" +
      "2. 🛡️ **Đổi trả 1-đổi-1 (24H):** Gửi ảnh lỗi qua **Khiếu nại** hoặc **Hỗ trợ tổng đài** -> giao bù mới miễn phí hoặc **hoàn tiền VietQR trong 2 giờ** (không cần trả hàng hỏng).\n" +
      "3. 🔍 **Truy xuất QR GS1:** Quét mã xem nhật ký canh tác, chứng nhận VietGAP/GlobalGAP, phiếu kiểm nghiệm **BVTV = 0 (NIFC/Quatest)** và nhiệt độ kho FEFO.\n" +
      "4. 💳 **Thanh toán:** **PayOS VietQR** xác nhận Webhook ~2 giây (giữ đơn lạnh 30 phút) hoặc **COD đồng kiểm**.\n" +
      "5. 👑 **Hội viên AgriClub & Voucher:** **5.000 đ = 1 điểm**; giảm **3%–10%** qua 4 hạng Đồng/Bạc/Vàng/Kim Cương; mã `FREESHIP`, `AGRI30`, `VIPGOLD`.\n" +
      "6. 🧑‍🌾 **Đối tác Nhà vườn & Tổng đài:** Thẩm định trang trại trong **48 giờ**; Hotline **1900 888 666**.\n\n" +
      "Bạn muốn hỏi sâu chi tiết mục nào cứ nhắn trực tiếp cho tôi nhé!\n\n" +
      "[[ACTION: ❓ Mở Trang FAQ Đầy Đủ | /faq]]\n" +
      "[[ACTION: 📦 Chat Tổng Đài / Khiếu Nại | /dashboard/customer?tab=messages]]"
    );
  }

  // 8. Bảo mật, Điều khoản (/terms), Giới thiệu (/about), Liên hệ / Tổng đài CSKH (/contact)
  if (
    matchesAny(normUser, [
      "dieu khoan",
      "bao mat",
      "chinh sach bao mat",
      "rieng tu",
      "lien he",
      "hotline",
      "tong dai",
      "so dien thoai",
      "email",
      "o dau",
      "dia chi",
      "ve agritrace",
      "gioi thieu",
      "agritrace la gi",
      "ho tro",
    ]) &&
    !matchesAny(normUser, ["dau tay", "cam sanh", "bo sap", "ca chua", "xa lach", "cai xoan", "kale"])
  ) {
    return (
      "Dạ chào bạn! 🌿 **Thông tin hệ thống AgriTrace AI, Tổng đài hỗ trợ & Điều khoản bảo mật**:\n\n" +
      "- **Giới thiệu nền tảng:** Hệ sinh thái Nông sản Sạch **Farm-to-Table**, kết nối **50+ Hợp tác xã** chuẩn VietGAP/GlobalGAP *(Đà Lạt, Mộc Châu, Cao Lãnh, Hàm Yên...)* với **1.200+ lô hàng gắn tem QR GS1** và AI tối ưu xuất kho **FEFO**.\n" +
      "- **Kênh hỗ trợ Tổng đài Admin 24/7:**\n" +
      "  + 💬 **Chat trực tiếp với Tổng đài CSKH:** Vào **Đơn Mua → Hộp thư → bấm nút \"Hỗ trợ tổng đài\"**.\n" +
      "  + 📞 **Hotline (07:00 – 21:00):** **1900 888 666**\n" +
      "  + ✉️ **Email CSKH:** `lequangminhqwer@gmail.com`\n" +
      "- **Cam kết bảo mật:** Mã hóa truyền tải **SSL 256-bit**, tuyệt đối không bán hay chia sẻ dữ liệu khách hàng cho bên thứ ba.\n\n" +
      "[[ACTION: 📦 Chat Tổng Đài Admin / Đơn Mua | /dashboard/customer?tab=messages]]\n" +
      "[[ACTION: 📞 Liên Hệ CSKH | /contact]]\n" +
      "[[ACTION: 📜 Điều Khoản & Bảo Mật | /terms]]"
    );
  }

  // 9. Hướng dẫn bảo quản rau củ trong tủ lạnh (kiểm tra trước tên từng sản phẩm cụ thể)
  if (matchesAny(normUser, ["bao quan", "tu lanh", "de duoc bao lau", "giu tuoi"])) {
    return (
      "Dạ chào bạn! ❄️ Mẹo bảo quản nông sản sạch VietGAP giữ trọn độ giòn ngọt và dinh dưỡng từ chuyên gia AgriTrace:\n\n" +
      "- 🍓 **Dâu Tây Mộc Châu**: **Tuyệt đối không rửa trước khi cất tủ lạnh**. Lót khăn giấy hút ẩm dưới đáy hộp, đậy kín và bảo quản ngăn mát 2°C – 4°C, ăn ngon nhất trong 3–5 ngày.\n" +
      "- 🥬 **Xà lách & Cải Kale**: Bọc giấy báo hoặc màng bọc thực phẩm, giữ trong ngăn rau củ 3°C – 5°C tươi xanh từ 7–10 ngày.\n" +
      "- 🥑 **Bơ Sáp 034**: Khi bơ còn xanh, để nơi thoáng mát ở nhiệt độ phòng để bơ chín tự nhiên. Khi bơ mềm tay thì mới cất tủ lạnh dùng dần.\n" +
      "- 🍊 **Cam Sành**: Để ngăn mát 5°C – 8°C có thể giữ nước và vitamin tới 2 tuần.\n\n" +
      "[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n" +
      "[[ACTION: 📦 Xem Đơn Mua Của Tôi | /dashboard/customer?tab=orders]]"
    );
  }

  // 10. Gợi ý thực đơn / Công thức món ngon (AI Chef)
  if (matchesAny(normUser, ["mon ngon", "nau gi", "cong thuc", "salad", "detox", "an gi", "che bien"])) {
    return (
      "Dạ chào bạn! 🍳 **AgriTrace AI Chef** gợi ý cho bạn 2 công thức món ngon tươi mát từ nông sản VietGAP đang có sẵn hôm nay:\n\n" +
      "1. 🥗 **Salad Cải Kale & Dâu Tây Mộc Châu Sốt Chanh Leo**:\n" +
      "   - Nguyên liệu: 200g Cải Kale, 150g Dâu Tây (170.100đ), 1 quả Bơ Sáp 034 (74.700đ), 100g Cà Chua Bi.\n" +
      "   - Cách làm: Kale bóp nhẹ với chút muối và dầu olive; dâu tây và bơ cắt lát; rưới sốt chanh leo hoặc mè rang.\n" +
      "   - Dinh dưỡng: Giàu chất xơ, Vitamin C, Vitamin K và chất béo lành mạnh, chỉ ~220 kcal.\n\n" +
      "2. 🥤 **Nước Ép Xanh Detox Thanh Lọc (Kale + Táo + Xà Lách Thủy Canh)**:\n" +
      "   - Giúp da sáng mịn, thanh nhiệt và hỗ trợ giảm cân hiệu quả.\n\n" +
      "Bạn bấm vào nút bên dưới để chọn mua nguyên liệu giao lạnh tận nhà nhé!\n\n" +
      "[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n" +
      "[[ACTION: ⚡ Mua Ngay Cải Xoăn Kale (60.000đ) | /products?search=Cải+Xoăn&buy=SP-KL-05]]\n" +
      "[[ACTION: 🛒 Đến Cửa Hàng Nông Sản | /products]]"
    );
  }

  // 11. Dâu tây Mộc Châu (không nhầm với "ở đâu", "bắt đầu", "đầu")
  if (matchesAny(normUser, ["dau tay", "strawberry", "moc chau", "dt-mc", "lot-dt"])) {
    return (
      "Dạ chào bạn! 🍓 **Dâu Tây New Zealand Mộc Châu** hiện đang vào chính vụ Đông - Xuân ngon nhất năm tại **Hợp Tác Xã Nông Sản Sạch Mộc Châu**:\n\n" +
      "- **Giá bán thực tế trên web:** **170.100 đ / Hộp 500g** (Đang được **trợ giá trực tiếp 19%** từ giá gốc 210.000 đ — tiết kiệm 39.900 đ)\n" +
      "- **Mã lô truy xuất GS1:** **LOT-DT-2026-11** (Đạt chuẩn **GlobalGAP & VietGAP**, kiểm nghiệm NIFC tồn dư BVTV = 0)\n" +
      "- **Chuỗi lạnh:** Thu hái lúc 05:30 sáng, đóng hộp vi lỗ sinh học và vận chuyển xe lạnh chuyên dụng **2°C - 5°C**\n\n" +
      "Bạn bấm ngay vào nút bên dưới để mở cửa sổ đặt mua hoặc xem chi tiết hồ sơ lô hàng nhé!\n\n" +
      "[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n" +
      "[[ACTION: 🔍 Xem Chi Tiết Dâu Tây Mộc Châu | /products?search=Dâu+Tây&detail=LOT-DT-2026-11]]\n" +
      "[[ACTION: 🎁 Kho Voucher & Đổi Điểm | /dashboard/customer?tab=vouchers]]"
    );
  }

  // 12. Cam sành Hàm Yên (không nhầm với "cam kết", "cảm ơn")
  if (matchesAny(normUser, ["cam sanh", "ham yen", "cs-hy", "sp-cs", "trai cam", "qua cam"])) {
    return (
      "Dạ chào bạn! 🍊 **Cam Sành Hàm Yên Tép Vàng Mọng Nước** đang vào mùa thu hoạch rộ ngọt thanh, vỏ mỏng, giàu Vitamin C:\n\n" +
      "- **Giá bán thực tế trên web:** **45.000 đ / KG** (Giá gốc 55.000 đ — giảm 18%)\n" +
      "- **Mã lô GS1:** **SP-CS-03** — Đạt chuẩn an toàn **VietGAP**\n" +
      "- **Nguồn gốc:** HTX Cam Sành Hàm Yên, Tuyên Quang\n\n" +
      "Bạn bấm nút bên dưới để đặt mua hoặc xem chi tiết sản phẩm nhé!\n\n" +
      "[[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]\n" +
      "[[ACTION: 🔍 Xem Chi Tiết Cam Sành Hàm Yên | /products?search=Cam+Sành&detail=SP-CS-03]]\n" +
      "[[ACTION: 🎁 Ví Voucher & Điểm Thưởng | /dashboard/customer?tab=vouchers]]"
    );
  }

  // 13. Cải Kale
  if (matchesAny(normUser, ["kale", "cai xoan", "cai kale", "sp-kl"])) {
    return (
      "Dạ chào bạn! 🥬 **Cải Xoăn Kale Hữu Cơ Dinh Dưỡng** canh tác tại Đà Lạt, giàu Vitamin A-C-K và chất chống oxy hóa:\n\n" +
      "- **Giá bán thực tế trên web:** **60.000 đ / KG** (Đang được trợ giá **giảm 20%** từ giá gốc 75.000 đ)\n" +
      "- **Tiêu chuẩn:** Chuẩn canh tác **Organic BioCert**\n" +
      "- **Mã lô GS1:** **SP-KL-05**\n\n" +
      "[[ACTION: ⚡ Mua Ngay Cải Xoăn Kale (60.000đ) | /products?search=Cải+Xoăn&buy=SP-KL-05]]\n" +
      "[[ACTION: 🔍 Xem Chi Tiết Cải Xoăn Kale | /products?search=Cải+Xoăn&detail=SP-KL-05]]\n" +
      "[[ACTION: 🥬 Xem Danh Mục Rau Ăn Lá | /products?cat=rau_la]]"
    );
  }

  // 14. Xà lách & Rau thủy canh
  if (matchesAny(normUser, ["xa lach", "lo lo", "rau sach", "rau an la", "thuy canh", "xl-2026"])) {
    return (
      "Dạ chào bạn! 🥬 **Xà Lách Lô Lô Xanh Thủy Canh** hái mới lúc 05:30 sáng nay tại Nông Trại Xanh Đà Lạt:\n\n" +
      "- **Giá bán thực tế trên web:** **33.600 đ / KG** (Đang được trợ giá vụ mùa **giảm 20%** từ giá gốc 42.000 đ)\n" +
      "- **Tiêu chuẩn:** Chuẩn **GlobalGAP & VietGAP**, kiểm định Quatest 1 BVTV = 0\n" +
      "- **Mã lô GS1:** **LOT-XL-2026-08**\n\n" +
      "[[ACTION: ⚡ Mua Ngay Xà Lách Lô Lô (33.600đ) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]\n" +
      "[[ACTION: 🔍 Tra Cứu Tem QR Lô Xà Lách | /traceability?batch=LOT-XL-2026-08]]\n" +
      "[[ACTION: 🥬 Xem Danh Mục Rau Ăn Lá | /products?cat=rau_la]]"
    );
  }

  // 15. Bơ Sáp 034 (không nhầm với "toàn bộ", "bộ phận")
  if (matchesAny(normUser, ["bo sap", "034", "sp-bo", "qua bo", "trai bo"])) {
    return (
      "Dạ chào bạn! 🥑 **Bơ Sáp 034 Đặc Sản Cao Nguyên** (Bảo Lộc, Lâm Đồng) cơm vàng dày hạt lép, dẻo béo ngậy thơm ngon:\n\n" +
      "- **Giá bán thực tế trên web:** **74.700 đ / KG** (Đang xả kho cuối vụ **giảm 17%** từ giá gốc 90.000 đ)\n" +
      "- **Tiêu chuẩn:** **VietGAP**, kiểm định BVTV = 0\n" +
      "- **Mã lô GS1:** **SP-BO-06**\n\n" +
      "[[ACTION: ⚡ Mua Ngay Bơ Sáp 034 (74.700đ) | /products?search=Bơ+Sáp&buy=SP-BO-06]]\n" +
      "[[ACTION: 🔍 Xem Chi Tiết Bơ Sáp 034 | /products?search=Bơ+Sáp&detail=SP-BO-06]]\n" +
      "[[ACTION: 🍎 Xem Danh Mục Trái Cây | /products?cat=trai_cay]]"
    );
  }

  // 16. Cà chua bi cherry
  if (matchesAny(normUser, ["ca chua", "cherry", "sp-cc"])) {
    return (
      "Dạ chào bạn! 🍅 **Cà Chua Bi Cherry Đỏ Ngọt** thu hoạch tại Đà Lạt, chùm mọng đỏ giòn ngọt:\n\n" +
      "- **Giá bán thực tế trên web:** **50.000 đ / KG** (Giá gốc 60.000 đ — giảm 17%)\n" +
      "- **Tiêu chuẩn:** Chuẩn **VietGAP**\n" +
      "- **Mã lô GS1:** **SP-CC-04**\n\n" +
      "[[ACTION: ⚡ Mua Ngay Cà Chua Bi Cherry (50.000đ) | /products?search=Cà+Chua&buy=SP-CC-04]]\n" +
      "[[ACTION: 🔍 Xem Chi Tiết Cà Chua Bi | /products?search=Cà+Chua&detail=SP-CC-04]]"
    );
  }

  // 17. Kiểm tra đơn hàng chung
  if (matchesAny(normUser, ["don hang", "don mua", "kiem tra don"])) {
    return (
      "Dạ chào bạn! 📦 Bạn có thể theo dõi hành trình xe lạnh, quét QR kiểm định từng lô hàng, nhắn tin trực tiếp với Nhà vườn hoặc kết nối **Tổng đài CSKH Admin** ngay tại mục Đơn Mua:\n\n" +
      "[[ACTION: 📦 Xem Đơn Mua & Chat Tổng Đài | /dashboard/customer?tab=messages]]\n" +
      "[[ACTION: 🛒 Tiếp Tục Mua Nông Sản | /products]]"
    );
  }

  // Default general: vừa giới thiệu sản phẩm vừa mở lối vào FAQ đầy đủ
  return (
    "Dạ chào bạn! 🌱 **AgriTrace AI** sẵn sàng hỗ trợ bạn chọn mua nông sản sạch đạt chuẩn VietGAP/GlobalGAP **hoặc giải đáp mọi câu hỏi FAQ & chính sách**:\n\n" +
    "- 🍓 **Dâu Tây New Zealand Mộc Châu:** **170.100 đ / Hộp 500g** *(Trợ giá -19%)*\n" +
    "- 🍊 **Cam Sành Hàm Yên Tép Vàng:** **45.000 đ / KG** *(Giảm -18%)*\n" +
    "- 🥬 **Xà Lách Thủy Canh & Cải Kale:** **33.600 đ – 60.000 đ / KG**\n" +
    "- 🛡️ **Cam kết sàn:** Đổi trả **1-đổi-1 trong 24H**, hoàn tiền VietQR **2H**, Freeship đơn từ **150.000 đ**, chuỗi lạnh **2°C–5°C**, Hotline **1900 888 666**.\n\n" +
    "[[ACTION: ❓ Toàn Bộ FAQ & Chính Sách | /faq]]\n" +
    "[[ACTION: 📦 Chat Tổng Đài & Đơn Mua | /dashboard/customer?tab=messages]]\n" +
    "[[ACTION: 🛒 Xem Cửa Hàng Nông Sản | /products]]"
  );
}

function ensureGuaranteedActionButtons(userMessage: string, replyText: string): string {
  const normUser = normalizeVi(userMessage);
  let updatedReply = replyText.trim();

  if (!/\[\[ACTION:/i.test(updatedReply)) {
    if (matchesAny(normUser, ["doi tra", "hoan tien", "khieu nai", "faq", "chinh sach", "dieu khoan", "bao mat", "lien he", "tong dai"])) {
      updatedReply += `\n\n[[ACTION: ❓ Xem Trang FAQ & Chính Sách | /faq]]\n[[ACTION: 📦 Đơn Hàng & Chat Tổng Đài | /dashboard/customer?tab=messages]]`;
    } else if (matchesAny(normUser, ["qr", "gs1", "truy xuat", "vietgap", "kiem dinh"])) {
      updatedReply += `\n\n[[ACTION: 🔍 Quét & Tra Cứu Tem QR | /traceability?batch=LOT-DT-2026-11]]`;
    } else if (matchesAny(normUser, ["dau tay", "strawberry"])) {
      updatedReply += `\n\n[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n[[ACTION: 🔍 Xem Chi Tiết Dâu Tây Mộc Châu | /products?search=Dâu+Tây&detail=LOT-DT-2026-11]]`;
    } else if (matchesAny(normUser, ["cam sanh", "ham yen"])) {
      updatedReply += `\n\n[[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]\n[[ACTION: 🔍 Xem Chi Tiết Cam Sành Hàm Yên | /products?search=Cam+Sành&detail=SP-CS-03]]`;
    } else if (matchesAny(normUser, ["xa lach", "rau", "kale"])) {
      updatedReply += `\n\n[[ACTION: ⚡ Mua Ngay Xà Lách Thủy Canh (33.600đ) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]\n[[ACTION: 🥬 Xem Danh Mục Rau Ăn Lá | /products?cat=rau_la]]`;
    } else if (matchesAny(normUser, ["voucher", "diem", "ma giam", "agriclub", "hoi vien"])) {
      updatedReply += `\n\n[[ACTION: 👑 Hạng Hội Viên AgriClub | /loyalty]]\n[[ACTION: 🎁 Mở Kho Voucher & Đổi Điểm | /dashboard/customer?tab=vouchers]]`;
    } else if (matchesAny(normUser, ["don hang", "don mua", "thanh toan"])) {
      updatedReply += `\n\n[[ACTION: 📦 Xem Đơn Mua Của Tôi | /dashboard/customer?tab=orders]]`;
    } else {
      updatedReply += `\n\n[[ACTION: ❓ Toàn Bộ FAQ & Chính Sách | /faq]]\n[[ACTION: 🛒 Xem Toàn Bộ Nông Sản | /products]]`;
    }
  }

  return updatedReply;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey: userApiKey } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const lastUserMessage =
      [...messages].reverse().find((m: { role: string; content: string }) => m.role === "user")?.content || "";

    // Check API Key
    const rawKey = userApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
    const isAiStudioKey = typeof rawKey === "string" && rawKey.startsWith("AIza");

    if (!rawKey || !isAiStudioKey) {
      return NextResponse.json({
        reply: buildSmartFallbackReply(lastUserMessage),
        model: "agritrace-smart-advisor",
      });
    }

    const apiKey = rawKey;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const candidateModels = ["gemini-2.0-flash", "gemini-1.5-flash"];
    let replyText = "";
    let usedModel = "";

    const systemPrompt = buildSystemInstruction();

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = {
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1000,
          },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(4000),
        });

        if (res.ok) {
          const data = await res.json();
          replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (replyText) {
            usedModel = model;
            break;
          }
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    if (!replyText) {
      return NextResponse.json({
        reply: buildSmartFallbackReply(lastUserMessage),
        model: "agritrace-smart-advisor",
      });
    }

    return NextResponse.json({
      reply: ensureGuaranteedActionButtons(lastUserMessage, replyText),
      model: usedModel,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Chat API route error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message },
      { status: 500 }
    );
  }
}
