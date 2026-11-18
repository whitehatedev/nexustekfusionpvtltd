/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { AboutPage, FaqPage, PolicyPage } from './pages/AboutAndLegalPages';
import { ServicesOverviewPage, ServiceDetailPage, PcbServicePage } from './pages/ServicesPages';
import { Printing3DPage } from './pages/Printing3DPage';
import { ShopListingPage, ProductDetailPage, CartPage, CheckoutPage } from './pages/ShopPages';
import { ProjectsShowcasePage, ProjectDetailPage, ProjectEnquiryPage } from './pages/ProjectsAndEnquiryPages';
import { B2BPortalPage } from './pages/B2BPage';
import { BlogsListPage, BlogDetailPage, ContactPage, TrackOrderPage } from './pages/BlogsAndContactPages';
import { CustomerDashboardPage } from './pages/CustomerDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { KrashivantriPage } from './pages/KrashivantriPage';
import { CustomCmsPage } from './pages/CustomCmsPage';
import { WebsiteEditorPage } from './pages/WebsiteEditorPage';

const SERVICE_SLUGS = new Set([
  'ai-ml',
  'drone-development',
  'robotics',
  'iot-embedded',
  'automation',
]);

const AppRouter: React.FC = () => {
  const { path, navigate } = usePlatform();
  const normalized = path !== '/' && path.endsWith('/') ? path.slice(0, -1) : path;

  const renderRoute = () => {
    if (normalized === '/') return <HomePage />;
    if (normalized === '/about') return <AboutPage />;
    if (normalized === '/services') return <ServicesOverviewPage />;
    if (normalized === '/services/pcb-design') return <PcbServicePage />;
    if (normalized === '/services/3d-printing') return <Printing3DPage />;

    if (normalized.startsWith('/services/')) {
      const slug = normalized.replace('/services/', '');
      if (SERVICE_SLUGS.has(slug)) {
        return <ServiceDetailPage slug={slug} />;
      }
    }

    if (normalized === '/projects') return <ProjectsShowcasePage />;
    if (normalized.startsWith('/projects/')) {
      const slug = decodeURIComponent(normalized.replace('/projects/', ''));
      return <ProjectDetailPage slug={slug} />;
    }
    if (normalized === '/project-enquiry') return <ProjectEnquiryPage />;

    if (normalized === '/krashivantri') return <KrashivantriPage />;

    if (normalized === '/shop') return <ShopListingPage />;
    if (normalized.startsWith('/shop/category/')) {
      const slug = decodeURIComponent(normalized.replace('/shop/category/', ''));
      return <ShopListingPage categorySlug={slug} />;
    }
    if (normalized.startsWith('/product/')) {
      const slug = decodeURIComponent(normalized.replace('/product/', ''));
      return <ProductDetailPage slug={slug} />;
    }
    if (normalized.startsWith('/products/')) {
      const slug = decodeURIComponent(normalized.replace('/products/', ''));
      return <ProductDetailPage slug={slug} />;
    }
    if (normalized.startsWith('/p/')) {
      const slug = decodeURIComponent(normalized.replace('/p/', ''));
      return <CustomCmsPage slug={slug} />;
    }
    if (normalized === '/store/3d-printed-products') return <ShopListingPage scope="3d_printed" />;
    if (normalized === '/sale') return <ShopListingPage saleOnly />;

    if (normalized === '/b2b') return <B2BPortalPage />;
    if (normalized === '/blogs') return <BlogsListPage />;
    if (normalized.startsWith('/blogs/')) {
      const slug = decodeURIComponent(normalized.replace('/blogs/', ''));
      return <BlogDetailPage slug={slug} />;
    }

    if (normalized === '/contact') return <ContactPage />;
    if (normalized === '/faq') return <FaqPage />;
    if (normalized === '/shipping-policy') {
      return <PolicyPage type="shipping" title="Shipping Policy" />;
    }
    if (normalized === '/return-refund-policy') {
      return <PolicyPage type="returnRefund" title="Return & Refund Policy" />;
    }
    if (normalized === '/privacy-policy') {
      return <PolicyPage type="privacy" title="Privacy Policy" />;
    }
    if (normalized === '/terms-and-conditions') {
      return <PolicyPage type="terms" title="Terms & Conditions" />;
    }

    if (normalized === '/my-account') return <CustomerDashboardPage />;
    if (normalized === '/my-account/project-enquiries') {
      return <CustomerDashboardPage initialTab="projects" />;
    }
    if (normalized === '/cart') return <CartPage />;
    if (normalized === '/checkout') return <CheckoutPage />;
    if (normalized === '/track-order') return <TrackOrderPage />;
    if (normalized === '/admin/login') return <AdminLoginPage />;
    if (normalized === '/admin' || normalized === '/admin/dashboard') return <AdminDashboardPage />;
    if (normalized === '/admin/website-editor') return <WebsiteEditorPage />;
    if (normalized === '/admin/project-enquiries' || normalized === '/admin/projects') {
      return <AdminDashboardPage initialTab="projects" />;
    }
    if (normalized === '/admin/project-settings') {
      return <AdminDashboardPage initialTab="project_settings" />;
    }
    if (normalized === '/admin/settings/payments') {
      return <AdminDashboardPage initialTab="payment_settings" />;
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-5">
        <div className="font-mono text-xs text-slate-500">404 — Route Not Found</div>
        <h1 className="font-display text-3xl font-bold text-slate-950">
          Page Not Available
        </h1>
        <p className="text-sm text-slate-600">
          The requested path <span className="font-mono text-slate-800">{normalized}</span> does not match an active page on NexusTekFusion.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
          >
            Back to Home
          </button>
          <button
            onClick={() => navigate('/shop')}
            className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50"
          >
            Browse Engineering Store
          </button>
        </div>
      </div>
    );
  };

  return <Layout>{renderRoute()}</Layout>;
};

export default function App() {
  return (
    <PlatformProvider>
      <AppRouter />
    </PlatformProvider>
  );
}
