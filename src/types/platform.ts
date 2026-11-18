export interface AddressData {
  id?: number;
  label?: string;
  addressType?: string;
  fullName: string;
  mobile: string;
  houseFlat: string;
  streetArea: string;
  landmark?: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  country: string;
  isDefault?: boolean;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  storeScope: 'general' | '3d_printed';
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  isActive: boolean;
  createdAt?: string;
}

export interface MediaAsset {
  id: number;
  fileName: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  folder: string;
  uploadedBy: string;
  createdAt: string;
}

export type ProductType =
  | 'simple'
  | 'variable'
  | 'customizable'
  | 'made_to_order'
  | 'quote_only';

export interface Product {
  id: number;
  categoryId: number | null;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  productType?: ProductType | string;
  modelNumber?: string;
  subcategory?: string;
  shortDescription?: string;
  storeScope: 'general' | '3d_printed';
  description: string;
  technicalSpecs: Record<string, string>;
  features?: string[];
  priceInr: number;
  discountPriceInr: number | null;
  gstPercent: number;
  stockQty: number;
  dimensions: string;
  weightGrams: number;
  shippingWeightGrams?: number;
  deliveryInfo?: string;
  material: string;
  availableColors: string[];
  availableVariants: string[];
  productionTimeDays: number;
  warrantyInfo: string;
  imageUrl: string;
  galleryUrls: string[];
  datasheetUrl: string;
  brochureUrl?: string;
  model3dUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: string;
  publishedAt?: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  compatibility?: string;
  packageContents?: string[];
  applications?: string;
  productFaqs?: Array<{ q: string; a: string }>;
  tags?: string[];
  relatedProductIds?: number[];
  boughtTogetherIds?: number[];
  videoUrl?: string;
  lowStockThreshold?: number;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  sortOrder?: number;
  isDeleted?: boolean;
}

export interface PrintingMaterial {
  id: number;
  name: string;
  technology: 'FDM' | 'SLA' | string;
  densityGcm3: number;
  ratePerGramInr: number;
  availableColors: Array<{ name: string; hex: string }>;
  layerHeightsMm: number[];
  description: string;
  isActive: boolean;
}

export interface PrintingMachine {
  id: number;
  name: string;
  technology: string;
  buildVolumeX: number;
  buildVolumeY: number;
  buildVolumeZ: number;
  hourlyRateInr: number;
  minOrderInr: number;
  wastagePercent: number;
  labourFeeInr: number;
  finishingFeeInr: number;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
  variant?: string;
  color?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  excerpt: string;
  content: string;
  coverImageUrl: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  publishedAt: string;
}

export interface CaseStudy {
  id: number;
  title: string;
  slug: string;
  technologyUsed: string;
  applications: string;
  outcomes: string;
  relatedServices: string[];
  description: string;
  imageUrl: string;
  videoUrl?: string;
  isPublished: boolean;
}

export interface DbUser {
  id: number;
  uid: string;
  email: string;
  fullName: string;
  mobile: string;
  companyOrCollege: string;
  role: string;
  isActive?: boolean;
}

export interface CrmLead {
  id: number;
  name: string;
  email: string;
  phone: string;
  companyOrCollege: string;
  source: string;
  stage: string;
  assignedTo: string;
  estimatedValueInr: number;
  nextFollowUpDate: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmNote {
  id: number;
  entityType: string;
  entityId: number;
  authorEmail: string;
  note: string;
  createdAt: string;
}

export type HomepageSectionType =
  | 'hero'
  | 'company_intro'
  | 'categories'
  | 'featured_products'
  | 'bestsellers'
  | 'new_arrivals'
  | 'agri_fpv_showcase'
  | 'services'
  | 'printing_and_projects'
  | 'krashivantri_apps'
  | 'case_studies'
  | 'testimonials'
  | 'why_us'
  | 'cta';

export interface HomepageSectionConfig {
  id: string;
  type: HomepageSectionType;
  visible: boolean;
  kicker?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  primaryCtaLabel?: string;
  primaryCtaLink?: string;
  secondaryCtaLabel?: string;
  secondaryCtaLink?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface KrashivantriModelConfig {
  id: string;
  name: string;
  tagline: string;
  summary: string;
  imageUrl: string;
  specs: Array<{ label: string; value: string }>;
  highlights: string[];
}

export interface AndroidAppLinkConfig {
  id: string;
  name: string;
  role: string;
  description: string;
  comingSoon: boolean;
  playStoreUrl: string;
  apkDownloadUrl?: string;
}

export interface NavigationMenuItem {
  id: string;
  label: string;
  to: string;
  visible: boolean;
  sortOrder: number;
}

export interface ServiceCatalogItem {
  slug: string;
  title: string;
  shortDesc: string;
  visible: boolean;
  imageUrl?: string;
  ctaLabel?: string;
}

export interface CmsPageRecord {
  id: number;
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  draftContent: {
    heroHeadline: string;
    heroSubheadline: string;
    ctaLabel: string;
    ctaLink: string;
    blocks: Array<{ id: string; heading: string; body: string; imageUrl?: string }>;
  };
  publishedContent: {
    heroHeadline: string;
    heroSubheadline: string;
    ctaLabel: string;
    ctaLink: string;
    blocks: Array<{ id: string; heading: string; body: string; imageUrl?: string }>;
  } | null;
  status: string;
  updatedBy: string;
  updatedAt: string;
}

export interface SiteSettings {
  announcementBar?: {
    enabled: boolean;
    text: string;
    link: string;
    ctaLabel: string;
  };
  companyInfo?: {
    legalName: string;
    brandName: string;
    established: string;
    founderCeo: string;
    email: string;
    website: string;
    address: string;
    cin: string;
    gstin: string;
    contactPhone: string;
    whatsappNumber: string;
    businessHours: string;
    primaryTagline: string;
    secondaryTagline: string;
    socialLinks?: {
      linkedin?: string;
      instagram?: string;
      youtube?: string;
      github?: string;
    };
  };
  seoConfig?: {
    defaultTitle: string;
    defaultDescription: string;
    ga4MeasurementId?: string;
  };
  shippingConfig?: {
    standardShippingInr: number;
    freeShippingAboveInr: number;
    defaultGstPercent: number;
  };
  projectSettings?: {
    enableGstTax: boolean;
    defaultGstPercent: number;
    defaultAdvancePercent: number;
    quotationValidityDays: number;
  };
  homepageLayout?: {
    draft: HomepageSectionConfig[];
    published: HomepageSectionConfig[];
    publishedAt?: string;
  };
  navigationMenus?: {
    header: NavigationMenuItem[];
  };
  servicesCatalog?: ServiceCatalogItem[];
  krashivantriCatalog?: {
    platformName: string;
    summary: string;
    bannerImageUrl?: string;
    models: KrashivantriModelConfig[];
  };
  appLinks?: AndroidAppLinkConfig[];
  krashivantriInfo?: {
    platformName: string;
    summary: string;
    verifiedSpecs: Array<{ label: string; value: string }>;
  };
  pcbPricingConfig?: {
    singleLayerBaseSetupInr: number;
    singleLayerRatePerCm2Inr: number;
    doubleLayerBaseSetupInr: number;
    doubleLayerRatePerCm2Inr: number;
    minOrderChargeInr: number;
    copperRates: Record<string, number>;
    thicknessRates: Record<string, number>;
    finishSurchargesInr: Record<string, number>;
    colorSurchargesInr: Record<string, number>;
    standardShippingInr: number;
    freeShippingAboveInr: number;
    gstApplicable: boolean;
    gstPercent: number;
  };
  faqs?: Array<{ q: string; a: string }>;
  testimonials?: Array<{ name: string; role: string; org: string; quote: string }>;
  policies?: {
    shipping: string;
    returnRefund: string;
    privacy: string;
    terms: string;
  };
}

export interface DroneRepairBooking {
  id: number;
  referenceNumber: string;
  userId: number | null;
  serviceMode: 'field_visit' | 'service_centre' | string;
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  city: string;
  district: string;
  pinCode: string;
  droneBrandModel: string;
  droneType: string;
  problemDescription: string;
  photos: Array<{ originalName: string; storagePath: string; mimeType: string; sizeBytes: number }>;
  videoFile: { originalName: string; storagePath: string; mimeType: string; sizeBytes: number } | null;
  preferredDate: string;
  preferredTime: string;
  additionalInfo: string;
  status: string;
  assignedEngineer: string;
  inspectionChargeInr: number | null;
  inspectionChargeConfirmed: boolean;
  inspectionPaymentStatus: string;
  repairQuotationInr: number | null;
  repairQuotationNotes: string;
  repairApproved: boolean;
  repairPaymentStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  adminNotes: string;
  statusHistory: Array<{ status: string; timestamp: string; note: string; actor: string }>;
  createdAt: string;
  updatedAt: string;
}

