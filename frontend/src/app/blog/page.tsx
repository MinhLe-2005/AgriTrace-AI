"use client";

import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Filter,
  Leaf,
  Newspaper,
  Search,
  Sparkles,
  Tag,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: "all" | "ai" | "season" | "standard" | "guide";
  categoryLabel: string;
  categoryColor: string;
  author: string;
  date: string;
  readTime: string;
  featured?: boolean;
}

const POSTS: BlogPost[] = [
  {
    id: "post-1",
    featured: true,
    title: "Ứng Dụng Trí Tuệ Nhân Tạo (AI) Trong Dự Báo Nhu Cầu & Quản Trị Chuỗi Nông Sản 2026",
    slug: "ung-dung-ai-du-bao-nhu-cau-nong-san-2026",
    excerpt:
      "Làm thế nào để các hợp tác xã và chuỗi siêu thị dự đoán chính xác lượng rau củ tiêu thụ trong 7 ngày tới? Mô hình AI Demand Forecasting kết hợp lịch sử đơn hàng và dữ liệu mùa vụ giúp giảm tới 35% hao hụt tồn kho.",
    category: "ai",
    categoryLabel: "Công nghệ AI",
    categoryColor: "bg-emerald-100 text-emerald-800",
    author: "TS. Trần Văn Minh",
    date: "14/10/2026",
    readTime: "6 phút đọc",
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
    date: "12/10/2026",
    readTime: "4 phút đọc",
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
    date: "10/10/2026",
    readTime: "5 phút đọc",
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
    date: "08/10/2026",
    readTime: "7 phút đọc",
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
    author: "Đội ngũ Kỹ thuật Kho",
    date: "05/10/2026",
    readTime: "5 phút đọc",
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
    date: "01/10/2026",
    readTime: "3 phút đọc",
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
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const featuredPost = POSTS.find((p) => p.featured);
  const remainingPosts = POSTS.filter((p) => !p.featured);

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
            Cập nhật xu hướng chuyển đổi số nông nghiệp, lịch mùa vụ tươi ngon, hướng dẫn nhận biết rau củ chuẩn VietGAP và công nghệ AI chuỗi cung ứng.
          </p>

          {/* Search Box */}
          <div className="relative mt-6 max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài viết theo từ khóa..."
              className="w-full pl-11 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Featured Post Card (If on all and no search query) */}
        {activeCategory === "all" && !searchQuery && featuredPost && (
          <div className="mb-12 bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-[#156e34] flex items-center gap-1">
                      <Sparkles size={12} /> BÀI VIẾT NỔI BẬT
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={12} /> {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug hover:text-[#1a7a3a] transition-colors cursor-pointer">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-3 text-gray-600 text-sm sm:text-base leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="font-semibold text-gray-800">{featuredPost.author}</span>
                    <span>•</span>
                    <span>{featuredPost.date}</span>
                  </div>

                  <Link
                    href={`/blog#${featuredPost.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-bold text-[#1a7a3a] hover:underline"
                  >
                    Đọc tiếp <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 bg-gradient-to-br from-[#0e2c17] to-[#1c5d33] p-8 text-white flex flex-col justify-center items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-4">
                  <Sparkles size={32} />
                </div>
                <div className="text-sm font-semibold text-emerald-200 uppercase tracking-wider mb-1">
                  Chuyên Đề Công Nghệ 2026
                </div>
                <div className="text-lg font-bold text-white max-w-xs">
                  AI Forecasting & Quản Trị Chuỗi Cung Ứng Khép Kín
                </div>
                <p className="text-xs text-emerald-100/70 mt-2 max-w-xs">
                  Tối ưu hóa sản lượng thu hoạch, giảm thiểu tồn kho và tăng giá trị nông sản sạch Việt Nam.
                </p>
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
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
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
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${post.categoryColor}`}>
                    {post.categoryLabel}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
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
                <span className="truncate max-w-[150px]">{post.author}</span>
                <span>{post.date}</span>
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
          <p className="text-gray-600 text-xs sm:text-sm mt-1 mb-5">
            Nhận thông báo khi nông sản yêu thích vào chính vụ, mã giảm giá độc quyền và cẩm nang tiêu dùng an toàn mỗi sáng thứ Hai.
          </p>

          {subscribed ? (
            <div className="p-3 bg-emerald-50 text-[#1a7a3a] rounded-xl text-sm font-semibold">
              🎉 Cảm ơn bạn đã đăng ký! AgriTrace AI sẽ gửi bản tin nông sản định kỳ vào email của bạn.
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
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1a7a3a] text-white rounded-xl text-sm font-semibold hover:bg-[#156e34] transition-colors whitespace-nowrap shadow-xs"
              >
                Đăng Ký Ngay
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
