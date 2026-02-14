import type { Order } from "@/types";

const APP_NAME = "Dreamy Life";

/**
 * Generates print-ready invoice HTML for an order. Opens in new window and triggers print (user can Save as PDF).
 */
export function printOrderInvoice(order: Order): void {
  const date = new Date(order.created_at).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const areaLabel =
    order.delivery_area === "inside_dhaka" ? "Inside Dhaka" : "Outside Dhaka";

  const paymentMethodLabel =
    order.payment_method === "wallet"
      ? "Wallet"
      : order.payment_method === "mobile_banking"
        ? "Mobile Banking"
        : order.payment_method === "cash_on_delivery"
          ? "Cash on Delivery"
          : order.payment_method ?? "—";

  const amountPaid = order.amount_paid_at_placement
    ? parseFloat(order.amount_paid_at_placement)
    : 0;
  const dueAmount = order.due_amount ? parseFloat(order.due_amount) : 0;

  const itemsRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;vertical-align:top">${escapeHtml(item.product_title)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.product_sku || "—"}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">৳${parseFloat(item.unit_price).toLocaleString()}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">৳${parseFloat(item.subtotal).toLocaleString()}</td>
    </tr>`
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Invoice ${escapeHtml(order.order_number)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 14px; line-height: 1.5; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 22px; margin: 0 0 4px 0; font-weight: 700; }
    .meta { color: #6b7280; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .totals { margin-top: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
    .totals table { margin: 0; }
    .totals td { padding: 8px 16px; }
    .totals tr:last-child td { font-weight: 700; font-size: 16px; background: #f9fafb; }
    .section { margin-top: 24px; }
    .section-title { font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
    .two-col { display: flex; gap: 48px; margin-top: 16px; }
    .two-col > div { flex: 1; }
    @media print { body { padding: 16px; } .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom:16px;">
    <button type="button" onclick="window.print()" style="padding:10px 20px;background:#0d1117;color:#fff;border:none;border-radius:6px;font-weight:600;cursor:pointer;">Print / Save as PDF</button>
    <button type="button" onclick="window.close()" style="margin-left:8px;padding:10px 20px;background:#e5e7eb;color:#374151;border:none;border-radius:6px;cursor:pointer;">Close</button>
  </div>
  <h1>${escapeHtml(APP_NAME)}</h1>
  <p class="meta">Tax Invoice / Reseller Order</p>

  <div class="two-col">
    <div>
      <div class="section-title">Invoice details</div>
      <p style="margin:0;"><strong>Invoice #</strong> ${escapeHtml(order.order_number)}</p>
      <p style="margin:4px 0 0 0;"><strong>Date</strong> ${date}</p>
      <p style="margin:4px 0 0 0;"><strong>Order status</strong> ${escapeHtml(order.order_status)}</p>
      <p style="margin:4px 0 0 0;"><strong>Payment status</strong> ${escapeHtml(order.payment_status)}</p>
      <p style="margin:4px 0 0 0;"><strong>Payment method</strong> ${escapeHtml(paymentMethodLabel)}</p>
      ${amountPaid > 0 ? `<p style="margin:4px 0 0 0;"><strong>Paid at placement</strong> ৳${amountPaid.toLocaleString()}</p>` : ""}
      ${dueAmount > 0 ? `<p style="margin:4px 0 0 0;"><strong>Due amount</strong> ৳${dueAmount.toLocaleString()}</p>` : ""}
    </div>
    <div>
      <div class="section-title">Bill to / Ship to</div>
      <p style="margin:0;">${escapeHtml(order.customer_name)}</p>
      <p style="margin:4px 0 0 0;">${escapeHtml(order.customer_email)}</p>
      <p style="margin:4px 0 0 0;">${escapeHtml(order.customer_phone)}</p>
      <p style="margin:8px 0 0 0;">${escapeHtml(order.delivery_address)}</p>
      <p style="margin:4px 0 0 0;">${areaLabel}</p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Items</div>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th style="text-align:center">SKU</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Unit price</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <table>
      <tr><td>Subtotal</td><td style="text-align:right">৳${parseFloat(order.subtotal).toLocaleString()}</td></tr>
      <tr><td>VAT</td><td style="text-align:right">৳${parseFloat(order.vat_amount).toLocaleString()}</td></tr>
      <tr><td>Delivery</td><td style="text-align:right">৳${parseFloat(order.delivery_charge).toLocaleString()}</td></tr>
      <tr><td>Total</td><td style="text-align:right">৳${parseFloat(order.total_amount).toLocaleString()}</td></tr>
      ${amountPaid > 0 ? `<tr><td>Paid at placement</td><td style="text-align:right">৳${amountPaid.toLocaleString()}</td></tr>` : ""}
      ${dueAmount > 0 ? `<tr><td>Due</td><td style="text-align:right">৳${dueAmount.toLocaleString()}</td></tr>` : ""}
    </table>
  </div>

  <p class="meta" style="margin-top:32px;">Generated by ${escapeHtml(APP_NAME)} · Reseller order</p>
  <script>
    window.onload = function() { window.focus(); }
  </script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to open the invoice.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
