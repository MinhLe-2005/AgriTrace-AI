"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Gift,
  HelpCircle,
  Leaf,
  MessageSquare,
  PhoneCall,
  QrCode,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Truck,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState, useMemo } from "react";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type FAQCategory = "all" | "shipping" | "return" | "qr" | "payment" | "loyalty" | "ai";

interface FAQItem {
  id: string;
  category: FAQCategory;
  categoryLabel: string;
  categoryColor: string;
  question: string;
  summary: string;
  answerContent: {
    lead: string;
    highlights?: string[];
    steps?: { step: string; title: string; desc: string }[];
    callout?: { type: "info" | "warning" | "success"; text: string };
    actionLink?: { label: string; href: string };
  };
}

const FAQ_DATABASE: FAQItem[] = [
  // ── 1. GIAO HÀNG & XE LẠNH 24H ──
  {
    id: "faq-ship-1",
    category: "shipping",
    categoryLabel: "Giao Hàng Xe Lạnh",
    categoryColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    question: "Quy chuẩn bảo quản bằng xe lạnh 2°C - 5°C của AgriTrace hoạt động như thế nào?",
    summary: "Đảm bảo nông sản giữ trọn độ tươi giòn, vitamin và khoáng chất suốt từ kho đến bàn ăn.",
    answerContent: {
      lead: "100% rau, củ, quả sau khi thu hái tại nông trại Mộc Châu và Đà Lạt được sơ chế, đóng gói bằng màng thở sinh học vi lỗ và chuyển ngay vào thùng xe lạnh chuyên dụng kiểm soát nhiệt độ tự động.",
      highlights: [
        "Nhiệt độ thùng xe luôn duy trì từ 2°C đến 5°C, độ ẩm 85% - 95% chống héo úa và ngăn vi khuẩn phát triển.",
        "Cảm biến nhiệt độ IoT gắn trong thùng xe đồng bộ dữ liệu thời gian thực lên hệ thống quản lý.",
        "Khách hàng có thể quét mã QR trên thùng hàng để xem biểu đồ nhiệt độ lưu thông suốt quãng đường.",
      ],
      callout: {
        type: "info",
        text: "Cam kết không sốc nhiệt: Rau ăn lá và trái cây đặc sản đến tay bạn vẫn giữ trọn vị giòn ngọt nguyên bản như vừa thu hái sáng sớm tại vườn.",
      },
      actionLink: {
        label: "Tìm hiểu thêm về Chính Sách Chuỗi Lạnh 24H →",
        href: "/about#coldchain",
      },
    },
  },
  {
    id: "faq-ship-2",
    category: "shipping",
    categoryLabel: "Giao Hàng Xe Lạnh",
    categoryColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    question: "Phí giao hàng xe lạnh là bao nhiêu và làm sao để được miễn phí vận chuyển (Freeship)?",
    summary: "Phí cố định 25.000đ toàn khu vực nội thành, miễn phí 100% cho đơn từ 150.000đ.",
    answerContent: {
      lead: "Do vận chuyển bằng xe lạnh chuyên dụng bảo quản tươi, phí giao hàng tiêu chuẩn là 25.000đ cho mỗi đơn hàng.",
      highlights: [
        "Miễn phí vận chuyển (Freeship 0đ) cho tất cả các đơn hàng nông sản có giá trị từ 150.000đ trở lên.",
        "Áp dụng mã FREESHIP hoặc FREESHIP25 khi đặt hàng nhanh (QuickBuy) để được trừ trực tiếp 25.000đ phí giao hàng.",
        "Hội viên AgriClub hạng Vàng và Kim Cương được tặng 4 - 8 lượt freeship hàng tháng trong ví voucher.",
      ],
      actionLink: {
        label: "Xem và lưu mã Freeship trong Kho Voucher →",
        href: "/vouchers",
      },
    },
  },
  {
    id: "faq-ship-3",
    category: "shipping",
    categoryLabel: "Giao Hàng Xe Lạnh",
    categoryColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    question: "Tôi có thể chọn khung giờ giao nhận ngoài giờ hành chính hoặc giao hẹn giờ không?",
    summary: "Hệ thống hỗ trợ 3 khung giờ giao nhận linh hoạt theo yêu cầu của bạn.",
    answerContent: {
      lead: "Khi đặt hàng trên AgriTrace, bạn có thể chủ động chọn khung giờ thuận tiện nhất tại Bước 2 (Giao Hàng):",
      steps: [
        {
          step: "1",
          title: "Giao Hỏa Tốc 24H (Thuận tiện giao sớm)",
          desc: "Tài xế giao ngay trong khung giờ sớm nhất kể từ lúc nông sản hoàn tất đóng gói tại kho lạnh.",
        },
        {
          step: "2",
          title: "Giờ Hành Chính (08:00 - 17:00)",
          desc: "Phù hợp nhận tại cơ quan, văn phòng làm việc. Tài xế gọi trước 15-20 phút.",
        },
        {
          step: "3",
          title: "Ngoài Giờ Hành Chính (Sau 17:30 tối)",
          desc: "Giao tận nhà vào buổi tối khi bạn đã đi làm về, tránh tình trạng hàng đến khi vắng nhà.",
        },
      ],
      callout: {
        type: "success",
        text: "Bạn cũng có thể ghi chú thêm cho tài xế xe lạnh: 'Gọi trước 15 phút', 'Giao lên tầng 4', 'Gửi bảo vệ sảnh A'...",
      },
    },
  },

  // ── 2. ĐỔI TRẢ & HOÀN TIỀN 24H ──
  {
    id: "faq-return-1",
    category: "return",
    categoryLabel: "Đổi Trả & Bảo Hành",
    categoryColor: "bg-amber-100 text-amber-800 border-amber-200",
    question: "Chính sách đổi trả 1-đổi-1 trong vòng 24 giờ của AgriTrace áp dụng như thế nào?",
    summary: "Đổi mới miễn phí hoặc hoàn tiền 100% siêu tốc trong 2 giờ làm việc nếu nông sản bị lỗi.",
    answerContent: {
      lead: "AgriTrace cam kết bảo vệ tối đa quyền lợi người tiêu dùng nông sản sạch với chính sách bảo hành 24H không điều kiện vô lý:",
      highlights: [
        "Được đồng kiểm cùng tài xế: Khi nhận hàng, bạn được quyền mở kiểm tra độ tươi giòn, hình thức và mã lô sản phẩm.",
        "Đổi mới 1-đổi-1 hoàn toàn miễn phí: Áp dụng nếu nông sản bị dập nát do vận chuyển, úng hỏng bên trong hoặc không đúng mô tả.",
        "Hoàn tiền 100%: Trường hợp kho tạm hết sản phẩm tương đương, AgriTrace hoàn tiền ngay vào tài khoản qua VietQR trong vòng 2 giờ.",
        "Thời hạn khiếu nại: Trong vòng 24 giờ kể từ thời điểm nhận hàng thành công.",
      ],
      callout: {
        type: "warning",
        text: "Chỉ cần chụp 1 tấm ảnh hoặc quay video ngắn gửi qua Hotline 1900 888 666 hoặc mục Hỗ trợ đơn hàng trong trang cá nhân, chúng tôi xử lý ngay lập tức.",
      },
      actionLink: {
        label: "Đọc toàn văn Điều Khoản Dịch Vụ & Đổi Trả →",
        href: "/terms",
      },
    },
  },
  {
    id: "faq-return-2",
    category: "return",
    categoryLabel: "Đổi Trả & Bảo Hành",
    categoryColor: "bg-amber-100 text-amber-800 border-amber-200",
    question: "Quy trình gửi yêu cầu đổi trả hoặc hủy đơn hàng diễn ra như thế nào?",
    summary: "Thao tác đơn giản trực tiếp trên website hoặc gọi hotline hỗ trợ.",
    answerContent: {
      lead: "Bạn có thể tự thao tác trực tiếp trên hệ thống chỉ với 3 bước đơn giản:",
      steps: [
        {
          step: "Bước 1",
          title: "Vào mục Đơn Mua của tôi",
          desc: "Đăng nhập tài khoản và chọn tab 'Đơn Mua' hoặc nhấn nút 'Đơn Mua' trên thanh điều hướng.",
        },
        {
          step: "Bước 2",
          title: "Chọn đơn hàng cần khiếu nại / đổi trả",
          desc: "Nhấn vào chi tiết đơn hàng, chọn nút 'Yêu Cầu Đổi Trả' hoặc 'Hủy Đơn' (nếu đơn chưa xuất kho).",
        },
        {
          step: "Bước 3",
          title: "Xác nhận xử lý trong 15 phút",
          desc: "Chuyên viên CSKH AgriTrace sẽ liên hệ xác nhận và điều phối xe lạnh giao sản phẩm mới hoặc hoàn tiền.",
        },
      ],
    },
  },

  // ── 3. TRUY XUẤT QR & NGUỒN GỐC ──
  {
    id: "faq-qr-1",
    category: "qr",
    categoryLabel: "Truy Xuất QR & GS1",
    categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    question: "Mã QR GS1 trên bao bì nông sản giúp tôi tra cứu được những thông tin gì?",
    summary: "Minh bạch 100% nhật ký canh tác từ ngày gieo trồng đến ngày thu hoạch và kiểm định.",
    answerContent: {
      lead: "Mỗi lô nông sản xuất kho được hệ thống cấp một mã định danh điện tử chuẩn quốc tế GS1. Khi dùng camera điện thoại hoặc tính năng Quét QR của AgriTrace, bạn sẽ xem được toàn bộ lý lịch sản phẩm:",
      highlights: [
        "Nông trại & Hợp tác xã sản xuất: Địa chỉ vườn, tọa độ địa lý, diện tích canh tác.",
        "Lịch sử mùa vụ & canh tác: Ngày gieo hạt, loại phân bón vi sinh/hữu cơ sử dụng, ngày cách ly an toàn.",
        "Giấy chứng nhận VietGAP / GlobalGAP: Số hiệu chứng chỉ, cơ quan cấp và ngày hiệu lực.",
        "Quy trình thu hoạch & chuỗi lạnh: Thời gian hái sáng sớm, nhiệt độ xe lạnh và mã nhân viên kiểm định.",
      ],
      actionLink: {
        label: "Thử tra cứu mã QR lô hàng ngay →",
        href: "/traceability",
      },
    },
  },
  {
    id: "faq-qr-2",
    category: "qr",
    categoryLabel: "Truy Xuất QR & GS1",
    categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    question: "Làm thế nào để xác minh chứng nhận VietGAP / GlobalGAP có thật và còn hạn hay không?",
    summary: "Hệ thống tích hợp giấy kiểm định scan gốc có dấu đỏ đối soát từ cơ quan thẩm quyền.",
    answerContent: {
      lead: "Trên trang chi tiết mỗi sản phẩm và trang tra cứu lô hàng, AgriTrace cung cấp số hiệu chứng nhận kèm đường link xác thực gốc:",
      highlights: [
        "Mỗi chứng chỉ đều được bộ phận Quản trị viên (Admin) đối soát với cơ sở dữ liệu của Cục Trồng trọt - Bộ NN&PTNT.",
        "Chứng nhận hết hạn sẽ tự động bị hệ thống cảnh báo và khóa quyền xuất kho mã hàng tương ứng.",
        "Kết quả kiểm định dư lượng hóa chất bảo vệ thực vật (BVTV = 0) được cập nhật định kỳ mỗi đợt thu hoạch.",
      ],
      callout: {
        type: "success",
        text: "Bạn có thể xem trực tiếp bản scan giấy chứng nhận tại tab 'Chứng Nhận Chất Lượng' của trang Truy Xuất QR.",
      },
      actionLink: {
        label: "Xem bảng chứng nhận VietGAP / GlobalGAP →",
        href: "/traceability?tab=cert",
      },
    },
  },

  // ── 4. THANH TOÁN VIETQR & COD ──
  {
    id: "faq-pay-1",
    category: "payment",
    categoryLabel: "Thanh Toán & Cổng PayOS",
    categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
    question: "Thanh toán qua cổng payOS VietQR Napas 24/7 có an toàn không, mất bao lâu để xác nhận?",
    summary: "Tự động xác nhận trong 2 giây, không cần nhập số tài khoản thủ công, bảo mật tuyệt đối.",
    answerContent: {
      lead: "Cổng thanh toán payOS là giải pháp thanh toán điện tử chuẩn Ngân hàng Nhà nước Việt Nam, tích hợp công nghệ VietQR Napas 24/7:",
      highlights: [
        "Mã QR động chứa sẵn số tiền và nội dung chuyển khoản chính xác, tránh nhầm lẫn 100%.",
        "Hỗ trợ mở bằng bất kỳ ứng dụng ngân hàng nào (Vietcombank, MB, Techcombank, BIDV, ACB...) hoặc ví điện tử MoMo, ZaloPay.",
        "Xác nhận tự động trong 2 giây qua Webhook thông minh, đơn hàng lập tức chuyển sang trạng thái 'ĐÃ THANH TOÁN'.",
        "Không yêu cầu lưu thông tin thẻ ngân hàng của khách, bảo mật dữ liệu tuyệt đối.",
      ],
      callout: {
        type: "info",
        text: "Sau khi chuyển khoản, màn hình tự động chuyển sang trang Chi Tiết Đơn Hàng để bạn theo dõi lộ trình vận chuyển.",
      },
    },
  },
  {
    id: "faq-pay-2",
    category: "payment",
    categoryLabel: "Thanh Toán & Cổng PayOS",
    categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
    question: "Tôi có thể thanh toán tiền mặt khi nhận hàng (COD) được không?",
    summary: "Hỗ trợ 100% hình thức COD: Nhận hàng tươi mát, kiểm tra chuẩn rồi mới trả tiền.",
    answerContent: {
      lead: "Có, AgriTrace hỗ trợ đầy đủ phương thức Thanh toán khi nhận hàng (COD):",
      highlights: [
        "Bạn chỉ cần chọn 'Thanh toán khi nhận hàng (COD)' ở Bước 3 khi đặt mua sản phẩm.",
        "Tài xế xe lạnh giao hàng tận tay, bạn kiểm tra rau củ tươi ngon đúng chuẩn rồi mới gửi tiền mặt.",
        "Đơn hàng COD vẫn được hưởng đầy đủ các mã giảm giá voucher và tích lũy điểm thưởng AgriClub.",
      ],
    },
  },

  // ── 5. HỘI VIÊN AGRICLUB & VOUCHER ──
  {
    id: "faq-loyalty-1",
    category: "loyalty",
    categoryLabel: "Ưu Đãi & Hội Viên",
    categoryColor: "bg-teal-100 text-teal-800 border-teal-200",
    question: "Chương trình tích điểm AgriClub và các hạng thành viên mang lại quyền lợi gì?",
    summary: "Tích lũy điểm thưởng tự động mỗi đơn hàng, đổi voucher tiền mặt và quà nông sản.",
    answerContent: {
      lead: "Mỗi khi mua sắm thành công, hệ thống tự động cộng điểm thưởng vào tài khoản của bạn theo tỷ lệ 10.000đ = 1 đến 2 điểm AgriClub:",
      steps: [
        {
          step: "Đồng (Bronze)",
          title: "Hạng Khởi Đầu (Mặc định)",
          desc: "Tích 1.0x điểm, tặng voucher Chào bạn mới 20.000đ.",
        },
        {
          step: "Bạc (Silver)",
          title: "Từ 500 điểm tích lũy",
          desc: "Tích 1.2x điểm, tặng 2 mã Freeship xe lạnh hàng tháng, ưu tiên thu hoạch hàng sớm.",
        },
        {
          step: "Vàng (Gold)",
          title: "Từ 2.000 điểm tích lũy",
          desc: "Tích 1.5x điểm, giảm 5% trực tiếp mọi đơn, tặng 4 mã Freeship và voucher VIPGOLD 50k.",
        },
        {
          step: "Kim Cương",
          title: "Từ 5.000 điểm tích lũy",
          desc: "Tích 2.0x điểm, miễn phí ship không giới hạn, quà tặng nông sản đặc sản sinh nhật.",
        },
      ],
      actionLink: {
        label: "Xem Thẻ Hội Viên & Điểm Tích Lũy Của Bạn →",
        href: "/loyalty",
      },
    },
  },
  {
    id: "faq-loyalty-2",
    category: "loyalty",
    categoryLabel: "Ưu Đãi & Hội Viên",
    categoryColor: "bg-teal-100 text-teal-800 border-teal-200",
    question: "Tôi có thể áp dụng mã giảm giá voucher như thế nào khi mua hàng?",
    summary: "Áp dụng nhanh bằng 1 cú click ngay tại Bước 1 của đơn đặt hàng.",
    answerContent: {
      lead: "Khi mua sắm trên AgriTrace, bạn có 2 cách áp dụng voucher cực kỳ nhanh chóng:",
      highlights: [
        "Cách 1: Nhấn vào các chip voucher gợi ý có sẵn (FREESHIP, AGRI30, VIPGOLD) để hệ thống tự điền và kích hoạt.",
        "Cách 2: Nhập trực tiếp mã ưu đãi bạn nhận được vào ô 'Nhập mã voucher' và nhấn 'Áp dụng'.",
        "Hệ thống sẽ tự động trừ ngay số tiền giảm giá và hiển thị số tiền thanh toán thực tế minh bạch.",
      ],
      callout: {
        type: "success",
        text: "Mỗi tài khoản được sử dụng các mã khuyến mãi tân thủ một lần. Hãy kiểm tra điều kiện giá trị đơn hàng tối thiểu ghi trên voucher nhé!",
      },
      actionLink: {
        label: "Khám phá Kho Voucher Khuyến Mãi →",
        href: "/vouchers",
      },
    },
  },

  // ── 6. TRÍ TUỆ NHÂN TẠO AI & ĐỐI TÁC ──
  {
    id: "faq-ai-1",
    category: "ai",
    categoryLabel: "Trí Tuệ Nhân Tạo AI",
    categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
    question: "Trợ lý AI AgriTrace (Google Gemini) có thể hỗ trợ tôi những việc gì?",
    summary: "Tư vấn mùa vụ nông sản, hướng dẫn cách bảo quản rau củ và giải đáp thắc mắc 24/7.",
    answerContent: {
      lead: "Trợ lý AI được tích hợp trực tiếp trên website (nút 'Hỏi Trợ Lý AI' ở góc dưới màn hình) và hỗ trợ bạn mọi lúc:",
      highlights: [
        "Tư vấn nông sản theo mùa vụ: Mách bạn loại rau quả nào đang vào vụ chính ngon nhất (Dâu tây Mộc Châu, Cam Hàm Yên, Cải kale Đà Lạt...).",
        "Tra cứu nguồn gốc lô hàng: Chỉ cần hỏi 'Lô xà lách XL-2026-08 trồng ở đâu?' AI sẽ cung cấp thông tin nông trại và chứng nhận VietGAP ngay.",
        "Mẹo bảo quản & dinh dưỡng: Hướng dẫn cách rửa rau, bảo quản trong ngăn mát tủ lạnh và gợi ý món ăn dinh dưỡng.",
        "Điều hướng đặt hàng 1-chạm: Gợi ý nút '⚡ Mua Ngay' kèm mã giảm giá để bạn đặt mua trực tiếp.",
      ],
      callout: {
        type: "info",
        text: "Bạn có thể bấm vào bong bóng tròn màu xanh ngọc 'Hỏi Trợ Lý AI' ở góc dưới bên phải màn hình để trò chuyện bất cứ lúc nào!",
      },
    },
  },
  {
    id: "faq-ai-2",
    category: "ai",
    categoryLabel: "Nông Trại & Đối Tác",
    categoryColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    question: "Tôi là chủ nông trại / nhà vườn, làm thế nào để liên kết bán nông sản trên AgriTrace?",
    summary: "Quy trình kiểm định và tham gia chuỗi cung ứng số hóa dành cho nhà vườn.",
    answerContent: {
      lead: "AgriTrace luôn chào đón các hợp tác xã và nhà vườn canh tác an toàn tham gia hệ sinh thái:",
      steps: [
        {
          step: "1",
          title: "Đăng ký tài khoản Nông Dân (Farmer)",
          desc: "Tạo tài khoản và chọn vai trò 'Nông dân' trên trang đăng ký của AgriTrace.",
        },
        {
          step: "2",
          title: "Nộp hồ sơ kiểm định VietGAP / GlobalGAP",
          desc: "Tải lên bản sao chứng nhận an toàn thực phẩm, diện tích vườn và các loại nông sản chủ lực.",
        },
        {
          step: "3",
          title: "Phê duyệt & Cấp quyền sinh mã QR GS1",
          desc: "Chuyên viên kiểm định AgriTrace thẩm định thực địa trong 48h và cấp quyền tạo lô hàng điện tử.",
        },
      ],
      actionLink: {
        label: "Đăng ký liên kết nông trại ngay →",
        href: "/register",
      },
    },
  },
];

const CATEGORY_TABS: { key: FAQCategory; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "Tất cả câu hỏi", icon: HelpCircle },
  { key: "shipping", label: "Giao Hàng Xe Lạnh", icon: Truck },
  { key: "return", label: "Đổi Trả & Bảo Hành", icon: RotateCcw },
  { key: "qr", label: "Truy Xuất QR & GS1", icon: QrCode },
  { key: "payment", label: "Thanh Toán VietQR & COD", icon: CreditCard },
  { key: "loyalty", label: "Voucher & Hội Viên", icon: Gift },
  { key: "ai", label: "Trợ Lý AI & Nông Trại", icon: Sparkles },
];

export default function FAQPage() {
  const [activeTab, setActiveTab] = useState<FAQCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "faq-ship-1": true,
    "faq-return-1": true,
    "faq-qr-1": true,
  });
  const [helpfulFeedback, setHelpfulFeedback] = useState<Record<string, "yes" | "no">>({});

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleFeedback = (id: string, type: "yes" | "no") => {
    setHelpfulFeedback((prev) => ({ ...prev, [id]: type }));
    toast.success(type === "yes" ? "Cảm ơn bạn đã đánh giá hữu ích!" : "Cảm ơn góp ý của bạn, chúng tôi sẽ cải thiện câu trả lời!");
  };

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return FAQ_DATABASE.filter((item) => {
      const matchTab = activeTab === "all" || item.category === activeTab;
      const matchSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.answerContent.lead.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [activeTab, searchQuery]);

  // Count per category
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: FAQ_DATABASE.length };
    FAQ_DATABASE.forEach((item) => {
      c[item.category] = (c[item.category] || 0) + 1;
    });
    return c;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-gray-50/60 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-emerald-700 transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft size={13} />
            <span>Trang chủ</span>
          </Link>
          <ChevronRight size={12} className="text-gray-400" />
          <Link href="/terms" className="hover:text-emerald-700 transition-colors">
            Hỗ Trợ & Chính Sách
          </Link>
          <ChevronRight size={12} className="text-gray-400" />
          <span className="text-emerald-900 font-bold">Câu Hỏi Thường Gặp (FAQ)</span>
        </div>

        {/* ── HERO BANNER CHUYÊN NGHIỆP ── */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/15 to-transparent pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-inner">
              <HelpCircle size={14} />
              <span>Trung Tâm Trợ Giúp & Giải Đáp 24/7</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Câu Hỏi Thường Gặp (FAQ) & Hướng Dẫn Mua Hàng
            </h1>

            <p className="text-emerald-200/90 text-xs sm:text-sm leading-relaxed">
              Giải đáp chi tiết về quy chuẩn kiểm định VietGAP, công nghệ quét mã QR GS1, quy trình giao nhận xe lạnh 2°C - 5°C, chính sách đổi trả 24H và thanh toán tự động payOS.
            </p>

            {/* Smart Search Bar */}
            <div className="pt-2">
              <div className="relative max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm: đổi trả 24h, mã VietQR, bảo quản xe lạnh, VietGAP..."
                  className="w-full h-12 pl-11 pr-10 bg-white text-gray-900 rounded-2xl shadow-lg border-2 border-emerald-500/40 focus:border-emerald-400 focus:outline-none text-xs sm:text-sm font-medium placeholder:text-gray-400 placeholder:font-normal"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Quick Search Chips */}
              <div className="pt-2.5 flex items-center gap-1.5 flex-wrap text-[11px] text-emerald-200/90">
                <span className="font-semibold text-emerald-300">Gợi ý tìm nhanh:</span>
                {[
                  "Đổi trả 24h",
                  "Mã VietQR",
                  "Bảo quản xe lạnh",
                  "VietGAP",
                  "Freeship",
                  "Tích điểm",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 transition-colors cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── TOP 4 QUICK TOPIC CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("shipping");
              setSearchQuery("");
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer group shadow-2xs",
              activeTab === "shipping"
                ? "bg-cyan-50/90 border-cyan-400 ring-2 ring-cyan-400/30"
                : "bg-white border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/40"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Truck size={20} />
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 group-hover:text-cyan-900">
              Giao Xe Lạnh 24H
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Nhiệt độ 2°C - 5°C, Freeship</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("return");
              setSearchQuery("");
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer group shadow-2xs",
              activeTab === "return"
                ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30"
                : "bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50/40"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <RotateCcw size={20} />
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 group-hover:text-amber-900">
              Đổi Trả 1-Đổi-1
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Bảo hành 24H, hoàn tiền trong 2h</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("qr");
              setSearchQuery("");
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer group shadow-2xs",
              activeTab === "qr"
                ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/30"
                : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <QrCode size={20} />
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-900">
              Mã QR & VietGAP
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Nhật ký canh tác GS1 điện tử</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("payment");
              setSearchQuery("");
            }}
            className={cn(
              "p-4 rounded-2xl border text-left transition-all cursor-pointer group shadow-2xs",
              activeTab === "payment"
                ? "bg-purple-50/90 border-purple-400 ring-2 ring-purple-400/30"
                : "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50/40"
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <CreditCard size={20} />
            </div>
            <h3 className="font-extrabold text-xs sm:text-sm text-gray-900 group-hover:text-purple-900">
              VietQR & Cổng PayOS
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">Quét mã 24/7, xác thực 2 giây</p>
          </button>
        </div>

        {/* ── CATEGORY PILLS TABS ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200/80 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const count = counts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0",
                  isActive
                    ? "bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-300"
                    : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ml-0.5",
                    isActive ? "bg-emerald-900 text-emerald-200" : "bg-gray-100 text-gray-500"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── FAQ LIST ACCORDIONS ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Hiển thị <strong>{filteredFaqs.length}</strong> câu hỏi giải đáp phù hợp
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-emerald-700 font-bold hover:underline"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>

          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = !!openItems[faq.id];
              const feedback = helpfulFeedback[faq.id];

              return (
                <div
                  key={faq.id}
                  className={cn(
                    "bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-2xs",
                    isOpen
                      ? "border-emerald-300 shadow-md ring-1 ring-emerald-200/60"
                      : "border-gray-200 hover:border-emerald-200 hover:shadow-xs"
                  )}
                >
                  {/* Accordion Trigger Header */}
                  <button
                    type="button"
                    onClick={() => toggleItem(faq.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer focus:outline-none group"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider",
                            faq.categoryColor
                          )}
                        >
                          {faq.categoryLabel}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">#{faq.id}</span>
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-gray-900 group-hover:text-emerald-800 transition-colors leading-snug pt-0.5">
                        {faq.question}
                      </h3>
                      {!isOpen && (
                        <p className="text-xs text-gray-500 line-clamp-1 pt-0.5">
                          {faq.summary}
                        </p>
                      )}
                    </div>

                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200",
                        isOpen
                          ? "bg-emerald-100 text-emerald-800 rotate-180"
                          : "bg-gray-100 text-gray-500 group-hover:bg-emerald-50 group-hover:text-emerald-700"
                      )}
                    >
                      <ChevronDown size={16} />
                    </div>
                  </button>

                  {/* Accordion Expandable Answer Body */}
                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-100 bg-gradient-to-b from-emerald-50/20 to-white text-xs text-gray-700 space-y-4 animate-in fade-in duration-150 leading-relaxed">
                      {/* Lead text */}
                      <p className="text-xs sm:text-sm text-gray-800 font-medium leading-relaxed">
                        {faq.answerContent.lead}
                      </p>

                      {/* Bullet highlights if any */}
                      {faq.answerContent.highlights && (
                        <div className="space-y-2 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80">
                          {faq.answerContent.highlights.map((h, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <CheckCircle2 size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                              <span className="text-gray-700 leading-snug">{h}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Step-by-step numbered cards if any */}
                      {faq.answerContent.steps && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          {faq.answerContent.steps.map((st, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-1"
                            >
                              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                                {st.step}
                              </div>
                              <h4 className="font-bold text-xs text-gray-900 pt-0.5">{st.title}</h4>
                              <p className="text-[11px] text-gray-500 leading-snug">{st.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Callout box if any */}
                      {faq.answerContent.callout && (
                        <div
                          className={cn(
                            "p-3 rounded-xl border flex items-start gap-2.5 text-xs",
                            faq.answerContent.callout.type === "info" && "bg-cyan-50/80 border-cyan-200 text-cyan-950",
                            faq.answerContent.callout.type === "warning" && "bg-amber-50/80 border-amber-200 text-amber-950",
                            faq.answerContent.callout.type === "success" && "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                          )}
                        >
                          <ShieldCheck size={16} className="shrink-0 mt-0.5 text-emerald-700" />
                          <span className="leading-snug">{faq.answerContent.callout.text}</span>
                        </div>
                      )}

                      {/* Action Link & Feedback Row */}
                      <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px]">
                        {faq.answerContent.actionLink ? (
                          <Link
                            href={faq.answerContent.actionLink.href}
                            className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1"
                          >
                            <span>{faq.answerContent.actionLink.label}</span>
                            <ExternalLink size={12} />
                          </Link>
                        ) : (
                          <span className="text-gray-400">Nội dung cập nhật mới nhất năm 2026</span>
                        )}

                        {/* Was this helpful? */}
                        <div className="flex items-center gap-2 text-gray-500 ml-auto">
                          <span>Câu trả lời có hữu ích không?</span>
                          <button
                            type="button"
                            onClick={() => handleFeedback(faq.id, "yes")}
                            className={cn(
                              "px-2 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer",
                              feedback === "yes"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                                : "hover:bg-gray-100 text-gray-600 border-gray-200"
                            )}
                          >
                            <ThumbsUp size={12} />
                            <span>Có</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFeedback(faq.id, "no")}
                            className={cn(
                              "px-2 py-1 rounded-lg border flex items-center gap-1 transition-all cursor-pointer",
                              feedback === "no"
                                ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                                : "hover:bg-gray-100 text-gray-600 border-gray-200"
                            )}
                          >
                            <ThumbsDown size={12} />
                            <span>Chưa</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
              <HelpCircle size={40} className="mx-auto text-gray-300" />
              <h3 className="font-bold text-gray-900 text-base">Không tìm thấy câu hỏi phù hợp</h3>
              <p className="text-gray-500 text-xs max-w-sm mx-auto">
                Không tìm thấy kết quả cho từ khóa &quot;{searchQuery}&quot;. Bạn có thể đổi từ khóa hoặc liên hệ trực tiếp với chuyên viên hỗ trợ.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                }}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
              >
                Xem tất cả câu hỏi
              </button>
            </div>
          )}
        </div>

        {/* ── 3 INTERACTIVE CONTACT CARDS CHUYÊN NGHIỆP ── */}
        <div className="pt-4 space-y-3">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-gray-900">Vẫn Cần Hỗ Trợ Hoặc Khiếu Nại Đơn Hàng?</h3>
            <p className="text-xs text-gray-500">Đội ngũ chuyên viên AgriTrace luôn sẵn sàng giải đáp thắc mắc 24/7</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Hotline */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <PhoneCall size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-950">Tổng Đài Hotline CSKH</h4>
                <p className="text-xs text-gray-500 leading-snug">
                  Tiếp nhận phản ánh chất lượng, đổi trả 1-đổi-1 và hỗ trợ đơn hàng hỏa tốc.
                </p>
              </div>
              <div>
                <a
                  href="tel:1900888666"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <PhoneCall size={14} />
                  <span>Gọi 1900 888 666 (Miễn phí)</span>
                </a>
              </div>
            </div>

            {/* Card 2: AI Gemini Chat */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-sm flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center font-bold">
                  <Sparkles size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-white">Trợ Lý AI Gemini 24/7</h4>
                <p className="text-xs text-emerald-200/90 leading-snug">
                  Tư vấn nông sản theo mùa vụ, giải đáp truy xuất mã lô và đặt hàng tức thì.
                </p>
              </div>
              <div>
                <Link
                  href="/chat"
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-black transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>Trò Chuyện Với AI Ngay</span>
                </Link>
              </div>
            </div>

            {/* Card 3: Terms of Service Link */}
            <div className="p-5 rounded-3xl bg-white border border-gray-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-emerald-300 transition-all">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <h4 className="font-extrabold text-sm text-gray-950">Văn Bản Điều Khoản Dịch Vụ</h4>
                <p className="text-xs text-gray-500 leading-snug">
                  Đọc quy chế hoạt động, cam kết chất lượng VietGAP và chính sách chuỗi lạnh toàn văn.
                </p>
              </div>
              <div>
                <Link
                  href="/terms"
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-300 hover:border-emerald-600 hover:bg-emerald-50 text-gray-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FileText size={14} />
                  <span>Xem Toàn Văn Điều Khoản →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
