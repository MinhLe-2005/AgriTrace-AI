"use client";

import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock,
  Edit3,
  FileCheck,
  FileText,
  Home,
  Leaf,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Save,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  Star,
  MessageCircle,
  MessageSquare,
  TrendingUp,
  Truck,
  Upload,
  User,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { farmerService, parseFarmDocUrls, serializeFarmDocUrls, LotTimelineEvent, BatchChangeEvent, ApiHarvestLot, ApiForecastProductItem } from "@/services/farmer.service";
import { QrLabelModal, QrLabelLot } from "@/components/farmer/qr-label-modal";
import { DemandForecastPanel } from "@/components/farmer/demand-forecast-panel";
import { CropSeasonsPanel } from "@/components/farmer/crop-seasons-panel";
import { FarmerMessagesPanel } from "@/features/order-chat/FarmerMessagesPanel";
import { toast } from "@/stores/toast-store";
import { useAuthStore } from "@/stores/auth-store";
import { reviewService, type ApiReview } from "@/services/review.service";

// =========================================================================
// TYPES & DEFINITIONS
// =========================================================================

export type FarmItem = {
  id: string;
  code: string;
  name: string;
  owner: string;
  ownerId?: string;
  phone: string;
  address: string;
  province: string;
  areaHectares: number;
  certStandard: string;
  rating: number;
  activeBatchCount: number;
  isDefault?: boolean;
  verificationStatus?: string;
  verificationDocType?: string;
  verificationDocUrl?: string;
  verificationNote?: string;
  verificationDecisionReason?: string;
  verificationRequestId?: string;
};

export type BatchItem = {
  code: string;
  farmCode: string;
  ownerId?: string;
  product: string;
  plantingDate: string;
  harvestDate: string;
  expiryDate: string;
  qty: string;
  unit: string;
  status: "Chờ duyệt xuất kho" | "Đã duyệt xuất kho" | "Đang lưu kho lạnh" | "Đang chăm sóc" | "Từ chối xuất kho";
  statusColor: string;
  cert: string;
  cultivation: string;
  transportDestination?: string;
  transportStatus?: "Chưa vận chuyển" | "Đang vận chuyển" | "Đã nhập kho đích";
};

export type FarmingLogItem = {
  id: string;
  farmCode?: string;
  ownerId?: string;
  batchCode: string;
  date: string;
  stage: "Gieo hạt" | "Bón phân" | "Tưới tiêu" | "Phun sinh học" | "Thu hoạch";
  action: string;
  materialsUsed?: string;
  notes?: string;
  proofImage?: string;
};

export type ProductItem = {
  id: string;
  farmCode?: string;
  ownerId?: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  description: string;
  origin: string;
  image: string;
};

export type CertificationItem = {
  id: string;
  farmCode: string;
  ownerId?: string;
  name: string;
  certNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED";
  daysLeft: number;
  approvalStatus?: "NONE" | "PENDING" | "APPROVED" | "REJECTED";
  pendingRenewal?: {
    newCertNumber: string;
    proofImage: string;
    requestedExpiryDate: string;
    submittedAt: string;
    note?: string;
  };
};

const STORAGE_KEYS = {
  farms: "agritrace_farmer_farms_v1",
  selectedFarmId: "agritrace_farmer_selected_farm_v1",
  logs: "agritrace_farmer_logs_v1",
  certs: "agritrace_farmer_certs_v1",
  certEmailSent: "agritrace_cert_expiry_email_sent_v1",
  alertEmail: "agritrace_farmer_alert_email_v1",
} as const;

const PRODUCT_CATEGORIES = [
  { value: "trai_cay", label: "Trái Cây Tươi & Đặc Sản" },
  { value: "rau_la", label: "Rau Ăn Lá Hữu Cơ" },
  { value: "cu_qua", label: "Củ Quả Sạch" },
  { value: "nam_chebien", label: "Nấm & Đặc Sản Chế Biến" },
] as const;

type FarmerProfile = {
  ownerId: string;
  name: string;
  email: string;
  phone: string;
  farmCodes: string[];
  avatarText: string;
  title: string;
};

const FARMER_PROFILES: FarmerProfile[] = [
  {
    ownerId: "farmer_hung",
    name: "Bác Nguyễn Văn Hùng",
    email: "farmer@agritrace.vn",
    phone: "0912 345 678",
    farmCodes: ["NT-DL-01", "NT-DT-02"],
    avatarText: "VH",
    title: "Chủ Nông Trại Đà Lạt & Cao Lãnh",
  },
  {
    ownerId: "farmer_thieu",
    name: "Nguyễn Thiệu",
    email: "nguyenthieuu052@gmail.com",
    phone: "0988 776 655",
    farmCodes: ["NT-MC-03"],
    avatarText: "NT",
    title: "Chủ Vườn Sinh Thái Mộc Châu",
  },
];

const DEFAULT_FARMS: FarmItem[] = [
  {
    id: "f1",
    code: "NT-DL-01",
    name: "Nông Trại Xanh Đà Lạt",
    owner: "Bác Nguyễn Văn Hùng",
    ownerId: "farmer_hung",
    phone: "0912 345 678",
    address: "Xã Xuân Thọ, TP. Đà Lạt",
    province: "Lâm Đồng",
    areaHectares: 4.5,
    certStandard: "VietGAP & GlobalGAP",
    rating: 4.9,
    activeBatchCount: 3,
    isDefault: true,
  },
  {
    id: "f2",
    code: "NT-DT-02",
    name: "Vườn Cây Ăn Trái Cao Lãnh",
    owner: "Bác Nguyễn Văn Hùng",
    ownerId: "farmer_hung",
    phone: "0912 345 678",
    address: "Xã Mỹ Xương, Huyện Cao Lãnh",
    province: "Đồng Tháp",
    areaHectares: 3.2,
    certStandard: "VietGAP Trồng trọt",
    rating: 4.8,
    activeBatchCount: 1,
    isDefault: false,
  },
  {
    id: "f3",
    code: "NT-MC-03",
    name: "Vườn Sinh Thái Mộc Châu",
    owner: "Nguyễn Thiệu",
    ownerId: "farmer_thieu",
    phone: "0988 776 655",
    address: "Tiểu khu Chè Đen, Thị trấn Nông trường Mộc Châu",
    province: "Sơn La",
    areaHectares: 5.0,
    certStandard: "Hữu cơ TCVN & VietGAP",
    rating: 5.0,
    activeBatchCount: 2,
    isDefault: false,
  },
];

const DEFAULT_BATCHES: BatchItem[] = [
  {
    code: "XC-2026-01",
    farmCode: "NT-DT-02",
    ownerId: "farmer_hung",
    product: "Xoài Cát Chu Cao Lãnh",
    plantingDate: "10/05/2026",
    harvestDate: "15/10/2026",
    expiryDate: "30/11/2026",
    qty: "1200",
    unit: "kg",
    status: "Đã duyệt xuất kho",
    statusColor: "#10b981",
    cert: "VietGAP",
    cultivation: "Bao trái hữu cơ, thu hoạch đợt 1",
    transportDestination: "Kho Tổng Logistics TP.HCM",
    transportStatus: "Đã nhập kho đích",
  },
  {
    code: "XC-2026-02",
    farmCode: "NT-DT-02",
    ownerId: "farmer_hung",
    product: "Xoài Cát Chu Cao Lãnh",
    plantingDate: "10/05/2026",
    harvestDate: "27/10/2026",
    expiryDate: "25/11/2026",
    qty: "850",
    unit: "kg",
    status: "Chờ duyệt xuất kho",
    statusColor: "#f97316",
    cert: "VietGAP",
    cultivation: "Đợt thu hoạch 2 - Trái chín độ 85%",
    transportDestination: "Lưu tại kho bảo quản nông trại",
    transportStatus: "Chưa vận chuyển",
  },
  {
    code: "SR-2026-01",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    product: "Sầu Riêng Ri6 Chín Cây",
    plantingDate: "01/01/2026",
    harvestDate: "20/10/2026",
    expiryDate: "20/11/2026",
    qty: "500",
    unit: "kg",
    status: "Đang lưu kho lạnh",
    statusColor: "#3b82f6",
    cert: "GlobalGAP",
    cultivation: "Hữu cơ sinh học, bảo quản kho mát",
    transportDestination: "Kho Lạnh Phân Phối Hà Nội",
    transportStatus: "Đang vận chuyển",
  },
  {
    code: "DT-2026-03",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    product: "Dâu Tây Giống Nhật",
    plantingDate: "15/08/2026",
    harvestDate: "10/11/2026",
    expiryDate: "18/11/2026",
    qty: "100",
    unit: "kg",
    status: "Đang chăm sóc",
    statusColor: "#f59e0b",
    cert: "VietGAP",
    cultivation: "Nhà màng công nghệ cao",
    transportDestination: "Vườn đang chăm sóc (Chưa vận chuyển)",
    transportStatus: "Chưa vận chuyển",
  },
  {
    code: "MC-2026-01",
    farmCode: "NT-MC-03",
    ownerId: "farmer_thieu",
    product: "Mận Hậu Mộc Châu Hữu Cơ",
    plantingDate: "15/02/2026",
    harvestDate: "20/05/2026",
    expiryDate: "15/06/2026",
    qty: "2500",
    unit: "kg",
    status: "Đã duyệt xuất kho",
    statusColor: "#10b981",
    cert: "Hữu cơ TCVN",
    cultivation: "Mận chín cây, bao trái sinh học",
    transportDestination: "Kho Lạnh Phân Phối Hà Nội",
    transportStatus: "Đã nhập kho đích",
  },
  {
    code: "TC-2026-02",
    farmCode: "NT-MC-03",
    ownerId: "farmer_thieu",
    product: "Chè Shan Tuyết Cổ Thụ Mộc Châu",
    plantingDate: "01/01/2026",
    harvestDate: "05/11/2026",
    expiryDate: "05/11/2027",
    qty: "350",
    unit: "kg",
    status: "Chờ duyệt xuất kho",
    statusColor: "#f97316",
    cert: "VietGAP",
    cultivation: "Búp chè 1 tôm 2 lá vùng núi cao",
    transportDestination: "Kho Tổng Logistics Hà Nội",
    transportStatus: "Chưa vận chuyển",
  },
];

const DEFAULT_LOGS: FarmingLogItem[] = [
  {
    id: "l1",
    farmCode: "NT-DT-02",
    ownerId: "farmer_hung",
    batchCode: "XC-2026-02",
    date: "15/07/2026",
    stage: "Bón phân",
    action: "Bón phân hữu cơ vi sinh đợt 2",
    materialsUsed: "Phân bón trùn quế hữu cơ O-Micro",
    notes: "Tỷ lệ bón 2kg/gốc, tưới ẩm đất",
  },
  {
    id: "l2",
    farmCode: "NT-DT-02",
    ownerId: "farmer_hung",
    batchCode: "XC-2026-02",
    date: "20/08/2026",
    stage: "Phun sinh học",
    action: "Bao trái và phun dung dịch xua đuổi ruồi vàng thảo mộc",
    materialsUsed: "Chế phẩm sinh học tỏi - ớt - gừng lên men",
    notes: "Cách ly an toàn 100% không dùng hóa chất độc hại",
  },
  {
    id: "l3",
    farmCode: "NT-DT-02",
    ownerId: "farmer_hung",
    batchCode: "XC-2026-02",
    date: "27/10/2026",
    stage: "Thu hoạch",
    action: "Thu hoạch đợt 2 sáng sớm, phân loại trái",
    materialsUsed: "Dụng cụ khử trùng, thùng lót giấy mềm",
    notes: "Trái đạt chuẩn độ ngọt, chuyển gửi Admin duyệt",
  },
  {
    id: "l4",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    batchCode: "SR-2026-01",
    date: "10/09/2026",
    stage: "Tưới tiêu",
    action: "Tưới nước nhỏ giọt tự động kiểm soát EC và pH",
    materialsUsed: "Nguồn nước sạch ngầm",
    notes: "Độ pH ổn định 6.2",
  },
  {
    id: "l5",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    batchCode: "DT-2026-03",
    date: "12/10/2026",
    stage: "Tưới tiêu",
    action: "Tưới dinh dưỡng nhỏ giọt công nghệ Israel cho dâu tây",
    materialsUsed: "Dung dịch dinh dưỡng hữu cơ vi lượng A-B",
    notes: "Kiểm tra độ ẩm giá thể mùn dừa đạt 75%",
  },
  {
    id: "l6",
    farmCode: "NT-MC-03",
    ownerId: "farmer_thieu",
    batchCode: "TC-2026-02",
    date: "15/08/2026",
    stage: "Bón phân",
    action: "Bón phân hữu cơ vi sinh ủ hoai cho cây chè cổ thụ",
    materialsUsed: "Phân chuồng ủ hoai nấm Trichoderma",
    notes: "Đảm bảo dinh dưỡng tự nhiên không hóa chất",
  },
  {
    id: "l7",
    farmCode: "NT-MC-03",
    ownerId: "farmer_thieu",
    batchCode: "TC-2026-02",
    date: "05/11/2026",
    stage: "Thu hoạch",
    action: "Thu hái thủ công búp chè 1 tôm 2 lá trong sương sớm",
    materialsUsed: "Gùi tre truyền thống, găng tay sạch",
    notes: "Bảo quản trong bóng râm, đưa về xưởng chế biến trong ngày",
  },
];

const DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: "p1",
    farmCode: "NT-DT-02",
    ownerId: "farmer_hung",
    name: "Xoài Cát Chu Cao Lãnh",
    category: "trai_cay",
    price: 65000,
    unit: "kg",
    description: "Xoài Cát Chu thịt dày, thơm ngọt đậm đà canh tác chuẩn VietGAP",
    origin: "Vườn Cây Ăn Trái Cao Lãnh",
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "p2",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    name: "Thanh Long Ruột Đỏ",
    category: "trai_cay",
    price: 45000,
    unit: "kg",
    description: "Thanh long mọng nước, vị ngọt thanh tự nhiên",
    origin: "Nông Trại Xanh Đà Lạt",
    image: "https://images.unsplash.com/photo-1527325678964-54921661f888?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "p3",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    name: "Sầu Riêng Ri6 Chín Cây",
    category: "trai_cay",
    price: 135000,
    unit: "kg",
    description: "Cơm vàng hạt lép, thu hoạch độ chín hoàn hảo tại vườn",
    origin: "Nông Trại Xanh Đà Lạt",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "p4",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    name: "Dâu Tây Giống Nhật",
    category: "trai_cay",
    price: 180000,
    unit: "hộp 500g",
    description: "Dâu tây canh tác giá thể xơ dừa nhà màng, vị ngọt thơm dịu",
    origin: "Nông Trại Xanh Đà Lạt",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "p5",
    farmCode: "NT-MC-03",
    ownerId: "farmer_thieu",
    name: "Mận Hậu Mộc Châu Hữu Cơ",
    category: "trai_cay",
    price: 85000,
    unit: "kg",
    description: "Mận Hậu giòn ngọt rôn rốt, phủ phấn trắng tự nhiên canh tác hữu cơ tại thung lũng Mộc Châu",
    origin: "Vườn Sinh Thái Mộc Châu",
    image: "https://images.unsplash.com/photo-1596363505729-4190a9506133?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "p6",
    farmCode: "NT-MC-03",
    ownerId: "farmer_thieu",
    name: "Chè Shan Tuyết Cổ Thụ Mộc Châu",
    category: "nam_chebien",
    price: 320000,
    unit: "hộp 200g",
    description: "Chè Shan tuyết búp phủ tuyết trắng, hương vị tiền chát hậu ngọt sâu lắng",
    origin: "Vườn Sinh Thái Mộc Châu",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80",
  },
];

const DEFAULT_CERTS: CertificationItem[] = [
  {
    id: "c1",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    name: "Chứng nhận GlobalGAP",
    certNumber: "GG-91024-VN",
    issuedBy: "Tổ chức Chứng nhận Quốc tế Control Union",
    issueDate: "15/01/2026",
    expiryDate: "15/01/2027",
    status: "VALID",
    daysLeft: 64,
  },
  {
    id: "c2",
    farmCode: "NT-DL-01",
    ownerId: "farmer_hung",
    name: "Chứng nhận VietGAP Trồng trọt",
    certNumber: "VG-49-2026-LD",
    issuedBy: "Chi cục Quản lý Chất lượng Nông Lâm Sản Lâm Đồng",
    issueDate: "20/11/2025",
    expiryDate: "20/11/2026",
    status: "EXPIRING_SOON",
    daysLeft: 8,
  },
  {
    id: "c3",
    farmCode: "NT-DT-02",
    ownerId: "farmer_hung",
    name: "Chứng nhận VietGAP Cây Ăn Trái",
    certNumber: "VG-66-2026-DT",
    issuedBy: "Sở Nông nghiệp & PTNT Đồng Tháp",
    issueDate: "10/03/2026",
    expiryDate: "10/03/2027",
    status: "VALID",
    daysLeft: 118,
  },
  {
    id: "c4",
    farmCode: "NT-MC-03",
    ownerId: "farmer_thieu",
    name: "Chứng nhận Hữu cơ Việt Nam (TCVN 11041)",
    certNumber: "MC-ORG-2026-001",
    issuedBy: "Trung tâm Chứng nhận Phù hợp Quacert",
    issueDate: "10/01/2026",
    expiryDate: "10/01/2028",
    status: "VALID",
    daysLeft: 412,
  },
];

function normalizeTransportStatus(
  raw?: string | null
): "Chưa vận chuyển" | "Đang vận chuyển" | "Đã nhập kho đích" {
  const lower = (raw || "").trim().toLowerCase();
  if (lower.includes("đang vận chuyển") || lower.includes("đang giao")) {
    return "Đang vận chuyển";
  }
  if (lower.includes("đã nhập kho") || lower.includes("đã giao kho")) {
    return "Đã nhập kho đích";
  }
  return "Chưa vận chuyển";
}

function getLocalIsoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dStr: string): string {
  if (!dStr) return "";
  const parts = dStr.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dStr;
}

function parseVnOrIsoDate(raw?: string): Date | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\(.*?\)/g, "").trim();
  const vnMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vnMatch) {
    return new Date(Number(vnMatch[3]), Number(vnMatch[2]) - 1, Number(vnMatch[1]));
  }
  const isoMatch = cleaned.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }
  return null;
}

function getCategoryLabel(categoryValue?: string): string {
  if (!categoryValue) return "Trái Cây Tươi & Đặc Sản";
  const found = PRODUCT_CATEGORIES.find((c) => c.value === categoryValue);
  if (found) return found.label;
  const lower = categoryValue.toLowerCase();
  if (lower.includes("rau")) return "Rau Ăn Lá Hữu Cơ";
  if (lower.includes("cu") || lower.includes("củ")) return "Củ Quả Sạch";
  if (lower.includes("nam") || lower.includes("nấm")) return "Nấm & Đặc Sản Chế Biến";
  return categoryValue;
}

function resolveBatchStatusColor(status?: string, fallbackColor?: string): string {
  if (status === "Đã duyệt xuất kho") return "#10b981";
  if (status === "Đang lưu kho lạnh") return "#3b82f6";
  if (status === "Đang chăm sóc") return "#f59e0b";
  if (status === "Chờ duyệt xuất kho") return "#f97316";
  return fallbackColor || "#f97316";
}

function normalizeBatchCert(certStandard?: string): string {
  if (!certStandard) return "VietGAP";
  const lower = certStandard.toLowerCase();
  if (lower.includes("globalgap")) return "GlobalGAP";
  if (lower.includes("organic")) return "Organic USDA";
  return "VietGAP";
}

function extractFarmCode(farmName?: string, origin?: string, farmList: FarmItem[] = DEFAULT_FARMS): string {
  const combined = `${farmName || ""} ${origin || ""}`.trim();
  const codeMatch = combined.match(/\(Mã:\s*([^)]+)\)/i);
  if (codeMatch?.[1]) {
    return codeMatch[1].trim().toUpperCase();
  }
  const combinedLower = combined.toLowerCase();
  for (const f of farmList) {
    if (combinedLower.includes(f.code.toLowerCase()) || combinedLower.includes(f.name.toLowerCase())) {
      return f.code;
    }
  }
  if (combinedLower.includes("cao lãnh") || combinedLower.includes("đồng tháp")) {
    return "NT-DT-02";
  }
  if (combinedLower.includes("đà lạt") || combinedLower.includes("lâm đồng")) {
    return "NT-DL-01";
  }
  if (combinedLower.includes("mộc châu") || combinedLower.includes("sơn la")) {
    return "NT-MC-03";
  }
  return farmList[0]?.code || "NT-DL-01";
}

function generateLotCodeForProduct(productName: string, existingBatches: BatchItem[]): string {
  const ascii = productName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^A-Za-z\s]/g, " ")
    .trim();
  const words = ascii.split(/\s+/).filter(Boolean);
  let prefix = "AG";
  if (words.length >= 2) {
    prefix = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    prefix = words[0].slice(0, 2).toUpperCase();
  }
  const year = new Date().getFullYear();
  const existingCodes = new Set(existingBatches.map((b) => b.code.toUpperCase()));
  for (let i = 0; i < 15; i += 1) {
    const rand = Math.floor(Math.random() * 89) + 10;
    const candidate = `${prefix}-${year}-${rand}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }
  return `${prefix}-${year}-${String(Date.now()).slice(-3)}`;
}

function getNextFarmCode(farmList: FarmItem[]): string {
  const used = new Set(farmList.map((f) => f.code.toUpperCase()));
  let idx = farmList.length + 1;
  while (idx < 999) {
    const candidate = `NT-VN-${String(idx).padStart(2, "0")}`;
    if (!used.has(candidate)) {
      return candidate;
    }
    idx += 1;
  }
  return `NT-VN-${String(Date.now()).slice(-4)}`;
}

function computeHarvestStats(batchList: BatchItem[]): { totalKgLabel: string; productSummary: string } {
  let totalKg = 0;
  const productsSet = new Set<string>();
  for (const b of batchList) {
    const num = Number(b.qty);
    if (Number.isFinite(num) && num > 0) {
      const unitLower = (b.unit || "kg").trim().toLowerCase();
      if (unitLower === "tấn" || unitLower === "t" || unitLower === "ton") {
        totalKg += num * 1000;
      } else if (unitLower === "tạ") {
        totalKg += num * 100;
      } else if (unitLower === "g") {
        totalKg += num / 1000;
      } else if (unitLower.includes("500g")) {
        totalKg += num * 0.5;
      } else {
        totalKg += num;
      }
    }
    if (b.product?.trim()) {
      productsSet.add(b.product.trim());
    }
  }
  const rounded = Math.round(totalKg * 100) / 100;
  const names = Array.from(productsSet).slice(0, 3);
  const summary =
    names.length === 0
      ? "Chưa có nông sản thu hoạch"
      : productsSet.size > 3
      ? `${names.join(", ")}...`
      : names.join(", ");
  return {
    totalKgLabel: `${rounded.toLocaleString("vi-VN")} kg`,
    productSummary: summary,
  };
}

function evaluateCertification(cert: CertificationItem, referenceNowMs: number | null): CertificationItem {
  if (referenceNowMs === null) {
    return cert;
  }
  const expiry = parseVnOrIsoDate(cert.expiryDate);
  if (!expiry) {
    return cert;
  }
  const refDate = new Date(referenceNowMs);
  const todayMidnight = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()).getTime();
  const diffDays = Math.ceil((expiry.getTime() - todayMidnight) / (1000 * 60 * 60 * 24));
  const status: CertificationItem["status"] =
    diffDays < 0 ? "EXPIRED" : diffDays <= 30 ? "EXPIRING_SOON" : "VALID";
  return {
    ...cert,
    daysLeft: diffDays,
    status,
  };
}

function readStoredJson<T>(key: string): T | null {
  try {
    const rawVal = localStorage.getItem(key);
    if (!rawVal) return null;
    return JSON.parse(rawVal) as T;
  } catch {
    return null;
  }
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const maybeErr = err as { response?: { data?: { message?: string } | string }; message?: string };
  if (typeof maybeErr?.response?.data === "string" && maybeErr.response.data.trim()) {
    return maybeErr.response.data;
  }
  if (
    maybeErr?.response?.data &&
    typeof maybeErr.response.data === "object" &&
    typeof maybeErr.response.data.message === "string" &&
    maybeErr.response.data.message.trim()
  ) {
    return maybeErr.response.data.message;
  }
  if (typeof maybeErr?.message === "string" && maybeErr.message.trim()) {
    return maybeErr.message;
  }
  return fallback;
}

function resolveFarmerOwnerId(user: { id?: string; name?: string; email?: string } | null): string {
  if (!user) return "farmer_hung";
  const email = (user.email || "").trim().toLowerCase();
  const name = (user.name || "").trim().toLowerCase();
  if (email === "nguyenthieuu052@gmail.com" || name.includes("thiệu") || name.includes("thieu")) {
    return "farmer_thieu";
  }
  if (
    email === "farmer@agritrace.vn" ||
    email === "hung.farmer@agritrace.vn" ||
    email === "farmer@sportvenue.com" ||
    name.includes("hùng") ||
    email === ""
  ) {
    return "farmer_hung";
  }
  return user.id ? `farmer_${user.id}` : email;
}

function FarmerPortalContent() {
  // 9 Tab nghiệp vụ: Nông trại, Lô hàng, Nhật ký, Sản phẩm, Chứng nhận, Đánh giá, Mùa vụ, AI Dự báo & Hộp thư
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"farms" | "batches" | "logs" | "products" | "certs" | "reviews" | "seasons" | "forecast" | "messages">("farms");
  const [farmerReviews, setFarmerReviews] = useState<ApiReview[]>([]);
  const [farmerReplyText, setFarmerReplyText] = useState<{ [id: number]: string }>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<{ [id: number]: boolean }>({});
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [clientNowMs, setClientNowMs] = useState<number | null>(null);
  const authUser = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const activeOwnerId = resolveFarmerOwnerId(authUser);
  const activeAlertEmail = authUser?.email || "";
  const isCustomFarmerAccount = activeOwnerId !== "farmer_hung" && activeOwnerId !== "farmer_thieu";
  const [isUploadingLogImage, setIsUploadingLogImage] = useState(false);
  const [isUploadingRenewImage, setIsUploadingRenewImage] = useState(false);

  useEffect(() => {
    reviewService.getAllReviews()
      .then((data) => setFarmerReviews(data || []))
      .catch(() => {});
  }, []);

  async function handleFarmerSubmitReply(reviewId: number, farmName: string) {
    const text = farmerReplyText[reviewId]?.trim();
    if (!text) {
      toast.error("Vui lòng nhập nội dung phản hồi!");
      return;
    }
    setIsSubmittingReply((prev) => ({ ...prev, [reviewId]: true }));
    const authorName = `${authUser?.name || "Nguyễn Văn Hùng"} (${farmName || "Chủ Nhà Vườn"})`;
    try {
      const updated = await reviewService.replyReview(reviewId, text, authorName);
      setFarmerReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                reply: updated.reply || text,
                replyAuthor: updated.replyAuthor || authorName,
                repliedAt: updated.repliedAt || new Date().toISOString(),
              }
            : r
        )
      );
      setFarmerReplyText((prev) => ({ ...prev, [reviewId]: "" }));
      toast.success("Đã đăng phản hồi từ Chủ Vườn thành công!");
    } catch {
      toast.error("Không thể đăng phản hồi, vui lòng thử lại!");
    } finally {
      setIsSubmittingReply((prev) => ({ ...prev, [reviewId]: false }));
    }
  }

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["farms", "batches", "logs", "products", "certs", "reviews", "seasons", "forecast", "messages"].includes(tab)) {
      setActiveTab(tab as "farms" | "batches" | "logs" | "products" | "certs" | "reviews" | "seasons" | "forecast" | "messages");
    } else if (!tab) {
      setActiveTab((prev) => (prev === "forecast" || prev === "seasons" ? "farms" : prev));
    }
  }, [searchParams]);

  // =========================================================================
  // 1. DỮ LIỆU QUẢN LÝ NÔNG TRẠI (Quản lý nhiều nông trại canh tác)
  // =========================================================================
  const [farms, setFarms] = useState<FarmItem[]>(DEFAULT_FARMS);

  // Nông trại đang được chọn làm việc
  const [selectedFarmId, setSelectedFarmId] = useState<string>("f1");
  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];

  // Modal Thêm Nông Trại Mới
  const [isAddFarmModalOpen, setIsAddFarmModalOpen] = useState(false);
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmCode, setNewFarmCode] = useState("NT-VN-03");
  const [newFarmOwner, setNewFarmOwner] = useState(DEFAULT_FARMS[0].owner);
  const [newFarmPhone, setNewFarmPhone] = useState(DEFAULT_FARMS[0].phone);
  const [newFarmAddress, setNewFarmAddress] = useState("");
  const [newFarmProvince, setNewFarmProvince] = useState("Lâm Đồng");
  const [newFarmArea, setNewFarmArea] = useState("2.5");
  const [newFarmCert, setNewFarmCert] = useState("VietGAP Trồng trọt");
  const [newFarmDocUrls, setNewFarmDocUrls] = useState<string[]>([]);
  const [newFarmDocUrlInput, setNewFarmDocUrlInput] = useState("");
  const [newFarmDocNote, setNewFarmDocNote] = useState("");
  const [isUploadingFarmDoc, setIsUploadingFarmDoc] = useState(false);

  // Modal Sửa Nông Trại
  const [editingFarm, setEditingFarm] = useState<FarmItem | null>(null);

  // Modal Gửi Lại Hồ Sơ Xác Minh Nông Trại
  const [resubmitFarm, setResubmitFarm] = useState<FarmItem | null>(null);
  const [resubmitDocUrls, setResubmitDocUrls] = useState<string[]>([]);
  const [resubmitDocUrlInput, setResubmitDocUrlInput] = useState("");
  const [resubmitDocNote, setResubmitDocNote] = useState("");
  const [isUploadingResubmitDoc, setIsUploadingResubmitDoc] = useState(false);

  // =========================================================================
  // 2. DỮ LIỆU LÔ THU HOẠCH
  // =========================================================================
  const [batches, setBatches] = useState<BatchItem[]>(DEFAULT_BATCHES);
  const [activeFilter, setActiveFilter] = useState<string>("Tất cả");
  const [selectedBatchFarm, setSelectedBatchFarm] = useState<string>("ALL");
  const [selectedTransportFilter, setSelectedTransportFilter] = useState<string>("Tất cả");
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Form State tạo Lô mới
  const [formFarmCode, setFormFarmCode] = useState("NT-DT-02");
  const [formProduct, setFormProduct] = useState("Xoài Cát Chu Cao Lãnh");
  const [formLotCode, setFormLotCode] = useState("XC-2026-03");
  const [formPlantingDate, setFormPlantingDate] = useState("2026-09-01");
  const [formHarvestDate, setFormHarvestDate] = useState("2026-11-12");
  const [formExpiryDate, setFormExpiryDate] = useState("2026-11-26");
  const [formQty, setFormQty] = useState("500");
  const [formUnit, setFormUnit] = useState("kg");
  const [formCert, setFormCert] = useState("VietGAP");
  const [formCultivation, setFormCultivation] = useState("Quy trình an toàn VietGAP");
  const [formTransportDest, setFormTransportDest] = useState("Kho Tổng Logistics TP.HCM");

  // =========================================================================
  // 2.1. DỮ LIỆU NHẬT KÝ VÒNG ĐỜI LÔ THU HOẠCH (POST-HARVEST LIFECYCLE)
  // =========================================================================
  const [selectedLotForTimeline, setSelectedLotForTimeline] = useState<BatchItem | null>(null);
  const [isLotTimelineModalOpen, setIsLotTimelineModalOpen] = useState(false);
  const [lotTimelineEvents, setLotTimelineEvents] = useState<LotTimelineEvent[]>([]);
  const [isLoadingLotTimeline, setIsLoadingLotTimeline] = useState(false);
  const [isUpdatingLotStatus, setIsUpdatingLotStatus] = useState(false);
  const [editTransportStatus, setEditTransportStatus] = useState<"Chưa vận chuyển" | "Đang vận chuyển" | "Đã nhập kho đích">("Chưa vận chuyển");
  const [editTransportDest, setEditTransportDest] = useState("");
  const [sseConnected, setSseConnected] = useState(false);
  const selectedLotCodeRef = useRef<string | null>(null);

  // In Tem Nhãn Mã QR Lô Hàng Chuẩn GS1
  const [isPrintLabelModalOpen, setIsPrintLabelModalOpen] = useState(false);
  const [selectedLotForPrint, setSelectedLotForPrint] = useState<QrLabelLot | null>(null);

  const handleOpenPrintLabel = (lot: BatchItem | ApiHarvestLot) => {
    const matchedFarm = farms.find((f) => f.code === lot.farmCode);
    setSelectedLotForPrint({
      code: lot.code,
      product: lot.product,
      qty: lot.qty,
      unit: lot.unit || "kg",
      harvestDate: lot.harvestDate,
      expiryDate: lot.expiryDate,
      cert: lot.cert,
      cultivation: lot.cultivation,
      farmCode: lot.farmCode,
      farmName: matchedFarm ? matchedFarm.name : ("farmName" in lot ? lot.farmName : undefined),
      farmAddress: matchedFarm ? matchedFarm.address : undefined,
      transportDestination: lot.transportDestination,
    });
    setIsPrintLabelModalOpen(true);
  };

  useEffect(() => {
    selectedLotCodeRef.current = selectedLotForTimeline?.code || null;
  }, [selectedLotForTimeline]);

  // Thêm sự kiện vòng đời mới
  const [isAddingCustomEvent, setIsAddingCustomEvent] = useState(false);
  const [customEventStage, setCustomEventStage] = useState("Đóng gói & Dán tem QR");
  const [customEventNote, setCustomEventNote] = useState("");
  const [customEventOperator, setCustomEventOperator] = useState("");
  const [isSubmittingCustomEvent, setIsSubmittingCustomEvent] = useState(false);

  // =========================================================================
  // 3. DỮ LIỆU NHẬT KÝ CANH TÁC
  // =========================================================================
  const [farmingLogs, setFarmingLogs] = useState<FarmingLogItem[]>(DEFAULT_LOGS);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [selectedFarmForLog, setSelectedFarmForLog] = useState("NT-DT-02");
  const [selectedBatchForLog, setSelectedBatchForLog] = useState("XC-2026-02");
  const [logDate, setLogDate] = useState("2026-11-12");
  const [logStage, setLogStage] = useState<FarmingLogItem["stage"]>("Bón phân");
  const [logAction, setLogAction] = useState("");
  const [logMaterials, setLogMaterials] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logProofImage, setLogProofImage] = useState("");
  const [logProofFileName, setLogProofFileName] = useState("");
  const [selectedLogFarm, setSelectedLogFarm] = useState<string>("ALL");

  // =========================================================================
  // 4. DỮ LIỆU SẢN PHẨM NÔNG NGHIỆP
  // =========================================================================
  const [products, setProducts] = useState<ProductItem[]>(DEFAULT_PRODUCTS);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [newProdFarmCode, setNewProdFarmCode] = useState("NT-DT-02");
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("trai_cay");
  const [newProdPrice, setNewProdPrice] = useState("75000");
  const [newProdUnit, setNewProdUnit] = useState("kg");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdImage, setNewProdImage] = useState<string>("");
  const [selectedProductFarm, setSelectedProductFarm] = useState<string>("ALL");
  const [selectedCertFarm, setSelectedCertFarm] = useState<string>("ALL");

  // =========================================================================
  // 5. DỮ LIỆU CHỨNG NHẬN
  // =========================================================================
  const [certifications, setCertifications] = useState<CertificationItem[]>(DEFAULT_CERTS);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [newCertFarmCode, setNewCertFarmCode] = useState("NT-DL-01");
  const [newCertName, setNewCertName] = useState("Chứng nhận VietGAP Trồng trọt");
  const [newCertNumber, setNewCertNumber] = useState("");
  const [newCertIssuedBy, setNewCertIssuedBy] = useState("");
  const [newCertIssueDate, setNewCertIssueDate] = useState("2026-11-12");
  const [newCertExpiryDate, setNewCertExpiryDate] = useState("2027-11-12");

  // State modal gia hạn chứng nhận (+1 năm) - Chờ Admin xét duyệt
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewingCert, setRenewingCert] = useState<CertificationItem | null>(null);
  const [renewDuration, setRenewDuration] = useState("1");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewRequestedExpiryDate, setRenewRequestedExpiryDate] = useState("");
  const [renewNewCertNumber, setRenewNewCertNumber] = useState("");
  const [renewIssuedBy, setRenewIssuedBy] = useState("");
  const [renewNote, setRenewNote] = useState("");
  const [renewProofImage, setRenewProofImage] = useState("");
  const [renewProofFileName, setRenewProofFileName] = useState("");
  const [isSubmittingRenewal, setIsSubmittingRenewal] = useState(false);

  useEffect(() => {
    if (!authHydrated) return;

    const savedFarms = readStoredJson<FarmItem[]>(STORAGE_KEYS.farms);
    const localFarms = Array.isArray(savedFarms) && savedFarms.length > 0 ? savedFarms : DEFAULT_FARMS;
    const ownerScopedDefaults = isCustomFarmerAccount
      ? []
      : DEFAULT_FARMS.filter((f) => (f.ownerId || "farmer_hung") === activeOwnerId);
    setFarms(
      isCustomFarmerAccount
        ? []
        : localFarms.filter((f) => (f.ownerId || "farmer_hung") === activeOwnerId)
    );

    if (isCustomFarmerAccount) {
      setBatches([]);
      setProducts([]);
      setCertifications([]);
      setFarmingLogs([]);
    }

    setClientNowMs(Date.now());
    setFormPlantingDate(getLocalIsoDate(-30));
    setFormHarvestDate(getLocalIsoDate(0));
    setFormExpiryDate(getLocalIsoDate(14));
    setLogDate(getLocalIsoDate(0));
    setNewCertIssueDate(getLocalIsoDate(0));
    setNewCertExpiryDate(getLocalIsoDate(365));
    setStorageLoaded(true);

    let effectiveFarms = ownerScopedDefaults;

    farmerService
      .getFarms({ ownerId: activeOwnerId })
      .then((farmData) => {
        if (Array.isArray(farmData)) {
          if (farmData.length > 0 || isCustomFarmerAccount) {
            const mappedFarms: FarmItem[] = farmData.map((f) => ({
              id: f.id ? String(f.id) : f.code,
              code: f.code,
              name: f.name,
              owner: f.owner,
              ownerId: f.ownerId || activeOwnerId,
              phone: f.phone || "",
              address: f.address,
              province: f.province || "Việt Nam",
              areaHectares: Number(f.areaHectares) || 1.0,
              certStandard: f.certStandard || "VietGAP Trồng trọt",
              rating: Number(f.rating) || 5.0,
              activeBatchCount: 0,
              isDefault: Boolean(f.isDefault),
              verificationStatus: f.verificationStatus || "APPROVED",
              verificationDocType: f.verificationDocType,
              verificationDocUrl: f.verificationDocUrl,
              verificationNote: f.verificationNote,
              verificationDecisionReason: f.verificationDecisionReason,
              verificationRequestId: f.verificationRequestId,
            }));
            effectiveFarms = mappedFarms;
            setFarms(mappedFarms);
          }
        }
      })
      .catch((err) => {
        console.warn("Không thể tải nông trại từ API:", err);
      });

    farmerService
      .getBatches({ ownerId: activeOwnerId })
      .then((data) => {
        if (Array.isArray(data) && (data.length > 0 || isCustomFarmerAccount)) {
          const mapped: BatchItem[] = data.map((b) => ({
            code: b.code,
            farmCode: b.farmCode || extractFarmCode(b.farmName, undefined, effectiveFarms),
            ownerId: b.ownerId || activeOwnerId,
            product: b.product,
            plantingDate: b.plantingDate || "",
            harvestDate: b.harvestDate,
            expiryDate: b.expiryDate || "",
            qty: b.qty,
            unit: b.unit || "kg",
            status: (b.status as BatchItem["status"]) || "Chờ duyệt xuất kho",
            statusColor: resolveBatchStatusColor(b.status, b.statusColor),
            cert: b.cert || "VietGAP",
            cultivation: b.cultivation || "Theo tiêu chuẩn",
            transportDestination: b.transportDestination || "Lưu tại kho bảo quản nông trại",
            transportStatus: normalizeTransportStatus(b.transportStatus),
          }));
          setBatches(mapped);
        }
      })
      .catch((err) => {
        console.warn("Không thể tải lô từ API:", err);
      });

    farmerService
      .getProducts({ ownerId: activeOwnerId, scope: "farmer" })
      .then((data) => {
        if (Array.isArray(data) && (data.length > 0 || isCustomFarmerAccount)) {
          const mapped: ProductItem[] = data.map((p) => {
            const farmCode = p.farmCode || extractFarmCode(p.farm, p.origin, effectiveFarms);
            const matchedFarm = effectiveFarms.find((f) => f.code === farmCode);
            return {
              id: p.id,
              farmCode,
              ownerId: p.ownerId || activeOwnerId,
              name: p.name,
              category: p.categoryCode || "trai_cay",
              price: Number(p.price) || 50000,
              unit: p.unit || "kg",
              description: p.description || p.name,
              origin: p.origin || p.farm || matchedFarm?.name || "Nông Trại Liên Kết",
              image: p.image || "🌱",
            };
          });
          setProducts(mapped);
        }
      })
      .catch((err) => {
        console.warn("Không thể tải sản phẩm từ API:", err);
      });

    const nowMs = Date.now();
    farmerService
      .getCertificates({ ownerId: activeOwnerId })
      .then((data) => {
        if (Array.isArray(data) && (data.length > 0 || isCustomFarmerAccount)) {
          const mapped: CertificationItem[] = data.map((c) => {
            const rawItem: CertificationItem = {
              id: c.id ? String(c.id) : c.certNumber,
              farmCode: c.farmCode || effectiveFarms[0]?.code || "NT-DL-01",
              ownerId: c.ownerId || activeOwnerId,
              name: c.name,
              certNumber: c.certNumber,
              issuedBy: c.issuedBy || "Tổ chức Chứng nhận Nông nghiệp",
              issueDate: c.issueDate || "01/01/2026",
              expiryDate: c.expiryDate || "01/01/2027",
              status: (c.status || "VALID") as CertificationItem["status"],
              daysLeft: typeof c.daysLeft === "number" ? c.daysLeft : 365,
              approvalStatus: (c.approvalStatus || "NONE") as CertificationItem["approvalStatus"],
              pendingRenewal: c.pendingNewCertNumber
                ? {
                    newCertNumber: c.pendingNewCertNumber,
                    proofImage: c.pendingProofImage || "",
                    requestedExpiryDate: c.pendingRequestedExpiryDate || "",
                    note: c.pendingNote || "",
                    submittedAt: c.submittedAt || "",
                  }
                : undefined,
            };
            return evaluateCertification(rawItem, nowMs);
          });
          setCertifications(mapped);
        }
      })
      .catch((err) => {
        console.warn("Không thể tải chứng nhận từ API:", err);
      });

    farmerService
      .getLogs({ ownerId: activeOwnerId })
      .then((data) => {
        if (Array.isArray(data) && (data.length > 0 || isCustomFarmerAccount)) {
          const mapped: FarmingLogItem[] = data.map((l) => ({
            id: String(l.id),
            farmCode: l.farmCode || effectiveFarms[0]?.code || "NT-DL-01",
            ownerId: l.ownerId || activeOwnerId,
            batchCode: l.batchCode || "",
            date: l.date || l.time || "",
            stage: l.stage as FarmingLogItem["stage"],
            action: l.action || l.stage,
            materialsUsed: l.materialsUsed || l.materials || "",
            notes: l.notes || l.note || "",
            proofImage: l.proofImage || undefined,
          }));
          setFarmingLogs(mapped);
        }
      })
      .catch((err) => {
        console.warn("Không thể tải nhật ký canh tác từ API:", err);
      });
  }, [authHydrated, activeOwnerId, isCustomFarmerAccount]);

  // 2.3. ĐỒNG BỘ TRẠNG THÁI THỜI GIAN THỰC (SERVER-SENT EVENTS - SSE)
  useEffect(() => {
    const streamBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8080/api/v1";
    const streamUrl = `${streamBase}/farmer/batches/stream`;

    let eventSource: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const connectSse = () => {
      try {
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener("connected", () => {
          setSseConnected(true);
        });

        eventSource.addEventListener("batch-changed", (e: MessageEvent) => {
          try {
            const data: BatchChangeEvent = JSON.parse(e.data);
            if (!data || !data.code) return;

            setBatches((prev) =>
              prev.map((item) => {
                if (item.code.toUpperCase() === data.code.toUpperCase()) {
                  return {
                    ...item,
                    status: (data.status as BatchItem["status"]) || item.status,
                    statusColor: resolveBatchStatusColor(data.status, data.statusColor),
                    transportStatus: data.transportStatus ? normalizeTransportStatus(data.transportStatus) : item.transportStatus,
                    transportDestination: data.transportDestination || item.transportDestination,
                  };
                }
                return item;
              })
            );

            // Cập nhật modal đang mở nếu đúng lô
            if (selectedLotCodeRef.current && selectedLotCodeRef.current.toUpperCase() === data.code.toUpperCase()) {
              setSelectedLotForTimeline((prev) => {
                if (!prev || prev.code.toUpperCase() !== data.code.toUpperCase()) return prev;
                return {
                  ...prev,
                  status: (data.status as BatchItem["status"]) || prev.status,
                  statusColor: resolveBatchStatusColor(data.status, data.statusColor),
                  transportStatus: data.transportStatus ? normalizeTransportStatus(data.transportStatus) : prev.transportStatus,
                  transportDestination: data.transportDestination || prev.transportDestination,
                };
              });

              // Tự động tải lại timeline trong modal
              farmerService.getBatchTimeline(data.code).then((fresh) => {
                if (fresh) setLotTimelineEvents(fresh);
              }).catch(() => {});
            }

            // Hiển thị toast thông báo theo từng loại hành động
            if (data.actionType === "ADMIN_APPROVED") {
              toast.success(`🔔 [Admin Thẩm Định] Đã duyệt xuất kho cho lô ${data.code}!`);
            } else if (data.actionType === "ADMIN_REJECTED") {
              toast.error(`⚠️ [Admin Thẩm Định] Từ chối xuất kho lô ${data.code}: ${data.note || "Yêu cầu tái kiểm định"}`);
            } else if (data.actionType === "DRIVER_PICKUP") {
              toast.success(`🚚 [Tài Xế Nhận Hàng] Đã quét QR tiếp nhận lô ${data.code} lên xe lạnh!`);
            } else if (data.actionType === "WAREHOUSE_INBOUND") {
              toast.success(`🏢 [Thủ Kho Nhập Kho] Đã quét QR hoàn tất nhập kho đích cho lô ${data.code}!`);
            } else {
              toast.info(`🔔 Trạng thái lô ${data.code} vừa được cập nhật (${data.status})`);
            }
          } catch (err) {
            console.warn("Lỗi phân tích SSE batch-changed:", err);
          }
        });

        eventSource.onerror = () => {
          setSseConnected(false);
          eventSource?.close();
          setTimeout(connectSse, 4000);
        };
      } catch {
        setSseConnected(false);
      }
    };

    connectSse();

    // Fallback polling an toàn mỗi 5s theo đúng ownerId hiện tại
    pollTimer = setInterval(() => {
      farmerService.getBatches({ ownerId: activeOwnerId }).then((data) => {
        if (data && data.length > 0) {
          setBatches((prev) => {
            const map = new Map(data.map((d) => [d.code.toUpperCase(), d]));
            return prev.map((oldItem) => {
              const fresh = map.get(oldItem.code.toUpperCase());
              if (!fresh) return oldItem;
              return {
                ...oldItem,
                status: (fresh.status as BatchItem["status"]) || oldItem.status,
                statusColor: resolveBatchStatusColor(fresh.status, fresh.statusColor),
                transportStatus: fresh.transportStatus ? normalizeTransportStatus(fresh.transportStatus) : oldItem.transportStatus,
                transportDestination: fresh.transportDestination || oldItem.transportDestination,
              };
            });
          });
        }
      }).catch(() => {});
    }, 5000);

    return () => {
      if (eventSource) eventSource.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [activeOwnerId]);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.farms, JSON.stringify(farms));
    } catch {
      // Ignore storage quota errors
    }
  }, [farms, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.selectedFarmId, selectedFarmId);
    } catch {
      // Ignore storage errors
    }
  }, [selectedFarmId, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(farmingLogs));
    } catch {
      // Ignore storage errors
    }
  }, [farmingLogs, storageLoaded]);

  useEffect(() => {
    if (!storageLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.certs, JSON.stringify(certifications));
    } catch {
      // Ignore storage errors
    }
  }, [certifications, storageLoaded]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const openAddFarmModal = () => {
    setNewFarmCode(getNextFarmCode(farms));
    setNewFarmName("");
    setNewFarmOwner(currentProfile.name);
    setNewFarmPhone(currentProfile.phone);
    setNewFarmAddress("");
    setNewFarmProvince(activeOwnerId === "farmer_thieu" ? "Sơn La" : "Lâm Đồng");
    setNewFarmArea("2.5");
    setNewFarmCert(activeOwnerId === "farmer_thieu" ? "Hữu cơ TCVN" : "VietGAP Trồng trọt");
    setNewFarmDocUrls([]);
    setNewFarmDocUrlInput("");
    setNewFarmDocNote("");
    setIsUploadingFarmDoc(false);
    setIsAddFarmModalOpen(true);
  };

  const handleUploadFarmDocs = async (files: FileList | null, target: "create" | "resubmit" = "create") => {
    if (!files || files.length === 0) return;
    if (target === "create") setIsUploadingFarmDoc(true);
    else setIsUploadingResubmitDoc(true);
    try {
      const selectedFiles = Array.from(files);
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const uploaded = await farmerService.uploadProofImage(file, {
          ownerId: activeOwnerId,
          category: "farm-verification",
        });
        uploadedUrls.push(uploaded.url);
      }
      if (target === "create") {
        setNewFarmDocUrls((prev) => Array.from(new Set([...prev, ...uploadedUrls])));
      } else {
        setResubmitDocUrls((prev) => Array.from(new Set([...prev, ...uploadedUrls])));
      }
      toast.success(`Đã tải ${uploadedUrls.length} ảnh hồ sơ lên hệ thống!`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tải ảnh hồ sơ nông trại"));
    } finally {
      if (target === "create") setIsUploadingFarmDoc(false);
      else setIsUploadingResubmitDoc(false);
    }
  };

  const handleAddManualDocUrl = (target: "create" | "resubmit") => {
    const raw = (target === "create" ? newFarmDocUrlInput : resubmitDocUrlInput).trim();
    if (!raw) return;
    if (target === "create") {
      setNewFarmDocUrls((prev) => Array.from(new Set([...prev, raw])));
      setNewFarmDocUrlInput("");
    } else {
      setResubmitDocUrls((prev) => Array.from(new Set([...prev, raw])));
      setResubmitDocUrlInput("");
    }
  };

  const openResubmitVerificationModal = (farm: FarmItem) => {
    setResubmitFarm(farm);
    setResubmitDocUrls(parseFarmDocUrls(farm.verificationDocUrl));
    setResubmitDocUrlInput("");
    setResubmitDocNote(farm.verificationNote || "");
    setIsUploadingResubmitDoc(false);
  };

  const handleResubmitFarmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitFarm) return;
    const allUrls = Array.from(
      new Set([...resubmitDocUrls, ...(resubmitDocUrlInput.trim() ? [resubmitDocUrlInput.trim()] : [])])
    );
    if (allUrls.length === 0) {
      toast.error("Vui lòng tải ảnh hoặc nhập đường dẫn hồ sơ đất & chứng nhận!");
      return;
    }
    try {
      const updated = await farmerService.resubmitFarmVerification(resubmitFarm.code || resubmitFarm.id, {
        verificationDocType: resubmitFarm.verificationDocType || "Hồ sơ giấy tờ đất & chứng nhận",
        verificationDocUrl: serializeFarmDocUrls(allUrls),
        verificationNote: resubmitDocNote.trim() || undefined,
      });
      setFarms((prev) =>
        prev.map((f) =>
          f.id === resubmitFarm.id
            ? {
                ...f,
                verificationStatus: updated.verificationStatus || "PENDING",
                verificationDocType: updated.verificationDocType,
                verificationDocUrl: updated.verificationDocUrl,
                verificationNote: updated.verificationNote,
                verificationDecisionReason: updated.verificationDecisionReason,
                verificationRequestId: updated.verificationRequestId,
              }
            : f
        )
      );
      toast.success(`Đã gửi lại hồ sơ xác minh nông trại "${resubmitFarm.name}" cho Admin!`);
      setResubmitFarm(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể gửi lại hồ sơ xác minh nông trại"));
    }
  };

  // Thêm Nông Trại mới (Lưu DB PostgreSQL; nếu chưa đính kèm giấy tờ đất thì mở ngay bước đính kèm hồ sơ)
  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeUpper = newFarmCode.trim().toUpperCase();
    const areaNum = Number(newFarmArea);
    if (!codeUpper) {
      toast.error("Vui lòng nhập mã nông trại!");
      return;
    }
    if (farms.some((f) => f.code.toUpperCase() === codeUpper)) {
      toast.error(`Mã nông trại ${codeUpper} đã tồn tại!`);
      return;
    }
    if (!newFarmName.trim() || !newFarmAddress.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên và địa chỉ nông trại!");
      return;
    }
    if (!Number.isFinite(areaNum) || areaNum <= 0) {
      toast.error("Quy mô diện tích phải lớn hơn 0 ha!");
      return;
    }
    const allDocUrls = Array.from(
      new Set([...newFarmDocUrls, ...(newFarmDocUrlInput.trim() ? [newFarmDocUrlInput.trim()] : [])])
    );
    if (allDocUrls.length === 0) {
      toast.error("Vui lòng đính kèm ít nhất 1 ảnh hoặc link giấy tờ đất / chứng nhận!");
      return;
    }

    const payload = {
      code: codeUpper,
      name: newFarmName.trim(),
      owner: newFarmOwner.trim() || currentProfile.name,
      ownerId: activeOwnerId,
      phone: newFarmPhone.trim() || currentProfile.phone,
      address: newFarmAddress.trim(),
      province: newFarmProvince.trim() || "Việt Nam",
      areaHectares: areaNum,
      certStandard: newFarmCert,
      rating: 5.0,
      verificationDocType: "Hồ sơ giấy tờ đất & chứng nhận",
      verificationDocUrl: serializeFarmDocUrls(allDocUrls),
      verificationNote: newFarmDocNote.trim() || undefined,
    };

    try {
      const saved = await farmerService.createFarm(payload);
      const newFarm: FarmItem = {
        id: saved.id ? String(saved.id) : "f_" + Date.now(),
        code: saved.code,
        name: saved.name,
        owner: saved.owner,
        ownerId: saved.ownerId || activeOwnerId,
        phone: saved.phone || "",
        address: saved.address,
        province: saved.province || "Việt Nam",
        areaHectares: Number(saved.areaHectares) || areaNum,
        certStandard: saved.certStandard || newFarmCert,
        rating: Number(saved.rating) || 5.0,
        activeBatchCount: 0,
        verificationStatus: saved.verificationStatus || "PENDING",
        verificationDocType: saved.verificationDocType || payload.verificationDocType,
        verificationDocUrl: saved.verificationDocUrl || payload.verificationDocUrl,
        verificationNote: saved.verificationNote || payload.verificationNote,
        verificationDecisionReason: saved.verificationDecisionReason,
        verificationRequestId: saved.verificationRequestId,
      };
      setFarms([...farms, newFarm]);
      setIsAddFarmModalOpen(false);
      setNewFarmName("");
      setNewFarmAddress("");
      setNewFarmDocUrls([]);
      setNewFarmDocUrlInput("");
      setNewFarmDocNote("");
      toast.success(`Đã thêm nông trại "${newFarm.name}" (Mã: ${newFarm.code}) kèm ${allDocUrls.length} tài liệu chờ Admin duyệt!`);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409 || status === 400 || status === 403) {
        toast.error(getApiErrorMessage(err, "Không thể tạo nông trại mới!"));
        return;
      }
      const fallbackFarm: FarmItem = {
        id: "f_" + Date.now(),
        ...payload,
        verificationStatus: "PENDING",
        activeBatchCount: 0,
      };
      setFarms([...farms, fallbackFarm]);
      setIsAddFarmModalOpen(false);
      setNewFarmName("");
      setNewFarmAddress("");
      setNewFarmDocUrls([]);
      setNewFarmDocUrlInput("");
      setNewFarmDocNote("");
      toast.info(`Đã lưu tạm trang trại "${fallbackFarm.name}" trên máy!`);
    }
  };

  // Cập nhật Nông Trại (Lưu DB PostgreSQL)
  const handleUpdateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;
    if (!editingFarm.name.trim()) {
      toast.error("Tên nông trại không được để trống!");
      return;
    }
    if (!Number.isFinite(editingFarm.areaHectares) || editingFarm.areaHectares <= 0) {
      toast.error("Diện tích phải lớn hơn 0 ha!");
      return;
    }

    const updated: FarmItem = {
      ...editingFarm,
      name: editingFarm.name.trim(),
      owner: editingFarm.owner.trim(),
      phone: editingFarm.phone.trim(),
      address: editingFarm.address.trim(),
      province: (editingFarm.province || "").trim(),
    };
    try {
      await farmerService.updateFarm(updated.code || updated.id, {
        name: updated.name,
        owner: updated.owner,
        phone: updated.phone,
        address: updated.address,
        province: updated.province,
        areaHectares: updated.areaHectares,
        certStandard: updated.certStandard,
      });
      toast.success(`Đã cập nhật trang trại "${updated.name}" vào Database!`);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 403) {
        toast.error(getApiErrorMessage(err, "Bạn không có quyền chỉnh sửa nông trại này!"));
        return;
      }
      toast.success(`Đã cập nhật thông tin trang trại "${updated.name}"!`);
    }
    setFarms(farms.map((f) => (f.id === updated.id ? updated : f)));
    setEditingFarm(null);
  };

  // Xóa Nông Trại (Lưu DB PostgreSQL)
  const handleDeleteFarm = async (id: string, name: string) => {
    if (visibleFarms.length <= 1) {
      toast.error("Hệ thống yêu cầu duy trì ít nhất 1 nông trại!");
      return;
    }
    const targetFarm = farms.find((f) => f.id === id);
    if (confirm(`Bạn có chắc muốn xóa nông trại "${name}"?`)) {
      try {
        await farmerService.deleteFarm(targetFarm?.code || id);
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          toast.error(getApiErrorMessage(err, "Bạn không có quyền xóa nông trại này!"));
          return;
        }
      }
      const remaining = farms.filter((f) => f.id !== id);
      setFarms(remaining);
      if (selectedFarmId === id && remaining[0]) {
        setSelectedFarmId(remaining[0].id);
      }
      if (targetFarm) {
        if (selectedBatchFarm === targetFarm.code) setSelectedBatchFarm("ALL");
        if (selectedLogFarm === targetFarm.code) setSelectedLogFarm("ALL");
        if (selectedProductFarm === targetFarm.code) setSelectedProductFarm("ALL");
        if (selectedCertFarm === targetFarm.code) setSelectedCertFarm("ALL");
      }
      toast.info(`Đã xóa nông trại ${name}`);
    }
  };

  // Sinh mã lô tự động
  const handleProductSelect = (productName: string) => {
    setFormProduct(productName);
    setFormLotCode(generateLotCodeForProduct(productName, batches));
  };

  const openCreateBatchModal = (preferredFarmCode?: string, preferredProductName?: string, preferredQty?: string) => {
    const defaultFarmForOwner = visibleFarms[0]?.code || "NT-DL-01";
    const targetFarmCode =
      preferredFarmCode ||
      (selectedBatchFarm !== "ALL" && visibleFarms.some((f) => f.code === selectedBatchFarm)
        ? selectedBatchFarm
        : defaultFarmForOwner);
    const targetFarm = visibleFarms.find((f) => f.code === targetFarmCode) || visibleFarms[0];
    const matchingProducts = visibleProducts.filter((p) => !p.farmCode || p.farmCode === targetFarmCode);
    const nextProduct = preferredProductName || matchingProducts[0]?.name || visibleProducts[0]?.name || "Nông sản sạch";

    setFormFarmCode(targetFarmCode);
    setFormProduct(nextProduct);
    setFormLotCode(generateLotCodeForProduct(nextProduct, visibleBatches));
    setFormCert(normalizeBatchCert(targetFarm?.certStandard));
    setFormPlantingDate(getLocalIsoDate(-30));
    setFormHarvestDate(getLocalIsoDate(0));
    setFormExpiryDate(getLocalIsoDate(14));
    setFormQty(preferredQty || "500");
    setFormUnit("kg");
    setFormCultivation(
      targetFarm?.certStandard?.toLowerCase().includes("globalgap")
        ? "Quy trình an toàn GlobalGAP"
        : "Quy trình an toàn VietGAP"
    );
    setFormTransportDest("Kho Tổng Logistics TP.HCM");
    setIsBatchModalOpen(true);
  };

  const handlePlanHarvestBatchFromForecast = (item: ApiForecastProductItem) => {
    const suggestedQty = String(Math.max(10, Math.round(item.recommendedPrepQty || item.predictedDemand || 100)));
    setActiveTab("batches");
    openCreateBatchModal(item.farmCode || undefined, item.productName, suggestedQty);
    toast.info(`Đã nạp sản lượng AI gợi ý (${suggestedQty} ${item.unit}) cho "${item.productName}"!`);
  };

  const handleBatchFarmChange = (nextFarmCode: string) => {
    setFormFarmCode(nextFarmCode);
    const targetFarm = visibleFarms.find((f) => f.code === nextFarmCode) || visibleFarms[0];
    const matchingProducts = visibleProducts.filter((p) => !p.farmCode || p.farmCode === nextFarmCode);
    const nextProduct = matchingProducts[0]?.name || visibleProducts[0]?.name || "Nông sản sạch";
    setFormProduct(nextProduct);
    setFormLotCode(generateLotCodeForProduct(nextProduct, visibleBatches));
    setFormCert(normalizeBatchCert(targetFarm?.certStandard));
  };

  // Nộp form tạo Lô thu hoạch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeUpper = formLotCode.trim().toUpperCase();
    if (!codeUpper) {
      toast.error("Vui lòng nhập mã lô thu hoạch!");
      return;
    }
    if (batches.some((b) => b.code.toUpperCase() === codeUpper)) {
      toast.error(`Mã lô ${codeUpper} đã tồn tại trong danh sách!`);
      return;
    }
    const qtyNum = Number(formQty);
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
      toast.error("Sản lượng thu hoạch phải lớn hơn 0!");
      return;
    }
    if (!formHarvestDate || !formExpiryDate) {
      toast.error("Vui lòng nhập đầy đủ ngày thu hoạch và hạn sử dụng!");
      return;
    }
    if (formExpiryDate < formHarvestDate) {
      toast.error("Hạn sử dụng phải sau hoặc cùng ngày thu hoạch!");
      return;
    }
    if (formPlantingDate && formHarvestDate < formPlantingDate) {
      toast.error("Ngày thu hoạch không thể trước ngày gieo trồng!");
      return;
    }

    const targetFarm = visibleFarms.find((f) => f.code === formFarmCode) || currentFarm;
    const newBatch: BatchItem = {
      code: codeUpper,
      farmCode: targetFarm.code,
      ownerId: activeOwnerId,
      product: formProduct.trim() || "Nông sản sạch",
      plantingDate: formatDisplayDate(formPlantingDate),
      harvestDate: formatDisplayDate(formHarvestDate),
      expiryDate: formatDisplayDate(formExpiryDate),
      qty: String(qtyNum),
      unit: formUnit,
      status: "Chờ duyệt xuất kho",
      statusColor: "#f97316",
      cert: formCert,
      cultivation: formCultivation.trim() || "Theo quy trình an toàn",
      transportDestination: formTransportDest,
      transportStatus: "Chưa vận chuyển",
    };

    setIsSubmittingBatch(true);
    try {
      const saved = await farmerService.createBatch({
        code: newBatch.code,
        ownerId: activeOwnerId,
        farmCode: targetFarm.code,
        product: newBatch.product,
        plantingDate: newBatch.plantingDate,
        harvestDate: newBatch.harvestDate,
        expiryDate: newBatch.expiryDate,
        qty: newBatch.qty,
        unit: newBatch.unit,
        status: newBatch.status,
        statusColor: newBatch.statusColor,
        cert: newBatch.cert,
        cultivation: newBatch.cultivation,
        farmName: `${targetFarm.name} (Mã: ${targetFarm.code})`,
        transportDestination: newBatch.transportDestination,
        transportStatus: newBatch.transportStatus,
      });

      const persistedBatch: BatchItem = {
        ...newBatch,
        code: saved.code || newBatch.code,
        transportDestination: saved.transportDestination || newBatch.transportDestination,
        transportStatus: saved.transportStatus
          ? normalizeTransportStatus(saved.transportStatus)
          : newBatch.transportStatus,
      };
      setBatches([persistedBatch, ...batches]);
      setIsBatchModalOpen(false);
      toast.success(`Đã tạo & lưu lô ${persistedBatch.code} cho ${targetFarm.name}!`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể tạo lô thu hoạch trên máy chủ!"));
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleDeleteBatch = async (code: string) => {
    try {
      await farmerService.deleteBatch(code);
      setBatches((prev) => prev.filter((item) => item.code !== code));
      toast.info(`Đã xóa lô ${code} khỏi hệ thống!`);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setBatches((prev) => prev.filter((item) => item.code !== code));
        toast.info(`Đã xóa lô ${code}!`);
      } else {
        toast.error(getApiErrorMessage(err, `Không thể xóa lô ${code} trên hệ thống!`));
      }
    }
  };

  // =========================================================================
  // XỬ LÝ NHẬT KÝ VÒNG ĐỜI LÔ THU HOẠCH & TIẾN TRÌNH DUYỆT XUẤT KHO
  // =========================================================================
  const handleOpenLotTimeline = async (lot: BatchItem) => {
    const normalizedTransport = normalizeTransportStatus(lot.transportStatus);
    setSelectedLotForTimeline({ ...lot, transportStatus: normalizedTransport });
    setEditTransportStatus(normalizedTransport);
    setEditTransportDest(lot.transportDestination || "Kho phân phối");
    setIsAddingCustomEvent(false);
    setIsLotTimelineModalOpen(true);
    setIsLoadingLotTimeline(true);

    try {
      const events = await farmerService.getBatchTimeline(lot.code);
      if (events && events.length > 0) {
        setLotTimelineEvents(events);
      } else {
        setLotTimelineEvents([
          {
            stage: "Thu hoạch & Khai báo lô",
            time: lot.harvestDate,
            badge: "Đã thu hoạch",
            note: `Sản lượng: ${lot.qty} ${lot.unit} - Nông trại: ${lot.farmCode} - Tiêu chuẩn: ${lot.cert} (${lot.cultivation})`,
          },
          {
            stage: "Kiểm định chất lượng KCS",
            time: lot.harvestDate,
            badge: "Đạt chuẩn KCS",
            note: "Kiểm nghiệm an toàn thực phẩm, dư lượng nitrat & BVTV đạt chuẩn ISO/IEC 17025",
          },
          {
            stage: "Thẩm định & Phê duyệt xuất kho",
            time: lot.harvestDate,
            badge: lot.status,
            note:
              lot.status === "Đã duyệt xuất kho"
                ? "Admin hệ thống đã thẩm định hồ sơ lô và phê duyệt đủ điều kiện xuất kho"
                : "Hồ sơ lô đang trong trạng thái chờ Ban Quản trị / Admin kiểm duyệt xuất kho",
          },
          {
            stage: "Lưu kho & Vận chuyển chuỗi lạnh",
            time: lot.harvestDate,
            badge: normalizedTransport,
            note: `Trạng thái: ${normalizedTransport} - Điểm đến: ${lot.transportDestination || "Kho bảo quản"}`,
          },
        ]);
      }
    } catch (err: unknown) {
      console.warn("Lỗi tải timeline lô:", err);
      setLotTimelineEvents([
        {
          stage: "Thu hoạch & Khai báo lô",
          time: lot.harvestDate,
          badge: "Đã thu hoạch",
          note: `Sản lượng: ${lot.qty} ${lot.unit} - Nông trại: ${lot.farmCode} - Tiêu chuẩn: ${lot.cert} (${lot.cultivation})`,
        },
        {
          stage: "Kiểm định chất lượng KCS",
          time: lot.harvestDate,
          badge: "Đạt chuẩn KCS",
          note: "Kiểm nghiệm an toàn thực phẩm, dư lượng nitrat & BVTV đạt chuẩn ISO/IEC 17025",
        },
        {
          stage: "Thẩm định & Phê duyệt xuất kho",
          time: lot.harvestDate,
          badge: lot.status,
          note:
            lot.status === "Đã duyệt xuất kho"
              ? "Admin hệ thống đã thẩm định hồ sơ lô và phê duyệt đủ điều kiện xuất kho"
              : "Hồ sơ lô đang trong trạng thái chờ Ban Quản trị / Admin kiểm duyệt xuất kho",
        },
        {
          stage: "Lưu kho & Vận chuyển chuỗi lạnh",
          time: lot.harvestDate,
          badge: normalizedTransport,
          note: `Trạng thái: ${normalizedTransport} - Điểm đến: ${lot.transportDestination || "Kho bảo quản"}`,
        },
      ]);
    } finally {
      setIsLoadingLotTimeline(false);
    }
  };

  const handleUpdateLotTransport = async () => {
    if (!selectedLotForTimeline) return;
    setIsUpdatingLotStatus(true);
    try {
      const updated = await farmerService.updateBatchStatus(selectedLotForTimeline.code, {
        transportStatus: editTransportStatus,
        transportDestination: editTransportDest.trim() || "Kho phân phối",
        adminNote: `Cập nhật xuất kho & vận chuyển: ${editTransportStatus}`,
      });

      setBatches((prev) =>
        prev.map((b) =>
          b.code === updated.code
            ? {
                ...b,
                transportStatus: normalizeTransportStatus(updated.transportStatus),
                transportDestination: updated.transportDestination,
              }
            : b
        )
      );

      setSelectedLotForTimeline((prev) =>
        prev
          ? {
              ...prev,
              transportStatus: normalizeTransportStatus(updated.transportStatus),
              transportDestination: updated.transportDestination,
            }
          : null
      );

      toast.success("Đã cập nhật trạng thái xuất kho & vận chuyển chuỗi lạnh!");

      const freshEvents = await farmerService.getBatchTimeline(selectedLotForTimeline.code);
      setLotTimelineEvents(freshEvents);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật vận chuyển");
    } finally {
      setIsUpdatingLotStatus(false);
    }
  };

  const handleDriverPickup = async (lotCode: string) => {
    setIsUpdatingLotStatus(true);
    try {
      const updated = await farmerService.driverPickup(lotCode);
      setBatches((prev) =>
        prev.map((b) =>
          b.code === updated.code
            ? {
                ...b,
                transportStatus: normalizeTransportStatus(updated.transportStatus),
                transportDestination: updated.transportDestination,
              }
            : b
        )
      );
      if (selectedLotForTimeline && selectedLotForTimeline.code === lotCode) {
        setSelectedLotForTimeline((prev) =>
          prev
            ? {
                ...prev,
                transportStatus: normalizeTransportStatus(updated.transportStatus),
                transportDestination: updated.transportDestination,
              }
            : null
        );
        const freshEvents = await farmerService.getBatchTimeline(lotCode);
        setLotTimelineEvents(freshEvents);
      }
      toast.success(`🚚 Tài xế đã quét mã QR tiếp nhận lô ${lotCode} lên xe lạnh thành công!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể tiếp nhận hàng");
    } finally {
      setIsUpdatingLotStatus(false);
    }
  };

  const handleWarehouseInbound = async (lotCode: string) => {
    setIsUpdatingLotStatus(true);
    try {
      const updated = await farmerService.warehouseInbound(lotCode);
      setBatches((prev) =>
        prev.map((b) =>
          b.code === updated.code
            ? {
                ...b,
                transportStatus: normalizeTransportStatus(updated.transportStatus),
                transportDestination: updated.transportDestination,
              }
            : b
        )
      );
      if (selectedLotForTimeline && selectedLotForTimeline.code === lotCode) {
        setSelectedLotForTimeline((prev) =>
          prev
            ? {
                ...prev,
                transportStatus: normalizeTransportStatus(updated.transportStatus),
                transportDestination: updated.transportDestination,
              }
            : null
        );
        const freshEvents = await farmerService.getBatchTimeline(lotCode);
        setLotTimelineEvents(freshEvents);
      }
      toast.success(`🏢 Thủ kho đã quét mã QR hoàn tất nhập kho đích cho lô ${lotCode}!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể nhập kho đích");
    } finally {
      setIsUpdatingLotStatus(false);
    }
  };

  const handleAddCustomTimelineEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLotForTimeline) return;
    if (!customEventStage.trim()) {
      toast.error("Vui lòng chọn hoặc nhập giai đoạn sự kiện");
      return;
    }
    setIsSubmittingCustomEvent(true);
    try {
      const newEv = await farmerService.addBatchTimelineEvent(selectedLotForTimeline.code, {
        stage: customEventStage.trim(),
        note: customEventNote.trim(),
        operator: customEventOperator.trim() || undefined,
        badge: "Ghi nhận",
      });

      setLotTimelineEvents((prev) => [...prev, newEv]);
      toast.success("Đã thêm sự kiện vào nhật ký vòng đời lô!");
      setCustomEventNote("");
      setCustomEventOperator("");
      setIsAddingCustomEvent(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể thêm sự kiện");
    } finally {
      setIsSubmittingCustomEvent(false);
    }
  };

  const openCreateLogModal = (farmCode?: string, batchCode?: string) => {
    const defaultFarm = visibleFarms[0]?.code || "NT-DL-01";
    const initialFarm =
      farmCode || (selectedLogFarm !== "ALL" && visibleFarms.some((f) => f.code === selectedLogFarm) ? selectedLogFarm : defaultFarm);
    setSelectedFarmForLog(initialFarm);
    if (batchCode) {
      setSelectedBatchForLog(batchCode);
    } else {
      const matchingBatches = visibleBatches.filter((b) => b.farmCode === initialFarm);
      setSelectedBatchForLog(matchingBatches[0]?.code || "");
    }
    setLogDate(getLocalIsoDate(0));
    setLogStage("Bón phân");
    setLogAction("");
    setLogMaterials("");
    setLogNotes("");
    setLogProofImage("");
    setLogProofFileName("");
    setIsLogModalOpen(true);
  };

  const handleLogImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tải lên tối đa 5MB!");
      return;
    }
    setLogProofFileName(file.name);
    setIsUploadingLogImage(true);
    try {
      const uploaded = await farmerService.uploadProofImage(file, {
        ownerId: activeOwnerId,
        category: "farming-log",
      });
      setLogProofImage(uploaded.url);
      toast.success(`Đã tải ảnh "${file.name}" lên Storage thành công!`);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setLogProofImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogImage(false);
    }
  };

  // Ghi nhật ký canh tác
  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchForLog) {
      toast.error("Nông trại này chưa có lô thu hoạch. Vui lòng tạo lô trước!");
      return;
    }
    if (!logAction.trim()) {
      toast.error("Vui lòng nhập nội dung công việc canh tác!");
      return;
    }

    const formattedDate = formatDisplayDate(logDate);
    const newLog: FarmingLogItem = {
      id: "l_" + Date.now(),
      farmCode: selectedFarmForLog,
      ownerId: activeOwnerId,
      batchCode: selectedBatchForLog,
      date: formattedDate,
      stage: logStage,
      action: logAction.trim(),
      materialsUsed: logMaterials.trim(),
      notes: logNotes.trim(),
      proofImage: logProofImage || undefined,
    };

    setIsSubmittingLog(true);
    let syncedToQr = false;
    try {
      const savedToDb = await farmerService.createLog({
        farmCode: selectedFarmForLog,
        batchCode: selectedBatchForLog,
        ownerId: activeOwnerId,
        date: formattedDate,
        stage: logStage,
        action: logAction.trim(),
        materialsUsed: logMaterials.trim(),
        notes: logNotes.trim(),
        proofImage: logProofImage || undefined,
      });
      if (savedToDb?.id) {
        newLog.id = String(savedToDb.id);
      }

      await farmerService.addBatchLog(selectedBatchForLog, {
        stage: logStage,
        time: formattedDate,
        materials: logMaterials.trim(),
        note: logNotes.trim() ? `${logAction.trim()} - ${logNotes.trim()}` : logAction.trim(),
        proofImage: logProofImage || undefined,
      });
      syncedToQr = true;
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) {
        console.warn("Đồng bộ nhật ký lên QR không thành công:", err);
      }
    } finally {
      setIsSubmittingLog(false);
    }

    setFarmingLogs([newLog, ...farmingLogs]);
    setIsLogModalOpen(false);
    setLogAction("");
    setLogMaterials("");
    setLogNotes("");
    setLogProofImage("");
    setLogProofFileName("");
    if (syncedToQr) {
      toast.success(`Đã ghi nhật ký & lưu ảnh vào Database cho lô ${selectedBatchForLog}!`);
    } else {
      toast.info(`Đã lưu nhật ký tại máy cho lô ${selectedBatchForLog}!`);
    }
  };

  const handleDeleteLog = async (id: string, actionName: string) => {
    if (confirm(`Bạn có chắc muốn xóa ghi chép "${actionName}"?`)) {
      if (!id.startsWith("l_")) {
        try {
          await farmerService.deleteLog(id);
        } catch (err) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 403) {
            toast.error(getApiErrorMessage(err, "Bạn không có quyền xóa nhật ký của chủ vườn khác!"));
            return;
          }
          console.warn("Lỗi xóa log trên server:", err);
        }
      }
      setFarmingLogs((prev) => prev.filter((item) => item.id !== id));
      toast.info("Đã xóa ghi chép nhật ký!");
    }
  };

  // Upload ảnh nông sản
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Vui lòng chọn ảnh dung lượng dưới 5MB!");
      return;
    }
    try {
      const uploadedUrl = await farmerService.uploadProductImage(file, activeOwnerId);
      setNewProdImage(uploadedUrl);
      toast.success("Đã tải ảnh nông sản lên Storage thành công!");
    } catch {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProdImage(reader.result as string);
        toast.success("Đã chọn ảnh nông sản thành công!");
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateProductModal = () => {
    const defaultFarm = visibleFarms[0]?.code || "NT-DL-01";
    const initialFarm =
      selectedProductFarm !== "ALL" && visibleFarms.some((f) => f.code === selectedProductFarm)
        ? selectedProductFarm
        : defaultFarm;
    setNewProdFarmCode(initialFarm);
    setNewProdName("");
    setNewProdCategory("trai_cay");
    setNewProdPrice("75000");
    setNewProdUnit("kg");
    setNewProdDesc("");
    setNewProdImage("");
    setIsProductModalOpen(true);
  };

  // Thêm Sản phẩm mới
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm!");
      return;
    }
    const priceNum = Number(newProdPrice);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error("Giá bán dự kiến phải lớn hơn 0 VNĐ!");
      return;
    }
    if (!newProdImage) {
      toast.error("Vui lòng tải lên ảnh sản phẩm!");
      return;
    }

    const targetFarm = visibleFarms.find((f) => f.code === newProdFarmCode) || visibleFarms[0] || currentFarm;
    const clientProdId = "p_" + Date.now();
    const newProd: ProductItem = {
      id: clientProdId,
      farmCode: targetFarm.code,
      ownerId: activeOwnerId,
      name: newProdName.trim(),
      category: newProdCategory,
      price: priceNum,
      unit: newProdUnit,
      description: newProdDesc.trim() || "Nông sản sạch canh tác theo quy chuẩn tự nhiên",
      origin: targetFarm.name,
      image: newProdImage,
    };

    setIsSubmittingProduct(true);
    try {
      const saved = await farmerService.createProduct({
        id: newProd.id,
        ownerId: activeOwnerId,
        farmCode: targetFarm.code,
        name: newProd.name,
        price: newProd.price,
        oldPrice: newProd.price,
        unit: newProd.unit,
        description: newProd.description,
        origin: newProd.origin,
        farm: `${targetFarm.name} (Mã: ${targetFarm.code})`,
        cert: normalizeBatchCert(targetFarm.certStandard),
        image: newProd.image,
        categoryCode: newProd.category,
      });

      const persistedProd: ProductItem = {
        ...newProd,
        id: saved.id || newProd.id,
        category: saved.categoryCode || newProd.category,
        image: saved.image || newProd.image,
      };
      setProducts([...products, persistedProd]);
      setIsProductModalOpen(false);
      setNewProdName("");
      setNewProdDesc("");
      setNewProdImage("");
      toast.success(`Đã thêm & lưu sản phẩm "${persistedProd.name}" cho ${targetFarm.name}!`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể lưu sản phẩm lên máy chủ!"));
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      await farmerService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.info(`Đã xóa sản phẩm "${name}" khỏi hệ thống!`);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.info(`Đã xóa sản phẩm "${name}"!`);
      } else {
        toast.error(getApiErrorMessage(err, `Không thể xóa sản phẩm "${name}"!`));
      }
    }
  };

  const openCreateCertModal = () => {
    const defaultFarm = visibleFarms[0]?.code || "NT-DL-01";
    const initialFarm =
      selectedCertFarm !== "ALL" && visibleFarms.some((f) => f.code === selectedCertFarm)
        ? selectedCertFarm
        : defaultFarm;
    setNewCertFarmCode(initialFarm);
    setNewCertName(activeOwnerId === "farmer_thieu" ? "Chứng nhận Hữu cơ Việt Nam (TCVN 11041)" : "Chứng nhận VietGAP Trồng trọt");
    setNewCertNumber("");
    setNewCertIssuedBy(activeOwnerId === "farmer_thieu" ? "Trung tâm Chứng nhận Phù hợp Quacert" : "Chi cục Quản lý Chất lượng Nông Lâm Sản");
    setNewCertIssueDate(getLocalIsoDate(0));
    setNewCertExpiryDate(getLocalIsoDate(365));
    setIsCertModalOpen(true);
  };

  const handleCreateCert = (e: React.FormEvent) => {
    e.preventDefault();
    const certNumUpper = newCertNumber.trim().toUpperCase();
    if (!newCertName.trim() || !certNumUpper || !newCertIssuedBy.trim()) {
      toast.error("Vui lòng nhập đầy đủ tên, số hiệu và đơn vị cấp chứng nhận!");
      return;
    }
    if (certifications.some((c) => c.certNumber.toUpperCase() === certNumUpper)) {
      toast.error(`Số hiệu chứng nhận ${certNumUpper} đã tồn tại!`);
      return;
    }
    if (!newCertIssueDate || !newCertExpiryDate || newCertExpiryDate <= newCertIssueDate) {
      toast.error("Ngày hết hạn phải sau ngày cấp!");
      return;
    }

    const baseCert: CertificationItem = {
      id: "c_" + Date.now(),
      farmCode: newCertFarmCode,
      ownerId: activeOwnerId,
      name: newCertName.trim(),
      certNumber: certNumUpper,
      issuedBy: newCertIssuedBy.trim(),
      issueDate: formatDisplayDate(newCertIssueDate),
      expiryDate: formatDisplayDate(newCertExpiryDate),
      status: "VALID",
      daysLeft: 365,
    };
    const evaluated = evaluateCertification(baseCert, clientNowMs ?? Date.now());
    setCertifications([evaluated, ...certifications]);
    farmerService
      .saveCertificate({
        certNumber: certNumUpper,
        name: newCertName.trim(),
        farmCode: newCertFarmCode,
        ownerId: activeOwnerId,
        farmName: visibleFarms.find((f) => f.code === newCertFarmCode)?.name || newCertFarmCode,
        issuedBy: newCertIssuedBy.trim(),
        issueDate: formatDisplayDate(newCertIssueDate),
        expiryDate: formatDisplayDate(newCertExpiryDate),
        status: evaluated.status,
        alertEmail: activeAlertEmail,
      })
      .catch((err) => console.warn("Không thể đồng bộ chứng nhận lên Server:", err));
    setIsCertModalOpen(false);
    toast.success(`Đã thêm chứng nhận "${evaluated.name}"!`);
  };

  const calculateRenewExpiry = (startDateStr: string, durationYears: string) => {
    const sDate = parseVnOrIsoDate(startDateStr);
    if (!sDate) return renewRequestedExpiryDate;
    const dur = parseFloat(durationYears) || 1;
    const end = new Date(sDate);
    if (dur === 0.5) {
      end.setMonth(end.getMonth() + 6);
    } else {
      end.setFullYear(end.getFullYear() + Math.round(dur));
    }
    end.setDate(end.getDate() - 1);
    return `${String(end.getDate()).padStart(2, "0")}/${String(end.getMonth() + 1).padStart(2, "0")}/${end.getFullYear()}`;
  };

  const handleOpenRenewModal = (cert: CertificationItem) => {
    setRenewingCert(cert);
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentExpiry = parseVnOrIsoDate(cert.expiryDate) || todayMidnight;

    // Ngày bắt đầu hiệu lực mới (dự kiến): ngày tiếp theo của ngày hết hạn hiện tại
    const nextStart = new Date(currentExpiry);
    nextStart.setDate(nextStart.getDate() + 1);
    const startIso = `${nextStart.getFullYear()}-${String(nextStart.getMonth() + 1).padStart(2, "0")}-${String(nextStart.getDate()).padStart(2, "0")}`;
    setRenewStartDate(startIso);

    // Ngày hết hạn mới (dự kiến): +1 năm so với hạn cũ
    const newEnd = new Date(currentExpiry);
    newEnd.setFullYear(newEnd.getFullYear() + 1);
    const newEndVn = `${String(newEnd.getDate()).padStart(2, "0")}/${String(newEnd.getMonth() + 1).padStart(2, "0")}/${newEnd.getFullYear()}`;

    setRenewDuration("1");
    setRenewRequestedExpiryDate(cert.pendingRenewal?.requestedExpiryDate || newEndVn);
    setRenewNewCertNumber(cert.pendingRenewal?.newCertNumber || "");
    setRenewIssuedBy(cert.issuedBy || "Tổ chức Chứng nhận Quốc tế Control Union");
    setRenewNote(cert.pendingRenewal?.note || "");
    setRenewProofImage(cert.pendingRenewal?.proofImage || "");
    setRenewProofFileName(cert.pendingRenewal?.proofImage ? "Tài liệu xác minh đã tải" : "");
    setIsRenewModalOpen(true);
  };

  const handleRenewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh tải lên tối đa 5MB!");
      return;
    }
    setRenewProofFileName(file.name);
    setIsUploadingRenewImage(true);
    try {
      const uploaded = await farmerService.uploadProofImage(file, {
        ownerId: activeOwnerId,
        category: "certificate-renewal",
      });
      setRenewProofImage(uploaded.url);
      toast.success(`Đã tải chứng từ "${file.name}" lên Storage thành công!`);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === "string") {
          setRenewProofImage(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingRenewImage(false);
    }
  };

  const handleSubmitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingCert) return;

    const finalCertNumber = renewNewCertNumber.trim()
      ? renewNewCertNumber.trim().toUpperCase()
      : renewingCert.certNumber;

    setIsSubmittingRenewal(true);
    try {
      await farmerService.renewCertificate({
        certNumber: renewingCert.certNumber,
        newCertNumber: finalCertNumber,
        requestedExpiryDate: renewRequestedExpiryDate,
        proofImage: renewProofImage || undefined,
        note: renewNote.trim(),
      });

      const updated = certifications.map((c) => {
        if (c.id === renewingCert.id) {
          return {
            ...c,
            approvalStatus: "PENDING" as const,
            pendingRenewal: {
              newCertNumber: finalCertNumber,
              proofImage: renewProofImage,
              requestedExpiryDate: renewRequestedExpiryDate,
              submittedAt: new Date().toLocaleDateString("vi-VN"),
              note: renewNote.trim(),
            },
          };
        }
        return c;
      });

      setCertifications(updated);
      try {
        localStorage.setItem(STORAGE_KEYS.certs, JSON.stringify(updated));
      } catch {
        // Ignore quota errors
      }

      toast.success(
        `Đã nộp yêu cầu gia hạn cho "${renewingCert.name}" lên Quản trị viên (Admin) thẩm định thành công!`
      );
      setIsRenewModalOpen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể gửi yêu cầu gia hạn chứng nhận!"));
    } finally {
      setIsSubmittingRenewal(false);
    }
  };

  const handleDeleteCert = async (certIdentifier: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa chứng nhận "${name}" khỏi hệ thống?`)) {
      try {
        await farmerService.deleteCertificate(certIdentifier);
        setCertifications((prev) =>
          prev.filter((c) => c.certNumber !== certIdentifier && c.id !== certIdentifier)
        );
        toast.success(`Đã xóa vĩnh viễn chứng nhận "${name}" thành công!`);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          toast.error(getApiErrorMessage(err, "Bạn không có quyền xóa chứng nhận này!"));
          return;
        }
        console.warn("Lỗi xóa chứng nhận phía server:", err);
        setCertifications((prev) =>
          prev.filter((c) => c.certNumber !== certIdentifier && c.id !== certIdentifier)
        );
        toast.info(`Đã gỡ chứng nhận "${name}"!`);
      }
    }
  };

  // 🛡️ PHÂN QUYỀN DỮ LIỆU THEO TÀI KHOẢN ĐĂNG NHẬP (DATA OWNERSHIP / ISOLATION)
  const matchedProfile = FARMER_PROFILES.find((p) => p.ownerId === activeOwnerId);
  const currentProfile: FarmerProfile = matchedProfile || {
    ownerId: activeOwnerId,
    name: authUser?.name || "Chủ Trang Trại",
    email: authUser?.email || "",
    phone: authUser?.phone || "",
    farmCodes: farms.map((f) => f.code),
    avatarText: (authUser?.name || "N").slice(0, 2).toUpperCase(),
    title: "Chủ Trang Trại AgriTrace",
  };

  useEffect(() => {
    const ownerFarms = farms.filter((f) => (f.ownerId || activeOwnerId) === activeOwnerId);
    if (ownerFarms.length > 0 && !ownerFarms.some((f) => f.id === selectedFarmId)) {
      setSelectedFarmId(ownerFarms[0].id);
      setFormFarmCode(ownerFarms[0].code);
    }
  }, [activeOwnerId, farms, selectedFarmId]);

  // DỮ LIỆU ĐƯỢC CÔ LẬP THEO CHỦ VƯỜN HIỆN TẠI (STRICT DATA OWNERSHIP ISOLATION)
  const visibleFarms = farms.filter((f) => (f.ownerId || activeOwnerId) === activeOwnerId);

  const visibleBatches = batches.filter((b) => {
    const oId = b.ownerId || (b.farmCode === "NT-MC-03" ? "farmer_thieu" : "farmer_hung");
    return oId === activeOwnerId;
  });

  const visibleLogs = farmingLogs.filter((l) => {
    const oId = l.ownerId || (l.farmCode === "NT-MC-03" ? "farmer_thieu" : "farmer_hung");
    return oId === activeOwnerId;
  });

  const visibleProducts = products.filter((p) => {
    const oId = p.ownerId || (p.farmCode === "NT-MC-03" ? "farmer_thieu" : "farmer_hung");
    return oId === activeOwnerId;
  });

  const computedCerts = certifications.map((c) => evaluateCertification(c, clientNowMs));
  const visibleCerts = computedCerts.filter((c) => {
    const oId = c.ownerId || (c.farmCode === "NT-MC-03" ? "farmer_thieu" : "farmer_hung");
    return oId === activeOwnerId;
  });

  const filteredBatches = visibleBatches.filter((b) => {
    const matchStatus = activeFilter === "Tất cả" || b.status === activeFilter;
    const matchFarm = selectedBatchFarm === "ALL" || b.farmCode === selectedBatchFarm;
    const effectiveTransport = normalizeTransportStatus(b.transportStatus);
    const matchTransport =
      selectedTransportFilter === "Tất cả" || effectiveTransport === selectedTransportFilter;
    return matchStatus && matchFarm && matchTransport;
  });

  const harvestStats = computeHarvestStats(visibleBatches);

  // Tự động kiểm tra và gửi email cảnh báo khi có chứng nhận còn <= 5 ngày
  useEffect(() => {
    if (!storageLoaded || visibleCerts.length === 0) return;

    const criticalCerts = visibleCerts.filter(
      (c) => c.daysLeft <= 5 && c.daysLeft >= 0
    );
    if (criticalCerts.length === 0) return;

    const sentRecords = readStoredJson<Record<string, string>>(STORAGE_KEYS.certEmailSent) || {};
    const todayStr = getLocalIsoDate(0);
    let hasNotified = false;

    criticalCerts.forEach(async (cert) => {
      const sentKey = `${cert.certNumber}_${cert.daysLeft}_${todayStr}`;
      if (sentRecords[sentKey]) return;

      // Đánh dấu ngay trước khi gửi async để tránh duplicate request/toast khi state re-render
      sentRecords[sentKey] = "pending";
      try {
        localStorage.setItem(STORAGE_KEYS.certEmailSent, JSON.stringify(sentRecords));
      } catch {
        // Ignore storage errors
      }

      const farm = visibleFarms.find((f) => f.code === cert.farmCode);
      try {
        await farmerService.notifyCertExpiry({
          certName: cert.name,
          certNumber: cert.certNumber,
          farmName: farm ? `${farm.name} (${farm.code})` : cert.farmCode,
          daysLeft: cert.daysLeft,
          expiryDate: cert.expiryDate,
          toEmail: activeAlertEmail,
        });
        sentRecords[sentKey] = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.certEmailSent, JSON.stringify(sentRecords));
        if (!hasNotified) {
          hasNotified = true;
          toast.info(
            `Hệ thống đã gửi email cảnh báo: Chứng nhận "${cert.name}" còn ${cert.daysLeft} ngày hết hạn!`
          );
        }
      } catch (err) {
        delete sentRecords[sentKey];
        try {
          localStorage.setItem(STORAGE_KEYS.certEmailSent, JSON.stringify(sentRecords));
        } catch {
          // Ignore storage errors
        }
        console.warn("Lỗi tự động gửi email cảnh báo:", err);
      }
    });
  }, [visibleCerts, storageLoaded, activeAlertEmail, visibleFarms]);


  const displayedProducts = visibleProducts.filter((p) => {
    if (selectedProductFarm === "ALL") return true;
    return p.farmCode === selectedProductFarm;
  });

  const displayedLogs = visibleLogs.filter((l) => {
    if (selectedLogFarm === "ALL") return true;
    const fCode = l.farmCode || batches.find((b) => b.code === l.batchCode)?.farmCode;
    return fCode === selectedLogFarm;
  });

  const displayedCerts = visibleCerts.filter((c) => {
    if (selectedCertFarm === "ALL") return true;
    return c.farmCode === selectedCertFarm;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-emerald-950 text-white p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm border border-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white shadow-inner">
            <Leaf size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">Cổng Nông Dân & Quản Lý Sản Xuất (Farmer Portal)</h1>
              <span className="text-xs bg-emerald-500/30 text-emerald-300 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <Sparkles size={11} /> Nguồn dữ liệu gốc AgriTrace AI
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Quản lý nông trại canh tác, sản phẩm, nhật ký chăm sóc cây, lô thu hoạch và chứng nhận chất lượng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab("messages");
              router.push("/dashboard/farmer?tab=messages");
            }}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all transform active:scale-95 cursor-pointer ${
              activeTab === "messages"
                ? "bg-amber-400 text-stone-950 ring-2 ring-amber-300 font-extrabold"
                : "bg-amber-500 hover:bg-amber-400 text-stone-950"
            }`}
          >
            <MessageSquare size={15} />
            <span>Hộp Thư & Khiếu Nại</span>
          </button>
          <button
            onClick={openAddFarmModal}
            className="px-3.5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-emerald-700/60 transition-all cursor-pointer"
          >
            <Plus size={15} /> Thêm Nông Trại
          </button>
          <button
            onClick={() => openCreateBatchModal()}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Tạo Lô Thu Hoạch
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs (5 Khối nghiệp vụ chuẩn bài nói, QUẢN LÝ NÔNG TRẠI đứng đầu tiên) */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-xs font-bold">
        <button
          onClick={() => {
            setActiveTab("farms");
            router.push("/dashboard/farmer");
          }}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "farms"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Home size={16} /> Quản Lý Nông Trại
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">
            {visibleFarms.length} Trang trại
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab("messages");
            router.push("/dashboard/farmer?tab=messages");
          }}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "messages"
              ? "border-amber-600 text-amber-950 font-extrabold bg-amber-50/60"
              : "border-transparent text-amber-800 hover:text-amber-950 hover:bg-amber-50/40"
          }`}
        >
          <MessageSquare size={16} className="text-amber-600" />
          <span>Hộp Thư & Khiếu Nại</span>
        </button>

        <button
          onClick={() => setActiveTab("batches")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "batches"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Package size={16} /> Quản Lý Lô Thu Hoạch
          <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-full">
            {visibleBatches.length} Lô
          </span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "logs"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileText size={16} /> Sổ Nhật Ký Canh Tác
          <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-full">
            {visibleLogs.length} Ghi chép
          </span>
        </button>

        <button
          onClick={() => setActiveTab("products")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "products"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Sprout size={16} /> Quản Lý Sản Phẩm (Xoài, Sầu riêng...)
          <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-full">
            {visibleProducts.length} Loại
          </span>
        </button>

        <button
          onClick={() => setActiveTab("certs")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "certs"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Award size={16} /> Chứng Nhận & Cảnh Báo
          <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-full mr-1">
            {visibleCerts.length}
          </span>
          {visibleCerts.some((c) => c.status === "EXPIRED") ? (
            <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              ⛔ Có chứng chỉ hết hạn
            </span>
          ) : visibleCerts.some((c) => c.status === "EXPIRING_SOON") ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              ⚠️ Sắp hết hạn
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "reviews"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Star size={16} className={activeTab === "reviews" ? "fill-amber-400 text-amber-500" : "text-gray-400"} />
          <span>Đánh Giá Khách Hàng ({farmerReviews.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("seasons")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "seasons"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <CalendarRange size={16} /> Mùa Vụ Canh Tác
          <span className="bg-sky-100 text-sky-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            4 Trạng thái
          </span>
        </button>

        <button
          onClick={() => setActiveTab("forecast")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "forecast"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <TrendingUp size={16} /> AI Dự Báo Nhu Cầu
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
            7-30 Ngày
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: QUẢN LÝ NÔNG TRẠI (Theo đúng bài nói: tên, địa chỉ, diện tích, liên hệ) */}
      {/* ========================================================================= */}
      {activeTab === "farms" && (
        <div className="space-y-5">
          {/* Header Action Bar */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Home size={18} className="text-emerald-700" /> Danh Sách Các Nông Trại Canh Tác Thuộc Quyền Sở Hữu
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý quy mô diện tích, địa chỉ vườn, thông tin liên lạc và tiêu chuẩn an toàn của từng trang trại
              </p>
            </div>
            <button
              onClick={openAddFarmModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Thêm Nông Trại Mới
            </button>
          </div>

          {/* Grid Cards Nông Trại */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleFarms.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400">
                <Home size={36} className="mx-auto mb-2 opacity-40 text-emerald-600" />
                <p className="text-sm font-semibold">Chủ vườn hiện tại chưa có nông trại nào trong danh sách.</p>
                <button
                  type="button"
                  onClick={openAddFarmModal}
                  className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={14} /> Thêm Trang Trại Đầu Tiên
                </button>
              </div>
            ) : (
              visibleFarms.map((farm) => {
                const isSelected = farm.id === selectedFarmId;
                return (
                  <div
                    key={farm.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                      isSelected ? "border-emerald-600 ring-2 ring-emerald-500/20" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Mã: {farm.code}
                        </span>
                        {(() => {
                          const vStatus = (farm.verificationStatus || "APPROVED").toUpperCase();
                          if (vStatus === "NOT_SUBMITTED") {
                            return (
                              <span className="text-slate-700 bg-slate-100 border border-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <FileText size={11} /> Chưa nộp hồ sơ đất
                              </span>
                            );
                          }
                          if (vStatus === "PENDING" || vStatus === "UNDER_REVIEW") {
                            return (
                              <span className="text-amber-800 bg-amber-100 border border-amber-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Clock size={11} /> Chờ Admin duyệt hồ sơ đất
                              </span>
                            );
                          }
                          if (vStatus === "REJECTED") {
                            return (
                              <span className="text-rose-700 bg-rose-100 border border-rose-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle size={11} /> Từ chối hồ sơ đất
                              </span>
                            );
                          }
                          if (vStatus === "CHANGES_REQUESTED" || vStatus === "SUSPENDED") {
                            return (
                              <span className="text-orange-800 bg-orange-100 border border-orange-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <AlertTriangle size={11} /> Cần bổ sung hồ sơ đất
                              </span>
                            );
                          }
                          return (
                            <span className="text-emerald-700 bg-emerald-100 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={11} /> Đã xác minh
                            </span>
                          );
                        })()}
                      </div>

                      <div>
                        <h4 className="text-base font-extrabold text-gray-900">{farm.name}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                          <MapPin size={13} className="text-emerald-600 shrink-0" />
                          <span>{farm.address}, {farm.province}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-xs">
                        <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">Diện tích</span>
                          <span className="font-extrabold text-emerald-800 text-sm">{farm.areaHectares} ha</span>
                        </div>
                        <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">Tiêu chuẩn</span>
                          <span className="font-bold text-gray-800 text-[11px] truncate block">{farm.certStandard}</span>
                        </div>
                        <div className="bg-gray-50 p-2.5 rounded-xl text-center">
                          <span className="text-[10px] text-gray-400 block font-semibold uppercase">Đợt thu hoạch</span>
                          <span className="font-extrabold text-blue-700 text-sm">
                            {visibleBatches.filter((b) => b.farmCode === farm.code).length} Lô
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 space-y-1 pt-1">
                        <div className="flex items-center gap-2">
                          <User size={13} className="text-gray-400" />
                          <span>Chủ trang trại: <strong>{farm.owner}</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-gray-400" />
                          <span>Số điện thoại: <strong>{farm.phone}</strong></span>
                        </div>
                      </div>
                    </div>

                    {farm.verificationStatus === "NOT_SUBMITTED" && !farm.verificationDocUrl && (
                      <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-900">
                        Nông trại mới chưa có giấy tờ đất canh tác. Hãy bấm <strong>Đính kèm hồ sơ đất</strong> để gửi Admin duyệt.
                      </div>
                    )}

                    {(farm.verificationDocUrl || farm.verificationDecisionReason) && (
                      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] space-y-1">
                        {farm.verificationDocType && (
                          <div className="font-semibold text-gray-700">
                            Giấy tờ đất: <span className="text-gray-900">{farm.verificationDocType}</span>
                          </div>
                        )}
                        {farm.verificationDecisionReason && (
                          <div className={farm.verificationStatus === "APPROVED" ? "text-emerald-700 font-medium" : "text-rose-700 font-medium"}>
                            Phản hồi Admin: {farm.verificationDecisionReason}
                          </div>
                        )}
                        {(() => {
                          const farmDocs = parseFarmDocUrls(farm.verificationDocUrl);
                          return (
                            farmDocs.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-0.5">
                                {farmDocs.map((docUrl, idx) => (
                                  <a
                                    key={`${docUrl}-${idx}`}
                                    href={docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline bg-white px-2 py-0.5 rounded-lg border border-emerald-200"
                                  >
                                    <FileCheck size={12} /> Hồ sơ #{idx + 1}
                                  </a>
                                ))}
                              </div>
                            )
                          );
                        })()}
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-100 mt-4 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setEditingFarm({ ...farm })}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit3 size={13} /> Sửa thông tin
                        </button>
                        {(farm.verificationStatus === "NOT_SUBMITTED" ||
                          farm.verificationStatus === "REJECTED" ||
                          farm.verificationStatus === "CHANGES_REQUESTED" ||
                          farm.verificationStatus === "SUSPENDED") && (
                          <button
                            type="button"
                            onClick={() => openResubmitVerificationModal(farm)}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                          >
                            <Upload size={13} />{" "}
                            {farm.verificationStatus === "NOT_SUBMITTED" ? "Đính kèm hồ sơ đất" : "Bổ sung / Gửi lại hồ sơ đất"}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteFarm(farm.id, farm.name)}
                        className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                        title="Xóa nông trại"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUẢN LÝ LÔ THU HOẠCH & VẬN CHUYỂN */}
      {/* ========================================================================= */}
      {activeTab === "batches" && (
        <div className="space-y-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-gray-500 font-semibold uppercase">Tổng sản lượng quản lý</div>
              <div className="text-xl font-extrabold text-gray-900 mt-1">{harvestStats.totalKgLabel}</div>
              <div className="text-[11px] text-emerald-600 mt-0.5 truncate" title={harvestStats.productSummary}>
                {harvestStats.productSummary}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-gray-500 font-semibold uppercase">Đã duyệt xuất kho</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">
                {visibleBatches.filter((b) => b.status === "Đã duyệt xuất kho").length} Lô
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Sẵn sàng xuất bán / nhập kho</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-blue-700 font-semibold uppercase">Đang vận chuyển</div>
              <div className="text-xl font-extrabold text-blue-600 mt-1">
                {visibleBatches.filter((b) => normalizeTransportStatus(b.transportStatus) === "Đang vận chuyển").length} Lô
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Đang trên đường đến kho đích</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-amber-700 font-semibold uppercase">Lưu tại kho vườn</div>
              <div className="text-xl font-extrabold text-amber-600 mt-1">
                {visibleBatches.filter((b) => normalizeTransportStatus(b.transportStatus) === "Chưa vận chuyển").length} Lô
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Chưa vận chuyển đi</div>
            </div>
          </div>

          {/* Bộ lọc Chọn Nông Trại (Nơi trồng) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-500 font-semibold shrink-0 mr-1 flex items-center gap-1">
              <Home size={13} className="text-emerald-700" /> Nơi trồng (Nông trại):
            </span>
            <button
              type="button"
              onClick={() => setSelectedBatchFarm("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedBatchFarm === "ALL"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>Tất cả nông trại</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedBatchFarm === "ALL" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {visibleBatches.length} Lô
              </span>
            </button>

            {visibleFarms.map((farm) => {
              const active = selectedBatchFarm === farm.code;
              const count = visibleBatches.filter((b) => b.farmCode === farm.code).length;

              return (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => setSelectedBatchFarm(farm.code)}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Home size={12} className={active ? "text-white" : "text-emerald-600"} />
                  <span>{farm.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800 font-bold"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Batches Table Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <Package size={18} className="text-[#1a7a3a]" />
                <h3 className="font-bold text-sm text-gray-900">Danh Sách Lô Thu Hoạch & Vận Chuyển</h3>
                {sseConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đồng Bộ Trực Tiếp (Live Sync)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <RefreshCw size={10} className="animate-spin text-amber-600" />
                    Đang kết nối...
                  </span>
                )}
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Lọc trạng thái kiểm duyệt */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs flex-wrap">
                  {["Tất cả", "Chờ duyệt xuất kho", "Đã duyệt xuất kho", "Đang lưu kho lạnh", "Đang chăm sóc"].map((st) => {
                    const sel = activeFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setActiveFilter(st)}
                        className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] cursor-pointer transition-all ${
                          sel ? "bg-emerald-700 text-white" : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {st === "Tất cả" ? "Tất cả trạng thái" : st}
                      </button>
                    );
                  })}
                </div>

                {/* Lọc tình trạng vận chuyển */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 text-xs flex-wrap">
                  <Truck size={13} className="text-gray-400 ml-1 mr-0.5" />
                  {["Tất cả", "Chưa vận chuyển", "Đang vận chuyển", "Đã nhập kho đích"].map((v) => {
                    const sel = selectedTransportFilter === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSelectedTransportFilter(v)}
                        className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] cursor-pointer transition-all ${
                          sel ? "bg-emerald-700 text-white" : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {v === "Tất cả" ? "Tất cả vận chuyển" : v}
                      </button>
                    );
                  })}
                </div>

                {/* Nút Khai báo lô mới */}
                <button
                  onClick={() => openCreateBatchModal()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer ml-auto"
                >
                  <Plus size={14} /> Khai Báo Lô Mới
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] font-bold tracking-wider bg-gray-50/70">
                    <th className="py-3 px-3">Mã Lô & Nông Sản</th>
                    <th className="py-3 px-3">Nơi Trồng (Nông Trại)</th>
                    <th className="py-3 px-3">Ngày Hái & HSD</th>
                    <th className="py-3 px-3">Sản Lượng</th>
                    <th className="py-3 px-3">Chứng Nhận</th>
                    <th className="py-3 px-3">Hành Trình Vận Chuyển</th>
                    <th className="py-3 px-3">Kiểm Duyệt</th>
                    <th className="py-3 px-3 text-right">QR & Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                        Không tìm thấy lô thu hoạch nào phù hợp với bộ lọc nông trại & vận chuyển.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((b) => {
                      const bFarm = farms.find((f) => f.code === b.farmCode);

                      return (
                        <tr key={b.code} className="hover:bg-gray-50/80 transition-colors">
                          {/* Mã Lô & Nông Sản */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-[#1a7a3a] block">{b.code}</span>
                            <span className="font-bold text-gray-900 text-xs">{b.product}</span>
                            <div className="text-[10px] text-gray-400">{b.cultivation}</div>
                          </td>

                          {/* Nơi Trồng (Nông Trại & Địa chỉ) */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1 text-[11px]">
                              <Home size={11} className="text-emerald-700" />
                              {bFarm ? bFarm.name : b.farmCode}
                            </span>
                            <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin size={10} className="text-gray-400" />
                              {bFarm ? bFarm.address : "Khu vực canh tác"}
                            </div>
                          </td>

                          {/* Ngày Hái & HSD */}
                          <td className="py-3 px-3">
                            <div className="text-gray-800 font-medium">Hái: {b.harvestDate}</div>
                            <div className="text-rose-600 font-semibold text-[11px]">HSD: {b.expiryDate}</div>
                          </td>

                          {/* Sản Lượng */}
                          <td className="py-3 px-3 font-bold text-gray-800">
                            {b.qty} {b.unit}
                          </td>

                          {/* Tiêu Chuẩn */}
                          <td className="py-3 px-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                              {b.cert}
                            </span>
                          </td>

                          {/* Tình Trạng Vận Chuyển */}
                          <td className="py-3 px-3">
                            {(() => {
                              const normalizedTransport = normalizeTransportStatus(b.transportStatus);
                              if (normalizedTransport === "Đang vận chuyển") {
                                return (
                                  <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 whitespace-nowrap">
                                    <Truck size={11} className="text-blue-600 animate-pulse" /> Đang vận chuyển
                                  </span>
                                );
                              }
                              if (normalizedTransport === "Đã nhập kho đích") {
                                return (
                                  <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 whitespace-nowrap">
                                    <CheckCircle2 size={11} className="text-emerald-600" /> Đã nhập kho đích
                                  </span>
                                );
                              }
                              return (
                                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 whitespace-nowrap">
                                  <Clock size={11} className="text-amber-600" /> Chưa vận chuyển
                                </span>
                              );
                            })()}
                            <div className="text-[10px] text-gray-500 font-medium mt-1 truncate max-w-[150px]" title={b.transportDestination}>
                              Đến: {b.transportDestination || "Kho phân phối"}
                            </div>
                          </td>

                          {/* Trạng Thái Kiểm Duyệt */}
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleOpenLotTimeline(b)}
                              className="text-left font-bold flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                              title="Bấm để xem chi tiết trạng thái kiểm duyệt của Admin"
                            >
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.statusColor }} />
                              <span style={{ color: b.statusColor }}>{b.status}</span>
                            </button>
                          </td>

                          {/* Mã QR & Thao Tác */}
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenPrintLabel(b)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="In tem nhãn mã QR chuẩn GS1 dán thùng hàng / bao bì"
                              >
                                <Printer size={12} /> In tem
                              </button>
                              <button
                                onClick={() => handleOpenLotTimeline(b)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#1a7a3a] border border-emerald-200 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                                title="Xem nhật ký vòng đời từ thu hoạch, duyệt xuất kho và vận chuyển"
                              >
                                <Clock size={12} /> Nhật ký
                              </button>
                              <Link
                                href={`/traceability?batch=${b.code}`}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1a7a3a] bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100"
                                title="Tra cứu trang QR công khai"
                              >
                                <QrCode size={13} /> QR
                              </Link>
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa lô ${b.code}?`)) {
                                    handleDeleteBatch(b.code);
                                  }
                                }}
                                className="text-gray-400 hover:text-rose-600 p-1 rounded-md cursor-pointer"
                                title="Xóa lô thu hoạch"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SỔ NHẬT KÝ CANH TÁC */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-700" /> Sổ Nhật Ký Canh Tác Điện Tử
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Theo dõi toàn bộ quá trình gieo hạt, bón phân, tưới nước và chăm sóc cây trồng theo từng nông trại làm bằng chứng truy xuất nguồn gốc
              </p>
            </div>
            <button
              onClick={() => openCreateLogModal()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Thêm Ghi Chép Mới
            </button>
          </div>

          {/* Bộ lọc Chọn Nông Trại để xem Sổ nhật ký */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-500 font-semibold shrink-0 mr-1 flex items-center gap-1">
              <Home size={13} className="text-emerald-700" /> Chọn Nông Trại:
            </span>
            <button
              type="button"
              onClick={() => setSelectedLogFarm("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedLogFarm === "ALL"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>Tất cả nông trại</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedLogFarm === "ALL" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {visibleLogs.length}
              </span>
            </button>

            {visibleFarms.map((farm) => {
              const active = selectedLogFarm === farm.code;
              const count = visibleLogs.filter((l) => {
                const fCode = l.farmCode || visibleBatches.find((b) => b.code === l.batchCode)?.farmCode;
                return fCode === farm.code;
              }).length;

              return (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => setSelectedLogFarm(farm.code)}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Home size={12} className={active ? "text-white" : "text-emerald-600"} />
                  <span>{farm.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800 font-bold"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Danh sách Thẻ Ghi Chép Nhật Ký */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            {displayedLogs.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs">
                Chưa có ghi chép nhật ký nào cho nông trại này. Hãy bấm <strong>&quot;Thêm Ghi Chép Mới&quot;</strong> để ghi nhận!
              </div>
            ) : (
              displayedLogs.map((log) => {
                const logFarmCode = log.farmCode || batches.find((b) => b.code === log.batchCode)?.farmCode;
                const logFarm = farms.find((f) => f.code === logFarmCode);
                const logBatch = batches.find((b) => b.code === log.batchCode);

                return (
                  <div
                    key={log.id}
                    className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all bg-white"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                      {log.stage === "Gieo hạt" && "🌱"}
                      {log.stage === "Bón phân" && "🍂"}
                      {log.stage === "Tưới tiêu" && "💧"}
                      {log.stage === "Phun sinh học" && "🛡️"}
                      {log.stage === "Thu hoạch" && "🧺"}
                    </div>

                    <div className="flex-1 text-xs w-full">
                      {/* Tiêu đề & Badges xác định rõ Nông trại + Lô + Giai đoạn + Ngày */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-gray-100">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Nông Trại sở hữu */}
                          <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Home size={11} className="text-emerald-700" />
                            {logFarm ? logFarm.name : `Nông trại: ${logFarmCode || "Chung"}`}
                          </span>

                          {/* Lô Thu Hoạch & Tên Nông Sản */}
                          <span className="font-mono font-bold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Package size={11} className="text-gray-500" />
                            Lô {log.batchCode} {logBatch ? `(${logBatch.product})` : ""}
                          </span>

                          {/* Giai đoạn */}
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                            {log.stage}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 flex items-center gap-1 text-[11px] font-medium">
                            <Clock size={12} /> {log.date}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id, log.action)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                            title="Xóa ghi chép"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Tên hành động canh tác */}
                      <div className="mt-2.5">
                        <h4 className="font-bold text-gray-900 text-sm">{log.action}</h4>
                      </div>

                      {/* Chi tiết Vật tư & Ghi chú */}
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {log.materialsUsed && (
                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <span className="text-gray-400 block font-semibold text-[10px] uppercase">
                              Vật tư / Chế phẩm sử dụng:
                            </span>
                            <span className="text-gray-700 font-medium">{log.materialsUsed}</span>
                          </div>
                        )}
                        {log.notes && (
                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                            <span className="text-gray-400 block font-semibold text-[10px] uppercase">
                              Ghi chú canh tác:
                            </span>
                            <span className="text-gray-600 italic">{log.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Ảnh minh chứng thực tế */}
                      {log.proofImage && (
                        <div className="mt-2.5 flex items-center gap-3 bg-emerald-50/60 border border-emerald-200/80 p-2 rounded-xl">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-emerald-200 shrink-0 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={log.proofImage}
                              alt="Ảnh minh chứng canh tác"
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => window.open(log.proofImage, "_blank")}
                              title="Bấm để xem ảnh kích thước lớn"
                            />
                          </div>
                          <div className="text-xs">
                            <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                              📸 Ảnh minh chứng thực tế tại vườn
                            </span>
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              Đã lưu ảnh bằng chứng canh tác chuẩn VietGAP. Bấm vào ảnh để mở ảnh gốc.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: QUẢN LÝ SẢN PHẨM (PHÂN THEO NÔNG TRẠI CANH TÁC) */}
      {/* ========================================================================= */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Sprout size={18} className="text-emerald-700" /> Danh Mục Nông Sản & Nơi Gieo Trồng
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Phân loại nông sản theo từng nông trại canh tác, xác định rõ loại cây đang trồng hoặc đã thu hoạch
              </p>
            </div>
            <button
              onClick={openCreateProductModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Thêm Sản Phẩm Mới
            </button>
          </div>

          {/* Bộ lọc Chọn Nông Trại để xem Sản Phẩm */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-500 font-semibold shrink-0 mr-1 flex items-center gap-1">
              <Home size={13} className="text-emerald-700" /> Nơi trồng (Nông trại):
            </span>
            <button
              type="button"
              onClick={() => setSelectedProductFarm("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedProductFarm === "ALL"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>Tất cả nông trại</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedProductFarm === "ALL" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {visibleProducts.length} Loại
              </span>
            </button>

            {visibleFarms.map((farm) => {
              const active = selectedProductFarm === farm.code;
              const count = visibleProducts.filter((p) => p.farmCode === farm.code).length;

              return (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => setSelectedProductFarm(farm.code)}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Home size={12} className={active ? "text-white" : "text-emerald-600"} />
                  <span>{farm.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800 font-bold"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid Danh Sách Sản Phẩm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayedProducts.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
                Chưa có sản phẩm nông nghiệp nào thuộc nông trại này. Hãy bấm <strong>&quot;Thêm Sản Phẩm Mới&quot;</strong>!
              </div>
            ) : (
              displayedProducts.map((p) => {
                const prodFarm = farms.find((f) => f.code === p.farmCode);

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-3xl border border-emerald-100 overflow-hidden shrink-0 shadow-xs">
                          {p.image && (p.image.startsWith("data:") || p.image.startsWith("http") || p.image.startsWith("/")) ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            </>
                          ) : (
                            <Sprout size={24} className="text-emerald-700" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {getCategoryLabel(p.category)}
                        </span>
                      </div>

                      {/* Nông Trại Canh Tác (Nơi Trồng) */}
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-1.5">
                        <Home size={11} className="text-emerald-700" />
                        {prodFarm ? prodFarm.name : p.origin}
                      </span>

                      <h4 className="font-bold text-sm text-gray-900 mt-2">{p.name}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between">
                      <div className="text-sm font-extrabold text-[#1a7a3a]">
                        {p.price.toLocaleString("vi-VN")} đ{" "}
                        <span className="text-xs font-normal text-gray-400">/{p.unit}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openCreateBatchModal(p.farmCode || currentFarm?.code, p.name)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        >
                          + Tạo Lô
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa nông sản "${p.name}"?`)) {
                              handleDeleteProduct(p.id, p.name);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Xóa nông sản"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CHỨNG NHẬN & CẢNH BÁO */}
      {/* ========================================================================= */}
      {activeTab === "certs" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Award size={18} className="text-emerald-700" /> Hệ Thống Quản Lý Chứng Nhận Chất Lượng Nông Nghiệp
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Theo dõi hiệu lực chứng chỉ VietGAP & GlobalGAP, tự động cảnh báo khi chứng chỉ sắp hết hạn theo từng trang trại
              </p>
            </div>
            <button
              onClick={openCreateCertModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Thêm Chứng Nhận Mới
            </button>
          </div>

          {/* CẢNH BÁO KHẨN CẤP: CHỨNG NHẬN CÒN <= 5 NGÀY */}
          {computedCerts.some((c) => c.daysLeft <= 5 && c.daysLeft >= 0) && (
            <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-300 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Cảnh Báo Khẩn Cấp (Còn ≤ 5 Ngày)
                    </span>
                    <span className="text-xs text-rose-700 font-bold">Hệ Thống Tự Động Gửi Email Thông Báo</span>
                  </div>
                  <p className="text-xs text-rose-950 font-medium mt-1">
                    Có chứng nhận tiêu chuẩn nông trại sắp hết hiệu lực trong vòng 5 ngày tới. Email cảnh báo đã được hệ thống tự động gửi đến <strong>{activeAlertEmail || "email đăng ký của bạn"}</strong> để kịp thời hoàn tất thủ tục gia hạn kiểm định.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const firstCritical = computedCerts.find((c) => c.daysLeft <= 5 && c.daysLeft >= 0);
                    if (firstCritical) handleOpenRenewModal(firstCritical);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={13} /> Gia Hạn Ngay
                </button>
              </div>
            </div>
          )}

          {/* Bộ lọc Chọn Nông Trại để xem Chứng Nhận */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-500 font-semibold shrink-0 mr-1 flex items-center gap-1">
              <Home size={13} className="text-emerald-700" /> Nông trại:
            </span>
            <button
              type="button"
              onClick={() => setSelectedCertFarm("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedCertFarm === "ALL"
                  ? "bg-emerald-700 text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <span>Tất cả nông trại</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCertFarm === "ALL" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                {visibleCerts.length} Chứng chỉ
              </span>
            </button>

            {visibleFarms.map((farm) => {
              const active = selectedCertFarm === farm.code;
              const count = visibleCerts.filter((c) => c.farmCode === farm.code).length;

              return (
                <button
                  key={farm.id}
                  type="button"
                  onClick={() => setSelectedCertFarm(farm.code)}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    active
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <Home size={12} className={active ? "text-white" : "text-emerald-600"} />
                  <span>{farm.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-800 font-bold"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid Thẻ Chứng Nhận */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayedCerts.length === 0 ? (
              <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-200 text-center text-gray-400 text-xs">
                Chưa có chứng nhận nào cho nông trại này.
              </div>
            ) : (
              displayedCerts.map((cert) => {
                const certFarm = farms.find((f) => f.code === cert.farmCode);

                return (
                  <div
                    key={cert.id}
                    className={`p-5 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                      cert.status === "EXPIRED"
                        ? "bg-rose-50/70 border-rose-300 text-rose-950 shadow-sm"
                        : cert.status === "EXPIRING_SOON"
                        ? "bg-amber-50/60 border-amber-300 text-amber-950 shadow-sm"
                        : "bg-white border-gray-200 text-gray-900 shadow-xs hover:border-emerald-300"
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px]">
                          <Home size={11} className="text-emerald-700" />
                          {certFarm ? certFarm.name : cert.farmCode}
                        </span>
                        {cert.approvalStatus === "PENDING" ? (
                          <span className="bg-amber-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                            <Clock size={11} /> Chờ Admin xét duyệt
                          </span>
                        ) : cert.daysLeft <= 5 && cert.daysLeft >= 0 ? (
                          <span className="bg-amber-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse shadow-xs">
                            <AlertTriangle size={11} /> Cảnh báo: Sắp hết hạn - Hãy gia hạn (Còn {cert.daysLeft} ngày)
                          </span>
                        ) : cert.status === "EXPIRED" ? (
                          <span className="bg-rose-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle size={11} /> Chứng nhận đã hết hiệu lực (Quá {Math.abs(cert.daysLeft)} ngày)
                          </span>
                        ) : cert.status === "EXPIRING_SOON" ? (
                          <span className="bg-amber-500 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle size={11} /> Cảnh báo: Sắp hết hạn - Hãy gia hạn ({cert.daysLeft} ngày)
                          </span>
                        ) : (
                          <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                            Chứng nhận hợp lệ ({cert.daysLeft} ngày)
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-gray-900 mt-1">{cert.name}</h4>
                      <div className="text-gray-600">
                        Số hiệu: <strong className="font-mono text-gray-800">{cert.certNumber}</strong>
                      </div>
                      <div className="text-gray-500">Đơn vị cấp: {cert.issuedBy}</div>

                      {cert.approvalStatus === "PENDING" && cert.pendingRenewal && (
                        <div className="bg-amber-50/90 border border-amber-300 rounded-xl p-2.5 space-y-1.5 text-[11px] text-amber-950 mt-1.5">
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1 text-amber-800">
                              <Clock size={12} /> Yêu cầu gia hạn:
                            </span>
                            <span className="font-mono text-emerald-900 bg-white border border-amber-200 px-1.5 py-0.5 rounded font-bold text-[10px]">
                              {cert.pendingRenewal.newCertNumber}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-600 pt-0.5">
                            <span>Hạn mới đề xuất: <strong className="text-emerald-800">{cert.pendingRenewal.requestedExpiryDate}</strong></span>
                            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                              <CheckCircle2 size={11} /> Đã gửi ảnh xác minh
                            </span>
                          </div>
                          {cert.pendingRenewal.note && (
                            <p className="text-[10px] text-gray-500 italic truncate">
                              Ghi chú: &ldquo;{cert.pendingRenewal.note}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-3 space-y-2">
                      <div className="flex items-center justify-between font-semibold text-[11px]">
                        <span className="text-gray-500">Ngày cấp: {cert.issueDate}</span>
                        <span className="text-rose-600 font-bold">Hết hạn: {cert.expiryDate}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          {cert.approvalStatus === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => handleOpenRenewModal(cert)}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg inline-flex items-center gap-1 cursor-pointer"
                              title="Xem hoặc cập nhật hồ sơ gia hạn đang chờ duyệt"
                            >
                              <Clock size={11} /> Đang chờ duyệt (Cập nhật)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRenewModal(cert)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] rounded-lg inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw size={11} /> Gia hạn
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteCert(cert.certNumber || cert.id, cert.name)}
                          className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                          title="Xóa chứng nhận"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ĐÁNH GIÁ NÔNG SẢN & PHẢN HỒI TỪ CHỦ VƯỜN */}
      {/* ========================================================================= */}
      {activeTab === "reviews" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2 font-serif">
                <Star size={18} className="fill-amber-400 text-amber-500" />
                Quản Lý Đánh Giá & Phản Hồi Khách Hàng (Tư Cách Chủ Nông Trại)
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                Theo dõi phản hồi đồng kiểm độ tươi của người mua, gửi lời cảm ơn và giải đáp trực tiếp với tư cách Chủ Vườn / Hợp Tác Xã.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                🌿 Người đại diện: {authUser?.name || "Nguyễn Văn Hùng"} (Chủ Vườn)
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {farmerReviews.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-xs text-gray-500">
                Chưa có đánh giá nào cho các sản phẩm của nông trại.
              </div>
            ) : (
              farmerReviews.map((rev) => {
                const photoMatch = rev.comment?.match(/\[Ảnh thực tế: ([^\]]+)\]/);
                const photoUrl = photoMatch ? photoMatch[1] : null;
                const cleanComment = rev.comment ? rev.comment.replace(/\[Ảnh thực tế: [^\]]+\]/g, "").trim() : "";
                const criteriaMatch = cleanComment.match(/^\[Đồng kiểm: ([^\]]+)\]/);
                const criteriaStr = criteriaMatch ? criteriaMatch[1] : null;
                const finalComment = criteriaMatch ? cleanComment.replace(/^\[Đồng kiểm: [^\]]+\]\s*/, "") : cleanComment;

                return (
                  <div key={rev.id} className="bg-white p-5 rounded-2xl border-2 border-stone-200 space-y-3.5 shadow-2xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
                          {rev.userName?.charAt(0) || "K"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{rev.userName}</span>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ✓ Đã đồng kiểm nhận hàng
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-500">
                            <span>Sản phẩm: <strong className="text-gray-800">{rev.productName}</strong></span>
                            <span>· Mã đơn: <strong className="font-mono text-gray-800">#{rev.orderCode}</strong></span>
                            <span>· {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("vi-VN") : "Hôm nay"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={14} className={s <= (rev.rating || 5) ? "fill-amber-400 text-amber-500" : "text-gray-300"} />
                        ))}
                      </div>
                    </div>

                    {criteriaStr && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {criteriaStr.split("·").map((c, ci) => (
                          <span key={ci} className="text-xs bg-stone-50 text-emerald-900 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold flex items-center gap-1">
                            <span className="text-emerald-600">✓</span> {c.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-stone-800 leading-relaxed font-normal">{finalComment}</p>

                    {photoUrl && (
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-700">Ảnh thực tế khách hàng mở thùng:</span>
                        <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-300 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoUrl} alt="Ảnh thực tế" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}

                    {/* Phản hồi hiện tại của Chủ Vườn */}
                    {rev.reply && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-300 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-bold text-emerald-950">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 size={14} className="text-emerald-700" />
                            Phản hồi đã gửi của Chủ Vườn ({rev.replyAuthor || "Chủ Nông Trại"}):
                          </span>
                          <span className="text-[10px] text-emerald-700 font-medium">
                            {rev.repliedAt ? new Date(rev.repliedAt).toLocaleDateString("vi-VN") : "Mới đây"}
                          </span>
                        </div>
                        <p className="text-stone-800 leading-relaxed font-normal">{rev.reply}</p>
                      </div>
                    )}

                    {/* Form gửi hoặc cập nhật phản hồi */}
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
                      <span className="font-bold text-stone-900 flex items-center gap-1.5">
                        <MessageCircle size={14} className="text-emerald-700" />
                        {rev.reply ? "Cập nhật câu trả lời tới khách hàng:" : "Viết câu trả lời với tư cách Chủ Vườn:"}
                      </span>
                      <textarea
                        value={farmerReplyText[rev.id] ?? (rev.reply || "")}
                        onChange={(e) => setFarmerReplyText((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                        placeholder="Nhập lời cảm ơn hoặc thông tin cam kết độ tươi từ nông trại..."
                        rows={2}
                        className="w-full text-xs p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:border-emerald-600 bg-white"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-stone-500">Mẫu nhanh:</span>
                          <button
                            type="button"
                            onClick={() => setFarmerReplyText((prev) => ({ ...prev, [rev.id]: "Dạ Nông Trại xin chân thành cảm ơn quý khách đã tin dùng nông sản VietGAP! Chúc gia đình bạn có những bữa ăn thật ngon miệng ạ." }))}
                            className="text-[10px] bg-white hover:bg-emerald-50 hover:text-emerald-800 px-2 py-0.5 rounded border border-stone-300 cursor-pointer"
                          >
                            Cảm ơn & Chúc ngon miệng
                          </button>
                          <button
                            type="button"
                            onClick={() => setFarmerReplyText((prev) => ({ ...prev, [rev.id]: "Vườn luôn hái rau củ sáng sớm và bảo quản lạnh 4.2°C nguyên vẹn để giữ trọn độ tươi giòn gửi tới bạn." }))}
                            className="text-[10px] bg-white hover:bg-emerald-50 hover:text-emerald-800 px-2 py-0.5 rounded border border-stone-300 cursor-pointer"
                          >
                            Cam kết tươi giòn
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={isSubmittingReply[rev.id]}
                          onClick={() => handleFarmerSubmitReply(rev.id, "Nông Trại Xanh")}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isSubmittingReply[rev.id] ? "Đang gửi..." : rev.reply ? "Cập nhật phản hồi" : "Gửi phản hồi cho khách"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: QUẢN LÝ MÙA VỤ CANH TÁC (CROP SEASONS) */}
      {/* ========================================================================= */}
      {activeTab === "seasons" && (
        <CropSeasonsPanel
          ownerId={activeOwnerId}
          farms={visibleFarms.map((f) => ({ code: f.code, name: f.name }))}
          productNames={Array.from(new Set(visibleProducts.map((p) => p.name)))}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 8: AI DỰ BÁO NHU CẦU TIÊU THỤ (7 - 30 NGÀY TỚI) */}
      {/* ========================================================================= */}
      {activeTab === "forecast" && (
        <DemandForecastPanel
          ownerId={activeOwnerId}
          farms={visibleFarms.map((f) => ({ code: f.code, name: f.name }))}
          onPlanHarvestBatch={handlePlanHarvestBatchFromForecast}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HỘP THƯ & KHIẾU NẠI KHÁCH HÀNG */}
      {/* ========================================================================= */}
      {activeTab === "messages" && (
        <div className="w-full min-w-0 overflow-hidden">
          <FarmerMessagesPanel />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM NÔNG TRẠI MỚI */}
      {/* ========================================================================= */}
      {isAddFarmModalOpen && (
        <div onClick={() => setIsAddFarmModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-default">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Home size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Khai Báo Nông Trại Canh Tác Mới</h3>
              </div>
              <button onClick={() => setIsAddFarmModalOpen(false)} className="text-emerald-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Mã Nông Trại *</label>
                  <input
                    type="text"
                    value={newFarmCode}
                    onChange={(e) => setNewFarmCode(e.target.value)}
                    placeholder="VD: NT-LH-03"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-bold text-emerald-800 uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Quy mô (Hecta) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newFarmArea}
                    onChange={(e) => setNewFarmArea(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Tên Nông Trại *</label>
                <input
                  type="text"
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  placeholder="VD: Vườn Xoài Cát Chu Đồng Tháp..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Chủ Nông Trại</label>
                  <input
                    type="text"
                    value={newFarmOwner}
                    onChange={(e) => setNewFarmOwner(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={newFarmPhone}
                    onChange={(e) => setNewFarmPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-gray-700 font-bold mb-1">Địa chỉ canh tác cụ thể</label>
                  <input
                    type="text"
                    value={newFarmAddress}
                    onChange={(e) => setNewFarmAddress(e.target.value)}
                    placeholder="Xã/Thôn, Huyện..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tỉnh / Thành</label>
                  <input
                    type="text"
                    value={newFarmProvince}
                    onChange={(e) => setNewFarmProvince(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Tiêu chuẩn canh tác chính</label>
                <select
                  value={newFarmCert}
                  onChange={(e) => setNewFarmCert(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="VietGAP Trồng trọt">VietGAP Trồng trọt</option>
                  <option value="GlobalGAP Xuất khẩu">GlobalGAP Xuất khẩu</option>
                  <option value="VietGAP & GlobalGAP">VietGAP & GlobalGAP (Đạt cả 2 chuẩn)</option>
                  <option value="Hữu cơ Organic USDA">Hữu cơ Organic USDA</option>
                  <option value="OCOP 4 Sao Đặc sản">OCOP 4 Sao Đặc sản địa phương</option>
                  <option value="Chưa chứng nhận">Chưa có chứng nhận</option>
                </select>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold">
                  <ShieldCheck size={15} className="text-emerald-700 shrink-0" />
                  <span>Hồ Sơ Giấy Tờ Đất & Chứng Nhận (Tải nhiều ảnh: Sổ đỏ, Chứng nhận...) *</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-gray-700 font-bold">Tải ảnh sổ đỏ / chứng nhận hoặc dán link tài liệu *</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="px-3 py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                      <Upload size={13} />
                      {isUploadingFarmDoc ? "Đang tải ảnh..." : "Chọn ảnh Sổ đỏ / Chứng nhận (chọn nhiều ảnh)"}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        disabled={isUploadingFarmDoc}
                        onChange={(e) => {
                          void handleUploadFarmDocs(e.target.files, "create");
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {newFarmDocUrls.length > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Đã đính kèm {newFarmDocUrls.length} hình/tài liệu
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Hoặc dán URL ảnh / link PDF Google Drive..."
                      value={newFarmDocUrlInput}
                      onChange={(e) => setNewFarmDocUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddManualDocUrl("create");
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl bg-white"
                    />
                    {newFarmDocUrlInput.trim() && (
                      <button
                        type="button"
                        onClick={() => handleAddManualDocUrl("create")}
                        className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold shrink-0 cursor-pointer"
                      >
                        + Thêm link
                      </button>
                    )}
                  </div>
                  {newFarmDocUrls.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                      {newFarmDocUrls.map((url, idx) => (
                        <div key={`${url}-${idx}`} className="relative rounded-xl border border-emerald-200 bg-white p-1.5 group">
                          <span className="block text-[10px] font-bold text-emerald-800 mb-1">Hình #{idx + 1}</span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={farmerService.resolveMediaUrl(url)}
                            alt={`Giấy tờ nông trại ${idx + 1}`}
                            className="h-24 w-full rounded-lg object-contain bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => setNewFarmDocUrls((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer"
                            title="Xóa ảnh này"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ghi chú gửi Admin (không bắt buộc)</label>
                  <textarea
                    rows={2}
                    placeholder="VD: Số tờ, số thửa, diện tích canh tác và nguồn gốc đất..."
                    value={newFarmDocNote}
                    onChange={(e) => setNewFarmDocNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddFarmModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploadingFarmDoc}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save size={15} /> Lưu Nông Trại & Gửi Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resubmitFarm && (
        <div onClick={() => setResubmitFarm(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-default">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-300" />
                <h3 className="text-sm font-bold">Đính Kèm Hồ Sơ Đất Canh Tác: {resubmitFarm.name}</h3>
              </div>
              <button onClick={() => setResubmitFarm(null)} className="text-emerald-200 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleResubmitFarmVerification} className="p-6 space-y-4 text-xs overflow-y-auto">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-emerald-900">
                Nông trại: <strong>{resubmitFarm.name}</strong> (<span className="font-mono">{resubmitFarm.code}</span>) • Diện tích: <strong>{resubmitFarm.areaHectares} ha</strong>
              </div>
              {resubmitFarm.verificationDecisionReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800 font-medium">
                  Phản hồi từ Admin: {resubmitFarm.verificationDecisionReason}
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-gray-700 font-bold">Tải ảnh sổ đỏ / chứng nhận hoặc dán link tài liệu *</label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold cursor-pointer inline-flex items-center gap-1.5">
                    <Upload size={13} />
                    {isUploadingResubmitDoc ? "Đang tải ảnh..." : "Chọn ảnh (có thể chọn nhiều ảnh)"}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      disabled={isUploadingResubmitDoc}
                      onChange={(e) => {
                        void handleUploadFarmDocs(e.target.files, "resubmit");
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {resubmitDocUrls.length > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={13} /> Đã đính kèm {resubmitDocUrls.length} hình/tài liệu
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="URL ảnh hoặc tài liệu giấy tờ đất / chứng nhận..."
                    value={resubmitDocUrlInput}
                    onChange={(e) => setResubmitDocUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddManualDocUrl("resubmit");
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  />
                  {resubmitDocUrlInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleAddManualDocUrl("resubmit")}
                      className="px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold shrink-0 cursor-pointer"
                    >
                      + Thêm link
                    </button>
                  )}
                </div>
                {resubmitDocUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {resubmitDocUrls.map((url, idx) => (
                      <div key={`${url}-${idx}`} className="relative rounded-xl border border-emerald-200 bg-white p-1.5">
                        <span className="block text-[10px] font-bold text-emerald-800 mb-1">Hình #{idx + 1}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={farmerService.resolveMediaUrl(url)}
                          alt={`Hồ sơ bổ sung ${idx + 1}`}
                          className="h-24 w-full rounded-lg object-contain bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={() => setResubmitDocUrls((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-90 hover:opacity-100 cursor-pointer"
                          title="Xóa ảnh này"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">Ghi chú về thửa đất / vùng trồng gửi Admin</label>
                <textarea
                  rows={2}
                  placeholder="VD: Số thửa, tờ bản đồ, thời hạn thuê đất / sử dụng đất nông nghiệp..."
                  value={resubmitDocNote}
                  onChange={(e) => setResubmitDocNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white resize-none"
                />
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setResubmitFarm(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUploadingResubmitDoc}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save size={15} /> Nộp Hồ Sơ Đất Cho Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CHỈNH SỬA THÔNG TIN NÔNG TRẠI */}
      {/* ========================================================================= */}
      {editingFarm && (
        <div onClick={() => setEditingFarm(null)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-default">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Chỉnh Sửa Thông Tin Nông Trại</h3>
              </div>
              <button onClick={() => setEditingFarm(null)} className="text-emerald-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateFarm} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Mã Nông Trại *</label>
                  <input
                    type="text"
                    value={editingFarm.code}
                    disabled
                    title="Mã nông trại cố định để đảm bảo tính toàn vẹn liên kết với lô hàng và chứng nhận"
                    className="w-full px-3 py-2 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl font-mono font-bold uppercase cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Quy mô (Hecta) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingFarm.areaHectares}
                    onChange={(e) => setEditingFarm({ ...editingFarm, areaHectares: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Tên Nông Trại *</label>
                <input
                  type="text"
                  value={editingFarm.name}
                  onChange={(e) => setEditingFarm({ ...editingFarm, name: e.target.value })}
                  placeholder="VD: Vườn Xoài Cát Chu Đồng Tháp..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Chủ Nông Trại</label>
                  <input
                    type="text"
                    value={editingFarm.owner}
                    onChange={(e) => setEditingFarm({ ...editingFarm, owner: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={editingFarm.phone}
                    onChange={(e) => setEditingFarm({ ...editingFarm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-gray-700 font-bold mb-1">Địa chỉ canh tác cụ thể</label>
                  <input
                    type="text"
                    value={editingFarm.address}
                    onChange={(e) => setEditingFarm({ ...editingFarm, address: e.target.value })}
                    placeholder="Xã/Thôn, Huyện..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tỉnh / Thành</label>
                  <input
                    type="text"
                    value={editingFarm.province || ""}
                    onChange={(e) => setEditingFarm({ ...editingFarm, province: e.target.value })}
                    placeholder="Tỉnh/Thành phố"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Tiêu chuẩn canh tác chính</label>
                <select
                  value={editingFarm.certStandard}
                  onChange={(e) => setEditingFarm({ ...editingFarm, certStandard: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="VietGAP Trồng trọt">VietGAP Trồng trọt</option>
                  <option value="GlobalGAP Xuất khẩu">GlobalGAP Xuất khẩu</option>
                  <option value="VietGAP & GlobalGAP">VietGAP & GlobalGAP (Đạt cả 2 chuẩn)</option>
                  <option value="Hữu cơ Organic USDA">Hữu cơ Organic USDA</option>
                  <option value="OCOP 4 Sao Đặc sản">OCOP 4 Sao Đặc sản địa phương</option>
                  <option value="Chưa chứng nhận">Chưa có chứng nhận</option>
                  {![
                    "VietGAP Trồng trọt",
                    "GlobalGAP Xuất khẩu",
                    "VietGAP & GlobalGAP",
                    "Hữu cơ Organic USDA",
                    "OCOP 4 Sao Đặc sản",
                    "Chưa chứng nhận",
                  ].includes(editingFarm.certStandard) && (
                    <option value={editingFarm.certStandard}>{editingFarm.certStandard}</option>
                  )}
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingFarm(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save size={15} /> Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NHẬT KÝ VÒNG ĐỜI LÔ THU HOẠCH & TIẾN TRÌNH DUYỆT XUẤT KHO */}
      {/* ========================================================================= */}
      {isLotTimelineModalOpen && selectedLotForTimeline && (
        <div
          onClick={() => setIsLotTimelineModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs cursor-pointer animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[92vh] cursor-default"
          >
            {/* Modal Header */}
            <div className="bg-emerald-950 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-800/80 border border-emerald-600/50 flex items-center justify-center text-emerald-300">
                  <Clock size={19} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                      #{selectedLotForTimeline.code}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Nhật Ký Vòng Đời Lô Thu Hoạch
                    </h3>
                  </div>
                  <p className="text-[11px] text-emerald-300/80 mt-0.5">
                    {selectedLotForTimeline.product} • Thu hoạch: {selectedLotForTimeline.harvestDate} • {selectedLotForTimeline.cert}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLotTimelineModalOpen(false)}
                className="text-emerald-400 hover:text-white p-1 rounded-lg hover:bg-emerald-900/50 cursor-pointer transition-colors"
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Tóm tắt thông số lô */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <div>
                  <div className="text-[10px] text-gray-500 font-medium">Ngày thu hoạch</div>
                  <div className="font-bold text-gray-900 text-xs mt-0.5 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                    {selectedLotForTimeline.harvestDate}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-medium">Sản lượng thu hái</div>
                  <div className="font-bold text-gray-900 text-xs mt-0.5 flex items-center gap-1">
                    <Package size={12} className="text-emerald-600" />
                    {selectedLotForTimeline.qty} {selectedLotForTimeline.unit}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-medium">Trạng thái duyệt</div>
                  <div className="mt-0.5">
                    {selectedLotForTimeline.status === "Đã duyệt xuất kho" ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <Check size={10} /> Đã duyệt xuất kho
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <Clock size={10} /> Chờ Admin duyệt
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 font-medium">Vận chuyển & Lưu kho</div>
                  <div className="mt-0.5">
                    {normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đang vận chuyển" ? (
                      <span className="bg-blue-100 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <Truck size={10} className="animate-pulse" /> Đang vận chuyển
                      </span>
                    ) : normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đã nhập kho đích" ? (
                      <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 size={10} /> Đã nhập kho đích
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                        <Clock size={10} /> Chưa vận chuyển
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* LƯU Ý PHÂN ĐỊNH RÕ RÀNG GIỮA CANH TÁC & SAU THU HOẠCH */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-900 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <BookOpen size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-950">Phạm vi nhật ký vòng đời lô thu hoạch:</span>
                    <p className="text-[10px] text-emerald-800/90 mt-0.5 leading-relaxed">
                      Tiến trình dưới đây theo dõi chuỗi sự kiện <strong>hậu cần từ thời điểm thu hoạch trở đi</strong> (Thu hoạch → Kiểm định KCS → Admin duyệt xuất kho → Lưu kho lạnh & Vận chuyển). Các hoạt động chăm sóc ruộng đồng (Làm đất, Gieo trồng, Bón phân, Tưới tiêu) trước thu hoạch được lưu trữ riêng tại mục <strong>&ldquo;Sổ Nhật Ký Canh Tác&rdquo;</strong>.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsLotTimelineModalOpen(false);
                    setActiveTab("logs");
                  }}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shrink-0 transition-colors cursor-pointer"
                >
                  Xem Sổ Canh Tác
                </button>
              </div>

              {/* DÒNG THỜI GIAN VÒNG ĐỜI SAU THU HOẠCH */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <Clock size={14} className="text-[#1a7a3a]" />
                    Hành Trình Vòng Đời Lô (Từ Thu Hoạch Đến Xuất Kho)
                  </h4>
                  {isLoadingLotTimeline && (
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <RefreshCw size={11} className="animate-spin text-emerald-600" /> Đang đồng bộ...
                    </span>
                  )}
                </div>

                {/* TIẾN TRÌNH LIÊN THÔNG 3 BÊN THỜI GIAN THỰC */}
                <div className="bg-gradient-to-r from-emerald-50/70 via-blue-50/70 to-purple-50/70 p-3.5 rounded-xl border border-gray-200 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 mb-2">
                    <span className="flex items-center gap-1.5 text-gray-900">
                      <Sparkles size={13} className="text-amber-500" />
                      Tiến Trình Liên Thông Chuỗi Cung Ứng (Tự Động Cập Nhật Realtime):
                    </span>
                    {sseConnected ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        SSE Live Connected
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">Đồng bộ định kỳ</span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div
                      className={`p-2 rounded-lg border transition-all ${
                        selectedLotForTimeline.status === "Đã duyệt xuất kho"
                          ? "bg-emerald-100 border-emerald-300 text-emerald-900 font-bold shadow-2xs"
                          : "bg-amber-50 border-amber-200 text-amber-900 font-semibold"
                      }`}
                    >
                      <div className="text-sm mb-0.5">
                        {selectedLotForTimeline.status === "Đã duyệt xuất kho" ? "✅" : "⏳"}
                      </div>
                      <div className="font-bold">1. Admin Thẩm Định</div>
                      <div className="text-[9px] mt-0.5">{selectedLotForTimeline.status}</div>
                    </div>

                    <div
                      className={`p-2 rounded-lg border transition-all ${
                        normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đang vận chuyển"
                          ? "bg-blue-100 border-blue-400 text-blue-900 font-bold shadow-2xs animate-pulse ring-2 ring-blue-300/40"
                          : normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đã nhập kho đích"
                          ? "bg-blue-50 border-blue-200 text-blue-800 font-semibold"
                          : "bg-white/90 border-gray-200 text-gray-500"
                      }`}
                    >
                      <div className="text-sm mb-0.5">
                        {normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đang vận chuyển"
                          ? "🚚"
                          : normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đã nhập kho đích"
                          ? "📦"
                          : "🏡"}
                      </div>
                      <div className="font-bold">2. Tài Xế Nhận Hàng</div>
                      <div className="text-[9px] mt-0.5">
                        {normalizeTransportStatus(selectedLotForTimeline.transportStatus)}
                      </div>
                    </div>

                    <div
                      className={`p-2 rounded-lg border transition-all ${
                        normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đã nhập kho đích"
                          ? "bg-purple-100 border-purple-300 text-purple-900 font-bold shadow-2xs"
                          : "bg-white/90 border-gray-200 text-gray-500"
                      }`}
                    >
                      <div className="text-sm mb-0.5">
                        {normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đã nhập kho đích" ? "🏢" : "⏳"}
                      </div>
                      <div className="font-bold">3. Thủ Kho Nhập Kho</div>
                      <div className="text-[9px] mt-0.5">
                        {normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đã nhập kho đích"
                          ? "Đã nhập kho đích"
                          : "Chờ nhập kho"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                  {/* MỐC 1: KHAI BÁO THU HOẠCH */}
                  <div className="relative group">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xs flex items-center justify-center text-white">
                      <CheckCircle2 size={12} />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs hover:border-emerald-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <span>Khai Báo Thu Hoạch & Khởi Tạo Mã Lô</span>
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded border border-emerald-200 font-semibold">
                            Mốc khởi đầu
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono font-medium">
                          {selectedLotForTimeline.harvestDate}
                        </span>
                      </div>
                      <div className="mt-1.5 text-gray-600 text-[11px] space-y-0.5">
                        <div>
                          • <strong>Sản lượng:</strong> {selectedLotForTimeline.qty} {selectedLotForTimeline.unit} |{" "}
                          <strong>Nông sản:</strong> {selectedLotForTimeline.product}
                        </div>
                        <div>
                          • <strong>Nơi trồng:</strong> {selectedLotForTimeline.farmCode} |{" "}
                          <strong>Tiêu chuẩn:</strong> {selectedLotForTimeline.cert} ({selectedLotForTimeline.cultivation})
                        </div>
                        <div className="text-gray-400 text-[10px] italic">
                          Hoàn tất công đoạn thu hoạch từ nông trại và khai báo hồ sơ điện tử lên hệ thống truy xuất.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MỐC 2: KIỂM ĐỊNH CHẤT LƯỢNG KCS */}
                  <div className="relative group">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-teal-500 border-2 border-white shadow-xs flex items-center justify-center text-white">
                      <ShieldCheck size={12} />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs hover:border-teal-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <span>Kiểm Định Chất Lượng KCS & An Toàn Vệ Sinh</span>
                          <span className="bg-teal-50 text-teal-700 text-[10px] px-1.5 py-0.2 rounded border border-teal-200 font-semibold">
                            ISO/IEC 17025
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono font-medium">
                          {selectedLotForTimeline.harvestDate}
                        </span>
                      </div>
                      <div className="mt-1 text-gray-600 text-[11px]">
                        Kiểm tra các chỉ tiêu dư lượng thuốc BVTV, hàm lượng Nitrat và vi sinh vật gây hại. Toàn bộ đạt ngưỡng an toàn cho phép lưu thông thực phẩm.
                      </div>
                    </div>
                  </div>

                  {/* MỐC 3: ADMIN THẨM ĐỊNH & PHÊ DUYỆT XUẤT KHO */}
                  <div className="relative group">
                    <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-white ${
                      selectedLotForTimeline.status === "Đã duyệt xuất kho" ? "bg-emerald-600" : "bg-amber-500"
                    }`}>
                      <FileCheck size={12} />
                    </div>
                    <div className={`border rounded-xl p-3.5 shadow-2xs transition-all ${
                      selectedLotForTimeline.status === "Đã duyệt xuất kho"
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-amber-50/50 border-amber-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <span>Admin Thẩm Định & Phê Duyệt Xuất Kho</span>
                          {selectedLotForTimeline.status === "Đã duyệt xuất kho" ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold border border-emerald-300 flex items-center gap-1">
                              <Check size={10} /> ĐÃ DUYỆT XUẤT KHO
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-bold border border-amber-300 flex items-center gap-1">
                              <Clock size={10} /> CHỜ ADMIN DUYỆT
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {selectedLotForTimeline.harvestDate}
                        </span>
                      </div>

                      <div className="mt-1.5 text-gray-700 text-[11px] leading-relaxed">
                        {selectedLotForTimeline.status === "Đã duyệt xuất kho" ? (
                          <span>
                            ✅ Hồ sơ kiểm định và tiêu chuẩn sản phẩm đã được Ban Quản Lý / Admin thẩm định hợp lệ.{" "}
                            <strong>Cho phép xuất kho và phân phối ra thị trường.</strong>
                          </span>
                        ) : (
                          <span>
                            ⏳ Hồ sơ lô đang trong danh sách chờ Admin xét duyệt kiểm tra hồ sơ trước khi cấp phép xuất kho nông sản.
                          </span>
                        )}
                      </div>

                      {/* THÔNG TIN THẨM ĐỊNH PHÍA ADMIN (NÔNG DÂN KHÔNG TỰ DUYỆT) */}
                      <div className="mt-3 pt-2.5 border-t border-gray-200/80">
                        {selectedLotForTimeline.status === "Chờ duyệt xuất kho" ? (
                          <div className="bg-amber-100/70 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 space-y-2">
                            <div className="font-bold flex items-center gap-1.5 text-amber-800">
                              <Clock size={13} className="text-amber-600" />
                              Hồ sơ đang chờ Ban Quản Trị / Admin xét duyệt
                            </div>
                            <p className="text-[10px] text-amber-800/90 leading-relaxed">
                              Theo quy trình phân quyền hệ thống, chỉ <strong>Ban Quản Trị / Admin</strong> mới có quyền thẩm định hồ sơ KCS và phê duyệt cấp lệnh xuất kho. Nông dân không thể tự phê duyệt lệnh xuất kho cho chính mình.
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  toast.info(`Đã gửi thông báo nhắc Admin ưu tiên thẩm định lô ${selectedLotForTimeline.code}!`);
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <Mail size={11} /> Gửi Lời Nhắc Đến Admin
                              </button>
                              <span className="text-[10px] text-amber-700 italic">
                                (Yêu cầu sẽ hiển thị tại mục &ldquo;Duyệt Lô Xuất Kho&rdquo; của Admin)
                              </span>
                            </div>
                          </div>
                        ) : selectedLotForTimeline.status === "Từ chối xuất kho" ? (
                          <div className="bg-rose-100/70 border border-rose-200 rounded-lg p-3 text-[11px] text-rose-900">
                            <div className="font-bold flex items-center gap-1.5 text-rose-800">
                              <X size={13} className="text-rose-600" />
                              Lô hàng đã bị Admin từ chối xuất kho
                            </div>
                            <p className="text-[10px] text-rose-800/90 mt-1 leading-relaxed">
                              Lô hàng chưa đáp ứng đầy đủ điều kiện an toàn thực phẩm hoặc chứng chỉ VietGAP/GlobalGAP hết hạn. Vui lòng liên hệ Admin để bổ sung kiểm định.
                            </p>
                          </div>
                        ) : (
                          <div className="bg-emerald-100/70 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-900">
                            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                              <CheckCircle2 size={13} className="text-emerald-600" />
                              Đã có lệnh phê duyệt xuất kho từ Admin
                            </div>
                            <p className="text-[10px] text-emerald-800/90 mt-1 leading-relaxed">
                              Hồ sơ lô đã được xác nhận đủ điều kiện an toàn thực phẩm. Nông dân được phép xuất hàng và điều phối xe lạnh vận chuyển đến kho đích.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* MỐC 4: QUẢN LÝ LƯU KHO & VẬN CHUYỂN CHUỖI LẠNH */}
                  <div className="relative group">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-xs flex items-center justify-center text-white">
                      <Truck size={12} />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs hover:border-blue-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                          <span>Quản Lý Lưu Kho & Vận Chuyển Chuỗi Lạnh</span>
                          <span className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                            Logistics
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {selectedLotForTimeline.harvestDate}
                        </span>
                      </div>

                      <div className="mt-1.5 text-gray-600 text-[11px] space-y-0.5">
                        <div>
                          • <strong>Hiện trạng:</strong> {normalizeTransportStatus(selectedLotForTimeline.transportStatus)}
                        </div>
                        <div>
                          • <strong>Kho đích / Điểm giao:</strong> {selectedLotForTimeline.transportDestination || "Kho phân phối"}
                        </div>
                      </div>

                      {/* Cảnh Báo Khi Chưa Được Phê Duyệt Xuất Kho */}
                      {selectedLotForTimeline.status !== "Đã duyệt xuất kho" ? (
                        <div className="mt-3 pt-2.5 border-t border-gray-100">
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Lô hàng đang khóa xuất kho (Chờ Admin phê duyệt):</span>
                              <p className="text-[10px] text-amber-800 mt-0.5">
                                Theo quy chuẩn kiểm soát nguồn gốc, lô hàng bắt buộc phải được <strong>Ban Quản Trị / Admin</strong> duyệt đạt chuẩn an toàn trước khi kích hoạt lệnh điều phối xe lạnh xuất kho.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-3">
                          {/* Trạng thái liên thông vận chuyển */}
                          {normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Chưa vận chuyển" ? (
                            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-blue-900 font-bold text-[11px]">
                                <span className="flex items-center gap-1.5"><Truck size={13} className="text-blue-700" /> Bước tiếp theo: Tài xế nhận hàng</span>
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full border border-amber-300">Chờ quét QR tại vườn</span>
                              </div>
                              <p className="text-[10px] text-blue-800 leading-relaxed">
                                Lô hàng đã đủ điều kiện xuất kho. Khi tài xế xe lạnh đến vườn và quét mã QR của lô nông sản, trạng thái sẽ tự động chuyển sang <strong>Đang vận chuyển</strong>.
                              </p>
                              <button
                                type="button"
                                disabled={isUpdatingLotStatus}
                                onClick={() => handleDriverPickup(selectedLotForTimeline.code)}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isUpdatingLotStatus ? <RefreshCw size={12} className="animate-spin" /> : <Truck size={12} />}
                                🚚 Mô phỏng Tài xế quét QR nhận hàng (Bắt đầu vận chuyển)
                              </button>
                            </div>
                          ) : normalizeTransportStatus(selectedLotForTimeline.transportStatus) === "Đang vận chuyển" ? (
                            <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-purple-900 font-bold text-[11px]">
                                <span className="flex items-center gap-1.5"><Truck size={13} className="text-purple-700 animate-pulse" /> Đang vận chuyển chuỗi lạnh</span>
                                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full border border-blue-300">Xe lạnh trên đường</span>
                              </div>
                              <p className="text-[10px] text-purple-800 leading-relaxed">
                                Hàng đang được bảo quản lạnh trên lộ trình đến <strong>{selectedLotForTimeline.transportDestination || "Kho phân phối"}</strong>. Khi xe đến kho, thủ kho sẽ quét QR kiểm định để hoàn tất nhập kho đích.
                              </p>
                              <button
                                type="button"
                                disabled={isUpdatingLotStatus}
                                onClick={() => handleWarehouseInbound(selectedLotForTimeline.code)}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                              >
                                {isUpdatingLotStatus ? <RefreshCw size={12} className="animate-spin" /> : <Warehouse size={12} />}
                                🏢 Mô phỏng Thủ kho quét QR nhập kho đích
                              </button>
                            </div>
                          ) : (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1">
                              <div className="font-bold text-[11px] flex items-center gap-1.5 text-emerald-800">
                                <CheckCircle2 size={13} className="text-emerald-600" />
                                Đã nhập kho đích thành công
                              </div>
                              <p className="text-[10px] text-emerald-800/90 leading-relaxed">
                                Thủ kho đã xác nhận tiếp nhận và lưu kho lạnh an toàn tại <strong>{selectedLotForTimeline.transportDestination || "Kho phân phối"}</strong>. Vòng đời lô thu hoạch đã hoàn tất thành công.
                              </p>
                            </div>
                          )}

                          <div className="text-[11px] font-bold text-gray-700 pt-1">Hoặc tùy chỉnh trạng thái thủ công:</div>
                          <div className="grid grid-cols-3 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditTransportStatus("Chưa vận chuyển")}
                              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors text-center ${
                                editTransportStatus === "Chưa vận chuyển"
                                  ? "bg-amber-100 border-amber-300 text-amber-900"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              🏡 Lưu kho vườn
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditTransportStatus("Đang vận chuyển")}
                              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors text-center ${
                                editTransportStatus === "Đang vận chuyển"
                                  ? "bg-blue-100 border-blue-300 text-blue-900"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              🚚 Đang vận chuyển
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditTransportStatus("Đã nhập kho đích")}
                              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer transition-colors text-center ${
                                editTransportStatus === "Đã nhập kho đích"
                                  ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                                  : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              🏢 Đã nhập kho đích
                            </button>
                          </div>
                          <div className="flex gap-2 items-center pt-1">
                            <input
                              type="text"
                              value={editTransportDest}
                              onChange={(e) => setEditTransportDest(e.target.value)}
                              placeholder="Nhập địa điểm giao hàng / kho đến (VD: Kho Tổng Logistics TP.HCM)"
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] outline-none focus:border-emerald-600 text-gray-800"
                            />
                            <button
                              type="button"
                              disabled={isUpdatingLotStatus}
                              onClick={handleUpdateLotTransport}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
                            >
                              {isUpdatingLotStatus ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                              Lưu
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CÁC SỰ KIỆN HẬU CẦN SAU THU HOẠCH TÙY BIẾN (Đóng gói, dán tem, bàn giao, giao hàng...) */}
                  {lotTimelineEvents
                    .filter((ev) => {
                      const s = (ev.stage || "").toLowerCase();
                      // Loại bỏ các mốc mặc định đã hiển thị ở trên
                      if (
                        ev.stage.includes("Thu hoạch") ||
                        ev.stage.includes("Kiểm định") ||
                        ev.stage.includes("phê duyệt") ||
                        ev.stage.includes("Lưu kho & Vận chuyển") ||
                        ev.stage.includes("Gieo trồng")
                      ) {
                        return false;
                      }
                      // Lọc bỏ hoàn toàn các hoạt động canh tác đồng ruộng trước thu hoạch (như bón phân, tưới nước)
                      if (
                        s.includes("bón phân") ||
                        s.includes("tưới") ||
                        s.includes("làm đất") ||
                        s.includes("phun thuốc") ||
                        s.includes("chăm sóc") ||
                        s.includes("cắt tỉa") ||
                        s.includes("tỉa cành") ||
                        s.includes("làm cỏ") ||
                        s.includes("gieo hạt") ||
                        s.includes("xử lý đất") ||
                        s.includes("ủ phân")
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((ev, idx) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-indigo-500 border-2 border-white shadow-xs flex items-center justify-center text-white">
                          <CheckCircle2 size={11} />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs hover:border-indigo-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                              {ev.stage}
                              {ev.badge && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200 font-semibold">
                                  {ev.badge}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {ev.time}
                            </span>
                          </div>
                          <p className="mt-1 text-gray-600 text-[11px]">{ev.note}</p>
                          {ev.operator && (
                            <div className="mt-1 text-[10px] text-gray-400">
                              Người thực hiện: <span className="font-semibold text-gray-600">{ev.operator}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* KHU VỰC THÊM SỰ KIỆN SAU THU HOẠCH TÙY CHỌN */}
              <div className="pt-2 border-t border-gray-100">
                {!isAddingCustomEvent ? (
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomEvent(true)}
                    className="w-full py-2 border border-dashed border-gray-300 hover:border-emerald-500 text-gray-600 hover:text-emerald-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus size={13} /> Ghi Thêm Sự Kiện Vòng Đời Lô Mới
                  </button>
                ) : (
                  <form onSubmit={handleAddCustomTimelineEvent} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 text-xs flex items-center gap-1">
                        <Plus size={13} className="text-emerald-600" />
                        Ghi Nhận Sự Kiện Sau Thu Hoạch
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomEvent(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-gray-600 font-bold text-[10px] mb-1">
                          Tên sự kiện / Giai đoạn:
                        </label>
                        <select
                          value={customEventStage}
                          onChange={(e) => setCustomEventStage(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-emerald-600"
                        >
                          <option value="Đóng gói & Dán tem QR">Đóng gói & Dán tem QR</option>
                          <option value="Tái kiểm định KCS đột xuất">Tái kiểm định KCS đột xuất</option>
                          <option value="Kiểm tra nhiệt độ container">Kiểm tra nhiệt độ container</option>
                          <option value="Bàn giao đơn vị vận tải">Bàn giao đơn vị vận tải</option>
                          <option value="Giao hàng đến siêu thị / Đối tác">Giao hàng đến siêu thị / Đối tác</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-600 font-bold text-[10px] mb-1">
                          Người / Đơn vị thực hiện:
                        </label>
                        <input
                          type="text"
                          value={customEventOperator}
                          onChange={(e) => setCustomEventOperator(e.target.value)}
                          placeholder="VD: Nguyễn Văn A (Tổ trưởng đóng gói)"
                          className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-600 font-bold text-[10px] mb-1">
                        Chi tiết ghi chú:
                      </label>
                      <input
                        type="text"
                        value={customEventNote}
                        onChange={(e) => setCustomEventNote(e.target.value)}
                        placeholder="VD: Đóng thùng carton 10kg có màng vi lỗ, kiểm soát nhiệt độ 4.5°C"
                        className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 outline-none focus:border-emerald-600"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomEvent(false)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 font-semibold rounded-lg text-[11px] cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingCustomEvent}
                        className="px-3 py-1 bg-[#1a7a3a] text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingCustomEvent ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                        Lưu Sự Kiện
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <Link
                  href={`/traceability?batch=${selectedLotForTimeline.code}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1a7a3a] hover:underline"
                >
                  <QrCode size={14} /> Tra cứu trang QR công khai của lô
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenPrintLabel(selectedLotForTimeline);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Printer size={13} /> In Tem QR Chuẩn GS1
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsLotTimelineModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TẠO LÔ THU HOẠCH MỚI */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div onClick={() => setIsBatchModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] cursor-default">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Khai Báo Lô Thu Hoạch & Kế Hoạch Vận Chuyển</h3>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-emerald-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Bước 1: Chọn Nông Trại Thu Hoạch (Nơi Trồng) */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  1. Nông Trại Thu Hoạch (Nơi Trồng) *
                </label>
                <select
                  value={formFarmCode}
                  onChange={(e) => handleBatchFarmChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-bold text-gray-800"
                >
                  {visibleFarms.map((f) => (
                    <option key={f.id} value={f.code}>
                      🏡 {f.name} ({f.code}) - {f.province}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bước 2: Nông sản & Mã Lô */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">2. Nông sản thu hoạch *</label>
                  <select
                    value={formProduct}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    {visibleProducts
                      .filter((p) => !p.farmCode || p.farmCode === formFarmCode)
                      .map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name}
                        </option>
                      ))}
                    {formProduct &&
                      !visibleProducts
                        .filter((p) => !p.farmCode || p.farmCode === formFarmCode)
                        .some((p) => p.name === formProduct) && (
                        <option value={formProduct}>{formProduct}</option>
                      )}
                    {visibleProducts.filter((p) => !p.farmCode || p.farmCode === formFarmCode).length === 0 && !formProduct && (
                      <option value="Nông sản sạch">Nông sản sạch của nông trại</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">3. Mã Lô (Tự sinh hoặc sửa) *</label>
                  <input
                    type="text"
                    value={formLotCode}
                    onChange={(e) => setFormLotCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-bold text-emerald-800 uppercase"
                    required
                  />
                </div>
              </div>

              {/* Bước 3: Ngày tháng */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ngày gieo trồng</label>
                  <input
                    type="date"
                    value={formPlantingDate}
                    onChange={(e) => setFormPlantingDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ngày thu hoạch *</label>
                  <input
                    type="date"
                    value={formHarvestDate}
                    onChange={(e) => setFormHarvestDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-xl font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Hạn sử dụng (EXP) *</label>
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-xl font-semibold text-rose-600"
                    required
                  />
                </div>
              </div>

              {/* Bước 4: Sản lượng & Tiêu chuẩn */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-gray-700 font-bold mb-1">Sản lượng thu hoạch *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formQty}
                      onChange={(e) => setFormQty(e.target.value)}
                      min="1"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl font-bold"
                      required
                    />
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-24 px-2 py-2 border border-gray-300 rounded-xl bg-white"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="tấn">tấn</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tiêu chuẩn canh tác</label>
                  <select
                    value={formCert}
                    onChange={(e) => setFormCert(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl bg-white font-semibold text-emerald-800"
                  >
                    <option value="VietGAP">VietGAP</option>
                    <option value="GlobalGAP">GlobalGAP</option>
                    <option value="Organic USDA">Organic USDA</option>
                  </select>
                </div>
              </div>

              {/* Bước 5: Điểm Đến & Phương Pháp Canh Tác */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-emerald-700" /> Điểm đến / Kho nhận hàng dự kiến *
                </label>
                <select
                  value={formTransportDest}
                  onChange={(e) => setFormTransportDest(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="Kho Tổng Logistics TP.HCM">Kho Tổng Logistics TP.HCM</option>
                  <option value="Kho Lạnh Phân Phối Hà Nội">Kho Lạnh Phân Phối Hà Nội</option>
                  <option value="Kho Phân Phối Đà Nẵng">Kho Phân Phối Đà Nẵng</option>
                  <option value="Lưu tại kho bảo quản nông trại">Lưu tại kho bảo quản nông trại</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Phương pháp canh tác / Ghi chú đợt hái</label>
                <input
                  type="text"
                  value={formCultivation}
                  onChange={(e) => setFormCultivation(e.target.value)}
                  placeholder="VD: Bao trái hữu cơ, thu hoạch đợt 2 chín 85%..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              {/* Thông tin trạng thái hệ thống tự động theo quy trình */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Truck size={13} className="text-emerald-700" /> Tình trạng vận chuyển ban đầu:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-gray-700 border border-gray-200 shadow-2xs">
                    🏡 Chưa vận chuyển (Lưu tại kho vườn)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-600" /> Trạng thái thẩm định hệ thống:
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ⏳ Chờ duyệt xuất kho
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 pt-1 leading-relaxed">
                  ℹ️ <em>Quy trình:</em> Trạng thái xuất kho sẽ do <strong>Admin</strong> thẩm định; Trạng thái vận chuyển sẽ do <strong>Nhà phân phối</strong> &amp; <strong>Thủ kho</strong> cập nhật khi quét mã QR bàn giao hàng.
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBatch}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={16} /> {isSubmittingBatch ? "Đang lưu..." : "Lưu & Cấp Mã QR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GHI NHẬT KÝ CANH TÁC */}
      {/* ========================================================================= */}
      {isLogModalOpen && (
        <div onClick={() => setIsLogModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-default">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Ghi Nhật Ký Canh Tác Lô Hàng</h3>
              </div>
              <button onClick={() => setIsLogModalOpen(false)} className="text-emerald-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="p-6 space-y-4 text-xs">
              {/* Bước 1: Chọn Nông Trại */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  1. Nông Trại Canh Tác *
                </label>
                <select
                  value={selectedFarmForLog}
                  onChange={(e) => {
                    const nextFarm = e.target.value;
                    setSelectedFarmForLog(nextFarm);
                    const matching = visibleBatches.filter((b) => b.farmCode === nextFarm);
                    if (matching.length > 0) {
                      setSelectedBatchForLog(matching[0].code);
                    } else {
                      setSelectedBatchForLog("");
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-bold text-gray-800"
                >
                  {visibleFarms.map((f) => (
                    <option key={f.id} value={f.code}>
                      🏡 {f.name} ({f.code}) - {f.province}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bước 2: Chọn Lô Thu Hoạch Thuộc Nông Trại Đó */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    2. Lô Thu Hoạch Thuộc Nông Trại *
                  </label>
                  <select
                    value={selectedBatchForLog}
                    onChange={(e) => setSelectedBatchForLog(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-mono font-bold text-emerald-800"
                    required
                  >
                    {visibleBatches
                      .filter((b) => b.farmCode === selectedFarmForLog)
                      .map((b) => (
                        <option key={b.code} value={b.code}>
                          Lô {b.code} ({b.product})
                        </option>
                      ))}
                    {visibleBatches.filter((b) => b.farmCode === selectedFarmForLog).length === 0 && (
                      <option value="">Chưa có lô cho nông trại này</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">3. Ngày thực hiện *</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">4. Giai đoạn chăm sóc</label>
                <select
                  value={logStage}
                  onChange={(e) => setLogStage(e.target.value as FarmingLogItem["stage"])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="Gieo hạt">🌱 Gieo hạt / Xuống giống</option>
                  <option value="Bón phân">🍂 Bón phân hữu cơ vi sinh</option>
                  <option value="Tưới tiêu">💧 Tưới tiêu nước sạch</option>
                  <option value="Phun sinh học">🛡️ Phun chế phẩm sinh học xua sâu</option>
                  <option value="Thu hoạch">🧺 Thu hoạch đóng thùng</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">5. Công việc đã thực hiện *</label>
                <input
                  type="text"
                  value={logAction}
                  onChange={(e) => setLogAction(e.target.value)}
                  placeholder="VD: Bón phân trùn quế đợt 2, bao trái chống ruồi vàng..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">6. Vật tư / Chế phẩm sử dụng</label>
                <input
                  type="text"
                  value={logMaterials}
                  onChange={(e) => setLogMaterials(e.target.value)}
                  placeholder="VD: Phân hữu cơ trùn quế, chế phẩm tỏi ớt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">7. Ghi chú canh tác & kỹ thuật</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  rows={2}
                  placeholder="Tình trạng sinh trưởng, thời tiết, độ ẩm, độ pH..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              {/* 8. Ảnh minh chứng thực tế */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  8. Ảnh minh chứng canh tác thực tế (Tùy chọn)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-3.5 text-center hover:border-emerald-500 transition-colors bg-gray-50/50">
                  {logProofImage ? (
                    <div className="space-y-2">
                      <div className="relative inline-block max-h-36 overflow-hidden rounded-lg border border-gray-200 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logProofImage}
                          alt="Ảnh minh chứng"
                          className="max-h-32 object-contain mx-auto"
                        />
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xs text-gray-600 font-medium truncate max-w-xs">
                          📎 {logProofFileName || "Ảnh minh chứng canh tác"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setLogProofImage("");
                            setLogProofFileName("");
                          }}
                          className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-semibold text-[11px] cursor-pointer"
                        >
                          Xóa &amp; Chọn lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="mx-auto text-gray-400 mb-1" size={22} />
                      <p className="text-gray-700 font-semibold text-xs mb-0.5">
                        Tải ảnh chụp thực tế tại vườn / công việc canh tác
                      </p>
                      <p className="text-[11px] text-gray-400 mb-2">
                        Hỗ trợ ảnh JPG, PNG, WEBP (tối đa 5MB)
                      </p>
                      <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-xl cursor-pointer text-xs">
                        <Upload size={13} /> {isUploadingLogImage ? "Đang tải ảnh lên..." : "Chọn ảnh từ thiết bị"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingLogImage}
                          onChange={handleLogImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {!selectedBatchForLog && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                  ⚠️ Nông trại đang chọn chưa có lô thu hoạch. Hãy tạo lô ở Tab Quản Lý Lô Thu Hoạch trước khi ghi nhật ký.
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedBatchForLog || isSubmittingLog}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save size={15} /> {isSubmittingLog ? "Đang lưu..." : "Lưu Nhật Ký"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM SẢN PHẨM NÔNG NGHIỆP MỚI */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div onClick={() => setIsProductModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-default">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sprout size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Thêm Sản Phẩm Nông Nghiệp Mới</h3>
              </div>
              <button onClick={() => setIsProductModalOpen(false)} className="text-emerald-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 text-xs">
              {/* Bước 1: Nông Trại Canh Tác (Nơi Trồng) */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">
                  1. Nông Trại Canh Tác (Nơi Trồng) *
                </label>
                <select
                  value={newProdFarmCode}
                  onChange={(e) => setNewProdFarmCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-bold text-gray-800"
                >
                  {visibleFarms.map((f) => (
                    <option key={f.id} value={f.code}>
                      🏡 {f.name} ({f.code}) - {f.province}
                    </option>
                  ))}
                </select>
              </div>
              {/* Bước 2: Tên nông sản */}
              <div>
                <label className="block text-gray-700 font-bold mb-1">2. Tên nông sản *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="VD: Xoài Cát Chu, Sầu Riêng Ri6..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                  required
                />
              </div>

              {/* Bước 3: Hình ảnh nông sản */}
              <div>
                <label className="block text-gray-700 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Upload size={13} className="text-emerald-700" /> 3. Hình ảnh nông sản <span className="text-rose-500">*</span>
                  </span>
                  {newProdImage && (
                    <button
                      type="button"
                      onClick={() => setNewProdImage("")}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-4 p-3.5 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                  <div className="w-20 h-20 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                    {newProdImage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={newProdImage} alt="Xem trước" className="w-full h-full object-cover" />
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="mx-auto text-gray-300 mb-1" size={22} />
                        <span className="text-[10px] text-gray-400 block leading-tight">Chưa có ảnh</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-colors">
                      <Upload size={14} /> Tải ảnh từ máy tính / điện thoại
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-gray-500">
                      Tải ảnh chụp sản phẩm thực tế (Hỗ trợ định dạng JPG, PNG, WebP tối đa 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Phân loại</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Đơn vị tính</label>
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="kg">kg</option>
                    <option value="hộp 500g">hộp 500g</option>
                    <option value="trái">trái</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Giá bán dự kiến (VNĐ) *</label>
                <input
                  type="number"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold text-emerald-800"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Mô tả đặc điểm sản phẩm</label>
                <textarea
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  rows={2}
                  placeholder="Hương vị, phương pháp chăm sóc..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save size={15} /> {isSubmittingProduct ? "Đang lưu..." : "Lưu Sản Phẩm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM CHỨNG NHẬN CHẤT LƯỢNG MỚI */}
      {/* ========================================================================= */}
      {isCertModalOpen && (
        <div onClick={() => setIsCertModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col cursor-default">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Thêm Chứng Nhận Chất Lượng Mới</h3>
              </div>
              <button onClick={() => setIsCertModalOpen(false)} className="text-emerald-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCert} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">1. Nông Trại Được Cấp Chứng Nhận *</label>
                <select
                  value={newCertFarmCode}
                  onChange={(e) => setNewCertFarmCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-bold text-gray-800"
                >
                  {visibleFarms.map((f) => (
                    <option key={f.id} value={f.code}>
                      🏡 {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">2. Tên Chứng Nhận *</label>
                <input
                  type="text"
                  value={newCertName}
                  onChange={(e) => setNewCertName(e.target.value)}
                  placeholder="VD: Chứng nhận GlobalGAP, VietGAP Trồng trọt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">3. Số Hiệu Chứng Chỉ *</label>
                <input
                  type="text"
                  value={newCertNumber}
                  onChange={(e) => setNewCertNumber(e.target.value)}
                  placeholder="VD: VG-88-2026-VN"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-bold uppercase text-emerald-800"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">4. Đơn Vị Cấp *</label>
                <input
                  type="text"
                  value={newCertIssuedBy}
                  onChange={(e) => setNewCertIssuedBy(e.target.value)}
                  placeholder="VD: Chi cục Quản lý Chất lượng Nông Lâm Sản..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ngày cấp *</label>
                  <input
                    type="date"
                    value={newCertIssueDate}
                    onChange={(e) => setNewCertIssueDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ngày hết hạn *</label>
                  <input
                    type="date"
                    value={newCertExpiryDate}
                    onChange={(e) => setNewCertExpiryDate(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl text-rose-600 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCertModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save size={15} /> Lưu Chứng Nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL GIA HẠN CHỨNG NHẬN - CHUẨN THEO MẪU BẠN GỬI */}
      {isRenewModalOpen && renewingCert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 max-h-[92vh] flex flex-col p-6 animate-fade-in">
            {/* Header: Gia hạn chứng nhận +1 năm */}
            <div className="flex items-start justify-between pb-3.5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900">Gia hạn chứng nhận</h3>
                  <span className="bg-emerald-50 text-emerald-600 font-bold text-xs px-2 py-0.5 rounded-md">
                    +{renewDuration === "0.5" ? "6 tháng" : `${renewDuration} năm`}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Vui lòng kiểm tra thông tin chứng nhận trước khi thực hiện gia hạn.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRenewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form body with scroll */}
            <form onSubmit={handleSubmitRenewal} className="py-2 space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* Section 1: Thông tin chứng nhận hiện tại */}
              <div className="space-y-2 pb-3 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-900 mb-2">Thông tin chứng nhận hiện tại</h4>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Tên chứng nhận</span>
                  <span className="font-bold text-gray-900">{renewingCert.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Số hiệu hiện tại</span>
                  <span className="font-bold text-gray-900">{renewingCert.certNumber}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Ngày cấp</span>
                  <span className="font-bold text-gray-900">{renewingCert.issueDate}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Ngày hết hạn</span>
                  <span className="font-bold text-rose-500">{renewingCert.expiryDate}</span>
                </div>
              </div>

              {/* Section 2: Thông tin gia hạn */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-900">Thông tin gia hạn</h4>

                {/* Thời gian gia hạn */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Thời gian gia hạn</label>
                  <select
                    value={renewDuration}
                    onChange={(e) => {
                      const newDur = e.target.value;
                      setRenewDuration(newDur);
                      setRenewRequestedExpiryDate(calculateRenewExpiry(renewStartDate, newDur));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-white font-medium text-gray-800 focus:outline-emerald-600 cursor-pointer"
                  >
                    <option value="1">1 năm</option>
                    <option value="2">2 năm</option>
                    <option value="3">3 năm</option>
                    <option value="0.5">6 tháng</option>
                  </select>
                </div>

                {/* Ngày bắt đầu hiệu lực mới (dự kiến) */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Ngày bắt đầu hiệu lực mới (dự kiến)
                  </label>
                  <input
                    type="date"
                    value={renewStartDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setRenewStartDate(newStart);
                      setRenewRequestedExpiryDate(calculateRenewExpiry(newStart, renewDuration));
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800 focus:outline-emerald-600"
                    required
                  />
                </div>

                {/* Ngày hết hạn mới (dự kiến) */}
                <div>
                  <label className="block text-gray-600 font-medium mb-0.5">
                    Ngày hết hạn mới (dự kiến)
                  </label>
                  <div className="text-emerald-700 font-bold text-sm tracking-wide">
                    {renewRequestedExpiryDate}
                  </div>
                </div>

                {/* Mã chứng nhận mới (nếu có) */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Mã chứng nhận mới (nếu có)
                  </label>
                  <input
                    type="text"
                    value={renewNewCertNumber}
                    onChange={(e) => setRenewNewCertNumber(e.target.value)}
                    placeholder="Để trống nếu giữ mã cũ"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800 focus:outline-emerald-600 placeholder:text-gray-400 font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Không tự tạo mã mới. Chỉ nhập khi tổ chức chứng nhận cấp mã khác.
                  </p>
                </div>

                {/* Đơn vị thực hiện gia hạn */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">
                    Đơn vị thực hiện gia hạn
                  </label>
                  <input
                    type="text"
                    value={renewIssuedBy}
                    onChange={(e) => setRenewIssuedBy(e.target.value)}
                    placeholder="VD: Tổ chức Chứng nhận Quốc tế Control Union"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800 focus:outline-emerald-600 placeholder:text-gray-400"
                  />
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Ghi chú</label>
                  <textarea
                    value={renewNote}
                    onChange={(e) => setRenewNote(e.target.value)}
                    placeholder="Nhập ghi chú về quá trình gia hạn..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-gray-800 focus:outline-emerald-600 placeholder:text-gray-400 resize-none"
                  />
                </div>

                {/* Section 3: Tài liệu chứng minh gia hạn */}
                <div className="border border-gray-200 rounded-2xl p-3.5 bg-white space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 text-xs">
                    <span className="text-gray-600">📎</span> Tài liệu chứng minh gia hạn
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Tải lên giấy chứng nhận mới hoặc biên bản đánh giá (PDF, JPG, PNG).
                  </p>

                  {renewProofImage ? (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={renewProofImage} alt="Chứng từ" className="w-10 h-10 object-cover rounded-lg border border-emerald-300" />
                        <span className="text-xs text-emerald-950 font-medium truncate max-w-xs">
                          {renewProofFileName || "Tài liệu gia hạn đính kèm"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRenewProofImage("");
                          setRenewProofFileName("");
                        }}
                        className="text-xs text-rose-600 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  ) : (
                    <label className="w-full py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:text-emerald-700 hover:border-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer bg-white transition-all shadow-2xs hover:bg-gray-50">
                      <span>⭡</span> {isUploadingRenewImage ? "Đang tải chứng từ..." : "Tải tài liệu lên"}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        disabled={isUploadingRenewImage}
                        onChange={handleRenewImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRenewModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRenewal || isUploadingRenewImage}
                    className="flex-1 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>✓</span> {isSubmittingRenewal ? "Đang gửi..." : "Gửi yêu cầu gia hạn"}
                  </button>
                </div>
                <p className="text-center text-[10px] text-gray-400 mt-2.5">
                  Hồ sơ gia hạn sẽ được gửi trực tiếp lên Quản trị viên (Admin) thẩm định.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL IN TEM NHÃN MÃ QR LÔ HÀNG CHUẨN GS1 */}
      <QrLabelModal
        isOpen={isPrintLabelModalOpen}
        onClose={() => setIsPrintLabelModalOpen(false)}
        lot={selectedLotForPrint}
      />
    </div>
  );
}

export default function FarmerPortalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Đang tải cổng Nông dân...</div>}>
      <FarmerPortalContent />
    </Suspense>
  );
}
