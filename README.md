# NexusTekFusion — Engineering Services, Custom 3D Printing & E-Commerce Platform

Official full-stack web platform for **NEXUSTEKFUSION PRIVATE LIMITED** (`https://nexustekfusion.in`), Nagpur, Maharashtra, India.

- **Legal Name:** NEXUSTEKFUSION PRIVATE LIMITED
- **CIN:** `U30305ME2026PTC474052`
- **Founder & CEO:** Sahil Prakash Bhagat
- **Registered Office:** H NO. 565/19 NIT, SANKUL NEW COTTON MARK, Ganjipeth, Nagpur 440018, Maharashtra, India
- **Official Email:** `info@nexustekfusion.in`

---

## Architecture Overview

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Three.js interactive 3D CAD mesh viewer (`src/components/ModelViewer3D.tsx`), jsPDF invoice & quotation generator (`src/lib/pdf.ts`).
- **Backend:** Express (`server.ts`) serving REST APIs (`/api/*`, `/api/admin/*`), `/robots.txt`, `/sitemap.xml`, Razorpay webhook (`/api/payments/webhook`), and Vite middleware in development.
- **Database & Schema:** PostgreSQL (Cloud SQL) managed via Drizzle ORM (`src/db/schema.ts` — 24 tables covering users, addresses, categories, products, wishlist, reviews, coupons, orders, custom 3D printing materials/machines/jobs, project enquiries, quotations, active engineering projects/milestones/deliverables, PCB enquiries, B2B bulk requests, support tickets, newsletter, blogs, case studies, site CMS settings, and admin audit logs).
- **Authentication:** Dual Firebase Google Sign-In + HTTP-only signed session authentication (`/admin/login`) with salted `scrypt` password hashing (`src/db/users.ts`, `src/middleware/auth.ts`) and 9-role RBAC (`super_admin`, `website_manager`, `product_manager`, `sales_manager`, `project_manager`, `engineer`, `inventory_manager`, `accounts_manager`, `support_manager`, `customer`).
- **3D Slicing Engine:** Real server-side binary/ASCII STL & OBJ mesh geometry analyzer (`src/server/slicer.ts`) calculating bounding box (`X × Y × Z`), exact mesh volume (`cm³`), surface area (`cm²`), overhang ratio, support volume estimation, layer count, filament weight, print duration, and dynamic material/printer/infill pricing. Large or STEP/3MF assemblies automatically transition to `Technical Review Required` for manual engineering estimation.
- **Payments:** Razorpay Orders API + HMAC-SHA256 signature verification (`src/server/razorpay.ts`), with an explicitly labeled **Sandbox Test Mode** when live Razorpay credentials are not configured.

---

## Local Development Setup (Windows / macOS / Linux)

### 1. Prerequisites
- **Node.js 20+** and **npm 10+**
- **PostgreSQL 15+** (or Cloud SQL PostgreSQL connection)
- **Firebase Project** (with Google Authentication enabled and `firebase-applet-config.json` in the project root)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and populate your credentials:
```bash
# Windows PowerShell:
Copy-Item .env.example .env
```

Required database variables (`src/db/index.ts`):
- `SQL_HOST` (e.g. `127.0.0.1`)
- `SQL_USER`
- `SQL_PASSWORD`
- `SQL_DB_NAME`

Optional payment & admin variables:
- `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_PASSWORD` (seeds initial password-authenticated Super Admin on startup)
- `ADMIN_SESSION_SECRET` (HMAC secret for signed admin session cookies)
- `RAZORPAY_KEY_ID` (leave blank to use Sandbox Test Mode)
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `ADMIN_EMAILS="info.nexustekfusion@gmail.com,info@nexustekfusion.in"`
- `APP_URL="http://localhost:3000"`

### 4. Push Database Schema
```bash
npx drizzle-kit push --config=src/db/drizzle.config.ts
```

### 5. Run Development Server
```bash
npm run dev
```
The application runs on `http://localhost:3000`. Seed data (categories, initial catalog products, printing materials, FDM/SLA machines, blogs, case studies, and company CMS defaults) initializes safely on first bootstrap request without overwriting existing edits.

### 6. Build & Run Production
```bash
npm run lint
npm run build
npm start
```

---

## Razorpay Webhook Setup
In your Razorpay Dashboard, configure a webhook pointing to:
- **URL:** `https://nexustekfusion.in/api/payments/webhook`
- **Secret:** Same value as `RAZORPAY_WEBHOOK_SECRET` in `.env`
- **Events:** `payment.captured`, `payment.failed`, `order.paid`

---

## End-to-End Verification Checklist

1. **Workflow A (Project Enquiry -> Quotation -> Payment -> Active Project):**
   - Submit an enquiry at `/project-enquiry` with attachments and billing/delivery addresses.
   - Sign in as Admin at `/admin`, open **Enquiries & Quotes**, build an itemized quotation, and send to customer.
   - Open `/my-account` as the customer, inspect the quote, download PDF, accept, and complete Razorpay payment (advance or full). Verify project activation and milestone tracking.
2. **Workflow B (Custom 3D Printing):**
   - Upload an `.stl` or `.obj` model at `/services/3d-printing`, inspect the interactive Three.js preview, select material/color/layer height/infill, verify live slicer calculation, pick a delivery address, and place a Razorpay order.
3. **Workflow C (Ready-Made Store & Coupons):**
   - Browse `/shop` and `/store/3d-printed-products`, select variants/colors on `/product/[slug]`, add to `/cart`, apply a coupon at `/checkout`, verify atomic stock deduction and `/track-order` lookup.
4. **Workflow D (PCB Design & B2B Bulk Portal):**
   - Submit a PCB enquiry at `/services/pcb-design` or a B2B bulk quote request at `/b2b`, review and quote from `/admin`, and pay from `/my-account`.
5. **Workflow E (Admin RBAC, CMS & Audit Logs):**
   - Manage products, stock, printing materials/machines, coupons, CMS settings (hero, banner, company info, FAQs, legal policies), user roles, and review immutable audit trails in `/admin`.
