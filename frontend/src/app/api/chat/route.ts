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
Nhiệm vụ của bạn là tư vấn CHÍNH XÁC 100% về giá bán thực tế trên website, mùa vụ, tiêu chuẩn VietGAP/GlobalGAP, quy trình chuỗi lạnh, gợi ý thực đơn món ngon dinh dưỡng, và HƯỚNG DẪN ĐẶT HÀNG TRỰC TIẾP QUA CÁC NÚT HÀNH ĐỘNG ĐIỀU HƯỚNG TRANG.

DƯỚI ĐÂY LÀ DANH MỤC VÀ GIÁ BÁN THỰC TẾ ĐANG NIÊM YẾT TRÊN WEBSITE:
${productListText}

ĐẶC BIỆT LƯU Ý VỀ GIÁ BÁN:
- Dâu Tây New Zealand Mộc Châu: GIÁ BÁN ĐANG HIỂN THỊ TRÊN WEB LÀ 170.100 đ / Hộp 500g (Giá gốc 210.000 đ, trợ giá trực tiếp 19% tiết kiệm 39.900 đ). Tuyệt đối không báo sai giá khác!
- Cam Sành Hàm Yên: 45.000 đ / KG (Gốc 55.000 đ).
- Xà Lách Lô Lô Xanh: 33.600 đ / KG (Gốc 42.000 đ).
- Cải Xoăn Kale: 60.000 đ / KG (Gốc 75.000 đ).
- Bơ Sáp 034: 74.700 đ / KG (Gốc 90.000 đ).
- Cà Chua Bi Cherry: 50.000 đ / KG.

QUY TẮC BẮT BUỘC VỀ NÚT HÀNH ĐỘNG (INTERACTIVE ACTION BUTTONS):
Mỗi khi tư vấn cho người dùng về mua nông sản, giới thiệu loại rau củ quả, mùa vụ, tra cứu nguồn gốc, đổi voucher, hoặc giỏ hàng thanh toán:
BẠN BẮT BUỘC PHẢI TẠO CÁC NÚT ĐIỀU HƯỚNG TRANG Ở CUỐI CÂU TRẢ LỜI BẰNG CÚ PHÁP:
[[ACTION: <Nhãn nút có biểu tượng emoji> | <Đường dẫn URL>]]

Các đường dẫn URL chuẩn xác trên AgriTrace:
- Mua ngay Dâu Tây: [[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]
- Xem chi tiết Dâu Tây: [[ACTION: 🔍 Xem Chi Tiết Dâu Tây Mộc Châu | /products?search=Dâu+Tây&detail=LOT-DT-2026-11]]
- Mua ngay Cam Sành: [[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]
- Xem chi tiết Cam Sành: [[ACTION: 🔍 Xem Chi Tiết Cam Sành Hàm Yên | /products?search=Cam+Sành&detail=SP-CS-03]]
- Mua ngay Xà Lách: [[ACTION: ⚡ Mua Ngay Xà Lách Lô Lô (33.600đ) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]
- Mua ngay Cải Kale: [[ACTION: ⚡ Mua Ngay Cải Xoăn Kale (60.000đ) | /products?search=Cải+Xoăn&buy=SP-KL-05]]
- Mua ngay Bơ Sáp: [[ACTION: ⚡ Mua Ngay Bơ Sáp 034 (74.700đ) | /products?search=Bơ+Sáp&buy=SP-BO-06]]
- Mua ngay Cà Chua: [[ACTION: ⚡ Mua Ngay Cà Chua Bi (50.000đ) | /products?search=Cà+Chua&buy=SP-CC-04]]
- Mua theo danh mục: [[ACTION: 🥬 Danh Mục Rau Ăn Lá | /products?cat=rau_la]] | [[ACTION: 🍎 Danh Mục Trái Cây | /products?cat=trai_cay]] | [[ACTION: 🛒 Cửa Hàng Nông Sản | /products]]
- Tra cứu mã QR GS1: [[ACTION: 🔍 Quét & Tra Cứu Tem QR | /traceability]]
- Giỏ hàng & Voucher: [[ACTION: 🛍️ Đến Giỏ Hàng | /cart]] | [[ACTION: 🎁 Ví Voucher & Đổi Điểm | /dashboard/customer?tab=vouchers]] | [[ACTION: 📦 Đơn Hàng Của Tôi | /dashboard/customer?tab=orders]]

HỖ TRỢ THỰC ĐƠN & BẢO QUẢN:
Nếu khách hỏi về nấu gì, công thức món ăn, bảo quản rau củ trong tủ lạnh, hãy tư vấn nhiệt tình, nêu rõ cách giữ tươi và các bước chế biến đơn giản giữ trọn vitamin!`;
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

function buildSmartFallbackReply(userMessage: string): string {
  const normUser = normalizeVi(userMessage);

  // 1. Dâu tây
  if (normUser.includes("dau") || normUser.includes("strawberry") || normUser.includes("moc chau") || normUser.includes("dt-mc")) {
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

  // 2. Cam sành
  if (normUser.includes("cam") || normUser.includes("ham yen") || normUser.includes("cs-hy") || normUser.includes("sp-cs")) {
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

  // 3. Xà lách
  if (normUser.includes("xa lach") || normUser.includes("lo lo") || normUser.includes("rau") || normUser.includes("thuy canh") || normUser.includes("xl-2026")) {
    return (
      "Dạ chào bạn! 🥬 **Xà Lách Lô Lô Xanh Thủy Canh** hái mới lúc 05:30 sáng nay tại Nông Trại Xanh Thủy Canh Đà Lạt:\n\n" +
      "- **Giá bán thực tế trên web:** **33.600 đ / KG** (Đang được trợ giá vụ mùa **giảm 20%** từ giá gốc 42.000 đ)\n" +
      "- **Tiêu chuẩn:** Chuẩn **GlobalGAP & VietGAP**, kiểm định Quatest 1 BVTV = 0\n" +
      "- **Mã lô GS1:** **LOT-XL-2026-08**\n\n" +
      "[[ACTION: ⚡ Mua Ngay Xà Lách Lô Lô (33.600đ) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]\n" +
      "[[ACTION: 🔍 Tra Cứu Tem QR Lô Xà Lách | /traceability?batch=LOT-XL-2026-08]]\n" +
      "[[ACTION: 🥬 Xem Danh Mục Rau Ăn Lá | /products?cat=rau_la]]"
    );
  }

  // 4. Cải Kale
  if (normUser.includes("kale") || normUser.includes("cai xoan") || normUser.includes("cai kale") || normUser.includes("sp-kl")) {
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

  // 5. Bơ Sáp 034
  if (normUser.includes("bo") || normUser.includes("bo sap") || normUser.includes("034") || normUser.includes("sp-bo")) {
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

  // 6. Cà chua bi
  if (normUser.includes("ca chua") || normUser.includes("cherry") || normUser.includes("sp-cc")) {
    return (
      "Dạ chào bạn! 🍅 **Cà Chua Bi Cherry Đỏ Ngọt** thu hoạch tại Đà Lạt, chùm mọng đỏ giòn ngọt:\n\n" +
      "- **Giá bán thực tế trên web:** **50.000 đ / KG** (Giá gốc 60.000 đ — giảm 17%)\n" +
      "- **Tiêu chuẩn:** Chuẩn **VietGAP**\n" +
      "- **Mã lô GS1:** **SP-CC-04**\n\n" +
      "[[ACTION: ⚡ Mua Ngay Cà Chua Bi Cherry (50.000đ) | /products?search=Cà+Chua&buy=SP-CC-04]]\n" +
      "[[ACTION: 🔍 Xem Chi Tiết Cà Chua Bi | /products?search=Cà+Chua&detail=SP-CC-04]]"
    );
  }

  // 7. Gợi ý thực đơn / Công thức món ngon (AI Chef)
  if (normUser.includes("mon") || normUser.includes("nau") || normUser.includes("cong thuc") || normUser.includes("salad") || normUser.includes("detox") || normUser.includes("an gi")) {
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

  // 8. Hướng dẫn bảo quản rau củ trong tủ lạnh
  if (normUser.includes("bao quan") || normUser.includes("tu lanh") || normUser.includes("de duoc bao lau") || normUser.includes("hong")) {
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

  // 9. Voucher & Tích điểm
  if (normUser.includes("voucher") || normUser.includes("ma giam") || normUser.includes("diem") || normUser.includes("khuyen mai")) {
    return (
      "Dạ chào bạn! 🎁 Trên **AgriTrace AI**, các mã ưu đãi được áp dụng minh bạch **1 lần cho mỗi tài khoản**:\n\n" +
      "- **AGRI30**: Giảm ngay **30.000 đ** cho đơn nông sản từ 150.000 đ\n" +
      "- **FREESHIP25**: Miễn phí vận chuyển xe lạnh chuyên dụng **25.000 đ**\n" +
      "- **Tích điểm AgriClub**: Nhận **1 điểm** cho mỗi 5.000 đ chi tiêu để nâng hạng Vàng / Kim Cương\n\n" +
      "[[ACTION: 🎁 Mở Kho Voucher Đã Lưu | /dashboard/customer?tab=vouchers]]\n" +
      "[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]"
    );
  }

  // 10. Đơn hàng & Thanh toán
  if (normUser.includes("don") || normUser.includes("giao hang") || normUser.includes("thanh toan") || normUser.includes("vietqr")) {
    return (
      "Dạ chào bạn! 📦 Hệ thống **AgriTrace** quản lý đơn hàng minh bạch theo chuỗi cung ứng lạnh:\n\n" +
      "- **Thanh toán VietQR 24/7**: Tạm giữ nông sản trong kho lạnh tối đa **30 phút** khi chờ chuyển khoản, tự động kích hoạt xuất kho ngay khi nhận giao dịch.\n" +
      "- **Vận chuyển xe lạnh IoT 4.2°C**: Thùng xe chuyên dụng kiểm soát nhiệt độ từ nông trại đến bàn ăn gia đình bạn.\n" +
      "- **Chính sách 1 đổi 1 trong 24H**: Đổi mới miễn phí nếu nông sản bị dập nát hoặc không đạt chuẩn.\n\n" +
      "[[ACTION: 📦 Kiểm Tra Đơn Mua Của Tôi | /dashboard/customer?tab=orders]]\n" +
      "[[ACTION: 🛒 Tiếp Tục Mua Nông Sản | /products]]"
    );
  }

  // Default general
  return (
    "Dạ chào bạn! 🌱 **AgriTrace AI** sẵn sàng hỗ trợ bạn chọn mua nông sản sạch đạt chuẩn VietGAP/GlobalGAP đang vào chính vụ hôm nay:\n\n" +
    "- 🍓 **Dâu Tây New Zealand Mộc Châu**: **170.100 đ / Hộp 500g** (Trợ giá vụ mùa -19%, gốc 210.000 đ)\n" +
    "- 🍊 **Cam Sành Hàm Yên Tép Vàng**: **45.000 đ / KG** (Giảm 18%, gốc 55.000 đ)\n" +
    "- 🥬 **Xà Lách Lô Lô Xanh Thủy Canh**: **33.600 đ / KG** (Trợ giá -20%, gốc 42.000 đ)\n" +
    "- 🥬 **Cải Xoăn Kale Hữu Cơ Đà Lạt**: **60.000 đ / KG** (Trợ giá -20%, gốc 75.000 đ)\n" +
    "- 🥑 **Bơ Sáp 034 Cao Nguyên**: **74.700 đ / KG** (Xả kho cuối vụ -17%, gốc 90.000 đ)\n\n" +
    "Bạn muốn tìm hiểu hoặc đặt mua món nào có thể bấm ngay nút hành động bên dưới nhé!\n\n" +
    "[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n" +
    "[[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]\n" +
    "[[ACTION: ⚡ Mua Ngay Xà Lách Thủy Canh (33.600đ) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]\n" +
    "[[ACTION: 🛒 Xem Tất Cả Nông Sản | /products]]"
  );
}

function ensureGuaranteedActionButtons(userMessage: string, replyText: string): string {
  const normUser = normalizeVi(userMessage);
  let updatedReply = replyText.trim();

  // If no action buttons exist, append relevant ones
  if (!/\[\[ACTION:/i.test(updatedReply)) {
    if (normUser.includes("dau") || normUser.includes("strawberry")) {
      updatedReply += `\n\n[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n[[ACTION: 🔍 Xem Chi Tiết Dâu Tây Mộc Châu | /products?search=Dâu+Tây&detail=LOT-DT-2026-11]]`;
    } else if (normUser.includes("cam") || normUser.includes("ham yen")) {
      updatedReply += `\n\n[[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]\n[[ACTION: 🔍 Xem Chi Tiết Cam Sành Hàm Yên | /products?search=Cam+Sành&detail=SP-CS-03]]`;
    } else if (normUser.includes("xa lach") || normUser.includes("rau")) {
      updatedReply += `\n\n[[ACTION: ⚡ Mua Ngay Xà Lách Thủy Canh (33.600đ) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]\n[[ACTION: 🥬 Xem Danh Mục Rau Ăn Lá | /products?cat=rau_la]]`;
    } else if (normUser.includes("voucher") || normUser.includes("diem") || normUser.includes("ma giam")) {
      updatedReply += `\n\n[[ACTION: 🎁 Mở Kho Voucher & Đổi Điểm AgriClub | /dashboard/customer?tab=vouchers]]`;
    } else if (normUser.includes("don hang") || normUser.includes("don mua") || normUser.includes("thanh toan")) {
      updatedReply += `\n\n[[ACTION: 📦 Xem Đơn Mua Của Tôi | /dashboard/customer?tab=orders]]`;
    } else {
      updatedReply += `\n\n[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n[[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]\n[[ACTION: 🛒 Xem Toàn Bộ Nông Sản | /products]]`;
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
