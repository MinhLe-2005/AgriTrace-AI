"use client";

import {
  AlertTriangle,
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Edit3,
  FileCheck,
  FileText,
  Filter,
  Globe,
  Home,
  Leaf,
  MapPin,
  Package,
  Phone,
  Plus,
  QrCode,
  Save,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/stores/toast-store";

// =========================================================================
// TYPES & DEFINITIONS
// =========================================================================

export type FarmItem = {
  id: string;
  code: string;
  name: string;
  owner: string;
  phone: string;
  address: string;
  province: string;
  areaHectares: number;
  certStandard: string;
  rating: number;
  activeBatchCount: number;
  isDefault?: boolean;
};

export type BatchItem = {
  code: string;
  farmCode: string;
  product: string;
  plantingDate: string;
  harvestDate: string;
  expiryDate: string;
  qty: string;
  unit: string;
  status: "Chờ duyệt xuất kho" | "Đã duyệt xuất kho" | "Đang lưu kho lạnh" | "Đang chăm sóc";
  statusColor: string;
  cert: string;
  cultivation: string;
};

export type FarmingLogItem = {
  id: string;
  batchCode: string;
  date: string;
  stage: "Gieo hạt" | "Bón phân" | "Tưới tiêu" | "Phun sinh học" | "Thu hoạch";
  action: string;
  materialsUsed?: string;
  notes?: string;
};

export type ProductItem = {
  id: string;
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
  name: string;
  certNumber: string;
  issuedBy: string;
  issueDate: string;
  expiryDate: string;
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED";
  daysLeft: number;
};

export default function FarmerPortalPage() {
  // 5 Tab nghiệp vụ rõ ràng, tách riêng "Quản Lý Nông Trại" lên vị trí nổi bật
  const [activeTab, setActiveTab] = useState<"farms" | "batches" | "logs" | "products" | "certs">("farms");

  // =========================================================================
  // 1. DỮ LIỆU QUẢN LÝ NÔNG TRẠI (Quản lý nhiều nông trại canh tác)
  // =========================================================================
  const [farms, setFarms] = useState<FarmItem[]>([
    {
      id: "f1",
      code: "NT-DL-01",
      name: "Nông Trại Xanh Đà Lạt",
      owner: "Bác Nguyễn Văn Hùng",
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
      phone: "0912 345 678",
      address: "Xã Mỹ Xương, Huyện Cao Lãnh",
      province: "Đồng Tháp",
      areaHectares: 3.2,
      certStandard: "VietGAP Trồng trọt",
      rating: 4.8,
      activeBatchCount: 1,
      isDefault: false,
    },
  ]);

  // Nông trại đang được chọn làm việc
  const [selectedFarmId, setSelectedFarmId] = useState<string>("f1");
  const currentFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];

  // Modal Thêm Nông Trại Mới
  const [isAddFarmModalOpen, setIsAddFarmModalOpen] = useState(false);
  const [newFarmName, setNewFarmName] = useState("");
  const [newFarmCode, setNewFarmCode] = useState("NT-LH-03");
  const [newFarmOwner, setNewFarmOwner] = useState(farms[0]?.owner || "Bác Nguyễn Văn Hùng");
  const [newFarmPhone, setNewFarmPhone] = useState(farms[0]?.phone || "0912 345 678");
  const [newFarmAddress, setNewFarmAddress] = useState("");
  const [newFarmProvince, setNewFarmProvince] = useState("Lâm Đồng");
  const [newFarmArea, setNewFarmArea] = useState("2.5");
  const [newFarmCert, setNewFarmCert] = useState("VietGAP");

  // Modal Sửa Nông Trại
  const [editingFarm, setEditingFarm] = useState<FarmItem | null>(null);

  // =========================================================================
  // 2. DỮ LIỆU LÔ THU HOẠCH
  // =========================================================================
  const [batches, setBatches] = useState<BatchItem[]>([
    {
      code: "XC-2026-01",
      farmCode: "NT-DT-02",
      product: "Xoài Cát Chu Cao Lãnh",
      plantingDate: "10/05/2026",
      harvestDate: "15/10/2026",
      expiryDate: "30/10/2026",
      qty: "1200",
      unit: "kg",
      status: "Đã duyệt xuất kho",
      statusColor: "#10b981",
      cert: "VietGAP",
      cultivation: "Bao trái hữu cơ, thu hoạch đợt 1",
    },
    {
      code: "XC-2026-02",
      farmCode: "NT-DT-02",
      product: "Xoài Cát Chu Cao Lãnh",
      plantingDate: "10/05/2026",
      harvestDate: "27/10/2026",
      expiryDate: "11/11/2026",
      qty: "850",
      unit: "kg",
      status: "Chờ duyệt xuất kho",
      statusColor: "#f97316",
      cert: "VietGAP",
      cultivation: "Đợt thu hoạch 2 - Trái chín độ 85%",
    },
    {
      code: "SR-2026-01",
      farmCode: "NT-DL-01",
      product: "Sầu Riêng Ri6 Chín Cây",
      plantingDate: "01/01/2026",
      harvestDate: "20/10/2026",
      expiryDate: "05/11/2026",
      qty: "500",
      unit: "kg",
      status: "Đang lưu kho lạnh",
      statusColor: "#3b82f6",
      cert: "GlobalGAP",
      cultivation: "Hữu cơ sinh học, bảo quản kho mát",
    },
    {
      code: "DT-2026-03",
      farmCode: "NT-DL-01",
      product: "Dâu Tây Giống Nhật",
      plantingDate: "15/08/2026",
      harvestDate: "28/10/2026 (Dự kiến)",
      expiryDate: "05/11/2026",
      qty: "200",
      unit: "hộp 500g",
      status: "Đang chăm sóc",
      statusColor: "#f59e0b",
      cert: "VietGAP",
      cultivation: "Nhà màng công nghệ cao",
    },
  ]);

  const [activeFilter, setActiveFilter] = useState<string>("Tất cả");
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Form State tạo Lô mới
  const todayStr = new Date().toISOString().split("T")[0];
  const [formProduct, setFormProduct] = useState("Xoài Cát Chu Cao Lãnh");
  const [formLotCode, setFormLotCode] = useState("XC-2026-03");
  const [formPlantingDate, setFormPlantingDate] = useState("2026-05-10");
  const [formHarvestDate, setFormHarvestDate] = useState(todayStr);
  const [formExpiryDate, setFormExpiryDate] = useState("2026-11-15");
  const [formQty, setFormQty] = useState("500");
  const [formUnit, setFormUnit] = useState("kg");
  const [formCert, setFormCert] = useState("VietGAP");
  const [formCultivation, setFormCultivation] = useState("Quy trình an toàn VietGAP");
  const [formStatus, setFormStatus] = useState<BatchItem["status"]>("Chờ duyệt xuất kho");

  // =========================================================================
  // 3. DỮ LIỆU NHẬT KÝ CANH TÁC
  // =========================================================================
  const [farmingLogs, setFarmingLogs] = useState<FarmingLogItem[]>([
    {
      id: "l1",
      batchCode: "XC-2026-02",
      date: "15/07/2026",
      stage: "Bón phân",
      action: "Bón phân hữu cơ vi sinh đợt 2",
      materialsUsed: "Phân bón trùn quế hữu cơ O-Micro",
      notes: "Tỷ lệ bón 2kg/gốc, tưới ẩm đất",
    },
    {
      id: "l2",
      batchCode: "XC-2026-02",
      date: "20/08/2026",
      stage: "Phun sinh học",
      action: "Bao trái và phun dung dịch xua đuổi ruồi vàng thảo mộc",
      materialsUsed: "Chế phẩm sinh học tỏi - ớt - gừng lên men",
      notes: "Cách ly an toàn 100% không dùng hóa chất độc hại",
    },
    {
      id: "l3",
      batchCode: "XC-2026-02",
      date: "27/10/2026",
      stage: "Thu hoạch",
      action: "Thu hoạch đợt 2 sáng sớm, phân loại trái",
      materialsUsed: "Dụng cụ khử trùng, thùng lót giấy mềm",
      notes: "Trái đạt chuẩn độ ngọt, chuyển gửi Admin duyệt",
    },
    {
      id: "l4",
      batchCode: "SR-2026-01",
      date: "10/09/2026",
      stage: "Tưới tiêu",
      action: "Tưới nước nhỏ giọt tự động kiểm soát EC và pH",
      materialsUsed: "Nguồn nước sạch ngầm",
      notes: "Độ pH ổn định 6.2",
    },
  ]);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedBatchForLog, setSelectedBatchForLog] = useState(batches[0]?.code || "");
  const [logDate, setLogDate] = useState(todayStr);
  const [logStage, setLogStage] = useState<FarmingLogItem["stage"]>("Bón phân");
  const [logAction, setLogAction] = useState("");
  const [logMaterials, setLogMaterials] = useState("");
  const [logNotes, setLogNotes] = useState("");

  // =========================================================================
  // 4. DỮ LIỆU SẢN PHẨM NÔNG NGHIỆP
  // =========================================================================
  const [products, setProducts] = useState<ProductItem[]>([
    {
      id: "p1",
      name: "Xoài Cát Chu Cao Lãnh",
      category: "Trái Cây Đặc Sản",
      price: 65000,
      unit: "kg",
      description: "Xoài Cát Chu thịt dày, thơm ngọt đậm đà canh tác chuẩn VietGAP",
      origin: "Vườn Cây Ăn Trái Cao Lãnh",
      image: "🥭",
    },
    {
      id: "p2",
      name: "Thanh Long Ruột Đỏ",
      category: "Trái Cây Đặc Sản",
      price: 45000,
      unit: "kg",
      description: "Thanh long mọng nước, vị ngọt thanh tự nhiên",
      origin: "Nông Trại Xanh Đà Lạt",
      image: "🐉",
    },
    {
      id: "p3",
      name: "Sầu Riêng Ri6 Chín Cây",
      category: "Trái Cây Cao Cấp",
      price: 135000,
      unit: "kg",
      description: "Cơm vàng hạt lép, thu hoạch độ chín hoàn hảo tại vườn",
      origin: "Nông Trại Xanh Đà Lạt",
      image: "👑",
    },
    {
      id: "p4",
      name: "Dâu Tây Giống Nhật",
      category: "Trái Cây Đặc Sản",
      price: 180000,
      unit: "hộp 500g",
      description: "Dâu tây canh tác giá thể xơ dừa nhà màng, vị ngọt thơm dịu",
      origin: "Nông Trại Xanh Đà Lạt",
      image: "🍓",
    },
  ]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Trái Cây Đặc Sản");
  const [newProdPrice, setNewProdPrice] = useState("75000");
  const [newProdUnit, setNewProdUnit] = useState("kg");
  const [newProdDesc, setNewProdDesc] = useState("");

  // =========================================================================
  // 5. DỮ LIỆU CHỨNG NHẬN
  // =========================================================================
  const [certifications, setCertifications] = useState<CertificationItem[]>([
    {
      id: "c1",
      farmCode: "NT-DL-01",
      name: "Chứng nhận GlobalGAP",
      certNumber: "GG-91024-VN",
      issuedBy: "Tổ chức Chứng nhận Quốc tế Control Union",
      issueDate: "15/01/2026",
      expiryDate: "15/01/2027",
      status: "VALID",
      daysLeft: 79,
    },
    {
      id: "c2",
      farmCode: "NT-DL-01",
      name: "Chứng nhận VietGAP Trồng trọt",
      certNumber: "VG-49-2026-LD",
      issuedBy: "Chi cục Quản lý Chất lượng Nông Lâm Sản Lâm Đồng",
      issueDate: "20/11/2025",
      expiryDate: "20/11/2026",
      status: "EXPIRING_SOON",
      daysLeft: 23,
    },
    {
      id: "c3",
      farmCode: "NT-DT-02",
      name: "Chứng nhận VietGAP Cây Ăn Trái",
      certNumber: "VG-66-2026-DT",
      issuedBy: "Sở Nông nghiệp & PTNT Đồng Tháp",
      issueDate: "10/03/2026",
      expiryDate: "10/03/2027",
      status: "VALID",
      daysLeft: 133,
    },
  ]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  // Thêm Nông Trại mới
  const handleCreateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmName.trim()) {
      toast.error("Vui lòng nhập tên nông trại!");
      return;
    }

    const newFarm: FarmItem = {
      id: "f_" + Date.now(),
      code: newFarmCode.trim().toUpperCase(),
      name: newFarmName.trim(),
      owner: newFarmOwner.trim(),
      phone: newFarmPhone.trim(),
      address: newFarmAddress.trim(),
      province: newFarmProvince.trim(),
      areaHectares: Number(newFarmArea) || 1.0,
      certStandard: newFarmCert,
      rating: 5.0,
      activeBatchCount: 0,
    };

    setFarms([...farms, newFarm]);
    setIsAddFarmModalOpen(false);
    setNewFarmName("");
    setNewFarmAddress("");
    toast.success(`Đã thêm thành công trang trại "${newFarm.name}" (Mã: ${newFarm.code})!`);
  };

  // Cập nhật Nông Trại
  const handleUpdateFarm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFarm) return;

    setFarms(farms.map((f) => (f.id === editingFarm.id ? editingFarm : f)));
    setEditingFarm(null);
    toast.success(`Đã cập nhật thông tin trang trại "${editingFarm.name}"!`);
  };

  // Xóa Nông Trại
  const handleDeleteFarm = (id: string, name: string) => {
    if (farms.length <= 1) {
      toast.error("Hệ thống yêu cầu duy trì ít nhất 1 nông trại!");
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa nông trại "${name}"?`)) {
      setFarms(farms.filter((f) => f.id !== id));
      if (selectedFarmId === id) {
        setSelectedFarmId(farms[0].id);
      }
      toast.info(`Đã xóa nông trại ${name}`);
    }
  };

  // Sinh mã lô tự động
  const handleProductSelect = (productName: string) => {
    setFormProduct(productName);
    const words = productName.split(" ");
    let prefix = "AG";
    if (words.length >= 2) {
      prefix = (words[0][0] + words[1][0]).toUpperCase();
    }
    const rand = Math.floor(Math.random() * 80) + 10;
    setFormLotCode(`${prefix}-2026-${rand}`);
  };

  const handleOpenCreateBatch = () => {
    handleProductSelect(products[0]?.name || "Xoài Cát Chu");
    setIsBatchModalOpen(true);
  };

  // Nộp form tạo Lô thu hoạch
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLotCode.trim()) {
      toast.error("Vui lòng nhập mã lô thu hoạch!");
      return;
    }

    let color = "#10b981";
    if (formStatus === "Chờ duyệt xuất kho") color = "#f97316";
    if (formStatus === "Đang chăm sóc") color = "#f59e0b";
    if (formStatus === "Đang lưu kho lạnh") color = "#3b82f6";

    const formatDisplayDate = (dStr: string) => {
      if (!dStr) return "";
      const p = dStr.split("-");
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : dStr;
    };

    const newBatch: BatchItem = {
      code: formLotCode.trim().toUpperCase(),
      farmCode: currentFarm.code,
      product: formProduct,
      plantingDate: formatDisplayDate(formPlantingDate),
      harvestDate: formatDisplayDate(formHarvestDate),
      expiryDate: formatDisplayDate(formExpiryDate),
      qty: formQty,
      unit: formUnit,
      status: formStatus,
      statusColor: color,
      cert: formCert,
      cultivation: formCultivation,
    };

    setBatches([newBatch, ...batches]);
    setIsBatchModalOpen(false);
    toast.success(`Đã tạo thành công lô ${newBatch.code} cho ${currentFarm.name}!`);
  };

  // Ghi nhật ký canh tác
  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logAction.trim()) {
      toast.error("Vui lòng nhập nội dung công việc canh tác!");
      return;
    }

    const formatDisplayDate = (dStr: string) => {
      const p = dStr.split("-");
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : dStr;
    };

    const newLog: FarmingLogItem = {
      id: "l_" + Date.now(),
      batchCode: selectedBatchForLog,
      date: formatDisplayDate(logDate),
      stage: logStage,
      action: logAction.trim(),
      materialsUsed: logMaterials.trim(),
      notes: logNotes.trim(),
    };

    setFarmingLogs([newLog, ...farmingLogs]);
    setIsLogModalOpen(false);
    setLogAction("");
    setLogMaterials("");
    setLogNotes("");
    toast.success(`Đã ghi nhật ký canh tác cho lô ${selectedBatchForLog}!`);
  };

  // Thêm Sản phẩm mới
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) {
      toast.error("Vui lòng nhập tên sản phẩm!");
      return;
    }

    const newProd: ProductItem = {
      id: "p_" + Date.now(),
      name: newProdName.trim(),
      category: newProdCategory,
      price: Number(newProdPrice) || 50000,
      unit: newProdUnit,
      description: newProdDesc.trim() || "Nông sản sạch canh tác theo quy chuẩn tự nhiên",
      origin: currentFarm.name,
      image: "🌱",
    };

    setProducts([...products, newProd]);
    setIsProductModalOpen(false);
    setNewProdName("");
    setNewProdDesc("");
    toast.success(`Đã thêm sản phẩm "${newProd.name}" vào danh mục trang trại!`);
  };

  const filteredBatches =
    activeFilter === "Tất cả"
      ? batches
      : batches.filter((b) => b.status.toLowerCase().includes(activeFilter.toLowerCase()));

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
              const rand = Math.floor(Math.random() * 80) + 20;
              setNewFarmCode(`NT-VN-0${farms.length + 1}`);
              setIsAddFarmModalOpen(true);
            }}
            className="px-3.5 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-emerald-700/60 transition-all cursor-pointer"
          >
            <Plus size={15} /> Thêm Nông Trại
          </button>
          <button
            onClick={handleOpenCreateBatch}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all transform active:scale-95 cursor-pointer"
          >
            <Plus size={16} /> Tạo Lô Thu Hoạch
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs (5 Khối nghiệp vụ chuẩn bài nói, QUẢN LÝ NÔNG TRẠI đứng đầu tiên) */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab("farms")}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "farms"
              ? "border-emerald-600 text-emerald-800 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Home size={16} /> Quản Lý Nông Trại
          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full">
            {farms.length} Trang trại
          </span>
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
            {batches.length} Lô
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
            {farmingLogs.length} Ghi chép
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
            {products.length} Loại
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
          {certifications.some((c) => c.status === "EXPIRING_SOON") && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold animate-pulse">
              ⚠️ Sắp hết hạn
            </span>
          )}
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
              onClick={() => {
                setNewFarmCode(`NT-VN-0${farms.length + 1}`);
                setIsAddFarmModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Thêm Nông Trại Mới
            </button>
          </div>

          {/* Grid Cards Nông Trại */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {farms.map((farm) => {
              const isSelected = farm.id === selectedFarmId;
              return (
                <div
                  key={farm.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isSelected ? "border-emerald-600 ring-2 ring-emerald-500/20" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Mã: {farm.code}
                      </span>
                      <span className="text-emerald-700 bg-emerald-100 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={11} /> Đang quản lý
                      </span>
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
                          {batches.filter((b) => b.farmCode === farm.code).length} Lô
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

                  <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
                    <button
                      onClick={() => setEditingFarm({ ...farm })}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 size={13} /> Sửa thông tin
                    </button>
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
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUẢN LÝ LÔ THU HOẠCH */}
      {/* ========================================================================= */}
      {activeTab === "batches" && (
        <div className="space-y-5">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-gray-500 font-semibold uppercase">Tổng sản lượng quản lý</div>
              <div className="text-xl font-extrabold text-gray-900 mt-1">2,750 kg</div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Xoài, Sầu riêng, Dâu tây</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-gray-500 font-semibold uppercase">Lô đã Admin duyệt</div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">
                {batches.filter((b) => b.status === "Đã duyệt xuất kho").length} Lô
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Sẵn sàng xuất bán / nhập kho</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-amber-700 font-semibold uppercase">Chờ Admin thẩm định</div>
              <div className="text-xl font-extrabold text-amber-600 mt-1">
                {batches.filter((b) => b.status === "Chờ duyệt xuất kho").length} Lô
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Đang chờ phê duyệt</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="text-[11px] text-blue-700 font-semibold uppercase">Đang lưu kho lạnh</div>
              <div className="text-xl font-extrabold text-blue-600 mt-1">
                {batches.filter((b) => b.status === "Đang lưu kho lạnh").length} Lô
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Theo dõi hạn theo FEFO</div>
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#1a7a3a]" />
                <h3 className="font-bold text-sm text-gray-900">Danh Sách Các Đợt Thu Hoạch Theo Lô</h3>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Filter size={13} className="text-gray-400 mr-1" />
                {["Tất cả", "Chờ duyệt", "Đã duyệt", "Kho lạnh", "Chăm sóc"].map((filter) => {
                  const isSelected = activeFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {filter}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 uppercase text-[10px] font-bold tracking-wider bg-gray-50/70">
                    <th className="py-3 px-3">Mã Lô</th>
                    <th className="py-3 px-3">Trang Trại</th>
                    <th className="py-3 px-3">Nông Sản</th>
                    <th className="py-3 px-3">Ngày Hái & Hạn Dùng</th>
                    <th className="py-3 px-3">Sản Lượng</th>
                    <th className="py-3 px-3">Chứng Nhận</th>
                    <th className="py-3 px-3">Trạng Thái Xử Lý</th>
                    <th className="py-3 px-3 text-right">Mã QR & Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredBatches.map((b) => (
                    <tr key={b.code} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#1a7a3a]">{b.code}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                          {b.farmCode}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-gray-900">{b.product}</div>
                        <div className="text-[10px] text-gray-400">{b.cultivation}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-gray-800 font-medium">Hái: {b.harvestDate}</div>
                        <div className="text-rose-600 font-semibold text-[11px]">HSD: {b.expiryDate}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-800">
                        {b.qty} {b.unit}
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">
                          {b.cert}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span style={{ color: b.statusColor }} className="font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.statusColor }} />
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedBatchForLog(b.code);
                              setIsLogModalOpen(true);
                            }}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <FileText size={12} /> Nhật ký
                          </button>
                          <Link
                            href={`/traceability?batch=${b.code}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1a7a3a] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100"
                          >
                            <QrCode size={13} /> QR
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa lô ${b.code}?`)) {
                                setBatches(batches.filter((item) => item.code !== b.code));
                                toast.info(`Đã xóa lô ${b.code}`);
                              }
                            }}
                            className="text-gray-400 hover:text-rose-600 p-1 rounded-md cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NHẬT KÝ CANH TÁC */}
      {/* ========================================================================= */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-700" /> Sổ Nhật Ký Canh Tác Điện Tử
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Lưu trữ lịch sử bón phân, tưới nước và chăm sóc cây làm bằng chứng phục vụ truy xuất nguồn gốc
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedBatchForLog(batches[0]?.code || "");
                setIsLogModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Thêm Ghi Chép Mới
            </button>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            {farmingLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-3.5 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  {log.stage === "Gieo hạt" && "🌱"}
                  {log.stage === "Bón phân" && "🍂"}
                  {log.stage === "Tưới tiêu" && "💧"}
                  {log.stage === "Phun sinh học" && "🛡️"}
                  {log.stage === "Thu hoạch" && "🧺"}
                </div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {log.batchCode}
                      </span>
                      <span className="font-bold text-gray-900 text-sm">{log.action}</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        Giai đoạn: {log.stage}
                      </span>
                    </div>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock size={12} /> {log.date}
                    </span>
                  </div>

                  {log.materialsUsed && (
                    <p className="text-gray-600 mt-1">
                      <strong>Vật tư / Chế phẩm:</strong> {log.materialsUsed}
                    </p>
                  )}
                  {log.notes && <p className="text-gray-400 mt-0.5 italic">Ghi chú: {log.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: QUẢN LÝ SẢN PHẨM */}
      {/* ========================================================================= */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Sprout size={18} className="text-emerald-700" /> Danh Mục Nông Sản Nông Trại
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Quản lý các loại trái cây và nông sản đặc sản do nông dân trực tiếp canh tác
              </p>
            </div>
            <button
              onClick={() => setIsProductModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} /> Thêm Sản Phẩm Mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-all">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-2xl mb-3 border border-emerald-100">
                    {p.image}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {p.category}
                  </span>
                  <h4 className="font-bold text-sm text-gray-900 mt-2">{p.name}</h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between">
                  <div className="text-sm font-extrabold text-[#1a7a3a]">
                    {p.price.toLocaleString("vi-VN")} đ <span className="text-xs font-normal text-gray-400">/{p.unit}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleProductSelect(p.name);
                      setIsBatchModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-lg border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                  >
                    + Tạo Lô
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: CHỨNG NHẬN & CẢNH BÁO */}
      {/* ========================================================================= */}
      {activeTab === "certs" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Award size={18} className="text-emerald-700" /> Hệ Thống Quản Lý Chứng Nhận Chất Lượng
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Theo dõi hiệu lực chứng chỉ VietGAP & GlobalGAP, tự động cảnh báo khi chứng chỉ sắp hết hạn
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className={`p-5 rounded-2xl border text-xs flex flex-col justify-between ${
                  cert.status === "EXPIRING_SOON"
                    ? "bg-amber-50/60 border-amber-300 text-amber-950 shadow-sm"
                    : "bg-white border-gray-200 text-gray-900 shadow-xs"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                      Trang trại: {cert.farmCode}
                    </span>
                    {cert.status === "EXPIRING_SOON" ? (
                      <span className="bg-amber-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle size={10} /> Còn {cert.daysLeft} ngày
                      </span>
                    ) : (
                      <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                        Hiệu lực ({cert.daysLeft} ngày)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 mt-1">{cert.name}</h4>
                  <div className="text-gray-600">Số hiệu: <strong>{cert.certNumber}</strong></div>
                  <div className="text-gray-500">Đơn vị cấp: {cert.issuedBy}</div>
                </div>

                <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between font-semibold text-[11px]">
                  <span className="text-gray-500">Ngày cấp: {cert.issueDate}</span>
                  <span className="text-rose-600 font-bold">Hết hạn: {cert.expiryDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM NÔNG TRẠI MỚI */}
      {/* ========================================================================= */}
      {isAddFarmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Khai Báo Nông Trại Canh Tác Mới</h3>
              </div>
              <button onClick={() => setIsAddFarmModalOpen(false)} className="text-emerald-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="p-6 space-y-4 text-xs">
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
                  <option value="VietGAP">VietGAP Trồng trọt</option>
                  <option value="GlobalGAP">GlobalGAP Xuất khẩu</option>
                  <option value="Organic USDA">Hữu cơ Organic USDA</option>
                  <option value="OCOP 4 Sao">OCOP Đặc sản địa phương</option>
                </select>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save size={15} /> Lưu Nông Trại
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
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
              <div>
                <label className="block text-gray-700 font-bold mb-1">Tên Nông Trại</label>
                <input
                  type="text"
                  value={editingFarm.name}
                  onChange={(e) => setEditingFarm({ ...editingFarm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Quy mô (Hecta)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingFarm.areaHectares}
                    onChange={(e) => setEditingFarm({ ...editingFarm, areaHectares: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tiêu chuẩn canh tác</label>
                  <input
                    type="text"
                    value={editingFarm.certStandard}
                    onChange={(e) => setEditingFarm({ ...editingFarm, certStandard: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Địa chỉ cụ thể</label>
                <input
                  type="text"
                  value={editingFarm.address}
                  onChange={(e) => setEditingFarm({ ...editingFarm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
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
      {/* MODAL: TẠO LÔ THU HOẠCH MỚI */}
      {/* ========================================================================= */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-400" />
                <h3 className="text-sm font-bold">Khai Báo Lô Thu Hoạch Nông Sản Mới</h3>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-emerald-300 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-medium">
                🌱 Thu hoạch tại trang trại: <strong>{currentFarm.name}</strong> ({currentFarm.code})
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Chọn nông sản thu hoạch *</label>
                  <select
                    value={formProduct}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Mã Lô (Tự sinh hoặc sửa) *</label>
                  <input
                    type="text"
                    value={formLotCode}
                    onChange={(e) => setFormLotCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl font-mono font-bold text-emerald-800 uppercase"
                    required
                  />
                </div>
              </div>

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
                      <option value="tạ">tạ</option>
                      <option value="tấn">tấn</option>
                      <option value="hộp">hộp</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Tiêu chuẩn</label>
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

              <div>
                <label className="block text-gray-700 font-bold mb-1">Trạng thái gửi lên hệ thống</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as BatchItem["status"])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-medium"
                >
                  <option value="Chờ duyệt xuất kho">Chờ duyệt xuất kho (Gửi Admin thẩm định)</option>
                  <option value="Đang chăm sóc">Đang chăm sóc tại vườn</option>
                  <option value="Đã duyệt xuất kho">Đã duyệt xuất kho</option>
                </select>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <CheckCircle2 size={16} /> Lưu & Cấp Mã QR
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Chọn Lô Canh Tác *</label>
                  <select
                    value={selectedBatchForLog}
                    onChange={(e) => setSelectedBatchForLog(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white font-mono font-bold text-emerald-800"
                  >
                    {batches.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} ({b.product})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ngày thực hiện *</label>
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
                <label className="block text-gray-700 font-bold mb-1">Giai đoạn chăm sóc</label>
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
                <label className="block text-gray-700 font-bold mb-1">Công việc đã thực hiện *</label>
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
                <label className="block text-gray-700 font-bold mb-1">Vật tư / Chế phẩm sử dụng</label>
                <input
                  type="text"
                  value={logMaterials}
                  onChange={(e) => setLogMaterials(e.target.value)}
                  placeholder="VD: Phân hữu cơ trùn quế, chế phẩm tỏi ớt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Ghi chú bổ sung</label>
                <textarea
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  rows={2}
                  placeholder="Tình trạng sinh trưởng, thời tiết..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl"
                />
              </div>

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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save size={15} /> Lưu Nhật Ký
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
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
              <div>
                <label className="block text-gray-700 font-bold mb-1">Tên nông sản *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="VD: Xoài Cát Chu, Sầu Riêng Ri6..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Phân loại</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white"
                  >
                    <option value="Trái Cây Đặc Sản">Trái Cây Đặc Sản</option>
                    <option value="Trái Cây Cao Cấp">Trái Cây Cao Cấp</option>
                    <option value="Rau Củ Hữu Cơ">Rau Củ Hữu Cơ</option>
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
                  rows={3}
                  placeholder="Hương vị, tiêu chuẩn thu hoạch..."
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus size={15} /> Thêm Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
