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
  children?: Array<{ id: string; label: string; to: string }>;
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
  projectPaymentSettings?: ProjectPaymentSettings;
  projectEmailTemplates?: EmailTemplateDef[];
  krashivantriOpsConfig?: KrashivantriOpsConfig;
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

export interface ProjectPaymentSettings {
  defaultPlanType: string;
  advancePercent: number;
  finalPercent: number;
  allowFullPayment: boolean;
  enableGstTax: boolean;
  gstPercent: number;
  quotationValidityDays: number;
  quotationPrefix: string;
  projectPrefix: string;
  paymentPrefix: string;
  invoicePrefix: string;
  receiptPrefix: string;
  clearancePrefix: string;
  workOrderPrefix: string;
  handoverDownloadExpiryDays: number;
  reminderIntervalsDays: number[];
  allowHandoverExceptionBySuperAdmin: boolean;
  cancellationRefundPolicy: string;
}

export interface EmailTemplateDef {
  eventType: string;
  label: string;
  enabled: boolean;
  subject: string;
  body: string;
}

export interface ProjectPaymentMilestone {
  id: number;
  planId: number | null;
  projectId: number | null;
  quotationId: number;
  stageName: string;
  stageOrder: number;
  percent: number;
  amountInr: number;
  dueTrigger: string;
  status: string;
  paymentRef: string;
  paidAt: string | null;
}

export interface PaymentReceiptRecord {
  id: number;
  receiptNumber: string;
  paymentRef: string;
  entityType: string;
  entityId: number;
  paymentStage: string;
  amountInr: number;
  razorpayPaymentId: string;
  payload: Record<string, unknown>;
  issuedAt: string;
}

export interface PaymentClearanceCertificate {
  id: number;
  certificateNumber: string;
  projectId: number;
  enquiryId: number;
  quotationId: number | null;
  totalAmountInr: number;
  advancePaidInr: number;
  finalPaidInr: number;
  balanceInr: number;
  paymentRefs: string[];
  issuedBy: string;
  issuedAt: string;
}

export interface ProjectWorkOrder {
  id: number;
  workOrderNumber: string;
  projectId: number;
  enquiryId: number;
  assignedEngineer: string;
  estimatedCompletionDate: string;
  scopeSummary: string;
  issuedAt: string;
}

export interface ProjectHandoverDocument {
  id: number;
  projectId: number;
  title: string;
  category: string;
  fileName: string;
  fileSizeBytes: number;
  versionLabel: string;
  notes: string;
  downloadToken?: string | null;
  tokenExpiresAt: string;
  downloadCount: number;
  lastDownloadedAt: string | null;
  uploadedBy: string;
  createdAt: string;
  locked?: boolean;
}

export interface ProjectDeliveryRecord {
  id: number;
  projectId: number;
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
  dispatchDate: string;
  expectedDeliveryDate: string;
  actualDeliveryDate: string;
  dispatchNotes: string;
  updatedBy: string;
  createdAt: string;
}

export interface KrashivantriOpsConfig {
  baseRatePerAcreInr: number;
  minimumBookingAcres: number;
  platformCommissionPercent: number;
  gpsStaleThresholdMinutes: number;
  arrivalGeofenceMeters: number;
  pilotResponseTimeoutMinutes: number;
  cancellationBeforeDispatchRefundPercent: number;
  lateArrivalPenaltyInr: number;
}

export interface FarmerProfile {
  id: number;
  userId: number | null;
  farmerCode: string;
  fullName: string;
  mobile: string;
  email: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pinCode: string;
  aadhaarLast4: string;
  kycStatus: string;
  accountStatus: string;
  totalLandAcres: number;
  cropsGrown: string;
  rejectionReason: string;
  verifiedBy: string;
  verifiedAt: string;
  createdAt: string;
}

export interface FarmerFarm {
  id: number;
  farmerId: number;
  farmName: string;
  cropType: string;
  areaAcres: number;
  village: string;
  district: string;
  state: string;
  pinCode: string;
  centerLat: number;
  centerLng: number;
  boundaryGeoJson: Array<{ lat: number; lng: number }>;
  isActive: boolean;
}

export interface DronePilotProfile {
  id: number;
  userId: number | null;
  pilotCode: string;
  fullName: string;
  mobile: string;
  email: string;
  city: string;
  district: string;
  state: string;
  pinCode: string;
  rpcNumber: string;
  rpcValidUntil: string;
  kycStatus: string;
  accountStatus: string;
  serviceRadiusKm: number;
  totalSprayedAcres: number;
  penaltyPoints: number;
  rejectionReason: string;
  verifiedBy: string;
  createdAt: string;
}

export interface PilotDrone {
  id: number;
  pilotId: number;
  droneModel: string;
  uinNumber: string;
  tankCapacityLiters: number;
  sprayWidthMeters: number;
  verificationStatus: string;
}

export interface PilotBankAccount {
  id: number;
  pilotId: number;
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string;
  ifscCode: string;
  upiId: string;
  verificationStatus: string;
  isPrimary: boolean;
}

export interface PilotAvailability {
  id: number;
  pilotId: number;
  isOnline: boolean;
  gpsPermissionGranted: boolean;
  currentLat: number | null;
  currentLng: number | null;
  accuracyMeters: number | null;
  speedMps: number | null;
  headingDeg: number | null;
  batteryPercent: number | null;
  lastLocationAt: string | null;
  status: string;
  gpsStalenessSeconds?: number | null;
  isStale?: boolean;
  gpsAvailable?: boolean;
}

export interface ServiceBooking {
  id: number;
  bookingNumber: string;
  farmerId: number;
  farmId: number | null;
  assignedPilotId: number | null;
  cropType: string;
  sprayType: string;
  chemicalProvidedBy: string;
  bookedAreaAcres: number;
  ratePerAcreInr: number;
  totalAmountInr: number;
  platformCommissionPercent: number;
  pilotPayoutInr: number;
  preferredDate: string;
  preferredSlot: string;
  farmLat: number;
  farmLng: number;
  farmBoundary: Array<{ lat: number; lng: number }>;
  bookingStatus: string;
  paymentStatus: string;
  farmerNotes: string;
  createdAt: string;
  farmer?: Partial<FarmerProfile> | null;
  assignedPilot?: (Partial<DronePilotProfile> & { availability?: PilotAvailability | null }) | null;
  session?: OperationSession | null;
  evidence?: OperationEvidence[];
}

export interface OperationSession {
  id: number;
  sessionCode: string;
  bookingId: number;
  pilotId: number;
  farmerId: number;
  status: string;
  startedAt: string | null;
  pausedAt: string | null;
  resumedAt: string | null;
  completedAt: string | null;
  insideGeofenceOnStart: boolean;
  geofenceDistanceMeters: number;
  completedAreaAcres: number;
  pauseReason: string;
  pilotNotes: string;
  farmerConfirmed: boolean;
  farmerDisputeReason: string;
}

export interface OperationEvidence {
  id: number;
  sessionId: number;
  bookingId: number;
  pilotId: number;
  evidencePhase: string;
  mediaType: string;
  fileName: string;
  storagePath: string;
  latitude: number | null;
  longitude: number | null;
  caption: string;
  capturedAt: string;
}

export interface PilotPayout {
  id: number;
  payoutRef: string;
  pilotId: number;
  amountInr: number;
  bankAccountMasked: string;
  payoutProvider: string;
  providerPayoutId: string;
  status: string;
  failureReason: string;
  approvedBy: string;
  processedAt: string | null;
  createdAt: string;
}

export interface PenaltyRecord {
  id: number;
  penaltyNumber: string;
  targetType: string;
  targetId: number;
  targetLabel?: string;
  bookingId: number | null;
  reasonCategory: string;
  description: string;
  evidenceSummary: string;
  amountInr: number;
  status: string;
  appealStatus: string;
  imposedBy: string;
  createdAt: string;
}

