import PDFDocument from 'pdfkit';
import { COMPANY_CONFIG } from '../../config/company.js';

/**
 * Format currency number to Indian Rupee representation (e.g., "Rs. 1,560.00")
 * Uses ASCII "Rs." for 100% reliable PDF font rendering in standard Helvetica.
 */
function formatRupee(amount) {
  const num = Number(amount || 0);
  return 'Rs. ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(dateStr);
  }
}

/**
 * Generate a professional, multi-page capable, A4-sized PDF invoice stream.
 *
 * @param {Object} invoice - Enriched invoice record with items, customer profile, and payments.
 * @param {NodeJS.WritableStream} res - Express response stream
 */
export function generateInvoicePdf(invoice, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
    bufferPages: true,
  });

  doc.pipe(res);

  const primaryColor = '#4F46E5'; // Indigo-600
  const darkColor = '#0F172A';    // Slate-900
  const grayColor = '#64748B';    // Slate-500
  const lightBg = '#F8FAFC';      // Slate-50
  const borderColor = '#E2E8F0';  // Slate-200

  // ----------------------------------------------------
  // 1. BRAND HEADER
  // ----------------------------------------------------
  // Logo placeholder square
  doc.rect(40, 40, 36, 36).fillAndStroke(primaryColor, primaryColor);
  doc.fillColor('#FFFFFF').fontSize(20).font('Helvetica-Bold').text('B', 50, 48);

  // Company details
  doc.fillColor(darkColor).fontSize(18).font('Helvetica-Bold').text(COMPANY_CONFIG.brandName, 85, 42);
  doc.fillColor(grayColor).fontSize(8).font('Helvetica').text(COMPANY_CONFIG.tagline, 85, 62);
  doc.text(`${COMPANY_CONFIG.addressLine1}, ${COMPANY_CONFIG.addressLine2}`, 85, 73);
  doc.text(`Email: ${COMPANY_CONFIG.email}  |  Phone: ${COMPANY_CONFIG.phone}  |  GSTIN: ${COMPANY_CONFIG.gstin}`, 85, 84);

  // Invoice Title & Status Badge on Right
  doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold').text('INVOICE', 350, 40, { align: 'right', width: 205 });
  doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text(`#${invoice.invoice_number || 'INV-DRAFT'}`, 350, 64, { align: 'right', width: 205 });

  // Status Box
  const status = (invoice.status || 'Draft').toUpperCase();
  let statusBg = '#F1F5F9';
  let statusText = '#475569';
  if (status === 'PAID') {
    statusBg = '#DCFCE7';
    statusText = '#166534';
  } else if (status === 'CONFIRMED' || status === 'ACTIVE') {
    statusBg = '#DBEAFE';
    statusText = '#1E40AF';
  } else if (status === 'CANCELLED') {
    statusBg = '#FEE2E2';
    statusText = '#991B1B';
  } else if (status === 'OVERDUE') {
    statusBg = '#FEF3C7';
    statusText = '#92400E';
  }

  doc.rect(465, 80, 90, 20).fillAndStroke(statusBg, borderColor);
  doc.fillColor(statusText).fontSize(9).font('Helvetica-Bold').text(status, 465, 85, { align: 'center', width: 90 });

  // Divider
  doc.moveTo(40, 110).lineTo(555, 110).strokeColor(borderColor).lineWidth(1).stroke();

  // ----------------------------------------------------
  // 2. METADATA: BILL TO & INVOICE DETAILS
  // ----------------------------------------------------
  const metaY = 122;

  // Left card: Customer Info
  doc.rect(40, metaY, 245, 85).fillAndStroke(lightBg, borderColor);
  doc.fillColor(grayColor).fontSize(7.5).font('Helvetica-Bold').text('BILL TO', 52, metaY + 10);
  doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text(
    invoice.profiles?.full_name || invoice.customer_name || 'Valued Customer',
    52,
    metaY + 23
  );
  doc.fillColor(grayColor).fontSize(8.5).font('Helvetica').text(
    invoice.profiles?.email || invoice.customer_email || 'No email provided',
    52,
    metaY + 38
  );
  if (invoice.profiles?.phone) {
    doc.text(`Phone: ${invoice.profiles.phone}`, 52, metaY + 50);
  }
  doc.text('GSTIN: Unregistered Consumer', 52, metaY + (invoice.profiles?.phone ? 62 : 50));

  // Right card: Invoice Dates & Subscription Meta
  doc.rect(310, metaY, 245, 85).fillAndStroke(lightBg, borderColor);
  doc.fillColor(grayColor).fontSize(7.5).font('Helvetica-Bold').text('INVOICE & SUBSCRIPTION DETAILS', 322, metaY + 10);

  const rightDetails = [
    ['Issue Date:', formatDate(invoice.issue_date)],
    ['Due Date:', formatDate(invoice.due_date)],
    ['Billing Period:', invoice.period_start && invoice.period_end ? `${formatDate(invoice.period_start)} to ${formatDate(invoice.period_end)}` : 'N/A'],
    ['Subscription #:', invoice.subscriptions?.subscription_number || invoice.subscription_number || 'Direct'],
  ];

  let rY = metaY + 23;
  rightDetails.forEach(([lbl, val]) => {
    doc.fillColor(grayColor).fontSize(8).font('Helvetica').text(lbl, 322, rY);
    doc.fillColor(darkColor).fontSize(8).font('Helvetica-Bold').text(val, 410, rY, { width: 135, align: 'right' });
    rY += 14;
  });

  // ----------------------------------------------------
  // 3. LINE ITEMS TABLE
  // ----------------------------------------------------
  let tableTop = 225;

  const renderTableHeader = (y) => {
    doc.rect(40, y, 515, 22).fillAndStroke(lightBg, borderColor);
    doc.fillColor(grayColor).fontSize(7.5).font('Helvetica-Bold');
    doc.text('DESCRIPTION', 50, y + 7, { width: 170 });
    doc.text('VARIANT', 225, y + 7, { width: 75 });
    doc.text('QTY', 305, y + 7, { width: 30, align: 'center' });
    doc.text('UNIT PRICE', 340, y + 7, { width: 65, align: 'right' });
    doc.text('TAX', 410, y + 7, { width: 55, align: 'right' });
    doc.text('TOTAL', 475, y + 7, { width: 70, align: 'right' });
  };

  renderTableHeader(tableTop);
  let curY = tableTop + 22;

  const items = invoice.invoice_items || invoice.items || [];

  if (items.length === 0) {
    doc.rect(40, curY, 515, 30).strokeColor(borderColor).stroke();
    doc.fillColor(grayColor).fontSize(8.5).font('Helvetica-Oblique').text('No line items recorded.', 50, curY + 10, { align: 'center', width: 495 });
    curY += 30;
  } else {
    items.forEach((item) => {
      // Check for page overflow
      if (curY > 700) {
        doc.addPage();
        tableTop = 40;
        renderTableHeader(tableTop);
        curY = tableTop + 22;
      }

      const itemDesc = item.products?.name || item.description || 'Subscription Service';
      const variantName = item.product_variants?.name || item.variant_name || 'Standard';
      const qty = String(item.quantity || 1);
      const unitPrice = formatRupee(item.unit_price || 0);
      const taxRate = item.tax_rate ? `${item.tax_rate}%` : '18%';
      const taxAmt = formatRupee(item.tax_amount || 0);
      const lineTotal = formatRupee(item.line_total || item.line_subtotal || 0);

      doc.rect(40, curY, 515, 26).strokeColor(borderColor).stroke();

      doc.fillColor(darkColor).fontSize(8.5).font('Helvetica-Bold').text(itemDesc, 50, curY + 6, { width: 170, ellipsis: true });
      doc.fillColor(grayColor).fontSize(7.5).font('Helvetica').text(variantName, 225, curY + 7, { width: 75, ellipsis: true });
      doc.fillColor(darkColor).fontSize(8.5).font('Helvetica').text(qty, 305, curY + 7, { width: 30, align: 'center' });
      doc.text(unitPrice, 340, curY + 7, { width: 65, align: 'right' });
      doc.fillColor(grayColor).fontSize(7.5).text(`${taxRate} (${taxAmt})`, 410, curY + 7, { width: 55, align: 'right' });
      doc.fillColor(darkColor).fontSize(8.5).font('Helvetica-Bold').text(lineTotal, 475, curY + 7, { width: 70, align: 'right' });

      curY += 26;
    });
  }

  // ----------------------------------------------------
  // 4. FINANCIAL SUMMARY & BANK DETAILS
  // ----------------------------------------------------
  if (curY > 640) {
    doc.addPage();
    curY = 40;
  }

  const summaryY = curY + 15;

  // Left side: Bank details & Payment info
  doc.rect(40, summaryY, 260, 115).fillAndStroke(lightBg, borderColor);
  doc.fillColor(grayColor).fontSize(7.5).font('Helvetica-Bold').text('PAYMENT INFORMATION / BANK TRANSFER', 52, summaryY + 10);
  doc.fillColor(darkColor).fontSize(8).font('Helvetica');
  doc.text(`Bank Name: ${COMPANY_CONFIG.bankDetails.bankName}`, 52, summaryY + 26);
  doc.text(`Account Name: ${COMPANY_CONFIG.bankDetails.accountName}`, 52, summaryY + 39);
  doc.text(`Account No: ${COMPANY_CONFIG.bankDetails.accountNumber}`, 52, summaryY + 52);
  doc.text(`IFSC Code: ${COMPANY_CONFIG.bankDetails.ifsc}`, 52, summaryY + 65);
  doc.text(`Branch: ${COMPANY_CONFIG.bankDetails.branch}`, 52, summaryY + 78);
  doc.fillColor(grayColor).fontSize(7).font('Helvetica-Oblique').text(COMPANY_CONFIG.notes, 52, summaryY + 93, { width: 236 });

  // Right side: Financial Totals Box
  const totalsX = 320;
  const totalsW = 235;
  doc.rect(totalsX, summaryY, totalsW, 115).strokeColor(borderColor).stroke();

  const subtotal = Number(invoice.subtotal || 0);
  const discountTotal = Number(invoice.discount_total || 0);
  const taxTotal = Number(invoice.tax_total || 0);
  const grandTotal = Number(invoice.total || 0);
  const amountPaid = Number(invoice.amount_paid || 0);
  const balance = Math.max(0, grandTotal - amountPaid);

  let tY = summaryY + 8;
  const renderTotalLine = (label, value, isBold = false, color = darkColor, size = 8.5) => {
    doc.fillColor(isBold ? darkColor : grayColor).fontSize(size).font(isBold ? 'Helvetica-Bold' : 'Helvetica').text(label, totalsX + 12, tY);
    doc.fillColor(color).fontSize(size).font(isBold ? 'Helvetica-Bold' : 'Helvetica').text(value, totalsX + 12, tY, { width: totalsW - 24, align: 'right' });
    tY += 15;
  };

  renderTotalLine('Subtotal', formatRupee(subtotal));
  if (discountTotal > 0) {
    renderTotalLine('Discount', `-${formatRupee(discountTotal)}`, false, '#059669');
  }
  renderTotalLine('Estimated Tax (GST)', formatRupee(taxTotal));

  // Divider inside totals
  doc.moveTo(totalsX + 10, tY).lineTo(totalsX + totalsW - 10, tY).strokeColor(borderColor).lineWidth(0.5).stroke();
  tY += 4;

  renderTotalLine('Grand Total', formatRupee(grandTotal), true, primaryColor, 10);
  renderTotalLine('Amount Paid', formatRupee(amountPaid), false, '#059669');

  doc.moveTo(totalsX + 10, tY).lineTo(totalsX + totalsW - 10, tY).strokeColor(borderColor).lineWidth(0.5).stroke();
  tY += 4;

  renderTotalLine('Outstanding Balance', formatRupee(balance), true, balance > 0 ? '#DC2626' : '#059669', 9.5);

  curY = summaryY + 125;

  // ----------------------------------------------------
  // 5. PAYMENT HISTORY (IF ANY)
  // ----------------------------------------------------
  const payments = invoice.payments || [];
  if (payments.length > 0) {
    if (curY > 670) {
      doc.addPage();
      curY = 40;
    }

    doc.fillColor(grayColor).fontSize(7.5).font('Helvetica-Bold').text('PAYMENT TRANSACTIONS HISTORY', 40, curY);
    curY += 12;

    doc.rect(40, curY, 515, 18).fillAndStroke(lightBg, borderColor);
    doc.fillColor(grayColor).fontSize(7).font('Helvetica-Bold');
    doc.text('DATE', 50, curY + 5, { width: 85 });
    doc.text('METHOD', 140, curY + 5, { width: 95 });
    doc.text('NOTE / REFERENCE', 240, curY + 5, { width: 200 });
    doc.text('AMOUNT', 445, curY + 5, { width: 100, align: 'right' });
    curY += 18;

    payments.forEach((p) => {
      if (curY > 740) {
        doc.addPage();
        curY = 40;
      }
      doc.rect(40, curY, 515, 20).strokeColor(borderColor).stroke();
      doc.fillColor(darkColor).fontSize(7.5).font('Helvetica').text(formatDate(p.payment_date || p.created_at), 50, curY + 5);
      doc.text(p.method || 'Standard', 140, curY + 5);
      doc.fillColor(grayColor).text(p.note || 'Recorded payment', 240, curY + 5, { width: 200, ellipsis: true });
      doc.fillColor('#059669').font('Helvetica-Bold').text(formatRupee(p.amount), 445, curY + 5, { width: 100, align: 'right' });
      curY += 20;
    });

    curY += 10;
  }

  // ----------------------------------------------------
  // 6. MULTI-PAGE NUMBERING & FOOTER
  // ----------------------------------------------------
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);

    // Bottom line
    doc.moveTo(40, 792).lineTo(555, 792).strokeColor(borderColor).lineWidth(0.5).stroke();

    doc.fillColor(grayColor).fontSize(7).font('Helvetica');
    doc.text(
      'This is a computer generated invoice and requires no physical signature. Thank you for choosing Brightloop.',
      40,
      800,
      { width: 380 }
    );
    doc.text(
      `Page ${i + 1} of ${range.count}`,
      420,
      800,
      { width: 135, align: 'right' }
    );
  }

  doc.end();
}
