import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_W   = 595;   // A4 width in pt
const PAGE_H   = 842;   // A4 height in pt
const MARGIN   = 42;
const COL_W    = PAGE_W - MARGIN * 2; // usable content width = 511

const C = {
  navy:        [15,  40,  90],
  navyMid:     [30,  55, 115],
  blue:        [37,  99, 235],
  blueLight:   [219, 234, 254],
  offWhite:    [247, 249, 252],
  borderLight: [220, 226, 240],
  textDark:    [18,  24,  48],
  textMid:     [60,  72, 100],
  textLight:   [130, 142, 170],
  white:       [255, 255, 255],
  green:       [22, 135,  90],
  greenLight:  [220, 252, 231],
  amber:       [161,  98,   7],
  amberLight:  [254, 243, 199],
  redLight:    [254, 226, 226],
  red:         [185,  28,  28],
};

// ─── Utilities ───────────────────────────────────────────────────────────────
const EMPTY = '-';

const fmt = (value) => {
  if (!value) return EMPTY;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return EMPTY;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const str = (value) => {
  if (value == null || value === '' || value === '-' || value === '--') return EMPTY;
  if (typeof value === 'object') { try { return JSON.stringify(value); } catch { return String(value); } }
  const s = String(value).trim();
  return s === '' ? EMPTY : s;
};

const priorityColor = (priority) => {
  const p = (priority || '').toLowerCase();
  if (p === 'urgent' || p === 'critical') return { bg: C.redLight,   fg: C.red   };
  if (p === 'high')                        return { bg: C.amberLight, fg: C.amber };
  return                                          { bg: C.blueLight,  fg: C.blue  };
};

// ─── Drawing helpers ──────────────────────────────────────────────────────────
const sf = (doc, style = 'normal', size = 10) => {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
};
const sc = (doc, rgb) => doc.setTextColor(...rgb);

const hLine = (doc, y, x1 = MARGIN, x2 = PAGE_W - MARGIN, color = C.borderLight, lw = 0.4) => {
  doc.setDrawColor(...color);
  doc.setLineWidth(lw);
  doc.line(x1, y, x2, y);
};

const badge = (doc, bx, by, label, bgRgb, fgRgb) => {
  const pad = 7;
  sf(doc, 'bold', 7.5);
  const tw = doc.getTextWidth(label);
  const bw = tw + pad * 2;
  const bh = 13;
  doc.setFillColor(...bgRgb);
  doc.setDrawColor(...bgRgb);
  doc.roundedRect(bx, by - 10, bw, bh, 2.5, 2.5, 'F');
  sc(doc, fgRgb);
  doc.text(label, bx + pad, by + 0.5);
  return bx + bw + 6;
};

const sectionTitle = (doc, y, title, icon = '') => {
  // Filled accent strip
  doc.setFillColor(...C.navy);
  doc.rect(MARGIN, y, COL_W, 20, 'F');
  sf(doc, 'bold', 9.5);
  sc(doc, C.white);
  doc.text(`${icon}${icon ? '  ' : ''}${title}`, MARGIN + 10, y + 13.5);
  return y + 20;
};

const footer = (doc, page, total, indentNumber) => {
  const fy = PAGE_H - 26;
  hLine(doc, fy, MARGIN, PAGE_W - MARGIN, C.borderLight, 0.4);
  sf(doc, 'normal', 7.5);
  sc(doc, C.textLight);
  doc.text('Sri Bhuvaneshwari Plastics - Internal Document', MARGIN, fy + 10);
  doc.text(`Page ${page} / ${total}`, PAGE_W / 2, fy + 10, { align: 'center' });
  doc.text(`Generated ${fmt(new Date())}  |  Ref: ${indentNumber}`, PAGE_W - MARGIN, fy + 10, { align: 'right' });
};

// ─── Main Export ─────────────────────────────────────────────────────────────
export const downloadSingleIndentPdf = ({ indentSummary, indentDetail, sourceLabel }) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  // Resolved fields
  const indentNo    = str(indentDetail?.indent_number  || indentSummary?.id);
  const reqDate     = fmt(indentDetail?.request_date   || indentSummary?.date);
  const reqBy       = fmt(indentDetail?.required_by_date);
  const requestedBy = str(indentDetail?.requested_by_name || indentSummary?.requestedBy);
  const priority    = str(indentDetail?.priority       || indentSummary?.urgency || 'Normal');
  const wfStatus    = str(indentDetail?.status         || indentSummary?.status);
  const wfStage     = str(indentDetail?.workflow_stage);
  const lifecycle   = wfStatus.startsWith('Pending') ? 'Open' : 'Closed';

  const custName    = str(indentDetail?.customer_name);
  const custPhone   = str(indentDetail?.customer_phone);
  const custEmail   = str(indentDetail?.customer_email);
  const poNum       = str(indentDetail?.po_number);
  const poRef       = str(indentDetail?.po_reference);

  const storeNotes  = str(indentDetail?.store_officer_notes);
  const qmsNotes    = str(indentDetail?.qms_notes);
  const adminNotes  = str(indentDetail?.admin_notes);
  const reason      = str(indentDetail?.reason);

  const materials    = Array.isArray(indentDetail?.materials)     ? indentDetail.materials     : [];
  const history      = Array.isArray(indentDetail?.statusHistory) ? indentDetail.statusHistory : [];

  let y = 0;

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER  – top navy bar + company name + document title
  // ═══════════════════════════════════════════════════════════════════════════
  // Full-width navy header band
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, PAGE_W, 72, 'F');

  // Thin accent stripe at bottom of header
  doc.setFillColor(...C.blue);
  doc.rect(0, 70, PAGE_W, 3, 'F');

  // Company name (left)
  sf(doc, 'bold', 17);
  sc(doc, C.white);
  doc.text('SRI BHUVANESHWARI PLASTICS', MARGIN, 32);

  sf(doc, 'normal', 8.5);
  sc(doc, [170, 190, 230]);
  doc.text('Purchase Department', MARGIN, 47);

  sf(doc, 'normal', 7.5);
  sc(doc, [140, 160, 210]);
  doc.text(fmt(new Date()), MARGIN, 60);

  // Document type (right)
  sf(doc, 'bold', 14);
  sc(doc, [200, 220, 255]);
  doc.text('PURCHASE INDENT', PAGE_W - MARGIN, 33, { align: 'right' });

  sf(doc, 'normal', 8.5);
  sc(doc, C.white);
  doc.text(indentNo, PAGE_W - MARGIN, 47, { align: 'right' });

  sf(doc, 'normal', 7.5);
  sc(doc, [170, 190, 230]);
  doc.text(sourceLabel || 'Purchase Indent', PAGE_W - MARGIN, 60, { align: 'right' });

  y = 84;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS ROW  – badges just below header
  // ═══════════════════════════════════════════════════════════════════════════
  sf(doc, 'bold', 7.5);
  sc(doc, C.textLight);
  doc.text('STATUS', MARGIN, y + 2);

  let bx = MARGIN + 40;
  bx = badge(doc, bx, y, lifecycle === 'Open' ? 'OPEN' : 'CLOSED',
    lifecycle === 'Open' ? C.greenLight : C.blueLight,
    lifecycle === 'Open' ? C.green      : C.blue);

  sf(doc, 'bold', 7.5);
  const statusLabel = wfStatus !== EMPTY ? wfStatus : 'Unknown';
  bx = badge(doc, bx, y, statusLabel, C.offWhite, C.navyMid);

  if (priority !== EMPTY) {
    const pc = priorityColor(priority);
    badge(doc, bx, y, priority.toUpperCase(), pc.bg, pc.fg);
  }

  y += 16;
  hLine(doc, y, 0, PAGE_W, C.borderLight, 0.6);
  y += 12;

  // ═══════════════════════════════════════════════════════════════════════════
  // INDENT DETAILS  – two-column meta grid
  // ═══════════════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, 'Indent Details');
  y += 10;

  const halfW  = COL_W / 2 - 8;
  const col2X  = MARGIN + halfW + 16;

  // Each metaRow renders label + value pair in two columns
  const metaRow = (label1, val1, label2, val2) => {
    sf(doc, 'bold', 7.5);
    sc(doc, C.textLight);
    doc.text(label1.toUpperCase(), MARGIN, y);
    if (label2) doc.text(label2.toUpperCase(), col2X, y);

    sf(doc, 'normal', 9.5);
    sc(doc, C.textDark);
    doc.text(str(val1), MARGIN, y + 13);
    if (label2) doc.text(str(val2), col2X, y + 13);

    y += 30;
  };

  metaRow('Indent Number',  indentNo,     'Source / Type',    sourceLabel || EMPTY);
  metaRow('Request Date',   reqDate,      'Required By',      reqBy === EMPTY ? 'Not Specified' : reqBy);
  metaRow('Requested By',   requestedBy,  'Workflow Stage',   wfStage);
  metaRow('Workflow Status', wfStatus,    'Priority',         priority);

  y += 4;
  hLine(doc, y);
  y += 12;

  // ═══════════════════════════════════════════════════════════════════════════
  // CUSTOMER & ORDER INFO  (only if present)
  // ═══════════════════════════════════════════════════════════════════════════
  const hasCustomer = custName !== EMPTY;
  const hasPO       = poNum    !== EMPTY || poRef !== EMPTY;

  if (hasCustomer || hasPO) {
    y = sectionTitle(doc, y, 'Customer & Order Reference');
    y += 10;

    if (hasCustomer) {
      metaRow('Customer Name', custName, 'Phone', custPhone);
      if (custEmail !== EMPTY) metaRow('Email', custEmail, '', '');
    }
    if (hasPO) {
      metaRow('PO Number', poNum, 'PO Reference', poRef);
    }

    y += 4;
    hLine(doc, y);
    y += 12;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MATERIAL REQUIREMENTS TABLE
  // ═══════════════════════════════════════════════════════════════════════════
  y = sectionTitle(doc, y, 'Material Requirements');
  y += 2;

  //  #   | Material Description | Qty  | Unit | Preferred Supplier | Est. Cost | Specifications
  //  20  |        175           |  40  |  44  |       110          |    60     |    62    = 511
  const matHead = [['#', 'Material Description', 'Qty', 'Unit', 'Preferred Supplier', 'Est. Cost', 'Specifications']];
  const matBody = materials.length > 0
    ? materials.map((m, i) => [
        String(i + 1),
        str(m.material_description),
        m.quantity != null ? String(m.quantity) : EMPTY,
        str(m.unit_of_measurement),
        str(m.preferred_supplier),
        m.estimated_cost != null ? `Rs ${Number(m.estimated_cost).toFixed(2)}` : EMPTY,
        str(m.specifications),
      ])
    : [['1', str(indentSummary?.material), str(indentSummary?.details), EMPTY, EMPTY, EMPTY, EMPTY]];

  autoTable(doc, {
    startY: y,
    head: matHead,
    body: matBody,
    theme: 'plain',
    headStyles: {
      fillColor: C.navyMid,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 7, bottom: 7, left: 5, right: 5 },
      lineColor: C.navyMid,
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: C.offWhite },
    bodyStyles: {
      fontSize: 8,
      textColor: C.textDark,
      cellPadding: { top: 6, bottom: 6, left: 5, right: 5 },
      lineColor: C.borderLight,
      lineWidth: 0.4,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 20,  halign: 'center'  },
      1: { cellWidth: 175                   },
      2: { cellWidth: 40,  halign: 'right'  },
      3: { cellWidth: 44                   },
      4: { cellWidth: 112                  },
      5: { cellWidth: 58,  halign: 'right' },
      6: { cellWidth: 62                  },
    },
    margin: { left: MARGIN, right: MARGIN },
    tableLineColor: C.borderLight,
    tableLineWidth: 0.4,
  });

  y = doc.lastAutoTable.finalY + 12;

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTES & REMARKS
  // ═══════════════════════════════════════════════════════════════════════════
  const noteEntries = [
    ['Reason / Purpose',     reason      ],
    ['Store Officer Notes',  storeNotes  ],
    ['QMS Notes',            qmsNotes    ],
    ['Admin Notes',          adminNotes  ],
  ].filter(([, v]) => v !== EMPTY);

  if (noteEntries.length > 0) {
    hLine(doc, y);
    y += 10;
    y = sectionTitle(doc, y, 'Notes & Remarks');
    y += 10;

    noteEntries.forEach(([label, value]) => {
      sf(doc, 'bold', 8.5);
      sc(doc, C.textMid);
      doc.text(`${label}:`, MARGIN, y);

      sf(doc, 'normal', 8.5);
      sc(doc, C.textDark);
      const lines = doc.splitTextToSize(value, COL_W - 130);
      doc.text(lines, MARGIN + 130, y);
      y += Math.max(lines.length * 12, 14) + 4;
    });

    y += 6;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVAL TRAIL  – status history
  // ═══════════════════════════════════════════════════════════════════════════
  if (history.length > 0) {
    hLine(doc, y);
    y += 10;
    y = sectionTitle(doc, y, 'Approval Trail');
    y += 2;

    //  #  | Date | By | From | To | Stage | Comments
    //  18 |  68  | 70 |  90  | 90 |  70   |  105  = 511
    const histBody = history.map((e, i) => [
      String(i + 1),
      fmt(e.changed_at),
      str(e.changed_by_name),
      e.old_status ? str(e.old_status) : '(initial)',
      str(e.new_status),
      str(e.workflow_stage),
      str(e.comments),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['#', 'Date', 'Changed By', 'From Status', 'To Status', 'Stage', 'Comments']],
      body: histBody,
      theme: 'plain',
      headStyles: {
        fillColor: [40, 52, 80],
        textColor: C.white,
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 7, bottom: 7, left: 5, right: 5 },
        lineWidth: 0,
      },
      alternateRowStyles: { fillColor: C.offWhite },
      bodyStyles: {
        fontSize: 7.5,
        textColor: C.textDark,
        cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
        lineColor: C.borderLight,
        lineWidth: 0.4,
        overflow: 'linebreak',
      },
      columnStyles: {
        0: { cellWidth: 18,  halign: 'center' },
        1: { cellWidth: 68  },
        2: { cellWidth: 70  },
        3: { cellWidth: 90  },
        4: { cellWidth: 90  },
        5: { cellWidth: 70  },
        6: { cellWidth: 105 },
      },
      margin: { left: MARGIN, right: MARGIN },
      tableLineColor: C.borderLight,
      tableLineWidth: 0.4,
    });

    y = doc.lastAutoTable.finalY + 16;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIGNATURE BLOCK
  // ═══════════════════════════════════════════════════════════════════════════
  if (y > PAGE_H - 110) { doc.addPage(); y = MARGIN + 16; }

  hLine(doc, y);
  y += 14;

  const sigW  = (COL_W - 24) / 3;
  const sigH  = 56;
  const sigs  = ['Prepared By', 'Verified By', 'Approved By'];

  sigs.forEach((label, i) => {
    const bx = MARGIN + i * (sigW + 12);
    const by = y;

    // Box
    doc.setFillColor(...C.offWhite);
    doc.setDrawColor(...C.borderLight);
    doc.setLineWidth(0.5);
    doc.roundedRect(bx, by, sigW, sigH, 4, 4, 'FD');

    // Label at top of box
    sf(doc, 'bold', 7.5);
    sc(doc, C.textLight);
    doc.text(label.toUpperCase(), bx + sigW / 2, by + 12, { align: 'center' });

    // Signature line
    hLine(doc, by + 38, bx + 10, bx + sigW - 10, C.borderLight, 0.4);

    // Pre-fill "Prepared By" name
    if (i === 0 && requestedBy !== EMPTY) {
      sf(doc, 'normal', 8.5);
      sc(doc, C.textDark);
      doc.text(requestedBy, bx + sigW / 2, by + 48, { align: 'center' });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER on every page
  // ═══════════════════════════════════════════════════════════════════════════
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    if (p > 1) {
      // Thin header bar on continuation pages
      doc.setFillColor(...C.navy);
      doc.rect(0, 0, PAGE_W, 6, 'F');
    }
    footer(doc, p, total, indentNo);
  }

  const safe = str(indentNo).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`purchase_indent_${safe}.pdf`);
};
