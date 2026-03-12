"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  quoteId: string;
  brandColor: string;
}

export default function PublicQuoteActions({ quoteId, brandColor }: Props) {
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);
  const [done, setDone] = useState<"accept" | "reject" | null>(null);

  async function handle(action: "accept" | "reject") {
    setLoading(action);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) setDone(action);
    } catch {}
    setLoading(null);
  }

  if (done === "accept") return (
    <div className="text-center p-6 bg-green-50 rounded-xl">
      <div className="text-green-600 font-semibold text-lg">✓ Cotización aceptada</div>
      <div className="text-green-500 text-sm mt-1">Gracias por tu confirmación. Nos pondremos en contacto contigo pronto.</div>
    </div>
  );

  if (done === "reject") return (
    <div className="text-center p-6 bg-red-50 rounded-xl">
      <div className="text-red-600 font-semibold">Cotización rechazada</div>
    </div>
  );

  return (
    <div className="flex gap-4 justify-center p-6 border-t">
      <Button
        className="px-8 text-white"
        style={{ backgroundColor: brandColor }}
        onClick={() => handle("accept")}
        disabled={loading !== null}
      >
        <CheckCircle className="w-4 h-4 mr-2" />
        {loading === "accept" ? "Procesando..." : "Aceptar cotización"}
      </Button>
      <Button
        variant="outline"
        className="px-8 text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => handle("reject")}
        disabled={loading !== null}
      >
        <XCircle className="w-4 h-4 mr-2" />
        {loading === "reject" ? "Procesando..." : "Rechazar"}
      </Button>
    </div>
  );
}
