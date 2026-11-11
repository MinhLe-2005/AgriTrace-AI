"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  Filter,
  Leaf,
  Newspaper,
  Search,
  Share2,
  ShoppingBag,
  Sparkles,
  Tag,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCampaignStore } from "@/stores/campaign-store";
import { toast } from "@/stores/toast-store";

interface BlogPostSection {
  heading: string;
  paragraphs: string[];
  quote?: string;
  keyTakeaways?: string[];
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: "all" | "ai" | "season" | "standard" | "guide";
  categoryLabel: string;
  categoryColor: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  featured?: boolean;
  coverImage?: string;
  relatedProduct?: {
    name: string;
    price: string;
    oldPrice?: string;
    unit: string;
    badge: string;
    link: string;
  };
  sections: BlogPostSection[];
}

const POSTS: BlogPost[] = [
  {
    id: "post-season-pricing",
    featured: true,
    title: "Chương Trình Trợ Giá Nông Sản Mùa Vụ Thu Đông: Biểu Giá Trực Tiếp Tại Vườn & Lịch Thu Hoạch Chi Tiết",
    slug: "chuong-trinh-tro-gia-nong-san-mua-vu-thu-dong",
    excerpt:
      "Chính sách trợ giá trực tiếp 13% – 18% cho nông sản chính vụ tại Đà Lạt, Mộc Châu và Hàm Yên. Bảng tổng hợp lịch biểu tháng nào giảm món gì, cơ chế cộng dồn voucher và hướng dẫn theo dõi sự kiện khuyến mãi.",
    category: "season",
    categoryLabel: "Mùa Vụ & Ưu Đãi",
    categoryColor: "bg-amber-100 text-amber-900",
    author: "Ban Điều Phối Mùa Vụ & Liên Minh HTX",
    authorRole: "Hội Đồng Quản Trị Chuỗi Cung Ứng AgriTrace AI",
    date: "11/11/2026",
    readTime: "5 phút đọc",
    relatedProduct: {
      name: "Dâu Tây New Zealand Mộc Châu (Vụ Mới)",
      price: "180.000 đ",
      oldPrice: "210.000 đ",
      unit: "HỘP 500G",
      badge: "Vụ mùa -14%",
      link: "/products?search=Dâu+Tây",
    },
    sections: [
      {
        heading: "1. Vì sao nông sản chính vụ lại có chính sách trợ giá trực tiếp?",
        paragraphs: [
          "Vào thời điểm vụ Thu Đông, các vùng chuyên canh nông sản đối tác của AgriTrace AI tại Đà Lạt, Mộc Châu, Hàm Yên và Bảo Lộc bước vào giai đoạn thu hoạch rộ nhất trong năm. Sản lượng hái mới tại các nông trại công nghệ cao đạt đỉnh (tăng từ 40% đến 60% so với thông thường).",
          "Nhằm đồng hành cùng bà con nông dân bao tiêu nhanh chóng sản lượng lớn, đồng thời đưa nông sản sạch chuẩn VietGAP/GlobalGAP đến tay người tiêu dùng đô thị trong vòng 24H với chi phí tối ưu nhất, hệ thống AgriTrace AI cùng liên minh HTX áp dụng chính sách trợ giá trực tiếp từ 13% đến 18% vào đơn giá niêm yết xuất kho.",
        ],
        quote: "Nông sản vào chính vụ là lúc chất lượng ngon nhất, dinh dưỡng đậm đà nhất và cũng là thời điểm bà con cần chuỗi tiêu thụ nhanh nhất để giữ trọn độ tươi giòn 24H.",
      },
      {
        heading: "2. Vì sao giảm giá trực tiếp tại vườn mà không cần nhập mã Voucher?",
        paragraphs: [
          "Nhiều khách hàng thường thắc mắc: 'Tại sao sản phẩm lại giảm giá trực tiếp mà không cần nhập mã khuyến mãi? Có phải hàng giảm giá là hàng tồn đọng hay cận date?'. AgriTrace AI xin khẳng định: Đây là chính sách TRỢ GIÁ MÙA VỤ CHÍNH THỨC, hoàn toàn khác với việc xả hàng lỗi.",
          "Lý do là bởi: Khi bước vào chính vụ (Peak Season), năng suất thu hoạch tại các nông trại đạt đỉnh (tăng từ 40% đến 60% sản lượng thông thường). Chi phí vận hành và logistics trên mỗi đơn vị sản phẩm giảm đáng kể. Đặc thù của nông sản tươi sống là chu kỳ tươi ngon tối ưu rất ngắn (24H - 48H); để tránh lưu kho lạnh lâu ngày gây giảm vitamin, liên minh HTX chủ động áp dụng mức trợ giá 13% – 18% trực tiếp vào giá niêm yết bán lẻ.",
          "Mọi khách hàng khi chọn mua đều được trừ thẳng vào đơn giá hiển thị trên website mà không cần phải thực hiện bất kỳ thao tác săn mã hay nhập voucher phức tạp nào.",
        ],
        keyTakeaways: [
          "100% nông sản trợ giá là hàng hái mới sáng sớm (05:30) tại vườn, vận chuyển xe lạnh 2°C - 5°C.",
          "Trợ giá tự động trừ trực tiếp trên giá bán niêm yết mà không cần điều kiện mã.",
          "Tiết kiệm từ 10.000đ đến 35.000đ trên mỗi kilôgam nông sản sạch so với giá thị trường.",
        ],
      },
      {
        heading: "3. Lịch biểu mùa vụ cụ thể: Từ tháng nào tới tháng nào giảm món gì?",
        paragraphs: [
          "Hệ thống AgriTrace AI công khai minh bạch lịch biểu thu hoạch và mức trợ giá tương ứng cho từng loại nông sản sạch trên toàn quốc trong bảng theo dõi dưới đây:",
        ],
        keyTakeaways: [
          "Tháng 10 – Tháng 12: Cải Xoăn Kale & Xà Lách Lô Lô Đà Lạt — Trợ giá trực tiếp 13% đến 17% (Tiết kiệm 10.000đ – 15.000đ/KG so với giá gốc).",
          "Tháng 9 – Tháng 12: Cam Sành Bố Hạ & Hàm Yên — Trợ giá trực tiếp 18% (Tiết kiệm 10.000đ/KG, tép vàng giòn mọng nước giàu vitamin C).",
          "Tháng 10 – Tháng 4: Dâu Tây New Zealand Mộc Châu — Trợ giá trực tiếp 14% (Tiết kiệm 25.000đ/Hộp 500g, quả đỏ căng mọng đạt chuẩn GlobalGAP).",
          "Tháng 4 – Tháng 10: Bơ Sáp 034 Tây Nguyên — Trợ giá trực tiếp 17% (Tiết kiệm 15.000đ/KG, cơm vàng dẻo quánh, ưu tiên xuất kho nhanh theo chuẩn FEFO).",
          "Tháng 11 – Tháng 3: Xoài Cát Hòa Lộc — Áp dụng chương trình Đặt trước (Pre-order), nhân đôi (x2) điểm tích lũy hội viên AgriClub.",
          "Tháng 12 – Tháng 1: Bưởi Da Xanh Bến Tre — Cam kết bình ổn giá Tết Nguyên Đán, đảm bảo không tăng giá đột biến trong dịp lễ chạp.",
        ],
      },
      {
        heading: "4. Cơ chế cộng dồn 2 tầng ưu đãi: Nhân đôi niềm vui tiết kiệm",
        paragraphs: [
          "Một ưu điểm vượt trội chỉ có tại AgriTrace AI là cơ chế CỘNG DỒN 2 TẦNG ƯU ĐÃI (Dual-Tier Savings):",
          "• Tầng 1: Trợ giá mùa vụ tự động — Sản phẩm đã được giảm giá trực tiếp từ 13% - 18% trên giá gốc khi bạn chọn vào giỏ hàng.",
          "• Tầng 2: Voucher khuyến mãi & Freeship — Tại bước đặt hàng nhanh hoặc thanh toán, bạn được áp dụng thêm các mã ưu đãi độc quyền như AGRI30 (giảm thêm 30.000đ cho đơn từ 200k) hoặc mã FREESHIP (miễn phí vận chuyển xe lạnh 25.000đ).",
          "Công thức tổng tiết kiệm: Tổng Giảm = Trợ Giá Vụ Mùa (Giảm trực tiếp) + Voucher Áp Dụng (Trừ thêm). Khách hàng có thể tiết kiệm tới 40% – 50% tổng chi phí cho bữa ăn an toàn của gia đình.",
        ],
      },
      {
        heading: "5. Các kênh tra cứu và nhận thông báo sale mùa vụ nhanh nhất",
        paragraphs: [
          "Để không bỏ lỡ những đợt nông sản chính vụ tươi mới và biểu giá ưu đãi, khách hàng có thể theo dõi qua các kênh chính thức sau:",
        ],
        keyTakeaways: [
          "Biểu tượng Chuông 🔔 trên thanh điều hướng (Navbar): Tự động phát thông báo khi có quyết định trợ giá vụ mới hoặc nông trại vừa thu hoạch xong một lô hàng tươi sáng nay.",
          "Trang Sự Kiện & Giảm Giá (/events): Cập nhật trực tiếp các sự kiện trợ giá mùa vụ đang diễn ra, thời hạn áp dụng và danh mục sản phẩm giảm giá.",
          "Banner Chiến Dịch tại trang Sản Phẩm (/products): Bấm vào nhãn 'Vụ mùa -13%' hoặc nút 'Cơ Chế & Lịch Trợ Giá Mùa Vụ' để tra cứu quyết định ngay khi đang mua sắm.",
          "Trang Lịch Mùa Vụ Nông Sản (/seasons): Xem toàn văn quy chế tại mục #pricing-policy và theo dõi tiến độ thu hoạch 12 tháng trong năm.",
          "Trợ Lý AI Nông Nghiệp 24/7 (Góc phải màn hình): Nhấp vào 'Hỏi Trợ Lý AI' và hỏi: 'Tháng này nông sản nào đang được trợ giá chính vụ?', AI sẽ tra cứu dữ liệu thời gian thực và dẫn bạn tới thẳng sản phẩm phù hợp.",
        ],
      },
    ],
  },
  {
    id: "post-1",
    featured: false,
    title: "Ứng Dụng Trí Tuệ Nhân Tạo (AI) Trong Dự Báo Nhu Cầu & Quản Trị Chuỗi Nông Sản 2026",
    slug: "ung-dung-ai-du-bao-nhu-cau-nong-san-2026",
    excerpt:
      "Làm thế nào để các hợp tác xã và chuỗi siêu thị dự đoán chính xác lượng rau củ tiêu thụ trong 7 ngày tới? Mô hình AI Demand Forecasting kết hợp lịch sử đơn hàng và dữ liệu mùa vụ giúp giảm tới 35% hao hụt tồn kho.",
    category: "ai",
    categoryLabel: "Công nghệ AI",
    categoryColor: "bg-emerald-100 text-emerald-800",
    author: "TS. Trần Văn Minh",
    authorRole: "Viện Nghiên cứu Nông nghiệp Số & Trí tuệ Nhân tạo",
    date: "14/10/2026",
    readTime: "6 phút đọc",
    relatedProduct: {
      name: "Cải Xoăn Kale Hữu Cơ Dinh Dưỡng",
      price: "65.000 đ",
      oldPrice: "75.000 đ",
      unit: "KG",
      badge: "Vụ mùa -13%",
      link: "/products?search=Kale",
    },
    sections: [
      {
        heading: "1. Thách thức muôn thuở: 'Được mùa mất giá' và bài toán tồn kho nông sản tươi",
        paragraphs: [
          "Một trong những điểm nghẽn lớn nhất của nông nghiệp truyền thống tại Việt Nam là sự đứt gãy thông tin giữa năng suất thu hoạch tại vườn và nhu cầu tiêu thụ thực tế tại các đô thị. Khi nông dân thu hoạch rộ trong cùng một tuần, nguồn cung đột ngột tăng vọt dẫn đến tình trạng ùn ứ tại các kho bãi, buộc phải bán tháo hoặc chấp nhận tỷ lệ hư hao lên tới 25% – 35%.",
          "Tại AgriTrace AI, hệ thống tiếp cận bài toán này dưới góc nhìn khoa học dữ liệu: kết hợp mạng nơ-ron học sâu (Deep Learning) với dữ liệu thời tiết thực tế từ trạm khí tượng Đà Lạt và Mộc Châu để xây dựng mô hình dự báo nhu cầu chính xác tới 94.2%.",
        ],
        quote: "Chuyển đổi số trong nông nghiệp không dừng lại ở việc số hóa sổ sách, mà là dùng dữ liệu để giải phóng nông dân khỏi nỗi lo được mùa mất giá.",
      },
      {
        heading: "2. Cơ chế vận hành của mô hình AI Demand Forecasting tại AgriTrace",
        paragraphs: [
          "Hệ thống tự động tổng hợp dữ liệu từ 3 nguồn độc lập: (1) Lịch sử tiêu thụ theo ngày trong tuần của hơn 10.000 khách hàng; (2) Dữ liệu chu kỳ sinh trưởng của từng lô rau củ tại các hợp tác xã liên kết; và (3) Các sự kiện mùa vụ, ngày rằm, lễ tết có xu hướng tăng tiêu thụ rau sạch.",
          "Khi phát hiện một loại nông sản sắp vào đỉnh thu hoạch trong 5 ngày tới, AI sẽ tự động kích hoạt chiến dịch trợ giá mùa vụ và thông báo đến người tiêu dùng, đồng thời tối ưu lịch điều xe lạnh của các nhà phân phối để lấy hàng ngay khi vừa hái lúc 05:30 sáng.",
        ],
        keyTakeaways: [
          "Giảm tỷ lệ hư hao kho lạnh từ 28% xuống dưới 4.5% nhờ dự báo chính xác giờ xuất kho.",
          "Tự động đề xuất mức giá trợ giá mùa vụ (13% - 18%) giúp nông sản tiêu thụ nhanh trong 24H.",
          "Tối ưu cung đường xe lạnh 2°C - 5°C, giảm 22% chi phí logistics cho nhà phân phối.",
        ],
      },
      {
        heading: "3. Tương lai của chuỗi cung ứng nông sản tự động hóa",
        paragraphs: [
          "Trong giai đoạn tiếp theo, AgriTrace AI sẽ tích hợp trực tiếp dữ liệu cảm biến đất và máy bay không người lái (drone) giám sát mùa vụ vào hệ thống ERP của các hợp tác xã, mang lại chu trình minh bạch 100% từ lúc hạt nảy mầm cho tới khi rau xanh lên bàn ăn gia đình.",
        ],
      },
    ],
  },
  {
    id: "post-2",
    title: "Cẩm Nang Quét Mã QR Truy Xuất Nguồn Gốc: Hiểu Đúng Từng Thông Số Kiểm Định",
    slug: "cam-nang-quet-ma-qr-truy-xuat-nguon-goc",
    excerpt:
      "Khi quét mã QR trên quả cam hay bó rau thủy canh, những thông số nào quan trọng nhất bạn cần đối soát? Hướng dẫn đọc ngày thu hoạch, mã nông trại và chứng chỉ VietGAP trực tuyến.",
    category: "guide",
    categoryLabel: "Cẩm nang tiêu dùng",
    categoryColor: "bg-blue-100 text-blue-800",
    author: "Ban Biên Tập AgriTrace",
    authorRole: "Bộ phận Đảm bảo Chất lượng (QA/QC)",
    date: "12/10/2026",
    readTime: "4 phút đọc",
    relatedProduct: {
      name: "Xà Lách Lô Lô Xanh Thủy Canh",
      price: "35.000 đ",
      oldPrice: "42.000 đ",
      unit: "KG",
      badge: "VietGAP Chuẩn",
      link: "/traceability?batch=XL-2026-08",
    },
    sections: [
      {
        heading: "1. Mã QR Nông Sản Chuẩn GS1 khác gì mã QR thông thường?",
        paragraphs: [
          "Nhiều người tiêu dùng lầm tưởng mọi mã QR dán trên hoa quả đều có giá trị như nhau. Thực tế, nhiều mã QR trên thị trường chỉ đơn thuần dẫn về trang chủ của một website giới thiệu doanh nghiệp, không chứa thông tin về lô hàng cụ thể bạn đang cầm trên tay.",
          "Mã QR chuẩn của AgriTrace AI là mã định danh duy nhất (UUID) cho từng lô thu hoạch riêng biệt (Batch/Lot-based QR). Khi quét, dữ liệu được truy vấn trực tiếp từ cơ sở dữ liệu chuỗi cung ứng khép kín, bao gồm cả nhật ký canh tác của từng hộ nông dân và kết quả xét nghiệm sinh hóa độc lập.",
        ],
      },
      {
        heading: "2. 4 thông số cốt lõi người tiêu dùng thông thái cần kiểm tra",
        paragraphs: [
          "Khi mở trang kết quả truy xuất nguồn gốc, bạn hãy chú ý 4 trường thông tin quan trọng nhất sau đây:",
        ],
        keyTakeaways: [
          "Thời gian thu hoạch & Mã nông trại: Đảm bảo nông sản được hái trong ngày hoặc đúng theo lịch bảo quản lạnh (không quá 24h đối với rau ăn lá).",
          "Số chứng chỉ VietGAP / GlobalGAP: Kèm theo tên cơ quan cấp và thời hạn hiệu lực còn giá trị.",
          "Phiếu kiểm nghiệm Quatest: Dư lượng thuốc BVTV phải là 0.0 mg/kg và hàm lượng Nitrat dưới ngưỡng quy định.",
          "Lịch sử vận chuyển xe lạnh: Nhiệt độ thùng xe suốt quãng đường di chuyển phải luôn nằm trong khoảng 2°C – 5°C.",
        ],
      },
      {
        heading: "3. Hướng dẫn quét mã nhanh nhất bằng điện thoại",
        paragraphs: [
          "Bạn không cần tải bất kỳ ứng dụng phức tạp nào. Chỉ cần mở ứng dụng Camera mặc định trên iPhone hoặc điện thoại Android, hướng ống kính vào tem QR dán trên túi nông sản. Một đường link bảo mật agritrace.ai sẽ hiện lên đưa bạn xem toàn bộ hồ sơ chất lượng chỉ sau 1 giây.",
        ],
      },
    ],
  },
  {
    id: "post-3",
    title: "Lịch Trái Cây Mùa Vụ Quý 4: Thời Điểm Vàng Thưởng Thức Cam Sành, Bơ Sáp & Dâu Tây",
    slug: "lich-trai-cay-mua-vu-quy-4-2026",
    excerpt:
      "Tháng 10 đến tháng 12 là thời điểm nông sản Tây Nguyên và Đà Lạt bước vào vụ thu hoạch rộ nhất. Bảng tổng hợp lịch vụ, vùng trồng và cách chọn quả tươi ngọt tự nhiên không chất ép chín.",
    category: "season",
    categoryLabel: "Nông sản mùa vụ",
    categoryColor: "bg-amber-100 text-amber-800",
    author: "Nguyễn Hải Đăng",
    authorRole: "Kỹ sư Nông vụ & Điều phối Mùa vụ",
    date: "10/10/2026",
    readTime: "5 phút đọc",
    relatedProduct: {
      name: "Dâu Tây New Zealand Mộc Châu",
      price: "180.000 đ",
      oldPrice: "210.000 đ",
      unit: "HỘP 500G",
      badge: "Vụ mùa -14%",
      link: "/products?search=Dâu+Tây",
    },
    sections: [
      {
        heading: "1. Vì sao nên ăn trái cây đúng mùa vụ?",
        paragraphs: [
          "Trái cây đúng chính vụ hấp thụ trọn vẹn ánh nắng và thổ nhưỡng lý tưởng nhất, giúp tích lũy lượng đường tự nhiên cao, vị thơm đậm đà mà không cần bất kỳ chất kích thích sinh trưởng nào. Hơn nữa, vào chính vụ, nguồn cung dồi dào giúp giá thành luôn ở mức dễ tiếp cận nhất trong năm.",
        ],
      },
      {
        heading: "2. Danh sách 3 đặc sản đỉnh cao quý 4/2026",
        paragraphs: [
          "Quý 4 là thời khắc bùng nổ của 3 dòng trái cây đặc sản nổi tiếng tại Việt Nam:",
        ],
        keyTakeaways: [
          "Cam Sành Hàm Yên & Bố Hạ (Tháng 9 – Tháng 12): Vỏ mỏng rám nắng, tép vàng óng mọng nước, giàu vitamin C. Giá trợ giá mùa vụ chỉ từ 45.000đ/kg.",
          "Dâu Tây Mộc Châu & Đà Lạt (Tháng 10 – Tháng 4): Giống Nhật và New Zealand trồng nhà kính công nghệ cao, quả đỏ căng bóng, vị ngọt thanh tự nhiên.",
          "Bơ Sáp 034 Tây Nguyên (Đợt cuối vụ tháng 10): Cơm vàng dẻo quánh, hạt lép, hàm lượng chất béo tốt không bão hòa cực kỳ cao.",
        ],
      },
      {
        heading: "3. Cơ chế trợ giá trực tiếp tại AgriTrace",
        paragraphs: [
          "Tất cả trái cây chính vụ trong danh mục đều được áp dụng chính sách trợ giá trực tiếp từ 14% đến 18% trên giá niêm yết xuất kho, kết hợp giao nhận xe lạnh 24H để giữ trọn vẹn chất lượng từ vườn về nhà.",
        ],
      },
    ],
  },
  {
    id: "post-4",
    title: "Phân Biệt Tiêu Chuẩn VietGAP, GlobalGAP và Canh Tác Hữu Cơ (Organic): Đâu Là Lựa Chọn Tốt Nhất?",
    slug: "phan-biet-vietgap-globalgap-va-organic",
    excerpt:
      "So sánh chi tiết quy trình kiểm định, quy định về đất trồng, nguồn nước và giới hạn dư lượng thuốc BVTV giữa 3 bộ tiêu chuẩn chất lượng nông sản phổ biến nhất tại Việt Nam hiện nay.",
    category: "standard",
    categoryLabel: "Tiêu chuẩn kiểm định",
    categoryColor: "bg-purple-100 text-purple-800",
    author: "Kỹ sư Nông học Lê Thị Mai",
    authorRole: "Trưởng ban Kiểm định Chất lượng VietGAP",
    date: "08/10/2026",
    readTime: "7 phút đọc",
    relatedProduct: {
      name: "Cà Chua Bi Cherry Đỏ Ngọt",
      price: "50.000 đ",
      oldPrice: "60.000 đ",
      unit: "KG",
      badge: "VietGAP Chuẩn",
      link: "/products?search=Cà+Chua",
    },
    sections: [
      {
        heading: "1. Tổng quan về 3 chứng nhận chất lượng nông sản",
        paragraphs: [
          "Khi bước vào siêu thị hay mua sắm online, người tiêu dùng thường xuyên bắt gặp các thuật ngữ: VietGAP, GlobalGAP và Canh tác Hữu Cơ (Organic). Dù đều hướng tới mục tiêu an toàn cho sức khỏe, mỗi tiêu chuẩn lại có những quy định nghiêm ngặt và mức độ khắt khe khác nhau.",
        ],
      },
      {
        heading: "2. Bảng phân tích so sánh chi tiết",
        paragraphs: [
          "Hãy cùng so sánh các tiêu chí cốt lõi giữa 3 hệ thống chứng nhận này:",
        ],
        keyTakeaways: [
          "VietGAP (Thực hành Nông nghiệp Tốt tại VN): Kiểm soát chặt chẽ 4 yếu tố: Đất trồng sạch, nguồn nước tưới không kim loại nặng, phân bón & thuốc BVTV có trong danh mục cho phép và thời gian cách ly nghiêm ngặt trước khi thu hái.",
          "GlobalGAP (Tiêu chuẩn Toàn cầu): Bổ sung thêm các yêu cầu khắt khe về điều kiện làm việc, an sinh cho người lao động, bảo vệ môi trường sinh thái và khả năng truy xuất nguồn gốc số hóa 100%.",
          "Hữu Cơ (Organic): Tuyệt đối KHÔNG sử dụng phân bón hóa học tổng hợp, KHÔNG thuốc trừ sâu hóa học, KHÔNG biến đổi gen (Non-GMO) và đất trồng phải được chuyển đổi cách ly tối thiểu 3 năm.",
        ],
      },
      {
        heading: "3. Lời khuyên lựa chọn cho gia đình",
        paragraphs: [
          "Đối với bữa ăn hàng ngày, nông sản VietGAP và GlobalGAP đã hoàn toàn đáp ứng ngưỡng an toàn y tế và loại trừ tồn dư thuốc BVTV với chi phí rất hợp lý. Với trẻ nhỏ hoặc người cần chế độ dinh dưỡng đặc biệt, dòng sản phẩm Organic là sự bổ sung lý tưởng cho lối sống xanh bền vững.",
        ],
      },
    ],
  },
  {
    id: "post-5",
    title: "Nguyên Tắc Quản Trị Kho Lạnh FEFO: Giải Bài Toán Hao Hụt Nông Sản Tươi Sống",
    slug: "nguyen-tac-quan-tri-kho-lanh-fefo",
    excerpt:
      "Khác với hàng khô, nông sản tươi sống bắt buộc phải áp dụng First Expired, First Out (hết hạn trước - xuất trước). Tìm hiểu cách hệ thống AgriTrace AI cảnh báo lô hàng sắp quá hạn.",
    category: "ai",
    categoryLabel: "Công nghệ AI",
    categoryColor: "bg-emerald-100 text-emerald-800",
    author: "Đội ngũ Kỹ thuật Kho Lạnh",
    authorRole: "Bộ phận Vận hành Kho & Chuỗi Lạnh FEFO",
    date: "05/10/2026",
    readTime: "5 phút đọc",
    relatedProduct: {
      name: "Bơ Sáp 034 Đặc Sản Cao Nguyên",
      price: "75.000 đ",
      oldPrice: "90.000 đ",
      unit: "KG",
      badge: "Ưu tiên FEFO",
      link: "/products?search=Bơ+Sáp",
    },
    sections: [
      {
        heading: "1. Tại sao FIFO không còn phù hợp với nông sản tươi sống?",
        paragraphs: [
          "Mô hình FIFO (First In, First Out – vào trước ra trước) vốn là tiêu chuẩn vàng trong sản xuất công nghiệp và hàng tiêu dùng nhanh (FMCG). Tuy nhiên, đối với rau củ quả tươi sống, thời điểm nhập kho không phản ánh chính xác độ chín và độ tươi của từng lô hàng.",
          "Một lô xà lách thu hoạch sau nhưng gặp điều kiện thời tiết mưa ẩm có thể có thời gian bảo quản ngắn hơn lô thu hoạch trước trong điều kiện khô ráo. Vì vậy, nguyên tắc FEFO (First Expired, First Out – lô nào có thời hạn tươi tối ưu ngắn hơn sẽ được ưu tiên xuất kho trước) là bắt buộc.",
        ],
      },
      {
        heading: "2. Thuật toán phân bổ tự động tại kho lạnh AgriTrace",
        paragraphs: [
          "Mỗi khi một lô nông sản được thủ kho quét mã QR nghiệm thu nhập kho tại /dashboard/warehouse, hệ thống tự động gán nhãn hạn sử dụng tối ưu (Dynamic Shelf-life) dựa trên nhiệt độ cảm biến và dữ liệu sinh hóa của lô hàng.",
        ],
        keyTakeaways: [
          "Tự động sắp xếp thứ tự ưu tiên đóng gói cho các đơn hàng xuất trong ngày.",
          "Cảnh báo màu đỏ trực quan khi lô hàng còn dưới 48H để áp mức trợ giá flash-sale xả tươi.",
          "Đồng bộ hóa với app tài xế xe lạnh để tối ưu lộ trình giao hàng đến siêu thị gần nhất.",
        ],
      },
    ],
  },
  {
    id: "post-6",
    title: "5 Bí Quyết Bảo Quản Rau Củ Thủy Canh Luôn Tươi Giòn Suốt 10 Ngày Trong Tủ Lạnh",
    slug: "5-bi-quyet-bao-quan-rau-cu-thuy-canh",
    excerpt:
      "Rau thủy canh sạch không cần rửa trước khi cất tủ lạnh, giữ nguyên gốc rễ và bảo quản ở ngăn mát 5-8°C. Những mẹo nhỏ giúp gia đình giữ trọn vẹn dinh dưỡng và độ ngọt tự nhiên.",
    category: "guide",
    categoryLabel: "Cẩm nang tiêu dùng",
    categoryColor: "bg-blue-100 text-blue-800",
    author: "Chuyên gia Dinh dưỡng Minh Hằng",
    authorRole: "Cố vấn Dinh dưỡng Bữa ăn Xanh Gia đình",
    date: "01/10/2026",
    readTime: "3 phút đọc",
    relatedProduct: {
      name: "Rau Ăn Lá Thủy Canh Chuẩn VietGAP",
      price: "35.000 đ",
      unit: "KG",
      badge: "Tươi mới 24H",
      link: "/products?cat=rau_la",
    },
    sections: [
      {
        heading: "1. Giữ nguyên rễ và giá thể bông khoáng thủy canh",
        paragraphs: [
          "Rau thủy canh cao cấp thường được giao kèm phần rễ nguyên vẹn. Phần rễ này giúp cây tiếp tục duy trì độ ẩm tự nhiên. Đừng vội cắt bỏ gốc khi vừa nhận hàng; hãy để nguyên rễ trong bao bì thoáng khí cho đến khi chế biến.",
        ],
      },
      {
        heading: "2. Tuyệt đối không rửa nước trước khi cho vào tủ lạnh",
        paragraphs: [
          "Nước đọng trên lá là nguyên nhân hàng đầu khiến vi khuẩn và nấm mốc phát triển, làm rau nhanh ủng nát. Nông sản AgriTrace đã được sơ chế sạch tại phòng lạnh; bạn chỉ nên rửa sạch ngay trước bữa ăn.",
        ],
        keyTakeaways: [
          "Điều chỉnh nhiệt độ ngăn mát từ 4°C đến 7°C – nhiệt độ lý tưởng chống sốc lạnh gây dập lá.",
          "Dùng túi màng thở vi lỗ hoặc hộp kín có lót 1 lớp khăn giấy mỏng ở đáy để hút ẩm thừa.",
          "Để rau ở ngăn riêng, tránh để sát các loại quả sinh khí Ethylene như chuối hoặc táo chín.",
        ],
      },
    ],
  },
];

const CATEGORIES = [
  { key: "all", label: "Tất cả bài viết" },
  { key: "ai", label: "Công nghệ & AI" },
  { key: "season", label: "Nông sản mùa vụ" },
  { key: "standard", label: "Tiêu chuẩn VietGAP" },
  { key: "guide", label: "Cẩm nang tiêu dùng" },
];

export default function BlogPage() {
  const { blogPosts } = useCampaignStore();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  const allPosts: BlogPost[] = useMemo(() => {
    // Merge custom admin posts with default POSTS
    const customPosts: BlogPost[] = blogPosts
      .filter((bp) => !POSTS.some((p) => p.id === bp.id || p.slug === bp.slug))
      .map((bp) => ({
        id: bp.id,
        title: bp.title,
        slug: bp.slug,
        excerpt: bp.excerpt,
        category: bp.category,
        categoryLabel: bp.categoryLabel,
        categoryColor:
          bp.category === "season"
            ? "bg-amber-100 text-amber-900"
            : bp.category === "ai"
            ? "bg-teal-100 text-teal-900"
            : bp.category === "standard"
            ? "bg-purple-100 text-purple-900"
            : "bg-blue-100 text-blue-900",
        author: bp.author,
        authorRole: bp.authorRole,
        date: bp.date,
        readTime: bp.readTime,
        featured: bp.featured,
        relatedProduct: bp.relatedProductName
          ? {
              name: bp.relatedProductName,
              price: "Xem chi tiết",
              unit: "KG",
              badge: "Nông sản liên kết",
              link: `/products?search=${encodeURIComponent(bp.relatedProductName)}`,
            }
          : undefined,
        sections: [
          {
            heading: "Nội dung bài viết",
            paragraphs: bp.content ? bp.content.split("\n\n").filter(Boolean) : [bp.excerpt],
          },
        ],
      }));

    return [...customPosts, ...POSTS].filter((p) => {
      const adminMatch = blogPosts.find((bp) => bp.id === p.id || bp.slug === p.slug);
      if (adminMatch && !adminMatch.active) return false;
      return true;
    });
  }, [blogPosts]);

  const featuredPost = allPosts.find((p) => p.featured) || allPosts[0];
  const remainingPosts = allPosts.filter((p) => p.id !== featuredPost?.id);

  // Sync with URL Hash on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        const found = allPosts.find((p) => p.slug === hash);
        if (found) setSelectedPost(found);
      }
    }
  }, [allPosts]);

  const openPost = (post: BlogPost) => {
    setSelectedPost(post);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${post.slug}`);
    }
  };

  const closePost = () => {
    setSelectedPost(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  const handleShare = (post: BlogPost) => {
    if (typeof window !== "undefined" && navigator?.clipboard) {
      const url = `${window.location.origin}/blog#${post.slug}`;
      navigator.clipboard.writeText(url);
      toast.success("Đã sao chép liên kết bài viết vào bộ nhớ tạm!");
    }
  };

  const filteredPosts = remainingPosts.filter((post) => {
    const matchesCategory = activeCategory === "all" || post.category === activeCategory;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gray-50/50 min-h-screen py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <Newspaper size={14} /> BẢN TIN & KIẾN THỨC NÔNG NGHIỆP SẠCH
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Tin Tức & Cẩm Nang Nông Sản
          </h1>
          <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
            Cập nhật xu hướng chuyển đổi số nông nghiệp, lịch mùa vụ tươi ngon, hướng dẫn nhận biết rau củ chuẩn VietGAP và công nghệ AI chuỗi cung ứng. Bấm vào bất kỳ bài viết nào để đọc nội dung chi tiết.
          </p>

          {/* Search Box */}
          <div className="relative mt-6 max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài viết: AI dự báo, quét mã QR, dâu tây, VietGAP, FEFO..."
              className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Featured Post Card (If on all and no search query) */}
        {activeCategory === "all" && !searchQuery && featuredPost && (
          <div
            onClick={() => openPost(featuredPost)}
            className="mb-12 bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden hover:shadow-xl hover:border-emerald-400 transition-all cursor-pointer group"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#156e34] flex items-center gap-1 shadow-2xs">
                      <Sparkles size={12} /> BÀI VIẾT NỔI BẬT
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug group-hover:text-[#1a7a3a] transition-colors">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-800">{featuredPost.author}</span>
                    <span>•</span>
                    <span>{featuredPost.date}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPost(featuredPost);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-xl transition-all shadow-xs"
                  >
                    <span>Đọc bài viết đầy đủ</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-[#0e2c17] via-[#154625] to-[#1c5d33] p-8 text-white flex flex-col justify-center items-center text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-4 shadow-inner">
                  <Sparkles size={32} />
                </div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider mb-1">
                  Chuyên Đề Công Nghệ 2026
                </div>
                <div className="text-lg font-bold text-white max-w-xs leading-snug">
                  AI Forecasting & Quản Trị Chuỗi Cung Ứng Khép Kín
                </div>
                <p className="text-xs text-emerald-100/70 mt-2 max-w-xs leading-relaxed">
                  Tối ưu hóa sản lượng thu hoạch, giảm thiểu tồn kho và tăng giá trị nông sản sạch Việt Nam.
                </p>
                <div className="mt-4 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-[11px] font-semibold border border-white/10">
                  Bấm để mở trình đọc chuyên sâu ↗
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.key
                  ? "bg-[#1a7a3a] text-white shadow-xs font-semibold"
                  : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/80"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => openPost(post)}
              className="bg-white rounded-3xl border border-gray-200/90 p-5 sm:p-6 shadow-xs hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${post.categoryColor}`}>
                    {post.categoryLabel}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1 font-medium">
                    <Clock size={11} /> {post.readTime}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-base leading-snug mb-2 group-hover:text-[#1a7a3a] transition-colors">
                  {post.title}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="truncate max-w-[140px]">
                  <span className="font-medium text-gray-700 block truncate">{post.author}</span>
                  <span className="text-[10px] text-gray-400">{post.date}</span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                  Đọc tiếp <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Newsletter Box */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-10 shadow-xs text-center max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#1a7a3a] flex items-center justify-center mx-auto mb-3">
            <BookOpen size={22} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            Đăng Ký Nhận Bản Tin Nông Sản & Ưu Đãi Mùa Vụ
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 mb-5 leading-relaxed">
            Nhận thông báo khi nông sản yêu thích vào chính vụ, mã giảm giá độc quyền và cẩm nang tiêu dùng an toàn mỗi sáng thứ Hai.
          </p>

          {subscribed ? (
            <div className="p-3 bg-emerald-50 text-[#1a7a3a] rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 size={16} />
              <span>Cảm ơn bạn đã đăng ký! AgriTrace AI sẽ gửi bản tin nông sản định kỳ vào email của bạn.</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (emailInput.trim()) setSubscribed(true);
              }}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Nhập email của bạn..."
                required
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 shadow-2xs"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1a7a3a] text-white rounded-xl text-sm font-semibold hover:bg-[#156e34] transition-colors whitespace-nowrap shadow-xs cursor-pointer"
              >
                Đăng Ký Ngay
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ─── FULL ARTICLE READING MODAL (PROFESSIONAL READER) ─── */}
      {selectedPost && (
        <div
          onClick={() => setSelectedPost(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto cursor-pointer animate-fade-in"
        >
          <div
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/50 via-white to-gray-50 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${selectedPost.categoryColor}`}>
                  {selectedPost.categoryLabel}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock size={12} className="text-emerald-700" /> {selectedPost.readTime}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={12} /> {selectedPost.date}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShare(selectedPost)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 text-gray-600 transition-colors cursor-pointer"
                  title="Sao chép liên kết chia sẻ bài viết"
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={closePost}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-rose-100 hover:text-rose-700 text-gray-500 transition-colors cursor-pointer"
                  title="Đóng bài viết (ESC)"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-gray-800 leading-relaxed text-sm sm:text-base">
              {/* Title & Author Byline */}
              <div className="space-y-3 pb-4 border-b border-gray-100">
                <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {selectedPost.title}
                </h1>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {selectedPost.author.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{selectedPost.author}</div>
                    <div className="text-xs text-gray-500">{selectedPost.authorRole}</div>
                  </div>
                </div>
              </div>

              {/* Lead Summary Callout */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 font-medium text-xs sm:text-sm leading-relaxed shadow-2xs">
                <strong className="block text-emerald-900 font-bold mb-1">Tóm tắt nội dung chính:</strong>
                {selectedPost.excerpt}
              </div>

              {/* Article Sections */}
              <div className="space-y-6 text-gray-700">
                {selectedPost.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 pt-2">
                      {sec.heading}
                    </h2>

                    {sec.paragraphs.map((p, pIdx) => (
                      <p key={pIdx} className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                        {p}
                      </p>
                    ))}

                    {sec.quote && (
                      <blockquote className="my-3 pl-4 border-l-4 border-emerald-600 italic text-emerald-900 bg-emerald-50/50 py-2.5 pr-3 rounded-r-xl text-xs sm:text-sm font-medium">
                        &ldquo;{sec.quote}&rdquo;
                      </blockquote>
                    )}

                    {sec.keyTakeaways && sec.keyTakeaways.length > 0 && (
                      <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2 mt-2">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wide flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-700" />
                          <span>Điểm cốt lõi cần ghi nhớ:</span>
                        </span>
                        <ul className="space-y-1.5 text-xs text-gray-700">
                          {sec.keyTakeaways.map((takeaway, tIdx) => (
                            <li key={tIdx} className="flex items-start gap-2">
                              <span className="text-emerald-700 font-bold">•</span>
                              <span>{takeaway}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Related Agricultural Product Banner */}
              {selectedPost.relatedProduct && (
                <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/30">
                      Nông Sản Sạch Đề Cập Trong Bài Viết
                    </span>
                    <h3 className="font-bold text-sm sm:text-base text-white">
                      {selectedPost.relatedProduct.name}
                    </h3>
                    <div className="text-xs text-emerald-200 font-mono">
                      <span className="font-bold text-white text-sm">{selectedPost.relatedProduct.price}</span> / {selectedPost.relatedProduct.unit}
                      {selectedPost.relatedProduct.oldPrice && (
                        <span className="line-through text-gray-300 ml-2 text-xs">{selectedPost.relatedProduct.oldPrice}</span>
                      )}
                      <span className="ml-2 text-amber-300 font-bold">{selectedPost.relatedProduct.badge}</span>
                    </div>
                  </div>

                  <Link
                    href={selectedPost.relatedProduct.link}
                    onClick={closePost}
                    className="px-4 py-2.5 rounded-xl bg-white text-emerald-900 hover:bg-emerald-50 font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shadow-md"
                  >
                    <ShoppingBag size={14} className="text-emerald-700" />
                    <span>Xem & Mua Ngay</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-gray-500 hidden sm:inline">
                AgriTrace AI Knowledge Base © 2026
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => handleShare(selectedPost)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Share2 size={13} />
                  <span>Chia sẻ</span>
                </button>
                <button
                  type="button"
                  onClick={closePost}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Đóng bài viết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
