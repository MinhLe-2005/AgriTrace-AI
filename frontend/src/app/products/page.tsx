"use client";

import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Filter,
  MapPin,
  Package,
  QrCode,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

const sampleProducts = [
  {
    id: "sp-01",
    name: "Dâu Tây Giống Nhật Mộc Châu",
    category: "seasonal",
    categoryName: "Trái cây mùa vụ",
    seasonStatus: "Đang vào mùa",
    seasonColor: "#10b981",
    price: 185000,
    unit: "Hộp 500g",
    farm: "Nông Trại Dâu Mộc Châu",
    location: "Sơn La",
    cert: "VietGAP",
    rating: 4.9,
    reviews: 128,
    batchCode: "DT-MC-2026-11",
    harvestDate: "13/10/2026",
    fefoDays: "Còn 6 ngày",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sp-02",
    name: "Xà Lách Thủy Canh Lô Lô Xanh",
    category: "daily",
    categoryName: "Rau củ quanh năm",
    seasonStatus: "Quanh năm",
    seasonColor: "#1a7a3a",
    price: 38000,
    unit: "Gói 400g",
    farm: "Nông Trại Xanh Đà Lạt",
    location: "Lâm Đồng",
    cert: "GlobalGAP",
    rating: 4.8,
    reviews: 245,
    batchCode: "XL-2026-08",
    harvestDate: "14/10/2026",
    fefoDays: "Còn 4 ngày",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sp-03",
    name: "Cam Sành Bố Hạ Mọng Nước",
    category: "seasonal",
    categoryName: "Trái cây mùa vụ",
    seasonStatus: "Chính vụ (Rộ)",
    seasonColor: "#f59e0b",
    price: 65000,
    unit: "Kg",
    farm: "HTX Trái Cây Bắc Giang",
    location: "Bắc Giang",
    cert: "Hữu cơ (Organic)",
    rating: 5.0,
    reviews: 89,
    batchCode: "CS-BG-2026-03",
    harvestDate: "11/10/2026",
    fefoDays: "Còn 12 ngày",
    image: "https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sp-04",
    name: "Cà Chua Cherry Chocolate",
    category: "daily",
    categoryName: "Rau củ quanh năm",
    seasonStatus: "Quanh năm",
    seasonColor: "#1a7a3a",
    price: 49000,
    unit: "Hộp 350g",
    farm: "BioFarm Đức Trọng",
    location: "Lâm Đồng",
    cert: "VietGAP",
    rating: 4.7,
    reviews: 160,
    batchCode: "CC-DT-2026-04",
    harvestDate: "12/10/2026",
    fefoDays: "Còn 8 ngày",
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sp-05",
    name: "Bơ Sáp 034 Tây Nguyên",
    category: "seasonal",
    categoryName: "Trái cây mùa vụ",
    seasonStatus: "Cuối mùa",
    seasonColor: "#ea580c",
    price: 95000,
    unit: "Kg (2-3 trái)",
    farm: "Nông Hộ Đắk Lắk Farm",
    location: "Đắk Lắk",
    cert: "VietGAP",
    rating: 4.9,
    reviews: 312,
    batchCode: "BO-DL-2026-09",
    harvestDate: "10/10/2026",
    fefoDays: "Còn 5 ngày",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "sp-06",
    name: "Cải Kale Xoăn Thủy Canh",
    category: "daily",
    categoryName: "Rau củ quanh năm",
    seasonStatus: "Quanh năm",
    seasonColor: "#1a7a3a",
    price: 42000,
    unit: "Túi 300g",
    farm: "Nông Trại Xanh Đà Lạt",
    location: "Lâm Đồng",
    cert: "GlobalGAP",
    rating: 4.8,
    reviews: 94,
    batchCode: "KL-2026-05",
    harvestDate: "14/10/2026",
    fefoDays: "Còn 5 ngày",
    image: "https://images.unsplash.com/photo-1524179091875-bf99a9a6fa57?w=600&auto=format&fit=crop&q=80",
  },
];

export default function ProductsPage() {
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = sampleProducts.filter((p) => {
    const matchesCat = filterCategory === "all" || p.category === filterCategory;
    const matchesQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.farm.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="bg-[#f8faf8] min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Module Responsibility Header */}
        <div className="mb-6 bg-emerald-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm border border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700/80 flex items-center justify-center text-emerald-200">
              <Package size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">Danh Mục Nông Sản & Trái Cây Sạch</h1>
                <span className="text-[11px] bg-emerald-500/30 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Module 2 & 4
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Phụ trách: Member 2 (Quản lý Nông trại, Sản phẩm, Mùa vụ) & Member 4 (Bán hàng, Đơn hàng)
              </p>
            </div>
          </div>
          <Link
            href="/seasons"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 flex items-center gap-1.5 transition-colors"
          >
            <Calendar size={14} /> Xem Lịch Mùa Vụ
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200/80 mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterCategory === "all"
                  ? "bg-[#1a7a3a] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tất cả nông sản ({sampleProducts.length})
            </button>
            <button
              onClick={() => setFilterCategory("seasonal")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                filterCategory === "seasonal"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Calendar size={13} /> Trái cây theo mùa vụ (3)
            </button>
            <button
              onClick={() => setFilterCategory("daily")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterCategory === "daily"
                  ? "bg-[#1a7a3a] text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Rau củ quanh năm (3)
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên nông sản, nông trại..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#1a7a3a] focus:ring-1 focus:ring-[#1a7a3a]"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span
                    style={{ backgroundColor: item.seasonColor }}
                    className="absolute top-3 left-3 text-[11px] font-bold text-white px-2.5 py-1 rounded-lg shadow-sm"
                  >
                    {item.seasonStatus}
                  </span>
                  <span className="absolute top-3 right-3 text-[11px] font-bold bg-white/95 text-emerald-800 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-emerald-200 shadow-xs">
                    {item.cert}
                  </span>
                  <div className="absolute bottom-2 left-3 bg-black/60 text-white text-[11px] font-mono px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                    <QrCode size={12} /> {item.batchCode}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-emerald-600" /> {item.farm} ({item.location})
                    </span>
                    <span className="text-emerald-700 font-semibold">{item.fefoDays}</span>
                  </div>

                  <h3 className="font-bold text-base text-gray-900 group-hover:text-[#1a7a3a] transition-colors leading-snug">
                    {item.name}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="flex items-center text-amber-500 font-bold">
                      <Star size={13} fill="currentColor" />
                      <span className="ml-1">{item.rating}</span>
                    </div>
                    <span>•</span>
                    <span>Đã bán 850+</span>
                    <span>•</span>
                    <span>Thu hoạch: {item.harvestDate}</span>
                  </div>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-4 pt-0 border-t border-gray-100 mt-2 flex items-center justify-between">
                <div>
                  <div className="text-lg font-extrabold text-[#1a7a3a]">
                    {item.price.toLocaleString("vi-VN")} đ
                  </div>
                  <div className="text-[11px] text-gray-400">Đơn vị: {item.unit}</div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/traceability?batch=${item.batchCode}`}
                    className="p-2 rounded-xl border border-emerald-600 text-[#1a7a3a] hover:bg-emerald-50 transition-colors"
                    title="Truy xuất nguồn gốc QR"
                  >
                    <QrCode size={18} />
                  </Link>
                  <button
                    onClick={() => toast.success(`Đã thêm "${item.name}" vào giỏ hàng!`)}
                    className="px-3.5 py-2 rounded-xl bg-[#1a7a3a] hover:bg-[#156e34] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <ShoppingBag size={15} /> Thêm giỏ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
