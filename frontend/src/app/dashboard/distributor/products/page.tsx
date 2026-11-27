"use client";

import { ExternalLink, Leaf, MapPin, PackageSearch, QrCode, Search, ShieldCheck, Thermometer } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DistributorPageHeader } from "@/components/distributor/distributor-ui";
import { catalogService, type ApiProduct } from "@/services/catalog.service";

const fallbackProducts: ApiProduct[] = [
  {
    id: "dist-xl",
    name: "Xà Lách Lô Lô Thủy Canh",
    price: 70000,
    oldPrice: 75000,
    unit: "kg",
    origin: "Đà Lạt, Lâm Đồng",
    farm: "Nông Trại Xanh Đà Lạt",
    cert: "VietGAP",
    rating: 4.9,
    reviews: 124,
    harvest: "14/10/2026",
    image: "🥬",
    categoryCode: "rau-cu",
    stockLeft: 240,
    batchCode: "XL-2026-08",
    description: "Rau thủy canh thu hoạch trong ngày, bảo quản lạnh liên tục.",
    cultivation: "Canh tác nhà màng, nước tuần hoàn",
    temperature: "4°C - 6°C",
    pesticide: "Kiểm nghiệm không phát hiện dư lượng",
    packaging: "Túi màng thở thực phẩm",
    active: true,
    featured: true,
  },
  {
    id: "dist-dt",
    name: "Dâu Tây Mộc Châu",
    price: 180000,
    oldPrice: 195000,
    unit: "hộp 500g",
    origin: "Mộc Châu, Sơn La",
    farm: "HTX Dâu Tây Mộc Châu Eco",
    cert: "GlobalGAP",
    rating: 4.8,
    reviews: 98,
    harvest: "13/10/2026",
    image: "🍓",
    categoryCode: "trai-cay",
    stockLeft: 180,
    batchCode: "DT-MC-2026-11",
    description: "Dâu tây được làm mát nhanh sau thu hoạch và đóng khay màng thở.",
    cultivation: "Nhà kính giá thể hữu cơ",
    temperature: "2°C - 4°C",
    pesticide: "Đạt kiểm nghiệm VSATTP",
    packaging: "Khay PET có màng thở",
    active: true,
    featured: true,
  },
  {
    id: "dist-cs",
    name: "Cam Sành Bố Hạ",
    price: 65000,
    oldPrice: 70000,
    unit: "kg",
    origin: "Yên Thế, Bắc Giang",
    farm: "HTX Trái Cây Bố Hạ",
    cert: "Organic",
    rating: 4.7,
    reviews: 76,
    harvest: "11/10/2026",
    image: "🍊",
    categoryCode: "trai-cay",
    stockLeft: 650,
    batchCode: "CS-BG-2026-03",
    description: "Cam sành hữu cơ, được vận chuyển theo điều kiện thông thoáng tiêu chuẩn.",
    cultivation: "Canh tác hữu cơ BioCert",
    temperature: "8°C - 12°C",
    pesticide: "Không sử dụng thuốc BVTV hóa học",
    packaging: "Thùng carton thông khí",
    active: true,
    featured: false,
  },
];

export default function DistributorProductsPage() {
  const [products, setProducts] = useState<ApiProduct[]>(fallbackProducts);
  const [query, setQuery] = useState("");

  useEffect(() => {
    catalogService.getProducts().then((result) => result.length > 0 && setProducts(result)).catch(() => undefined);
  }, []);

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => !needle || [product.name, product.batchCode, product.farm, product.origin].filter(Boolean).some((value) => value.toLowerCase().includes(needle)));
  }, [products, query]);

  return (
    <div className="space-y-6">
      <DistributorPageHeader title="Thông Tin Sản Phẩm & Truy Xuất" description="Xem điều kiện bảo quản, nguồn gốc lô và mở hồ sơ truy xuất QR trước khi bàn giao." icon={PackageSearch} />

      <section className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div><h2 className="font-bold text-sm text-gray-900">Sản phẩm đang phân phối</h2><p className="text-xs text-gray-500 mt-1">Dữ liệu giúp tài xế và điểm nhận bảo quản đúng điều kiện từng lô.</p></div>
          <label className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên SP, mã lô, nông trại" className="w-full sm:w-56 h-9 pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-xs outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10" /></label>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleProducts.map((product) => (
            <article key={product.id} className="rounded-2xl border border-gray-200 overflow-hidden bg-white hover:border-amber-200 hover:shadow-sm transition-all">
              <div className="p-4 bg-gradient-to-br from-amber-50/80 to-white flex items-start justify-between gap-3"><span className="w-12 h-12 rounded-2xl bg-white border border-amber-100 flex items-center justify-center text-2xl shadow-xs">{product.image && product.image.length <= 4 ? product.image : "🌿"}</span><span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">{product.cert || "Đang cập nhật"}</span></div>
              <div className="p-4 space-y-3"><div><h3 className="font-bold text-sm text-gray-900">{product.name}</h3><p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{product.description || "Thông tin sản phẩm đang được cập nhật."}</p></div>
                <div className="space-y-1.5 text-[11px] text-gray-600"><p className="flex items-center gap-1.5"><MapPin size={13} className="text-amber-700" />{product.farm || product.origin || "Nông trại đang cập nhật"}</p><p className="flex items-center gap-1.5"><Thermometer size={13} className="text-blue-700" />Bảo quản: <strong className="text-blue-800">{product.temperature || "Theo hướng dẫn kho lạnh"}</strong></p><p className="flex items-center gap-1.5"><Leaf size={13} className="text-emerald-700" />Lô: <strong className="font-mono text-gray-800">{product.batchCode || "Chưa gán"}</strong></p></div>
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2"><span className="text-[11px] text-gray-500"><ShieldCheck size={13} className="inline mr-1 text-emerald-700" />{product.cultivation || "Đạt quy trình canh tác an toàn"}</span>{product.batchCode ? <Link href={`/traceability?batch=${encodeURIComponent(product.batchCode)}`} className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:underline"><QrCode size={13} /> Truy xuất <ExternalLink size={11} /></Link> : null}</div>
              </div>
            </article>
          ))}
        </div>
        {visibleProducts.length === 0 && <p className="p-8 text-center text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp.</p>}
      </section>
    </div>
  );
}
