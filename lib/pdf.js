import { fmtDate } from '@/lib/format';

// Builds and downloads an invoice PDF in the browser (jsPDF). Libraries load only when the button is clicked.
// Note: jsPDF's built-in font has no rupee symbol, so INR amounts are printed as "Rs."
export async function downloadInvoicePdf({ invoice, client, owner, currency }) {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();
  const sym = currency === 'INR' ? 'Rs. ' : '$';
  const f = (n) => sym + Number(n || 0).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Header band
  doc.setFillColor(5, 150, 105); doc.rect(0, 0, 210, 36, 'F');
  doc.setTextColor(255); doc.setFontSize(24); doc.setFont(undefined, 'bold'); doc.text('INVOICE', 14, 23);
  doc.setFontSize(12); doc.text(invoice.invoice_number, 196, 23, { align: 'right' });

  // From / Bill to
  doc.setTextColor(30); doc.setFontSize(9); doc.setFont(undefined, 'normal');
  doc.setTextColor(120); doc.text('FROM', 14, 48); doc.text('BILL TO', 110, 48);
  doc.setTextColor(30); doc.setFontSize(11); doc.setFont(undefined, 'bold');
  doc.text(owner?.full_name || 'Freelancer', 14, 55); doc.text(client?.name || 'Client', 110, 55);
  doc.setFont(undefined, 'normal'); doc.setFontSize(10);
  doc.text(owner?.email || '', 14, 61);
  if (client?.company) doc.text(client.company, 110, 61);
  if (client?.email) doc.text(client.email, 110, 67);

  // Dates
  doc.setTextColor(120); doc.setFontSize(9); doc.text('ISSUE DATE', 14, 80); doc.text('DUE DATE', 70, 80); doc.text('STATUS', 126, 80);
  doc.setTextColor(30); doc.setFontSize(11);
  doc.text(fmtDate(invoice.issue_date), 14, 86); doc.text(fmtDate(invoice.due_date), 70, 86);
  doc.text(invoice.status === 'paid' ? 'PAID' : 'UNPAID', 126, 86);

  // Line items
  autoTable(doc, {
    startY: 96,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: (invoice.items || []).map((i) => [i.description, i.qty, f(i.rate), f(i.qty * i.rate)]),
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Totals
  let y = doc.lastAutoTable.finalY + 10;
  const row = (label, val, bold) => {
    doc.setFont(undefined, bold ? 'bold' : 'normal'); doc.setFontSize(bold ? 13 : 10);
    doc.text(label, 140, y); doc.text(val, 196, y, { align: 'right' }); y += bold ? 9 : 7;
  };
  row('Subtotal', f(invoice.subtotal));
  if (Number(invoice.tax_percent) > 0) row(`Tax (${invoice.tax_percent}%)`, f(invoice.total - invoice.subtotal));
  row('Total', f(invoice.total), true);

  if (invoice.notes) { doc.setFont(undefined, 'normal'); doc.setFontSize(10); doc.setTextColor(90); doc.text(doc.splitTextToSize('Notes: ' + invoice.notes, 120), 14, y + 6); }
  doc.setFontSize(9); doc.setTextColor(150); doc.text('Generated with FreelanceFlow', 105, 285, { align: 'center' });
  doc.save(`${invoice.invoice_number}.pdf`);
}
