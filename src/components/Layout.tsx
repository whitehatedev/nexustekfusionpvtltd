import React, { useState } from 'react';
import { Menu, Search, ShoppingBag, User, X, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

const COMPANY_LOGO_SRC = '/assets/aistudio/image_1a5ac752.png';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    path,
    navigate,
    settings,
    cart,
    fbUser,
    dbUser,
    isSignedIn,
    isAdmin,
    signInWithGoogle,
    apiFetch,
    notify,
    publishedPages,
  } = usePlatform();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSending, setNewsletterSending] = useState(false);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const announcement = settings.announcementBar;
  const company = settings.companyInfo;
  const socials = company?.socialLinks;

  const navItems = (
    settings.navigationMenus?.header && settings.navigationMenus.header.length > 0
      ? settings.navigationMenus.header
      : [
          { id: 'krashivantri', label: 'KRASHIVANTRI', to: '/krashivantri', visible: true, sortOrder: 1 },
          { id: 'services', label: 'Services', to: '/services', visible: true, sortOrder: 2 },
          { id: 'printing', label: '3D Printing', to: '/services/3d-printing', visible: true, sortOrder: 3 },
          { id: 'shop', label: 'Shop', to: '/shop', visible: true, sortOrder: 4 },
          { id: 'projects', label: 'Projects', to: '/projects', visible: true, sortOrder: 5 },
        ]
  )
    .filter((i) => i.visible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const go = (to: string) => {
    setDrawerOpen(false);
    setSearchOpen(false);
    navigate(to);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    go(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSending(true);
    try {
      await apiFetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail.trim(), source: 'footer' }),
      });
      setNewsletterEmail('');
      notify('Subscribed to NexusTekFusion updates.', 'success');
    } catch (err: any) {
      notify(err?.message || 'Subscription failed.', 'error');
    } finally {
      setNewsletterSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      {/* Slim Editable Announcement Bar (<= 40px) */}
      {announcement?.enabled && !bannerDismissed && (
        <div className="bg-[#0B1B3B] text-slate-100 border-b border-blue-950 px-4 h-9 flex items-center justify-between text-xs">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-center gap-3 truncate">
            <span className="truncate">{announcement.text}</span>
            {announcement.link && (
              <button
                onClick={() => go(announcement.link)}
                className="text-sky-300 hover:text-sky-200 font-medium underline underline-offset-2 whitespace-nowrap shrink-0"
              >
                {announcement.ctaLabel || 'Explore'}
              </button>
            )}
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss announcement"
            className="text-slate-400 hover:text-white p-1 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Lockup (Official Logo + Wordmark) */}
          <button
            onClick={() => go('/')}
            className="inline-flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-[#0B1B3B] whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
          >
            <img
              src={COMPANY_LOGO_SRC}
              alt="NexusTekFusion Logo"
              className="h-8 w-8 object-contain shrink-0"
            />
            <span>{company?.brandName || 'NexusTekFusion'}</span>
          </button>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600">
            {navItems.map((item) => {
              const active = path === item.to || (item.to !== '/' && path.startsWith(item.to + '/'));
              return (
                <button
                  key={item.id || item.to}
                  onClick={() => go(item.to)}
                  className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    active
                      ? 'border-blue-700 text-[#0B1B3B] font-semibold'
                      : 'border-transparent hover:text-[#0B1B3B] hover:border-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action + Compact Utility Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search store"
              className="p-2 text-slate-600 hover:text-[#0B1B3B] rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={() => go('/cart')}
              aria-label="Shopping cart"
              className="relative p-2 text-slate-600 hover:text-[#0B1B3B] rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-medium"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="font-mono tabular-nums">{cartCount}</span>
            </button>

            <button
              onClick={() => (isSignedIn ? go('/my-account') : signInWithGoogle())}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-[#0B1B3B] hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <User className="w-3.5 h-3.5" />
              <span>{isSignedIn ? 'Account' : 'Sign In'}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => go('/admin/dashboard')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}

            <button
              onClick={() => go('/project-enquiry')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1B3B] hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <span>Start Project</span>
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open full navigation menu"
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Expandable Search Bar */}
        {searchOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search KRASHIVANTRI drones, flight controllers, ESP32, 3D printed parts, or SKUs..."
                className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:border-blue-600"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#0B1B3B] text-white text-sm font-medium rounded-lg hover:bg-blue-800 whitespace-nowrap"
              >
                Search
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Slide-Over Complete Platform Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
          <div className="w-full max-w-md bg-white h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2.5">
                  <img src={COMPANY_LOGO_SRC} alt="NexusTekFusion" className="h-7 w-7 object-contain" />
                  <span className="font-display font-bold text-lg text-[#0B1B3B]">Navigation</span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-400">Company & Services</div>
                  {[
                    ['Home', '/'],
                    ['KRASHIVANTRI Drones', '/krashivantri'],
                    ['KRASHIVANTRI X', '/product/krashivantri-x'],
                    ['KRASHIVANTRI X PRO', '/product/krashivantri-x-pro'],
                    ['About Us', '/about'],
                    ['All Services', '/services'],
                    ['AI & Machine Learning', '/services/ai-ml'],
                    ['Drone Development', '/services/drone-development'],
                    ['Robotics', '/services/robotics'],
                    ['IoT & Embedded', '/services/iot-embedded'],
                    ['Automation', '/services/automation'],
                    ['PCB Services', '/services/pcb-design'],
                    ['Custom 3D Printing', '/services/3d-printing'],
                  ].map(([label, to]) => (
                    <button
                      key={to}
                      onClick={() => go(to)}
                      className="block text-left text-slate-700 hover:text-blue-700 py-0.5"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-400">Store & Portals</div>
                  {[
                    ['Online Store', '/shop'],
                    ['3D Printed Products', '/store/3d-printed-products'],
                    ['Offers & Sale', '/sale'],
                    ['Engineering Projects', '/projects'],
                    ['Project Enquiry', '/project-enquiry'],
                    ['B2B / Bulk Orders', '/b2b'],
                    ['Blogs & Articles', '/blogs'],
                    ['Track Order', '/track-order'],
                    ['Contact & Support', '/contact'],
                    ['FAQs', '/faq'],
                  ].map(([label, to]) => (
                    <button
                      key={to}
                      onClick={() => go(to)}
                      className="block text-left text-slate-700 hover:text-blue-700 py-0.5"
                    >
                      {label}
                    </button>
                  ))}
                  {publishedPages.map((pg) => (
                    <button
                      key={pg.id}
                      onClick={() => go(`/p/${pg.slug}`)}
                      className="block text-left text-slate-700 hover:text-blue-700 py-0.5"
                    >
                      {pg.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <button
                  onClick={() => (isSignedIn ? go('/my-account') : signInWithGoogle())}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-sm font-medium text-slate-900 hover:bg-slate-50 flex items-center justify-between"
                >
                  <span>
                    {isSignedIn
                      ? `My Account (${dbUser?.email || fbUser?.email})`
                      : 'Customer Sign In (Google)'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                {isAdmin ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => go('/admin/dashboard')}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0B1B3B] text-white text-sm font-medium hover:bg-blue-900 flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-sky-400" />
                        Admin Control Panel
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <button
                        onClick={() => go('/admin/website-editor')}
                        className="py-2 px-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-left"
                      >
                        Visual Editor
                      </button>
                      <button
                        onClick={() => go('/admin/project-enquiries')}
                        className="py-2 px-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-left"
                      >
                        Project Quotes
                      </button>
                      <button
                        onClick={() => go('/admin/settings/payments')}
                        className="py-2 px-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-left"
                      >
                        Razorpay
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => go('/admin/login')}
                    className="w-full py-2.5 px-4 rounded-lg bg-slate-100 text-slate-800 text-sm font-medium hover:bg-slate-200 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-500" />
                      Admin Login Portal
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">{company?.legalName}</div>
              <div>CIN: {company?.cin}</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Authoritative Industrial Navy Footer */}
      <footer className="bg-[#0B1B3B] text-slate-300 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src={COMPANY_LOGO_SRC}
                alt="NexusTekFusion Logo"
                className="h-9 w-9 object-contain bg-white rounded-md p-1 shrink-0"
              />
              <div className="font-display text-base font-bold text-white leading-tight">
                {company?.legalName || 'NEXUSTEKFUSION PRIVATE LIMITED'}
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {company?.primaryTagline || 'Transforming Ideas into Reality'} —{' '}
              {company?.secondaryTagline || 'Engineering the Future with Intelligence'}.
            </p>
            <div className="text-xs text-slate-400 space-y-1 pt-2 font-mono">
              <div>CIN: {company?.cin || 'U30305ME2026PTC474052'}</div>
              {company?.gstin && <div>GSTIN: {company.gstin}</div>}
              <div>Founder & CEO: {company?.founderCeo || 'Sahil Prakash Bhagat'}</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="font-semibold text-white">KRASHIVANTRI & Services</div>
            <ul className="space-y-2 text-slate-400">
              {[
                ['KRASHIVANTRI Drones', '/krashivantri'],
                ['KRASHIVANTRI X', '/product/krashivantri-x'],
                ['KRASHIVANTRI X PRO', '/product/krashivantri-x-pro'],
                ['AI & Machine Learning', '/services/ai-ml'],
                ['Agricultural & Custom Drones', '/services/drone-development'],
                ['Robotics & Automation', '/services/robotics'],
                ['IoT & Embedded Systems', '/services/iot-embedded'],
                ['PCB Design & Fabrication', '/services/pcb-design'],
                ['Custom 3D Printing', '/services/3d-printing'],
                ['Project Enquiry & Quotation', '/project-enquiry'],
              ].map(([label, to]) => (
                <li key={to}>
                  <button onClick={() => go(to)} className="hover:text-white transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 text-sm">
            <div className="font-semibold text-white">Store & Support</div>
            <ul className="space-y-2 text-slate-400">
              {[
                ['Engineering Online Store', '/shop'],
                ['3D Printed Products', '/store/3d-printed-products'],
                ['Engineering R&D Projects', '/projects'],
                ['Offers & Sale', '/sale'],
                ['B2B & Bulk Orders', '/b2b'],
                ['Track Order', '/track-order'],
                ['Engineering Blogs', '/blogs'],
                ['FAQs', '/faq'],
              ].map(([label, to]) => (
                <li key={to}>
                  <button onClick={() => go(to)} className="hover:text-white transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 text-sm">
            <div className="font-semibold text-white">Registered Office & Newsletter</div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {company?.address ||
                'H NO. 565/19 NIT, SANKUL NEW COTTON MARK, Ganjipeth, Nagpur 440018, Maharashtra, India'}
            </p>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Email: {company?.email || 'info@nexustekfusion.in'}</div>
              {company?.contactPhone && <div>Phone: {company.contactPhone}</div>}
              <div>Hours: {company?.businessHours || 'Mon–Sat, 10:00 AM – 7:00 PM IST'}</div>
            </div>

            <form onSubmit={handleNewsletter} className="space-y-2 pt-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-sky-400" /> Engineering Updates & Product Launches
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={newsletterSending}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold whitespace-nowrap disabled:opacity-50"
                >
                  {newsletterSending ? '...' : 'Subscribe'}
                </button>
              </div>
            </form>

            <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <button onClick={() => go('/shipping-policy')} className="hover:text-white">
                Shipping Policy
              </button>
              <button onClick={() => go('/return-refund-policy')} className="hover:text-white">
                Returns
              </button>
              <button onClick={() => go('/privacy-policy')} className="hover:text-white">
                Privacy
              </button>
              <button onClick={() => go('/terms-and-conditions')} className="hover:text-white">
                Terms
              </button>
              {socials?.linkedin && (
                <a href={socials.linkedin} target="_blank" rel="noreferrer" className="hover:text-white">
                  LinkedIn
                </a>
              )}
              {socials?.youtube && (
                <a href={socials.youtube} target="_blank" rel="noreferrer" className="hover:text-white">
                  YouTube
                </a>
              )}
              {socials?.instagram && (
                <a href={socials.instagram} target="_blank" rel="noreferrer" className="hover:text-white">
                  Instagram
                </a>
              )}
              {socials?.github && (
                <a href={socials.github} target="_blank" rel="noreferrer" className="hover:text-white">
                  GitHub
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 py-5 px-4 sm:px-6 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              © {new Date().getFullYear()} {company?.legalName || 'NEXUSTEKFUSION PRIVATE LIMITED'}. All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <button onClick={() => go('/contact')} className="hover:text-white">
                Contact
              </button>
              {isAdmin ? (
                <>
                  <button onClick={() => go('/admin/website-editor')} className="text-sky-400 hover:text-sky-300">
                    Website Editor
                  </button>
                  <button onClick={() => go('/admin/dashboard')} className="text-blue-400 hover:text-blue-300">
                    Admin Console
                  </button>
                </>
              ) : (
                <button onClick={() => go('/admin/login')} className="text-slate-400 hover:text-white">
                  Admin Login
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
