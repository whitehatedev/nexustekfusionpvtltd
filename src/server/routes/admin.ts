import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { and, asc, desc, eq, lte } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  auditLogs,
  b2bEnquiries,
  blogs,
  brands,
  caseStudies,
  cmsPages,
  cmsRevisions,
  coupons,
  crmLeads,
  crmNotes,
  inventoryMovements,
  invoices,
  mediaAssets,
  newsletterSubscribers,
  payments,
  pcbEnquiries,
  printingMachines,
  printingMaterials,
  printingOrders,
  productCategories,
  products,
  projectEnquiries,
  projectQuotations,
  projects,
  siteSettings,
  storeOrders,
  supportTickets,
  users,
} from '../../db/schema.ts';
import { AuthRequest, requireAdmin, requireAuth } from '../../middleware/auth.ts';
import {
  createNotification,
  createUploadMiddleware,
  logAudit,
  UPLOADS_ROOT,
} from '../utils.ts';
import { encryptSecret, getRazorpayCredentials } from '../razorpay.ts';
import { DEFAULT_HOMEPAGE_SECTIONS } from '../seed.ts';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use(requireAdmin());

const mediaUpload = createUploadMiddleware(
  'media',
  ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.pdf', '.stl', '.obj', '.glb', '.step', '.stp'],
  50
);

function toCsv(headers: string[], rows: Array<Array<string | number | boolean | null | undefined>>): string {
  const esc = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    if (inQuotes) {
      if (ch === '"' && csvText[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && csvText[i + 1] === '\n') i++;
      row.push(cell.trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

// Overview, Real Database Metrics & Analytics Series
adminRouter.get('/overview', async (_req, res) => {
  try {
    const [
      allUsers,
      allStoreOrders,
      allPrintOrders,
      allEnquiries,
      allQuotations,
      allProjects,
      allPayments,
      lowStockProducts,
      recentAudit,
      allPcb,
      allB2b,
      allTickets,
      recentMovements,
      subscribers,
      pages,
      allCategories,
      allProducts,
      allBrands,
      allMedia,
      allBlogs,
      allCaseStudies,
      allCoupons,
      allInvoices,
      allLeads,
      allNotes,
    ] = await Promise.all([
      db.select().from(users).orderBy(desc(users.createdAt)),
      db.select().from(storeOrders).where(eq(storeOrders.isDeleted, false)).orderBy(desc(storeOrders.createdAt)),
      db.select().from(printingOrders).orderBy(desc(printingOrders.createdAt)),
      db.select().from(projectEnquiries).where(eq(projectEnquiries.isDeleted, false)).orderBy(desc(projectEnquiries.createdAt)),
      db.select().from(projectQuotations).orderBy(desc(projectQuotations.createdAt)),
      db.select().from(projects).where(eq(projects.isDeleted, false)).orderBy(desc(projects.createdAt)),
      db.select().from(payments).orderBy(desc(payments.createdAt)),
      db.select().from(products).where(and(eq(products.isDeleted, false), lte(products.stockQty, 5))),
      db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(40),
      db.select().from(pcbEnquiries).orderBy(desc(pcbEnquiries.createdAt)),
      db.select().from(b2bEnquiries).orderBy(desc(b2bEnquiries.createdAt)),
      db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)),
      db.select().from(inventoryMovements).orderBy(desc(inventoryMovements.createdAt)).limit(40),
      db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)),
      db.select().from(cmsPages).orderBy(desc(cmsPages.updatedAt)),
      db.select().from(productCategories).orderBy(asc(productCategories.sortOrder)),
      db.select().from(products).where(eq(products.isDeleted, false)).orderBy(asc(products.sortOrder), desc(products.createdAt)),
      db.select().from(brands).orderBy(asc(brands.name)),
      db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(100),
      db.select().from(blogs).orderBy(desc(blogs.publishedAt)),
      db.select().from(caseStudies).orderBy(desc(caseStudies.createdAt)),
      db.select().from(coupons).orderBy(desc(coupons.createdAt)),
      db.select().from(invoices).where(eq(invoices.isDeleted, false)).orderBy(desc(invoices.issuedAt)),
      db.select().from(crmLeads).where(eq(crmLeads.isDeleted, false)).orderBy(desc(crmLeads.updatedAt)),
      db.select().from(crmNotes).orderBy(desc(crmNotes.createdAt)).limit(150),
    ]);

    const verifiedPayments = allPayments.filter((p) => p.status === 'verified');
    const totalRevenueInr = verifiedPayments.reduce((sum, p) => sum + p.amountInr, 0);

    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const monthKey = now.toISOString().slice(0, 7);
    const yearKey = String(now.getUTCFullYear());

    const todayRevenueInr = verifiedPayments
      .filter((p) => new Date(p.createdAt).toISOString().slice(0, 10) === todayKey)
      .reduce((s, p) => s + p.amountInr, 0);
    const monthRevenueInr = verifiedPayments
      .filter((p) => new Date(p.createdAt).toISOString().slice(0, 7) === monthKey)
      .reduce((s, p) => s + p.amountInr, 0);
    const annualRevenueInr = verifiedPayments
      .filter((p) => String(new Date(p.createdAt).getUTCFullYear()) === yearKey)
      .reduce((s, p) => s + p.amountInr, 0);

    // 14-day revenue chart series
    const dailyRevenueSeries: Array<{ date: string; label: string; amountInr: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const amt = verifiedPayments
        .filter((p) => new Date(p.createdAt).toISOString().slice(0, 10) === iso)
        .reduce((s, p) => s + p.amountInr, 0);
      dailyRevenueSeries.push({
        date: iso,
        label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        amountInr: amt,
      });
    }

    // 6-month revenue chart series
    const monthlyRevenueSeries: Array<{ month: string; label: string; amountInr: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const mKey = d.toISOString().slice(0, 7);
      const amt = verifiedPayments
        .filter((p) => new Date(p.createdAt).toISOString().slice(0, 7) === mKey)
        .reduce((s, p) => s + p.amountInr, 0);
      monthlyRevenueSeries.push({
        month: mKey,
        label: d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        amountInr: amt,
      });
    }

    // Revenue by Category / Stream
    const catNameById = Object.fromEntries(allCategories.map((c) => [c.id, c.name]));
    const prodById = Object.fromEntries(allProducts.map((p) => [p.id, p]));
    const categoryTotals: Record<string, number> = {};
    for (const ord of allStoreOrders.filter((o) => o.paymentStatus === 'paid')) {
      for (const item of ord.items) {
        const prod = prodById[item.productId];
        const cname = (prod?.categoryId && catNameById[prod.categoryId]) || 'Hardware Store';
        categoryTotals[cname] = (categoryTotals[cname] || 0) + item.lineTotalInr;
      }
    }
    const printPaidTotal = verifiedPayments
      .filter((p) => p.entityType === 'printing_order')
      .reduce((s, p) => s + p.amountInr, 0);
    if (printPaidTotal > 0) categoryTotals['3D Printing Lab'] = printPaidTotal;
    const projectPaidTotal = verifiedPayments
      .filter((p) => p.entityType === 'project_quotation')
      .reduce((s, p) => s + p.amountInr, 0);
    if (projectPaidTotal > 0) categoryTotals['Engineering Projects'] = projectPaidTotal;

    const revenueByCategory = Object.entries(categoryTotals).map(([category, amountInr]) => ({
      category,
      amountInr,
    }));

    const pendingStorePayments = allStoreOrders
      .filter((o) => o.paymentStatus === 'pending')
      .reduce((sum, o) => sum + o.totalInr, 0);
    const pendingPrintPayments = allPrintOrders
      .filter((o) => o.paymentStatus === 'pending')
      .reduce((sum, o) => sum + o.totalInr, 0);

    const sanitizedUsers = allUsers.map(({ passwordHash: _ph, ...safe }) => safe);

    res.json({
      kpis: {
        totalRevenueInr,
        todayRevenueInr,
        monthRevenueInr,
        annualRevenueInr,
        totalOrders: allStoreOrders.length + allPrintOrders.length,
        pendingPaymentsInr: pendingStorePayments + pendingPrintPayments,
        totalCustomers: sanitizedUsers.filter((u) => u.role === 'customer').length,
        newProjectEnquiries: allEnquiries.filter((e) => e.status === 'Submitted').length,
        activeProjects: allProjects.filter((p) => p.status !== 'Completed').length,
        pendingQuotations: allQuotations.filter((q) => q.status === 'Sent').length,
        printingOrdersCount: allPrintOrders.length,
        storeOrdersCount: allStoreOrders.length,
        lowStockCount: lowStockProducts.length,
        subscribersCount: subscribers.length,
        openLeadsCount: allLeads.filter((l) => !['Won', 'Lost'].includes(l.stage)).length,
      },
      analytics: {
        dailyRevenueSeries,
        monthlyRevenueSeries,
        revenueByCategory,
        serviceBreakdown: [
          { label: 'Store Orders', count: allStoreOrders.length },
          { label: '3D Print Jobs', count: allPrintOrders.length },
          { label: 'Engineering Enquiries', count: allEnquiries.length },
          { label: 'PCB Enquiries', count: allPcb.length },
          { label: 'B2B Bulk Enquiries', count: allB2b.length },
        ],
      },
      users: sanitizedUsers,
      storeOrders: allStoreOrders,
      printingOrders: allPrintOrders,
      projectEnquiries: allEnquiries,
      quotations: allQuotations,
      projects: allProjects,
      pcbEnquiries: allPcb,
      b2bEnquiries: allB2b,
      payments: allPayments,
      invoices: allInvoices,
      lowStockProducts,
      inventoryMovements: recentMovements,
      newsletterSubscribers: subscribers,
      cmsPages: pages,
      categories: allCategories,
      products: allProducts,
      brands: allBrands,
      mediaAssets: allMedia,
      blogs: allBlogs,
      caseStudies: allCaseStudies,
      coupons: allCoupons,
      crmLeads: allLeads,
      crmNotes: allNotes,
      supportTickets: allTickets,
      recentAudit,
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to load admin overview.' });
  }
});

// User Roles & Status (Super Admin Only)
adminRouter.patch('/users/:id/role', requireAdmin(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const role = String(req.body.role || 'customer');
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'User not found.' });

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_USER_ROLE',
      entityType: 'user',
      entityId: id,
      details: { newRole: role, targetEmail: updated.email },
    });

    const { passwordHash: _ph, ...safe } = updated;
    res.json({ user: safe });
  } catch {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

adminRouter.patch('/users/:id/status', requireAdmin(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const isActive = Boolean(req.body.isActive);
    if (id === req.dbUser!.id && !isActive) {
      return res.status(400).json({ error: 'You cannot deactivate your own active session account.' });
    }
    const [updated] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'User not found.' });
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      entityType: 'user',
      entityId: id,
    });
    const { passwordHash: _ph, ...safe } = updated;
    res.json({ user: safe });
  } catch {
    res.status(500).json({ error: 'Failed to update user account status.' });
  }
});

// Media Library (Drag-and-Drop Uploads & Metadata)
adminRouter.get('/media', async (_req, res) => {
  const rows = await db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  res.json({ items: rows });
});

adminRouter.post('/media/upload', mediaUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select or drop a file to upload.' });
    }
    const url = `/uploads/media/${req.file.filename}`;
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        fileName: req.file.originalname,
        url,
        mimeType: req.file.mimetype || 'application/octet-stream',
        sizeBytes: req.file.size,
        altText: String(req.body.altText || req.file.originalname).trim(),
        folder: String(req.body.folder || 'general').trim(),
        uploadedBy: req.dbUser!.email,
      })
      .returning();

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPLOAD_MEDIA_ASSET',
      entityType: 'media_asset',
      entityId: asset.id,
      details: { fileName: asset.fileName, url },
    });

    res.status(201).json({ asset });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to upload media asset.' });
  }
});

adminRouter.patch('/media/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [updated] = await db
      .update(mediaAssets)
      .set({
        altText: req.body.altText !== undefined ? String(req.body.altText) : undefined,
        folder: req.body.folder !== undefined ? String(req.body.folder) : undefined,
      })
      .where(eq(mediaAssets.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Media asset not found.' });
    res.json({ asset: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update media asset.' });
  }
});

adminRouter.delete('/media/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [existing] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Media asset not found.' });
    await db.delete(mediaAssets).where(eq(mediaAssets.id, id));
    if (existing.url.startsWith('/uploads/media/')) {
      const target = path.resolve(UPLOADS_ROOT, 'media', path.basename(existing.url));
      if (target.startsWith(path.join(UPLOADS_ROOT, 'media')) && fs.existsSync(target)) {
        fs.unlinkSync(target);
      }
    }
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete media asset.' });
  }
});

// Categories CRUD
adminRouter.get('/categories', async (_req, res) => {
  const rows = await db.select().from(productCategories).orderBy(asc(productCategories.sortOrder));
  res.json({ items: rows });
});

adminRouter.post('/categories', async (req: AuthRequest, res) => {
  try {
    const { name, slug, storeScope, description, sortOrder } = req.body;
    const [created] = await db
      .insert(productCategories)
      .values({
        name: String(name).trim(),
        slug: String(slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim(),
        storeScope: storeScope === '3d_printed' ? '3d_printed' : 'general',
        description: String(description || ''),
        sortOrder: Number(sortOrder || 0),
        isActive: true,
      })
      .returning();
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'CREATE_CATEGORY',
      entityType: 'category',
      entityId: created.id,
    });
    res.status(201).json({ category: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create category.' });
  }
});

adminRouter.put('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const [updated] = await db
      .update(productCategories)
      .set({
        name: b.name !== undefined ? String(b.name).trim() : undefined,
        slug: b.slug !== undefined ? String(b.slug).trim() : undefined,
        storeScope: b.storeScope !== undefined ? (b.storeScope === '3d_printed' ? '3d_printed' : 'general') : undefined,
        description: b.description !== undefined ? String(b.description) : undefined,
        sortOrder: b.sortOrder !== undefined ? Number(b.sortOrder) : undefined,
        isActive: b.isActive !== undefined ? Boolean(b.isActive) : undefined,
      })
      .where(eq(productCategories.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Category not found.' });
    res.json({ category: updated });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to update category.' });
  }
});

adminRouter.delete('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(productCategories).where(eq(productCategories.id, id));
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'DELETE_CATEGORY',
      entityType: 'category',
      entityId: id,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete category.' });
  }
});

// Brands CRUD
adminRouter.get('/brands', async (_req, res) => {
  const rows = await db.select().from(brands).orderBy(asc(brands.name));
  res.json({ items: rows });
});

adminRouter.post('/brands', async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    const name = String(b.name || '').trim();
    const slug = String(b.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
    const [created] = await db
      .insert(brands)
      .values({
        name,
        slug,
        logoUrl: String(b.logoUrl || ''),
        description: String(b.description || ''),
        isActive: b.isActive !== false,
      })
      .returning();
    res.status(201).json({ brand: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create brand.' });
  }
});

adminRouter.put('/brands/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const [updated] = await db
      .update(brands)
      .set({
        name: b.name !== undefined ? String(b.name).trim() : undefined,
        slug: b.slug !== undefined ? String(b.slug).trim() : undefined,
        logoUrl: b.logoUrl !== undefined ? String(b.logoUrl) : undefined,
        description: b.description !== undefined ? String(b.description) : undefined,
        isActive: b.isActive !== undefined ? Boolean(b.isActive) : undefined,
      })
      .where(eq(brands.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Brand not found.' });
    res.json({ brand: updated });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to update brand.' });
  }
});

adminRouter.delete('/brands/:id', async (req: AuthRequest, res) => {
  try {
    await db.delete(brands).where(eq(brands.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete brand.' });
  }
});

// WooCommerce-style Products CRUD + Duplicate + Soft Delete
adminRouter.get('/products', async (_req, res) => {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.isDeleted, false))
    .orderBy(asc(products.sortOrder), desc(products.createdAt));
  res.json({ items: rows });
});

adminRouter.post('/products', async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    const slug = String(b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
    const status = String(b.status || (b.isPublished === false ? 'draft' : 'published'));
    const [created] = await db
      .insert(products)
      .values({
        categoryId: b.categoryId ? Number(b.categoryId) : null,
        sku: String(b.sku).trim().toUpperCase(),
        name: String(b.name).trim(),
        slug,
        brand: String(b.brand || 'NexusTekFusion').trim(),
        productType: String(b.productType || 'simple'),
        modelNumber: String(b.modelNumber || '').trim(),
        subcategory: String(b.subcategory || '').trim(),
        shortDescription: String(b.shortDescription || '').trim(),
        storeScope: b.storeScope === '3d_printed' ? '3d_printed' : 'general',
        description: String(b.description || ''),
        technicalSpecs: b.technicalSpecs || {},
        features: Array.isArray(b.features) ? b.features : [],
        compatibility: String(b.compatibility || ''),
        packageContents: Array.isArray(b.packageContents) ? b.packageContents : [],
        applications: String(b.applications || ''),
        productFaqs: Array.isArray(b.productFaqs) ? b.productFaqs : [],
        tags: Array.isArray(b.tags) ? b.tags : [],
        relatedProductIds: Array.isArray(b.relatedProductIds) ? b.relatedProductIds.map(Number) : [],
        boughtTogetherIds: Array.isArray(b.boughtTogetherIds) ? b.boughtTogetherIds.map(Number) : [],
        videoUrl: String(b.videoUrl || ''),
        lowStockThreshold: Number(b.lowStockThreshold ?? 5),
        priceInr: b.priceInr !== undefined && b.priceInr !== '' ? Number(b.priceInr) : 0,
        discountPriceInr: b.discountPriceInr ? Number(b.discountPriceInr) : null,
        gstPercent: Number(b.gstPercent ?? 18),
        stockQty: Number(b.stockQty ?? 0),
        dimensions: String(b.dimensions || ''),
        weightGrams: Number(b.weightGrams || 0),
        shippingWeightGrams: Number(b.shippingWeightGrams || 0),
        deliveryInfo: String(b.deliveryInfo || ''),
        material: String(b.material || ''),
        availableColors: Array.isArray(b.availableColors) ? b.availableColors : [],
        availableVariants: Array.isArray(b.availableVariants) ? b.availableVariants : [],
        productionTimeDays: Number(b.productionTimeDays ?? 2),
        warrantyInfo: String(b.warrantyInfo || ''),
        imageUrl: String(b.imageUrl || '/src/assets/images/service_pcb_electronics_1794981062614.jpg'),
        galleryUrls: Array.isArray(b.galleryUrls) ? b.galleryUrls : [],
        datasheetUrl: String(b.datasheetUrl || ''),
        brochureUrl: String(b.brochureUrl || ''),
        model3dUrl: String(b.model3dUrl || ''),
        seoTitle: String(b.seoTitle || ''),
        seoDescription: String(b.seoDescription || ''),
        status,
        publishedAt: b.publishedAt ? new Date(b.publishedAt) : null,
        isFeatured: Boolean(b.isFeatured),
        isBestseller: Boolean(b.isBestseller),
        isNewArrival: b.isNewArrival !== false,
        isPublished: status !== 'draft' && b.isPublished !== false,
        sortOrder: Number(b.sortOrder || 0),
        isDeleted: false,
      })
      .returning();

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'CREATE_PRODUCT',
      entityType: 'product',
      entityId: created.id,
      details: { sku: created.sku, name: created.name },
    });
    res.status(201).json({ product: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create product.' });
  }
});

adminRouter.put('/products/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const status = b.status !== undefined ? String(b.status) : undefined;
    const isPublishedNext =
      b.isPublished !== undefined
        ? Boolean(b.isPublished)
        : status !== undefined
        ? status !== 'draft'
        : undefined;

    const [updated] = await db
      .update(products)
      .set({
        ...b,
        categoryId: b.categoryId === null || b.categoryId === '' ? null : b.categoryId !== undefined ? Number(b.categoryId) : undefined,
        priceInr: b.priceInr !== undefined ? Number(b.priceInr) : undefined,
        discountPriceInr:
          b.discountPriceInr === null || b.discountPriceInr === ''
            ? null
            : b.discountPriceInr !== undefined
            ? Number(b.discountPriceInr)
            : undefined,
        stockQty: b.stockQty !== undefined ? Number(b.stockQty) : undefined,
        weightGrams: b.weightGrams !== undefined ? Number(b.weightGrams) : undefined,
        shippingWeightGrams: b.shippingWeightGrams !== undefined ? Number(b.shippingWeightGrams) : undefined,
        gstPercent: b.gstPercent !== undefined ? Number(b.gstPercent) : undefined,
        productionTimeDays: b.productionTimeDays !== undefined ? Number(b.productionTimeDays) : undefined,
        lowStockThreshold: b.lowStockThreshold !== undefined ? Number(b.lowStockThreshold) : undefined,
        publishedAt: b.publishedAt ? new Date(b.publishedAt) : b.publishedAt === null ? null : undefined,
        status,
        isPublished: isPublishedNext,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();

    if (!updated) return res.status(404).json({ error: 'Product not found.' });
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_PRODUCT',
      entityType: 'product',
      entityId: id,
    });
    res.json({ product: updated });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to update product.' });
  }
});

adminRouter.post('/products/:id/duplicate', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const [orig] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!orig) return res.status(404).json({ error: 'Product not found.' });

    const suffix = Date.now().toString().slice(-4);
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = orig;
    const [copy] = await db
      .insert(products)
      .values({
        ...rest,
        sku: `${orig.sku}-COPY-${suffix}`,
        name: `${orig.name} (Copy)`,
        slug: `${orig.slug}-copy-${suffix}`,
        status: 'draft',
        isPublished: false,
        isDeleted: false,
      })
      .returning();

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'DUPLICATE_PRODUCT',
      entityType: 'product',
      entityId: copy.id,
      details: { sourceId: id },
    });
    res.status(201).json({ product: copy });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to duplicate product.' });
  }
});

adminRouter.delete('/products/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db
      .update(products)
      .set({ isDeleted: true, isPublished: false, status: 'draft', updatedAt: new Date() })
      .where(eq(products.id, id));
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'SOFT_DELETE_PRODUCT',
      entityType: 'product',
      entityId: id,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// Inventory Stock Adjustments + Movement Log
adminRouter.post('/inventory/adjust', async (req: AuthRequest, res) => {
  try {
    const productId = Number(req.body.productId);
    const deltaQty = Math.trunc(Number(req.body.deltaQty || 0));
    const reason = String(req.body.reason || 'Manual Stock Adjustment').trim();

    if (!productId || deltaQty === 0) {
      return res.status(400).json({ error: 'Product ID and non-zero stock delta are required.' });
    }

    const [prod] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
    if (!prod) return res.status(404).json({ error: 'Product not found.' });

    const nextQty = Math.max(0, prod.stockQty + deltaQty);
    const [updated] = await db
      .update(products)
      .set({ stockQty: nextQty, updatedAt: new Date() })
      .where(eq(products.id, productId))
      .returning();

    const [movement] = await db
      .insert(inventoryMovements)
      .values({
        productId,
        deltaQty: nextQty - prod.stockQty,
        previousQty: prod.stockQty,
        newQty: nextQty,
        reason,
        actorEmail: req.dbUser!.email,
      })
      .returning();

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'ADJUST_INVENTORY',
      entityType: 'product',
      entityId: productId,
      details: { previousQty: prod.stockQty, newQty: nextQty, reason },
    });

    res.json({ product: updated, movement });
  } catch (error) {
    console.error('Inventory adjust error:', error);
    res.status(500).json({ error: 'Failed to adjust inventory.' });
  }
});

// Bulk Product CSV Export & Import
adminRouter.get('/products/csv-export', async (_req, res) => {
  const all = await db.select().from(products).where(eq(products.isDeleted, false)).orderBy(desc(products.createdAt));
  const csv = toCsv(
    ['sku', 'name', 'brand', 'productType', 'modelNumber', 'storeScope', 'priceInr', 'discountPriceInr', 'gstPercent', 'stockQty', 'material', 'dimensions', 'isFeatured', 'isBestseller', 'isNewArrival', 'isPublished', 'description'],
    all.map((p) => [
      p.sku,
      p.name,
      p.brand,
      p.productType,
      p.modelNumber,
      p.storeScope,
      p.priceInr,
      p.discountPriceInr ?? '',
      p.gstPercent,
      p.stockQty,
      p.material,
      p.dimensions,
      p.isFeatured,
      p.isBestseller,
      p.isNewArrival,
      p.isPublished,
      p.description,
    ])
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="nexustekfusion-products.csv"');
  res.send(csv);
});

adminRouter.post('/products/csv-import', async (req: AuthRequest, res) => {
  try {
    const csvText = String(req.body.csvText || '').trim();
    if (!csvText) return res.status(400).json({ error: 'CSV content is empty.' });

    const rows = parseCsvRows(csvText);
    if (rows.length < 2) return res.status(400).json({ error: 'CSV must include header row and at least one product row.' });

    const header = rows[0].map((h) => h.toLowerCase());
    const idx = (k: string) => header.indexOf(k.toLowerCase());
    let createdCount = 0;
    let updatedCount = 0;

    for (const r of rows.slice(1)) {
      const sku = (r[idx('sku')] || '').trim().toUpperCase();
      const name = (r[idx('name')] || '').trim();
      const priceInr = Number(r[idx('priceinr')] || 0);
      if (!sku || !name) continue;

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + sku.toLowerCase();
      const [existing] = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
      const values = {
        sku,
        name,
        brand: (idx('brand') >= 0 ? r[idx('brand')] : '') || 'NexusTekFusion',
        productType: (idx('producttype') >= 0 ? r[idx('producttype')] : '') || 'simple',
        modelNumber: (idx('modelnumber') >= 0 ? r[idx('modelnumber')] : '') || '',
        storeScope: (idx('storescope') >= 0 && r[idx('storescope')] === '3d_printed') ? '3d_printed' : 'general',
        priceInr,
        discountPriceInr: idx('discountpriceinr') >= 0 && r[idx('discountpriceinr')] ? Number(r[idx('discountpriceinr')]) : null,
        gstPercent: idx('gstpercent') >= 0 && r[idx('gstpercent')] ? Number(r[idx('gstpercent')]) : 18,
        stockQty: idx('stockqty') >= 0 && r[idx('stockqty')] ? Number(r[idx('stockqty')]) : 0,
        material: (idx('material') >= 0 ? r[idx('material')] : '') || '',
        dimensions: (idx('dimensions') >= 0 ? r[idx('dimensions')] : '') || '',
        description: (idx('description') >= 0 ? r[idx('description')] : '') || '',
        isFeatured: idx('isfeatured') >= 0 ? r[idx('isfeatured')] === 'true' : false,
        isBestseller: idx('isbestseller') >= 0 ? r[idx('isbestseller')] === 'true' : false,
        isNewArrival: idx('isnewarrival') >= 0 ? r[idx('isnewarrival')] !== 'false' : true,
        isPublished: idx('ispublished') >= 0 ? r[idx('ispublished')] !== 'false' : true,
        isDeleted: false,
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(products).set(values).where(eq(products.id, existing.id));
        updatedCount++;
      } else {
        await db.insert(products).values({
          ...values,
          slug,
          imageUrl: '/src/assets/images/service_pcb_electronics_1794981062614.jpg',
        });
        createdCount++;
      }
    }

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'CSV_IMPORT_PRODUCTS',
      entityType: 'product',
      details: { createdCount, updatedCount },
    });

    res.json({ ok: true, createdCount, updatedCount });
  } catch (error: any) {
    console.error('CSV import error:', error);
    res.status(400).json({ error: error?.message || 'CSV import failed.' });
  }
});

// Operational CSV Reports Export
adminRouter.get('/export/:type', async (req, res) => {
  const type = req.params.type;
  let csv = '';
  const filename = `nexustekfusion-${type}.csv`;

  if (type === 'orders') {
    const rows = await db.select().from(storeOrders).where(eq(storeOrders.isDeleted, false)).orderBy(desc(storeOrders.createdAt));
    csv = toCsv(
      ['Order Number', 'Status', 'Payment Status', 'Subtotal', 'Discount', 'Shipping', 'GST', 'Total', 'Tracking Courier', 'Tracking ID', 'Created At'],
      rows.map((r) => [r.orderNumber, r.orderStatus, r.paymentStatus, r.subtotalInr, r.discountInr, r.shippingInr, r.gstInr, r.totalInr, r.trackingCourier, r.trackingId, r.createdAt.toISOString()])
    );
  } else if (type === '3d-orders') {
    const rows = await db.select().from(printingOrders).orderBy(desc(printingOrders.createdAt));
    csv = toCsv(
      ['Order Number', 'File', 'Tech', 'Material', 'Qty', 'Total INR', 'Order Status', 'Payment Status', 'Created At'],
      rows.map((r) => [r.orderNumber, r.fileName, r.technology, r.materialName, r.quantity, r.totalInr, r.orderStatus, r.paymentStatus, r.createdAt.toISOString()])
    );
  } else if (type === 'customers') {
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    csv = toCsv(
      ['ID', 'Email', 'Full Name', 'Mobile', 'Company/College', 'Role', 'Active', 'Created At'],
      rows.map((u) => [u.id, u.email, u.fullName, u.mobile, u.companyOrCollege, u.role, u.isActive, u.createdAt.toISOString()])
    );
  } else if (type === 'enquiries') {
    const rows = await db.select().from(projectEnquiries).where(eq(projectEnquiries.isDeleted, false)).orderBy(desc(projectEnquiries.createdAt));
    csv = toCsv(
      ['Enquiry No', 'Project Title', 'Customer Name', 'Email', 'Phone', 'Branch', 'Category', 'Budget', 'Status', 'Assigned Engineer', 'Created At'],
      rows.map((e) => [e.enquiryNumber, e.projectTitle, e.customerName, e.customerEmail, e.customerPhone, e.engineeringBranch, e.projectCategory, e.estimatedBudget, e.status, e.assignedEngineer, e.createdAt.toISOString()])
    );
  } else if (type === 'payments') {
    const rows = await db.select().from(payments).orderBy(desc(payments.createdAt));
    csv = toCsv(
      ['Payment Ref', 'Entity Type', 'Entity ID', 'Amount INR', 'Mode', 'Status', 'Razorpay Order ID', 'Razorpay Payment ID', 'Created At'],
      rows.map((p) => [p.paymentRef, p.entityType, p.entityId, p.amountInr, p.mode, p.status, p.razorpayOrderId, p.razorpayPaymentId, p.createdAt.toISOString()])
    );
  } else if (type === 'invoices') {
    const rows = await db.select().from(invoices).where(eq(invoices.isDeleted, false)).orderBy(desc(invoices.issuedAt));
    csv = toCsv(
      ['Invoice Number', 'Doc Type', 'Entity Type', 'Entity ID', 'Amount INR', 'GST INR', 'Issued At'],
      rows.map((inv) => [inv.invoiceNumber, inv.docType, inv.entityType, inv.entityId, inv.amountInr, inv.gstInr, inv.issuedAt.toISOString()])
    );
  } else if (type === 'newsletter') {
    const rows = await db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt));
    csv = toCsv(
      ['Email', 'Source', 'Subscribed At'],
      rows.map((s) => [s.email, s.source, s.createdAt.toISOString()])
    );
  } else {
    return res.status(400).json({ error: 'Unsupported export type.' });
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
});

// Store Orders Status, Shipment Tracking, Internal Notes & Soft Delete
adminRouter.patch('/store-orders/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { orderStatus, trackingCourier, trackingId, trackingUrl, dispatchDate, expectedDeliveryDate, internalNotes } = req.body;
    const [existing] = await db.select().from(storeOrders).where(eq(storeOrders.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Store order not found.' });

    const [updated] = await db
      .update(storeOrders)
      .set({
        orderStatus: orderStatus ?? existing.orderStatus,
        trackingCourier: trackingCourier ?? existing.trackingCourier,
        trackingId: trackingId ?? existing.trackingId,
        trackingUrl: trackingUrl ?? existing.trackingUrl,
        dispatchDate: dispatchDate ?? existing.dispatchDate,
        expectedDeliveryDate: expectedDeliveryDate ?? existing.expectedDeliveryDate,
        internalNotes: internalNotes ?? existing.internalNotes,
        updatedAt: new Date(),
      })
      .where(eq(storeOrders.id, id))
      .returning();

    await createNotification({
      userId: updated.userId,
      title: `Order ${updated.orderNumber}: ${updated.orderStatus}`,
      message: updated.trackingId
        ? `Shipped via ${updated.trackingCourier} (${updated.trackingId}).`
        : `Order status updated to ${updated.orderStatus}.`,
      link: '/track-order',
    });

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_STORE_ORDER',
      entityType: 'store_order',
      entityId: id,
      details: { orderStatus: updated.orderStatus, trackingId: updated.trackingId },
    });
    res.json({ order: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update store order.' });
  }
});

adminRouter.delete('/store-orders/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db
      .update(storeOrders)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(storeOrders.id, id));
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'ARCHIVE_STORE_ORDER',
      entityType: 'store_order',
      entityId: id,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to archive store order.' });
  }
});

// 3D Printing Materials, Machines & Orders
adminRouter.get('/printing-config', async (_req, res) => {
  const [materials, machines] = await Promise.all([
    db.select().from(printingMaterials),
    db.select().from(printingMachines),
  ]);
  res.json({ materials, machines });
});

adminRouter.post('/printing-materials', async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    const [created] = await db
      .insert(printingMaterials)
      .values({
        name: String(b.name).trim(),
        technology: String(b.technology || 'FDM'),
        densityGcm3: Number(b.densityGcm3 || 1.24),
        ratePerGramInr: Number(b.ratePerGramInr || 6),
        availableColors: b.availableColors || [{ name: 'Black', hex: '#18181b' }],
        layerHeightsMm: b.layerHeightsMm || [0.15, 0.2],
        description: String(b.description || ''),
        isActive: b.isActive !== false,
      })
      .returning();
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'CREATE_3DP_MATERIAL',
      entityType: 'printing_material',
      entityId: created.id,
    });
    res.status(201).json({ material: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to add material.' });
  }
});

adminRouter.put('/printing-machines/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const [updated] = await db
      .update(printingMachines)
      .set({
        name: b.name,
        hourlyRateInr: Number(b.hourlyRateInr),
        minOrderInr: Number(b.minOrderInr),
        wastagePercent: Number(b.wastagePercent),
        labourFeeInr: Number(b.labourFeeInr),
        finishingFeeInr: Number(b.finishingFeeInr),
        isActive: Boolean(b.isActive),
      })
      .where(eq(printingMachines.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Machine not found.' });
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_3DP_MACHINE',
      entityType: 'printing_machine',
      entityId: id,
    });
    res.json({ machine: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update printer rate.' });
  }
});

adminRouter.patch('/printing-orders/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { orderStatus, slicingStatus, totalInr, trackingCourier, trackingId, trackingUrl, productionNotes } = req.body;
    const [existing] = await db.select().from(printingOrders).where(eq(printingOrders.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: '3D printing order not found.' });

    const nextTotal = totalInr !== undefined && Number(totalInr) > 0 ? Number(totalInr) : existing.totalInr;
    const nextPricing = {
      ...existing.pricingBreakdown,
      totalInr: nextTotal,
      technicalReviewRequired:
        slicingStatus === 'Slicing Completed' ? false : existing.pricingBreakdown.technicalReviewRequired,
    };

    const [updated] = await db
      .update(printingOrders)
      .set({
        orderStatus: orderStatus ?? existing.orderStatus,
        slicingStatus: slicingStatus ?? existing.slicingStatus,
        totalInr: nextTotal,
        pricingBreakdown: nextPricing,
        trackingCourier: trackingCourier ?? existing.trackingCourier,
        trackingId: trackingId ?? existing.trackingId,
        trackingUrl: trackingUrl ?? existing.trackingUrl,
        productionNotes: productionNotes ?? existing.productionNotes,
        updatedAt: new Date(),
      })
      .where(eq(printingOrders.id, id))
      .returning();

    await createNotification({
      userId: updated.userId,
      title: `3D Print ${updated.orderNumber}: ${updated.orderStatus}`,
      message: `Production status updated to ${updated.orderStatus}.`,
      link: '/my-account',
    });

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_3DP_ORDER',
      entityType: 'printing_order',
      entityId: id,
      details: { orderStatus, slicingStatus, totalInr: nextTotal },
    });
    res.json({ order: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update 3D printing order.' });
  }
});

// Project Enquiries (Accept / Reject w/ Mandatory Reason / Clarification), Quotations & Active Projects
adminRouter.patch('/project-enquiries/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, assignedEngineer, internalNotes, rejectionReason, clarificationNotes } = req.body;

    if (status === 'Rejected' && !String(rejectionReason || '').trim()) {
      return res.status(400).json({ error: 'A clear rejection reason is required when rejecting an enquiry.' });
    }

    const [existing] = await db.select().from(projectEnquiries).where(eq(projectEnquiries.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Enquiry not found.' });

    const [updated] = await db
      .update(projectEnquiries)
      .set({
        status: status ?? existing.status,
        assignedEngineer: assignedEngineer ?? existing.assignedEngineer,
        internalNotes: internalNotes ?? existing.internalNotes,
        rejectionReason: rejectionReason !== undefined ? String(rejectionReason).trim() : existing.rejectionReason,
        clarificationNotes: clarificationNotes !== undefined ? String(clarificationNotes).trim() : existing.clarificationNotes,
        updatedAt: new Date(),
      })
      .where(eq(projectEnquiries.id, id))
      .returning();

    if (status === 'Rejected') {
      await createNotification({
        userId: updated.userId,
        title: `Project Enquiry ${updated.enquiryNumber} Declined`,
        message: `Reason: ${updated.rejectionReason}`,
        link: '/my-account/project-enquiries',
      });
    } else if (status === 'Clarification Needed' && updated.clarificationNotes) {
      await createNotification({
        userId: updated.userId,
        title: `Clarification Requested (${updated.enquiryNumber})`,
        message: updated.clarificationNotes,
        link: '/my-account/project-enquiries',
      });
    } else if (status === 'Accepted' || status === 'Under Technical Review') {
      await createNotification({
        userId: updated.userId,
        title: `Project Enquiry ${updated.enquiryNumber}: ${status}`,
        message: updated.assignedEngineer ? `Assigned to ${updated.assignedEngineer}.` : 'Technical review is underway.',
        link: '/my-account/project-enquiries',
      });
    }

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_PROJECT_ENQUIRY',
      entityType: 'project_enquiry',
      entityId: id,
      details: { status: updated.status, assignedEngineer: updated.assignedEngineer, rejectionReason: updated.rejectionReason },
    });
    res.json({ enquiry: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update enquiry.' });
  }
});

adminRouter.post('/quotations', async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    const enquiryId = Number(b.enquiryId);
    const [enquiry] = await db
      .select()
      .from(projectEnquiries)
      .where(eq(projectEnquiries.id, enquiryId))
      .limit(1);
    if (!enquiry) return res.status(404).json({ error: 'Enquiry not found.' });

    const existingQuotes = await db
      .select()
      .from(projectQuotations)
      .where(eq(projectQuotations.enquiryId, enquiryId));
    const revisionNumber = existingQuotes.length + 1;

    const items = Array.isArray(b.items) ? b.items : [];
    const itemsSum = items.reduce(
      (s: number, it: { qty?: number; unitPriceInr?: number }) =>
        s + Number(it.qty || 1) * Number(it.unitPriceInr || 0),
      0
    );

    const cc = b.costCategories || {};
    const costCategories = {
      development: Number(cc.development ?? b.designDevChargesInr ?? 0),
      hardware: Number(cc.hardware ?? b.hardwareCostInr ?? 0),
      sensors: Number(cc.sensors || 0),
      pcb: Number(cc.pcb || 0),
      mechanical: Number(cc.mechanical || 0),
      printing3d: Number(cc.printing3d || 0),
      software: Number(cc.software ?? b.softwareCostInr ?? 0),
      aiMl: Number(cc.aiMl || 0),
      iot: Number(cc.iot || 0),
      droneRobotics: Number(cc.droneRobotics || 0),
      testing: Number(cc.testing ?? b.testingChargesInr ?? 0),
      documentation: Number(cc.documentation ?? b.documentationChargesInr ?? 0),
      delivery: Number(cc.delivery ?? b.deliveryChargesInr ?? 0),
      other: Number(cc.other || 0),
    };

    const categoriesSum = Object.values(costCategories).reduce((s, n) => s + n, 0);
    const discountInr = Number(b.discountInr || 0);
    const gstInr = Number(b.gstInr || 0);

    const totalAmountInr = Math.max(1, itemsSum + categoriesSum + gstInr - discountInr);
    const advancePercent = Math.min(100, Math.max(10, Number(b.advancePercent ?? 50)));
    const advanceAmountInr = Math.round((totalAmountInr * advancePercent) / 100);
    const balanceAmountInr = totalAmountInr - advanceAmountInr;

    const [quotation] = await db
      .insert(projectQuotations)
      .values({
        enquiryId,
        revisionNumber,
        items,
        hardwareCostInr: costCategories.hardware + costCategories.sensors + costCategories.pcb + costCategories.mechanical + costCategories.printing3d,
        softwareCostInr: costCategories.software + costCategories.aiMl + costCategories.iot,
        designDevChargesInr: costCategories.development + costCategories.droneRobotics + costCategories.other,
        testingChargesInr: costCategories.testing,
        documentationChargesInr: costCategories.documentation,
        deliveryChargesInr: costCategories.delivery,
        costCategories,
        validityDays: Number(b.validityDays || 15),
        estimatedDuration: String(b.estimatedDuration || '3–4 Weeks'),
        paymentTerms: String(b.paymentTerms || `${advancePercent}% Advance, Balance on Completion / Dispatch`),
        termsAndConditions: String(b.termsAndConditions || ''),
        discountInr,
        gstInr,
        totalAmountInr,
        advancePercent,
        advanceAmountInr,
        balanceAmountInr,
        status: 'Sent',
      })
      .returning();

    await db
      .update(projectEnquiries)
      .set({ status: 'Quotation Sent', updatedAt: new Date() })
      .where(eq(projectEnquiries.id, enquiryId));

    await createNotification({
      userId: enquiry.userId,
      title: `Quotation Ready for ${enquiry.enquiryNumber}`,
      message: `Revision #${revisionNumber} totaling ₹${totalAmountInr} (Advance ₹${advanceAmountInr}) is ready for review.`,
      link: '/my-account/project-enquiries',
    });

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'CREATE_QUOTATION',
      entityType: 'project_quotation',
      entityId: quotation.id,
      details: { enquiryId, totalAmountInr },
    });

    res.status(201).json({ quotation });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Failed to create quotation.' });
  }
});

adminRouter.patch('/projects/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { status, assignedEngineer, milestones, updates, deliverables, trackingCourier, trackingId, trackingUrl } =
      req.body;

    const [existing] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Project not found.' });

    const [updated] = await db
      .update(projects)
      .set({
        status: status ?? existing.status,
        assignedEngineer: assignedEngineer ?? existing.assignedEngineer,
        milestones: milestones ?? existing.milestones,
        updates: updates ?? existing.updates,
        deliverables: deliverables ?? existing.deliverables,
        trackingCourier: trackingCourier ?? existing.trackingCourier,
        trackingId: trackingId ?? existing.trackingId,
        trackingUrl: trackingUrl ?? existing.trackingUrl,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    await createNotification({
      userId: updated.userId,
      title: `Project ${updated.projectCode} Update`,
      message: `Status: ${updated.status}. Check your dashboard for milestone progress.`,
      link: '/my-account/project-enquiries',
    });

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: id,
    });
    res.json({ project: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update project.' });
  }
});

// PCB & B2B Quotations
adminRouter.patch('/pcb-enquiries/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { quotedAmountInr, status, adminNotes } = req.body;
    const [updated] = await db
      .update(pcbEnquiries)
      .set({
        quotedAmountInr: quotedAmountInr ? Number(quotedAmountInr) : null,
        status,
        adminNotes: adminNotes ?? '',
        updatedAt: new Date(),
      })
      .where(eq(pcbEnquiries.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'PCB enquiry not found.' });
    if (updated.userId && quotedAmountInr) {
      await createNotification({
        userId: updated.userId,
        title: `PCB Quote Ready (${updated.enquiryNumber})`,
        message: `Quoted amount ₹${quotedAmountInr}. You can pay directly from your dashboard.`,
        link: '/my-account',
      });
    }
    res.json({ enquiry: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update PCB enquiry.' });
  }
});

adminRouter.patch('/b2b-enquiries/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { quotedAmountInr, volumeDiscountPercent, status, adminNotes } = req.body;
    const [updated] = await db
      .update(b2bEnquiries)
      .set({
        quotedAmountInr: quotedAmountInr ? Number(quotedAmountInr) : null,
        volumeDiscountPercent: Number(volumeDiscountPercent || 0),
        status,
        adminNotes: adminNotes ?? '',
        updatedAt: new Date(),
      })
      .where(eq(b2bEnquiries.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'B2B enquiry not found.' });
    if (updated.userId && quotedAmountInr) {
      await createNotification({
        userId: updated.userId,
        title: `B2B Bulk Quote Ready (${updated.enquiryNumber})`,
        message: `Quoted amount ₹${quotedAmountInr}. Proceed to payment in your account.`,
        link: '/my-account',
      });
    }
    res.json({ enquiry: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update B2B enquiry.' });
  }
});

// Coupons CRUD
adminRouter.get('/coupons', async (_req, res) => {
  res.json({ items: await db.select().from(coupons).orderBy(desc(coupons.createdAt)) });
});

adminRouter.post('/coupons', async (req, res) => {
  try {
    const b = req.body;
    const [created] = await db
      .insert(coupons)
      .values({
        code: String(b.code).trim().toUpperCase(),
        discountType: b.discountType === 'flat' ? 'flat' : 'percent',
        discountValue: Number(b.discountValue),
        minOrderInr: Number(b.minOrderInr || 0),
        isActive: b.isActive !== false,
      })
      .returning();
    res.status(201).json({ coupon: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create coupon.' });
  }
});

adminRouter.patch('/coupons/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [updated] = await db
      .update(coupons)
      .set({
        isActive: req.body.isActive !== undefined ? Boolean(req.body.isActive) : undefined,
        discountValue: req.body.discountValue !== undefined ? Number(req.body.discountValue) : undefined,
        minOrderInr: req.body.minOrderInr !== undefined ? Number(req.body.minOrderInr) : undefined,
      })
      .where(eq(coupons.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Coupon not found.' });
    res.json({ coupon: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update coupon.' });
  }
});

adminRouter.delete('/coupons/:id', async (req, res) => {
  try {
    await db.delete(coupons).where(eq(coupons.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete coupon.' });
  }
});

// Blogs CRUD
adminRouter.get('/blogs', async (_req, res) => {
  res.json({ items: await db.select().from(blogs).orderBy(desc(blogs.publishedAt)) });
});

adminRouter.post('/blogs', async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    const slug = String(b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
    const [created] = await db
      .insert(blogs)
      .values({
        title: String(b.title).trim(),
        slug,
        category: String(b.category || 'Engineering'),
        tags: Array.isArray(b.tags) ? b.tags : [],
        excerpt: String(b.excerpt || ''),
        content: String(b.content || ''),
        coverImageUrl: String(b.coverImageUrl || '/src/assets/images/hero_nexustek_engineering_1794981062404.jpg'),
        seoTitle: String(b.seoTitle || b.title),
        seoDescription: String(b.seoDescription || b.excerpt || ''),
        isPublished: b.isPublished !== false,
      })
      .returning();
    res.status(201).json({ blog: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to publish blog.' });
  }
});

adminRouter.put('/blogs/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const [updated] = await db
      .update(blogs)
      .set({
        title: b.title !== undefined ? String(b.title).trim() : undefined,
        slug: b.slug !== undefined ? String(b.slug).trim() : undefined,
        category: b.category !== undefined ? String(b.category) : undefined,
        tags: Array.isArray(b.tags) ? b.tags : undefined,
        excerpt: b.excerpt !== undefined ? String(b.excerpt) : undefined,
        content: b.content !== undefined ? String(b.content) : undefined,
        coverImageUrl: b.coverImageUrl !== undefined ? String(b.coverImageUrl) : undefined,
        seoTitle: b.seoTitle !== undefined ? String(b.seoTitle) : undefined,
        seoDescription: b.seoDescription !== undefined ? String(b.seoDescription) : undefined,
        isPublished: b.isPublished !== undefined ? Boolean(b.isPublished) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(blogs.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Article not found.' });
    res.json({ blog: updated });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to update article.' });
  }
});

adminRouter.delete('/blogs/:id', async (req: AuthRequest, res) => {
  try {
    await db.delete(blogs).where(eq(blogs.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete article.' });
  }
});

// Engineering R&D & Academic Projects (caseStudies) CRUD
adminRouter.get('/case-studies', async (_req, res) => {
  res.json({ items: await db.select().from(caseStudies).orderBy(desc(caseStudies.createdAt)) });
});

adminRouter.post('/case-studies', async (req, res) => {
  try {
    const b = req.body;
    const slug = String(b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
    const [created] = await db
      .insert(caseStudies)
      .values({
        title: String(b.title).trim(),
        slug,
        technologyUsed: String(b.technologyUsed || ''),
        applications: String(b.applications || ''),
        outcomes: String(b.outcomes || ''),
        relatedServices: Array.isArray(b.relatedServices) ? b.relatedServices : [],
        description: String(b.description || ''),
        imageUrl: String(b.imageUrl || '/src/assets/images/service_robotics_automation_1794981063545.jpg'),
        videoUrl: String(b.videoUrl || ''),
        isPublished: b.isPublished !== false,
      })
      .returning();
    res.status(201).json({ caseStudy: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create project showcase.' });
  }
});

adminRouter.put('/case-studies/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const [updated] = await db
      .update(caseStudies)
      .set({
        title: b.title !== undefined ? String(b.title).trim() : undefined,
        slug: b.slug !== undefined ? String(b.slug).trim() : undefined,
        technologyUsed: b.technologyUsed !== undefined ? String(b.technologyUsed) : undefined,
        applications: b.applications !== undefined ? String(b.applications) : undefined,
        outcomes: b.outcomes !== undefined ? String(b.outcomes) : undefined,
        relatedServices: Array.isArray(b.relatedServices) ? b.relatedServices : undefined,
        description: b.description !== undefined ? String(b.description) : undefined,
        imageUrl: b.imageUrl !== undefined ? String(b.imageUrl) : undefined,
        videoUrl: b.videoUrl !== undefined ? String(b.videoUrl) : undefined,
        isPublished: b.isPublished !== undefined ? Boolean(b.isPublished) : undefined,
      })
      .where(eq(caseStudies.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Project showcase not found.' });
    res.json({ caseStudy: updated });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to update project showcase.' });
  }
});

adminRouter.delete('/case-studies/:id', async (req, res) => {
  try {
    await db.delete(caseStudies).where(eq(caseStudies.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete project showcase.' });
  }
});

// CRM Leads Pipeline & Follow-Up Notes
adminRouter.get('/crm/leads', async (_req, res) => {
  const [leads, notes] = await Promise.all([
    db.select().from(crmLeads).where(eq(crmLeads.isDeleted, false)).orderBy(desc(crmLeads.updatedAt)),
    db.select().from(crmNotes).orderBy(desc(crmNotes.createdAt)).limit(200),
  ]);
  res.json({ leads, notes });
});

adminRouter.post('/crm/leads', async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    if (!b.name) return res.status(400).json({ error: 'Lead name is required.' });
    const [created] = await db
      .insert(crmLeads)
      .values({
        name: String(b.name).trim(),
        email: String(b.email || '').trim(),
        phone: String(b.phone || '').trim(),
        companyOrCollege: String(b.companyOrCollege || '').trim(),
        source: String(b.source || 'manual'),
        stage: String(b.stage || 'New Lead'),
        assignedTo: String(b.assignedTo || ''),
        estimatedValueInr: Number(b.estimatedValueInr || 0),
        nextFollowUpDate: String(b.nextFollowUpDate || ''),
        summary: String(b.summary || ''),
      })
      .returning();
    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'CREATE_CRM_LEAD',
      entityType: 'crm_lead',
      entityId: created.id,
    });
    res.status(201).json({ lead: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create CRM lead.' });
  }
});

adminRouter.patch('/crm/leads/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const [updated] = await db
      .update(crmLeads)
      .set({
        stage: b.stage !== undefined ? String(b.stage) : undefined,
        assignedTo: b.assignedTo !== undefined ? String(b.assignedTo) : undefined,
        estimatedValueInr: b.estimatedValueInr !== undefined ? Number(b.estimatedValueInr) : undefined,
        nextFollowUpDate: b.nextFollowUpDate !== undefined ? String(b.nextFollowUpDate) : undefined,
        summary: b.summary !== undefined ? String(b.summary) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(crmLeads.id, id))
      .returning();
    if (!updated) return res.status(404).json({ error: 'Lead not found.' });
    res.json({ lead: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update CRM lead.' });
  }
});

adminRouter.delete('/crm/leads/:id', async (req: AuthRequest, res) => {
  try {
    await db.update(crmLeads).set({ isDeleted: true, updatedAt: new Date() }).where(eq(crmLeads.id, Number(req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to archive lead.' });
  }
});

adminRouter.post('/crm/notes', async (req: AuthRequest, res) => {
  try {
    const { entityType, entityId, note } = req.body;
    if (!entityType || !entityId || !String(note || '').trim()) {
      return res.status(400).json({ error: 'Entity type, ID, and note text are required.' });
    }
    const [created] = await db
      .insert(crmNotes)
      .values({
        entityType: String(entityType),
        entityId: Number(entityId),
        authorEmail: req.dbUser!.email,
        note: String(note).trim(),
      })
      .returning();
    res.status(201).json({ note: created });
  } catch {
    res.status(500).json({ error: 'Failed to save follow-up note.' });
  }
});

// Site Settings & CMS
adminRouter.put('/settings/:key', async (req: AuthRequest, res) => {
  try {
    const key = req.params.key;
    const value = req.body.value;
    const [saved] = await db
      .insert(siteSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_CMS_SETTING',
      entityType: 'site_settings',
      entityId: key,
    });

    res.json({ setting: saved });
  } catch {
    res.status(500).json({ error: 'Failed to update setting.' });
  }
});

// Visual Website Editor APIs (Draft, Publish, Revision History, Rollback, Custom Pages)
adminRouter.get('/website-editor/state', async (_req, res) => {
  try {
    const [rows, pages, revisions] = await Promise.all([
      db.select().from(siteSettings),
      db.select().from(cmsPages).orderBy(desc(cmsPages.updatedAt)),
      db.select().from(cmsRevisions).orderBy(desc(cmsRevisions.createdAt)).limit(30),
    ]);
    const settingsMap: Record<string, unknown> = {};
    for (const r of rows) {
      if (r.key === 'paymentGatewayConfig') continue;
      settingsMap[r.key] = r.value;
    }
    if (!settingsMap.homepageLayout) {
      settingsMap.homepageLayout = {
        draft: DEFAULT_HOMEPAGE_SECTIONS,
        published: DEFAULT_HOMEPAGE_SECTIONS,
      };
    }
    res.json({ settings: settingsMap, pages, revisions });
  } catch (error) {
    console.error('Website editor state error:', error);
    res.status(500).json({ error: 'Failed to load Website Editor state.' });
  }
});

adminRouter.put('/website-editor/draft', async (req: AuthRequest, res) => {
  try {
    const { sections } = req.body;
    if (!Array.isArray(sections)) {
      return res.status(400).json({ error: 'Sections array is required.' });
    }
    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'homepageLayout'))
      .limit(1);
    const prev = (existing?.value as { published?: unknown[]; publishedAt?: string }) || {};
    const nextVal = {
      draft: sections,
      published: prev.published || DEFAULT_HOMEPAGE_SECTIONS,
      publishedAt: prev.publishedAt,
    };

    await db
      .insert(siteSettings)
      .values({ key: 'homepageLayout', value: nextVal, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: nextVal, updatedAt: new Date() },
      });

    res.json({ homepageLayout: nextVal });
  } catch (error) {
    console.error('Save draft error:', error);
    res.status(500).json({ error: 'Failed to save homepage draft.' });
  }
});

adminRouter.post('/website-editor/publish', async (req: AuthRequest, res) => {
  try {
    const label = String(req.body.label || `Publish ${new Date().toLocaleString('en-IN')}`);
    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'homepageLayout'))
      .limit(1);
    const prev = (existing?.value as { draft?: unknown[]; published?: unknown[] }) || {};
    const draftToPublish = Array.isArray(req.body.sections)
      ? req.body.sections
      : prev.draft || DEFAULT_HOMEPAGE_SECTIONS;

    const nextVal = {
      draft: draftToPublish,
      published: draftToPublish,
      publishedAt: new Date().toISOString(),
    };

    await db
      .insert(siteSettings)
      .values({ key: 'homepageLayout', value: nextVal, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: nextVal, updatedAt: new Date() },
      });

    const [revision] = await db
      .insert(cmsRevisions)
      .values({
        targetKey: 'homepageLayout',
        label,
        snapshot: draftToPublish,
        createdBy: req.dbUser!.email,
      })
      .returning();

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'PUBLISH_WEBSITE_LAYOUT',
      entityType: 'site_settings',
      entityId: 'homepageLayout',
      details: { revisionId: revision.id, label },
    });

    res.json({ homepageLayout: nextVal, revision });
  } catch (error) {
    console.error('Publish layout error:', error);
    res.status(500).json({ error: 'Failed to publish homepage.' });
  }
});

adminRouter.post('/website-editor/rollback/:revisionId', async (req: AuthRequest, res) => {
  try {
    const revisionId = Number(req.params.revisionId);
    const publishImmediately = Boolean(req.body.publishImmediately);
    const [rev] = await db.select().from(cmsRevisions).where(eq(cmsRevisions.id, revisionId)).limit(1);
    if (!rev) return res.status(404).json({ error: 'Revision not found.' });

    const [existing] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'homepageLayout'))
      .limit(1);
    const prev = (existing?.value as { published?: unknown[]; publishedAt?: string }) || {};
    const restored = Array.isArray(rev.snapshot) ? rev.snapshot : DEFAULT_HOMEPAGE_SECTIONS;

    const nextVal = {
      draft: restored,
      published: publishImmediately ? restored : prev.published || DEFAULT_HOMEPAGE_SECTIONS,
      publishedAt: publishImmediately ? new Date().toISOString() : prev.publishedAt,
    };

    await db
      .insert(siteSettings)
      .values({ key: 'homepageLayout', value: nextVal, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: nextVal, updatedAt: new Date() },
      });

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'ROLLBACK_WEBSITE_LAYOUT',
      entityType: 'cms_revisions',
      entityId: revisionId,
      details: { publishImmediately },
    });

    res.json({ homepageLayout: nextVal });
  } catch (error) {
    console.error('Rollback error:', error);
    res.status(500).json({ error: 'Failed to rollback layout.' });
  }
});

adminRouter.post('/website-editor/pages', async (req: AuthRequest, res) => {
  try {
    const b = req.body;
    const title = String(b.title || '').trim();
    const slug = String(b.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim();
    if (!title || !slug) return res.status(400).json({ error: 'Page title and slug are required.' });

    const draftContent = b.draftContent || {
      heroHeadline: title,
      heroSubheadline: b.seoDescription || 'Custom landing page engineered by NexusTekFusion.',
      ctaLabel: 'Contact Engineering Team',
      ctaLink: '/contact',
      blocks: [{ id: 'b1', heading: 'Overview', body: 'Edit this block in Visual Website Editor.' }],
    };

    const publishNow = b.status === 'published';
    const [created] = await db
      .insert(cmsPages)
      .values({
        title,
        slug,
        seoTitle: String(b.seoTitle || title),
        seoDescription: String(b.seoDescription || ''),
        draftContent,
        publishedContent: publishNow ? draftContent : null,
        status: publishNow ? 'published' : 'draft',
        updatedBy: req.dbUser!.email,
      })
      .returning();

    res.status(201).json({ page: created });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to create page.' });
  }
});

adminRouter.put('/website-editor/pages/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body;
    const [existing] = await db.select().from(cmsPages).where(eq(cmsPages.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: 'Page not found.' });

    const publishNow = b.publish === true || b.status === 'published';
    const nextDraft = b.draftContent ?? existing.draftContent;
    const [updated] = await db
      .update(cmsPages)
      .set({
        title: b.title ?? existing.title,
        seoTitle: b.seoTitle ?? existing.seoTitle,
        seoDescription: b.seoDescription ?? existing.seoDescription,
        draftContent: nextDraft,
        publishedContent: publishNow ? nextDraft : existing.publishedContent,
        status: publishNow ? 'published' : b.status ?? existing.status,
        updatedBy: req.dbUser!.email,
        updatedAt: new Date(),
      })
      .where(eq(cmsPages.id, id))
      .returning();

    res.json({ page: updated });
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Failed to update page.' });
  }
});

adminRouter.delete('/website-editor/pages/:id', async (_req: AuthRequest, res) => {
  try {
    await db.delete(cmsPages).where(eq(cmsPages.id, Number(_req.params.id)));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete page.' });
  }
});

adminRouter.post('/support-tickets/:id/reply', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { message, status, assignedStaff } = req.body;
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found.' });

    const nextMessages = message
      ? [
          ...ticket.messages,
          {
            sender: req.dbUser!.fullName || req.dbUser!.email,
            role: 'admin',
            text: String(message).trim(),
            timestamp: new Date().toISOString(),
          },
        ]
      : ticket.messages;

    const [updated] = await db
      .update(supportTickets)
      .set({
        messages: nextMessages,
        status: status || 'Replied',
        assignedStaff: assignedStaff ?? ticket.assignedStaff,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, id))
      .returning();

    res.json({ ticket: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update support ticket.' });
  }
});

adminRouter.get('/invoices', async (_req, res) => {
  res.json({ items: await db.select().from(invoices).where(eq(invoices.isDeleted, false)).orderBy(desc(invoices.issuedAt)) });
});

// Super Admin Encrypted Payment Gateway Configuration
adminRouter.get('/payment-settings', requireAdmin(['super_admin']), async (_req, res) => {
  try {
    const creds = await getRazorpayCredentials();
    const maskedKey = creds.keyId
      ? `${creds.keyId.slice(0, 8)}••••${creds.keyId.slice(-4)}`
      : '';
    res.json({
      configured: Boolean(creds.keyId && creds.keySecret),
      source: creds.source,
      keyIdMasked: maskedKey,
      hasKeySecret: Boolean(creds.keySecret),
      hasWebhookSecret: Boolean(creds.webhookSecret),
    });
  } catch {
    res.status(500).json({ error: 'Failed to inspect payment settings.' });
  }
});

adminRouter.put('/payment-settings', requireAdmin(['super_admin']), async (req: AuthRequest, res) => {
  try {
    const { keyId, keySecret, webhookSecret, clear } = req.body;
    if (clear) {
      await db.delete(siteSettings).where(eq(siteSettings.key, 'paymentGatewayConfig'));
      await logAudit({
        actorUid: req.dbUser!.uid,
        actorEmail: req.dbUser!.email,
        action: 'CLEAR_PAYMENT_GATEWAY',
        entityType: 'site_settings',
        entityId: 'paymentGatewayConfig',
      });
      return res.json({ ok: true, cleared: true });
    }

    const existing = await getRazorpayCredentials();
    const finalKeyId = String(keyId || existing.keyId || '').trim();
    const finalKeySecret = String(keySecret || existing.keySecret || '').trim();
    const finalWebhook = String(webhookSecret || existing.webhookSecret || '').trim();

    if (!finalKeyId || !finalKeySecret) {
      return res.status(400).json({ error: 'Razorpay Key ID and Key Secret are required.' });
    }

    await db
      .insert(siteSettings)
      .values({
        key: 'paymentGatewayConfig',
        value: {
          keyIdEnc: encryptSecret(finalKeyId),
          keySecretEnc: encryptSecret(finalKeySecret),
          webhookSecretEnc: finalWebhook ? encryptSecret(finalWebhook) : '',
          updatedBy: req.dbUser!.email,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: {
            keyIdEnc: encryptSecret(finalKeyId),
            keySecretEnc: encryptSecret(finalKeySecret),
            webhookSecretEnc: finalWebhook ? encryptSecret(finalWebhook) : '',
            updatedBy: req.dbUser!.email,
            updatedAt: new Date().toISOString(),
          },
          updatedAt: new Date(),
        },
      });

    await logAudit({
      actorUid: req.dbUser!.uid,
      actorEmail: req.dbUser!.email,
      action: 'UPDATE_PAYMENT_GATEWAY',
      entityType: 'site_settings',
      entityId: 'paymentGatewayConfig',
      details: { keyIdPrefix: finalKeyId.slice(0, 8) },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('Save payment settings error:', error);
    res.status(500).json({ error: 'Failed to save encrypted payment settings.' });
  }
});
