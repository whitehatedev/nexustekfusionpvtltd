import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Briefcase,
  CheckCircle2,
  Copy,
  Cpu,
  CreditCard,
  Download,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  History,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Printer,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Tags,
  Ticket,
  Trash2,
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import {
  downloadInvoicePdf,
  downloadPackingSlipPdf,
  downloadQuotationPdf,
} from '../lib/pdf';
import {
  ProjectFinanceDashboardPanel,
  ProjectHandoverControlsPanel,
  ProjectPaymentSettingsPanel,
} from '../components/admin/ProjectPaymentsAndFinancePanel';
import { KrashivantriAdminWorkspace } from '../components/admin/KrashivantriAdminPanels';

const COMPANY_LOGO = '/assets/aistudio/image_1a5ac752.png';

export type AdminTab =
  | 'overview'
  | 'website_cms'
  | 'krashivantri_cms'
  | 'media_library'
  | 'store_products'
  | 'categories_brands'
  | 'inventory'
  | 'store_orders'
  | 'coupons'
  | 'projects'
  | 'project_finance'
  | 'project_payment_settings'
  | 'printing'
  | 'pcb_b2b'
  | 'crm'
  | 'rd_projects'
  | 'blogs'
  | 'payments_invoices'
  | 'support'
  | 'users'
  | 'settings'
  | 'audit'
  | 'krash_farmers'
  | 'krash_pilots'
  | 'krash_live_tracking'
  | 'krash_orders_live'
  | 'krash_farmer_payments'
  | 'krash_pilot_payouts'
  | 'krash_penalties'
  | 'krash_finance'
  // legacy tab aliases mapped gracefully
  | 'store'
  | 'cms'
  | 'project_settings'
  | 'payment_settings';

function normalizeTab(t?: AdminTab): AdminTab {
  if (!t) return 'overview';
  if (t === 'store') return 'store_products';
  if (t === 'cms') return 'website_cms';
  if (t === 'project_settings') return 'project_payment_settings';
  if (t === 'payment_settings') return 'payments_invoices';
  return t;
}

const COST_CATEGORY_FIELDS: Array<[string, string]> = [
  ['development', 'Development Charges (₹)'],
  ['hardware', 'Hardware / Components (₹)'],
  ['sensors', 'Sensors & Modules (₹)'],
  ['pcb', 'PCB Design & Fab (₹)'],
  ['mechanical', 'Mechanical Fab (₹)'],
  ['printing3d', '3D Printing (₹)'],
  ['software', 'Software / App / Web (₹)'],
  ['aiMl', 'AI / ML Model (₹)'],
  ['iot', 'IoT / Cloud Setup (₹)'],
  ['droneRobotics', 'Drone / Robotics Eng (₹)'],
  ['testing', 'Testing & Calibration (₹)'],
  ['documentation', 'Docs / PPT / Report (₹)'],
  ['delivery', 'Delivery & Packaging (₹)'],
  ['other', 'Other Custom (₹)'],
];

const INITIAL_COST_CATEGORIES: Record<string, number> = {
  development: 0,
  hardware: 0,
  sensors: 0,
  pcb: 0,
  mechanical: 0,
  printing3d: 0,
  software: 0,
  aiMl: 0,
  iot: 0,
  droneRobotics: 0,
  testing: 0,
  documentation: 0,
  delivery: 250,
  other: 0,
};

const STORE_ORDER_STATUSES = [
  'Order Placed',
  'Pending Payment',
  'Payment Confirmed',
  'Processing',
  'Packed',
  'Packaging',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Refunded',
];

const CRM_STAGES = [
  'New Lead',
  'Contacted',
  'Requirement Understood',
  'Quotation Sent',
  'Negotiation',
  'Won',
  'Lost',
];

const STAFF_ROLES = [
  'customer',
  'super_admin',
  'admin',
  'website_manager',
  'product_manager',
  'sales_manager',
  'project_manager',
  'engineer',
  'printing_operator',
  'inventory_manager',
  'accounts_manager',
  'support_manager',
  'support_staff',
];

interface EmptyProductDraft {
  id?: number;
  name: string;
  sku: string;
  modelNumber: string;
  brand: string;
  categoryId: string;
  subcategory: string;
  storeScope: 'general' | '3d_printed';
  productType: 'simple' | 'variable' | 'customizable' | 'made_to_order' | 'quote_only';
  status: 'draft' | 'published' | 'scheduled';
  shortDescription: string;
  description: string;
  featuresText: string;
  specsText: string;
  priceInr: string;
  discountPriceInr: string;
  gstPercent: string;
  stockQty: string;
  lowStockThreshold: string;
  dimensions: string;
  weightGrams: string;
  shippingWeightGrams: string;
  deliveryInfo: string;
  material: string;
  availableVariantsText: string;
  availableColorsText: string;
  packageContentsText: string;
  compatibility: string;
  applications: string;
  imageUrl: string;
  galleryUrlsText: string;
  brochureUrl: string;
  datasheetUrl: string;
  model3dUrl: string;
  videoUrl: string;
  seoTitle: string;
  seoDescription: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
}

const EMPTY_PRODUCT: EmptyProductDraft = {
  name: '',
  sku: '',
  modelNumber: '',
  brand: 'NexusTekFusion',
  categoryId: '',
  subcategory: '',
  storeScope: 'general',
  productType: 'simple',
  status: 'published',
  shortDescription: '',
  description: '',
  featuresText: '',
  specsText: '',
  priceInr: '0',
  discountPriceInr: '',
  gstPercent: '18',
  stockQty: '10',
  lowStockThreshold: '5',
  dimensions: '',
  weightGrams: '0',
  shippingWeightGrams: '0',
  deliveryInfo: '',
  material: '',
  availableVariantsText: '',
  availableColorsText: '',
  packageContentsText: '',
  compatibility: '',
  applications: '',
  imageUrl: '/src/assets/images/service_pcb_electronics_1794981062614.jpg',
  galleryUrlsText: '',
  brochureUrl: '',
  datasheetUrl: '',
  model3dUrl: '',
  videoUrl: '',
  seoTitle: '',
  seoDescription: '',
  isFeatured: false,
  isBestseller: false,
  isNewArrival: true,
};

export const AdminDashboardPage: React.FC<{ initialTab?: AdminTab }> = ({ initialTab }) => {
  const {
    fbUser,
    dbUser,
    isSignedIn,
    isAdmin,
    signInWithGoogle,
    signOut,
    apiFetch,
    notify,
    settings,
    refreshBootstrap,
    navigate,
  } = usePlatform();

  const [tab, setTab] = useState<AdminTab>(() => normalizeTab(initialTab));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(normalizeTab(initialTab));
  }, [initialTab]);

  const [overview, setOverview] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [mediaAssets, setMediaAssets] = useState<any[]>([]);
  const [printConfig, setPrintConfig] = useState<{ materials: any[]; machines: any[] }>({
    materials: [],
    machines: [],
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [crmStageFilter, setCrmStageFilter] = useState('All');

  // Product Form / Edit State
  const [prodDraft, setProdDraft] = useState<EmptyProductDraft>(EMPTY_PRODUCT);
  const [showProdForm, setShowProdForm] = useState(false);
  const [csvImportText, setCsvImportText] = useState('');
  const [importingCsv, setImportingCsv] = useState(false);

  // Category & Brand State
  const [catForm, setCatForm] = useState<{ id?: number; name: string; slug: string; storeScope: 'general' | '3d_printed'; description: string; sortOrder: string }>({
    name: '',
    slug: '',
    storeScope: 'general',
    description: '',
    sortOrder: '0',
  });
  const [brandForm, setBrandForm] = useState<{ id?: number; name: string; slug: string; logoUrl: string; description: string }>({
    name: '',
    slug: '',
    logoUrl: '',
    description: '',
  });

  // Inventory adjustment
  const [stockAdjustMap, setStockAdjustMap] = useState<Record<number, { delta: string; reason: string }>>({});

  // Store Order inline state
  const [orderDraftMap, setOrderDraftMap] = useState<Record<number, { orderStatus: string; trackingCourier: string; trackingId: string; trackingUrl: string; internalNotes: string }>>({});

  // Project Enquiry inline rejection/clarification + 14-Category Quotation Builder
  const [rejectReasonMap, setRejectReasonMap] = useState<Record<number, string>>({});
  const [rejectOpenId, setRejectOpenId] = useState<number>(0);
  const [clarifyNotesMap, setClarifyNotesMap] = useState<Record<number, string>>({});
  const [clarifyOpenId, setClarifyOpenId] = useState<number>(0);
  const [engineerMap, setEngineerMap] = useState<Record<number, string>>({});
  const [quoteEnquiryId, setQuoteEnquiryId] = useState<number>(0);
  const [costCategories, setCostCategories] = useState<Record<string, number>>(INITIAL_COST_CATEGORIES);
  const [quoteItems, setQuoteItems] = useState<Array<{ name: string; description: string; qty: number; unitPriceInr: number }>>([]);
  const [quoteMeta, setQuoteMeta] = useState({
    discountInr: 0,
    gstInr: 0,
    advancePercent: 50,
    validityDays: 15,
    estimatedDuration: '3–4 Weeks',
    paymentTerms: '50% Advance on Acceptance, 50% Balance Before Dispatch',
    termsAndConditions: '',
  });

  // 3D Printing Lab
  const [newMat, setNewMat] = useState({
    name: '',
    technology: 'FDM',
    densityGcm3: '1.24',
    ratePerGramInr: '8',
    description: '',
  });
  const [printOrderEdit, setPrintOrderEdit] = useState<Record<number, { orderStatus: string; slicingStatus: string; totalInr: string; productionNotes: string }>>({});

  // PCB / B2B / Support inline
  const [pcbQuoteMap, setPcbQuoteMap] = useState<Record<number, string>>({});
  const [b2bQuoteMap, setB2bQuoteMap] = useState<Record<number, string>>({});
  const [ticketReplyMap, setTicketReplyMap] = useState<Record<number, string>>({});

  // CRM Leads & Notes
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyOrCollege: '',
    source: 'manual',
    stage: 'New Lead',
    estimatedValueInr: '0',
    nextFollowUpDate: '',
    summary: '',
  });
  const [leadNoteMap, setLeadNoteMap] = useState<Record<number, string>>({});

  // Coupons
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '10',
    minOrderInr: '500',
  });

  // Blogs & Case Studies (Engineering R&D)
  const [blogForm, setBlogForm] = useState<{ id?: number; title: string; category: string; excerpt: string; content: string; coverImageUrl: string; isPublished: boolean }>({
    title: '',
    category: 'Engineering',
    excerpt: '',
    content: '',
    coverImageUrl: '/src/assets/images/hero_nexustek_engineering_1794981062404.jpg',
    isPublished: true,
  });
  const [rdForm, setRdForm] = useState<{ id?: number; title: string; slug: string; technologyUsed: string; applications: string; outcomes: string; description: string; imageUrl: string; videoUrl: string; isPublished: boolean }>({
    title: '',
    slug: '',
    technologyUsed: '',
    applications: '',
    outcomes: '',
    description: '',
    imageUrl: '/src/assets/images/service_robotics_automation_1794981063545.jpg',
    videoUrl: '',
    isPublished: true,
  });

  // Media Upload
  const [mediaFolder, setMediaFolder] = useState('general');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // CMS & KRASHIVANTRI & Menus & Services & Settings
  const [navMenus, setNavMenus] = useState<
    Array<{
      id: string;
      label: string;
      to: string;
      visible: boolean;
      sortOrder: number;
      children?: Array<{ id: string; label: string; to: string }>;
    }>
  >(() => settings.navigationMenus?.header || []);
  const [servicesCatalog, setServicesCatalog] = useState<Array<{ slug: string; title: string; shortDesc: string; visible: boolean; imageUrl?: string; ctaLabel?: string }>>(
    () => settings.servicesCatalog || []
  );
  const [krashiCatalog, setKrashiCatalog] = useState<any>(() => settings.krashivantriCatalog || { platformName: '', summary: '', bannerImageUrl: '', models: [] });

  const [announcementForm, setAnnouncementForm] = useState(() => ({
    enabled: settings.announcementBar?.enabled ?? true,
    text: settings.announcementBar?.text ?? '',
    link: settings.announcementBar?.link ?? '/krashivantri',
    ctaLabel: settings.announcementBar?.ctaLabel ?? 'Explore',
  }));
  const [companyForm, setCompanyForm] = useState(() => ({
    legalName: settings.companyInfo?.legalName ?? 'NEXUSTEKFUSION PRIVATE LIMITED',
    brandName: settings.companyInfo?.brandName ?? 'NexusTekFusion',
    email: settings.companyInfo?.email ?? 'info@nexustekfusion.in',
    address: settings.companyInfo?.address ?? 'H NO. 565/19 NIT, SANKUL NEW COTTON MARK, Ganjipeth, Nagpur 440018, Maharashtra, India',
    cin: settings.companyInfo?.cin ?? 'U30305ME2026PTC474052',
    gstin: settings.companyInfo?.gstin ?? '',
    contactPhone: settings.companyInfo?.contactPhone ?? '',
    whatsappNumber: settings.companyInfo?.whatsappNumber ?? '',
    businessHours: settings.companyInfo?.businessHours ?? 'Monday – Saturday, 10:00 AM – 7:00 PM IST',
  }));
  const [shippingForm, setShippingForm] = useState(() => ({
    standardShippingInr: settings.shippingConfig?.standardShippingInr ?? 99,
    freeShippingAboveInr: settings.shippingConfig?.freeShippingAboveInr ?? 2499,
    defaultGstPercent: settings.shippingConfig?.defaultGstPercent ?? 18,
  }));
  const [projSettingsForm, setProjSettingsForm] = useState(() => ({
    enableGstTax: settings.projectSettings?.enableGstTax ?? false,
    defaultGstPercent: settings.projectSettings?.defaultGstPercent ?? 18,
    defaultAdvancePercent: settings.projectSettings?.defaultAdvancePercent ?? 50,
    quotationValidityDays: settings.projectSettings?.quotationValidityDays ?? 15,
  }));

  const [paymentStatus, setPaymentStatus] = useState<{
    configured: boolean;
    source: string;
    keyIdMasked: string;
    hasKeySecret: boolean;
    hasWebhookSecret: boolean;
  } | null>(null);
  const [rzpForm, setRzpForm] = useState({ keyId: '', keySecret: '', webhookSecret: '' });

  // Admin Password Change
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const loadAll = async () => {
    if (!isSignedIn || !isAdmin) return;
    setLoading(true);
    try {
      const [ov, prods, cats, brs, pcfg] = await Promise.all([
        apiFetch('/api/admin/overview'),
        apiFetch<{ items: any[] }>('/api/admin/products'),
        apiFetch<{ items: any[] }>('/api/admin/categories'),
        apiFetch<{ items: any[] }>('/api/admin/brands'),
        apiFetch<{ materials: any[]; machines: any[] }>('/api/admin/printing-config'),
      ]);
      setOverview(ov);
      setProducts(prods.items || []);
      setCategories(cats.items || []);
      setBrands(brs.items || []);
      setMediaAssets(ov.mediaAssets || []);
      setPrintConfig(pcfg);
      if (dbUser?.role === 'super_admin') {
        try {
          const ps = await apiFetch<any>('/api/admin/payment-settings');
          setPaymentStatus(ps);
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      notify(err?.message || 'Failed to load admin console.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [isSignedIn, isAdmin, dbUser?.role]);

  useEffect(() => {
    if (settings.navigationMenus?.header) setNavMenus(settings.navigationMenus.header);
    if (settings.servicesCatalog) setServicesCatalog(settings.servicesCatalog);
    if (settings.krashivantriCatalog) setKrashiCatalog(settings.krashivantriCatalog);
  }, [settings]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        String(p.brand || '').toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    const all = overview?.storeOrders || [];
    const q = orderSearch.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (o: any) =>
        o.orderNumber.toLowerCase().includes(q) ||
        String(o.orderStatus || '').toLowerCase().includes(q) ||
        String(o.shippingAddress?.fullName || '').toLowerCase().includes(q)
    );
  }, [overview?.storeOrders, orderSearch]);

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0B1B3B] p-3 flex items-center justify-center">
          <img src={COMPANY_LOGO} alt="NexusTekFusion Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">NexusTekFusion Admin Console</h1>
        <p className="text-sm text-slate-600">
          Sign in with your administrator email &amp; password or authorized Google Admin account.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('/admin/login')}
            className="px-6 py-3 bg-[#0B1B3B] hover:bg-[#132954] text-white rounded-lg text-sm font-semibold"
          >
            Admin Credential Login
          </button>
          <button
            onClick={signInWithGoogle}
            className="px-6 py-3 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 rounded-lg text-sm font-semibold"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 text-red-600 mx-auto" />
        <h1 className="font-display text-2xl font-bold text-[#0B1B3B]">Admin Access Restricted</h1>
        <p className="text-sm text-slate-600">
          Account <span className="font-mono">{dbUser?.email}</span> holds role{' '}
          <span className="font-mono font-semibold">{dbUser?.role}</span>.
        </p>
        <button
          onClick={() => navigate('/admin/login')}
          className="px-5 py-2.5 bg-[#0B1B3B] text-white rounded-lg text-xs font-semibold"
        >
          Switch to Admin Account
        </button>
      </div>
    );
  }

  const downloadAuthorizedCsv = async (url: string, filename: string) => {
    try {
      const headers = new Headers();
      if (fbUser) {
        const token = await fbUser.getIdToken();
        headers.set('Authorization', `Bearer ${token}`);
      }
      const resp = await fetch(url, { headers, credentials: 'same-origin' });
      if (!resp.ok) throw new Error('Export failed.');
      const blob = await resp.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch (err: any) {
      notify(err?.message || 'Unable to download CSV.', 'error');
    }
  };

  const openEditProduct = (p: any) => {
    const specsLines = Object.entries(p.technicalSpecs || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    setProdDraft({
      id: p.id,
      name: p.name || '',
      sku: p.sku || '',
      modelNumber: p.modelNumber || '',
      brand: p.brand || 'NexusTekFusion',
      categoryId: p.categoryId ? String(p.categoryId) : '',
      subcategory: p.subcategory || '',
      storeScope: p.storeScope === '3d_printed' ? '3d_printed' : 'general',
      productType: (p.productType || 'simple') as any,
      status: (p.status || (p.isPublished ? 'published' : 'draft')) as any,
      shortDescription: p.shortDescription || '',
      description: p.description || '',
      featuresText: (p.features || []).join('\n'),
      specsText: specsLines,
      priceInr: String(p.priceInr ?? 0),
      discountPriceInr: p.discountPriceInr ? String(p.discountPriceInr) : '',
      gstPercent: String(p.gstPercent ?? 18),
      stockQty: String(p.stockQty ?? 0),
      lowStockThreshold: String(p.lowStockThreshold ?? 5),
      dimensions: p.dimensions || '',
      weightGrams: String(p.weightGrams ?? 0),
      shippingWeightGrams: String(p.shippingWeightGrams ?? 0),
      deliveryInfo: p.deliveryInfo || '',
      material: p.material || '',
      availableVariantsText: (p.availableVariants || []).join(', '),
      availableColorsText: (p.availableColors || []).join(', '),
      packageContentsText: (p.packageContents || []).join('\n'),
      compatibility: p.compatibility || '',
      applications: p.applications || '',
      imageUrl: p.imageUrl || '/src/assets/images/service_pcb_electronics_1794981062614.jpg',
      galleryUrlsText: (p.galleryUrls || []).join('\n'),
      brochureUrl: p.brochureUrl || '',
      datasheetUrl: p.datasheetUrl || '',
      model3dUrl: p.model3dUrl || '',
      videoUrl: p.videoUrl || '',
      seoTitle: p.seoTitle || '',
      seoDescription: p.seoDescription || '',
      isFeatured: Boolean(p.isFeatured),
      isBestseller: Boolean(p.isBestseller),
      isNewArrival: Boolean(p.isNewArrival),
    });
    setShowProdForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const technicalSpecs: Record<string, string> = {};
    for (const line of prodDraft.specsText.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const idx = trimmed.indexOf(':');
      if (idx > 0) {
        technicalSpecs[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
      }
    }
    const payload = {
      name: prodDraft.name.trim(),
      sku: prodDraft.sku.trim().toUpperCase(),
      modelNumber: prodDraft.modelNumber.trim(),
      brand: prodDraft.brand.trim() || 'NexusTekFusion',
      categoryId: prodDraft.categoryId ? Number(prodDraft.categoryId) : null,
      subcategory: prodDraft.subcategory.trim(),
      storeScope: prodDraft.storeScope,
      productType: prodDraft.productType,
      status: prodDraft.status,
      isPublished: prodDraft.status !== 'draft',
      shortDescription: prodDraft.shortDescription.trim(),
      description: prodDraft.description,
      features: prodDraft.featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
      technicalSpecs,
      priceInr: Number(prodDraft.priceInr || 0),
      discountPriceInr: prodDraft.discountPriceInr ? Number(prodDraft.discountPriceInr) : null,
      gstPercent: Number(prodDraft.gstPercent || 18),
      stockQty: Number(prodDraft.stockQty || 0),
      lowStockThreshold: Number(prodDraft.lowStockThreshold || 5),
      dimensions: prodDraft.dimensions,
      weightGrams: Number(prodDraft.weightGrams || 0),
      shippingWeightGrams: Number(prodDraft.shippingWeightGrams || 0),
      deliveryInfo: prodDraft.deliveryInfo,
      material: prodDraft.material,
      availableVariants: prodDraft.availableVariantsText.split(',').map((s) => s.trim()).filter(Boolean),
      availableColors: prodDraft.availableColorsText.split(',').map((s) => s.trim()).filter(Boolean),
      packageContents: prodDraft.packageContentsText.split('\n').map((s) => s.trim()).filter(Boolean),
      compatibility: prodDraft.compatibility,
      applications: prodDraft.applications,
      imageUrl: prodDraft.imageUrl.trim(),
      galleryUrls: prodDraft.galleryUrlsText.split('\n').map((s) => s.trim()).filter(Boolean),
      brochureUrl: prodDraft.brochureUrl.trim(),
      datasheetUrl: prodDraft.datasheetUrl.trim(),
      model3dUrl: prodDraft.model3dUrl.trim(),
      videoUrl: prodDraft.videoUrl.trim(),
      seoTitle: prodDraft.seoTitle.trim(),
      seoDescription: prodDraft.seoDescription.trim(),
      isFeatured: prodDraft.isFeatured,
      isBestseller: prodDraft.isBestseller,
      isNewArrival: prodDraft.isNewArrival,
    };
    try {
      if (prodDraft.id) {
        await apiFetch(`/api/admin/products/${prodDraft.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        notify(`Updated product "${payload.name}".`, 'success');
      } else {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        notify(`Created product "${payload.name}".`, 'success');
      }
      setProdDraft(EMPTY_PRODUCT);
      setShowProdForm(false);
      loadAll();
      refreshBootstrap();
    } catch (err: any) {
      notify(err?.message || 'Failed to save product.', 'error');
    }
  };

  const handleMediaUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingMedia(true);
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('folder', mediaFolder);
        fd.append('altText', file.name);
        await apiFetch('/api/admin/media/upload', { method: 'POST', body: fd });
      }
      notify(`Uploaded ${fileList.length} media file(s).`, 'success');
      loadAll();
    } catch (err: any) {
      notify(err?.message || 'Media upload failed.', 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleUpdateOrderTracking = async (endpoint: string, body: Record<string, unknown>) => {
    try {
      await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
      notify('Updated record.', 'success');
      loadAll();
    } catch (err: any) {
      notify(err?.message || 'Update failed.', 'error');
    }
  };

  const handleAdjustStock = async (productId: number) => {
    const entry = stockAdjustMap[productId] || { delta: '0', reason: '' };
    const deltaQty = Math.trunc(Number(entry.delta || 0));
    if (!deltaQty) {
      notify('Enter a positive or negative quantity delta.', 'error');
      return;
    }
    try {
      await apiFetch('/api/admin/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          deltaQty,
          reason: entry.reason || 'Admin Manual Adjustment',
        }),
      });
      setStockAdjustMap((prev) => ({ ...prev, [productId]: { delta: '', reason: '' } }));
      notify('Inventory updated and logged.', 'success');
      loadAll();
    } catch (err: any) {
      notify(err?.message || 'Stock adjustment failed.', 'error');
    }
  };

  const handleCsvImport = async () => {
    if (!csvImportText.trim()) return;
    setImportingCsv(true);
    try {
      const res = await apiFetch<{ createdCount: number; updatedCount: number }>(
        '/api/admin/products/csv-import',
        { method: 'POST', body: JSON.stringify({ csvText: csvImportText }) }
      );
      notify(`CSV processed: ${res.createdCount} created, ${res.updatedCount} updated.`, 'success');
      setCsvImportText('');
      loadAll();
      refreshBootstrap();
    } catch (err: any) {
      notify(err?.message || 'CSV import failed.', 'error');
    } finally {
      setImportingCsv(false);
    }
  };

  const quoteCategorySum = Object.values(costCategories).reduce((s, n) => s + Number(n || 0), 0);
  const quoteItemsSum = quoteItems.reduce(
    (s, it) => s + Math.max(1, Number(it.qty || 1)) * Number(it.unitPriceInr || 0),
    0
  );
  const computedQuoteTotal = Math.max(
    1,
    quoteCategorySum + quoteItemsSum + Number(quoteMeta.gstInr || 0) - Number(quoteMeta.discountInr || 0)
  );
  const computedAdvanceInr = Math.round((computedQuoteTotal * Number(quoteMeta.advancePercent || 50)) / 100);

  const handleSendQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteEnquiryId) return;
    try {
      await apiFetch('/api/admin/quotations', {
        method: 'POST',
        body: JSON.stringify({
          enquiryId: quoteEnquiryId,
          items: quoteItems.filter((it) => it.name.trim()),
          costCategories,
          ...quoteMeta,
        }),
      });
      notify('14-category quotation sent to customer.', 'success');
      setQuoteEnquiryId(0);
      setQuoteItems([]);
      setCostCategories(INITIAL_COST_CATEGORIES);
      loadAll();
    } catch (err: any) {
      notify(err?.message || 'Failed to create quotation.', 'error');
    }
  };

  const SIDEBAR_GROUPS: Array<{
    group: string;
    items: Array<{ id: AdminTab; label: string; icon: React.ReactNode }>;
  }> = [
    {
      group: 'Dashboard',
      items: [{ id: 'overview', label: 'Overview & Analytics', icon: <LayoutDashboard className="w-4 h-4" /> }],
    },
    {
      group: 'Website & CMS',
      items: [
        { id: 'website_cms', label: 'Pages, Menus & Services', icon: <Globe className="w-4 h-4" /> },
        { id: 'krashivantri_cms', label: 'KRASHIVANTRI CMS', icon: <Send className="w-4 h-4" /> },
        { id: 'media_library', label: 'Media Library', icon: <ImageIcon className="w-4 h-4" /> },
      ],
    },
    {
      group: 'WooCommerce Store',
      items: [
        { id: 'store_products', label: 'Products & CSV', icon: <Package className="w-4 h-4" /> },
        { id: 'categories_brands', label: 'Categories & Brands', icon: <Tags className="w-4 h-4" /> },
        { id: 'inventory', label: 'Inventory & Stock', icon: <Boxes className="w-4 h-4" /> },
        { id: 'store_orders', label: 'Orders & Slips', icon: <ShoppingBag className="w-4 h-4" /> },
        { id: 'coupons', label: 'Coupons', icon: <Ticket className="w-4 h-4" /> },
      ],
    },
    {
      group: 'Engineering & Lab',
      items: [
        { id: 'projects', label: 'Projects & Quotations', icon: <Wrench className="w-4 h-4" /> },
        { id: 'project_finance', label: 'Project Finance & Dues', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'project_payment_settings', label: 'Project Split & Emails', icon: <Settings className="w-4 h-4" /> },
        { id: 'printing', label: '3D Printing Lab', icon: <Printer className="w-4 h-4" /> },
        { id: 'pcb_b2b', label: 'PCB & B2B Quotes', icon: <Cpu className="w-4 h-4" /> },
      ],
    },
    {
      group: 'KRASHIVANTRI Drone Ops',
      items: [
        { id: 'krash_farmers', label: 'Farmers & Farms KYC', icon: <Users className="w-4 h-4" /> },
        { id: 'krash_pilots', label: 'Drone Pilots & Drones', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'krash_live_tracking', label: 'Live GPS Tracking', icon: <Globe className="w-4 h-4" /> },
        { id: 'krash_orders_live', label: 'Bookings & Dispatch', icon: <Send className="w-4 h-4" /> },
        { id: 'krash_farmer_payments', label: 'Farmer Payments & Refunds', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'krash_pilot_payouts', label: 'Pilot Payouts', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'krash_penalties', label: 'Penalties & Appeals', icon: <AlertTriangle className="w-4 h-4" /> },
        { id: 'krash_finance', label: 'Ops Finance & Config', icon: <FileSpreadsheet className="w-4 h-4" /> },
      ],
    },
    {
      group: 'CRM, Content & Finance',
      items: [
        { id: 'crm', label: 'CRM Leads Pipeline', icon: <Briefcase className="w-4 h-4" /> },
        { id: 'rd_projects', label: 'R&D Case Studies', icon: <FileText className="w-4 h-4" /> },
        { id: 'blogs', label: 'Engineering Blogs', icon: <FileText className="w-4 h-4" /> },
        { id: 'payments_invoices', label: 'Payments & Razorpay', icon: <CreditCard className="w-4 h-4" /> },
        { id: 'support', label: 'Support & Drone Repairs', icon: <MessageSquare className="w-4 h-4" /> },
      ],
    },
    {
      group: 'System',
      items: [
        { id: 'users', label: 'Staff Roles & Password', icon: <Users className="w-4 h-4" /> },
        { id: 'settings', label: 'Company, Tax & Shipping', icon: <Settings className="w-4 h-4" /> },
        { id: 'audit', label: 'Audit Logs', icon: <History className="w-4 h-4" /> },
      ],
    },
  ];

  const activeDailySeries: Array<{ date: string; label: string; amountInr: number }> =
    overview?.analytics?.dailyRevenueSeries || [];
  const activeMonthlySeries: Array<{ month: string; label: string; amountInr: number }> =
    overview?.analytics?.monthlyRevenueSeries || [];
  const maxDaily = Math.max(1, ...activeDailySeries.map((d) => d.amountInr));
  const maxMonthly = Math.max(1, ...activeMonthlySeries.map((m) => m.amountInr));

  return (
    <div className="min-h-[85vh] bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Sidebar Header */}
      <div className="lg:hidden bg-[#0B1B3B] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <img src={COMPANY_LOGO} alt="NexusTekFusion Logo" className="w-7 h-7 object-contain bg-white rounded p-0.5" />
          <span className="font-display font-bold text-sm">NexusTekFusion Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg border border-slate-700 text-slate-200"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left WordPress/WooCommerce Navy Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block w-full lg:w-64 shrink-0 bg-[#0B1B3B] text-slate-200 border-r border-slate-800 flex flex-col`}
      >
        <div className="hidden lg:flex items-center gap-3 px-5 py-5 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shrink-0">
            <img src={COMPANY_LOGO} alt="NexusTekFusion" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-sm text-white truncate">NexusTekFusion</div>
            <div className="text-[11px] font-mono text-blue-300 truncate">{dbUser?.role}</div>
          </div>
        </div>

        <nav className="p-3 space-y-5 flex-1 overflow-y-auto">
          {SIDEBAR_GROUPS.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <div className="px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {grp.group}
              </div>
              {grp.items.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-blue-700 text-white shadow-sm'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2 text-xs">
          <button
            type="button"
            onClick={() => navigate('/admin/website-editor')}
            className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold inline-flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Visual Website Editor
          </button>
          <button
            type="button"
            onClick={signOut}
            className="w-full py-2 px-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-white/5 inline-flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 p-5 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
              Control Platform · {dbUser?.email}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0B1B3B]">
              {SIDEBAR_GROUPS.flatMap((g) => g.items).find((i) => i.id === tab)?.label || 'Admin Overview'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Live Storefront
            </button>
          </div>
        </div>

        {loading || !overview ? (
          <div className="py-12 text-sm text-slate-500">Loading operational telemetry...</div>
        ) : (
          <div className="space-y-8">
            {/* ==================== OVERVIEW & ANALYTICS ==================== */}
            {tab === 'overview' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                  {[
                    ['Today Revenue', `₹${(overview.kpis.todayRevenueInr ?? 0).toLocaleString('en-IN')}`],
                    ['This Month', `₹${(overview.kpis.monthRevenueInr ?? 0).toLocaleString('en-IN')}`],
                    ['Annual Revenue', `₹${(overview.kpis.annualRevenueInr ?? 0).toLocaleString('en-IN')}`],
                    ['Total Verified', `₹${(overview.kpis.totalRevenueInr ?? 0).toLocaleString('en-IN')}`],
                    ['Pending INR', `₹${(overview.kpis.pendingPaymentsInr ?? 0).toLocaleString('en-IN')}`],
                    ['Total Orders', overview.kpis.totalOrders ?? 0],
                    ['Open CRM Leads', overview.kpis.openLeadsCount ?? 0],
                    ['Low-Stock SKUs', overview.kpis.lowStockCount ?? 0],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
                      <div className="text-[11px] text-slate-500">{label}</div>
                      <div className="font-mono text-lg font-bold text-[#0B1B3B] tabular-nums truncate">{val}</div>
                    </div>
                  ))}
                </div>

                {/* SVG Revenue Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-bold text-sm text-[#0B1B3B]">Daily Revenue (14 Days)</h2>
                      <span className="font-mono text-[11px] text-slate-500">INR Verified</span>
                    </div>
                    <svg viewBox="0 0 420 130" className="w-full h-36">
                      {activeDailySeries.map((d, i) => {
                        const barH = Math.max(3, Math.round((d.amountInr / maxDaily) * 90));
                        const x = i * 30 + 6;
                        return (
                          <g key={d.date}>
                            <rect
                              x={x}
                              y={102 - barH}
                              width={18}
                              height={barH}
                              rx={3}
                              fill={d.amountInr > 0 ? '#1D4ED8' : '#E2E8F0'}
                            >
                              <title>{`${d.label}: ₹${d.amountInr.toLocaleString('en-IN')}`}</title>
                            </rect>
                            {i % 3 === 0 && (
                              <text x={x + 9} y={120} textAnchor="middle" fontSize="8" fill="#64748B">
                                {d.label}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display font-bold text-sm text-[#0B1B3B]">Monthly Revenue (6 Months)</h2>
                      <span className="font-mono text-[11px] text-slate-500">INR Verified</span>
                    </div>
                    <svg viewBox="0 0 360 130" className="w-full h-36">
                      {activeMonthlySeries.map((m, i) => {
                        const barH = Math.max(4, Math.round((m.amountInr / maxMonthly) * 90));
                        const x = i * 58 + 14;
                        return (
                          <g key={m.month}>
                            <rect
                              x={x}
                              y={102 - barH}
                              width={32}
                              height={barH}
                              rx={4}
                              fill={m.amountInr > 0 ? '#0B1B3B' : '#E2E8F0'}
                            >
                              <title>{`${m.label}: ₹${m.amountInr.toLocaleString('en-IN')}`}</title>
                            </rect>
                            <text x={x + 16} y={120} textAnchor="middle" fontSize="9" fill="#64748B">
                              {m.label}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Revenue by Category + Operational Exports */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <h2 className="font-display font-bold text-sm text-[#0B1B3B]">Revenue Breakdown by Stream</h2>
                    {(overview.analytics?.revenueByCategory || []).length === 0 ? (
                      <p className="text-xs text-slate-500">Revenue stream breakdown updates automatically as payments verify.</p>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {(overview.analytics?.revenueByCategory || []).map((rc: any) => (
                          <div key={rc.category} className="flex justify-between border-b border-slate-100 pb-1.5">
                            <span className="text-slate-700 font-medium">{rc.category}</span>
                            <span className="font-mono font-bold text-[#0B1B3B]">₹{rc.amountInr.toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="font-display font-bold text-sm text-[#0B1B3B] flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-700" /> Operational Business Exports (CSV)
                    </div>
                    <p className="text-xs text-slate-500">Download live PostgreSQL business ledgers directly.</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ['orders', 'Store Orders CSV'],
                        ['3d-orders', '3D Printing Orders CSV'],
                        ['customers', 'Customers CSV'],
                        ['enquiries', 'Project Enquiries CSV'],
                        ['payments', 'Payments Ledger CSV'],
                        ['invoices', 'Invoices & Receipts CSV'],
                        ['newsletter', 'Newsletter CSV'],
                      ].map(([type, label]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => downloadAuthorizedCsv(`/api/admin/export/${type}`, `nexustekfusion-${type}.csv`)}
                          className="px-3 py-2 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-800 inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {overview.lowStockProducts?.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
                    <div className="font-display font-bold text-sm text-amber-950 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Low-Stock Inventory Alert
                    </div>
                    <div className="text-xs text-amber-900 flex flex-wrap gap-4">
                      {overview.lowStockProducts.map((p: any) => (
                        <span key={p.id} className="font-mono">{p.sku} ({p.name}): {p.stockQty} left</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== WEBSITE CMS, MENUS & SERVICES ==================== */}
            {tab === 'website_cms' && (
              <div className="space-y-6 text-xs">
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-[#0B1B3B]">
                      Visual Homepage Builder &amp; Custom CMS Landing Pages
                    </h2>
                    <p className="text-slate-600 mt-0.5">
                      Drag/reorder homepage sections, preview Draft vs Live, and publish custom landing pages (/p/:slug).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/admin/website-editor')}
                    className="px-4 py-2.5 bg-[#0B1B3B] hover:bg-[#132954] text-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Launch Visual Editor
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Header Navigation Menus */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-base font-bold text-[#0B1B3B]">Header Navigation Menus</h3>
                      <button
                        type="button"
                        onClick={() =>
                          setNavMenus([
                            ...navMenus,
                            { id: `m_${Date.now()}`, label: 'New Link', to: '/shop', visible: true, sortOrder: navMenus.length + 1 },
                          ])
                        }
                        className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold inline-flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Link
                      </button>
                    </div>
                    <div className="space-y-3">
                      {navMenus.map((m, idx) => (
                        <div key={m.id} className="rounded-lg border border-slate-200 p-2.5 space-y-2 bg-slate-50/50">
                          <div className="grid grid-cols-12 gap-2 items-center">
                            <input
                              value={m.label}
                              onChange={(e) =>
                                setNavMenus(navMenus.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))
                              }
                              placeholder="Label"
                              className="col-span-4 rounded border border-slate-300 bg-white px-2.5 py-1.5"
                            />
                            <input
                              value={m.to}
                              onChange={(e) =>
                                setNavMenus(navMenus.map((x, i) => (i === idx ? { ...x, to: e.target.value } : x)))
                              }
                              placeholder="/path"
                              className="col-span-5 rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                            />
                            <label className="col-span-2 flex items-center gap-1 text-[11px]">
                              <input
                                type="checkbox"
                                checked={m.visible}
                                onChange={(e) =>
                                  setNavMenus(navMenus.map((x, i) => (i === idx ? { ...x, visible: e.target.checked } : x)))
                                }
                              />
                              Show
                            </label>
                            <button
                              type="button"
                              onClick={() => setNavMenus(navMenus.filter((_, i) => i !== idx))}
                              className="col-span-1 text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="pl-3 space-y-1">
                            {(m.children || []).map((ch, cIdx) => (
                              <div key={ch.id || cIdx} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                  value={ch.label}
                                  onChange={(e) =>
                                    setNavMenus(
                                      navMenus.map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              children: (x.children || []).map((c, j) =>
                                                j === cIdx ? { ...c, label: e.target.value } : c
                                              ),
                                            }
                                          : x
                                      )
                                    )
                                  }
                                  placeholder="Submenu label"
                                  className="col-span-5 rounded border border-slate-200 bg-white px-2 py-1 text-[11px]"
                                />
                                <input
                                  value={ch.to}
                                  onChange={(e) =>
                                    setNavMenus(
                                      navMenus.map((x, i) =>
                                        i === idx
                                          ? {
                                              ...x,
                                              children: (x.children || []).map((c, j) =>
                                                j === cIdx ? { ...c, to: e.target.value } : c
                                              ),
                                            }
                                          : x
                                      )
                                    )
                                  }
                                  placeholder="/subpath"
                                  className="col-span-6 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setNavMenus(
                                      navMenus.map((x, i) =>
                                        i === idx
                                          ? { ...x, children: (x.children || []).filter((_, j) => j !== cIdx) }
                                          : x
                                      )
                                    )
                                  }
                                  className="col-span-1 text-red-600 p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() =>
                                setNavMenus(
                                  navMenus.map((x, i) =>
                                    i === idx
                                      ? {
                                          ...x,
                                          children: [
                                            ...(x.children || []),
                                            { id: `sub_${Date.now()}`, label: 'Sub-item', to: x.to },
                                          ],
                                        }
                                      : x
                                  )
                                )
                              }
                              className="text-[11px] font-semibold text-blue-700 hover:underline"
                            >
                              + Add Dropdown Item
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch('/api/admin/settings/navigationMenus', {
                          method: 'PUT',
                          body: JSON.stringify({ value: { header: navMenus } }),
                        });
                        await refreshBootstrap();
                        notify('Navigation menus updated.', 'success');
                      }}
                      className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      Save Header Menu
                    </button>
                  </div>

                  {/* Core Services Catalog Editor */}
                  <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                    <h3 className="font-display text-base font-bold text-[#0B1B3B]">Homepage Core Services Catalog</h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {servicesCatalog.map((svc, idx) => (
                        <div key={svc.slug} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-blue-700">/services/{svc.slug}</span>
                            <label className="flex items-center gap-1 text-[11px]">
                              <input
                                type="checkbox"
                                checked={svc.visible}
                                onChange={(e) =>
                                  setServicesCatalog(
                                    servicesCatalog.map((x, i) => (i === idx ? { ...x, visible: e.target.checked } : x))
                                  )
                                }
                              />
                              Visible
                            </label>
                          </div>
                          <input
                            value={svc.title}
                            onChange={(e) =>
                              setServicesCatalog(
                                servicesCatalog.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x))
                              )
                            }
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-semibold"
                          />
                          <input
                            value={svc.shortDesc}
                            onChange={(e) =>
                              setServicesCatalog(
                                servicesCatalog.map((x, i) => (i === idx ? { ...x, shortDesc: e.target.value } : x))
                              )
                            }
                            className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch('/api/admin/settings/servicesCatalog', {
                          method: 'PUT',
                          body: JSON.stringify({ value: servicesCatalog }),
                        });
                        await refreshBootstrap();
                        notify('Services catalog updated.', 'success');
                      }}
                      className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold"
                    >
                      Save Services Catalog
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== KRASHIVANTRI CMS & FLAGSHIPS ==================== */}
            {tab === 'krashivantri_cms' && (
              <div className="space-y-6 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                      KRASHIVANTRI Agricultural Drones CMS
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigate('/krashivantri')}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold inline-flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View /krashivantri
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Platform Name</label>
                      <input
                        value={krashiCatalog.platformName || ''}
                        onChange={(e) => setKrashiCatalog({ ...krashiCatalog, platformName: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Banner Image URL</label>
                      <input
                        value={krashiCatalog.bannerImageUrl || ''}
                        onChange={(e) => setKrashiCatalog({ ...krashiCatalog, bannerImageUrl: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Platform Summary"
                    value={krashiCatalog.summary || ''}
                    onChange={(e) => setKrashiCatalog({ ...krashiCatalog, summary: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />

                  {(krashiCatalog.models || []).map((m: any, mIdx: number) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="font-display font-bold text-sm text-[#0B1B3B]">{m.name}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          placeholder="Tagline"
                          value={m.tagline || ''}
                          onChange={(e) =>
                            setKrashiCatalog({
                              ...krashiCatalog,
                              models: krashiCatalog.models.map((x: any, i: number) =>
                                i === mIdx ? { ...x, tagline: e.target.value } : x
                              ),
                            })
                          }
                          className="rounded border border-slate-300 bg-white px-3 py-2"
                        />
                        <input
                          placeholder="Image URL"
                          value={m.imageUrl || ''}
                          onChange={(e) =>
                            setKrashiCatalog({
                              ...krashiCatalog,
                              models: krashiCatalog.models.map((x: any, i: number) =>
                                i === mIdx ? { ...x, imageUrl: e.target.value } : x
                              ),
                            })
                          }
                          className="rounded border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Model Summary"
                        value={m.summary || ''}
                        onChange={(e) =>
                          setKrashiCatalog({
                            ...krashiCatalog,
                            models: krashiCatalog.models.map((x: any, i: number) =>
                              i === mIdx ? { ...x, summary: e.target.value } : x
                            ),
                          })
                        }
                        className="w-full rounded border border-slate-300 bg-white px-3 py-2"
                      />
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Comparison Specs ({(m.specs || []).length})</span>
                          <button
                            type="button"
                            onClick={() =>
                              setKrashiCatalog({
                                ...krashiCatalog,
                                models: krashiCatalog.models.map((x: any, i: number) =>
                                  i === mIdx ? { ...x, specs: [...(x.specs || []), { label: '', value: '' }] } : x
                                ),
                              })
                            }
                            className="text-blue-700 font-semibold inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Spec Row
                          </button>
                        </div>
                        {(m.specs || []).map((sp: any, sIdx: number) => (
                          <div key={sIdx} className="flex gap-2">
                            <input
                              placeholder="Spec Label (e.g. Payload Tank Capacity)"
                              value={sp.label}
                              onChange={(e) =>
                                setKrashiCatalog({
                                  ...krashiCatalog,
                                  models: krashiCatalog.models.map((x: any, i: number) =>
                                    i === mIdx
                                      ? {
                                          ...x,
                                          specs: x.specs.map((ss: any, si: number) =>
                                            si === sIdx ? { ...ss, label: e.target.value } : ss
                                          ),
                                        }
                                      : x
                                  ),
                                })
                              }
                              className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1.5"
                            />
                            <input
                              placeholder="Verified Value (leave blank for Coming Soon)"
                              value={sp.value}
                              onChange={(e) =>
                                setKrashiCatalog({
                                  ...krashiCatalog,
                                  models: krashiCatalog.models.map((x: any, i: number) =>
                                    i === mIdx
                                      ? {
                                          ...x,
                                          specs: x.specs.map((ss: any, si: number) =>
                                            si === sIdx ? { ...ss, value: e.target.value } : ss
                                          ),
                                        }
                                      : x
                                  ),
                                })
                              }
                              className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setKrashiCatalog({
                                  ...krashiCatalog,
                                  models: krashiCatalog.models.map((x: any, i: number) =>
                                    i === mIdx
                                      ? { ...x, specs: x.specs.filter((_: any, si: number) => si !== sIdx) }
                                      : x
                                  ),
                                })
                              }
                              className="p-1.5 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={async () => {
                      await apiFetch('/api/admin/settings/krashivantriCatalog', {
                        method: 'PUT',
                        body: JSON.stringify({ value: krashiCatalog }),
                      });
                      await refreshBootstrap();
                      notify('KRASHIVANTRI CMS catalog saved.', 'success');
                    }}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold"
                  >
                    Save KRASHIVANTRI CMS Settings
                  </button>
                </div>

                {/* Quick Link to Flagship DB Products */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <h3 className="font-display text-base font-bold text-[#0B1B3B]">
                    Flagship Store Listings (Synced with /product/krashivantri-x &amp; /product/krashivantri-x-pro)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products
                      .filter((p) => ['krashivantri-x', 'krashivantri-x-pro'].includes(p.slug))
                      .map((fp) => (
                        <div key={fp.id} className="rounded-lg border border-slate-200 p-4 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-[#0B1B3B]">{fp.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              /{fp.slug} · Type: {fp.productType} · {fp.priceInr > 0 ? `₹${fp.priceInr}` : 'Contact for Price'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              openEditProduct(fp);
                              setTab('store_products');
                            }}
                            className="px-3 py-1.5 bg-[#0B1B3B] text-white rounded-lg font-semibold"
                          >
                            Edit Product Specs
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== MEDIA LIBRARY ==================== */}
            {tab === 'media_library' && (
              <div className="space-y-6 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Media Library (Drag &amp; Drop Upload)</h2>
                    <input
                      placeholder="Folder tag (e.g. drones, products, cms)"
                      value={mediaFolder}
                      onChange={(e) => setMediaFolder(e.target.value)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 font-mono"
                    />
                  </div>
                  <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleMediaUploadFiles(e.dataTransfer.files);
                    }}
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-blue-600 rounded-xl p-8 bg-slate-50 cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-blue-700" />
                    <span className="font-semibold text-slate-800">
                      {uploadingMedia ? 'Uploading files...' : 'Drop images, PDF datasheets, brochures, or 3D assets (.stl/.glb) here'}
                    </span>
                    <span className="text-[11px] text-slate-500">Max 50 MB per file · Saved to /uploads/media/*</span>
                    <input
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.webp,.gif,.svg,.pdf,.stl,.obj,.glb,.step,.stp"
                      onChange={(e) => handleMediaUploadFiles(e.target.files)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaAssets.map((asset: any) => (
                    <div key={asset.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                      <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                        {String(asset.mimeType || '').startsWith('image/') ? (
                          <img src={asset.url} alt={asset.altText || asset.fileName} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-10 h-10 text-slate-400" />
                        )}
                      </div>
                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="font-semibold text-slate-900 truncate">{asset.fileName}</div>
                          <div className="font-mono text-[10px] text-slate-500 truncate">{asset.url}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(asset.url);
                              notify(`Copied URL: ${asset.url}`, 'info');
                            }}
                            className="flex-1 py-1.5 border border-slate-300 rounded font-semibold inline-flex items-center justify-center gap-1 hover:bg-slate-50"
                          >
                            <Copy className="w-3 h-3" /> Copy URL
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/admin/media/${asset.id}`, { method: 'DELETE' });
                              loadAll();
                              notify('Media deleted.', 'info');
                            }}
                            className="p-1.5 text-red-600 border border-red-200 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== WOOCOMMERCE STORE PRODUCTS ==================== */}
            {tab === 'store_products' && (
              <div className="space-y-6 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      placeholder="Search products by name, SKU, or brand..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => downloadAuthorizedCsv('/api/admin/products/csv-export', 'nexustekfusion-products.csv')}
                      className="px-3.5 py-2 border border-slate-300 bg-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProdDraft(EMPTY_PRODUCT);
                        setShowProdForm(!showProdForm);
                      }}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> {showProdForm ? 'Close Product Editor' : 'Add New Product'}
                    </button>
                  </div>
                </div>

                {showProdForm && (
                  <form onSubmit={handleSaveProduct} className="rounded-xl border border-blue-200 bg-white p-6 space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                        {prodDraft.id ? `Edit Product #${prodDraft.id}` : 'Create WooCommerce Store Product'}
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setShowProdForm(false);
                          setProdDraft(EMPTY_PRODUCT);
                        }}
                        className="text-slate-500 hover:text-slate-900 font-semibold"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <input
                        required
                        placeholder="Product Title *"
                        value={prodDraft.name}
                        onChange={(e) => setProdDraft({ ...prodDraft, name: e.target.value })}
                        className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <input
                        required
                        placeholder="SKU (e.g. NTF-KV-X) *"
                        value={prodDraft.sku}
                        onChange={(e) => setProdDraft({ ...prodDraft, sku: e.target.value.toUpperCase() })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase"
                      />
                      <input
                        placeholder="Model Number"
                        value={prodDraft.modelNumber}
                        onChange={(e) => setProdDraft({ ...prodDraft, modelNumber: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <select
                        value={prodDraft.brand}
                        onChange={(e) => setProdDraft({ ...prodDraft, brand: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                      >
                        <option value="NexusTekFusion">NexusTekFusion</option>
                        <option value="KRASHIVANTRI">KRASHIVANTRI</option>
                        {brands
                          .filter((b) => !['NexusTekFusion', 'KRASHIVANTRI'].includes(b.name))
                          .map((b) => (
                            <option key={b.id} value={b.name}>{b.name}</option>
                          ))}
                      </select>
                      <select
                        value={prodDraft.categoryId}
                        onChange={(e) => setProdDraft({ ...prodDraft, categoryId: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <select
                        value={prodDraft.productType}
                        onChange={(e) => setProdDraft({ ...prodDraft, productType: e.target.value as any })}
                        className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                      >
                        <option value="simple">Simple Product</option>
                        <option value="variable">Variable (Variants/Colors)</option>
                        <option value="customizable">Customizable</option>
                        <option value="made_to_order">Made to Order</option>
                        <option value="quote_only">Quote Only (Contact for Price)</option>
                      </select>
                      <select
                        value={prodDraft.status}
                        onChange={(e) => setProdDraft({ ...prodDraft, status: e.target.value as any })}
                        className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                      <select
                        value={prodDraft.storeScope}
                        onChange={(e) => setProdDraft({ ...prodDraft, storeScope: e.target.value as any })}
                        className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                      >
                        <option value="general">General Store</option>
                        <option value="3d_printed">3D Printed Store</option>
                      </select>
                      <input
                        type="number"
                        min={0}
                        placeholder="Price ₹ (0 = Quote)"
                        value={prodDraft.priceInr}
                        onChange={(e) => setProdDraft({ ...prodDraft, priceInr: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Sale Price ₹"
                        value={prodDraft.discountPriceInr}
                        onChange={(e) => setProdDraft({ ...prodDraft, discountPriceInr: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="GST %"
                        value={prodDraft.gstPercent}
                        onChange={(e) => setProdDraft({ ...prodDraft, gstPercent: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Stock Qty"
                        value={prodDraft.stockQty}
                        onChange={(e) => setProdDraft({ ...prodDraft, stockQty: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        type="number"
                        min={0}
                        placeholder="Ship Weight (g)"
                        value={prodDraft.shippingWeightGrams}
                        onChange={(e) => setProdDraft({ ...prodDraft, shippingWeightGrams: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>

                    <input
                      placeholder="Short Summary (displayed near price & PDP summary)"
                      value={prodDraft.shortDescription}
                      onChange={(e) => setProdDraft({ ...prodDraft, shortDescription: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />
                    <textarea
                      rows={3}
                      placeholder="Full Product Description"
                      value={prodDraft.description}
                      onChange={(e) => setProdDraft({ ...prodDraft, description: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <textarea
                        rows={4}
                        placeholder="Key Features (one per line)"
                        value={prodDraft.featuresText}
                        onChange={(e) => setProdDraft({ ...prodDraft, featuresText: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <textarea
                        rows={4}
                        placeholder="Technical Specs (Key: Value per line)"
                        value={prodDraft.specsText}
                        onChange={(e) => setProdDraft({ ...prodDraft, specsText: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <textarea
                        rows={4}
                        placeholder="In the Box / Package Contents (one per line)"
                        value={prodDraft.packageContentsText}
                        onChange={(e) => setProdDraft({ ...prodDraft, packageContentsText: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        placeholder="Primary Image URL"
                        value={prodDraft.imageUrl}
                        onChange={(e) => setProdDraft({ ...prodDraft, imageUrl: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        placeholder="Variants (comma-separated)"
                        value={prodDraft.availableVariantsText}
                        onChange={(e) => setProdDraft({ ...prodDraft, availableVariantsText: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <input
                        placeholder="Colors (comma-separated)"
                        value={prodDraft.availableColorsText}
                        onChange={(e) => setProdDraft({ ...prodDraft, availableColorsText: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <input
                        placeholder="PDF Brochure URL"
                        value={prodDraft.brochureUrl}
                        onChange={(e) => setProdDraft({ ...prodDraft, brochureUrl: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        placeholder="Technical Datasheet PDF URL"
                        value={prodDraft.datasheetUrl}
                        onChange={(e) => setProdDraft({ ...prodDraft, datasheetUrl: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        placeholder="3D Asset / Video URL"
                        value={prodDraft.videoUrl}
                        onChange={(e) => setProdDraft({ ...prodDraft, videoUrl: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>

                    <textarea
                      rows={2}
                      placeholder="Gallery Image URLs (one URL per line)"
                      value={prodDraft.galleryUrlsText}
                      onChange={(e) => setProdDraft({ ...prodDraft, galleryUrlsText: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        placeholder="Delivery Info (e.g. Dispatches in 2–4 business days)"
                        value={prodDraft.deliveryInfo}
                        onChange={(e) => setProdDraft({ ...prodDraft, deliveryInfo: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <input
                        placeholder="SEO Title"
                        value={prodDraft.seoTitle}
                        onChange={(e) => setProdDraft({ ...prodDraft, seoTitle: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <input
                        placeholder="SEO Meta Description"
                        value={prodDraft.seoDescription}
                        onChange={(e) => setProdDraft({ ...prodDraft, seoDescription: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div className="flex flex-wrap gap-5 pt-1">
                      <label className="flex items-center gap-1.5 font-semibold">
                        <input
                          type="checkbox"
                          checked={prodDraft.isFeatured}
                          onChange={(e) => setProdDraft({ ...prodDraft, isFeatured: e.target.checked })}
                        />
                        Featured
                      </label>
                      <label className="flex items-center gap-1.5 font-semibold">
                        <input
                          type="checkbox"
                          checked={prodDraft.isBestseller}
                          onChange={(e) => setProdDraft({ ...prodDraft, isBestseller: e.target.checked })}
                        />
                        Bestseller
                      </label>
                      <label className="flex items-center gap-1.5 font-semibold">
                        <input
                          type="checkbox"
                          checked={prodDraft.isNewArrival}
                          onChange={(e) => setProdDraft({ ...prodDraft, isNewArrival: e.target.checked })}
                        />
                        New Arrival
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold"
                    >
                      {prodDraft.id ? 'Save Product Changes' : 'Publish Product'}
                    </button>
                  </form>
                )}

                {/* Product Catalog Table */}
                <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">SKU &amp; Type</th>
                        <th className="p-3">Brand</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded object-cover border border-slate-200 shrink-0" />
                              <div>
                                <div className="font-semibold text-[#0B1B3B]">{p.name}</div>
                                <div className="font-mono text-[10px] text-slate-500">/product/{p.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono">
                            <div>{p.sku}</div>
                            <div className="text-[10px] text-blue-700">{p.productType || 'simple'}</div>
                          </td>
                          <td className="p-3">{p.brand}</td>
                          <td className="p-3 font-mono font-semibold">
                            {p.productType === 'quote_only' || p.priceInr <= 0
                              ? 'Quote Only'
                              : `₹${(p.discountPriceInr ?? p.priceInr).toLocaleString('en-IN')}`}
                          </td>
                          <td className="p-3 font-mono">{p.stockQty}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                                p.isPublished ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {p.status || (p.isPublished ? 'published' : 'draft')}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => openEditProduct(p)}
                              className="px-2 py-1 border border-slate-300 rounded font-semibold hover:bg-slate-100 inline-flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await apiFetch(`/api/admin/products/${p.id}/duplicate`, { method: 'POST' });
                                notify(`Duplicated "${p.name}" as Draft.`, 'info');
                                loadAll();
                              }}
                              className="px-2 py-1 border border-slate-300 rounded font-semibold hover:bg-slate-100"
                            >
                              Duplicate
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await apiFetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
                                notify(`Archived "${p.name}".`, 'info');
                                loadAll();
                                refreshBootstrap();
                              }}
                              className="px-2 py-1 border border-red-200 text-red-700 rounded hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bulk CSV Import */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="font-display font-bold text-sm text-[#0B1B3B] flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-700" /> Bulk Product CSV Import (Upsert by SKU)
                  </div>
                  <textarea
                    rows={3}
                    placeholder="sku,name,brand,productType,storeScope,priceInr,stockQty,description&#10;NTF-IMU-01,Industrial 9-DOF IMU,NexusTekFusion,simple,general,1490,25,Calibrated IMU module"
                    value={csvImportText}
                    onChange={(e) => setCsvImportText(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-[11px]"
                  />
                  <button
                    type="button"
                    disabled={importingCsv || !csvImportText.trim()}
                    onClick={handleCsvImport}
                    className="px-4 py-2 bg-[#0B1B3B] text-white rounded-lg font-semibold disabled:opacity-50"
                  >
                    {importingCsv ? 'Importing CSV...' : 'Import Products CSV'}
                  </button>
                </div>
              </div>
            )}

            {/* ==================== CATEGORIES & BRANDS ==================== */}
            {tab === 'categories_brands' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Product Categories</h2>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (catForm.id) {
                        await apiFetch(`/api/admin/categories/${catForm.id}`, {
                          method: 'PUT',
                          body: JSON.stringify({ ...catForm, sortOrder: Number(catForm.sortOrder || 0) }),
                        });
                        notify('Category updated.', 'success');
                      } else {
                        await apiFetch('/api/admin/categories', {
                          method: 'POST',
                          body: JSON.stringify({ ...catForm, sortOrder: Number(catForm.sortOrder || 0) }),
                        });
                        notify('Category created.', 'success');
                      }
                      setCatForm({ name: '', slug: '', storeScope: 'general', description: '', sortOrder: '0' });
                      loadAll();
                      refreshBootstrap();
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        placeholder="Category Name *"
                        value={catForm.name}
                        onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5"
                      />
                      <input
                        placeholder="Slug (auto if blank)"
                        value={catForm.slug}
                        onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                      />
                      <select
                        value={catForm.storeScope}
                        onChange={(e) => setCatForm({ ...catForm, storeScope: e.target.value as any })}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5"
                      >
                        <option value="general">General Store</option>
                        <option value="3d_printed">3D Printed Store</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Sort Order"
                        value={catForm.sortOrder}
                        onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                      />
                    </div>
                    <input
                      placeholder="Short Description"
                      value={catForm.description}
                      onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-1.5 bg-blue-700 text-white rounded font-semibold">
                        {catForm.id ? 'Update Category' : 'Add Category'}
                      </button>
                      {catForm.id && (
                        <button
                          type="button"
                          onClick={() => setCatForm({ name: '', slug: '', storeScope: 'general', description: '', sortOrder: '0' })}
                          className="px-3 py-1.5 border border-slate-300 rounded font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>

                  <div className="divide-y divide-slate-100">
                    {categories.map((c) => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">{c.name}</div>
                          <div className="font-mono text-[10px] text-slate-500">/{c.slug} · {c.storeScope}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setCatForm({
                                id: c.id,
                                name: c.name,
                                slug: c.slug,
                                storeScope: c.storeScope,
                                description: c.description || '',
                                sortOrder: String(c.sortOrder || 0),
                              })
                            }
                            className="px-2 py-1 border border-slate-300 rounded"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/admin/categories/${c.id}`, { method: 'DELETE' });
                              loadAll();
                              refreshBootstrap();
                            }}
                            className="px-2 py-1 text-red-600 border border-red-200 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brands CRUD */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Engineering &amp; Product Brands</h2>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (brandForm.id) {
                        await apiFetch(`/api/admin/brands/${brandForm.id}`, {
                          method: 'PUT',
                          body: JSON.stringify(brandForm),
                        });
                        notify('Brand updated.', 'success');
                      } else {
                        await apiFetch('/api/admin/brands', {
                          method: 'POST',
                          body: JSON.stringify(brandForm),
                        });
                        notify('Brand added.', 'success');
                      }
                      setBrandForm({ name: '', slug: '', logoUrl: '', description: '' });
                      loadAll();
                      refreshBootstrap();
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        required
                        placeholder="Brand Name *"
                        value={brandForm.name}
                        onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5"
                      />
                      <input
                        placeholder="Slug (auto)"
                        value={brandForm.slug}
                        onChange={(e) => setBrandForm({ ...brandForm, slug: e.target.value })}
                        className="rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                      />
                    </div>
                    <input
                      placeholder="Logo Image URL"
                      value={brandForm.logoUrl}
                      onChange={(e) => setBrandForm({ ...brandForm, logoUrl: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                    />
                    <input
                      placeholder="Description"
                      value={brandForm.description}
                      onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-2.5 py-1.5"
                    />
                    <button type="submit" className="px-4 py-1.5 bg-blue-700 text-white rounded font-semibold">
                      {brandForm.id ? 'Update Brand' : 'Add Brand'}
                    </button>
                  </form>

                  <div className="divide-y divide-slate-100">
                    {brands.map((b) => (
                      <div key={b.id} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">{b.name}</div>
                          <div className="text-[11px] text-slate-500">{b.description}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setBrandForm({
                                id: b.id,
                                name: b.name,
                                slug: b.slug,
                                logoUrl: b.logoUrl || '',
                                description: b.description || '',
                              })
                            }
                            className="px-2 py-1 border border-slate-300 rounded"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/admin/brands/${b.id}`, { method: 'DELETE' });
                              loadAll();
                              refreshBootstrap();
                            }}
                            className="px-2 py-1 text-red-600 border border-red-200 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== INVENTORY & STOCK MOVEMENTS ==================== */}
            {tab === 'inventory' && (
              <div className="space-y-6 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                    Inventory Stock Control ({products.length} SKUs)
                  </h2>
                  <div className="divide-y divide-slate-100">
                    {products.map((p) => (
                      <div key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{p.name}</div>
                          <div className="font-mono text-slate-500">
                            {p.sku} · Stock: <strong>{p.stockQty}</strong> · Threshold: {p.lowStockThreshold ?? 5}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="number"
                            placeholder="+/- Qty"
                            value={stockAdjustMap[p.id]?.delta || ''}
                            onChange={(e) =>
                              setStockAdjustMap({
                                ...stockAdjustMap,
                                [p.id]: { delta: e.target.value, reason: stockAdjustMap[p.id]?.reason || '' },
                              })
                            }
                            className="w-24 rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                          />
                          <input
                            placeholder="Audit Reason"
                            value={stockAdjustMap[p.id]?.reason || ''}
                            onChange={(e) =>
                              setStockAdjustMap({
                                ...stockAdjustMap,
                                [p.id]: { delta: stockAdjustMap[p.id]?.delta || '', reason: e.target.value },
                              })
                            }
                            className="w-44 rounded border border-slate-300 px-2.5 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(p.id)}
                            className="px-3 py-1.5 bg-[#0B1B3B] text-white rounded font-semibold"
                          >
                            Adjust Stock
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {overview.inventoryMovements?.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                    <h3 className="font-display text-base font-bold text-[#0B1B3B]">Recent Stock Movement Audit</h3>
                    <div className="divide-y divide-slate-100 font-mono text-[11px]">
                      {overview.inventoryMovements.slice(0, 20).map((mv: any) => (
                        <div key={mv.id} className="py-2 flex flex-wrap justify-between gap-2">
                          <span>
                            Product #{mv.productId}: {mv.previousQty} → {mv.newQty} ({mv.deltaQty >= 0 ? `+${mv.deltaQty}` : mv.deltaQty}) · {mv.reason}
                          </span>
                          <span className="text-slate-400">
                            {mv.actorEmail} · {new Date(mv.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== STORE ORDERS & PDF PACKING SLIPS ==================== */}
            {tab === 'store_orders' && (
              <div className="space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[220px] max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      placeholder="Filter orders by number, customer, or status..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadAuthorizedCsv('/api/admin/export/orders', 'nexustekfusion-orders.csv')}
                    className="px-3.5 py-2 border border-slate-300 bg-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Orders CSV
                  </button>
                </div>

                {filteredOrders.map((o: any) => {
                  const d = orderDraftMap[o.id] || {
                    orderStatus: o.orderStatus,
                    trackingCourier: o.trackingCourier || '',
                    trackingId: o.trackingId || '',
                    trackingUrl: o.trackingUrl || '',
                    internalNotes: o.internalNotes || '',
                  };
                  return (
                    <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div>
                          <div className="font-mono font-bold text-sm text-[#0B1B3B]">{o.orderNumber}</div>
                          <div className="text-slate-600">
                            {o.shippingAddress?.fullName} ({o.shippingAddress?.mobile}) · {o.shippingAddress?.city}, {o.shippingAddress?.state} - {o.shippingAddress?.pinCode}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500">
                            Total: ₹{o.totalInr.toLocaleString('en-IN')} · Payment: {o.paymentStatus} · {new Date(o.createdAt).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => downloadPackingSlipPdf(o)}
                            className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold inline-flex items-center gap-1 hover:bg-slate-50"
                          >
                            <Download className="w-3.5 h-3.5" /> Packing Slip
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              downloadInvoicePdf({
                                invoiceNumber: `INV-${o.orderNumber}`,
                                docType: settings.projectSettings?.enableGstTax && settings.companyInfo?.gstin ? 'Tax Invoice' : 'Proforma / Receipt',
                                entityType: 'store_order',
                                amountInr: o.totalInr,
                                gstInr: o.gstInr || 0,
                                issuedAt: o.createdAt,
                                customerEmail: o.shippingAddress?.fullName || '',
                                gstin:
                                  settings.projectSettings?.enableGstTax && settings.companyInfo?.gstin
                                    ? settings.companyInfo.gstin
                                    : undefined,
                                payload: { orderNumber: o.orderNumber, items: o.items },
                              })
                            }
                            className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold inline-flex items-center gap-1 hover:bg-slate-50"
                          >
                            <Download className="w-3.5 h-3.5" /> Invoice PDF
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                        <select
                          value={d.orderStatus}
                          onChange={(e) => setOrderDraftMap({ ...orderDraftMap, [o.id]: { ...d, orderStatus: e.target.value } })}
                          className="rounded-lg border border-slate-300 px-2.5 py-2 bg-white font-semibold"
                        >
                          {STORE_ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <input
                          placeholder="Courier (e.g. BlueDart)"
                          value={d.trackingCourier}
                          onChange={(e) => setOrderDraftMap({ ...orderDraftMap, [o.id]: { ...d, trackingCourier: e.target.value } })}
                          className="rounded-lg border border-slate-300 px-2.5 py-2"
                        />
                        <input
                          placeholder="Tracking / AWB ID"
                          value={d.trackingId}
                          onChange={(e) => setOrderDraftMap({ ...orderDraftMap, [o.id]: { ...d, trackingId: e.target.value } })}
                          className="rounded-lg border border-slate-300 px-2.5 py-2 font-mono"
                        />
                        <input
                          placeholder="Internal Notes"
                          value={d.internalNotes}
                          onChange={(e) => setOrderDraftMap({ ...orderDraftMap, [o.id]: { ...d, internalNotes: e.target.value } })}
                          className="rounded-lg border border-slate-300 px-2.5 py-2"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderTracking(`/api/admin/store-orders/${o.id}`, d)}
                            className="flex-1 px-3 py-2 bg-blue-700 text-white rounded-lg font-semibold"
                          >
                            Save Order
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/admin/store-orders/${o.id}`, { method: 'DELETE' });
                              loadAll();
                              notify('Order archived.', 'info');
                            }}
                            className="px-2.5 py-2 border border-red-200 text-red-700 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ==================== COUPONS ==================== */}
            {tab === 'coupons' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await apiFetch('/api/admin/coupons', {
                      method: 'POST',
                      body: JSON.stringify({
                        ...couponForm,
                        discountValue: Number(couponForm.discountValue),
                        minOrderInr: Number(couponForm.minOrderInr),
                      }),
                    });
                    setCouponForm({ code: '', discountType: 'percent', discountValue: '10', minOrderInr: '500' });
                    notify('Coupon created.', 'success');
                    loadAll();
                  }}
                  className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-3 h-fit"
                >
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Create Discount Coupon</h2>
                  <input
                    required
                    placeholder="CODE (e.g. NEXUS10)"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={couponForm.discountType}
                      onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2.5 py-2 bg-white"
                    >
                      <option value="percent">Percent %</option>
                      <option value="flat">Flat ₹</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      placeholder="Value"
                      value={couponForm.discountValue}
                      onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2.5 py-2 font-mono"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Min Order ₹"
                      value={couponForm.minOrderInr}
                      onChange={(e) => setCouponForm({ ...couponForm, minOrderInr: e.target.value })}
                      className="rounded-lg border border-slate-300 px-2.5 py-2 font-mono"
                    />
                  </div>
                  <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold">
                    Save Coupon
                  </button>
                </form>

                <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Active &amp; Paused Coupons</h2>
                  {(overview.coupons || []).map((c: any) => (
                    <div key={c.id} className="border-b border-slate-100 py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-sm text-[#0B1B3B]">{c.code}</span>
                        <span className="ml-2 text-slate-600">
                          {c.discountType === 'percent' ? `${c.discountValue}% off` : `₹${c.discountValue} off`} (Min ₹{c.minOrderInr})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateOrderTracking(`/api/admin/coupons/${c.id}`, { isActive: !c.isActive })}
                          className={`px-2.5 py-1 rounded font-semibold ${
                            c.isActive ? 'bg-blue-50 text-blue-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {c.isActive ? 'Active' : 'Paused'}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch(`/api/admin/coupons/${c.id}`, { method: 'DELETE' });
                            loadAll();
                          }}
                          className="p-1 text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== PROJECTS, ENQUIRY ACCEPT/REJECT & QUOTATIONS ==================== */}
            {tab === 'projects' && (
              <div className="space-y-8 text-xs">
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-bold text-[#0B1B3B]">Project Enquiries</h2>
                  {overview.projectEnquiries.map((enq: any) => (
                    <div key={enq.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <span className="font-mono font-bold text-[#0B1B3B]">{enq.enquiryNumber}</span> · {enq.customerName} ({enq.customerEmail})
                          <div className="font-display text-base font-bold text-slate-950 mt-0.5">{enq.projectTitle}</div>
                          <div className="text-[11px] text-slate-500">
                            {enq.engineeringBranch} · {enq.projectCategory}
                            {enq.estimatedBudget ? ` · Budget: ${enq.estimatedBudget}` : ''}
                            {enq.assignedEngineer ? ` · Engineer: ${enq.assignedEngineer}` : ''}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            placeholder="Assign Engineer"
                            value={engineerMap[enq.id] ?? enq.assignedEngineer ?? ''}
                            onChange={(e) => setEngineerMap({ ...engineerMap, [enq.id]: e.target.value })}
                            className="w-36 rounded-lg border border-slate-300 px-2.5 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateOrderTracking(`/api/admin/project-enquiries/${enq.id}`, {
                                status: 'Accepted',
                                assignedEngineer: engineerMap[enq.id] ?? enq.assignedEngineer ?? '',
                              })
                            }
                            className="px-2.5 py-1.5 bg-blue-700 text-white rounded-lg font-semibold"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => setClarifyOpenId(clarifyOpenId === enq.id ? 0 : enq.id)}
                            className="px-2.5 py-1.5 border border-amber-400 text-amber-900 bg-amber-50 rounded-lg font-semibold"
                          >
                            Clarification Needed
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectOpenId(rejectOpenId === enq.id ? 0 : enq.id)}
                            className="px-2.5 py-1.5 border border-red-300 text-red-700 bg-red-50 rounded-lg font-semibold"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setQuoteEnquiryId(enq.id);
                              setQuoteMeta((prev) => ({
                                ...prev,
                                advancePercent: settings.projectSettings?.defaultAdvancePercent ?? 50,
                                validityDays: settings.projectSettings?.quotationValidityDays ?? 15,
                              }));
                            }}
                            className="px-3 py-1.5 bg-[#0B1B3B] text-white rounded-lg font-semibold whitespace-nowrap"
                          >
                            Build Quotation
                          </button>
                        </div>
                      </div>

                      <p className="text-slate-600">{enq.projectDescription}</p>
                      <div className="text-[11px] font-mono text-blue-700 font-semibold">Current Status: {enq.status}</div>

                      {enq.rejectionReason && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900">
                          <strong>Rejection Reason:</strong> {enq.rejectionReason}
                        </div>
                      )}
                      {enq.clarificationNotes && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">
                          <strong>Clarification Requested:</strong> {enq.clarificationNotes}
                        </div>
                      )}

                      {clarifyOpenId === enq.id && (
                        <div className="flex flex-wrap gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                          <input
                            placeholder="Specify what technical details or documents are needed..."
                            value={clarifyNotesMap[enq.id] || ''}
                            onChange={(e) => setClarifyNotesMap({ ...clarifyNotesMap, [enq.id]: e.target.value })}
                            className="flex-1 min-w-[240px] rounded border border-slate-300 bg-white px-3 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateOrderTracking(`/api/admin/project-enquiries/${enq.id}`, {
                                status: 'Clarification Needed',
                                clarificationNotes: clarifyNotesMap[enq.id] || 'Please provide circuit / component details.',
                              });
                              setClarifyOpenId(0);
                            }}
                            className="px-3 py-1.5 bg-amber-700 text-white rounded font-semibold"
                          >
                            Send Clarification Request
                          </button>
                        </div>
                      )}

                      {rejectOpenId === enq.id && (
                        <div className="flex flex-wrap gap-2 bg-red-50 p-3 rounded-lg border border-red-200">
                          <input
                            required
                            placeholder="Mandatory rejection reason (visible to customer)..."
                            value={rejectReasonMap[enq.id] || ''}
                            onChange={(e) => setRejectReasonMap({ ...rejectReasonMap, [enq.id]: e.target.value })}
                            className="flex-1 min-w-[240px] rounded border border-red-300 bg-white px-3 py-1.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const reason = (rejectReasonMap[enq.id] || '').trim();
                              if (!reason) {
                                notify('Rejection reason is mandatory.', 'error');
                                return;
                              }
                              handleUpdateOrderTracking(`/api/admin/project-enquiries/${enq.id}`, {
                                status: 'Rejected',
                                rejectionReason: reason,
                              });
                              setRejectOpenId(0);
                            }}
                            className="px-3 py-1.5 bg-red-700 text-white rounded font-semibold"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      )}

                      {enq.attachments?.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {enq.attachments.map((att: any, idx: number) => (
                            <a
                              key={idx}
                              href={`/api/files/download?path=${encodeURIComponent(att.storagePath)}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 border border-slate-300 rounded text-blue-700 hover:bg-slate-50"
                            >
                              <Download className="w-3 h-3" /> {att.originalName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 14-Category Quotation Builder */}
                {quoteEnquiryId > 0 && (() => {
                  const targetEnq = overview.projectEnquiries.find((e: any) => e.id === quoteEnquiryId);
                  return (
                    <form onSubmit={handleSendQuotation} className="rounded-xl border border-blue-300 bg-blue-50/40 p-6 space-y-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200 pb-3">
                        <h3 className="font-display font-bold text-lg text-[#0B1B3B]">
                          14-Category Quotation Builder — {targetEnq?.enquiryNumber} ({targetEnq?.projectTitle})
                        </h3>
                        <button type="button" onClick={() => setQuoteEnquiryId(0)} className="font-semibold text-slate-600">
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {COST_CATEGORY_FIELDS.map(([field, label]) => (
                          <div key={field}>
                            <label className="block font-medium text-slate-600 mb-1">{label}</label>
                            <input
                              type="number"
                              min={0}
                              value={costCategories[field] ?? 0}
                              onChange={(e) => setCostCategories({ ...costCategories, [field]: Number(e.target.value) })}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 border-t border-blue-200 pt-4">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">Additional Custom BOM / Line Items</span>
                          <button
                            type="button"
                            onClick={() => setQuoteItems([...quoteItems, { name: '', description: '', qty: 1, unitPriceInr: 0 }])}
                            className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-semibold inline-flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add Line Item
                          </button>
                        </div>
                        {quoteItems.map((it, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200">
                            <input
                              placeholder="Item Name"
                              value={it.name}
                              onChange={(e) => {
                                const next = [...quoteItems];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setQuoteItems(next);
                              }}
                              className="sm:col-span-4 rounded border border-slate-300 px-2.5 py-1.5"
                            />
                            <input
                              placeholder="Notes / Spec"
                              value={it.description}
                              onChange={(e) => {
                                const next = [...quoteItems];
                                next[idx] = { ...next[idx], description: e.target.value };
                                setQuoteItems(next);
                              }}
                              className="sm:col-span-4 rounded border border-slate-300 px-2.5 py-1.5"
                            />
                            <input
                              type="number"
                              min={1}
                              value={it.qty}
                              onChange={(e) => {
                                const next = [...quoteItems];
                                next[idx] = { ...next[idx], qty: Math.max(1, Number(e.target.value)) };
                                setQuoteItems(next);
                              }}
                              className="sm:col-span-1 rounded border border-slate-300 px-2 py-1.5 font-mono"
                            />
                            <input
                              type="number"
                              min={0}
                              value={it.unitPriceInr}
                              onChange={(e) => {
                                const next = [...quoteItems];
                                next[idx] = { ...next[idx], unitPriceInr: Number(e.target.value) };
                                setQuoteItems(next);
                              }}
                              className="sm:col-span-2 rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))}
                              className="sm:col-span-1 text-red-600 p-1 flex justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-blue-200 pt-4">
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">GST (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={quoteMeta.gstInr}
                            onChange={(e) => setQuoteMeta({ ...quoteMeta, gstInr: Number(e.target.value) })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">Discount (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={quoteMeta.discountInr}
                            onChange={(e) => setQuoteMeta({ ...quoteMeta, discountInr: Number(e.target.value) })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">Advance %</label>
                          <input
                            type="number"
                            min={10}
                            max={100}
                            value={quoteMeta.advancePercent}
                            onChange={(e) => setQuoteMeta({ ...quoteMeta, advancePercent: Number(e.target.value) })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">Validity (Days)</label>
                          <input
                            type="number"
                            min={1}
                            value={quoteMeta.validityDays}
                            onChange={(e) => setQuoteMeta({ ...quoteMeta, validityDays: Number(e.target.value) })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-600 mb-1">Est. Duration</label>
                          <input
                            value={quoteMeta.estimatedDuration}
                            onChange={(e) => setQuoteMeta({ ...quoteMeta, estimatedDuration: e.target.value })}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-blue-200">
                        <div className="font-mono font-bold text-[#0B1B3B] text-sm tabular-nums">
                          Total: ₹{computedQuoteTotal.toLocaleString('en-IN')} · Advance ({quoteMeta.advancePercent}%): ₹{computedAdvanceInr.toLocaleString('en-IN')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {targetEnq && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadQuotationPdf({
                                  enquiryNumber: targetEnq.enquiryNumber,
                                  projectTitle: targetEnq.projectTitle,
                                  customerName: targetEnq.customerName,
                                  customerEmail: targetEnq.customerEmail,
                                  quotation: {
                                    id: 0,
                                    revisionNumber: 1,
                                    items: quoteItems,
                                    hardwareCostInr: costCategories.hardware,
                                    softwareCostInr: costCategories.software,
                                    designDevChargesInr: costCategories.development,
                                    testingChargesInr: costCategories.testing,
                                    documentationChargesInr: costCategories.documentation,
                                    deliveryChargesInr: costCategories.delivery,
                                    costCategories,
                                    validityDays: quoteMeta.validityDays,
                                    estimatedDuration: quoteMeta.estimatedDuration,
                                    paymentTerms: quoteMeta.paymentTerms,
                                    termsAndConditions: quoteMeta.termsAndConditions,
                                    discountInr: quoteMeta.discountInr,
                                    gstInr: quoteMeta.gstInr,
                                    totalAmountInr: computedQuoteTotal,
                                    advancePercent: quoteMeta.advancePercent,
                                    advanceAmountInr: computedAdvanceInr,
                                    balanceAmountInr: computedQuoteTotal - computedAdvanceInr,
                                    status: 'Draft Preview',
                                    createdAt: new Date().toISOString(),
                                  },
                                  gstin: settings.companyInfo?.gstin,
                                })
                              }
                              className="px-4 py-2 border border-slate-300 bg-white rounded-lg font-semibold inline-flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" /> Preview PDF
                            </button>
                          )}
                          <button type="submit" className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold">
                            Generate &amp; Send Quotation
                          </button>
                        </div>
                      </div>
                    </form>
                  );
                })()}

                <div className="space-y-4">
                  <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
                    Active Projects, Final Balance &amp; Deliverable Handover
                  </h2>
                  {overview.projects.map((p: any) => {
                    const enq = (overview.projectEnquiries || []).find((e: any) => e.id === p.enquiryId);
                    const quot = (overview.quotations || []).find((q: any) => q.id === p.quotationId);
                    const milestones = (overview.projectPaymentMilestones || []).filter(
                      (m: any) => m.projectId === p.id || (p.quotationId && m.quotationId === p.quotationId)
                    );
                    const receipts = (overview.receipts || []).filter(
                      (r: any) => r.entityType === 'project_quotation' && r.entityId === p.quotationId
                    );
                    const clearanceCert = (overview.clearanceCertificates || []).find(
                      (c: any) => c.projectId === p.id
                    );
                    const workOrder = (overview.workOrders || []).find((w: any) => w.projectId === p.id);
                    const handoverDocs = (overview.handoverDocuments || []).filter((d: any) => d.projectId === p.id);
                    const deliveryRecords = (overview.deliveryRecords || []).filter((d: any) => d.projectId === p.id);

                    return (
                      <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                        <div className="flex flex-wrap justify-between items-center gap-3">
                          <div>
                            <span className="font-mono font-bold text-[#0B1B3B]">{p.projectCode}</span> — {p.title}
                            <div className="text-[11px] text-slate-500">
                              Client: {enq?.customerName || '—'} ({enq?.customerEmail || ''}) · Engineer:{' '}
                              {p.assignedEngineer || 'Unassigned'}
                            </div>
                          </div>
                          <select
                            value={p.status}
                            onChange={(e) =>
                              handleUpdateOrderTracking(`/api/admin/projects/${p.id}`, { status: e.target.value })
                            }
                            className="rounded-lg border border-slate-300 px-3 py-1.5 bg-white font-semibold"
                          >
                            {[
                              'Project Started',
                              'In Progress',
                              'Testing',
                              'Project Completed – Awaiting Final Payment',
                              'Payment Cleared – Ready for Handover',
                              'Ready for Delivery',
                              'Dispatched',
                              'Delivered',
                              'Completed',
                            ].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <ProjectHandoverControlsPanel
                          project={p}
                          customerEmail={enq?.customerEmail || ''}
                          quotation={quot}
                          milestones={milestones}
                          receipts={receipts}
                          clearanceCert={clearanceCert}
                          workOrder={workOrder}
                          handoverDocs={handoverDocs}
                          deliveryRecords={deliveryRecords}
                          isSuperAdmin={dbUser?.role === 'super_admin'}
                          onRefresh={loadAll}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ==================== 3D PRINTING LAB ==================== */}
            {tab === 'printing' && (
              <div className="space-y-6 text-xs">
                <div className="space-y-3">
                  <h2 className="font-display text-xl font-bold text-[#0B1B3B]">3D Printing Orders</h2>
                  {overview.printingOrders.map((po: any) => {
                    const pe = printOrderEdit[po.id] || {
                      orderStatus: po.orderStatus,
                      slicingStatus: po.slicingStatus,
                      totalInr: String(po.totalInr),
                      productionNotes: po.productionNotes || '',
                    };
                    return (
                      <div key={po.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                        <div className="flex flex-wrap justify-between gap-2">
                          <div>
                            <span className="font-mono font-bold text-[#0B1B3B]">{po.orderNumber}</span> · {po.fileName} ({po.materialName}, {po.colorName}, Qty {po.quantity})
                            <div className="text-slate-500">Payment: {po.paymentStatus} · Quote: ₹{po.totalInr}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={pe.slicingStatus}
                              onChange={(e) => setPrintOrderEdit({ ...printOrderEdit, [po.id]: { ...pe, slicingStatus: e.target.value } })}
                              className="rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white"
                            >
                              {['Auto Sliced', 'Technical Review Required', 'Slicing Completed'].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <select
                              value={pe.orderStatus}
                              onChange={(e) => setPrintOrderEdit({ ...printOrderEdit, [po.id]: { ...pe, orderStatus: e.target.value } })}
                              className="rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white font-semibold"
                            >
                              {[
                                'Order Placed',
                                'Payment Confirmed',
                                'Technical Review',
                                'Slicing Completed',
                                'Printing Scheduled',
                                'Printing in Progress',
                                'Quality Inspection',
                                'Packaging',
                                'Shipped',
                                'Delivered',
                              ].map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={pe.totalInr}
                              onChange={(e) => setPrintOrderEdit({ ...printOrderEdit, [po.id]: { ...pe, totalInr: e.target.value } })}
                              className="w-24 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOrderTracking(`/api/admin/printing-orders/${po.id}`, {
                                  orderStatus: pe.orderStatus,
                                  slicingStatus: pe.slicingStatus,
                                  totalInr: Number(pe.totalInr),
                                  productionNotes: pe.productionNotes,
                                })
                              }
                              className="px-3 py-1.5 bg-blue-700 text-white rounded-lg font-semibold"
                            >
                              Update
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await apiFetch('/api/admin/printing-materials', {
                        method: 'POST',
                        body: JSON.stringify(newMat),
                      });
                      notify('3D Material added.', 'success');
                      setNewMat({ name: '', technology: 'FDM', densityGcm3: '1.24', ratePerGramInr: '8', description: '' });
                      loadAll();
                      refreshBootstrap();
                    }}
                    className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                  >
                    <h3 className="font-display font-bold text-base text-[#0B1B3B]">Add 3D Printing Material</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        required
                        placeholder="Material Name"
                        value={newMat.name}
                        onChange={(e) => setNewMat({ ...newMat, name: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <select
                        value={newMat.technology}
                        onChange={(e) => setNewMat({ ...newMat, technology: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 bg-white"
                      >
                        <option value="FDM">FDM</option>
                        <option value="SLA">SLA</option>
                      </select>
                      <input
                        required
                        placeholder="Density g/cm³"
                        value={newMat.densityGcm3}
                        onChange={(e) => setNewMat({ ...newMat, densityGcm3: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        required
                        placeholder="Rate ₹/g"
                        value={newMat.ratePerGramInr}
                        onChange={(e) => setNewMat({ ...newMat, ratePerGramInr: e.target.value })}
                        className="rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                    </div>
                    <button type="submit" className="px-4 py-2 bg-[#0B1B3B] text-white rounded-lg font-semibold">
                      Add Material
                    </button>
                  </form>

                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <h3 className="font-display font-bold text-base text-[#0B1B3B]">Configured 3D Printers</h3>
                    {printConfig.machines.map((m) => (
                      <div key={m.id} className="border-b border-slate-100 pb-2">
                        <div className="font-semibold text-slate-900">{m.name} ({m.technology})</div>
                        <div className="text-slate-500 font-mono">
                          Build: {m.buildVolumeX}×{m.buildVolumeY}×{m.buildVolumeZ} mm · ₹{m.hourlyRateInr}/hr · Min ₹{m.minOrderInr}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== PCB & B2B ==================== */}
            {tab === 'pcb_b2b' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">PCB Enquiries</h2>
                  {overview.pcbEnquiries.map((pcb: any) => (
                    <div key={pcb.id} className="border-b border-slate-100 pb-3 space-y-2">
                      <div className="font-mono font-bold">{pcb.enquiryNumber} · {pcb.customerName}</div>
                      <div>{pcb.boardDimensionsMm} · {pcb.layerCount}L · Qty {pcb.boardQuantity} · {pcb.status}</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          placeholder="Quote INR"
                          value={pcbQuoteMap[pcb.id] ?? (pcb.quotedAmountInr ? String(pcb.quotedAmountInr) : '')}
                          onChange={(e) => setPcbQuoteMap({ ...pcbQuoteMap, [pcb.id]: e.target.value })}
                          className="w-32 rounded border border-slate-300 px-2.5 py-1 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = Number(pcbQuoteMap[pcb.id] ?? pcb.quotedAmountInr ?? 0);
                            if (!val) return notify('Enter a valid INR quote amount.', 'error');
                            handleUpdateOrderTracking(`/api/admin/pcb-enquiries/${pcb.id}`, {
                              quotedAmountInr: val,
                              status: 'Quotation Sent',
                            });
                          }}
                          className="px-3 py-1 bg-blue-700 text-white rounded font-semibold"
                        >
                          Send PCB Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">B2B Bulk Enquiries</h2>
                  {overview.b2bEnquiries.map((b2b: any) => (
                    <div key={b2b.id} className="border-b border-slate-100 pb-3 space-y-2">
                      <div className="font-mono font-bold">{b2b.enquiryNumber} · {b2b.companyName}</div>
                      <div>{b2b.requirementCategory} · Qty {b2b.quantity} · {b2b.status}</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          placeholder="Bulk Quote INR"
                          value={b2bQuoteMap[b2b.id] ?? (b2b.quotedAmountInr ? String(b2b.quotedAmountInr) : '')}
                          onChange={(e) => setB2bQuoteMap({ ...b2bQuoteMap, [b2b.id]: e.target.value })}
                          className="w-32 rounded border border-slate-300 px-2.5 py-1 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = Number(b2bQuoteMap[b2b.id] ?? b2b.quotedAmountInr ?? 0);
                            if (!val) return notify('Enter a valid INR bulk quote amount.', 'error');
                            handleUpdateOrderTracking(`/api/admin/b2b-enquiries/${b2b.id}`, {
                              quotedAmountInr: val,
                              status: 'Quotation Sent',
                            });
                          }}
                          className="px-3 py-1 bg-blue-700 text-white rounded font-semibold"
                        >
                          Send Bulk Quote
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== CRM LEADS PIPELINE & NOTES ==================== */}
            {tab === 'crm' && (
              <div className="space-y-6 text-xs">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await apiFetch('/api/admin/crm/leads', {
                      method: 'POST',
                      body: JSON.stringify({
                        ...leadForm,
                        estimatedValueInr: Number(leadForm.estimatedValueInr || 0),
                      }),
                    });
                    setLeadForm({
                      name: '',
                      email: '',
                      phone: '',
                      companyOrCollege: '',
                      source: 'manual',
                      stage: 'New Lead',
                      estimatedValueInr: '0',
                      nextFollowUpDate: '',
                      summary: '',
                    });
                    notify('CRM lead created.', 'success');
                    loadAll();
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <h2 className="font-display text-base font-bold text-[#0B1B3B]">Add New CRM Lead</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <input
                      required
                      placeholder="Lead / Client Name *"
                      value={leadForm.name}
                      onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="rounded border border-slate-300 px-2.5 py-2"
                    />
                    <input
                      placeholder="Email"
                      value={leadForm.email}
                      onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                      className="rounded border border-slate-300 px-2.5 py-2"
                    />
                    <input
                      placeholder="Phone"
                      value={leadForm.phone}
                      onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="rounded border border-slate-300 px-2.5 py-2"
                    />
                    <input
                      placeholder="Company / College"
                      value={leadForm.companyOrCollege}
                      onChange={(e) => setLeadForm({ ...leadForm, companyOrCollege: e.target.value })}
                      className="rounded border border-slate-300 px-2.5 py-2"
                    />
                    <select
                      value={leadForm.stage}
                      onChange={(e) => setLeadForm({ ...leadForm, stage: e.target.value })}
                      className="rounded border border-slate-300 px-2.5 py-2 bg-white"
                    >
                      {CRM_STAGES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Est. Value ₹"
                      value={leadForm.estimatedValueInr}
                      onChange={(e) => setLeadForm({ ...leadForm, estimatedValueInr: e.target.value })}
                      className="rounded border border-slate-300 px-2.5 py-2 font-mono"
                    />
                    <input
                      type="date"
                      value={leadForm.nextFollowUpDate}
                      onChange={(e) => setLeadForm({ ...leadForm, nextFollowUpDate: e.target.value })}
                      className="rounded border border-slate-300 px-2.5 py-2"
                    />
                    <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded font-semibold">
                      Add Lead
                    </button>
                  </div>
                  <input
                    placeholder="Requirement Summary"
                    value={leadForm.summary}
                    onChange={(e) => setLeadForm({ ...leadForm, summary: e.target.value })}
                    className="w-full rounded border border-slate-300 px-2.5 py-2"
                  />
                </form>

                <div className="flex flex-wrap gap-1.5">
                  {['All', ...CRM_STAGES].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setCrmStageFilter(st)}
                      className={`px-3 py-1.5 rounded-lg font-semibold ${
                        crmStageFilter === st ? 'bg-[#0B1B3B] text-white' : 'bg-white border border-slate-200 text-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {(overview.crmLeads || [])
                    .filter((l: any) => crmStageFilter === 'All' || l.stage === crmStageFilter)
                    .map((lead: any) => {
                      const notesForLead = (overview.crmNotes || []).filter(
                        (n: any) => n.entityType === 'crm_lead' && n.entityId === lead.id
                      );
                      return (
                        <div key={lead.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="font-display font-bold text-sm text-[#0B1B3B]">{lead.name}</div>
                              <div className="text-slate-500 font-mono">
                                {lead.email || '—'} · {lead.phone || '—'} · Source: {lead.source} · Est: ₹{(lead.estimatedValueInr || 0).toLocaleString('en-IN')}
                              </div>
                              {lead.summary && <p className="text-slate-700 mt-1">{lead.summary}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={lead.stage}
                                onChange={(e) =>
                                  handleUpdateOrderTracking(`/api/admin/crm/leads/${lead.id}`, { stage: e.target.value })
                                }
                                className="rounded border border-slate-300 px-2.5 py-1.5 bg-white font-semibold"
                              >
                                {CRM_STAGES.map((st) => (
                                  <option key={st} value={st}>{st}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiFetch(`/api/admin/crm/leads/${lead.id}`, { method: 'DELETE' });
                                  loadAll();
                                }}
                                className="p-1.5 text-red-600 border border-red-200 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {notesForLead.length > 0 && (
                            <div className="space-y-1 bg-slate-50 p-3 rounded-lg">
                              {notesForLead.map((n: any) => (
                                <div key={n.id} className="text-[11px] text-slate-700">
                                  <span className="font-mono text-slate-400">
                                    [{new Date(n.createdAt).toLocaleDateString('en-IN')} {n.authorEmail}]:
                                  </span>{' '}
                                  {n.note}
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <input
                              placeholder="Add CRM follow-up note..."
                              value={leadNoteMap[lead.id] || ''}
                              onChange={(e) => setLeadNoteMap({ ...leadNoteMap, [lead.id]: e.target.value })}
                              className="flex-1 rounded border border-slate-300 px-3 py-1.5"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                const text = (leadNoteMap[lead.id] || '').trim();
                                if (!text) return;
                                await apiFetch('/api/admin/crm/notes', {
                                  method: 'POST',
                                  body: JSON.stringify({ entityType: 'crm_lead', entityId: lead.id, note: text }),
                                });
                                setLeadNoteMap({ ...leadNoteMap, [lead.id]: '' });
                                notify('Follow-up note added.', 'success');
                                loadAll();
                              }}
                              className="px-3 py-1.5 bg-[#0B1B3B] text-white rounded font-semibold"
                            >
                              Save Note
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ==================== R&D CASE STUDIES ==================== */}
            {tab === 'rd_projects' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (rdForm.id) {
                      await apiFetch(`/api/admin/case-studies/${rdForm.id}`, { method: 'PUT', body: JSON.stringify(rdForm) });
                      notify('R&D Project updated.', 'success');
                    } else {
                      await apiFetch('/api/admin/case-studies', { method: 'POST', body: JSON.stringify(rdForm) });
                      notify('R&D Project published.', 'success');
                    }
                    setRdForm({
                      title: '',
                      slug: '',
                      technologyUsed: '',
                      applications: '',
                      outcomes: '',
                      description: '',
                      imageUrl: '/src/assets/images/service_robotics_automation_1794981063545.jpg',
                      videoUrl: '',
                      isPublished: true,
                    });
                    loadAll();
                    refreshBootstrap();
                  }}
                  className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-3 h-fit"
                >
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                    {rdForm.id ? 'Edit R&D Showcase Project' : 'Publish Engineering R&D / Academic Project'}
                  </h2>
                  <input
                    required
                    placeholder="Project Title *"
                    value={rdForm.title}
                    onChange={(e) => setRdForm({ ...rdForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Technologies Used (e.g. STM32, ROS2, UAV)"
                    value={rdForm.technologyUsed}
                    onChange={(e) => setRdForm({ ...rdForm, technologyUsed: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Applications"
                    value={rdForm.applications}
                    onChange={(e) => setRdForm({ ...rdForm, applications: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Outcomes / Impact"
                    value={rdForm.outcomes}
                    onChange={(e) => setRdForm({ ...rdForm, outcomes: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Image URL"
                    value={rdForm.imageUrl}
                    onChange={(e) => setRdForm({ ...rdForm, imageUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                  <input
                    placeholder="Video URL (optional)"
                    value={rdForm.videoUrl}
                    onChange={(e) => setRdForm({ ...rdForm, videoUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                  <textarea
                    required
                    rows={4}
                    placeholder="Technical Architecture & Overview *"
                    value={rdForm.description}
                    onChange={(e) => setRdForm({ ...rdForm, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold">
                    {rdForm.id ? 'Update Project' : 'Publish Project'}
                  </button>
                </form>

                <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Published Showcase Projects</h2>
                  {(overview.caseStudies || []).map((cs: any) => (
                    <div key={cs.id} className="border-b border-slate-100 py-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#0B1B3B]">{cs.title}</div>
                        <div className="font-mono text-[10px] text-slate-500">/projects/{cs.slug} · {cs.technologyUsed}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setRdForm({
                              id: cs.id,
                              title: cs.title,
                              slug: cs.slug,
                              technologyUsed: cs.technologyUsed,
                              applications: cs.applications,
                              outcomes: cs.outcomes,
                              description: cs.description,
                              imageUrl: cs.imageUrl,
                              videoUrl: cs.videoUrl || '',
                              isPublished: cs.isPublished,
                            })
                          }
                          className="px-2.5 py-1 border border-slate-300 rounded font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch(`/api/admin/case-studies/${cs.id}`, { method: 'DELETE' });
                            loadAll();
                            refreshBootstrap();
                          }}
                          className="px-2.5 py-1 text-red-600 border border-red-200 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== BLOGS ==================== */}
            {tab === 'blogs' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (blogForm.id) {
                      await apiFetch(`/api/admin/blogs/${blogForm.id}`, { method: 'PUT', body: JSON.stringify(blogForm) });
                      notify('Article updated.', 'success');
                    } else {
                      await apiFetch('/api/admin/blogs', { method: 'POST', body: JSON.stringify(blogForm) });
                      notify('Blog article published.', 'success');
                    }
                    setBlogForm({
                      title: '',
                      category: 'Engineering',
                      excerpt: '',
                      content: '',
                      coverImageUrl: '/src/assets/images/hero_nexustek_engineering_1794981062404.jpg',
                      isPublished: true,
                    });
                    loadAll();
                    refreshBootstrap();
                  }}
                  className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-3 h-fit"
                >
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                    {blogForm.id ? 'Edit Technical Article' : 'Publish Engineering Article'}
                  </h2>
                  <input
                    required
                    placeholder="Article Title *"
                    value={blogForm.title}
                    onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Category"
                    value={blogForm.category}
                    onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Cover Image URL"
                    value={blogForm.coverImageUrl}
                    onChange={(e) => setBlogForm({ ...blogForm, coverImageUrl: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                  />
                  <input
                    required
                    placeholder="Short Excerpt *"
                    value={blogForm.excerpt}
                    onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <textarea
                    required
                    rows={5}
                    placeholder="Full Content *"
                    value={blogForm.content}
                    onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold">
                    {blogForm.id ? 'Update Article' : 'Publish Blog'}
                  </button>
                </form>

                <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Articles ({(overview.blogs || []).length})</h2>
                  {(overview.blogs || []).map((b: any) => (
                    <div key={b.id} className="border-b border-slate-100 py-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-[#0B1B3B]">{b.title}</div>
                        <div className="text-[11px] text-slate-500">{b.category} · /blogs/{b.slug}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setBlogForm({
                              id: b.id,
                              title: b.title,
                              category: b.category,
                              excerpt: b.excerpt,
                              content: b.content,
                              coverImageUrl: b.coverImageUrl,
                              isPublished: b.isPublished,
                            })
                          }
                          className="px-2.5 py-1 border border-slate-300 rounded font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch(`/api/admin/blogs/${b.id}`, { method: 'DELETE' });
                            loadAll();
                            refreshBootstrap();
                          }}
                          className="px-2.5 py-1 text-red-600 border border-red-200 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== PAYMENTS, INVOICES & RAZORPAY GATEWAY ==================== */}
            {tab === 'payments_invoices' && (
              <div className="space-y-6 text-xs">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Recent Verified Payments</h2>
                    {(overview.payments || []).length === 0 ? (
                      <p className="text-slate-500">No payments recorded yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {(overview.payments || []).map((p: any) => (
                          <div key={p.id} className="py-2.5 flex justify-between">
                            <div>
                              <div className="font-mono font-bold text-[#0B1B3B]">{p.paymentRef}</div>
                              <div className="text-slate-500">{p.entityType} #{p.entityId} · {p.mode}</div>
                            </div>
                            <div className="text-right font-mono">
                              <div className="font-bold">₹{p.amountInr.toLocaleString('en-IN')}</div>
                              <div className="text-blue-700 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {p.status}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Issued Invoices &amp; Receipts</h2>
                    {(overview.invoices || []).length === 0 ? (
                      <p className="text-slate-500">No invoices issued yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {(overview.invoices || []).map((inv: any) => (
                          <div key={inv.id} className="py-2.5 flex items-center justify-between gap-2">
                            <div>
                              <div className="font-mono font-bold">{inv.invoiceNumber}</div>
                              <div className="text-slate-500">{inv.docType} · ₹{inv.amountInr.toLocaleString('en-IN')}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                downloadInvoicePdf({
                                  invoiceNumber: inv.invoiceNumber,
                                  docType: inv.docType,
                                  entityType: inv.entityType,
                                  amountInr: inv.amountInr,
                                  gstInr: inv.gstInr,
                                  issuedAt: inv.issuedAt,
                                  customerEmail: inv.payload?.customerEmail || '',
                                  gstin:
                                    settings.projectSettings?.enableGstTax && settings.companyInfo?.gstin
                                      ? settings.companyInfo.gstin
                                      : undefined,
                                  payload: inv.payload || {},
                                })
                              }
                              className="px-3 py-1 border border-slate-300 rounded font-semibold inline-flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Super Admin Razorpay Config */}
                <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#0B1B3B]">
                        Razorpay Gateway Configuration (AES-256-GCM Encrypted)
                      </h3>
                      <p className="text-slate-600 mt-0.5">
                        Configure live or test Razorpay credentials securely in PostgreSQL, or leave blank to use Sandbox Mode.
                      </p>
                    </div>
                    {paymentStatus && (
                      <span className="font-mono font-semibold text-blue-700">
                        {paymentStatus.configured ? `Active (${paymentStatus.source})` : 'Sandbox Mode'}
                      </span>
                    )}
                  </div>

                  {dbUser?.role !== 'super_admin' ? (
                    <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
                      Restricted to <strong>super_admin</strong> role only.
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await apiFetch('/api/admin/payment-settings', { method: 'PUT', body: JSON.stringify(rzpForm) });
                        notify('Encrypted Razorpay credentials saved.', 'success');
                        setRzpForm({ keyId: '', keySecret: '', webhookSecret: '' });
                        loadAll();
                        refreshBootstrap();
                      }}
                      className="space-y-3"
                    >
                      {paymentStatus?.keyIdMasked && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-700">
                          Current Key ID: {paymentStatus.keyIdMasked} · Secret: {paymentStatus.hasKeySecret ? 'Configured' : 'Not Set'}
                        </div>
                      )}
                      <input
                        required
                        placeholder="Razorpay Key ID (rzp_live_... or rzp_test_...)"
                        value={rzpForm.keyId}
                        onChange={(e) => setRzpForm({ ...rzpForm, keyId: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        required
                        type="password"
                        placeholder="Razorpay Key Secret"
                        value={rzpForm.keySecret}
                        onChange={(e) => setRzpForm({ ...rzpForm, keySecret: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <input
                        type="password"
                        placeholder="Webhook Secret (optional)"
                        value={rzpForm.webhookSecret}
                        onChange={(e) => setRzpForm({ ...rzpForm, webhookSecret: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold">
                          Save Encrypted Credentials
                        </button>
                        {paymentStatus?.source === 'database' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch('/api/admin/payment-settings', { method: 'PUT', body: JSON.stringify({ clear: true }) });
                              notify('Cleared DB Razorpay credentials.', 'info');
                              loadAll();
                              refreshBootstrap();
                            }}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg font-semibold"
                          >
                            Clear DB Keys
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ==================== SUPPORT DESK & DRONE REPAIRS ==================== */}
            {tab === 'support' && (
              <div className="space-y-6 text-xs">
                {(overview.droneRepairs || []).length > 0 && (
                  <div className="space-y-3">
                    <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                      Drone Repair Service Bookings ({overview.droneRepairs.length})
                    </h2>
                    {overview.droneRepairs.map((dr: any) => (
                      <div key={dr.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                        <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 pb-2">
                          <div>
                            <span className="font-mono font-bold text-[#0B1B3B]">{dr.referenceNumber}</span> ·{' '}
                            {dr.droneBrandModel} ({dr.serviceMode})
                            <div className="text-slate-500">
                              {dr.customerName} · {dr.mobile} · {dr.city}
                            </div>
                          </div>
                          <select
                            value={dr.status}
                            onChange={async (e) => {
                              await apiFetch(`/api/admin/drone-repairs/${dr.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ status: e.target.value }),
                              });
                              notify('Repair status updated.', 'success');
                              loadAll();
                            }}
                            className="rounded border border-slate-300 px-2.5 py-1 bg-white font-semibold"
                          >
                            {[
                              'Booking received',
                              'Engineer assigned',
                              'Diagnostics ongoing',
                              'Quotation sent',
                              'Approved & Repairing',
                              'Testing completed',
                              'Ready for dispatch / pickup',
                              'Completed',
                            ].map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="text-slate-700">{dr.problemDescription}</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            type="number"
                            placeholder="Repair quote ₹"
                            defaultValue={dr.repairQuotationInr || ''}
                            onBlur={async (e) => {
                              if (!e.target.value) return;
                              await apiFetch(`/api/admin/drone-repairs/${dr.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ repairQuotationInr: Number(e.target.value), status: 'Quotation sent' }),
                              });
                              notify('Repair quote saved.', 'success');
                              loadAll();
                            }}
                            className="w-36 rounded border border-slate-300 px-2.5 py-1 font-mono"
                          />
                          <input
                            placeholder="Assigned technician..."
                            defaultValue={dr.assignedEngineer || ''}
                            onBlur={async (e) => {
                              await apiFetch(`/api/admin/drone-repairs/${dr.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ assignedEngineer: e.target.value }),
                              });
                              loadAll();
                            }}
                            className="w-48 rounded border border-slate-300 px-2.5 py-1"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">
                    Customer Support Tickets ({(overview.supportTickets || []).length})
                  </h2>
                  {overview.supportTickets.map((t: any) => (
                    <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                      <div className="flex justify-between font-semibold">
                        <span className="text-[#0B1B3B]">
                          {t.ticketNumber} · {t.subject} ({t.email})
                        </span>
                        <span className="text-blue-700">{t.status}</span>
                      </div>
                      <p className="text-slate-600">{t.message}</p>
                      <div className="flex flex-wrap gap-2">
                        <input
                          placeholder="Write reply to customer..."
                          value={ticketReplyMap[t.id] || ''}
                          onChange={(e) => setTicketReplyMap({ ...ticketReplyMap, [t.id]: e.target.value })}
                          className="flex-1 min-w-[220px] rounded-lg border border-slate-300 px-3 py-1.5"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const reply = (ticketReplyMap[t.id] || '').trim();
                            if (!reply) return notify('Please enter a reply message.', 'error');
                            await apiFetch(`/api/admin/support-tickets/${t.id}/reply`, {
                              method: 'POST',
                              body: JSON.stringify({ message: reply, status: 'Replied' }),
                            });
                            setTicketReplyMap({ ...ticketReplyMap, [t.id]: '' });
                            notify('Reply sent.', 'success');
                            loadAll();
                          }}
                          className="px-4 py-1.5 bg-[#0B1B3B] text-white rounded-lg font-semibold"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ==================== STAFF ROLES, STATUS & PASSWORD ==================== */}
            {tab === 'users' && (
              <div className="space-y-6 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Staff &amp; Customer RBAC Management</h2>
                  <div className="divide-y divide-slate-100">
                    {overview.users.map((u: any) => (
                      <div key={u.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-900">{u.fullName || u.email}</div>
                          <div className="text-slate-500 font-mono">{u.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            disabled={dbUser?.role !== 'super_admin'}
                            value={u.role}
                            onChange={async (e) => {
                              await apiFetch(`/api/admin/users/${u.id}/role`, {
                                method: 'PATCH',
                                body: JSON.stringify({ role: e.target.value }),
                              });
                              notify('Role updated.', 'success');
                              loadAll();
                            }}
                            className="rounded-lg border border-slate-300 px-2.5 py-1.5 bg-white font-mono disabled:opacity-60"
                          >
                            {STAFF_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          {dbUser?.role === 'super_admin' && u.id !== dbUser.id && (
                            <button
                              type="button"
                              onClick={async () => {
                                await apiFetch(`/api/admin/users/${u.id}/status`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ isActive: u.isActive === false }),
                                });
                                notify(`Updated account status.`, 'info');
                                loadAll();
                              }}
                              className={`px-2.5 py-1.5 rounded-lg font-semibold ${
                                u.isActive !== false ? 'bg-blue-50 text-blue-800' : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {u.isActive !== false ? 'Active' : 'Suspended'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Change Own Admin Password */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                      return notify('New passwords do not match.', 'error');
                    }
                    try {
                      await apiFetch('/api/auth/admin-change-password', {
                        method: 'POST',
                        body: JSON.stringify({
                          currentPassword: pwdForm.currentPassword,
                          newPassword: pwdForm.newPassword,
                        }),
                      });
                      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      notify('Administrator password updated.', 'success');
                    } catch (err: any) {
                      notify(err?.message || 'Password update failed.', 'error');
                    }
                  }}
                  className="max-w-lg rounded-xl border border-slate-200 bg-white p-6 space-y-3"
                >
                  <h3 className="font-display text-base font-bold text-[#0B1B3B] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-700" /> Change Admin Account Password
                  </h3>
                  <input
                    required
                    type="password"
                    placeholder="Current Password"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    required
                    type="password"
                    minLength={8}
                    placeholder="New Password (min 8 chars)"
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    required
                    type="password"
                    minLength={8}
                    placeholder="Confirm New Password"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <button type="submit" className="px-4 py-2 bg-[#0B1B3B] text-white rounded-lg font-semibold">
                    Update Password
                  </button>
                </form>
              </div>
            )}

            {/* ==================== COMPANY, TAX & SHIPPING SETTINGS ==================== */}
            {tab === 'settings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await Promise.all([
                      apiFetch('/api/admin/settings/announcementBar', {
                        method: 'PUT',
                        body: JSON.stringify({ value: announcementForm }),
                      }),
                      apiFetch('/api/admin/settings/companyInfo', {
                        method: 'PUT',
                        body: JSON.stringify({ value: { ...(settings.companyInfo || {}), ...companyForm } }),
                      }),
                    ]);
                    notify('Company & announcement settings saved.', 'success');
                    refreshBootstrap();
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-6 space-y-3"
                >
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Company Info, GSTIN &amp; Announcement</h2>
                  <label className="flex items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={announcementForm.enabled}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, enabled: e.target.checked })}
                    />
                    Show Top Announcement Bar
                  </label>
                  <input
                    placeholder="Announcement Text"
                    value={announcementForm.text}
                    onChange={(e) => setAnnouncementForm({ ...announcementForm, text: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="Company Email"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="GSTIN (leave blank until active)"
                    value={companyForm.gstin}
                    onChange={(e) => setCompanyForm({ ...companyForm, gstin: e.target.value.toUpperCase() })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase"
                  />
                  <input
                    placeholder="Contact Phone"
                    value={companyForm.contactPhone}
                    onChange={(e) => setCompanyForm({ ...companyForm, contactPhone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <input
                    placeholder="WhatsApp Number"
                    value={companyForm.whatsappNumber}
                    onChange={(e) => setCompanyForm({ ...companyForm, whatsappNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold">
                    Save Company Settings
                  </button>
                </form>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await Promise.all([
                      apiFetch('/api/admin/settings/shippingConfig', {
                        method: 'PUT',
                        body: JSON.stringify({ value: shippingForm }),
                      }),
                      apiFetch('/api/admin/settings/projectSettings', {
                        method: 'PUT',
                        body: JSON.stringify({ value: projSettingsForm }),
                      }),
                    ]);
                    notify('Shipping & Tax/Quotation settings saved.', 'success');
                    refreshBootstrap();
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-6 space-y-4"
                >
                  <h2 className="font-display text-lg font-bold text-[#0B1B3B]">Shipping Rules &amp; Project GST Config</h2>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Standard Ship ₹</label>
                      <input
                        type="number"
                        value={shippingForm.standardShippingInr}
                        onChange={(e) => setShippingForm({ ...shippingForm, standardShippingInr: Number(e.target.value) })}
                        className="w-full rounded border border-slate-300 px-2.5 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Free Above ₹</label>
                      <input
                        type="number"
                        value={shippingForm.freeShippingAboveInr}
                        onChange={(e) => setShippingForm({ ...shippingForm, freeShippingAboveInr: Number(e.target.value) })}
                        className="w-full rounded border border-slate-300 px-2.5 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Default GST %</label>
                      <input
                        type="number"
                        value={projSettingsForm.defaultGstPercent}
                        onChange={(e) => setProjSettingsForm({ ...projSettingsForm, defaultGstPercent: Number(e.target.value) })}
                        className="w-full rounded border border-slate-300 px-2.5 py-2 font-mono"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={projSettingsForm.enableGstTax}
                      onChange={(e) => setProjSettingsForm({ ...projSettingsForm, enableGstTax: e.target.checked })}
                    />
                    Enable GST Tax Invoices (requires valid GSTIN)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Default Advance %</label>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        value={projSettingsForm.defaultAdvancePercent}
                        onChange={(e) => setProjSettingsForm({ ...projSettingsForm, defaultAdvancePercent: Number(e.target.value) })}
                        className="w-full rounded border border-slate-300 px-2.5 py-2 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Quotation Validity (days)</label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={projSettingsForm.quotationValidityDays}
                        onChange={(e) => setProjSettingsForm({ ...projSettingsForm, quotationValidityDays: Number(e.target.value) })}
                        className="w-full rounded border border-slate-300 px-2.5 py-2 font-mono"
                      />
                    </div>
                  </div>
                  <button type="submit" className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold">
                    Save Shipping &amp; Invoice Config
                  </button>
                </form>
              </div>
            )}

            {/* ==================== AUDIT LOGS ==================== */}
            {tab === 'audit' && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2 text-xs font-mono">
                <h2 className="font-display text-lg font-bold text-[#0B1B3B] font-sans mb-3">
                  <Shield className="w-4 h-4 inline mr-1.5 text-blue-700" />
                  Security Audit Trail
                </h2>
                {overview.recentAudit.map((log: any) => (
                  <div key={log.id} className="border-b border-slate-100 py-2 flex justify-between gap-4">
                    <span>{log.action} · {log.entityType} #{log.entityId} ({log.actorEmail})</span>
                    <span className="text-slate-400">{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            )}
            {/* ==================== PROJECT FINANCE DASHBOARD ==================== */}
            {tab === 'project_finance' && <ProjectFinanceDashboardPanel />}

            {/* ==================== PROJECT PAYMENT SPLIT & EMAIL TEMPLATES ==================== */}
            {tab === 'project_payment_settings' && (
              <ProjectPaymentSettingsPanel
                isSuperAdmin={dbUser?.role === 'super_admin'}
                emailLogs={overview.emailNotifications || []}
              />
            )}

            {/* ==================== KRASHIVANTRI OPERATIONS ADMIN CONSOLES ==================== */}
            {tab === 'krash_farmers' && (
              <KrashivantriAdminWorkspace section="farmers" isSuperAdmin={dbUser?.role === 'super_admin'} />
            )}
            {tab === 'krash_pilots' && (
              <KrashivantriAdminWorkspace section="pilots" isSuperAdmin={dbUser?.role === 'super_admin'} />
            )}
            {tab === 'krash_live_tracking' && (
              <KrashivantriAdminWorkspace section="live_tracking" isSuperAdmin={dbUser?.role === 'super_admin'} />
            )}
            {tab === 'krash_orders_live' && (
              <KrashivantriAdminWorkspace section="orders_live" isSuperAdmin={dbUser?.role === 'super_admin'} />
            )}
            {tab === 'krash_farmer_payments' && (
              <KrashivantriAdminWorkspace section="farmer_payments" isSuperAdmin={dbUser?.role === 'super_admin'} />
            )}
            {tab === 'krash_pilot_payouts' && (
              <KrashivantriAdminWorkspace section="pilot_payouts" isSuperAdmin={dbUser?.role === 'super_admin'} />
            )}
            {tab === 'krash_penalties' && (
              <KrashivantriAdminWorkspace section="penalties" isSuperAdmin={dbUser?.role === 'super_admin'} />
            )}
            {tab === 'krash_finance' && (
              <KrashivantriAdminWorkspace section="finance" isSuperAdmin={dbUser?.role === 'super_admin'} />
            )}
          </div>
        )}
      </main>
    </div>
  );
};
