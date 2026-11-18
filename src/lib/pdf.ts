import { jsPDF } from 'jspdf';

export function downloadQuotationPdf(params: {
  enquiryNumber: string;
  projectTitle: string;
  customerName: string;
  customerEmail: string;
  quotation: {
    id: number;
    revisionNumber: number;
    items: Array<{ name: string; description: string; qty: number; unitPriceInr: number }>;
    hardwareCostInr: number;
    softwareCostInr: number;
    designDevChargesInr: number;
    testingChargesInr: number;
    documentationChargesInr: number;
    deliveryChargesInr: number;
    costCategories?: Record<string, number>;
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
  doc.text(`PROJECT QUOTATION — REV #${q.revisionNumber}`, 14, 46);
  doc.setFontSize(10);
  doc.text(`Enquiry Ref: ${params.enquiryNumber}`, 14, 53);
  doc.text(`Project: ${params.projectTitle}`, 14, 59);
  doc.text(`Prepared For: ${params.customerName} (${params.customerEmail})`, 14, 65);
  doc.text(`Status: ${q.status} | Validity: ${q.validityDays || 15} Days`, 14, 71);
  if (q.estimatedDuration) {
    doc.text(`Estimated Duration: ${q.estimatedDuration}`, 14, 77);
  }

  let y = q.estimatedDuration ? 86 : 80;
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
