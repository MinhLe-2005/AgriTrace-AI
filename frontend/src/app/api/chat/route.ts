import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI Thông Minh của Hệ Thống Quản Lý Chuỗi Cung Ứng Nông Sản Sạch AgriTrace AI.
Nhiệm vụ của bạn là tư vấn tận tình, chuyên sâu về nông sản theo mùa vụ, giá cả, tiêu chuẩn VietGAP/GlobalGAP, quy trình chuỗi lạnh, và HƯỚNG DẪN ĐẶT HÀNG TRỰC TIẾP QUA CÁC NÚT HÀNH ĐỘNG ĐIỀU HƯỚNG TRANG.

DƯỚI ĐÂY LÀ TOÀN BỘ CƠ SỞ TRI THỨC VÀ DANH MỤC NÔNG SẢN THỰC TẾ TRÊN HỆ THỐNG:

1. DANH MỤC 6 NÔNG SẢN SẠCH ĐANG BÁN & MÙA VỤ HIỆN TẠI (MÙA ĐÔNG - XUÂN 2026):
- Dâu Tây New Zealand Mộc Châu:
  + Giá bán ưu đãi: 180.000 đ / Hộp 500g (Giá gốc: 210.000 đ - Giảm 14%).
  + Mã lô định danh GS1: DT-MC-2026-11.
  + Nguồn gốc: Hợp Tác Xã Nông Sản Sạch Mộc Châu (Thị trấn Nông Trường, Mộc Châu, Sơn La).
  + Canh tác & Mùa vụ: Đang vào chính vụ đông - xuân rộ trái ngon nhất năm, trồng giá thể xơ dừa hữu cơ Israel, tưới giun quế vi sinh.
  + Tiêu chuẩn: Chứng nhận VietGAP số #VG-SL-2025-442, kiểm nghiệm NIFC không tồn dư BVTV, bảo quản lạnh 2°C - 5°C.
- Cam Sành Hàm Yên Tép Vàng Mọng Nước:
  + Giá bán ưu đãi: 45.000 đ / KG (Giá gốc: 55.000 đ - Giảm 18%).
  + Mã lô: CS-HY-2026-03 (hoặc SP-CS-05).
  + Nguồn gốc: HTX Cam Sành Hàm Yên, Tuyên Quang.
  + Canh tác & Mùa vụ: Mùa thu hoạch rộ tép cam vàng óng, mọng nước, vỏ mỏng, vị ngọt thanh giải nhiệt cực tốt, giàu vitamin C.
  + Tiêu chuẩn: VietGAP an toàn sinh học.
- Cải Xoăn Kale Hữu Cơ Dinh Dưỡng:
  + Giá bán ưu đãi: 65.000 đ / KG (Giá gốc: 75.000 đ - Giảm 13%).
  + Mã lô: SP-KL-05.
  + Nguồn gốc: Nông Trại Xanh Thủy Canh Đà Lạt (Lâm Đồng).
  + Đặc điểm: Nữ hoàng rau xanh, giàu vitamin A-C-K và khoáng chất chống oxy hóa, làm nước ép detox hoặc salad.
  + Tiêu chuẩn: Canh tác chuẩn Organic BioCert.
- Bơ Sáp 034 Đặc Sản Cao Nguyên:
  + Giá bán ưu đãi: 75.000 đ / KG (Giá gốc: 90.000 đ - Giảm 17%).
  + Mã lô: SP-BO-06.
  + Nguồn gốc: Bảo Lộc, Tỉnh Lâm Đồng.
  + Đặc điểm: Cơm vàng dày hạt lép, dẻo quánh, ngậy béo thơm lừng tự nhiên.
  + Tiêu chuẩn: VietGAP.
- Xà Lách Lô Lô Xanh Thủy Canh:
  + Giá bán ưu đãi: 35.000 đ / KG (Giá gốc: 42.000 đ - Giảm 17%).
  + Mã lô: LOT-XL-2026-08.
  + Nguồn gốc: Nông Trại Xanh Thủy Canh Đà Lạt (Lâm Đồng).
  + Đặc điểm: Trồng giàn thủy canh hồi lưu khép kín trong nhà kính, giòn ngọt thanh mát, không đắng, hái mới mỗi sáng 05:30.
  + Tiêu chuẩn: GlobalGAP số #GG-VN-2024-910, Quatest 1 BVTV = 0.
- Cà Chua Bi Cherry Đỏ Ngọt:
  + Giá bán ưu đãi: 50.000 đ / KG (Giá gốc: 60.000 đ - Giảm 17%).
  + Mã lô: SP-CC-04.
  + Nguồn gốc: Nông Trại Xanh Thủy Canh Đà Lạt.
  + Đặc điểm: Quả chùm tròn đều, vỏ mỏng mọng đỏ, ngọt đậm ròn tan.

2. QUY TRÌNH CHUỖI LẠNH & QUẢN LÝ FEFO:
- Tất cả nông sản sau khi thu hoạch lúc 05:30 sáng được sơ chế và đưa vào chuỗi lạnh khép kín 2°C - 5°C.
- Vận chuyển bằng đội xe lạnh chuyên dụng kiểm soát nhiệt độ tự động qua cảm biến IoT.
- Quản lý hạn dùng FEFO (First-Expired, First-Out): Hạn dùng gần nhất xuất trước để nông sản đến tay khách luôn tươi ngon.

3. TRUY XUẤT NGUỒN GỐC TEM QR CODE GS1:
- Khách quét mã QR trên bao bì hoặc tra cứu mã lô để xem nhật ký: ngày gieo trồng, kiểm định chất lượng phòng lab Quatest/NIFC, nhật ký nhiệt độ xe lạnh và giấy chứng nhận an toàn thực phẩm.

4. HỘI VIÊN AGRICLUB & VÍ VOUCHER:
- Tích lũy 1 điểm cho mỗi 10.000 đ chi tiêu.
- 4 Hạng: Đồng (x1.0), Bạc (x1.2), Vàng (x1.5), Kim Cương (x2.0).
- Đổi điểm nhận voucher giảm 10k, 30k, hoặc mã freeship xe lạnh 25k (FREESHIP25).

5. THANH TOÁN & GIAO HÀNG:
- Thanh toán COD hoặc quét mã PayOS VietQR tự động xác nhận trong 2 giây.
- Cam kết bảo hành 1 đổi 1 trong vòng 24h nếu dập nát.

QUY TẮC BẮT BUỘC VỀ NÚT HÀNH ĐỘNG (INTERACTIVE ACTION BUTTONS):
Mỗi khi tư vấn cho người dùng về mua nông sản, giới thiệu loại rau củ quả, mùa vụ, tra cứu nguồn gốc, đổi voucher, hoặc giỏ hàng thanh toán:
BẠN BẮT BUỘC PHẢI TẠO CÁC NÚT ĐIỀU HƯỚNG TRANG Ở CUỐI CÂU TRẢ LỜI BẰNG CÚ PHÁP ĐẶC BIỆT:
[[ACTION: <Nhãn nút có biểu tượng emoji> | <Đường dẫn URL>]]

Các đường dẫn URL chuẩn xác trên AgriTrace (Tự động lọc sản phẩm và mở cửa sổ Mua Ngay Áp Voucher hoặc Chi Tiết):
- Mua ngay Dâu Tây (Mở thẳng form Mua Ngay có Áp Voucher): [[ACTION: ⚡ Mua Ngay Dâu Tây Mộc Châu (Áp Voucher) | /products?search=Dâu+Tây&buy=DT-MC-2026-11]]
- Xem chi tiết Dâu Tây: [[ACTION: 🔍 Xem Chi Tiết Dâu Tây Mộc Châu | /products?search=Dâu+Tây&detail=DT-MC-2026-11]]
- Mua ngay Cam Sành (Mở thẳng form Mua Ngay có Áp Voucher): [[ACTION: ⚡ Mua Ngay Cam Sành Hàm Yên (Áp Voucher) | /products?search=Cam+Sành&buy=CS-HY-2026-03]]
- Xem chi tiết Cam Sành: [[ACTION: 🔍 Xem Chi Tiết Cam Sành Hàm Yên | /products?search=Cam+Sành&detail=CS-HY-2026-03]]
- Mua ngay Xà Lách Thủy Canh: [[ACTION: ⚡ Mua Ngay Xà Lách Lô Lô Xanh (Áp Voucher) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]
- Xem chi tiết Xà Lách: [[ACTION: 🔍 Xem Chi Tiết Xà Lách Lô Lô | /products?search=Xà+Lách&detail=LOT-XL-2026-08]]
- Mua ngay Cải Kale: [[ACTION: ⚡ Mua Ngay Cải Xoăn Kale (Áp Voucher) | /products?search=Cải+Xoăn&buy=SP-KL-05]]
- Mua ngay Bơ Sáp: [[ACTION: ⚡ Mua Ngay Bơ Sáp 034 Cao Nguyên | /products?search=Bơ+Sáp&buy=SP-BO-06]]
- Mua ngay Cà Chua Bi: [[ACTION: ⚡ Mua Ngay Cà Chua Bi Cherry | /products?search=Cà+Chua&buy=SP-CC-04]]
- Mua theo danh mục:
  + Trái cây: [[ACTION: 🍎 Xem Danh Mục Trái Cây Đặc Sản | /products?cat=trai_cay]]
  + Rau ăn lá: [[ACTION: 🥬 Xem Danh Mục Rau Thủy Canh | /products?cat=rau_la]]
  + Tất cả sản phẩm: [[ACTION: 🛒 Khám Phá Cửa Hàng Nông Sản | /products]]
- Tra cứu nguồn gốc mã QR GS1:
  + Dâu Tây: [[ACTION: 🔍 Tra Cứu Lô Dâu Tây DT-MC-2026-11 | /traceability?batch=DT-MC-2026-11]]
  + Xà Lách: [[ACTION: 🔍 Tra Cứu Lô Xà Lách LOT-XL-2026-08 | /traceability?batch=LOT-XL-2026-08]]
  + Cam Sành: [[ACTION: 🔍 Tra Cứu Lô Cam Sành CS-HY-2026-03 | /traceability?batch=CS-HY-2026-03]]
  + Tra cứu chung: [[ACTION: 🔍 Quét & Tra Cứu Mã QR GS1 | /traceability]]
- Giỏ hàng & thanh toán: [[ACTION: 🛍️ Đến Giỏ Hàng Chung | /cart]]
- Tích điểm & đổi voucher: [[ACTION: 🎁 Đổi Điểm Thưởng & Lấy Voucher | /dashboard/customer?tab=vouchers]]
- Đơn hàng đã mua: [[ACTION: 📦 Xem Lịch Sử Đơn Hàng | /dashboard/customer?tab=orders]]

Mỗi phản hồi tư vấn nông sản nên kèm từ 1 đến 3 nút action phù hợp nhất để khách hàng bấm là hệ thống lọc đúng sản phẩm đó và mở ngay popup Mua Ngay hoặc Chi Tiết!

QUY TẮC BẮT BUỘC VỀ PHẠM VI (SCOPE GUARDRAIL):
- Bạn chỉ hỗ trợ nông sản sạch, nguồn gốc xuất xứ, chứng nhận VietGAP, chuỗi lạnh, dinh dưỡng ẩm thực gia đình và dịch vụ trên AgriTrace AI.
- Nếu người dùng hỏi các chủ đề ngoài lề (lập trình, chính trị, showbiz, tài chính...), hãy lịch sự từ chối và hướng họ quay lại nông sản sạch AgriTrace.
- Luôn giữ thái độ thân thiện, xưng hô "Dạ chào bạn!", "AgriTrace AI xin chia sẻ...", câu từ tự nhiên, mạch lạc, dùng gạch đầu dòng và in đậm rõ ràng.`;

function normalizeVi(str: string): string {
  return (str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

const PRODUCT_ACTION_CATALOG = [
  {
    keywords: ["dau", "dau tay", "strawberry", "moc chau", "dt-mc"],
    buyAction: "[[ACTION: ⚡ Mua Ngay Dâu Tây Mộc Châu (Mở Cửa Sổ Đặt Mua) | /products?search=Dâu+Tây&buy=DT-MC-2026-11]]",
    detailAction: "[[ACTION: 🔍 Xem Chi Tiết & Tem QR Lô Dâu Tây | /products?search=Dâu+Tây&detail=DT-MC-2026-11]]",
    fallbackReply:
      "Dạ chào bạn! 🍓 **Dâu Tây New Zealand Mộc Châu** hiện đang vào chính vụ Đông - Xuân ngon nhất năm tại **Hợp Tác Xã Nông Sản Sạch Mộc Châu**:\n\n- **Giá ưu đãi:** **180.000 đ / Hộp 500g** (Giảm 14% so với giá gốc 210.000 đ)\n- **Mã lô truy xuất GS1:** **DT-MC-2026-11** (Đạt chuẩn **GlobalGAP / VietGAP**, kiểm định NIFC không tồn dư BVTV)\n- **Chuỗi lạnh:** Thu hái lúc 05:30 sáng và vận chuyển xe lạnh chuyên dụng **2°C - 5°C**\n\nBạn bấm ngay vào nút bên dưới để **mở thẳng cửa sổ Đặt Mua Dâu Tây (có áp Voucher giảm giá)** nhé!",
  },
  {
    keywords: ["cam", "cam sanh", "ham yen", "cs-hy", "sp-cs"],
    buyAction: "[[ACTION: ⚡ Mua Ngay Cam Sành Hàm Yên (Mở Cửa Sổ Đặt Mua) | /products?search=Cam+Sành&buy=CS-HY-2026-03]]",
    detailAction: "[[ACTION: 🔍 Xem Chi Tiết Cam Sành Hàm Yên | /products?search=Cam+Sành&detail=CS-HY-2026-03]]",
    fallbackReply:
      "Dạ chào bạn! 🍊 **Cam Sành Hàm Yên Tép Vàng Mọng Nước** đang vào vụ thu hoạch rộ ngọt thanh, giàu Vitamin C:\n\n- **Giá ưu đãi:** **45.000 đ / KG** (Giá gốc 55.000 đ)\n- **Mã lô GS1:** **CS-HY-2026-03** — Đạt chuẩn **VietGAP**\n- **Nguồn gốc:** HTX Cam Sành Hàm Yên, Tuyên Quang\n\nBạn bấm nút bên dưới để **mở ngay cửa sổ Mua Cam Sành** nhé!",
  },
  {
    keywords: ["xa lach", "lo lo", "rau", "thuy canh", "xl-2026"],
    buyAction: "[[ACTION: ⚡ Mua Ngay Xà Lách Thủy Canh (Mở Cửa Sổ Đặt Mua) | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]",
    detailAction: "[[ACTION: 🔍 Tra Cứu Tem QR Lô Xà Lách XL-2026-08 | /traceability?batch=LOT-XL-2026-08]]",
    fallbackReply:
      "Dạ chào bạn! 🥬 **Xà Lách Lô Lô Xanh Thủy Canh** được thu hoạch mới lúc 05:30 sáng nay tại Nông Trại Xanh Thủy Canh Đà Lạt:\n\n- **Giá ưu đãi:** **35.000 đ / KG** (Giòn ngọt, không đắng, chuẩn GlobalGAP #GG-VN-2024-910)\n- **Kiểm định:** Quatest 1 tồn dư BVTV = 0, bảo quản chuỗi lạnh 2°C - 5°C\n\nBạn bấm nút bên dưới để **mở thẳng cửa sổ Đặt Mua Xà Lách** nhé!",
  },
  {
    keywords: ["kale", "cai xoan", "cai kale", "sp-kl"],
    buyAction: "[[ACTION: ⚡ Mua Ngay Cải Xoăn Kale Hữu Cơ (Mở Cửa Sổ Đặt Mua) | /products?search=Cải+Xoăn&buy=SP-KL-05]]",
    detailAction: "[[ACTION: 🔍 Xem Chi Tiết Cải Xoăn Kale | /products?search=Cải+Xoăn&detail=SP-KL-05]]",
    fallbackReply:
      "Dạ chào bạn! 🥬 **Cải Xoăn Kale Hữu Cơ Dinh Dưỡng** (Đà Lạt) rất giàu Vitamin A-C-K, cực tốt cho salad và nước ép detox:\n\n- **Giá ưu đãi:** **65.000 đ / KG** (Chuẩn canh tác Organic BioCert)\n- **Mã lô:** **SP-KL-05**\n\nBạn bấm nút bên dưới để **vào mua ngay Cải Xoăn Kale** nhé!",
  },
  {
    keywords: ["bo", "bo sap", "034", "sp-bo"],
    buyAction: "[[ACTION: ⚡ Mua Ngay Bơ Sáp 034 Cao Nguyên | /products?search=Bơ+Sáp&buy=SP-BO-06]]",
    detailAction: "[[ACTION: 🔍 Xem Chi Tiết Bơ Sáp 034 | /products?search=Bơ+Sáp&detail=SP-BO-06]]",
    fallbackReply:
      "Dạ chào bạn! 🥑 **Bơ Sáp 034 Đặc Sản Cao Nguyên** (Bảo Lộc, Lâm Đồng) cơm vàng dày, hạt lép, dẻo béo tự nhiên:\n\n- **Giá ưu đãi:** **75.000 đ / KG** (Chuẩn VietGAP)\n- **Mã lô:** **SP-BO-06**\n\nBạn bấm nút bên dưới để **mở ngay cửa sổ Đặt Mua Bơ Sáp 034** nhé!",
  },
  {
    keywords: ["ca chua", "cherry", "sp-cc"],
    buyAction: "[[ACTION: ⚡ Mua Ngay Cà Chua Bi Cherry | /products?search=Cà+Chua&buy=SP-CC-04]]",
    detailAction: "[[ACTION: 🔍 Xem Chi Tiết Cà Chua Bi Cherry | /products?search=Cà+Chua&detail=SP-CC-04]]",
    fallbackReply:
      "Dạ chào bạn! 🍅 **Cà Chua Bi Cherry Đỏ Ngọt** (Nông Trại Thủy Canh Đà Lạt) quả chùm tròn mọng, ngọt thanh:\n\n- **Giá ưu đãi:** **50.000 đ / KG** (Chuẩn VietGAP)\n- **Mã lô:** **SP-CC-04**\n\nBạn bấm nút bên dưới để **đặt mua ngay Cà Chua Bi Cherry** nhé!",
  },
  {
    keywords: ["ca rot", "baby", "cr-dl"],
    buyAction: "[[ACTION: ⚡ Mua Ngay Cà Rốt Baby Đà Lạt | /products?search=Cà+Rốt&buy=CR-DL-2026-07]]",
    detailAction: "[[ACTION: 🔍 Xem Chi Tiết Cà Rốt Baby | /products?search=Cà+Rốt&detail=CR-DL-2026-07]]",
    fallbackReply:
      "Dạ chào bạn! 🥕 **Cà Rốt Baby Giòn Ngọt Đà Lạt** củ nhỏ non mềm, giàu Beta-Carotene:\n\n- **Mã lô:** **CR-DL-2026-07** (Chuẩn VietGAP Đà Lạt)\n\nBạn bấm nút bên dưới để **mở ngay cửa sổ Đặt Mua Cà Rốt Baby** nhé!",
  },
];

function ensureGuaranteedActionButtons(userMessage: string, replyText: string): string {
  const normUser = normalizeVi(userMessage);
  const normReply = normalizeVi(replyText);
  let updatedReply = replyText.trim();

  let matchedAnyProduct = false;
  for (const item of PRODUCT_ACTION_CATALOG) {
    const userMentions = item.keywords.some((kw) => normUser.includes(kw));
    const replyMentions = item.keywords.some((kw) => normReply.includes(kw));
    if (userMentions || (replyMentions && normUser.includes("mua"))) {
      matchedAnyProduct = true;
      // Extract the URL path from buyAction to see if AI already included a buy link for this product
      const buyUrlMatch = item.buyAction.match(/\|\s*(.*?)\]\]/);
      const buyUrl = buyUrlMatch ? buyUrlMatch[1].trim() : "";
      if (buyUrl && !updatedReply.includes(buyUrl)) {
        updatedReply += `\n\n${item.buyAction}`;
      }
      const detailUrlMatch = item.detailAction.match(/\|\s*(.*?)\]\]/);
      const detailUrl = detailUrlMatch ? detailUrlMatch[1].trim() : "";
      if (detailUrl && !updatedReply.includes(detailUrl)) {
        updatedReply += `\n${item.detailAction}`;
      }
    }
  }

  // If no [[ACTION:...]] at all exists in the reply, append helpful default actions
  if (!/\[\[ACTION:/i.test(updatedReply)) {
    if (normUser.includes("voucher") || normUser.includes("diem") || normUser.includes("ma giam")) {
      updatedReply += `\n\n[[ACTION: 🎁 Mở Kho Voucher & Đổi Điểm AgriClub | /dashboard/customer?tab=vouchers]]`;
    } else if (normUser.includes("don hang") || normUser.includes("don mua") || normUser.includes("thanh toan")) {
      updatedReply += `\n\n[[ACTION: 📦 Xem Đơn Mua Của Tôi | /dashboard/customer?tab=orders]]`;
    } else if (!matchedAnyProduct) {
      updatedReply += `\n\n[[ACTION: ⚡ Mua Ngay Dâu Tây Mộc Châu | /products?search=Dâu+Tây&buy=DT-MC-2026-11]]\n[[ACTION: ⚡ Mua Ngay Cam Sành Hàm Yên | /products?search=Cam+Sành&buy=CS-HY-2026-03]]\n[[ACTION: 🛒 Xem Toàn Bộ Cửa Hàng Nông Sản | /products]]`;
    }
  }

  return updatedReply;
}

function buildSmartFallbackReply(userMessage: string): string {
  const normUser = normalizeVi(userMessage);
  for (const item of PRODUCT_ACTION_CATALOG) {
    if (item.keywords.some((kw) => normUser.includes(kw))) {
      return `${item.fallbackReply}\n\n${item.buyAction}\n${item.detailAction}\n[[ACTION: 🎁 Kho Voucher Giảm Giá | /dashboard/customer?tab=vouchers]]`;
    }
  }

  if (normUser.includes("voucher") || normUser.includes("ma giam") || normUser.includes("diem")) {
    return (
      "Dạ chào bạn! 🎁 Trên **AgriTrace AI**, mỗi mã Voucher ưu đãi được áp dụng **1 lần cho mỗi tài khoản** để đảm bảo quyền lợi công bằng cho mọi hội viên AgriClub:\n\n" +
      "- **AGRI30K**: Giảm ngay 30.000đ cho đơn từ 150.000đ\n" +
      "- **FREESHIP25**: Miễn phí vận chuyển xe lạnh chuyên dụng 25.000đ\n\n" +
      "Bạn bấm vào nút bên dưới để kiểm tra Ví Voucher hoặc đặt mua nông sản ngay nhé!\n\n" +
      "[[ACTION: 🎁 Mở Kho Voucher Đã Lưu | /dashboard/customer?tab=vouchers]]\n" +
      "[[ACTION: ⚡ Mua Ngay Dâu Tây (Áp Voucher) | /products?search=Dâu+Tây&buy=DT-MC-2026-11]]"
    );
  }

  if (normUser.includes("don") || normUser.includes("giao hang") || normUser.includes("thanh toan")) {
    return (
      "Dạ chào bạn! 📦 Hệ thống **AgriTrace** quản lý minh bạch tách biệt **Trạng thái Thanh toán** và **Trạng thái Vận chuyển xe lạnh**:\n\n" +
      "- **Thanh toán VietQR 24/7**: Giữ hàng tồn kho tối đa **30 phút** khi đang chờ quét mã QR, tự động chuyển sang **Đã thanh toán** ngay khi hoàn tất.\n" +
      "- **Thanh toán Tiền mặt (COD)**: Hiển thị *Chưa thanh toán (Thu hộ COD)* trong lúc đóng gói/vận chuyển và tự động xác nhận *Đã thanh toán* ngay khi giao hàng thành công.\n\n" +
      "[[ACTION: 📦 Kiểm Tra Đơn Mua Của Tôi | /dashboard/customer?tab=orders]]\n" +
      "[[ACTION: 🛒 Tiếp Tục Mua Nông Sản | /products]]"
    );
  }

  return (
    "Dạ chào bạn! 🌱 **AgriTrace AI** sẵn sàng hỗ trợ bạn chọn mua nông sản sạch chuẩn VietGAP/GlobalGAP đang vào chính vụ ngon nhất hôm nay:\n\n" +
    "- 🍓 **Dâu Tây New Zealand Mộc Châu**: **180.000 đ / Hộp 500g** (Lô `DT-MC-2026-11`)\n" +
    "- 🍊 **Cam Sành Hàm Yên Tép Vàng**: **45.000 đ / KG** (Lô `CS-HY-2026-03`)\n" +
    "- 🥬 **Xà Lách Thủy Canh Lô Lô Xanh**: **35.000 đ / KG** (Lô `LOT-XL-2026-08`)\n" +
    "- 🥬 **Cải Xoăn Kale Hữu Cơ Đà Lạt**: **65.000 đ / KG** (Lô `SP-KL-05`)\n\n" +
    "Bạn muốn đặt mua món nào chỉ cần bấm thẳng vào nút tương ứng bên dưới để mở ngay cửa sổ đặt hàng nhé!\n\n" +
    "[[ACTION: ⚡ Mua Ngay Dâu Tây Mộc Châu | /products?search=Dâu+Tây&buy=DT-MC-2026-11]]\n" +
    "[[ACTION: ⚡ Mua Ngay Cam Sành Hàm Yên | /products?search=Cam+Sành&buy=CS-HY-2026-03]]\n" +
    "[[ACTION: ⚡ Mua Ngay Xà Lách Thủy Canh | /products?search=Xà+Lách&buy=LOT-XL-2026-08]]\n" +
    "[[ACTION: 🛒 Xem Tất Cả Nông Sản | /products]]"
  );
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

    // Check API Key: Priority 1 = User provided key, Priority 2 = Server ENV
    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json({
        reply: buildSmartFallbackReply(lastUserMessage),
        model: "agritrace-smart-advisor",
      });
    }

    // Convert messages to Gemini contents format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // List of valid Gemini models to try in order of speed & availability
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-1.5-flash",
    ];
    let lastError: unknown = null;
    let replyText = "";
    let usedModel = "";

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = {
          system_instruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
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
        });

        if (res.ok) {
          const data = await res.json();
          replyText =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "";
          if (replyText) {
            usedModel = model;
            break;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          lastError = errData;
          console.warn(`Gemini model ${model} returned error:`, errData);
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (!replyText) {
      console.warn("All Gemini models failed or quota exceeded, using AgriTrace smart advisor fallback:", lastError);
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
