import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Users & Role-Based Access Control
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').default('').notNull(),
  mobile: text('mobile').default('').notNull(),
  companyOrCollege: text('company_or_college').default('').notNull(),
  role: text('role').default('customer').notNull(), // customer | super_admin | website_manager | product_manager | sales_manager | project_manager | engineer | inventory_manager | accounts_manager | support_manager
  passwordHash: text('password_hash').default('').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const adminSessions = pgTable('admin_sessions', {
  id: serial('id').primaryKey(),
  tokenHash: text('token_hash').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  userAgent: text('user_agent').default('').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const customerAddresses = pgTable('customer_addresses', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  label: text('label').default('Primary').notNull(),
  addressType: text('address_type').default('both').notNull(), // billing | delivery | both
  fullName: text('full_name').notNull(),
  mobile: text('mobile').notNull(),
  houseFlat: text('house_flat').notNull(),
  streetArea: text('street_area').notNull(),
  landmark: text('landmark').default('').notNull(),
  city: text('city').notNull(),
  district: text('district').notNull(),
  state: text('state').notNull(),
  pinCode: text('pin_code').notNull(),
  country: text('country').default('India').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Editable Website CMS & Settings
export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. E-Commerce Catalogue, Inventory, Cart & Orders
export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  storeScope: text('store_scope').default('general').notNull(), // general | 3d_printed
  description: text('description').default('').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const brands = pgTable('brands', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url').default('').notNull(),
  description: text('description').default('').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  url: text('url').notNull(),
  mimeType: text('mime_type').default('image/jpeg').notNull(),
  sizeBytes: integer('size_bytes').default(0).notNull(),
  altText: text('alt_text').default('').notNull(),
  folder: text('folder').default('general').notNull(),
  uploadedBy: text('uploaded_by').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => productCategories.id, {
    onDelete: 'set null',
  }),
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  brand: text('brand').default('NexusTekFusion').notNull(),
  productType: text('product_type').default('simple').notNull(), // simple | variable | customizable | made_to_order | quote_only
  modelNumber: text('model_number').default('').notNull(),
  subcategory: text('subcategory').default('').notNull(),
  shortDescription: text('short_description').default('').notNull(),
  storeScope: text('store_scope').default('general').notNull(), // general | 3d_printed
  description: text('description').default('').notNull(),
  technicalSpecs: jsonb('technical_specs').$type<Record<string, string>>().default({}).notNull(),
  features: jsonb('features').$type<string[]>().default([]).notNull(),
  priceInr: integer('price_inr').notNull(),
  discountPriceInr: integer('discount_price_inr'),
  gstPercent: integer('gst_percent').default(18).notNull(),
  stockQty: integer('stock_qty').default(0).notNull(),
  dimensions: text('dimensions').default('').notNull(),
  weightGrams: integer('weight_grams').default(0).notNull(),
  shippingWeightGrams: integer('shipping_weight_grams').default(0).notNull(),
  deliveryInfo: text('delivery_info').default('').notNull(),
  material: text('material').default('').notNull(),
  availableColors: jsonb('available_colors').$type<string[]>().default([]).notNull(),
  availableVariants: jsonb('available_variants').$type<string[]>().default([]).notNull(),
  productionTimeDays: integer('production_time_days').default(2).notNull(),
  warrantyInfo: text('warranty_info').default('').notNull(),
  imageUrl: text('image_url').default('').notNull(),
  galleryUrls: jsonb('gallery_urls').$type<string[]>().default([]).notNull(),
  datasheetUrl: text('datasheet_url').default('').notNull(),
  brochureUrl: text('brochure_url').default('').notNull(),
  model3dUrl: text('model_3d_url').default('').notNull(),
  seoTitle: text('seo_title').default('').notNull(),
  seoDescription: text('seo_description').default('').notNull(),
  status: text('status').default('published').notNull(), // published | draft | scheduled
  publishedAt: timestamp('published_at'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  compatibility: text('compatibility').default('').notNull(),
  packageContents: jsonb('package_contents').$type<string[]>().default([]).notNull(),
  applications: text('applications').default('').notNull(),
  productFaqs: jsonb('product_faqs').$type<Array<{ q: string; a: string }>>().default([]).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  relatedProductIds: jsonb('related_product_ids').$type<number[]>().default([]).notNull(),
  boughtTogetherIds: jsonb('bought_together_ids').$type<number[]>().default([]).notNull(),
  videoUrl: text('video_url').default('').notNull(),
  lowStockThreshold: integer('low_stock_threshold').default(5).notNull(),
  isBestseller: boolean('is_bestseller').default(false).notNull(),
  isNewArrival: boolean('is_new_arrival').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productReviews = pgTable('product_reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  authorName: text('author_name').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment').notNull(),
  verifiedPurchase: boolean('verified_purchase').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').default('percent').notNull(), // percent | flat
  discountValue: integer('discount_value').notNull(),
  minOrderInr: integer('min_order_inr').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const storeOrders = pgTable('store_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  billingAddress: jsonb('billing_address').notNull(),
  shippingAddress: jsonb('shipping_address').notNull(),
  items: jsonb('items')
    .$type<
      Array<{
        productId: number;
        sku: string;
        name: string;
        variant?: string;
        color?: string;
        qty: number;
        unitPriceInr: number;
        gstPercent: number;
        lineTotalInr: number;
      }>
    >()
    .notNull(),
  subtotalInr: integer('subtotal_inr').notNull(),
  discountInr: integer('discount_inr').default(0).notNull(),
  shippingInr: integer('shipping_inr').default(0).notNull(),
  gstInr: integer('gst_inr').default(0).notNull(),
  totalInr: integer('total_inr').notNull(),
  couponCode: text('coupon_code').default('').notNull(),
  paymentStatus: text('payment_status').default('pending').notNull(),
  orderStatus: text('order_status').default('Order Placed').notNull(),
  razorpayOrderId: text('razorpay_order_id').default('').notNull(),
  razorpayPaymentId: text('razorpay_payment_id').default('').notNull(),
  trackingCourier: text('tracking_courier').default('').notNull(),
  trackingId: text('tracking_id').default('').notNull(),
  trackingUrl: text('tracking_url').default('').notNull(),
  dispatchDate: text('dispatch_date').default('').notNull(),
  expectedDeliveryDate: text('expected_delivery_date').default('').notNull(),
  internalNotes: text('internal_notes').default('').notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Custom 3D Printing Engine & Orders
export const printingMaterials = pgTable('printing_materials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  technology: text('technology').default('FDM').notNull(), // FDM | SLA
  densityGcm3: doublePrecision('density_gcm3').default(1.24).notNull(),
  ratePerGramInr: doublePrecision('rate_per_gram_inr').default(6).notNull(),
  availableColors: jsonb('available_colors')
    .$type<Array<{ name: string; hex: string }>>()
    .default([])
    .notNull(),
  layerHeightsMm: jsonb('layer_heights_mm').$type<number[]>().default([0.1, 0.15, 0.2, 0.3]).notNull(),
  description: text('description').default('').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const printingMachines = pgTable('printing_machines', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  technology: text('technology').default('FDM').notNull(),
  buildVolumeX: integer('build_volume_x').default(256).notNull(),
  buildVolumeY: integer('build_volume_y').default(256).notNull(),
  buildVolumeZ: integer('build_volume_z').default(256).notNull(),
  hourlyRateInr: integer('hourly_rate_inr').default(120).notNull(),
  minOrderInr: integer('min_order_inr').default(250).notNull(),
  wastagePercent: integer('wastage_percent').default(8).notNull(),
  labourFeeInr: integer('labour_fee_inr').default(60).notNull(),
  finishingFeeInr: integer('finishing_fee_inr').default(120).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

export const printingOrders = pgTable('printing_orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  fileName: text('file_name').notNull(),
  fileFormat: text('file_format').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  fileStoragePath: text('file_storage_path').notNull(),
  boundingBoxMm: jsonb('bounding_box_mm').$type<{ x: number; y: number; z: number }>().notNull(),
  volumeCm3: doublePrecision('volume_cm3').default(0).notNull(),
  estimatedWeightG: doublePrecision('estimated_weight_g').default(0).notNull(),
  estimatedPrintMinutes: integer('estimated_print_minutes').default(0).notNull(),
  technology: text('technology').notNull(),
  materialName: text('material_name').notNull(),
  colorName: text('color_name').notNull(),
  layerHeightMm: doublePrecision('layer_height_mm').notNull(),
  infillPercent: integer('infill_percent').notNull(),
  supportEnabled: boolean('support_enabled').default(true).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  finishingOption: text('finishing_option').default('Standard As-Printed').notNull(),
  specialInstructions: text('special_instructions').default('').notNull(),
  pricingBreakdown: jsonb('pricing_breakdown')
    .$type<{
      materialCostInr: number;
      machineCostInr: number;
      supportCostInr: number;
      wastageCostInr: number;
      labourCostInr: number;
      finishingCostInr: number;
      subtotalInr: number;
      deliveryInr: number;
      gstInr: number;
      discountInr: number;
      totalInr: number;
      technicalReviewRequired: boolean;
      warnings: string[];
    }>()
    .notNull(),
  totalInr: integer('total_inr').notNull(),
  deliveryAddress: jsonb('delivery_address').notNull(),
  slicingStatus: text('slicing_status').default('Slicing Completed').notNull(),
  orderStatus: text('order_status').default('Order Placed').notNull(),
  paymentStatus: text('payment_status').default('pending').notNull(),
  razorpayOrderId: text('razorpay_order_id').default('').notNull(),
  razorpayPaymentId: text('razorpay_payment_id').default('').notNull(),
  trackingCourier: text('tracking_courier').default('').notNull(),
  trackingId: text('tracking_id').default('').notNull(),
  trackingUrl: text('tracking_url').default('').notNull(),
  productionNotes: text('production_notes').default('').notNull(),
  productionPhotos: jsonb('production_photos').$type<string[]>().default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Engineering Project Enquiries, Quotations & Active Projects
export const projectEnquiries = pgTable('project_enquiries', {
  id: serial('id').primaryKey(),
  enquiryNumber: text('enquiry_number').notNull().unique(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone').notNull(),
  companyOrCollege: text('company_or_college').default('').notNull(),
  projectTitle: text('project_title').notNull(),
  engineeringBranch: text('engineering_branch').notNull(),
  academicLevel: text('academic_level').default('Industrial / Commercial').notNull(),
  projectCategory: text('project_category').notNull(),
  projectType: text('project_type').notNull(),
  projectDescription: text('project_description').notNull(),
  problemStatement: text('problem_statement').default('').notNull(),
  expectedFunctionality: text('expected_functionality').default('').notNull(),
  requiredTechnologies: text('required_technologies').default('').notNull(),
  expectedDeliverables: text('expected_deliverables').default('').notNull(),
  targetCompletionDate: text('target_completion_date').default('').notNull(),
  estimatedBudget: text('estimated_budget').default('').notNull(),
  specialRequirements: text('special_requirements').default('').notNull(),
  attachments: jsonb('attachments')
    .$type<Array<{ originalName: string; storagePath: string; sizeBytes: number }>>()
    .default([])
    .notNull(),
  billingAddress: jsonb('billing_address').notNull(),
  deliveryAddress: jsonb('delivery_address').notNull(),
  addressHistory: jsonb('address_history')
    .$type<Array<{ changedAt: string; changedBy: string; deliveryAddress: unknown }>>()
    .default([])
    .notNull(),
  status: text('status').default('Submitted').notNull(),
  assignedEngineer: text('assigned_engineer').default('').notNull(),
  internalNotes: text('internal_notes').default('').notNull(),
  rejectionReason: text('rejection_reason').default('').notNull(),
  clarificationNotes: text('clarification_notes').default('').notNull(),
  courseDepartment: text('course_department').default('').notNull(),
  teamType: text('team_type').default('Individual').notNull(),
  teamCount: integer('team_count').default(1).notNull(),
  budgetMinInr: integer('budget_min_inr'),
  budgetMaxInr: integer('budget_max_inr'),
  flags: jsonb('flags').$type<Record<string, boolean | string>>().default({}).notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectQuotations = pgTable('project_quotations', {
  id: serial('id').primaryKey(),
  enquiryId: integer('enquiry_id')
    .references(() => projectEnquiries.id, { onDelete: 'cascade' })
    .notNull(),
  revisionNumber: integer('revision_number').default(1).notNull(),
  items: jsonb('items')
    .$type<Array<{ name: string; description: string; qty: number; unitPriceInr: number }>>()
    .default([])
    .notNull(),
  hardwareCostInr: integer('hardware_cost_inr').default(0).notNull(),
  softwareCostInr: integer('software_cost_inr').default(0).notNull(),
  designDevChargesInr: integer('design_dev_charges_inr').default(0).notNull(),
  testingChargesInr: integer('testing_charges_inr').default(0).notNull(),
  documentationChargesInr: integer('documentation_charges_inr').default(0).notNull(),
  deliveryChargesInr: integer('delivery_charges_inr').default(0).notNull(),
  discountInr: integer('discount_inr').default(0).notNull(),
  gstInr: integer('gst_inr').default(0).notNull(),
  totalAmountInr: integer('total_amount_inr').notNull(),
  advancePercent: integer('advance_percent').default(50).notNull(),
  advanceAmountInr: integer('advance_amount_inr').notNull(),
  balanceAmountInr: integer('balance_amount_inr').notNull(),
  costCategories: jsonb('cost_categories')
    .$type<{
      development: number;
      hardware: number;
      sensors: number;
      pcb: number;
      mechanical: number;
      printing3d: number;
      software: number;
      aiMl: number;
      iot: number;
      droneRobotics: number;
      testing: number;
      documentation: number;
      delivery: number;
      other: number;
    }>()
    .default({
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
      delivery: 0,
      other: 0,
    })
    .notNull(),
  validityDays: integer('validity_days').default(15).notNull(),
  estimatedDuration: text('estimated_duration').default('').notNull(),
  paymentTerms: text('payment_terms').default('50% Advance, 50% Balance before Dispatch').notNull(),
  termsAndConditions: text('terms_and_conditions').default('').notNull(),
  paidAmountInr: integer('paid_amount_inr').default(0).notNull(),
  status: text('status').default('Sent').notNull(), // Draft | Sent | Accepted | Modification Requested | Rejected
  customerFeedback: text('customer_feedback').default('').notNull(),
  razorpayOrderId: text('razorpay_order_id').default('').notNull(),
  razorpayPaymentId: text('razorpay_payment_id').default('').notNull(),
  paymentStatus: text('payment_status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  projectCode: text('project_code').notNull().unique(),
  enquiryId: integer('enquiry_id')
    .references(() => projectEnquiries.id, { onDelete: 'cascade' })
    .notNull(),
  quotationId: integer('quotation_id')
    .references(() => projectQuotations.id, { onDelete: 'set null' }),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  assignedEngineer: text('assigned_engineer').default('Engineering Team').notNull(),
  status: text('status').default('Project Started').notNull(),
  milestones: jsonb('milestones')
    .$type<Array<{ id: string; title: string; dueDate: string; status: 'Pending' | 'In Progress' | 'Completed'; notes: string }>>()
    .default([])
    .notNull(),
  updates: jsonb('updates')
    .$type<Array<{ id: string; timestamp: string; author: string; summary: string }>>()
    .default([])
    .notNull(),
  deliverables: jsonb('deliverables').$type<string[]>().default([]).notNull(),
  trackingCourier: text('tracking_courier').default('').notNull(),
  trackingId: text('tracking_id').default('').notNull(),
  trackingUrl: text('tracking_url').default('').notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. PCB Design & Fabrication (Single & Double Layer), Drone Repairs & B2B Bulk Enquiries
export const pcbEnquiries = pgTable('pcb_enquiries', {
  id: serial('id').primaryKey(),
  enquiryNumber: text('enquiry_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  customerName: text('customer_name').notNull(),
  email: text('email').notNull(),
  mobile: text('mobile').notNull(),
  boardDimensionsMm: text('board_dimensions_mm').notNull(),
  boardLengthMm: doublePrecision('board_length_mm').default(0).notNull(),
  boardWidthMm: doublePrecision('board_width_mm').default(0).notNull(),
  layerCount: integer('layer_count').default(2).notNull(), // strictly 1 or 2
  boardQuantity: integer('board_quantity').default(5).notNull(),
  copperThickness: text('copper_thickness').default('1 oz (35 µm)').notNull(),
  pcbThickness: text('pcb_thickness').default('1.6 mm').notNull(),
  solderMaskColor: text('solder_mask_color').default('Green').notNull(),
  assemblyRequired: boolean('assembly_required').default(false).notNull(),
  surfaceFinish: text('surface_finish').default('HASL Lead-Free').notNull(),
  deliveryLocation: text('delivery_location').default('').notNull(),
  requiredDeliveryDate: text('required_delivery_date').default('').notNull(),
  specialInstructions: text('special_instructions').default('').notNull(),
  gerberAnalysisStatus: text('gerber_analysis_status').default('analyzed').notNull(), // analyzed | quotation_required
  gerberNotes: text('gerber_notes').default('').notNull(),
  pricingBreakdown: jsonb('pricing_breakdown')
    .$type<{
      quotationRequired: boolean;
      reason?: string;
      pcbType?: string;
      areaCm2?: number;
      manufacturingCostInr?: number;
      unitCostInr?: number;
      shippingInr?: number;
      gstInr?: number;
      totalEstimatedInr?: number;
      minOrderApplied?: boolean;
    } | null>()
    .default(null),
  attachments: jsonb('attachments')
    .$type<Array<{ originalName: string; storagePath: string; sizeBytes: number; fileRole?: string }>>()
    .default([])
    .notNull(),
  quotedAmountInr: integer('quoted_amount_inr'),
  fileApprovalStatus: text('file_approval_status').default('Pending Review').notNull(), // Pending Review | Approved | Rejected
  rejectionReason: text('rejection_reason').default('').notNull(),
  status: text('status').default('Order received').notNull(),
  razorpayOrderId: text('razorpay_order_id').default('').notNull(),
  razorpayPaymentId: text('razorpay_payment_id').default('').notNull(),
  paymentStatus: text('payment_status').default('pending').notNull(),
  trackingCourier: text('tracking_courier').default('').notNull(),
  trackingId: text('tracking_id').default('').notNull(),
  adminNotes: text('admin_notes').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const droneRepairBookings = pgTable('drone_repair_bookings', {
  id: serial('id').primaryKey(),
  referenceNumber: text('reference_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  serviceMode: text('service_mode').notNull(), // field_visit | service_centre
  customerName: text('customer_name').notNull(),
  mobile: text('mobile').notNull(),
  email: text('email').default('').notNull(),
  address: text('address').default('').notNull(),
  city: text('city').default('').notNull(),
  district: text('district').default('').notNull(),
  pinCode: text('pin_code').default('').notNull(),
  droneBrandModel: text('drone_brand_model').notNull(),
  droneType: text('drone_type').default('Agriculture').notNull(),
  problemDescription: text('problem_description').notNull(),
  photos: jsonb('photos')
    .$type<Array<{ originalName: string; storagePath: string; mimeType: string; sizeBytes: number }>>()
    .default([])
    .notNull(),
  videoFile: jsonb('video_file')
    .$type<{ originalName: string; storagePath: string; mimeType: string; sizeBytes: number } | null>()
    .default(null),
  preferredDate: text('preferred_date').notNull(),
  preferredTime: text('preferred_time').notNull(),
  additionalInfo: text('additional_info').default('').notNull(),
  status: text('status').default('Booking received').notNull(),
  assignedEngineer: text('assigned_engineer').default('').notNull(),
  inspectionChargeInr: integer('inspection_charge_inr'),
  inspectionChargeConfirmed: boolean('inspection_charge_confirmed').default(false).notNull(),
  inspectionPaymentStatus: text('inspection_payment_status').default('unpaid').notNull(),
  repairQuotationInr: integer('repair_quotation_inr'),
  repairQuotationNotes: text('repair_quotation_notes').default('').notNull(),
  repairApproved: boolean('repair_approved').default(false).notNull(),
  repairPaymentStatus: text('repair_payment_status').default('unpaid').notNull(),
  razorpayOrderId: text('razorpay_order_id').default('').notNull(),
  razorpayPaymentId: text('razorpay_payment_id').default('').notNull(),
  adminNotes: text('admin_notes').default('').notNull(),
  statusHistory: jsonb('status_history')
    .$type<Array<{ status: string; timestamp: string; note: string; actor: string }>>()
    .default([])
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const b2bEnquiries = pgTable('b2b_enquiries', {
  id: serial('id').primaryKey(),
  enquiryNumber: text('enquiry_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  companyName: text('company_name').notNull(),
  contactPerson: text('contact_person').notNull(),
  email: text('email').notNull(),
  mobile: text('mobile').notNull(),
  gstin: text('gstin').default('').notNull(),
  requirementCategory: text('requirement_category').notNull(),
  quantity: integer('quantity').default(10).notNull(),
  technicalSpecs: text('technical_specs').notNull(),
  expectedDeliveryDate: text('expected_delivery_date').default('').notNull(),
  shippingLocation: text('shipping_location').notNull(),
  attachments: jsonb('attachments')
    .$type<Array<{ originalName: string; storagePath: string; sizeBytes: number }>>()
    .default([])
    .notNull(),
  quotedAmountInr: integer('quoted_amount_inr'),
  volumeDiscountPercent: integer('volume_discount_percent').default(0).notNull(),
  status: text('status').default('Submitted').notNull(),
  razorpayOrderId: text('razorpay_order_id').default('').notNull(),
  paymentStatus: text('payment_status').default('pending').notNull(),
  adminNotes: text('admin_notes').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 7. Payments & Invoices
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  paymentRef: text('payment_ref').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  entityType: text('entity_type').notNull(), // store_order | printing_order | project_quotation | pcb_enquiry | b2b_enquiry
  entityId: integer('entity_id').notNull(),
  razorpayOrderId: text('razorpay_order_id').default('').notNull(),
  razorpayPaymentId: text('razorpay_payment_id').default('').notNull(),
  razorpaySignature: text('razorpay_signature').default('').notNull(),
  amountInr: integer('amount_inr').notNull(),
  currency: text('currency').default('INR').notNull(),
  mode: text('mode').default('test_mode').notNull(), // live_razorpay | test_mode
  status: text('status').default('verified').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  entityType: text('entity_type').notNull(),
  entityId: integer('entity_id').notNull(),
  docType: text('doc_type').default('Proforma Invoice').notNull(), // Quotation | Proforma Invoice | Payment Receipt | Tax Invoice
  amountInr: integer('amount_inr').notNull(),
  gstInr: integer('gst_inr').default(0).notNull(),
  payload: jsonb('payload').notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
});

// 8. Blogs, Case Studies, Support Tickets, Notifications & Audit Logs
export const blogs = pgTable('blogs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').default('Engineering').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]).notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  coverImageUrl: text('cover_image_url').default('').notNull(),
  seoTitle: text('seo_title').default('').notNull(),
  seoDescription: text('seo_description').default('').notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  publishedAt: timestamp('published_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const caseStudies = pgTable('case_studies', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  technologyUsed: text('technology_used').notNull(),
  applications: text('applications').notNull(),
  outcomes: text('outcomes').notNull(),
  relatedServices: jsonb('related_services').$type<string[]>().default([]).notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').default('').notNull(),
  videoUrl: text('video_url').default('').notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  ticketNumber: text('ticket_number').notNull().unique(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  mobile: text('mobile').default('').notNull(),
  subject: text('subject').notNull(),
  serviceCategory: text('service_category').default('General').notNull(),
  message: text('message').notNull(),
  attachmentPath: text('attachment_path').default('').notNull(),
  status: text('status').default('Open').notNull(), // Open | In Review | Replied | Resolved
  assignedStaff: text('assigned_staff').default('').notNull(),
  messages: jsonb('messages')
    .$type<Array<{ sender: string; role: string; text: string; timestamp: string }>>()
    .default([])
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  link: text('link').default('/my-account').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUid: text('actor_uid').notNull(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').default('').notNull(),
  details: jsonb('details').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 9. Inventory Movements, Newsletter & Visual Website Editor (CMS Pages & Revisions)
export const inventoryMovements = pgTable('inventory_movements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  deltaQty: integer('delta_qty').notNull(),
  previousQty: integer('previous_qty').notNull(),
  newQty: integer('new_qty').notNull(),
  reason: text('reason').default('Manual Adjustment').notNull(),
  actorEmail: text('actor_email').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  source: text('source').default('footer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const cmsPages = pgTable('cms_pages', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  seoTitle: text('seo_title').default('').notNull(),
  seoDescription: text('seo_description').default('').notNull(),
  draftContent: jsonb('draft_content')
    .$type<{
      heroHeadline: string;
      heroSubheadline: string;
      ctaLabel: string;
      ctaLink: string;
      blocks: Array<{ id: string; heading: string; body: string; imageUrl?: string }>;
    }>()
    .notNull(),
  publishedContent: jsonb('published_content')
    .$type<{
      heroHeadline: string;
      heroSubheadline: string;
      ctaLabel: string;
      ctaLink: string;
      blocks: Array<{ id: string; heading: string; body: string; imageUrl?: string }>;
    }>(),
  status: text('status').default('draft').notNull(), // draft | published
  updatedBy: text('updated_by').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cmsRevisions = pgTable('cms_revisions', {
  id: serial('id').primaryKey(),
  targetKey: text('target_key').notNull(),
  label: text('label').default('Snapshot').notNull(),
  snapshot: jsonb('snapshot').notNull(),
  createdBy: text('created_by').default('').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. CRM Leads & Customer Follow-up Notes
export const crmLeads = pgTable('crm_leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').default('').notNull(),
  phone: text('phone').default('').notNull(),
  companyOrCollege: text('company_or_college').default('').notNull(),
  source: text('source').default('website').notNull(), // website | krashivantri | b2b | project | manual
  stage: text('stage').default('New Lead').notNull(), // New Lead | Contacted | Qualified | Quotation Sent | Negotiation | Won | Lost
  assignedTo: text('assigned_to').default('').notNull(),
  estimatedValueInr: integer('estimated_value_inr').default(0).notNull(),
  nextFollowUpDate: text('next_follow_up_date').default('').notNull(),
  summary: text('summary').default('').notNull(),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const crmNotes = pgTable('crm_notes', {
  id: serial('id').primaryKey(),
  entityType: text('entity_type').notNull(), // lead | customer | project_enquiry | order
  entityId: integer('entity_id').notNull(),
  authorEmail: text('author_email').notNull(),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
