import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { and, eq } from 'drizzle-orm';
import { db } from './src/db/index.ts';
import { blogs, caseStudies, cmsPages, paymentWebhookEvents, products } from './src/db/schema.ts';
import { publicRouter } from './src/server/routes/public.ts';
import { customerRouter } from './src/server/routes/customer.ts';
import { adminRouter } from './src/server/routes/admin.ts';
import { authRouter } from './src/server/routes/auth.ts';
import { krashivantriRouter } from './src/server/routes/krashivantri.ts';
import { verifyWebhookSignature } from './src/server/razorpay.ts';
import { ensureUploadDirs, UPLOADS_ROOT } from './src/server/utils.ts';
import { ensureInitialSeed } from './src/server/seed.ts';

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  ensureUploadDirs();
  ensureInitialSeed().catch((err) => {
    console.error('Startup seed check failed:', err);
  });

  // Razorpay Webhook (raw body required for HMAC signature verification & idempotency)
  const handleRazorpayWebhook = async (req: express.Request, res: express.Response) => {
    const signature = String(req.headers['x-razorpay-signature'] || '');
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    if (!(await verifyWebhookSignature(rawBody, signature))) {
      return res.status(400).json({ error: 'Invalid Razorpay webhook signature.' });
    }
    try {
      const payload = JSON.parse(rawBody || '{}');
      const paymentEntity = payload?.payload?.payment?.entity;
      const eventType = String(payload?.event || 'payment.event');
      const eventId = String(
        req.headers['x-razorpay-event-id'] ||
          `${paymentEntity?.id || Date.now()}_${eventType}`
      );
      const existing = await db
        .select()
        .from(paymentWebhookEvents)
        .where(eq(paymentWebhookEvents.eventId, eventId))
        .limit(1);
      if (existing.length > 0) {
        return res.json({ received: true, duplicate: true });
      }
      await db.insert(paymentWebhookEvents).values({
        eventId,
        provider: 'razorpay',
        eventType,
        razorpayOrderId: String(paymentEntity?.order_id || ''),
        razorpayPaymentId: String(paymentEntity?.id || ''),
        payload,
        processingStatus: 'processed',
      });
    } catch (err) {
      console.error('Webhook log error:', err);
    }
    res.json({ received: true });
  };

  app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleRazorpayWebhook);
  app.post('/api/webhooks/razorpay', express.raw({ type: 'application/json' }), handleRazorpayWebhook);

  app.use(express.json({ limit: '12mb' }));
  app.use(express.urlencoded({ extended: true, limit: '12mb' }));

  // Serve public CMS media library uploads ONLY (private customer files stay behind /api/files/download)
  app.use('/uploads/media', express.static(path.join(UPLOADS_ROOT, 'media')));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'nexustekfusion-platform' });
  });

  // SEO endpoints
  app.get('/robots.txt', (_req, res) => {
    const base = process.env.APP_URL || 'https://nexustekfusion.in';
    res.type('text/plain').send(
      `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /my-account\nDisallow: /checkout\nSitemap: ${base}/sitemap.xml\n`
    );
  });

  app.get('/sitemap.xml', async (_req, res) => {
    const base = process.env.APP_URL || 'https://nexustekfusion.in';
    const staticRoutes = [
      '/',
      '/about',
      '/services',
      '/services/drone-repair',
      '/track-drone-repair',
      '/services/pcb-design',
      '/services/3d-printing',
      '/krashivantri',
      '/krashivantri/farmer-portal',
      '/krashivantri/pilot-portal',
      '/projects',
      '/project-enquiry',
      '/shop',
      '/store/3d-printed-products',
      '/sale',
      '/b2b',
      '/blogs',
      '/contact',
      '/faq',
      '/shipping-policy',
      '/return-refund-policy',
      '/privacy-policy',
      '/terms-and-conditions',
      '/track-order',
    ];

    try {
      const [prodRows, blogRows, pageRows, projectRows] = await Promise.all([
        db
          .select({ slug: products.slug })
          .from(products)
          .where(and(eq(products.isPublished, true), eq(products.isDeleted, false))),
        db.select({ slug: blogs.slug }).from(blogs).where(eq(blogs.isPublished, true)),
        db.select({ slug: cmsPages.slug }).from(cmsPages).where(eq(cmsPages.status, 'published')),
        db.select({ slug: caseStudies.slug }).from(caseStudies).where(eq(caseStudies.isPublished, true)),
      ]);
      const dynamicUrls = [
        ...prodRows.map((p) => `/product/${p.slug}`),
        ...blogRows.map((b) => `/blogs/${b.slug}`),
        ...projectRows.map((pr) => `/projects/${pr.slug}`),
        ...pageRows.map((pg) => `/p/${pg.slug}`),
      ];
      const allUrls = [...staticRoutes, ...dynamicUrls];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls
        .map((u) => `  <url><loc>${base}${u}</loc></url>`)
        .join('\n')}\n</urlset>`;
      res.type('application/xml').send(xml);
    } catch {
      res.type('application/xml').send(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticRoutes
          .map((u) => `<url><loc>${base}${u}</loc></url>`)
          .join('')}</urlset>`
      );
    }
  });

  // API Routers
  app.use('/api/auth', authRouter);
  app.use('/api', publicRouter);
  app.use('/api', customerRouter);
  app.use('/api', krashivantriRouter);
  app.use('/api/admin', adminRouter);

  // Error handler for multer & API errors
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err?.status || 400).json({ error: err?.message || 'Unexpected server error.' });
  });

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NexusTekFusion server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
