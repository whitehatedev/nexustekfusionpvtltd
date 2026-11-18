import { Router } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  b2bEnquiries,
  customerAddresses,
  dronePilots,
  droneRepairBookings,
  farmers,
  invoices,
  notifications,
  paymentClearanceCertificates,
  paymentReceipts,
  payments,
  pcbEnquiries,
  printingMachines,
  printingMaterials,
  printingOrders,
  productReviews,
  products,
  projectAcceptances,
  projectDeliveryRecords,
  projectEnquiries,
  projectHandoverDocuments,
  projectPaymentMilestones,
  projectPaymentPlans,
  projectQuotations,
  projectWorkOrders,
  projects,
  siteSettings,
  storeOrders,
  supportTickets,
  users,
  wishlists,
} from '../../db/schema.ts';
import { dispatchLifecycleEmail } from '../email.ts';
import { ADMIN_ROLES, AuthRequest, requireAuth } from '../../middleware/auth.ts';
import { analyzeAndSliceModel } from '../slicer.ts';
import { createRazorpayOrder, verifyRazorpaySignature } from '../razorpay.ts';
import {
  createNotification,
  createUploadMiddleware,
  generateCode,
  isValidIndianPin,
  UPLOADS_ROOT,
} from '../utils.ts';

export const customerRouter = Router();

const modelUpload = createUploadMiddleware('3d-models', ['.stl', '.obj', '.3mf', '.step', '.stp'], 80);
const projectUpload = createUploadMiddleware(
  'projects',
  ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.zip', '.csv', '.txt'],
  40
);
const pcbUpload = createUploadMiddleware(
  'pcb',
  ['.zip', '.rar', '.gbr', '.gerber', '.pdf', '.csv', '.xlsx', '.png', '.jpg', '.jpeg'],
  40
);
const b2bUpload = createUploadMiddleware(
  'b2b',
  ['.pdf', '.doc', '.docx', '.xlsx', '.csv', '.zip', '.png', '.jpg', '.jpeg'],
  40
);

// Profile & Unified Customer Dashboard Summary
customerRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.dbUser!.id;
    const [
      addresses,
      myStoreOrders,
      myPrintOrders,
      myEnquiries,
      myProjects,
      myPcb,
      myB2b,
      myRepairs,
      myPayments,
      myInvoices,
      myReceipts,
      myClearances,
      myWorkOrders,
      myHandoverDocs,
      myWishlist,
      myNotifications,
      myTickets,
      myFarmerRows,
      myPilotRows,
    ] = await Promise.all([
      db.select().from(customerAddresses).where(eq(customerAddresses.userId, userId)).orderBy(desc(customerAddresses.isDefault)),
      db.select().from(storeOrders).where(and(eq(storeOrders.userId, userId), eq(storeOrders.isDeleted, false))).orderBy(desc(storeOrders.createdAt)),
      db.select().from(printingOrders).where(eq(printingOrders.userId, userId)).orderBy(desc(printingOrders.createdAt)),
      db.select().from(projectEnquiries).where(and(eq(projectEnquiries.userId, userId), eq(projectEnquiries.isDeleted, false))).orderBy(desc(projectEnquiries.createdAt)),
      db.select().from(projects).where(and(eq(projects.userId, userId), eq(projects.isDeleted, false))).orderBy(desc(projects.createdAt)),
      db.select().from(pcbEnquiries).where(eq(pcbEnquiries.userId, userId)).orderBy(desc(pcbEnquiries.createdAt)),
      db.select().from(b2bEnquiries).where(eq(b2bEnquiries.userId, userId)).orderBy(desc(b2bEnquiries.createdAt)),
      db.select().from(droneRepairBookings).where(eq(droneRepairBookings.userId, userId)).orderBy(desc(droneRepairBookings.createdAt)),
      db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.createdAt)),
      db.select().from(invoices).where(and(eq(invoices.userId, userId), eq(invoices.isDeleted, false))).orderBy(desc(invoices.issuedAt)),
      db.select().from(paymentReceipts).where(eq(paymentReceipts.userId, userId)).orderBy(desc(paymentReceipts.issuedAt)),
      db.select().from(paymentClearanceCertificates).where(eq(paymentClearanceCertificates.userId, userId)).orderBy(desc(paymentClearanceCertificates.issuedAt)),
      db.select().from(projectWorkOrders).where(eq(projectWorkOrders.userId, userId)).orderBy(desc(projectWorkOrders.issuedAt)),
      db.select().from(projectHandoverDocuments).where(and(eq(projectHandoverDocuments.userId, userId), eq(projectHandoverDocuments.isDeleted, false))).orderBy(desc(projectHandoverDocuments.createdAt)),
      db
        .select({ wishlist: wishlists, product: products })
        .from(wishlists)
        .innerJoin(products, eq(wishlists.productId, products.id))
        .where(eq(wishlists.userId, userId)),
      db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(30),
      db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt)),
      db.select().from(farmers).where(eq(farmers.userId, userId)).limit(1),
      db.select().from(dronePilots).where(eq(dronePilots.userId, userId)).limit(1),
    ]);

    const enquiryIds = myEnquiries.map((e) => e.id);
    const projectIds = myProjects.map((p) => p.id);
    const [allQuotations, allPlans, allMilestones, allAcceptances, allDeliveries] = await Promise.all([
      enquiryIds.length > 0 ? db.select().from(projectQuotations).orderBy(desc(projectQuotations.createdAt)) : Promise.resolve([]),
      enquiryIds.length > 0 ? db.select().from(projectPaymentPlans).orderBy(desc(projectPaymentPlans.createdAt)) : Promise.resolve([]),
      enquiryIds.length > 0 ? db.select().from(projectPaymentMilestones) : Promise.resolve([]),
      enquiryIds.length > 0 ? db.select().from(projectAcceptances).orderBy(desc(projectAcceptances.acceptedAt)) : Promise.resolve([]),
      projectIds.length > 0 ? db.select().from(projectDeliveryRecords).orderBy(desc(projectDeliveryRecords.createdAt)) : Promise.resolve([]),
    ]);

    const myQuotations = allQuotations.filter((q) => enquiryIds.includes(q.enquiryId));
    const myQuoteIds = new Set(myQuotations.map((q) => q.id));
    const myPaymentPlans = allPlans.filter((p) => enquiryIds.includes(p.enquiryId));
    const myPaymentMilestones = allMilestones.filter((m) => myQuoteIds.has(m.quotationId));
    const myAcceptances = allAcceptances.filter((a) => enquiryIds.includes(a.enquiryId));
    const myDeliveryRecords = allDeliveries.filter((d) => projectIds.includes(d.projectId));

    // Gate storagePath exposure for unpaid locked handover documents
    const projectMap = Object.fromEntries(myProjects.map((p) => [p.id, p]));
    const safeHandoverDocs = myHandoverDocs.map((doc) => {
      const proj = projectMap[doc.projectId];
      const unlocked = Boolean(proj && (proj.handoverUnlocked || proj.handoverExceptionAuthorized));
      return {
        ...doc,
        storagePath: unlocked ? doc.storagePath : '',
        downloadToken: unlocked ? doc.downloadToken : '',
        unlocked,
      };
    });

    res.json({
      user: req.dbUser,
      addresses,
      storeOrders: myStoreOrders,
      printingOrders: myPrintOrders,
      projectEnquiries: myEnquiries,
      quotations: myQuotations,
      projects: myProjects,
      paymentPlans: myPaymentPlans,
      paymentMilestones: myPaymentMilestones,
      acceptances: myAcceptances,
      receipts: myReceipts,
      clearanceCertificates: myClearances,
      workOrders: myWorkOrders,
      handoverDocuments: safeHandoverDocs,
      deliveryRecords: myDeliveryRecords,
      pcbEnquiries: myPcb,
      b2bEnquiries: myB2b,
      droneRepairs: myRepairs,
      payments: myPayments,
      invoices: myInvoices,
      wishlist: myWishlist.map((w) => w.product),
      notifications: myNotifications,
      supportTickets: myTickets,
      farmerProfile: myFarmerRows[0] || null,
      pilotProfile: myPilotRows[0] || null,
    });
  } catch (error) {
    console.error('Profile summary error:', error);
    res.status(500).json({ error: 'Failed to load account dashboard.' });
  }
});

customerRouter.put('/me', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { fullName, mobile, companyOrCollege } = req.body;
    const [updated] = await db
      .update(users)
      .set({
        fullName: String(fullName ?? req.dbUser!.fullName).trim(),
        mobile: String(mobile ?? req.dbUser!.mobile).trim(),
        companyOrCollege: String(companyOrCollege ?? req.dbUser!.companyOrCollege).trim(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, req.dbUser!.id))
      .returning();

    res.json({ user: updated });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

customerRouter.post('/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, Number(req.params.id)), eq(notifications.userId, req.dbUser!.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// Address Management
customerRouter.post('/addresses', requireAuth, async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    if (!b.fullName || !b.mobile || !b.houseFlat || !b.streetArea || !b.city || !b.district || !b.state || !b.pinCode) {
      return res.status(400).json({ error: 'All required address fields must be completed.' });
    }
    if ((b.country || 'India') === 'India' && !isValidIndianPin(String(b.pinCode))) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit Indian PIN code.' });
    }
    if (b.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.userId, req.dbUser!.id));
    }
    const [created] = await db
      .insert(customerAddresses)
      .values({
        userId: req.dbUser!.id,
        label: String(b.label || 'Delivery').trim(),
        addressType: String(b.addressType || 'both'),
        fullName: String(b.fullName).trim(),
        mobile: String(b.mobile).trim(),
        houseFlat: String(b.houseFlat).trim(),
        streetArea: String(b.streetArea).trim(),
        landmark: String(b.landmark || '').trim(),
        city: String(b.city).trim(),
        district: String(b.district).trim(),
        state: String(b.state).trim(),
        pinCode: String(b.pinCode).trim(),
        country: String(b.country || 'India').trim(),
        isDefault: Boolean(b.isDefault),
      })
      .returning();
    res.status(201).json({ address: created });
  } catch (error) {
    console.error('Address create error:', error);
    res.status(500).json({ error: 'Failed to save address.' });
  }
});

customerRouter.put('/addresses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    if ((b.country || 'India') === 'India' && b.pinCode && !isValidIndianPin(String(b.pinCode))) {
      return res.status(400).json({ error: 'Please enter a valid 6-digit Indian PIN code.' });
    }
    if (b.isDefault) {
      await db
        .update(customerAddresses)
        .set({ isDefault: false })
        .where(eq(customerAddresses.userId, req.dbUser!.id));
    }
    const [updated] = await db
      .update(customerAddresses)
      .set({
        label: b.label,
        addressType: b.addressType,
        fullName: b.fullName,
        mobile: b.mobile,
        houseFlat: b.houseFlat,
        streetArea: b.streetArea,
        landmark: b.landmark || '',
        city: b.city,
        district: b.district,
        state: b.state,
        pinCode: b.pinCode,
        country: b.country || 'India',
        isDefault: Boolean(b.isDefault),
        updatedAt: new Date(),
      })
      .where(and(eq(customerAddresses.id, id), eq(customerAddresses.userId, req.dbUser!.id)))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Address not found.' });
    res.json({ address: updated });
  } catch (error) {
    console.error('Address update error:', error);
    res.status(500).json({ error: 'Failed to update address.' });
  }
});

customerRouter.delete('/addresses/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    await db
      .delete(customerAddresses)
      .where(and(eq(customerAddresses.id, Number(req.params.id)), eq(customerAddresses.userId, req.dbUser!.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to remove address.' });
  }
});

// Wishlist & Verified Product Reviews
customerRouter.post('/wishlist/toggle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.body.productId);
    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, req.dbUser!.id), eq(wishlists.productId, productId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
      return res.json({ wishlisted: false });
    }
    await db.insert(wishlists).values({ userId: req.dbUser!.id, productId });
    res.json({ wishlisted: true });
  } catch {
    res.status(500).json({ error: 'Failed to update wishlist.' });
  }
});

customerRouter.post('/reviews', requireAuth, async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.body.productId);
    const rating = Math.min(5, Math.max(1, Number(req.body.rating || 5)));
    const comment = String(req.body.comment || '').trim();
    if (!comment) return res.status(400).json({ error: 'Review comment is required.' });

    const userOrders = await db
      .select()
      .from(storeOrders)
      .where(and(eq(storeOrders.userId, req.dbUser!.id), eq(storeOrders.paymentStatus, 'paid')));

    const hasPurchased = userOrders.some((order) =>
      order.items.some((item) => item.productId === productId)
    );

    if (!hasPurchased) {
      return res.status(403).json({
        error: 'Verified-purchase policy: you can submit a review after purchasing this product.',
      });
    }

    const [review] = await db
      .insert(productReviews)
      .values({
        productId,
        userId: req.dbUser!.id,
        authorName: req.dbUser!.fullName || req.dbUser!.email.split('@')[0],
        rating,
        comment,
        verifiedPurchase: true,
      })
      .returning();

    res.status(201).json({ review });
  } catch (error) {
    console.error('Review error:', error);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// 3D Printing Slicing & Order Endpoints
customerRouter.post(
  '/3d-printing/slice',
  requireAuth,
  modelUpload.single('model'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Please upload a valid 3D model (.STL, .OBJ, .3MF, .STEP).' });
      }

      const technology = String(req.body.technology || 'FDM');
      const materialId = Number(req.body.materialId || 0);
      const layerHeightMm = Number(req.body.layerHeightMm || 0.2);
      const infillPercent = Number(req.body.infillPercent || 20);
      const supportEnabled = req.body.supportEnabled !== 'false';
      const quantity = Math.max(1, Number(req.body.quantity || 1));
      const finishingOption = String(req.body.finishingOption || 'Standard As-Printed');

      const [materials, machines, shippingRows] = await Promise.all([
        db.select().from(printingMaterials).where(eq(printingMaterials.isActive, true)),
        db.select().from(printingMachines).where(eq(printingMachines.isActive, true)),
        db.select().from(siteSettings).where(eq(siteSettings.key, 'shippingConfig')).limit(1),
      ]);

      const material =
        materials.find((m) => m.id === materialId) ||
        materials.find((m) => m.technology === technology) ||
        materials[0];
      const machine = machines.find((m) => m.technology === technology) || machines[0];

      if (!material || !machine) {
        return res.status(400).json({ error: 'No active 3D printer or material configured.' });
      }

      const shippingCfg = (shippingRows[0]?.value as { standardShippingInr?: number; defaultGstPercent?: number }) || {};

      const slicing = analyzeAndSliceModel({
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSizeBytes: req.file.size,
        technology,
        material: {
          name: material.name,
          densityGcm3: material.densityGcm3,
          ratePerGramInr: material.ratePerGramInr,
        },
        machine,
        layerHeightMm,
        infillPercent,
        supportEnabled,
        quantity,
        finishingOption,
        gstPercent: shippingCfg.defaultGstPercent ?? 18,
        shippingInr: shippingCfg.standardShippingInr ?? 99,
      });

      res.json({
        upload: {
          fileName: req.file.originalname,
          fileSizeBytes: req.file.size,
          fileStoragePath: path.relative(UPLOADS_ROOT, req.file.path),
        },
        slicing,
        materialName: material.name,
        machineName: machine.name,
      });
    } catch (error: any) {
      console.error('3D Slicing error:', error);
      res.status(500).json({ error: error?.message || 'Failed to slice 3D model.' });
    }
  }
);

customerRouter.post('/3d-printing/orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    if (!b.fileStoragePath || !b.fileName || !b.deliveryAddress) {
      return res.status(400).json({ error: 'Uploaded model, slicing configuration, and delivery address are required.' });
    }

    const absFile = path.resolve(UPLOADS_ROOT, String(b.fileStoragePath));
    if (!absFile.startsWith(UPLOADS_ROOT) || !fs.existsSync(absFile)) {
      return res.status(400).json({ error: 'Uploaded 3D model file not found. Please upload again.' });
    }

    const [materials, machines, shippingRows] = await Promise.all([
      db.select().from(printingMaterials).where(eq(printingMaterials.isActive, true)),
      db.select().from(printingMachines).where(eq(printingMachines.isActive, true)),
      db.select().from(siteSettings).where(eq(siteSettings.key, 'shippingConfig')).limit(1),
    ]);

    const technology = String(b.technology || 'FDM');
    const material =
      materials.find((m) => m.name === b.materialName && m.technology === technology) ||
      materials.find((m) => m.technology === technology) ||
      materials[0];
    const machine = machines.find((m) => m.technology === technology) || machines[0];
    const shippingCfg = (shippingRows[0]?.value as { standardShippingInr?: number; defaultGstPercent?: number }) || {};

    // Re-run authoritative server-side slicing & pricing calculation
    const slicing = analyzeAndSliceModel({
      filePath: absFile,
      fileName: String(b.fileName),
      fileSizeBytes: fs.statSync(absFile).size,
      technology,
      material: {
        name: material.name,
        densityGcm3: material.densityGcm3,
        ratePerGramInr: material.ratePerGramInr,
      },
      machine,
      layerHeightMm: Number(b.layerHeightMm || 0.2),
      infillPercent: Number(b.infillPercent || 20),
      supportEnabled: Boolean(b.supportEnabled ?? true),
      quantity: Math.max(1, Number(b.quantity || 1)),
      finishingOption: String(b.finishingOption || 'Standard As-Printed'),
      gstPercent: shippingCfg.defaultGstPercent ?? 18,
      shippingInr: shippingCfg.standardShippingInr ?? 99,
    });

    const orderNumber = generateCode('NTF-3DP');
    const [order] = await db
      .insert(printingOrders)
      .values({
        orderNumber,
        userId: req.dbUser!.id,
        fileName: String(b.fileName),
        fileFormat: slicing.fileFormat,
        fileSizeBytes: fs.statSync(absFile).size,
        fileStoragePath: String(b.fileStoragePath),
        boundingBoxMm: slicing.boundingBoxMm,
        volumeCm3: slicing.volumeCm3,
        estimatedWeightG: slicing.estimatedWeightG,
        estimatedPrintMinutes: slicing.estimatedPrintMinutes,
        technology,
        materialName: material.name,
        colorName: String(b.colorName || 'Black'),
        layerHeightMm: Number(b.layerHeightMm || 0.2),
        infillPercent: Number(b.infillPercent || 20),
        supportEnabled: Boolean(b.supportEnabled ?? true),
        quantity: Math.max(1, Number(b.quantity || 1)),
        finishingOption: String(b.finishingOption || 'Standard As-Printed'),
        specialInstructions: String(b.specialInstructions || ''),
        pricingBreakdown: slicing.pricingBreakdown,
        totalInr: slicing.pricingBreakdown.totalInr,
        deliveryAddress: b.deliveryAddress,
        slicingStatus: slicing.slicingStatus,
        orderStatus: slicing.technicalReviewRequired ? 'Technical Review' : 'Order Placed',
        paymentStatus: 'pending',
      })
      .returning();

    await createNotification({
      userId: req.dbUser!.id,
      title: `3D Printing Order ${order.orderNumber} Created`,
      message: slicing.technicalReviewRequired
        ? 'Your CAD model requires engineering review before payment and slicing confirmation.'
        : `Estimated total ₹${order.totalInr}. Complete payment to schedule printing.`,
      link: '/my-account',
    });

    res.status(201).json({ order });
  } catch (error) {
    console.error('Create 3D print order error:', error);
    res.status(500).json({ error: 'Failed to create 3D printing order.' });
  }
});

// Store Order Creation (Atomic Stock Check & Reservation)
customerRouter.post('/store-orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { items, billingAddress, shippingAddress, couponCode } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ error: 'Cart items and delivery address are required.' });
    }

    const result = await db.transaction(async (tx) => {
      let subtotalInr = 0;
      let gstInr = 0;
      const lineItems: Array<{
        productId: number;
        sku: string;
        name: string;
        variant?: string;
        color?: string;
        qty: number;
        unitPriceInr: number;
        gstPercent: number;
        lineTotalInr: number;
      }> = [];

      for (const reqItem of items) {
        const productId = Number(reqItem.productId);
        const qty = Math.max(1, Math.floor(Number(reqItem.qty || 1)));

        const updatedRows = await tx
          .update(products)
          .set({
            stockQty: sql`${products.stockQty} - ${qty}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(products.id, productId),
              eq(products.isPublished, true),
              eq(products.isDeleted, false),
              gte(products.stockQty, qty)
            )
          )
          .returning();

        if (updatedRows.length === 0) {
          throw new Error(`Insufficient stock or unavailable product (ID ${productId}).`);
        }

        const prod = updatedRows[0];
        if (prod.productType === 'quote_only' || prod.priceInr <= 0) {
          throw new Error(`"${prod.name}" requires a custom quotation. Please use Request a Quote.`);
        }
        const unitPrice =
          prod.discountPriceInr !== null && prod.discountPriceInr < prod.priceInr
            ? prod.discountPriceInr
            : prod.priceInr;
        const lineTotal = unitPrice * qty;
        subtotalInr += lineTotal;
        gstInr += Math.round((lineTotal * prod.gstPercent) / 100);

        lineItems.push({
          productId: prod.id,
          sku: prod.sku,
          name: prod.name,
          variant: reqItem.variant || undefined,
          color: reqItem.color || undefined,
          qty,
          unitPriceInr: unitPrice,
          gstPercent: prod.gstPercent,
          lineTotalInr: lineTotal,
        });
      }

      const [shippingRow] = await tx
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.key, 'shippingConfig'))
        .limit(1);
      const shippingCfg = (shippingRow?.value as { standardShippingInr?: number; freeShippingAboveInr?: number }) || {};
      const freeThreshold = shippingCfg.freeShippingAboveInr ?? 2500;
      const shippingInr = subtotalInr >= freeThreshold ? 0 : (shippingCfg.standardShippingInr ?? 99);

      let discountInr = 0;
      let appliedCoupon = '';
      if (couponCode) {
        const code = String(couponCode).trim().toUpperCase();
        const { coupons } = await import('../../db/schema.ts');
        const [coupon] = await tx
          .select()
          .from(coupons)
          .where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
          .limit(1);
        if (coupon && subtotalInr >= coupon.minOrderInr) {
          appliedCoupon = coupon.code;
          discountInr =
            coupon.discountType === 'percent'
              ? Math.round((subtotalInr * coupon.discountValue) / 100)
              : Math.min(subtotalInr, coupon.discountValue);
        }
      }

      const totalInr = Math.max(1, subtotalInr - discountInr + shippingInr + gstInr);
      const orderNumber = generateCode('NTF-ORD');

      const [order] = await tx
        .insert(storeOrders)
        .values({
          orderNumber,
          userId: req.dbUser!.id,
          billingAddress: billingAddress || shippingAddress,
          shippingAddress,
          items: lineItems,
          subtotalInr,
          discountInr,
          shippingInr,
          gstInr,
          totalInr,
          couponCode: appliedCoupon,
          paymentStatus: 'pending',
          orderStatus: 'Order Placed',
        })
        .returning();

      return order;
    });

    res.status(201).json({ order: result });
  } catch (error: any) {
    console.error('Store order creation error:', error);
    res.status(400).json({ error: error?.message || 'Failed to place store order.' });
  }
});

// Project Enquiries & Quotation Responses
customerRouter.post(
  '/project-enquiries',
  requireAuth,
  projectUpload.array('attachments', 6),
  async (req: AuthRequest, res) => {
    try {
      const b = req.body;
      if (!b.projectTitle || !b.engineeringBranch || !b.projectCategory || !b.projectDescription) {
        return res.status(400).json({ error: 'Project title, branch, category, and description are required.' });
      }

      const billingAddress =
        typeof b.billingAddress === 'string' ? JSON.parse(b.billingAddress) : b.billingAddress;
      const deliveryAddress =
        typeof b.deliveryAddress === 'string' ? JSON.parse(b.deliveryAddress) : b.deliveryAddress;

      if (!billingAddress || !deliveryAddress) {
        return res.status(400).json({ error: 'Billing and delivery addresses are required.' });
      }

      const files = (req.files as Express.Multer.File[]) || [];
      const attachments = files.map((f) => ({
        originalName: f.originalname,
        storagePath: path.relative(UPLOADS_ROOT, f.path),
        sizeBytes: f.size,
      }));

      const flags =
        typeof b.flags === 'string'
          ? JSON.parse(b.flags)
          : b.flags && typeof b.flags === 'object'
          ? b.flags
          : {};

      const enquiryNumber = generateCode('NTF-ENQ');
      const [enquiry] = await db
        .insert(projectEnquiries)
        .values({
          enquiryNumber,
          userId: req.dbUser!.id,
          customerName: String(b.customerName || req.dbUser!.fullName || req.dbUser!.email),
          customerEmail: String(b.customerEmail || req.dbUser!.email),
          customerPhone: String(b.customerPhone || req.dbUser!.mobile || ''),
          companyOrCollege: String(b.companyOrCollege || ''),
          courseDepartment: String(b.courseDepartment || ''),
          teamType: String(b.teamType || 'Individual'),
          teamCount: Math.max(1, Number(b.teamCount || 1)),
          projectTitle: String(b.projectTitle).trim(),
          engineeringBranch: String(b.engineeringBranch).trim(),
          academicLevel: String(b.academicLevel || 'Industrial / Commercial'),
          projectCategory: String(b.projectCategory).trim(),
          projectType: String(b.projectType || 'Hardware + Software'),
          projectDescription: String(b.projectDescription).trim(),
          problemStatement: String(b.problemStatement || ''),
          expectedFunctionality: String(b.expectedFunctionality || ''),
          requiredTechnologies: String(b.requiredTechnologies || ''),
          expectedDeliverables: String(b.expectedDeliverables || ''),
          targetCompletionDate: String(b.targetCompletionDate || ''),
          estimatedBudget: String(b.estimatedBudget || ''),
          budgetMinInr: b.budgetMinInr ? Number(b.budgetMinInr) : null,
          budgetMaxInr: b.budgetMaxInr ? Number(b.budgetMaxInr) : null,
          flags,
          specialRequirements: String(b.specialRequirements || ''),
          attachments,
          billingAddress,
          deliveryAddress,
          addressHistory: [
            {
              changedAt: new Date().toISOString(),
              changedBy: req.dbUser!.email,
              deliveryAddress,
            },
          ],
          status: 'Submitted',
        })
        .returning();

      await createNotification({
        userId: req.dbUser!.id,
        title: `Project Enquiry ${enquiry.enquiryNumber} Submitted`,
        message: `Our engineering team has received "${enquiry.projectTitle}" for technical review.`,
        link: '/my-account',
      });

      res.status(201).json({ enquiry });
    } catch (error) {
      console.error('Project enquiry error:', error);
      res.status(500).json({ error: 'Failed to submit project enquiry.' });
    }
  }
);

customerRouter.patch('/project-enquiries/:id/delivery-address', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { deliveryAddress } = req.body;
    const [existing] = await db
      .select()
      .from(projectEnquiries)
      .where(and(eq(projectEnquiries.id, id), eq(projectEnquiries.userId, req.dbUser!.id)))
      .limit(1);

    if (!existing) return res.status(404).json({ error: 'Project enquiry not found.' });
    if (['Dispatched', 'Completed'].includes(existing.status)) {
      return res.status(400).json({ error: 'Address cannot be modified after dispatch.' });
    }

    const updatedHistory = [
      ...existing.addressHistory,
      {
        changedAt: new Date().toISOString(),
        changedBy: req.dbUser!.email,
        deliveryAddress,
      },
    ];

    const [updated] = await db
      .update(projectEnquiries)
      .set({
        deliveryAddress,
        addressHistory: updatedHistory,
        updatedAt: new Date(),
      })
      .where(eq(projectEnquiries.id, id))
      .returning();

    res.json({ enquiry: updated });
  } catch (error) {
    console.error('Update enquiry address error:', error);
    res.status(500).json({ error: 'Failed to update delivery address.' });
  }
});

customerRouter.post('/quotations/:id/respond', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { action, feedback } = req.body; // accept | modify | reject

    const [quotation] = await db
      .select()
      .from(projectQuotations)
      .where(eq(projectQuotations.id, id))
      .limit(1);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found.' });

    const [enquiry] = await db
      .select()
      .from(projectEnquiries)
      .where(and(eq(projectEnquiries.id, quotation.enquiryId), eq(projectEnquiries.userId, req.dbUser!.id)))
      .limit(1);
    if (!enquiry) return res.status(403).json({ error: 'Unauthorized quotation access.' });

    let nextQuotationStatus = quotation.status;
    let nextEnquiryStatus = enquiry.status;
    if (action === 'accept') {
      nextQuotationStatus = 'Accepted';
      nextEnquiryStatus = 'Project Approved – Advance Payment Required';
    } else if (action === 'modify') {
      nextQuotationStatus = 'Modification Requested';
      nextEnquiryStatus = 'Modification Requested';
    } else if (action === 'reject') {
      nextQuotationStatus = 'Rejected';
      nextEnquiryStatus = 'Rejected';
    } else {
      return res.status(400).json({ error: 'Invalid quotation action.' });
    }

    const [updatedQuotation] = await db
      .update(projectQuotations)
      .set({
        status: nextQuotationStatus,
        customerFeedback: String(feedback || ''),
      })
      .where(eq(projectQuotations.id, id))
      .returning();

    await db
      .update(projectEnquiries)
      .set({ status: nextEnquiryStatus, updatedAt: new Date() })
      .where(eq(projectEnquiries.id, enquiry.id));

    let acceptance: any = null;
    let milestones: any[] = [];
    if (action === 'accept') {
      const [acc] = await db
        .insert(projectAcceptances)
        .values({
          enquiryId: enquiry.id,
          quotationId: quotation.id,
          userId: req.dbUser!.id,
          acceptedByEmail: req.dbUser!.email,
          notes: String(feedback || ''),
        })
        .returning();
      acceptance = acc;

      // Ensure payment plan & milestones exist for this quotation
      const existingPlans = await db
        .select()
        .from(projectPaymentPlans)
        .where(eq(projectPaymentPlans.quotationId, quotation.id))
        .limit(1);

      let plan = existingPlans[0];
      const advPct = Number(quotation.advancePercent || 50);
      const finPct = Math.max(0, 100 - advPct);
      if (!plan) {
        const [createdPlan] = await db
          .insert(projectPaymentPlans)
          .values({
            enquiryId: enquiry.id,
            quotationId: quotation.id,
            planType: advPct === 100 ? 'full_100' : advPct === 50 ? '50_50_split' : 'custom_split',
            advancePercent: advPct,
            finalPercent: finPct,
            allowFullPayment: quotation.allowFullPayment ?? true,
            isOverride: Boolean(quotation.planOverrideReason),
            overrideReason: quotation.planOverrideReason || '',
            createdBy: 'system',
          })
          .returning();
        plan = createdPlan;
      }

      const existingMilestones = await db
        .select()
        .from(projectPaymentMilestones)
        .where(eq(projectPaymentMilestones.quotationId, quotation.id));

      if (existingMilestones.length === 0) {
        const m1 = await db
          .insert(projectPaymentMilestones)
          .values({
            planId: plan.id,
            quotationId: quotation.id,
            stageName: 'Advance Payment',
            stageOrder: 1,
            percent: advPct,
            amountInr: quotation.advanceAmountInr,
            amountPaise: Math.round(quotation.advanceAmountInr * 100),
            dueTrigger: 'on_acceptance',
            status: 'pending',
          })
          .returning();
        milestones.push(...m1);

        if (quotation.balanceAmountInr > 0) {
          const m2 = await db
            .insert(projectPaymentMilestones)
            .values({
              planId: plan.id,
              quotationId: quotation.id,
              stageName: 'Final Balance Payment',
              stageOrder: 2,
              percent: finPct,
              amountInr: quotation.balanceAmountInr,
              amountPaise: Math.round(quotation.balanceAmountInr * 100),
              dueTrigger: 'on_completion',
              status: 'pending',
            })
            .returning();
          milestones.push(...m2);
        }
      } else {
        milestones = existingMilestones;
      }

      await dispatchLifecycleEmail({
        userId: req.dbUser!.id,
        enquiryId: enquiry.id,
        recipientEmail: enquiry.customerEmail || req.dbUser!.email,
        eventType: 'project_approved',
        vars: {
          customerName: enquiry.customerName,
          enquiryNumber: enquiry.enquiryNumber,
          quotationNumber: quotation.quotationNumber || `REV-${quotation.revisionNumber}`,
          advancePercent: advPct,
          advanceAmountInr: quotation.advanceAmountInr,
          balanceAmountInr: quotation.balanceAmountInr,
          totalAmountInr: quotation.totalAmountInr,
        },
      });
    }

    res.json({ quotation: updatedQuotation, acceptance, milestones });
  } catch (error) {
    console.error('Quotation respond error:', error);
    res.status(500).json({ error: 'Failed to update quotation response.' });
  }
});

// PCB & B2B Enquiries
customerRouter.post(
  '/pcb-enquiries',
  requireAuth,
  pcbUpload.array('attachments', 5),
  async (req: AuthRequest, res) => {
    try {
      const b = req.body;
      if (!b.boardDimensionsMm || !b.customerName || !b.mobile) {
        return res.status(400).json({ error: 'Customer name, mobile, and board dimensions are required.' });
      }
      const files = (req.files as Express.Multer.File[]) || [];
      const attachments = files.map((f) => ({
        originalName: f.originalname,
        storagePath: path.relative(UPLOADS_ROOT, f.path),
        sizeBytes: f.size,
      }));

      const enquiryNumber = generateCode('NTF-PCB');
      const [created] = await db
        .insert(pcbEnquiries)
        .values({
          enquiryNumber,
          userId: req.dbUser!.id,
          customerName: String(b.customerName).trim(),
          email: String(b.email || req.dbUser!.email).trim(),
          mobile: String(b.mobile).trim(),
          boardDimensionsMm: String(b.boardDimensionsMm).trim(),
          layerCount: Number(b.layerCount || 2),
          boardQuantity: Math.max(1, Number(b.boardQuantity || 5)),
          assemblyRequired: b.assemblyRequired === 'true' || b.assemblyRequired === true,
          surfaceFinish: String(b.surfaceFinish || 'HASL Lead-Free'),
          specialInstructions: String(b.specialInstructions || ''),
          attachments,
          status: 'Submitted',
        })
        .returning();

      res.status(201).json({ enquiry: created });
    } catch (error) {
      console.error('PCB enquiry error:', error);
      res.status(500).json({ error: 'Failed to submit PCB enquiry.' });
    }
  }
);

customerRouter.post(
  '/b2b-enquiries',
  requireAuth,
  b2bUpload.array('attachments', 5),
  async (req: AuthRequest, res) => {
    try {
      const b = req.body;
      if (!b.companyName || !b.contactPerson || !b.mobile || !b.technicalSpecs || !b.shippingLocation) {
        return res.status(400).json({ error: 'Company name, contact, mobile, specs, and shipping location are required.' });
      }
      const files = (req.files as Express.Multer.File[]) || [];
      const attachments = files.map((f) => ({
        originalName: f.originalname,
        storagePath: path.relative(UPLOADS_ROOT, f.path),
        sizeBytes: f.size,
      }));

      const enquiryNumber = generateCode('NTF-B2B');
      const [created] = await db
        .insert(b2bEnquiries)
        .values({
          enquiryNumber,
          userId: req.dbUser!.id,
          companyName: String(b.companyName).trim(),
          contactPerson: String(b.contactPerson).trim(),
          email: String(b.email || req.dbUser!.email).trim(),
          mobile: String(b.mobile).trim(),
          gstin: String(b.gstin || '').trim(),
          requirementCategory: String(b.requirementCategory || 'Bulk Hardware'),
          quantity: Math.max(1, Number(b.quantity || 10)),
          technicalSpecs: String(b.technicalSpecs).trim(),
          expectedDeliveryDate: String(b.expectedDeliveryDate || ''),
          shippingLocation: String(b.shippingLocation).trim(),
          attachments,
          status: 'Submitted',
        })
        .returning();

      res.status(201).json({ enquiry: created });
    } catch (error) {
      console.error('B2B enquiry error:', error);
      res.status(500).json({ error: 'Failed to submit B2B enquiry.' });
    }
  }
);

// Unified Payment Order Creation & Verification (Store, 3D Printing, Project Quotation, PCB, B2B)
customerRouter.post('/payments/create-order', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { entityType, entityId } = req.body;
    const id = Number(entityId);
    let amountInr = 0;
    let receipt = '';

    if (entityType === 'store_order') {
      const [row] = await db
        .select()
        .from(storeOrders)
        .where(and(eq(storeOrders.id, id), eq(storeOrders.userId, req.dbUser!.id)))
        .limit(1);
      if (!row) return res.status(404).json({ error: 'Order not found.' });
      if (row.paymentStatus === 'paid') return res.status(400).json({ error: 'Order already paid.' });
      amountInr = row.totalInr;
      receipt = row.orderNumber;
    } else if (entityType === 'printing_order') {
      const [row] = await db
        .select()
        .from(printingOrders)
        .where(and(eq(printingOrders.id, id), eq(printingOrders.userId, req.dbUser!.id)))
        .limit(1);
      if (!row) return res.status(404).json({ error: 'Printing order not found.' });
      if (row.pricingBreakdown.technicalReviewRequired && row.orderStatus === 'Technical Review') {
        return res.status(400).json({ error: 'This model is awaiting engineering quotation review.' });
      }
      amountInr = row.totalInr;
      receipt = row.orderNumber;
    } else if (entityType === 'project_quotation') {
      const paymentMode = String(req.body.paymentMode || 'advance'); // advance | full | balance
      const [q] = await db.select().from(projectQuotations).where(eq(projectQuotations.id, id)).limit(1);
      if (!q) return res.status(404).json({ error: 'Quotation not found.' });
      const [enq] = await db
        .select()
        .from(projectEnquiries)
        .where(and(eq(projectEnquiries.id, q.enquiryId), eq(projectEnquiries.userId, req.dbUser!.id)))
        .limit(1);
      if (!enq) return res.status(403).json({ error: 'Unauthorized quotation payment.' });
      if (q.status !== 'Accepted') {
        return res.status(400).json({ error: 'Please accept the quotation before paying.' });
      }
      const alreadyPaid = Number(q.paidAmountInr || 0);
      const remaining = Math.max(0, q.totalAmountInr - alreadyPaid);
      if (remaining <= 0 || q.paymentStatus === 'paid') {
        return res.status(400).json({ error: 'Quotation is already paid in full.' });
      }
      if (paymentMode === 'full') {
        if (q.allowFullPayment === false && alreadyPaid === 0) {
          return res.status(400).json({ error: 'Full upfront payment is disabled for this quotation; please pay advance.' });
        }
        amountInr = remaining;
      } else if (paymentMode === 'balance') {
        amountInr = remaining;
      } else {
        amountInr = alreadyPaid > 0 ? remaining : q.advanceAmountInr;
      }
      receipt = `${enq.enquiryNumber}-Q${q.revisionNumber}-${paymentMode.toUpperCase()}`;
    } else if (entityType === 'pcb_enquiry') {
      const [pcb] = await db
        .select()
        .from(pcbEnquiries)
        .where(and(eq(pcbEnquiries.id, id), eq(pcbEnquiries.userId, req.dbUser!.id)))
        .limit(1);
      if (!pcb || !pcb.quotedAmountInr) {
        return res.status(400).json({ error: 'PCB quotation has not been issued yet.' });
      }
      amountInr = pcb.quotedAmountInr;
      receipt = pcb.enquiryNumber;
    } else if (entityType === 'b2b_enquiry') {
      const [b2b] = await db
        .select()
        .from(b2bEnquiries)
        .where(and(eq(b2bEnquiries.id, id), eq(b2bEnquiries.userId, req.dbUser!.id)))
        .limit(1);
      if (!b2b || !b2b.quotedAmountInr) {
        return res.status(400).json({ error: 'B2B quotation has not been issued yet.' });
      }
      amountInr = b2b.quotedAmountInr;
      receipt = b2b.enquiryNumber;
    } else {
      return res.status(400).json({ error: 'Unsupported payment entity type.' });
    }

    const rzp = await createRazorpayOrder({
      amountInr,
      receipt,
      notes: { entityType, entityId: String(id), userId: String(req.dbUser!.id) },
    });

    // Save order ID on target record
    if (entityType === 'store_order') {
      await db.update(storeOrders).set({ razorpayOrderId: rzp.razorpayOrderId }).where(eq(storeOrders.id, id));
    } else if (entityType === 'printing_order') {
      await db.update(printingOrders).set({ razorpayOrderId: rzp.razorpayOrderId }).where(eq(printingOrders.id, id));
    } else if (entityType === 'project_quotation') {
      await db.update(projectQuotations).set({ razorpayOrderId: rzp.razorpayOrderId }).where(eq(projectQuotations.id, id));
    } else if (entityType === 'pcb_enquiry') {
      await db.update(pcbEnquiries).set({ razorpayOrderId: rzp.razorpayOrderId }).where(eq(pcbEnquiries.id, id));
    } else if (entityType === 'b2b_enquiry') {
      await db.update(b2bEnquiries).set({ razorpayOrderId: rzp.razorpayOrderId }).where(eq(b2bEnquiries.id, id));
    }

    res.json({
      ...rzp,
      amountInr,
      amountPaise: Math.round(amountInr * 100),
      receipt,
      customer: {
        name: req.dbUser!.fullName || req.dbUser!.email,
        email: req.dbUser!.email,
        contact: req.dbUser!.mobile || '',
      },
    });
  } catch (error: any) {
    console.error('Payment create-order error:', error);
    res.status(500).json({ error: error?.message || 'Failed to initiate payment.' });
  }
});

customerRouter.post('/payments/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { entityType, entityId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const id = Number(entityId);

    const paymentIdToVerify =
      razorpayPaymentId || `pay_test_${crypto.randomBytes(6).toString('hex')}`;
    const signatureToVerify = razorpaySignature || 'test_sig';

    const valid = await verifyRazorpaySignature({
      razorpayOrderId: String(razorpayOrderId),
      razorpayPaymentId: paymentIdToVerify,
      razorpaySignature: signatureToVerify,
    });

    if (!valid) {
      return res.status(400).json({ error: 'Payment signature verification failed.' });
    }

    // Idempotency check
    const existingPayment = await db
      .select()
      .from(payments)
      .where(eq(payments.razorpayPaymentId, paymentIdToVerify))
      .limit(1);
    if (existingPayment.length > 0) {
      return res.json({ verified: true, payment: existingPayment[0], duplicate: true });
    }

    const [[companyRow], [projCfgRow]] = await Promise.all([
      db.select().from(siteSettings).where(eq(siteSettings.key, 'companyInfo')).limit(1),
      db.select().from(siteSettings).where(eq(siteSettings.key, 'projectPaymentSettings')).limit(1),
    ]);
    const companyInfo = (companyRow?.value as { gstin?: string }) || {};
    const projCfg = (projCfgRow?.value as { enableGstTax?: boolean }) || {};
    const isGstEnabled = Boolean(companyInfo.gstin && companyInfo.gstin.trim() && projCfg.enableGstTax);
    let docType = isGstEnabled ? 'GST Tax Invoice' : 'Proforma Invoice / Payment Receipt';

    let amountInr = 0;
    let gstInr = 0;
    let paymentStage = entityType === 'store_order' ? 'store' : entityType;
    let payload: Record<string, unknown> = {};
    let projectQuoteResult: {
      enquiry: any;
      quotation: any;
      project: any;
      isAdvance: boolean;
      isFullyPaid: boolean;
      chargeAmount: number;
      prevPaid: number;
    } | null = null;

    if (entityType === 'store_order') {
      const [order] = await db
        .update(storeOrders)
        .set({
          paymentStatus: 'paid',
          orderStatus: 'Payment Confirmed',
          razorpayPaymentId: paymentIdToVerify,
          updatedAt: new Date(),
        })
        .where(and(eq(storeOrders.id, id), eq(storeOrders.userId, req.dbUser!.id)))
        .returning();
      if (!order) return res.status(404).json({ error: 'Order not found.' });
      amountInr = order.totalInr;
      gstInr = order.gstInr;
      payload = { orderNumber: order.orderNumber, items: order.items, shippingAddress: order.shippingAddress };
    } else if (entityType === 'printing_order') {
      const [order] = await db
        .update(printingOrders)
        .set({
          paymentStatus: 'paid',
          orderStatus: 'Payment Confirmed',
          razorpayPaymentId: paymentIdToVerify,
          updatedAt: new Date(),
        })
        .where(and(eq(printingOrders.id, id), eq(printingOrders.userId, req.dbUser!.id)))
        .returning();
      if (!order) return res.status(404).json({ error: 'Printing order not found.' });
      amountInr = order.totalInr;
      gstInr = order.pricingBreakdown.gstInr;
      payload = {
        orderNumber: order.orderNumber,
        fileName: order.fileName,
        material: `${order.materialName} (${order.colorName})`,
        pricingBreakdown: order.pricingBreakdown,
      };
    } else if (entityType === 'project_quotation') {
      const paymentMode = String(req.body.paymentMode || 'advance');
      const [existingQ] = await db.select().from(projectQuotations).where(eq(projectQuotations.id, id)).limit(1);
      if (!existingQ) return res.status(404).json({ error: 'Quotation not found.' });

      const prevPaid = Number(existingQ.paidAmountInr || 0);
      const remaining = Math.max(0, existingQ.totalAmountInr - prevPaid);
      if (remaining <= 0) return res.status(400).json({ error: 'Quotation already paid in full.' });

      const chargeAmount =
        paymentMode === 'full' || paymentMode === 'balance'
          ? remaining
          : prevPaid > 0
          ? remaining
          : existingQ.advanceAmountInr;
      const newPaidTotal = Math.min(existingQ.totalAmountInr, prevPaid + chargeAmount);
      const isFullyPaid = newPaidTotal >= existingQ.totalAmountInr;
      const isAdvance = prevPaid === 0 && !isFullyPaid;
      paymentStage = isAdvance ? 'advance' : isFullyPaid && prevPaid === 0 ? 'full' : 'final';
      docType = isGstEnabled
        ? isAdvance
          ? 'Advance GST Tax Invoice'
          : 'Final GST Tax Invoice'
        : isAdvance
        ? 'Advance Proforma Invoice'
        : 'Final Payment Invoice';

      const [q] = await db
        .update(projectQuotations)
        .set({
          paidAmountInr: newPaidTotal,
          paymentStatus: isFullyPaid ? 'paid' : 'partial',
          razorpayPaymentId: paymentIdToVerify,
        })
        .where(eq(projectQuotations.id, id))
        .returning();

      const [enq] = await db
        .update(projectEnquiries)
        .set({
          status: isFullyPaid ? 'Final Payment Completed' : 'Advance Paid',
          updatedAt: new Date(),
        })
        .where(eq(projectEnquiries.id, q.enquiryId))
        .returning();

      const existingProjects = await db
        .select()
        .from(projects)
        .where(eq(projects.enquiryId, enq.id))
        .limit(1);

      let activeProject = existingProjects[0];
      const balanceRemaining = Math.max(0, q.totalAmountInr - newPaidTotal);

      if (!activeProject) {
        const projectCode = generateCode('NTF-PRJ');
        const todayIso = new Date().toISOString().slice(0, 10);
        const [createdProject] = await db
          .insert(projects)
          .values({
            projectCode,
            enquiryId: enq.id,
            quotationId: q.id,
            userId: req.dbUser!.id,
            title: enq.projectTitle,
            assignedEngineer: enq.assignedEngineer || 'Lead Systems Engineer',
            status: 'Project Started',
            startDate: todayIso,
            estimatedCompletionDate: enq.targetCompletionDate || q.estimatedDuration || '',
            totalAmountInr: q.totalAmountInr,
            paidAmountInr: newPaidTotal,
            balanceAmountInr: balanceRemaining,
            paymentClearanceStatus: isFullyPaid ? 'Cleared' : 'Advance Paid',
            handoverUnlocked: isFullyPaid,
            milestones: [
              {
                id: 'm1',
                title: 'Requirement Lock & Component Procurement',
                dueDate: '',
                status: 'In Progress',
                notes: `Work order activated upon verified payment of ₹${chargeAmount}.`,
              },
              {
                id: 'm2',
                title: 'Design, Firmware & Hardware Integration',
                dueDate: '',
                status: 'Pending',
                notes: '',
              },
              {
                id: 'm3',
                title: 'Validation Testing, Final Payment & Handover',
                dueDate: enq.targetCompletionDate || '',
                status: 'Pending',
                notes: '',
              },
            ],
            updates: [
              {
                id: 'u1',
                timestamp: new Date().toISOString(),
                author: 'NexusTekFusion Operations',
                summary: `Work order ${projectCode} activated after verified payment of ₹${chargeAmount.toLocaleString('en-IN')}.`,
              },
            ],
          })
          .returning();
        activeProject = createdProject;

        // Create Work Order automatically on initial payment
        await db.insert(projectWorkOrders).values({
          workOrderNumber: generateCode('NTF-WRK'),
          projectId: activeProject.id,
          enquiryId: enq.id,
          quotationId: q.id,
          userId: req.dbUser!.id,
          assignedEngineer: activeProject.assignedEngineer,
          estimatedCompletionDate: activeProject.estimatedCompletionDate,
          scopeSummary: q.technicalScope || enq.projectDescription,
        });

        await createNotification({
          userId: req.dbUser!.id,
          title: `Project ${createdProject.projectCode} Activated`,
          message: `Advance payment ₹${chargeAmount.toLocaleString('en-IN')} verified. Work order issued.`,
          link: '/my-account/project-enquiries',
        });
      } else {
        const nextUpdates = [
          ...(activeProject.updates || []),
          {
            id: `u-${Date.now()}`,
            timestamp: new Date().toISOString(),
            author: 'NexusTekFusion Accounts',
            summary: isFullyPaid
              ? `Final balance payment of ₹${chargeAmount.toLocaleString('en-IN')} verified. Payment Cleared & Handover unlocked.`
              : `Payment of ₹${chargeAmount.toLocaleString('en-IN')} verified. Remaining balance: ₹${balanceRemaining.toLocaleString('en-IN')}.`,
          },
        ];
        const [updatedProj] = await db
          .update(projects)
          .set({
            paidAmountInr: newPaidTotal,
            balanceAmountInr: balanceRemaining,
            paymentClearanceStatus: isFullyPaid ? 'Cleared' : 'Advance Paid',
            handoverUnlocked: isFullyPaid || activeProject.handoverExceptionAuthorized,
            status: isFullyPaid ? 'Final Payment Completed' : activeProject.status,
            updates: nextUpdates,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, activeProject.id))
          .returning();
        activeProject = updatedProj;

        await createNotification({
          userId: req.dbUser!.id,
          title: isFullyPaid
            ? `Payment Cleared — ${activeProject.projectCode} Ready for Handover`
            : `Project Payment Received (${activeProject.projectCode})`,
          message: `Verified payment of ₹${chargeAmount.toLocaleString('en-IN')}. Total paid ₹${newPaidTotal.toLocaleString('en-IN')} of ₹${q.totalAmountInr.toLocaleString('en-IN')}.`,
          link: '/my-account/project-enquiries',
        });
      }

      amountInr = chargeAmount;
      gstInr = isAdvance
        ? Math.round((q.gstInr * chargeAmount) / Math.max(1, q.totalAmountInr))
        : q.gstInr - Math.round((q.gstInr * prevPaid) / Math.max(1, q.totalAmountInr));
      payload = {
        projectCode: activeProject.projectCode,
        enquiryNumber: enq.enquiryNumber,
        quotationId: q.id,
        quotationNumber: q.quotationNumber || `REV-${q.revisionNumber}`,
        paymentMode,
        paymentStage,
      };
      projectQuoteResult = {
        enquiry: enq,
        quotation: q,
        project: activeProject,
        isAdvance,
        isFullyPaid,
        chargeAmount,
        prevPaid,
      };
    } else if (entityType === 'pcb_enquiry') {
      const [pcb] = await db
        .update(pcbEnquiries)
        .set({ paymentStatus: 'paid', status: 'In Production', updatedAt: new Date() })
        .where(and(eq(pcbEnquiries.id, id), eq(pcbEnquiries.userId, req.dbUser!.id)))
        .returning();
      if (!pcb) return res.status(404).json({ error: 'PCB enquiry not found.' });
      amountInr = pcb.quotedAmountInr || 0;
      payload = { enquiryNumber: pcb.enquiryNumber, boardDimensionsMm: pcb.boardDimensionsMm };
    } else if (entityType === 'b2b_enquiry') {
      const [b2b] = await db
        .update(b2bEnquiries)
        .set({ paymentStatus: 'paid', status: 'Order Confirmed', updatedAt: new Date() })
        .where(and(eq(b2bEnquiries.id, id), eq(b2bEnquiries.userId, req.dbUser!.id)))
        .returning();
      if (!b2b) return res.status(404).json({ error: 'B2B enquiry not found.' });
      amountInr = b2b.quotedAmountInr || 0;
      payload = { enquiryNumber: b2b.enquiryNumber, companyName: b2b.companyName };
    }

    const mode = paymentIdToVerify.startsWith('pay_test_') ? 'test_mode' : 'live_razorpay';
    const paymentRef = generateCode('NTF-PAY');
    const [paymentRecord] = await db
      .insert(payments)
      .values({
        paymentRef,
        userId: req.dbUser!.id,
        entityType,
        entityId: id,
        paymentStage,
        razorpayOrderId: String(razorpayOrderId),
        razorpayPaymentId: paymentIdToVerify,
        razorpaySignature: signatureToVerify,
        amountInr,
        amountPaise: Math.round(amountInr * 100),
        mode,
        status: 'verified',
        verifiedAt: new Date(),
      })
      .returning();

    const [receiptRecord] = await db
      .insert(paymentReceipts)
      .values({
        receiptNumber: generateCode('NTF-RCP'),
        paymentRef,
        userId: req.dbUser!.id,
        entityType,
        entityId: id,
        paymentStage,
        amountInr,
        amountPaise: Math.round(amountInr * 100),
        razorpayPaymentId: paymentIdToVerify,
        payload,
      })
      .returning();

    const [invoiceRecord] = await db
      .insert(invoices)
      .values({
        invoiceNumber: generateCode('NTF-INV'),
        userId: req.dbUser!.id,
        entityType,
        entityId: id,
        docType,
        amountInr,
        gstInr,
        payload,
      })
      .returning();

    let clearanceCertificate: any = null;
    if (projectQuoteResult) {
      const { enquiry: enq, quotation: q, project: proj, isAdvance, isFullyPaid } = projectQuoteResult;
      const msRows = await db
        .select()
        .from(projectPaymentMilestones)
        .where(eq(projectPaymentMilestones.quotationId, q.id));

      for (const ms of msRows) {
        await db
          .update(projectPaymentMilestones)
          .set({ projectId: proj.id })
          .where(eq(projectPaymentMilestones.id, ms.id));
        if (isFullyPaid || (isAdvance && ms.stageOrder === 1)) {
          await db
            .update(projectPaymentMilestones)
            .set({ status: 'paid', paymentRef, paidAt: new Date() })
            .where(eq(projectPaymentMilestones.id, ms.id));
        }
      }

      if (isFullyPaid) {
        const existingClr = await db
          .select()
          .from(paymentClearanceCertificates)
          .where(eq(paymentClearanceCertificates.projectId, proj.id))
          .limit(1);
        if (existingClr.length === 0) {
          const allProjPayments = await db
            .select()
            .from(payments)
            .where(and(eq(payments.entityType, 'project_quotation'), eq(payments.entityId, q.id)));
          const refs = allProjPayments.map((p) => p.paymentRef);
          const certNo = generateCode('NTF-CLR');
          const [clr] = await db
            .insert(paymentClearanceCertificates)
            .values({
              certificateNumber: certNo,
              projectId: proj.id,
              enquiryId: enq.id,
              quotationId: q.id,
              userId: req.dbUser!.id,
              totalAmountInr: q.totalAmountInr,
              advancePaidInr: projectQuoteResult.prevPaid || (isAdvance ? amountInr : 0),
              finalPaidInr: projectQuoteResult.prevPaid > 0 ? amountInr : q.totalAmountInr,
              balanceInr: 0,
              paymentRefs: refs,
              issuedBy: 'NEXUSTEKFUSION ACCOUNTS',
            })
            .returning();
          clearanceCertificate = clr;

          await dispatchLifecycleEmail({
            userId: req.dbUser!.id,
            projectId: proj.id,
            enquiryId: enq.id,
            recipientEmail: enq.customerEmail || req.dbUser!.email,
            eventType: 'final_payment_confirmed',
            vars: {
              customerName: enq.customerName,
              projectCode: proj.projectCode,
              projectTitle: proj.title,
              amountInr,
              paymentRef,
              certificateNumber: certNo,
            },
          });
        }
      } else {
        await dispatchLifecycleEmail({
          userId: req.dbUser!.id,
          projectId: proj.id,
          enquiryId: enq.id,
          recipientEmail: enq.customerEmail || req.dbUser!.email,
          eventType: 'advance_payment_confirmed',
          vars: {
            customerName: enq.customerName,
            projectCode: proj.projectCode,
            projectTitle: proj.title,
            amountInr,
            paymentRef,
            assignedEngineer: proj.assignedEngineer,
          },
        });
      }
    }

    res.json({
      verified: true,
      payment: paymentRecord,
      receipt: receiptRecord,
      invoice: invoiceRecord,
      clearanceCertificate,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed.' });
  }
});

// Gated Time-Limited Project Handover Document Download
customerRouter.get('/projects/:projectId/handover-documents/:docId/download', async (req: AuthRequest, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const docId = Number(req.params.docId);
    const token = String(req.query.token || '').trim();

    const [proj] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    const [doc] = await db
      .select()
      .from(projectHandoverDocuments)
      .where(
        and(
          eq(projectHandoverDocuments.id, docId),
          eq(projectHandoverDocuments.projectId, projectId),
          eq(projectHandoverDocuments.isDeleted, false)
        )
      )
      .limit(1);

    if (!proj || !doc) {
      return res.status(404).json({ error: 'Handover deliverable not found.' });
    }

    const isTokenAuthorized = token && token === doc.downloadToken;
    // If no token provided, try session/bearer auth via optionalAuth or require token
    if (!isTokenAuthorized) {
      return res.status(403).json({ error: 'Valid signed download token is required.' });
    }

    if (doc.tokenExpiresAt && new Date(doc.tokenExpiresAt) < new Date()) {
      return res.status(403).json({ error: 'Download link has expired. Request link renewal from your dashboard or admin.' });
    }

    if (!proj.handoverUnlocked && !proj.handoverExceptionAuthorized) {
      return res.status(403).json({
        error: 'Project handover is locked until remaining balance payment is cleared or authorized by Super Admin.',
      });
    }

    const absPath = path.resolve(UPLOADS_ROOT, doc.storagePath);
    if (!absPath.startsWith(UPLOADS_ROOT) || !fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'Deliverable file missing from storage.' });
    }

    await db
      .update(projectHandoverDocuments)
      .set({
        downloadCount: (doc.downloadCount || 0) + 1,
        lastDownloadedAt: new Date(),
      })
      .where(eq(projectHandoverDocuments.id, doc.id));

    res.download(absPath, doc.fileName);
  } catch (error) {
    console.error('Handover document download error:', error);
    res.status(500).json({ error: 'Failed to download handover deliverable.' });
  }
});

// Customer Handover Receipt Acknowledgment -> Generates Completion Certificate
customerRouter.post('/projects/:id/acknowledge-handover', requireAuth, async (req: AuthRequest, res) => {
  try {
    const projectId = Number(req.params.id);
    const [proj] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, req.dbUser!.id)))
      .limit(1);
    if (!proj) return res.status(404).json({ error: 'Project not found.' });

    if (!proj.handoverUnlocked && !proj.handoverExceptionAuthorized) {
      return res.status(400).json({ error: 'Final payment clearance is required before handover acknowledgment.' });
    }

    const completionNo = proj.completionCertificateNumber || generateCode('NTF-CMP');
    const nowIso = new Date().toISOString();
    const nextUpdates = [
      ...(proj.updates || []),
      {
        id: `u-ack-${Date.now()}`,
        timestamp: nowIso,
        author: req.dbUser!.fullName || req.dbUser!.email,
        summary: `Customer acknowledged receipt of project deliverables. Completion Certificate ${completionNo} issued.`,
      },
    ];

    const [updated] = await db
      .update(projects)
      .set({
        customerAcknowledgedAt: nowIso,
        customerAcknowledgedBy: req.dbUser!.email,
        completionCertificateNumber: completionNo,
        status: 'Completed',
        completedAt: nowIso,
        updates: nextUpdates,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    await db
      .update(projectEnquiries)
      .set({ status: 'Completed', updatedAt: new Date() })
      .where(eq(projectEnquiries.id, proj.enquiryId));

    await dispatchLifecycleEmail({
      userId: req.dbUser!.id,
      projectId: updated.id,
      enquiryId: updated.enquiryId,
      recipientEmail: req.dbUser!.email,
      eventType: 'project_delivered',
      vars: {
        customerName: req.dbUser!.fullName || req.dbUser!.email,
        projectCode: updated.projectCode,
        projectTitle: updated.title,
      },
    });

    res.json({ project: updated, completionCertificateNumber: completionNo });
  } catch (error) {
    console.error('Acknowledge handover error:', error);
    res.status(500).json({ error: 'Failed to acknowledge project handover.' });
  }
});

// Customer Drone Repair Booking Submission
const repairUpload = createUploadMiddleware('drone-repairs', ['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.mov'], 50);
customerRouter.post(
  '/drone-repairs',
  requireAuth,
  repairUpload.fields([
    { name: 'photos', maxCount: 5 },
    { name: 'video', maxCount: 1 },
  ]),
  async (req: AuthRequest, res) => {
    try {
      const b = req.body;
      if (!b.customerName || !b.mobile || !b.droneBrandModel || !b.problemDescription) {
        return res.status(400).json({ error: 'Customer name, mobile, drone brand/model, and issue description are required.' });
      }
      const filesObj = (req.files as Record<string, Express.Multer.File[]>) || {};
      const photos = (filesObj.photos || []).map((f) => ({
        originalName: f.originalname,
        storagePath: path.relative(UPLOADS_ROOT, f.path),
        mimeType: f.mimetype,
        sizeBytes: f.size,
      }));
      const vid = filesObj.video?.[0];
      const videoFile = vid
        ? {
            originalName: vid.originalname,
            storagePath: path.relative(UPLOADS_ROOT, vid.path),
            mimeType: vid.mimetype,
            sizeBytes: vid.size,
          }
        : null;

      const ref = generateCode('NTF-REP');
      const [booking] = await db
        .insert(droneRepairBookings)
        .values({
          referenceNumber: ref,
          userId: req.dbUser!.id,
          serviceMode: b.serviceMode === 'field_visit' ? 'field_visit' : 'service_centre',
          customerName: String(b.customerName).trim(),
          mobile: String(b.mobile).trim(),
          email: String(b.email || req.dbUser!.email).trim(),
          address: String(b.address || '').trim(),
          city: String(b.city || '').trim(),
          district: String(b.district || '').trim(),
          pinCode: String(b.pinCode || '').trim(),
          droneBrandModel: String(b.droneBrandModel).trim(),
          droneType: String(b.droneType || 'Agriculture').trim(),
          problemDescription: String(b.problemDescription).trim(),
          photos,
          videoFile,
          preferredDate: String(b.preferredDate || ''),
          preferredTime: String(b.preferredTime || ''),
          additionalInfo: String(b.additionalInfo || ''),
          status: 'Booking received',
          statusHistory: [
            {
              status: 'Booking received',
              timestamp: new Date().toISOString(),
              note: 'Repair booking logged for Nagpur diagnostics review.',
              actor: req.dbUser!.email,
            },
          ],
        })
        .returning();

      res.status(201).json({ booking });
    } catch (error: any) {
      console.error('Drone repair create error:', error);
      res.status(500).json({ error: error?.message || 'Failed to submit drone repair booking.' });
    }
  }
);

// Support Ticket Replies
customerRouter.post('/support-tickets/:id/reply', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const text = String(req.body.message || '').trim();
    if (!text) return res.status(400).json({ error: 'Reply message cannot be empty.' });

    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(and(eq(supportTickets.id, id), eq(supportTickets.userId, req.dbUser!.id)))
      .limit(1);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    const updatedMessages = [
      ...ticket.messages,
      {
        sender: req.dbUser!.fullName || req.dbUser!.email,
        role: 'customer',
        text,
        timestamp: new Date().toISOString(),
      },
    ];

    const [updated] = await db
      .update(supportTickets)
      .set({ messages: updatedMessages, status: 'Open', updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();

    res.json({ ticket: updated });
  } catch {
    res.status(500).json({ error: 'Failed to reply to support ticket.' });
  }
});

// Secure Private File Download (Authorized Owner or Admin Only)
customerRouter.get('/files/download', requireAuth, async (req: AuthRequest, res) => {
  try {
    const relPath = String(req.query.path || '');
    if (!relPath) return res.status(400).json({ error: 'File path is required.' });

    const absPath = path.resolve(UPLOADS_ROOT, relPath);
    if (!absPath.startsWith(UPLOADS_ROOT) || !fs.existsSync(absPath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const isAdmin = ADMIN_ROLES.has(req.dbUser!.role);
    if (!isAdmin) {
      // Verify file belongs to one of this user's records
      const uid = req.dbUser!.id;
      const [printRows, projRows, pcbRows, b2bRows] = await Promise.all([
        db.select().from(printingOrders).where(eq(printingOrders.userId, uid)),
        db.select().from(projectEnquiries).where(eq(projectEnquiries.userId, uid)),
        db.select().from(pcbEnquiries).where(eq(pcbEnquiries.userId, uid)),
        db.select().from(b2bEnquiries).where(eq(b2bEnquiries.userId, uid)),
      ]);

      const owned =
        printRows.some((r) => r.fileStoragePath === relPath) ||
        projRows.some((r) => r.attachments.some((a) => a.storagePath === relPath)) ||
        pcbRows.some((r) => r.attachments.some((a) => a.storagePath === relPath)) ||
        b2bRows.some((r) => r.attachments.some((a) => a.storagePath === relPath));

      if (!owned) {
        return res.status(403).json({ error: 'You are not authorized to access this private file.' });
      }
    }

    res.download(absPath);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({ error: 'Failed to download file.' });
  }
});
