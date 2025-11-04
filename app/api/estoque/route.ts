import { NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL =
  "";

const SHEET_ID = "1-63Zw_i7_ldl7rNXj2CBs70XtdRmdedDQUpdgUdV77w";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { produtoId, disponivel } = body;

    const data = [
      new Date().toLocaleString("pt-BR"),
      produtoId,
      disponivel ? "Disponível" : "Indisponível",
    ];

    const res = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "appendRow",
        spreadsheetId: SHEET_ID,
        range: "Estoque",
        data,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Erro na API do Google" }, { status: 500 });
    }

    const json = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, googleResponse: json });
  } catch (err: any) {
    console.error("❌ Erro ao enviar para Sheets:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
