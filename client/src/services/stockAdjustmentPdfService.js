import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAGE_W = 842; // A4 landscape width in pt
const PAGE_H = 595; // A4 landscape height in pt
const MARGIN = 30;

const C = {
  textDark: [18, 24, 48],
  borderLight: [200, 200, 200],
  white: [255, 255, 255],
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Generate PDF for Stock Adjustment (Requisition Note)
 * @param {Array} historyData - List of adjustment history items
 * @param {String} filterType - 'All', 'Stock In', or 'Stock Out'
 */
export const generateStockAdjustmentPDF = (historyData, filterType) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  // Determine Title and Filename based on filter
  let title = 'Requisition Note';
  let pdfNamePrefix = 'Requisition_Note';
  
  if (filterType === 'Stock In') {
    title = 'Requisition Note (Raw Material)';
    pdfNamePrefix = 'Requisition_Note_Raw_Material';
  } else if (filterType === 'Stock Out') {
    title = 'Requisition Note (Raw Material Return)';
    pdfNamePrefix = 'Requisition_Note_Raw_Material_Return';
  }

  // Draw Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  
  // Left: SBP Logo (Text representation)
  doc.rect(MARGIN, MARGIN, 50, 25);
  doc.setTextColor(C.textDark[0], C.textDark[1], C.textDark[2]);
  doc.text('SBP', MARGIN + 10, MARGIN + 18);

  // Center: Title
  const titleW = doc.getTextWidth(title);
  doc.text(title, (PAGE_W - titleW) / 2, MARGIN + 18);

  // Right: Document Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const rightX = PAGE_W - MARGIN - 120;
  
  doc.rect(rightX - 5, MARGIN, 125, 40);
  doc.text('SBP/STO/R02-00', rightX, MARGIN + 12);
  doc.text('Sl. No. -', rightX, MARGIN + 24);
  doc.text(`Date - ${formatDate(new Date())}`, rightX, MARGIN + 36);

  // Draw Table
  const head = [[
    'Sl. No.', 'Date', 'Description', 'Qty (kgs)', 'Purpose',
    'Raw Material\nLocation', 'Opening\nStock', 'Closing\nStock',
    'Issued by', 'Received By', 'Production\nHead Sign'
  ]];

  // Map history data or create blank rows if empty
  const body = historyData.length > 0 ? historyData.map((h, i) => {
    const qtyValue = h.quantity || h.qty;
    const qtyString = qtyValue ? (h.type === 'out' ? `-${qtyValue}` : `+${qtyValue}`) : '-';
    
    return [
      i + 1,
      formatDate(h.date), // Show date in the Shift column
      h.materialName || '-',
      qtyString,
      h.reason || h.notes || '-',
      h.location || '-',
      h.prevStock != null ? h.prevStock : '-',
      h.newStock != null ? h.newStock : '-',
      h.type === 'out' ? (h.adjustedBy || '') : '',
      h.type === 'in' ? (h.adjustedBy || '') : '',
      ''
    ];
  }) : Array.from({ length: 10 }).map((_, i) => [
    i + 1, '', '', '', '', '', '', '', '', '', ''
  ]);

  autoTable(doc, {
    startY: MARGIN + 50,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: C.white,
      textColor: C.textDark,
      lineColor: C.borderLight,
      lineWidth: 0.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
      fontSize: 10,
    },
    bodyStyles: {
      textColor: C.textDark,
      lineColor: C.borderLight,
      lineWidth: 0.5,
      valign: 'middle',
      halign: 'center',
      fontSize: 10,
      minCellHeight: 25,
    },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 50 },
      2: { cellWidth: 120, halign: 'left' },
      3: { cellWidth: 50 },
      4: { cellWidth: 80, halign: 'left' },
      5: { cellWidth: 60 },
      6: { cellWidth: 60 },
      7: { cellWidth: 60 },
      8: { cellWidth: 60 },
      9: { cellWidth: 60 },
      10: { cellWidth: 'auto' },
    },
    margin: { left: MARGIN, right: MARGIN },
  });

  doc.save(`${pdfNamePrefix}_${formatDate(new Date()).replace(/\//g, '-')}.pdf`);
};
