import { jsPDF } from 'jspdf';

export function downloadQuotationPdf(params: {
  enquiryNumber: string;
  projectTitle: string;
  customerName: string;
  customerEmail: string;
  quotation: {
    id: number;
    quotationNumber?: string;
    revisionNumber: number;
    items: Array<{ name: string; description: string; qty: number; unitPriceInr: number }>;
    hardwareCostInr: number;
    softwareCostInr: number;
    designDevChargesInr: number;
    testingChargesInr: number;
    documentationChargesInr: number;
    deliveryChargesInr: number;
    costCategories?: Record<string, number>;
    technicalScope?: string;
    validityDays?: number;
    estimatedDuration?: string;
    paymentTerms?: string;
    termsAndConditions?: string;
    discountInr: number;
    gstInr: number;
    totalAmountInr: number;
    advancePercent: number;
    advanceAmountInr: number;
    balanceAmountInr: number;
    status: string;
    createdAt: string;
  };
  gstin?: string;
}) {
  const doc = new jsPDF();
  const q = params.quotation;

  doc.setFontSize(16);
  doc.text('NEXUSTEKFUSION PRIVATE LIMITED', 14, 18);
  doc.setFontSize(9);
  doc.text('CIN: U30305ME2026PTC474052 | Email: info@nexustekfusion.in | https://nexustekfusion.in', 14, 24);
  doc.text('H NO. 565/19 NIT, SANKUL NEW COTTON MARK, Ganjipeth, Nagpur 440018', 14, 29);
  if (params.gstin) {
    doc.text(`GSTIN: ${params.gstin}`, 14, 34);
  }

  doc.setDrawColor(200);
  doc.line(14, 38, 196, 38);

  doc.setFontSize(13);
  doc.text(`PROJECT QUOTATION ${q.quotationNumber ? `(${q.quotationNumber}) ` : ''}— REV #${q.revisionNumber}`, 14, 46);
  doc.setFontSize(10);
  doc.text(`Enquiry Ref: ${params.enquiryNumber}`, 14, 53);
  doc.text(`Project: ${params.projectTitle}`, 14, 59);
  doc.text(`Prepared For: ${params.customerName} (${params.customerEmail})`, 14, 65);
  doc.text(`Status: ${q.status} | Validity: ${q.validityDays || 15} Days`, 14, 71);
  let y = 77;
  if (q.estimatedDuration) {
    doc.text(`Estimated Duration: ${q.estimatedDuration}`, 14, y);
    y += 6;
  }
  if (q.technicalScope) {
    doc.setFontSize(9);
    const scopeLines = doc.splitTextToSize(`Scope: ${q.technicalScope}`, 180);
    doc.text(scopeLines, 14, y);
    y += scopeLines.length * 4.5 + 3;
    doc.setFontSize(10);
  }
  y += 2;
  doc.setFontSize(10);
  doc.text('Itemized Cost Breakdown', 14, y);
  y += 5;
  doc.line(14, y, 196, y);
  y += 6;

  const cc = q.costCategories;
  const categoryRows: Array<[string, number]> = cc
    ? [
        ['Development Charges', cc.development || 0],
        ['Hardware / Components Cost', cc.hardware || 0],
        ['Sensors & Modules Cost', cc.sensors || 0],
        ['PCB Design & Fabrication Cost', cc.pcb || 0],
        ['3D Printing / Mechanical Fabrication', (cc.mechanical || 0) + (cc.printing3d || 0)],
        ['Software / App / Web Development', cc.software || 0],
        ['AI / ML Model Development', cc.aiMl || 0],
        ['IoT / Cloud Setup', cc.iot || 0],
        ['Drone / Robotics Engineering', cc.droneRobotics || 0],
        ['Testing & Calibration Charges', cc.testing || 0],
        ['Documentation / PPT / Report', cc.documentation || 0],
        ['Delivery & Packaging Charges', cc.delivery || 0],
        ['Other Custom Charges', cc.other || 0],
      ]
    : [
        ['Hardware & Components', q.hardwareCostInr],
        ['Software & Firmware Development', q.softwareCostInr],
        ['Design & Engineering Charges', q.designDevChargesInr],
        ['Validation & Testing', q.testingChargesInr],
        ['Documentation & Manuals', q.documentationChargesInr],
        ['Packaging & Delivery', q.deliveryChargesInr],
      ];

  const rows: Array<[string, number]> = [
    ...q.items.map((it): [string, number] => [
      `${it.name} (x${it.qty})`,
      it.qty * it.unitPriceInr,
    ]),
    ...categoryRows,
    ['Applicable GST', q.gstInr],
  ];

  for (const [label, amount] of rows) {
    if (amount > 0) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.text(label, 14, y);
      doc.text(`INR ${amount.toLocaleString('en-IN')}`, 160, y);
      y += 6;
    }
  }
  if (q.discountInr > 0) {
    doc.text('Discount', 14, y);
    doc.text(`- INR ${q.discountInr.toLocaleString('en-IN')}`, 160, y);
    y += 6;
  }

  y += 2;
  doc.line(14, y, 196, y);
  y += 7;
  doc.setFontSize(11);
  doc.text('Total Quotation Amount', 14, y);
  doc.text(`INR ${q.totalAmountInr.toLocaleString('en-IN')}`, 160, y);
  y += 7;
  doc.setFontSize(10);
  doc.text(`Advance Payable (${q.advancePercent}%)`, 14, y);
  doc.text(`INR ${q.advanceAmountInr.toLocaleString('en-IN')}`, 160, y);
  y += 6;
  doc.text('Balance on Completion / Delivery', 14, y);
  doc.text(`INR ${q.balanceAmountInr.toLocaleString('en-IN')}`, 160, y);

  if (q.paymentTerms || q.termsAndConditions) {
    y += 10;
    doc.setFontSize(9);
    if (q.paymentTerms) {
      doc.text(`Payment Terms: ${q.paymentTerms}`, 14, y);
      y += 6;
    }
    if (q.termsAndConditions) {
      const splitTerms = doc.splitTextToSize(`Terms & Notes: ${q.termsAndConditions}`, 180);
      doc.text(splitTerms, 14, y);
    }
  }

  doc.save(`${params.enquiryNumber}_Quotation_Rev${q.revisionNumber}.pdf`);
}

export function downloadInvoicePdf(params: {
  invoiceNumber: string;
  docType: string;
  entityType: string;
  amountInr: number;
  gstInr: number;
  issuedAt: string;
  customerEmail: string;
  gstin?: string;
  payload: Record<string, unknown>;
}) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('NEXUSTEKFUSION PRIVATE LIMITED', 14, 18);
  doc.setFontSize(9);
  doc.text('CIN: U30305ME2026PTC474052 | info@nexustekfusion.in | https://nexustekfusion.in', 14, 24);
  doc.text('H NO. 565/19 NIT, SANKUL NEW COTTON MARK, Ganjipeth, Nagpur 440018', 14, 29);
  if (params.gstin) {
    doc.text(`GSTIN: ${params.gstin}`, 14, 34);
  }
  doc.line(14, 38, 196, 38);

  doc.setFontSize(13);
  doc.text(params.docType.toUpperCase(), 14, 47);
  doc.setFontSize(10);
  doc.text(`Document No: ${params.invoiceNumber}`, 14, 54);
  doc.text(`Issued Date: ${new Date(params.issuedAt).toLocaleDateString('en-IN')}`, 14, 60);
  doc.text(`Customer: ${params.customerEmail}`, 14, 66);
  doc.text(`Reference Type: ${params.entityType.replace('_', ' ').toUpperCase()}`, 14, 72);

  let y = 84;
  doc.line(14, y, 196, y);
  y += 8;
  doc.text('Reference Summary', 14, y);
  y += 7;
  const orderNo = params.payload.orderNumber || params.payload.projectCode || params.payload.enquiryNumber;
  if (orderNo) {
    doc.text(`Reference ID: ${String(orderNo)}`, 14, y);
    y += 7;
  }

  const items = Array.isArray(params.payload.items) ? (params.payload.items as Array<any>) : [];
  if (items.length > 0) {
    doc.setFontSize(9);
    for (const it of items) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${it.name} (${it.sku || ''}) x${it.qty}`, 14, y);
      doc.text(`INR ${Number(it.lineTotalInr || 0).toLocaleString('en-IN')}`, 160, y);
      y += 6;
    }
    y += 4;
    doc.setFontSize(10);
  }

  doc.text(`Tax / GST Component: INR ${params.gstInr.toLocaleString('en-IN')}`, 14, y);
  y += 7;
  doc.setFontSize(12);
  doc.text(`Total Paid / Billed: INR ${params.amountInr.toLocaleString('en-IN')}`, 14, y);

  doc.save(`${params.invoiceNumber}.pdf`);
}

export function downloadPackingSlipPdf(order: {
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  trackingCourier?: string;
  trackingId?: string;
  shippingAddress: any;
  items: Array<{
    sku: string;
    name: string;
    variant?: string;
    color?: string;
    qty: number;
  }>;
}) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('NEXUSTEKFUSION PRIVATE LIMITED — PACKING SLIP', 14, 18);
  doc.setFontSize(9);
  doc.text('Dispatch Hub: H NO. 565/19 NIT, SANKUL NEW COTTON MARK, Ganjipeth, Nagpur 440018', 14, 24);
  doc.text('CIN: U30305ME2026PTC474052 | Email: info@nexustekfusion.in', 14, 29);
  doc.line(14, 34, 196, 34);

  doc.setFontSize(11);
  doc.text(`Order Number: ${order.orderNumber}`, 14, 42);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 14, 48);
  doc.text(`Order Status: ${order.orderStatus} | Payment: ${order.paymentStatus.toUpperCase()}`, 14, 54);
  if (order.trackingCourier || order.trackingId) {
    doc.text(`Courier: ${order.trackingCourier || '-'} | AWB / Tracking: ${order.trackingId || '-'}`, 14, 60);
  }

  const addr = order.shippingAddress || {};
  let y = 70;
  doc.setFontSize(10);
  doc.text('SHIP TO:', 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.text(`${addr.fullName || 'Customer'} (${addr.mobile || '-'})`, 14, y);
  y += 5;
  doc.text(`${addr.houseFlat || ''}, ${addr.streetArea || ''}`, 14, y);
  y += 5;
  if (addr.landmark) {
    doc.text(`Landmark: ${addr.landmark}`, 14, y);
    y += 5;
  }
  doc.text(`${addr.city || ''}, ${addr.district || ''}, ${addr.state || ''} - ${addr.pinCode || ''}`, 14, y);
  y += 8;

  doc.line(14, y, 196, y);
  y += 7;
  doc.setFontSize(10);
  doc.text('SKU', 14, y);
  doc.text('Product Description', 52, y);
  doc.text('Qty', 178, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFontSize(9);
  for (const item of order.items) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(String(item.sku || '-').slice(0, 18), 14, y);
    const label = `${item.name}${item.variant ? ` (${item.variant})` : ''}${item.color ? ` [${item.color}]` : ''}`;
    doc.text(label.slice(0, 62), 52, y);
    doc.text(String(item.qty), 180, y);
    y += 7;
  }

  y += 10;
  doc.line(14, y, 196, y);
  y += 7;
  doc.text('Packed & QC Verified By: NexusTekFusion Dispatch Team (Nagpur)', 14, y);

  doc.save(`${order.orderNumber}_PackingSlip.pdf`);
}

function addCompanyHeader(doc: jsPDF, gstin?: string) {
  doc.setFontSize(16);
  doc.text('NEXUSTEKFUSION PRIVATE LIMITED', 14, 18);
  doc.setFontSize(9);
  doc.text('CIN: U30305ME2026PTC474052 | info@nexustekfusion.in | https://nexustekfusion.in', 14, 24);
  doc.text('H NO. 565/19 NIT, SANKUL NEW COTTON MARK, Ganjipeth, Nagpur 440018, India', 14, 29);
  if (gstin) doc.text(`GSTIN: ${gstin}`, 14, 34);
  doc.setDrawColor(190);
  doc.line(14, 38, 196, 38);
}

export function downloadPaymentReceiptPdf(params: {
  receiptNumber: string;
  paymentRef: string;
  razorpayPaymentId?: string;
  paymentStage: string;
  amountInr: number;
  issuedAt: string;
  customerEmail: string;
  referenceCode?: string;
  gstin?: string;
}) {
  const doc = new jsPDF();
  addCompanyHeader(doc, params.gstin);
  doc.setFontSize(14);
  doc.text('OFFICIAL PAYMENT RECEIPT', 14, 48);
  doc.setFontSize(10);
  doc.text(`Receipt No: ${params.receiptNumber}`, 14, 57);
  doc.text(`Payment Ref: ${params.paymentRef}`, 14, 63);
  if (params.razorpayPaymentId) doc.text(`Gateway Transaction ID: ${params.razorpayPaymentId}`, 14, 69);
  doc.text(`Issued Date: ${new Date(params.issuedAt).toLocaleDateString('en-IN')}`, 14, 75);
  doc.text(`Customer: ${params.customerEmail}`, 14, 81);
  if (params.referenceCode) doc.text(`Project / Booking Ref: ${params.referenceCode}`, 14, 87);
  doc.text(`Payment Stage: ${params.paymentStage.toUpperCase()}`, 14, 93);
  doc.line(14, 100, 196, 100);
  doc.setFontSize(12);
  doc.text(`Verified Amount Received: INR ${params.amountInr.toLocaleString('en-IN')}`, 14, 110);
  doc.setFontSize(9);
  doc.text('Digitally verified by NEXUSTEKFUSION PRIVATE LIMITED Accounts System.', 14, 126);
  doc.save(`${params.receiptNumber}.pdf`);
}

export function downloadWorkOrderPdf(params: {
  workOrderNumber: string;
  projectCode: string;
  projectTitle: string;
  assignedEngineer: string;
  estimatedCompletionDate?: string;
  scopeSummary?: string;
  issuedAt: string;
  customerEmail: string;
}) {
  const doc = new jsPDF();
  addCompanyHeader(doc);
  doc.setFontSize(14);
  doc.text('ENGINEERING WORK ORDER', 14, 48);
  doc.setFontSize(10);
  doc.text(`Work Order No: ${params.workOrderNumber}`, 14, 57);
  doc.text(`Project Code: ${params.projectCode}`, 14, 63);
  doc.text(`Project Title: ${params.projectTitle}`, 14, 69);
  doc.text(`Client: ${params.customerEmail}`, 14, 75);
  doc.text(`Assigned Engineer: ${params.assignedEngineer}`, 14, 81);
  if (params.estimatedCompletionDate) doc.text(`Target Completion: ${params.estimatedCompletionDate}`, 14, 87);
  doc.text(`Issued Date: ${new Date(params.issuedAt).toLocaleDateString('en-IN')}`, 14, 93);
  doc.line(14, 99, 196, 99);
  doc.text('Authorized Technical Scope:', 14, 108);
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(params.scopeSummary || 'As per approved project quotation.', 180);
  doc.text(lines, 14, 115);
  doc.save(`${params.workOrderNumber}.pdf`);
}

export function downloadClearanceCertificatePdf(params: {
  certificateNumber: string;
  projectCode: string;
  projectTitle: string;
  totalAmountInr: number;
  advancePaidInr: number;
  finalPaidInr: number;
  balanceInr: number;
  paymentRefs: string[];
  issuedAt: string;
  issuedBy: string;
  customerEmail: string;
}) {
  const doc = new jsPDF();
  addCompanyHeader(doc);
  doc.setFillColor(11, 27, 59);
  doc.rect(14, 44, 182, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('PAYMENT CLEARED — PROJECT READY FOR HANDOVER', 20, 52);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(10);
  doc.text(`Certificate Number: ${params.certificateNumber}`, 14, 66);
  doc.text(`Project Code: ${params.projectCode} — ${params.projectTitle}`, 14, 72);
  doc.text(`Customer Account: ${params.customerEmail}`, 14, 78);
  doc.text(`Issued At: ${new Date(params.issuedAt).toLocaleString('en-IN')}`, 14, 84);
  doc.text(`Authorized By: ${params.issuedBy}`, 14, 90);
  doc.line(14, 96, 196, 96);

  doc.text(`Total Contract Value: INR ${params.totalAmountInr.toLocaleString('en-IN')}`, 14, 106);
  doc.text(`Advance Verified: INR ${params.advancePaidInr.toLocaleString('en-IN')}`, 14, 113);
  doc.text(`Final Balance Verified: INR ${params.finalPaidInr.toLocaleString('en-IN')}`, 14, 120);
  doc.setFontSize(12);
  doc.text(`Outstanding Balance Due: INR ${params.balanceInr.toLocaleString('en-IN')}`, 14, 129);
  doc.setFontSize(9);
  doc.text(`Verified Payment References: ${params.paymentRefs.join(', ') || 'Recorded'}`, 14, 140);
  doc.save(`${params.certificateNumber}.pdf`);
}

export function downloadCompletionCertificatePdf(params: {
  certificateNumber: string;
  projectCode: string;
  projectTitle: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
  assignedEngineer: string;
}) {
  const doc = new jsPDF();
  addCompanyHeader(doc);
  doc.setFontSize(15);
  doc.text('PROJECT COMPLETION & HANDOVER CERTIFICATE', 14, 52);
  doc.setFontSize(10);
  doc.text(`Completion Certificate No: ${params.certificateNumber}`, 14, 64);
  doc.text(`Project Code: ${params.projectCode}`, 14, 71);
  doc.text(`Project Title: ${params.projectTitle}`, 14, 78);
  doc.text(`Lead Engineer: ${params.assignedEngineer}`, 14, 85);
  doc.text(`Acknowledged By Client: ${params.acknowledgedBy}`, 14, 92);
  doc.text(`Handover Timestamp: ${new Date(params.acknowledgedAt).toLocaleString('en-IN')}`, 14, 99);
  doc.line(14, 106, 196, 106);
  doc.setFontSize(9);
  doc.text(
    'This certifies that all deliverables for the above project have been handed over and acknowledged.',
    14,
    116
  );
  doc.save(`${params.certificateNumber}.pdf`);
}

export function downloadProjectFinanceReportPdf(params: {
  summary: {
    projectCount: number;
    totalQuotedInr: number;
    totalCollectedInr: number;
    totalOutstandingInr: number;
    clearedProjectsCount: number;
  };
  projects: Array<{
    projectCode: string;
    title: string;
    customerName: string;
    totalAmountInr: number;
    paidAmountInr: number;
    balanceAmountInr: number;
    paymentClearanceStatus: string;
  }>;
}) {
  const doc = new jsPDF();
  addCompanyHeader(doc);
  doc.setFontSize(13);
  doc.text('PROJECT FINANCIAL SUMMARY REPORT', 14, 48);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 54);
  doc.text(
    `Projects: ${params.summary.projectCount} | Quoted: INR ${params.summary.totalQuotedInr.toLocaleString('en-IN')} | Collected: INR ${params.summary.totalCollectedInr.toLocaleString('en-IN')} | Outstanding: INR ${params.summary.totalOutstandingInr.toLocaleString('en-IN')}`,
    14,
    61
  );
  doc.line(14, 66, 196, 66);
  let y = 74;
  for (const p of params.projects) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(`${p.projectCode} — ${p.title.slice(0, 38)} (${p.customerName})`, 14, y);
    doc.text(
      `Total: ${p.totalAmountInr} | Paid: ${p.paidAmountInr} | Bal: ${p.balanceAmountInr} [${p.paymentClearanceStatus}]`,
      14,
      y + 4.5
    );
    y += 11;
  }
  doc.save(`NexusTekFusion_Project_Finance_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadKrashivantriReportPdf(params: {
  summary: {
    totalBookings: number;
    totalFarmerCollectionsInr: number;
    platformCommissionInr: number;
    settledPayoutsInr: number;
    pendingPayoutsInr: number;
    totalPenaltiesInr: number;
  };
}) {
  const doc = new jsPDF();
  addCompanyHeader(doc);
  doc.setFontSize(13);
  doc.text('KRASHIVANTRI DRONE OPERATIONS FINANCIAL REPORT', 14, 48);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 14, 56);
  doc.line(14, 62, 196, 62);
  const lines = [
    `Total Spraying Bookings: ${params.summary.totalBookings}`,
    `Total Farmer Collections: INR ${params.summary.totalFarmerCollectionsInr.toLocaleString('en-IN')}`,
    `Platform Commission Earned: INR ${params.summary.platformCommissionInr.toLocaleString('en-IN')}`,
    `Settled Pilot Payouts: INR ${params.summary.settledPayoutsInr.toLocaleString('en-IN')}`,
    `Pending Pilot Payouts: INR ${params.summary.pendingPayoutsInr.toLocaleString('en-IN')}`,
    `Active / Deducted Penalties: INR ${params.summary.totalPenaltiesInr.toLocaleString('en-IN')}`,
  ];
  let y = 72;
  for (const l of lines) {
    doc.text(l, 14, y);
    y += 8;
  }
  doc.save(`KRASHIVANTRI_Financial_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
