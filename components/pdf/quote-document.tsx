import React from "react";
import {
  Document, Page, Text, View, StyleSheet, Image, Font,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: "#1f2937", backgroundColor: "#ffffff", padding: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 },
  logoBox: { width: 120, height: 48, objectFit: "contain" },
  companyName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#1f2937" },
  quoteTitleBlock: { alignItems: "flex-end" },
  quoteTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#6366f1" },
  quoteNum: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  metaRow: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  fromToRow: { flexDirection: "row", gap: 32, marginBottom: 24 },
  fromTo: { flex: 1 },
  name: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1f2937", marginBottom: 2 },
  detail: { fontSize: 9, color: "#6b7280", marginBottom: 1 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", padding: "6 8", borderRadius: 4, marginBottom: 2 },
  tableHeaderCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#6b7280", textTransform: "uppercase" },
  tableRow: { flexDirection: "row", padding: "8 8", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tableCell: { fontSize: 9, color: "#374151" },
  col1: { flex: 3 },
  col2: { flex: 1, textAlign: "right" },
  col3: { flex: 1.5, textAlign: "right" },
  col4: { flex: 1, textAlign: "right" },
  col5: { flex: 1, textAlign: "right" },
  col6: { flex: 1.5, textAlign: "right" },
  totalsBlock: { alignItems: "flex-end", marginTop: 16 },
  totalRow: { flexDirection: "row", width: 200, justifyContent: "space-between", marginBottom: 4 },
  totalLabel: { fontSize: 9, color: "#6b7280" },
  totalValue: { fontSize: 9, color: "#1f2937" },
  totalDivider: { width: 200, borderTopWidth: 1, borderTopColor: "#e5e7eb", marginVertical: 6 },
  grandTotalRow: { flexDirection: "row", width: 200, justifyContent: "space-between" },
  grandTotalLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1f2937" },
  grandTotalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#6366f1" },
  notesBox: { backgroundColor: "#f9fafb", padding: 12, borderRadius: 4, marginTop: 16 },
  notesText: { fontSize: 9, color: "#4b5563", lineHeight: 1.5 },
  termsText: { fontSize: 8, color: "#9ca3af", lineHeight: 1.5, marginTop: 8 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9ca3af" },
  acceptBox: { marginTop: 24, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 4 },
  acceptTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1f2937", marginBottom: 12 },
  signRow: { flexDirection: "row", gap: 24 },
  signField: { flex: 1, borderTopWidth: 1, borderTopColor: "#d1d5db", paddingTop: 4 },
  signLabel: { fontSize: 8, color: "#9ca3af" },
});

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(s: string | null) {
  if (!s) return "";
  return new Intl.DateTimeFormat("es-MX", { year: "numeric", month: "short", day: "numeric" }).format(new Date(s));
}

export function QuotePDF({ quote }: { quote: any }) {
  const business = quote.businesses;
  const client = quote.clients;
  const items = (quote.quote_items || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const brandColor = business?.brand_color || "#6366f1";

  return (
    <Document title={`Cotizacion-${quote.number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            {business?.logo_url ? (
              <Image src={business.logo_url} style={styles.logoBox} />
            ) : (
              <Text style={[styles.companyName, { color: brandColor }]}>{business?.name || "QuoteFlow"}</Text>
            )}
            {business?.email && <Text style={styles.detail}>{business.email}</Text>}
            {business?.phone && <Text style={styles.detail}>{business.phone}</Text>}
            {business?.address && <Text style={styles.detail}>{business.address}</Text>}
          </View>
          <View style={styles.quoteTitleBlock}>
            <Text style={[styles.quoteTitle, { color: brandColor }]}>COTIZACIÓN</Text>
            <Text style={styles.quoteNum}>#{quote.number}</Text>
            <Text style={styles.metaRow}>Fecha: {fmtDate(quote.created_at)}</Text>
            {quote.expires_at && <Text style={[styles.metaRow, { color: "#f97316" }]}>Vence: {fmtDate(quote.expires_at)}</Text>}
          </View>
        </View>

        {/* From / To */}
        {client && (
          <View style={styles.fromToRow}>
            <View style={styles.fromTo}>
              <Text style={styles.sectionTitle}>Para</Text>
              <Text style={styles.name}>{client.name}</Text>
              {client.company && <Text style={styles.detail}>{client.company}</Text>}
              {client.email && <Text style={styles.detail}>{client.email}</Text>}
              {client.phone && <Text style={styles.detail}>{client.phone}</Text>}
              {client.address && <Text style={styles.detail}>{client.address}</Text>}
            </View>
          </View>
        )}

        {/* Items table */}
        <View style={styles.section}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.col1]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, styles.col2]}>Cant.</Text>
            <Text style={[styles.tableHeaderCell, styles.col3]}>Precio</Text>
            <Text style={[styles.tableHeaderCell, styles.col4]}>Desc%</Text>
            <Text style={[styles.tableHeaderCell, styles.col5]}>IVA%</Text>
            <Text style={[styles.tableHeaderCell, styles.col6]}>Total</Text>
          </View>
          {items.map((item: any, i: number) => (
            <View key={item.id || i} style={[styles.tableRow, i % 2 === 1 ? { backgroundColor: "#fafafa" } : {}]}>
              <View style={styles.col1}>
                <Text style={[styles.tableCell, { fontFamily: "Helvetica-Bold" }]}>{item.name}</Text>
                {item.description && <Text style={[styles.tableCell, { color: "#9ca3af", fontSize: 8 }]}>{item.description}</Text>}
              </View>
              <Text style={[styles.tableCell, styles.col2]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{fmt(item.unit_price)}</Text>
              <Text style={[styles.tableCell, styles.col4]}>{item.discount > 0 ? `${item.discount}%` : "—"}</Text>
              <Text style={[styles.tableCell, styles.col5]}>{item.tax}%</Text>
              <Text style={[styles.tableCell, styles.col6, { fontFamily: "Helvetica-Bold" }]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(quote.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>IVA</Text>
            <Text style={styles.totalValue}>{fmt(quote.tax_total)}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL</Text>
            <Text style={[styles.grandTotalValue, { color: brandColor }]}>{fmt(quote.total)}</Text>
          </View>
        </View>

        {/* Notes */}
        {quote.notes && (
          <View style={styles.notesBox}>
            <Text style={[styles.sectionTitle, { marginBottom: 4 }]}>Notas</Text>
            <Text style={styles.notesText}>{quote.notes}</Text>
          </View>
        )}

        {/* Accept section */}
        <View style={styles.acceptBox}>
          <Text style={styles.acceptTitle}>Aceptación de cotización</Text>
          <View style={styles.signRow}>
            <View style={styles.signField}>
              <Text style={styles.signLabel}>Firma del cliente</Text>
            </View>
            <View style={styles.signField}>
              <Text style={styles.signLabel}>Fecha</Text>
            </View>
          </View>
        </View>

        {/* Terms */}
        {quote.terms && (
          <Text style={styles.termsText}>{"\n"}Términos y condiciones: {quote.terms}</Text>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{business?.footer_text || business?.name || "QuoteFlow"}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Pág. ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
