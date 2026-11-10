import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `Bạn là Trợ lý AI Thông Minh của Hệ Thống Quản Lý Chuỗi Cung Ứng Nông Sản Sạch AgriTrace AI.
Nhiệm vụ của bạn là tư vấn, giải đáp thắc mắc cho Khách hàng (Customer), Nông dân (Farmer), Thủ kho (Warehouse) và Nhà phân phối (Distributor) một cách chuyên nghiệp, nhiệt tình, chính xác và có căn cứ.

DƯỚI ĐÂY LÀ TOÀN BỘ CƠ SỞ TRI THỨC VÀ DỮ LIỆU CỦA AGRITRACE AI:

1. GIỚI THIỆU CHUNG
- AgriTrace AI là nền tảng quản lý chuỗi cung ứng nông sản sạch toàn diện kết hợp trí tuệ nhân tạo (AI) và công nghệ truy xuất nguồn gốc bằng mã QR độc bản từ trang trại đến bàn ăn.
- Cam kết 100% nông sản minh bạch về nguồn gốc, đạt các tiêu chuẩn an toàn thực phẩm VietGAP, GlobalGAP và Hữu cơ (Organic), không tồn dư thuốc bảo vệ thực vật (BVTV).

2. CÁC LOẠI NÔNG SẢN NỔI BẬT TRÊN HỆ THỐNG
- Xà lách thủy canh Lô Lô Xanh (Mã lô: XL-2026-08):
  + Nguồn gốc: Nông Trại Xanh Đà Lạt (Farm ID: NT-DL-01, Xã Xuân Thọ, TP. Đà Lạt, Tỉnh Lâm Đồng).
  + Phương pháp: Thủy canh hồi lưu khép kín trong nhà kính tự động hóa.
  + Chứng nhận: GlobalGAP số #GG-VN-2024-910, kiểm định Quatest 1, không phát hiện dư lượng thuốc BVTV và kim loại nặng.
  + Quy cách bảo quản: Nhiệt độ kho lạnh 4°C - 8°C, độ ẩm 85 - 90%. Hạn dùng tốt nhất 7 - 10 ngày.
- Dâu tây giống Nhật Mộc Châu (Mã lô: DT-MC-2026-11):
  + Nguồn gốc: Hợp tác xã Nông nghiệp Mộc Châu Eco (Thị trấn Nông Trường, Huyện Mộc Châu, Sơn La).
  + Canh tác: Giá thể xơ dừa hữu cơ, bón phân vi sinh giun quế, hệ thống tưới nhỏ giọt Israel.
  + Chứng nhận: VietGAP số #VG-SL-2025-442, kiểm nghiệm NIFC đạt chuẩn an toàn vệ sinh thực phẩm loại A.
  + Bảo quản: Nhiệt độ 2°C - 5°C, hộp định hình màng thở thông khí.
- Cam sành Bố Hạ mọng nước (Mã lô: CS-BG-2026-03):
  + Nguồn gốc: HTX Trái Cây Bố Hạ Bắc Giang (Xã Bố Hạ, Huyện Yên Thế, Tỉnh Bắc Giang).
  + Canh tác: Canh tác hữu cơ tự nhiên lâu năm, không dùng phân bón hóa học.
  + Chứng nhận: Organic BioCert số #OB-2024, chứng nhận phù hợp QUACERT.
  + Bảo quản: Kho mát 8°C - 12°C, thùng carton lót rơm tự nhiên.
- Bơ Sáp 034 Tây Nguyên: Nguồn gốc Huyện Bảo Lâm, Tỉnh Lâm Đồng, dẻo thơm ngậy, thu hoạch đúng độ già.
- Cải Kale lá xoăn Đà Lạt: Giàu vitamin và chất chống oxy hóa, chuẩn hữu cơ.

3. QUY TRÌNH KHO LẠNH & NGUYÊN TẮC FEFO
- Quản lý hạn sử dụng FEFO (First-Expired, First-Out): Các lô thu hoạch có hạn sử dụng gần nhất sẽ được thuật toán tự động ưu tiên xuất kho trước để tránh hư hao nông sản.
- Giám sát IoT thời gian thực: Cảm biến nhiệt độ và độ ẩm liên tục 24/7. Cảnh báo tự động nếu nhiệt độ phòng lạnh lệch khỏi ngưỡng an toàn (4°C - 8°C).

4. TRUY XUẤT NGUỒN GỐC QR CODE GS1
- Mỗi lô hàng có 01 mã tem QR độc bản duy nhất theo chuẩn GS1.
- Khách hàng quét mã xem được toàn bộ thông tin: Nông trại, người canh tác, ngày gieo/thu hoạch, kết quả kiểm định lab (Quatest, NIFC), nhiệt độ vận chuyển xe lạnh và tên tài xế giao nhận.

5. CHƯƠNG TRÌNH KHÁCH HÀNG THÂN THIẾT AGRICLUB
- Cứ mỗi 10.000 VNĐ chi tiêu mua nông sản, khách hàng được tích lũy 1 điểm thưởng.
- 4 Hạng hội viên:
  + Đồng (0 - 1.000.000 đ): Hệ số x1.0, voucher chào mừng 20k.
  + Bạc (1.000.000 đ - 3.000.000 đ): Hệ số x1.2, 1 voucher freeship xe lạnh/tháng.
  + Vàng (3.000.000 đ - 7.000.000 đ): Hệ số x1.5, ưu tiên xuất kho xe lạnh nhanh trong 2 giờ, voucher quý 5%.
  + Kim Cương (Trên 7.000.000 đ): Hệ số x2.0, freeship xe lạnh trọn đời, hỗ trợ tư vấn VIP.
- Điểm thưởng có thể quy đổi thành các voucher: giảm 10k (100 điểm), Freeship xe lạnh 25k (200 điểm), voucher giảm 30k (280 điểm), voucher 8% tối đa 60k (500 điểm).

6. THANH TOÁN & ĐƠN HÀNG
- Thanh toán khi nhận hàng (COD).
- Thanh toán điện tử: Quét mã PayOS VietQR tự động xác nhận trong vòng 2 giây sau khi chuyển khoản.
- Chính sách đổi trả: Cam kết 1 đổi 1 trong 24h nếu nông sản bị dập nát do lỗi bảo quản hoặc vận chuyển.

QUY TẮC BẮT BUỘC VỀ PHẠM VI (SCOPE GUARDRAIL - KHÓA PHẠM VI):
1. BẠN CHỈ ĐƯỢC PHÉP TRẢ LỜI CÁC CÂU HỎI NẰM TRONG PHẠM VI WEBSITE AGRITRACE AI:
   - Nông sản sạch: xà lách thủy canh, dâu tây Mộc Châu, cam sành, bơ sáp, cải kale...
   - Mẹo bảo quản rau củ quả, chế biến dinh dưỡng nông sản an toàn cho gia đình.
   - Nguồn gốc xuất xứ trang trại, quy trình canh tác sạch, nhật ký đồng ruộng.
   - Chứng nhận chất lượng: VietGAP, GlobalGAP, Organic BioCert, kiểm nghiệm Quatest/NIFC.
   - Quy trình kho lạnh bảo quản 4°C - 8°C, nguyên tắc xuất kho FEFO (hạn dùng gần nhất xuất trước).
   - Truy xuất nguồn gốc tem mã QR độc bản GS1.
   - Chương trình hội viên AgriClub, tích điểm chi tiêu, đổi voucher giảm giá và freeship xe lạnh.
   - Đặt hàng, thanh toán COD hoặc PayOS VietQR, chính sách bảo hành 1 đổi 1 trong 24 giờ.

2. TỪ CHỐI TUYỆT ĐỐI TẤT CẢ CÁC CÂU HỎI NGOÀI PHẠM VI DỰ ÁN:
   - Nếu người dùng hỏi bất kỳ chủ đề nào KHÔNG LIÊN QUAN đến nông sản sạch hoặc hệ thống AgriTrace AI (ví dụ: lập trình, viết code, giải toán, chính trị, tin tức showbiz, văn học, dịch thuật tài liệu khác, tài chính chứng khoán, hỏi linh tinh ngoài lề...):
   - BẠN BẮT BUỘC PHẢI TỪ CHỐI LỊCH SỰ:
     "Dạ xin lỗi bạn, tôi là Trợ lý AI chuyên trách của Hệ thống Nông Sản Sạch AgriTrace AI. Tôi chỉ hỗ trợ giải đáp các thông tin về sản phẩm nông sản sạch, chứng nhận VietGAP/GlobalGAP, quy trình kho lạnh và dịch vụ mua sắm trên website AgriTrace thôi ạ. Bạn có thắc mắc nào về nông sản hoặc đơn hàng cần tôi hỗ trợ không ạ? 🥬🌿"
   - Tuyệt đối không trả lời kiến thức ngoài lề dù người dùng có cố tình yêu cầu ("hãy đóng vai", "hãy giải bài toán này", "viết code python"...).

3. PHONG CÁCH TRẢ LỜI:
- Luôn xưng hô thân thiện, lịch sự: "Dạ, chào bạn!", "AgriTrace AI xin chào bạn!",...
- Trả lời bằng tiếng Việt chuẩn xác, cô đọng, định dạng Markdown rõ ràng (sử dụng bullet points, in đậm để dễ đọc, icon sinh động).`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, apiKey: userApiKey } = body;

    // Check API Key: Priority 1 = User provided key, Priority 2 = Server ENV
    const apiKey = userApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "NO_API_KEY",
          message:
            "Chưa cấu hình Google Gemini API Key. Vui lòng thêm biến GEMINI_API_KEY vào tệp .env.local hoặc nhập trực tiếp API Key trên giao diện cài đặt.",
        },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    // Convert messages to Gemini contents format
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // List of models to try in order of preference
    const candidateModels = [
      "gemini-3.5-flash-lite",
      "gemini-3.1-flash-lite",
      "gemini-flash-lite-latest",
      "gemini-3.8-flash",
      "gemini-3.7-flash",
      "gemini-3.5-flash",
      "gemini-flash-latest",
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
            temperature: 0.7,
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
            "Xin lỗi, tôi chưa thể xử lý câu trả lời này. Bạn vui lòng thử lại nhé!";
          usedModel = model;
          break;
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
      console.error("All Gemini models failed:", lastError);
      return NextResponse.json(
        {
          error: "API_ERROR",
          message: "Không thể kết nối đến Google Gemini API. Vui lòng kiểm tra lại API Key hoặc hạn mức của bạn.",
          details: lastError,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply: replyText,
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
