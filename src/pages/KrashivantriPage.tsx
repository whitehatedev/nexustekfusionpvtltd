import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Wrench,
  ShieldCheck,
  FileDown,
  ShoppingBag,
  MessageSquarePlus,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { Product } from '../types/platform';

const COMPARISON_ROWS: Array<{ label: string; keys: string[]; defaultFallback: string }> = [
  { label: 'Drone model', keys: ['Drone model', 'Model'], defaultFallback: 'Model Name' },
  { label: 'Application', keys: ['Application', 'Target Application', 'Applications'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Payload capacity', keys: ['Payload capacity', 'Payload Capacity'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Tank capacity', keys: ['Tank capacity', 'Tank Capacity'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Spraying width', keys: ['Spraying width', 'Spraying Width'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Flight time', keys: ['Flight time', 'Flight Time'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Flight range', keys: ['Flight range', 'Flight Range'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Battery', keys: ['Battery', 'Battery Configuration'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Charging time', keys: ['Charging time', 'Charging Time'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Navigation system', keys: ['Navigation system', 'Navigation System'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Flight controller', keys: ['Flight controller', 'Flight Controller'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Safety features', keys: ['Safety features', 'Safety Features'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Included accessories', keys: ['Included accessories', 'Included Accessories', 'Package Contents'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Warranty', keys: ['Warranty', 'Warranty Support'], defaultFallback: 'Specifications Coming Soon' },
  { label: 'Price', keys: ['Price'], defaultFallback: 'Contact for Price' },
];

export const KrashivantriPage: React.FC = () => {
  const { settings, navigate, apiFetch, notify, isSignedIn, dbUser, addToCart } = usePlatform();
  const catalog = settings.krashivantriCatalog;
  const appLinks = settings.appLinks || [];

  const [flagshipProducts, setFlagshipProducts] = useState<{ x: Product | null; xPro: Product | null }>({
    x: null,
    xPro: null,
  });

  const [enquiryType, setEnquiryType] = useState<
    'Book Demo' | 'Dealer Enquiry' | 'Service & Maintenance' | 'Spare Parts Request' | 'Request Quote'
  >('Book Demo');
  const [form, setForm] = useState({
    name: dbUser?.fullName || '',
    email: dbUser?.email || '',
    mobile: dbUser?.mobile || '',
    location: '',
    modelInterest: 'KRASHIVANTRI X',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      apiFetch<{ product: Product }>('/api/products/krashivantri-x').catch(() => null),
      apiFetch<{ product: Product }>('/api/products/krashivantri-x-pro').catch(() => null),
    ]).then(([r1, r2]) => {
      if (active) {
        setFlagshipProducts({
          x: r1?.product || null,
          xPro: r2?.product || null,
        });
      }
    });
    return () => {
      active = false;
    };
  }, [apiFetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('email', form.email);
      fd.append('mobile', form.mobile);
      fd.append('subject', `KRASHIVANTRI ${enquiryType} — ${form.modelInterest}`);
      fd.append('serviceCategory', 'KRASHIVANTRI');
      fd.append(
        'message',
        `Type: ${enquiryType}\nModel: ${form.modelInterest}\nLocation: ${form.location || 'Not specified'}\n\n${form.message}`
      );
      const res = await apiFetch<{ ticket: { ticketNumber: string } }>('/api/contact', {
        method: 'POST',
        body: fd,
      });
      setTicketNumber(res.ticket.ticketNumber);
      notify(`KRASHIVANTRI enquiry ${res.ticket.ticketNumber} submitted.`, 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to submit enquiry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const models = catalog?.models?.length
    ? catalog.models
    : [
        {
          id: 'krashivantri-x',
          name: 'KRASHIVANTRI X',
          tagline: 'Smart Agriculture. Precision Spraying.',
          summary:
            'Flagship agricultural spraying unmanned aerial vehicle engineered by NEXUSTEKFUSION PRIVATE LIMITED for reliable crop protection and field productivity.',
          imageUrl: '/src/assets/images/service_agri_drone_1794981061744.jpg',
          specs: [],
          highlights: [
            'Engineered by NexusTekFusion for Indian agricultural conditions',
            'Compatible with the KRASHIVANTRI Farmer, Pilot & Buyer digital ecosystem',
          ],
        },
        {
          id: 'krashivantri-x-pro',
          name: 'KRASHIVANTRI X PRO',
          tagline: 'Advanced Intelligence. Precision Agriculture.',
          summary:
            'High-endurance intelligent agricultural drone platform designed for commercial spraying operators, large acreage operations, and fleet telemetry.',
          imageUrl: '/src/assets/images/service_agri_drone_1794981061744.jpg',
          specs: [],
          highlights: [
            'Advanced autonomous operation readiness and fleet diagnostics integration',
            'Enterprise warranty support and Nagpur spares pipeline',
          ],
        },
      ];

  const getComparisonValue = (modelId: string, row: typeof COMPARISON_ROWS[number]): string => {
    const dbProd = modelId === 'krashivantri-x-pro' ? flagshipProducts.xPro : flagshipProducts.x;
    const cmsModel = models.find((m) => m.id === modelId);

    if (row.label === 'Drone model') {
      return dbProd?.name || cmsModel?.name || (modelId === 'krashivantri-x-pro' ? 'KRASHIVANTRI X PRO' : 'KRASHIVANTRI X');
    }
    if (row.label === 'Price') {
      if (dbProd && dbProd.productType !== 'quote_only' && dbProd.priceInr > 0) {
        const eff = dbProd.discountPriceInr !== null && dbProd.discountPriceInr < dbProd.priceInr
          ? dbProd.discountPriceInr
          : dbProd.priceInr;
        return `₹${eff.toLocaleString('en-IN')}`;
      }
      return 'Contact for Price';
    }
    if (row.label === 'Application' && dbProd?.applications) {
      return dbProd.applications;
    }
    if (row.label === 'Included accessories' && dbProd?.packageContents?.length) {
      return dbProd.packageContents.join(', ');
    }
    if (row.label === 'Warranty' && dbProd?.warrantyInfo) {
      return dbProd.warrantyInfo;
    }

    // Search DB technicalSpecs
    const specsObj = dbProd?.technicalSpecs || {};
    for (const [k, v] of Object.entries(specsObj)) {
      if (row.keys.some((target) => target.toLowerCase() === k.toLowerCase()) && String(v).trim()) {
        return String(v).trim();
      }
    }

    // Search CMS specs array
    const cmsSpec = cmsModel?.specs?.find((sp) =>
      row.keys.some((target) => target.toLowerCase() === sp.label.trim().toLowerCase())
    );
    if (cmsSpec?.value?.trim()) {
      return cmsSpec.value.trim();
    }

    return row.defaultFallback;
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="bg-[#0B1B3B] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center space-y-5">
            <div className="text-xs font-mono text-blue-300 uppercase tracking-wider">
              KRASHIVANTRI AGRICULTURAL DRONES · NEXUSTEKFUSION PRIVATE LIMITED
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-balance">
              {catalog?.platformName || 'KRASHIVANTRI Agricultural Drone Ecosystem'}
            </h1>
            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              {catalog?.summary ||
                'Precision agricultural UAV hardware, smart field telemetry, and unified Farmer, Pilot, and Buyer operational workflows engineered in Nagpur.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => navigate('/product/krashivantri-x')}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap"
              >
                Explore KRASHIVANTRI X <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate('/product/krashivantri-x-pro')}
                className="px-5 py-2.5 bg-white text-[#0B1B3B] hover:bg-slate-100 text-sm font-semibold rounded-lg inline-flex items-center gap-2 whitespace-nowrap"
              >
                Explore KRASHIVANTRI X PRO <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollToSection('compare')}
                className="px-5 py-2.5 border border-slate-600 hover:border-blue-400 text-white text-sm font-semibold rounded-lg whitespace-nowrap"
              >
                Compare Models
              </button>
              <button
                onClick={() => scrollToSection('krashivantri-enquiry')}
                className="px-5 py-2.5 border border-slate-600 hover:border-blue-400 text-white text-sm font-semibold rounded-lg whitespace-nowrap"
              >
                Enquire Now
              </button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-72 sm:h-96 lg:h-full min-h-[320px] rounded-xl overflow-hidden border border-slate-700 bg-slate-900">
              <img
                src={catalog?.bannerImageUrl || '/src/assets/images/service_agri_drone_1794981061744.jpg'}
                alt="KRASHIVANTRI Agricultural UAV Platform"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1B3B]/85 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-xs text-slate-200 flex flex-wrap gap-2">
                <span>KRASHIVANTRI X</span>
                <span aria-hidden="true">·</span>
                <span>KRASHIVANTRI X PRO</span>
                <span aria-hidden="true">·</span>
                <span>Farmer, Pilot &amp; Buyer Apps</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flagship Aircraft Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-blue-700">Flagship Aircraft Platforms</div>
            <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
              KRASHIVANTRI X &amp; KRASHIVANTRI X PRO
            </h2>
            <p className="text-sm text-slate-600 max-w-2xl">
              Select a flagship drone model to inspect full specifications, gallery media, downloads, and quote or order options.
            </p>
          </div>
          <button
            onClick={() => navigate('/shop/category/agri-drone-components')}
            className="text-sm font-semibold text-blue-700 hover:underline inline-flex items-center gap-1.5 shrink-0"
          >
            Shop Agri-Drone Spare Parts <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {models.map((model) => {
            const dbProd = model.id === 'krashivantri-x-pro' ? flagshipProducts.xPro : flagshipProducts.x;
            const slug = dbProd?.slug || model.id;
            const isDirectBuy = Boolean(dbProd && dbProd.productType !== 'quote_only' && dbProd.priceInr > 0);
            const activePrice = dbProd
              ? dbProd.discountPriceInr !== null && dbProd.discountPriceInr < dbProd.priceInr
                ? dbProd.discountPriceInr
                : dbProd.priceInr
              : 0;
            const brochure = dbProd?.brochureUrl || dbProd?.datasheetUrl;

            return (
              <div key={model.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col shadow-sm">
                <button
                  type="button"
                  onClick={() => navigate(`/product/${slug}`)}
                  className="aspect-[16/9] bg-slate-100 overflow-hidden block w-full"
                >
                  <img
                    src={dbProd?.imageUrl || model.imageUrl || '/src/assets/images/service_agri_drone_1794981061744.jpg'}
                    alt={model.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </button>
                <div className="p-6 sm:p-8 space-y-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono text-blue-700 font-semibold">{model.tagline}</div>
                        <h3 className="font-display text-2xl font-bold text-[#0B1B3B] mt-1">{model.name}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-slate-500 uppercase font-mono">Pricing</div>
                        <div className="font-mono text-base font-bold text-slate-950">
                          {isDirectBuy ? `₹${activePrice.toLocaleString('en-IN')}` : 'Contact for Price'}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">{dbProd?.shortDescription || model.summary}</p>

                    {(dbProd?.features?.length ? dbProd.features : model.highlights)?.length > 0 && (
                      <ul className="space-y-1.5 text-sm text-slate-700">
                        {(dbProd?.features?.length ? dbProd.features : model.highlights).map((h, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <div className="text-xs font-semibold text-slate-900">Published Specifications</div>
                      {dbProd && Object.keys(dbProd.technicalSpecs || {}).length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(dbProd.technicalSpecs).slice(0, 6).map(([label, value]) => (
                            <div key={label} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                              <div className="text-slate-500">{label}</div>
                              <div className="font-mono font-semibold text-slate-950">{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      ) : model.specs && model.specs.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {model.specs.map((sp, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                              <div className="text-slate-500">{sp.label}</div>
                              <div className="font-mono font-semibold text-slate-950">{sp.value}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          Specifications Coming Soon — Official configuration sheets are managed in the Admin Dashboard and sent upon enquiry.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2.5">
                    <button
                      onClick={() => navigate(`/product/${slug}`)}
                      className="px-4 py-2.5 bg-[#0B1B3B] hover:bg-[#132954] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                    >
                      Explore {model.name} <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {isDirectBuy && dbProd ? (
                      <button
                        disabled={dbProd.stockQty <= 0}
                        onClick={() => {
                          addToCart(dbProd, 1);
                          navigate('/checkout');
                        }}
                        className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Buy Now
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setForm((prev) => ({ ...prev, modelInterest: model.name }));
                          setEnquiryType('Request Quote');
                          scrollToSection('krashivantri-enquiry');
                        }}
                        className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                      >
                        <MessageSquarePlus className="w-3.5 h-3.5" /> Request a Quote
                      </button>
                    )}

                    {brochure && (
                      <a
                        href={brochure}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                      >
                        <FileDown className="w-3.5 h-3.5" /> Download Brochure
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 15-Row Model Comparison Matrix */}
      <section id="compare" className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="space-y-2 border-b border-slate-200 pb-4">
          <div className="text-xs font-semibold text-blue-700">Technical Comparison Matrix</div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Compare KRASHIVANTRI Models
          </h2>
          <p className="text-sm text-slate-600">
            Side-by-side specification overview synchronized directly with Admin Product &amp; KRASHIVANTRI Catalog settings.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#0B1B3B] text-white">
                <th className="py-4 px-5 font-display font-semibold text-xs uppercase tracking-wider w-1/4">
                  Specification
                </th>
                <th className="py-4 px-5 font-display font-bold text-base w-[37.5%]">
                  KRASHIVANTRI X
                </th>
                <th className="py-4 px-5 font-display font-bold text-base w-[37.5%]">
                  KRASHIVANTRI X PRO
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {COMPARISON_ROWS.map((row, idx) => {
                const valX = getComparisonValue('krashivantri-x', row);
                const valPro = getComparisonValue('krashivantri-x-pro', row);
                return (
                  <tr key={row.label} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="py-3.5 px-5 font-semibold text-slate-900 text-xs sm:text-sm">
                      {row.label}
                    </td>
                    <td className={`py-3.5 px-5 text-xs sm:text-sm ${valX === 'Specifications Coming Soon' ? 'text-slate-400 italic' : 'text-slate-700 font-medium'}`}>
                      {valX}
                    </td>
                    <td className={`py-3.5 px-5 text-xs sm:text-sm ${valPro === 'Specifications Coming Soon' ? 'text-slate-400 italic' : 'text-slate-700 font-medium'}`}>
                      {valPro}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Android Apps Ecosystem */}
      {appLinks.length > 0 && (
        <section className="bg-slate-100 border-y border-slate-200 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-blue-700">Mobile Software Platform</div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
                Farmer, Drone Pilot &amp; Buyer Android Apps
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Connected mobile software linking agricultural drone operators, farmers, and component procurement.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {appLinks.map((app) => (
                <div key={app.id} className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">{app.role}</span>
                      <Smartphone className="w-4 h-4 text-slate-400" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-950">{app.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{app.description}</p>
                  </div>
                  <div>
                    {app.comingSoon || (!app.playStoreUrl && !app.apkDownloadUrl) ? (
                      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
                        Coming Soon on Google Play
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {app.playStoreUrl && (
                          <a
                            href={app.playStoreUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                          >
                            Google Play Store <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {app.apkDownloadUrl && (
                          <a
                            href={app.apkDownloadUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 border border-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
                          >
                            Download APK
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Demo / Dealer / Service / Spares Enquiry Form */}
      <section id="krashivantri-enquiry" className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-blue-700">Direct Operations Desk</div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-950">
            Book a Demo, Request Quote, Dealer Partnership, or Service Support
          </h2>
        </div>

        {ticketNumber ? (
          <div className="rounded-xl border border-blue-300 bg-blue-50 p-8 space-y-3">
            <div className="flex items-center gap-2 font-display text-xl font-bold text-[#0B1B3B]">
              <CheckCircle2 className="w-6 h-6 text-blue-700" />
              KRASHIVANTRI Request Received — {ticketNumber}
            </div>
            <p className="text-sm text-slate-700">
              Our Nagpur UAV engineering &amp; operations team has logged your request ({enquiryType} · {form.modelInterest}).
            </p>
            {isSignedIn && (
              <button
                onClick={() => navigate('/my-account')}
                className="px-4 py-2 bg-[#0B1B3B] text-white text-xs font-semibold rounded-lg"
              >
                Track Ticket in My Account
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
            <div className="flex flex-wrap gap-2">
              {(
                ['Book Demo', 'Request Quote', 'Dealer Enquiry', 'Service & Maintenance', 'Spare Parts Request'] as const
              ).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEnquiryType(t)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    enquiryType === t
                      ? 'bg-[#0B1B3B] text-white border-[#0B1B3B]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                placeholder="Full Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email Address *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <input
                required
                placeholder="Mobile / WhatsApp Number *"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <input
                placeholder="District / State / Organization"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select
                value={form.modelInterest}
                onChange={(e) => setForm({ ...form, modelInterest: e.target.value })}
                className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
              >
                <option value="KRASHIVANTRI X">KRASHIVANTRI X</option>
                <option value="KRASHIVANTRI X PRO">KRASHIVANTRI X PRO</option>
                <option value="Custom Agricultural UAV / Telemetry">Custom Agricultural UAV / Telemetry</option>
                <option value="Spare Parts / Batteries / Nozzles">Spare Parts / Batteries / Nozzles</option>
              </select>
              <div className="flex items-center gap-2 text-xs text-slate-600 px-2">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>Direct response from NexusTekFusion Nagpur engineering &amp; UAV team.</span>
              </div>
            </div>

            <textarea
              required
              rows={4}
              placeholder="Describe your crop spraying acreage, fleet quantity, service issue, or dealership region..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
            />

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 disabled:opacity-50"
            >
              <Wrench className="w-4 h-4" />
              {submitting ? 'Submitting...' : `Submit ${enquiryType}`}
            </button>
          </form>
        )}
      </section>
    </div>
  );
};
