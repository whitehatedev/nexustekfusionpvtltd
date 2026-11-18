import React from 'react';
import {
  ArrowRight,
  Cpu,
  Layers,
  Printer,
  Plane,
  Bot,
  CircuitBoard,
  Wrench,
  Compass,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { HomepageSectionConfig, Product } from '../types/platform';

const HERO_IMG = '/src/assets/images/hero_nexustek_engineering_1794981062404.jpg';
const DRONE_IMG = '/src/assets/images/service_agri_drone_1794981061744.jpg';
const PCB_IMG = '/src/assets/images/service_pcb_electronics_1794981062614.jpg';
const PRINT_IMG = '/src/assets/images/service_3d_printing_1794981063445.jpg';
const ROBOT_IMG = '/src/assets/images/service_robotics_automation_1794981063545.jpg';

const SERVICE_CARDS = [
  {
    num: '01',
    title: 'AI & Machine Learning',
    summary: 'Computer vision, object detection, predictive analytics, and intelligent edge automation pipelines.',
    to: '/services/ai-ml',
    icon: Cpu,
  },
  {
    num: '02',
    title: 'Drone Development',
    summary: 'Agricultural spraying UAVs, survey drones, custom airframes, flight controllers, and payload integration.',
    to: '/services/drone-development',
    icon: Plane,
  },
  {
    num: '03',
    title: 'Robotics & Automation',
    summary: 'Autonomous mobile robots, articulated arms, industrial control loops, and sensor fusion.',
    to: '/services/robotics',
    icon: Bot,
  },
  {
    num: '04',
    title: 'IoT & Embedded Systems',
    summary: 'ESP32, STM32, Arduino, and Raspberry Pi firmware paired with wireless telemetry dashboards.',
    to: '/services/iot-embedded',
    icon: Compass,
  },
  {
    num: '05',
    title: 'PCB Design & Development',
    summary: 'Multi-layer schematic capture, Gerber layout, BOM sourcing, and prototype SMD assembly.',
    to: '/services/pcb-design',
    icon: CircuitBoard,
  },
  {
    num: '06',
    title: '3D Printing & Rapid Prototyping',
    summary: 'Precision FDM and SLA additive manufacturing in PLA+, PETG, ABS, TPU, Nylon PA12-CF, and Resin.',
    to: '/services/3d-printing',
    icon: Printer,
  },
  {
    num: '07',
    title: 'Engineering R&D & Academic Projects',
    summary: 'End-to-end R&D prototypes, academic B.E./B.Tech projects, and custom hardware-software builds.',
    to: '/project-enquiry',
    icon: Layers,
  },
  {
    num: '08',
    title: 'Product Design & Manufacturing',
    summary: 'CAD engineering, industrial enclosures, small-batch fabrication, and OEM hardware fulfillment.',
    to: '/b2b',
    icon: Wrench,
  },
];

const FALLBACK_SECTIONS: HomepageSectionConfig[] = [
  { id: 'hero', type: 'hero', visible: true },
  { id: 'company_intro', type: 'company_intro', visible: true },
  { id: 'categories', type: 'categories', visible: true },
  { id: 'featured_products', type: 'featured_products', visible: true },
  { id: 'agri_fpv_showcase', type: 'agri_fpv_showcase', visible: true },
  { id: 'bestsellers', type: 'bestsellers', visible: true },
  { id: 'new_arrivals', type: 'new_arrivals', visible: true },
  { id: 'services', type: 'services', visible: true },
  { id: 'printing_and_projects', type: 'printing_and_projects', visible: true },
  { id: 'krashivantri_apps', type: 'krashivantri_apps', visible: true },
  { id: 'case_studies', type: 'case_studies', visible: true },
  { id: 'testimonials', type: 'testimonials', visible: true },
  { id: 'why_us', type: 'why_us', visible: true },
  { id: 'cta', type: 'cta', visible: true },
];

export const HomePage: React.FC = () => {
  const {
    navigate,
    featuredProducts,
    bestsellerProducts,
    newArrivalProducts,
    categories,
    caseStudies,
    addToCart,
    settings,
    previewDraft,
  } = usePlatform();
  const company = settings.companyInfo;
  const krashiCatalog = settings.krashivantriCatalog;
  const layoutList =
    (previewDraft ? settings.homepageLayout?.draft : settings.homepageLayout?.published) ||
    FALLBACK_SECTIONS;

  const renderProductGrid = (items: Product[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map((product) => {
        const isQuoteOnly = product.productType === 'quote_only' || product.priceInr <= 0;
        const activePrice =
          product.discountPriceInr !== null && product.discountPriceInr < product.priceInr
            ? product.discountPriceInr
            : product.priceInr;
        return (
          <div
            key={product.id}
            className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-colors"
          >
            <div>
              <button
                onClick={() => navigate(`/product/${product.slug}`)}
                className="block w-full aspect-[4/3] bg-slate-100 overflow-hidden"
              >
                <img
                  src={product.imageUrl || PCB_IMG}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </button>
              <div className="p-5 space-y-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="font-medium text-slate-700">{product.brand}</span>
                  <span aria-hidden="true">·</span>
                  {isQuoteOnly ? (
                    <span className="text-blue-700 font-medium">Custom Build</span>
                  ) : (
                    <span className={product.stockQty > 0 ? 'text-blue-700 font-medium' : 'text-red-700 font-medium'}>
                      {product.stockQty > 0 ? `In Stock (${product.stockQty})` : 'Out of Stock'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/product/${product.slug}`)}
                  className="text-left font-display font-semibold text-slate-950 hover:text-blue-700 line-clamp-2"
                >
                  {product.name}
                </button>
                <div className="flex items-baseline gap-2 pt-1 font-mono tabular-nums">
                  {isQuoteOnly ? (
                    <span className="text-sm font-bold text-[#0B1B3B] font-sans">Contact for Price</span>
                  ) : (
                    <>
                      <span className="text-base font-bold text-slate-950">
                        ₹{activePrice.toLocaleString('en-IN')}
                      </span>
                      {product.discountPriceInr !== null && product.discountPriceInr < product.priceInr && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{product.priceInr.toLocaleString('en-IN')}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => navigate(`/product/${product.slug}`)}
                className="flex-1 py-2 px-3 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {isQuoteOnly ? 'Explore Model' : 'Details'}
              </button>
              {isQuoteOnly ? (
                <button
                  onClick={() => navigate(`/product/${product.slug}#quote`)}
                  className="flex-1 py-2 px-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold"
                >
                  Request Quote
                </button>
              ) : (
                <button
                  disabled={product.stockQty <= 0}
                  onClick={() => addToCart(product, 1, product.availableVariants[0], product.availableColors[0])}
                  className="flex-1 py-2 px-3 bg-[#0B1B3B] hover:bg-[#132954] text-white rounded-lg text-xs font-semibold disabled:opacity-40"
                >
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderSection = (sec: HomepageSectionConfig) => {
    if (!sec.visible) return null;

    switch (sec.type) {
      case 'hero':
        return (
          <section key={sec.id} className="bg-[#0B1B3B] text-white border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                <div className="text-xs font-medium text-blue-300 tracking-wide font-mono">
                  {sec.kicker ||
                    `KRASHIVANTRI Drones · Nagpur, Maharashtra · CIN ${company?.cin || 'U30305ME2026PTC474052'}`}
                </div>
                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] text-balance">
                  {sec.heading || 'KRASHIVANTRI Drones, Components & Engineering.'}
                </h1>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                  {sec.subheading ||
                    'Precision agricultural drone hardware, IoT field telemetry, FPV and UAV components, custom 3D printing, and engineering project development engineered in Nagpur.'}
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <button
                    onClick={() => navigate(sec.primaryCtaLink || '/krashivantri')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    {sec.primaryCtaLabel || 'Explore KRASHIVANTRI Drones'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(sec.secondaryCtaLink || '/shop')}
                    className="px-6 py-3 border border-slate-600 hover:border-blue-400 text-slate-100 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
                  >
                    {sec.secondaryCtaLabel || 'Browse Online Store'}
                  </button>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="relative h-72 sm:h-96 lg:h-full min-h-[340px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
                  <img
                    src={sec.imageUrl || HERO_IMG}
                    alt="NexusTekFusion KRASHIVANTRI engineering laboratory with agricultural drone, PCB testing bench, and robotic actuator"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3B]/85 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-200 flex flex-wrap items-center gap-2">
                    <span>KRASHIVANTRI Agricultural UAVs</span>
                    <span aria-hidden="true">·</span>
                    <span>FPV &amp; Electronics Store</span>
                    <span aria-hidden="true">·</span>
                    <span>PCB &amp; 3D Printing</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'company_intro':
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-b border-slate-200 pb-16">
              <div className="lg:col-span-5 space-y-4">
                <div className="text-xs font-semibold text-blue-700">
                  {sec.kicker || 'NEXUSTEKFUSION PRIVATE LIMITED'}
                </div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-[#0B1B3B] text-balance">
                  {sec.heading || 'Transforming Ideas into Reality'}
                </h2>
                <p className="text-slate-600 leading-relaxed">
                  {sec.body ||
                    'NexusTekFusion Private Limited unites KRASHIVANTRI precision agricultural drone hardware, FPV & UAV component sourcing, and end-to-end engineering R&D and prototyping from our Nagpur facility.'}
                </p>
                <button
                  onClick={() => navigate(sec.primaryCtaLink || '/about')}
                  className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
                >
                  {sec.primaryCtaLabel || 'Read company profile'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                  <h3 className="font-display font-semibold text-[#0B1B3B]">KRASHIVANTRI Agri-UAVs</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    KRASHIVANTRI X and KRASHIVANTRI X PRO precision spraying platforms built for Indian agricultural conditions.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                  <h3 className="font-display font-semibold text-[#0B1B3B]">FPV &amp; Drone Components</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Industrial flight controllers, ESC stacks, BLDC motors, telemetry radios, and replacement assemblies ready to ship.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                  <h3 className="font-display font-semibold text-[#0B1B3B]">Engineering R&amp;D Execution</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Custom industrial and academic builds with 14-category itemized quotations, milestone tracking, and verified deliverables.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                  <h3 className="font-display font-semibold text-[#0B1B3B]">PCB &amp; 3D Print Prototyping</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Multi-layer PCB layout, Gerber review, automated STL/OBJ 3D slicing, and PA12-CF / PETG / SLA manufacturing.
                  </p>
                </div>
              </div>
            </div>
          </section>
        );

      case 'categories':
        if (categories.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-blue-700">{sec.kicker || 'Hardware Taxonomy'}</div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {sec.heading || 'Explore Store Categories'}
                </h2>
                {sec.subheading && <p className="text-sm text-slate-600 max-w-2xl">{sec.subheading}</p>}
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
              >
                All Categories <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.filter((c) => c.storeScope === 'general').slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/shop/category/${cat.slug}`)}
                  className="text-left rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-600 transition-colors space-y-1.5"
                >
                  <div className="font-display font-bold text-sm text-slate-950">{cat.name}</div>
                  <p className="text-xs text-slate-600 line-clamp-2">{cat.description}</p>
                </button>
              ))}
            </div>
          </section>
        );

      case 'featured_products':
        if (featuredProducts.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-blue-700">{sec.kicker || 'Hardware & Components Store'}</div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {sec.heading || 'Featured Products'}
                </h2>
              </div>
              <button
                onClick={() => navigate(sec.primaryCtaLink || '/shop')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
              >
                {sec.primaryCtaLabel || 'Browse Full Store'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {renderProductGrid(featuredProducts)}
          </section>
        );

      case 'bestsellers':
        if (bestsellerProducts.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-blue-700">{sec.kicker || 'High-Demand Hardware'}</div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {sec.heading || 'Best-Selling Components'}
                </h2>
              </div>
              <button
                onClick={() => navigate(sec.primaryCtaLink || '/shop')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
              >
                {sec.primaryCtaLabel || 'View Store'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {renderProductGrid(bestsellerProducts.slice(0, 4))}
          </section>
        );

      case 'new_arrivals':
        if (newArrivalProducts.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-blue-700">{sec.kicker || 'Latest Inventory'}</div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {sec.heading || 'New Arrivals'}
                </h2>
              </div>
              <button
                onClick={() => navigate(sec.primaryCtaLink || '/shop')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
              >
                {sec.primaryCtaLabel || 'Shop New Hardware'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {renderProductGrid(newArrivalProducts.slice(0, 4))}
          </section>
        );

      case 'agri_fpv_showcase':
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-[#0B1B3B] text-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center space-y-5">
                <div className="text-xs font-mono font-semibold text-blue-300">
                  {sec.kicker || 'KRASHIVANTRI AGRICULTURAL DRONES'}
                </div>
                <h2 className="font-display text-3xl font-bold text-balance">
                  {sec.heading || 'KRASHIVANTRI X & KRASHIVANTRI X PRO'}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {sec.subheading ||
                    'Flagship precision spraying UAV platforms engineered by NexusTekFusion, paired with connected mobile apps and direct spare parts support.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {(krashiCatalog?.models || [
                    { id: 'krashivantri-x', name: 'KRASHIVANTRI X', tagline: 'Smart Agriculture. Precision Spraying.' },
                    { id: 'krashivantri-x-pro', name: 'KRASHIVANTRI X PRO', tagline: 'Advanced Intelligence. Precision Agriculture.' },
                  ]).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => navigate(`/product/${m.id}`)}
                      className="text-left rounded-xl border border-slate-700 bg-slate-900/60 hover:border-blue-400 p-4 transition-colors space-y-1"
                    >
                      <div className="font-display font-bold text-sm text-white">{m.name}</div>
                      <div className="text-xs text-blue-300">{m.tagline}</div>
                      <div className="text-[11px] font-semibold text-slate-300 pt-1 inline-flex items-center gap-1">
                        Explore Model <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate(sec.primaryCtaLink || '/krashivantri')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
                  >
                    {sec.primaryCtaLabel || 'Compare Models'} <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(sec.secondaryCtaLink || '/shop/category/agri-drone-components')}
                    className="px-5 py-2.5 border border-slate-600 hover:border-blue-400 text-slate-100 text-sm font-semibold rounded-lg"
                  >
                    {sec.secondaryCtaLabel || 'Shop Agri-Drone Parts'}
                  </button>
                </div>
              </div>
              <div className="lg:col-span-6 min-h-[280px] bg-slate-900">
                <img
                  src={sec.imageUrl || DRONE_IMG}
                  alt="KRASHIVANTRI Agricultural and FPV Drone Systems"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </section>
        );

      case 'services': {
        const dynamicServices = settings.servicesCatalog?.length
          ? settings.servicesCatalog.filter((s) => s.visible)
          : null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-blue-700">{sec.kicker || 'Engineering Capabilities'}</div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {sec.heading || 'Our Core Services'}
                </h2>
              </div>
              <button
                onClick={() => navigate(sec.primaryCtaLink || '/services')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
              >
                {sec.primaryCtaLabel || 'View All Services'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {dynamicServices
                ? dynamicServices.map((svc, idx) => (
                    <button
                      key={svc.slug}
                      onClick={() => navigate(`/services/${svc.slug}`)}
                      className="text-left group rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-600 transition-colors flex flex-col justify-between space-y-5"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                          <span>{String(idx + 1).padStart(2, '0')}</span>
                          <ShieldCheck className="w-4 h-4 text-blue-700" />
                        </div>
                        <h3 className="font-display text-base font-bold text-slate-950 group-hover:text-blue-700 transition-colors">
                          {svc.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{svc.shortDesc}</p>
                      </div>
                      <span className="text-xs font-semibold text-blue-700 inline-flex items-center gap-1">
                        {svc.ctaLabel || 'Explore'} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  ))
                : SERVICE_CARDS.map((svc) => {
                    const Icon = svc.icon;
                    return (
                      <button
                        key={svc.to}
                        onClick={() => navigate(svc.to)}
                        className="text-left group rounded-xl border border-slate-200 bg-white p-6 hover:border-blue-600 transition-colors flex flex-col justify-between space-y-5"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                            <span>{svc.num}</span>
                            <Icon className="w-4 h-4 text-blue-700" />
                          </div>
                          <h3 className="font-display text-base font-bold text-slate-950 group-hover:text-blue-700 transition-colors">
                            {svc.title}
                          </h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{svc.summary}</p>
                        </div>
                        <span className="text-xs font-semibold text-blue-700 inline-flex items-center gap-1">
                          Explore <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </button>
                    );
                  })}
            </div>
          </section>
        );
      }

      case 'printing_and_projects':
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
              <div className="aspect-[16/9] bg-slate-100">
                <img
                  src={PRINT_IMG}
                  alt="Industrial 3D printer fabricating planetary gear assembly"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-blue-700">On-Demand Additive Manufacturing</div>
                  <h2 className="font-display text-2xl font-bold text-slate-950">
                    Turn Your 3D Designs Into Reality.
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Upload STL, OBJ, 3MF, or STEP files, inspect your geometry in our interactive 3D viewport, choose FDM or SLA materials, receive automated slicing estimates, and order online.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => navigate('/services/3d-printing')}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
                  >
                    Upload Your 3D Model <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-[#0B1B3B] text-white overflow-hidden flex flex-col">
              <div className="aspect-[16/9] bg-slate-900">
                <img
                  src={DRONE_IMG}
                  alt="Custom agricultural drone hardware prototype"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-blue-300">Engineering R&amp;D &amp; Academic Projects</div>
                  <h2 className="font-display text-2xl font-bold">
                    Project Enquiry &amp; Quotation
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    From final-year B.E./B.Tech hardware-software builds to industrial R&amp;D prototypes in AI, IoT, Robotics, and UAVs — submit specifications, receive itemized quotations, and track milestones online.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => navigate('/project-enquiry')}
                    className="px-5 py-2.5 bg-white text-[#0B1B3B] hover:bg-slate-100 text-sm font-semibold rounded-lg inline-flex items-center gap-2"
                  >
                    Submit Project Enquiry <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        );

      case 'krashivantri_apps': {
        const apps = settings.appLinks || [];
        if (apps.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-blue-700">{sec.kicker || 'Mobile Ecosystem'}</div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {sec.heading || 'KRASHIVANTRI Android Applications'}
                </h2>
                {sec.subheading && <p className="text-sm text-slate-600 max-w-2xl">{sec.subheading}</p>}
              </div>
              <button
                onClick={() => navigate(sec.primaryCtaLink || '/krashivantri')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
              >
                {sec.primaryCtaLabel || 'Open KRASHIVANTRI Page'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {apps.map((app) => (
                <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-blue-700 font-semibold">
                      <span>{app.role}</span>
                      <Smartphone className="w-4 h-4 text-slate-400" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-950">{app.name}</h3>
                    <p className="text-sm text-slate-600">{app.description}</p>
                  </div>
                  {app.comingSoon || (!app.playStoreUrl && !app.apkDownloadUrl) ? (
                    <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-fit">
                      Coming Soon on Google Play
                    </div>
                  ) : (
                    <a
                      href={app.playStoreUrl || app.apkDownloadUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg w-fit inline-flex items-center gap-1.5"
                    >
                      Get App <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'case_studies':
        if (caseStudies.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="text-xs font-semibold text-blue-700">{sec.kicker || 'Applied Engineering'}</div>
                <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                  {sec.heading || 'Engineering R&D & Academic Projects'}
                </h2>
              </div>
              <button
                onClick={() => navigate(sec.primaryCtaLink || '/projects')}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1.5"
              >
                {sec.primaryCtaLabel || 'View All Projects'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {caseStudies.slice(0, 4).map((cs) => (
                <div key={cs.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="aspect-[16/9] bg-slate-100">
                      <img
                        src={cs.imageUrl || ROBOT_IMG}
                        alt={cs.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="text-xs text-slate-500">{cs.relatedServices.join(' · ')}</div>
                      <h3 className="font-display text-xl font-bold text-slate-950">{cs.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{cs.description}</p>
                      <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                        <div>
                          <span className="font-semibold text-slate-900">Technologies:</span> {cs.technologyUsed}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Applications:</span> {cs.applications}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-5">
                    <button
                      onClick={() => navigate(`/projects/${cs.slug}`)}
                      className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      View Project Details <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'testimonials': {
        const list = settings.testimonials || [];
        if (list.length === 0) return null;
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-blue-700">{sec.kicker || 'Verified Client Feedback'}</div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                {sec.heading || 'Engineering & Store Feedback'}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {list.map((t, idx) => (
                <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <p className="text-sm text-slate-700 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="font-semibold text-slate-950">{t.name}</span> · {t.role} ({t.org})
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      }

      case 'why_us':
        return (
          <section key={sec.id} className="bg-slate-100 border-y border-slate-200 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-2">
                  <div className="text-xs font-semibold text-blue-700">
                    {sec.kicker || 'Why Choose NexusTekFusion'}
                  </div>
                  <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                    {sec.heading || 'Built for Engineering Execution'}
                  </h2>
                </div>
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                  {[
                    ['Engineering-Focused', 'Every engagement starts with technical feasibility, BOM review, and clear deliverables.'],
                    ['Customized Solutions', 'Hardware, firmware, and software tailored precisely to your operational parameters.'],
                    ['Hardware + Software', 'Unified PCB, mechanical CAD, embedded firmware, and cloud/AI dashboards.'],
                    ['In-House Prototyping', 'Rapid FDM/SLA 3D printing and electronics bench validation under one roof.'],
                    ['Transparent Quotations', 'Itemized estimates, revision tracking, and milestone-based project visibility.'],
                    ['Dedicated Support', 'Direct engineer assignment and structured support tickets from our Nagpur lab.'],
                  ].map(([title, body]) => (
                    <div key={title} className="space-y-1.5">
                      <h3 className="font-display font-semibold text-slate-950">{title}</h3>
                      <p className="text-slate-600 leading-relaxed">{body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-10 space-y-4">
                <div className="text-xs font-semibold text-blue-700">Our Engineering Workflow</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {[
                    '01. Requirement',
                    '02. Research',
                    '03. Design',
                    '04. Development',
                    '05. Prototyping',
                    '06. Testing',
                    '07. Delivery',
                  ].map((step) => (
                    <div
                      key={step}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-900 text-center"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        );

      case 'cta':
        return (
          <section key={sec.id} className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl bg-[#0B1B3B] text-white p-8 sm:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  {sec.heading || "Have an Idea? Let's Build It Together."}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base">
                  {sec.subheading ||
                    'Share your engineering specification, CAD model, PCB Gerber files, or KRASHIVANTRI drone & bulk hardware requirement with our Nagpur team.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <button
                  onClick={() => navigate(sec.primaryCtaLink || '/project-enquiry')}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg whitespace-nowrap"
                >
                  {sec.primaryCtaLabel || 'Start a Project'}
                </button>
                <button
                  onClick={() => navigate(sec.secondaryCtaLink || '/contact')}
                  className="px-5 py-3 border border-slate-600 hover:border-blue-400 text-white text-sm font-semibold rounded-lg whitespace-nowrap"
                >
                  {sec.secondaryCtaLabel || 'Contact Our Team'}
                </button>
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-24">
      {previewDraft && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs font-semibold text-amber-900">
          Draft Layout Preview Mode — Only visible to authenticated Administrators until published.
        </div>
      )}
      {layoutList.map((sec) => renderSection(sec))}
    </div>
  );
};
