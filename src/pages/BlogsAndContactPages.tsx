import React, { useEffect, useState } from 'react';
import { MapPin, Mail, Clock, Search, CheckCircle2 } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { BlogPost } from '../types/platform';

export const BlogsListPage: React.FC = () => {
  const { blogs, navigate } = usePlatform();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="text-xs font-semibold text-blue-700">Knowledge Base</div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">
          Engineering Articles & Technical Guides
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogs.map((post) => (
          <button
            key={post.id}
            onClick={() => navigate(`/blogs/${post.slug}`)}
            className="text-left rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-blue-600 transition-colors flex flex-col"
          >
            <div className="aspect-[16/10] bg-slate-100">
              <img
                src={post.coverImageUrl}
                alt={post.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 space-y-2 flex-1">
              <div className="text-xs text-slate-500">
                {post.category} · {new Date(post.publishedAt).toLocaleDateString('en-IN')}
              </div>
              <h2 className="font-display text-lg font-bold text-slate-950">{post.title}</h2>
              <p className="text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export const BlogDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { apiFetch, navigate } = usePlatform();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ blog: BlogPost }>(`/api/blogs/${slug}`)
      .then((d) => setPost(d.blog))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, apiFetch]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-14 text-sm text-slate-500">Loading article...</div>;
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-14 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Article Not Found</h1>
        <button onClick={() => navigate('/blogs')} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm">
          Back to Blogs
        </button>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-6">
      <div className="text-xs text-slate-500">
        {post.category} · {new Date(post.publishedAt).toLocaleDateString('en-IN')}
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-950">{post.title}</h1>
      <div className="aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        <img src={post.coverImageUrl} alt={post.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
      </div>
      <div className="text-slate-700 leading-relaxed whitespace-pre-line text-base">{post.content}</div>
    </article>
  );
};

export const ContactPage: React.FC = () => {
  const { settings, dbUser, apiFetch, notify } = usePlatform();
  const company = settings.companyInfo;
  const [form, setForm] = useState({
    name: dbUser?.fullName || '',
    email: dbUser?.email || '',
    mobile: dbUser?.mobile || '',
    subject: '',
    serviceCategory: 'General Engineering',
    message: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [ticketNo, setTicketNo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (attachment) fd.append('attachment', attachment);
      const res = await apiFetch<{ ticket: { ticketNumber: string } }>('/api/contact', {
        method: 'POST',
        body: fd,
      });
      setTicketNo(res.ticket.ticketNumber);
      notify(`Support ticket ${res.ticket.ticketNumber} created.`, 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to send message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="text-xs font-semibold text-blue-700">Contact & Support</div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">Get in Touch</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 text-sm">
            <h2 className="font-display font-bold text-lg text-slate-950">
              {company?.legalName || 'NEXUSTEKFUSION PRIVATE LIMITED'}
            </h2>
            <div className="flex items-start gap-3 text-slate-600">
              <MapPin className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
              <span>{company?.address}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{company?.email || 'info@nexustekfusion.in'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Clock className="w-4 h-4 text-blue-700 shrink-0" />
              <span>{company?.businessHours}</span>
            </div>
            {company?.contactPhone && (
              <div className="text-slate-700 font-mono">Phone: {company.contactPhone}</div>
            )}
            {company?.whatsappNumber && (
              <a
                href={`https://wa.me/${company.whatsappNumber.replace(/[^0-9]/g, '')}`}
                className="inline-block px-4 py-2 bg-[#0B1B3B] text-white text-xs font-semibold rounded-lg"
              >
                WhatsApp Support
              </a>
            )}
            <a
              href="https://www.google.com/maps/search/?api=1&query=Ganjipeth+Nagpur+440018+Maharashtra+India"
              target="_blank"
              rel="noreferrer"
              className="block text-xs font-semibold text-blue-700 hover:underline pt-2"
            >
              Open Nagpur Location in Google Maps →
            </a>
          </div>
        </div>

        <div className="lg:col-span-7">
          {ticketNo ? (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 space-y-3">
              <div className="flex items-center gap-2 font-display text-xl font-bold text-[#0B1B3B]">
                <CheckCircle2 className="w-6 h-6 text-blue-700" /> Enquiry Received — {ticketNo}
              </div>
              <p className="text-sm text-slate-700">
                Your enquiry has been logged in our support system. Our team will respond via email and your customer dashboard.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
              <h2 className="font-display font-bold text-lg text-slate-950">Send an Enquiry</h2>
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
                  placeholder="Email *"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <input
                  placeholder="Mobile Number"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <select
                  value={form.serviceCategory}
                  onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                >
                  {[
                    'General Engineering',
                    'AI & Machine Learning',
                    'Drone Development',
                    'Robotics & Automation',
                    'PCB Design',
                    '3D Printing',
                    'Store / Order Support',
                  ].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <input
                required
                placeholder="Subject *"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <textarea
                required
                rows={4}
                placeholder="How can our engineering team help? *"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
              />
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                className="text-xs text-slate-600"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Submit Enquiry'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const TrackOrderPage: React.FC = () => {
  const { apiFetch } = usePlatform();
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await apiFetch(`/api/track-order?code=${encodeURIComponent(code.trim())}`);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || 'Order not found.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 space-y-8">
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="text-xs font-semibold text-blue-700">Order & Shipment Tracking</div>
        <h1 className="font-display text-3xl font-bold text-slate-950">Track Order or Project</h1>
        <p className="text-sm text-slate-600">
          Enter your Store Order (`NTF-ORD-...`), 3D Print Order (`NTF-3DP-...`), Project Code (`NTF-PRJ-...`), or Enquiry Number (`NTF-ENQ-...`).
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2">
        <input
          required
          placeholder="Enter reference code (e.g. NTF-ORD-261118-XXXX)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-mono uppercase"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-700 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          {loading ? 'Checking...' : 'Track'}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{error}</div>
      )}

      {result && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="font-mono font-bold text-lg text-slate-950">{result.code}</span>
            <span className="text-xs font-semibold text-blue-700">{result.status}</span>
          </div>
          <div className="text-sm text-slate-600 space-y-1.5">
            {result.title && <div><span className="font-semibold text-slate-900">Title:</span> {result.title}</div>}
            {result.paymentStatus && <div><span className="font-semibold text-slate-900">Payment:</span> {result.paymentStatus}</div>}
            {result.slicingStatus && <div><span className="font-semibold text-slate-900">Slicing:</span> {result.slicingStatus}</div>}
            {result.trackingCourier && (
              <div><span className="font-semibold text-slate-900">Courier:</span> {result.trackingCourier} ({result.trackingId})</div>
            )}
            {result.trackingUrl && (
              <a href={result.trackingUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline text-xs block">
                Open Courier Tracking Link →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
