import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { QuotePDF } from "@/components/pdf/quote-document";
import React from "react";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote } = await supabase
    .from("quotes")
    .select("*, clients(*), quote_items(*), businesses(*)")
    .eq("id", id)
    .single();

  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });

  quote.quote_items = (quote.quote_items || []).sort(
    (a: any, b: any) => a.sort_order - b.sort_order
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(QuotePDF, { quote }) as any);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cotizacion-${quote.number}.pdf"`,
    },
  });
}
