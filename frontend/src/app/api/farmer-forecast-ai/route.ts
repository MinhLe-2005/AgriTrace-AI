import { NextRequest, NextResponse } from "next/server";

type ForecastItemSummary = {
  productName: string;
  unit: string;
  currentSupply: number;
  predictedDemand: number;
  supplyGap: number;
  recommendedPrepQty: number;
  seasonPhase: string;
  riskStatus: string;
  growthPercent: number;
  activeCampaignTitle?: string | null;
};

type ForecastContextPayload = {
  horizonDays: number;
  currentSeasonName: string;
  totalPredictedDemand: number;
  totalAvailableSupply: number;
  deficitCount: number;
  surplusCount: number;
  items: ForecastItemSummary[];
};

function buildDeterministicAdvisorReply(forecast: ForecastContextPayload, question: string): string {
  const q = question.toLowerCase();
  const deficits = forecast.items.filter((i) => i.riskStatus === "DEFICIT");
  const surpluses = forecast.items.filter((i) => i.riskStatus === "SURPLUS");
  const topDemand = [...forecast.items].sort((a, b) => b.predictedDemand - a.predictedDemand).slice(0, 3);

  const lines: string[] = [
    `**Phân tích AI cho kế hoạch ${forecast.horizonDays} ngày tới (${forecast.currentSeasonName}):**`,
    `- **Tổng sức mua dự báo:** ~${Math.round(forecast.totalPredictedDemand)} đơn vị sản phẩm · **Nguồn cung sẵn có:** ~${Math.round(forecast.totalAvailableSupply)} đơn vị.`,
  ];

  if (q.includes("dư") || q.includes("tồn") || (surpluses.length > 0 && !q.includes("thiếu"))) {
    if (surpluses.length > 0) {
      lines.push(
        `- **Xử lý nguy cơ dư thừa (${surpluses.length} nông sản):** ${surpluses
          .map(
            (s) =>
              `**${s.productName}** (đang dư ~${Math.round(s.supplyGap)} ${s.unit}, ${s.seasonPhase})`
          )
          .join("; ")}.`,
        `- **Khuyến nghị điều phối:** Tạm giãn nhịp thu hoạch luống mới 5–7 ngày, ưu tiên xuất kho theo nguyên tắc FEFO và tạo Voucher giảm 10–15% để đẩy lượng hàng tồn.`
      );
    } else {
      lines.push("- **Nguy cơ dư thừa:** Hiện chưa ghi nhận mặt hàng nào bị tồn vượt ngưỡng an toàn trong chu kỳ tới.");
    }
  }

  if (deficits.length > 0) {
    lines.push(
      `- **Ưu tiên tăng sản lượng & thu hoạch (${deficits.length} nông sản thiếu cung):** ${deficits
        .map(
          (d) =>
            `**${d.productName}** cần chuẩn bị thêm ~**${Math.round(d.recommendedPrepQty)} ${d.unit}** (dự báo cần ${Math.round(d.predictedDemand)} ${d.unit}, hiện có ${Math.round(d.currentSupply)} ${d.unit})`
        )
        .join("; ")}.`
    );
  } else {
    lines.push(
      `- **Nhóm sản phẩm chủ lực sức mua cao:** ${topDemand
        .map((t) => `**${t.productName}** (~${Math.round(t.predictedDemand)} ${t.unit}, xu hướng ${t.growthPercent >= 0 ? "+" : ""}${t.growthPercent}%)`)
        .join(", ")}.`
    );
  }

  lines.push(
    `- **Hành động gợi ý ngay:** Bấm nút **"Lập Lô Thu Hoạch"** ở các dòng cảnh báo thiếu hàng để lên lịch thu hái và gắn mã QR truy xuất kịp thời.`
  );

  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const forecast = body?.forecast as ForecastContextPayload | undefined;
    const question = typeof body?.question === "string" && body.question.trim()
      ? body.question.trim()
      : "Tư vấn kế hoạch gieo trồng và thu hoạch tối ưu dựa trên số liệu dự báo hiện tại.";

    if (!forecast || !Array.isArray(forecast.items)) {
      return NextResponse.json({ error: "Forecast payload is required." }, { status: 400 });
    }

    const rawKey = process.env.GEMINI_API_KEY?.trim() || process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
    const isAiStudioKey = typeof rawKey === "string" && rawKey.startsWith("AIza");

    if (!rawKey || !isAiStudioKey) {
      return NextResponse.json({
        advice: buildDeterministicAdvisorReply(forecast, question),
        model: "agritrace-forecast-engine",
      });
    }

    const compactContext = {
      horizonDays: forecast.horizonDays,
      season: forecast.currentSeasonName,
      totalDemand: forecast.totalPredictedDemand,
      totalSupply: forecast.totalAvailableSupply,
      items: forecast.items.slice(0, 12).map((i) => ({
        name: i.productName,
        unit: i.unit,
        supply: i.currentSupply,
        demand: i.predictedDemand,
        gap: i.supplyGap,
        prep: i.recommendedPrepQty,
        season: i.seasonPhase,
        status: i.riskStatus,
        campaign: i.activeCampaignTitle || null,
      })),
    };

    const promptText = `Bạn là Chuyên gia AI Nông Nghiệp của AgriTrace AI. Hãy tư vấn ngắn gọn, thực tế bằng tiếng Việt (tối đa 5 gạch đầu dòng, dùng con số cụ thể từ dữ liệu) cho chủ nông trại dựa trên dữ liệu dự báo thật sau đây:\nDỮ LIỆU DỰ BÁO:\n${JSON.stringify(compactContext)}\n\nCÂU HỎI CỦA NÔNG DÂN: ${question}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${rawKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        return NextResponse.json({ advice: text, model: "gemini-2.0-flash" });
      }
    }

    return NextResponse.json({
      advice: buildDeterministicAdvisorReply(forecast, question),
      model: "agritrace-forecast-engine",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: "SERVER_ERROR", message }, { status: 500 });
  }
}
