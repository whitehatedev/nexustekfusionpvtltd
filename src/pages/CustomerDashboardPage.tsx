import React, { useEffect, useState } from 'react';
import {
  Award,
  Bell,
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck2,
  Heart,
  Lock,
  LogOut,
  Navigation,
  Sprout,
  Trash2,
  Truck,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { AddressSelector } from '../components/AddressSelector';
import { RazorpayCheckoutModal } from '../components/RazorpayCheckoutModal';
import {
  downloadClearanceCertificatePdf,
  downloadCompletionCertificatePdf,
  downloadInvoicePdf,
  downloadPaymentReceiptPdf,
  downloadQuotationPdf,
  downloadWorkOrderPdf,
} from '../lib/pdf';
import { AddressData } from '../types/platform';

type TabKey =
  | 'overview'
  | 'profile'
  | 'projects'
  | 'printing'
  | 'orders'
  | 'pcb_b2b'
  | 'finance'
  | 'wishlist'
  | 'support';

const PROJECT_STAGES = [
  'Submitted',
  'Under Review',
  'Technical Review',
  'Quotation Prepared',
  'Quotation Sent',
  'Accepted / Awaiting Payment',
  'Advance Paid / Work Order Issued',
  'In Progress & Testing',
  'Awaiting Final Payment',
  'Payment Cleared – Ready for Handover',
  'Dispatched / Delivered',
  'Completed',
] as const;

function resolveProjectStageIndex(enquiryStatus: string, projectStatus?: string): number {
  const s = (projectStatus || enquiryStatus || 'Submitted').toLowerCase();
  if (s === 'completed' || s === 'handover acknowledged') return 11;
  if (s === 'delivered' || s === 'dispatched' || s === 'ready for delivery') return 10;
  if (s.includes('cleared') || s.includes('ready for handover')) return 9;
  if (s.includes('awaiting final payment')) return 8;
  if (s === 'testing' || s === 'in progress') return 7;
  if (s.includes('advance paid') || s.includes('project started') || s.includes('payment confirmed')) return 6;
  if (s.includes('awaiting payment') || s === 'accepted') return 5;
  if (s === 'quotation sent') return 4;
  if (s === 'quotation prepared') return 3;
  if (s === 'technical review') return 2;
  if (s === 'under review') return 1;
  return 0;
}

export const CustomerDashboardPage: React.FC<{ initialTab?: TabKey }> = ({ initialTab }) => {
  const { dbUser, isSignedIn, openAuthModal, signOut, apiFetch, notify, navigate, settings, isAdmin, getIdToken } =
    usePlatform();
  const [tab, setTab] = useState<TabKey>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ fullName: '', mobile: '', companyOrCollege: '' });
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [modifyQuoteId, setModifyQuoteId] = useState<number | null>(null);
  const [modifyFeedback, setModifyFeedback] = useState('');
  const [payModal, setPayModal] = useState<{
    open: boolean;
    entityType: 'store_order' | 'printing_order' | 'project_quotation' | 'pcb_enquiry' | 'b2b_enquiry';
    entityId: number;
    paymentMode?: 'advance' | 'full' | 'balance';
    title: string;
    amountInr: number;
  } | null>(null);

  const loadDashboard = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/me');
      setData(res);
      setProfileForm({
        fullName: res.user?.fullName || '',
        mobile: res.user?.mobile || '',
        companyOrCollege: res.user?.companyOrCollege || '',
      });
    } catch (err: any) {
      notify(err?.message || 'Failed to load account.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [isSignedIn]);

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">Customer Account</h1>
        <p className="text-sm text-slate-600">
          Sign in or create an account to manage orders, custom 3D prints, project quotations, invoices, and saved addresses.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg"
        >
          Sign In / Create Account
        </button>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/me', { method: 'PUT', body: JSON.stringify(profileForm) });
      notify('Profile updated.', 'success');
      loadDashboard();
    } catch (err: any) {
      notify(err?.message || 'Update failed.', 'error');
    }
  };

  const respondQuotation = async (
    quotationId: number,
    action: 'accept' | 'modify' | 'reject',
    customFeedback?: string
  ) => {
    try {
      await apiFetch(`/api/quotations/${quotationId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          feedback: customFeedback || (action === 'modify' ? 'Requested revision' : ''),
        }),
      });
      setModifyQuoteId(null);
      setModifyFeedback('');
      notify(
        `Quotation ${
          action === 'accept' ? 'accepted' : action === 'modify' ? 'marked for modification' : 'rejected'
        }.`,
        'success'
      );
      loadDashboard();
    } catch (err: any) {
      notify(err?.message || 'Failed to update quotation.', 'error');
    }
  };

  const deleteAddress = async (id: number) => {
    try {
      await apiFetch(`/api/addresses/${id}`, { method: 'DELETE' });
      notify('Address removed.', 'info');
      loadDashboard();
    } catch (err: any) {
      notify(err?.message || 'Failed to delete address.', 'error');
    }
  };

  const sendTicketReply = async (ticketId: number) => {
    const msg = replyText[ticketId];
    if (!msg?.trim()) return;
    try {
      await apiFetch(`/api/support-tickets/${ticketId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: msg }),
      });
      setReplyText((prev) => ({ ...prev, [ticketId]: '' }));
      notify('Reply sent.', 'success');
      loadDashboard();
    } catch (err: any) {
      notify(err?.message || 'Failed to reply.', 'error');
    }
  };

  const downloadPrivateHandover = async (projectId: number, docId: number, token: string, fileName: string) => {
    try {
      const idToken = await getIdToken();
      const headers: Record<string, string> = {};
      if (idToken) headers.Authorization = `Bearer ${idToken}`;
      const resp = await fetch(
        `/api/projects/${projectId}/handover-documents/${docId}/download?token=${encodeURIComponent(token)}`,
        { headers, credentials: 'same-origin' }
      );
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Download blocked or expired.' }));
        throw new Error(err.error || 'Download failed.');
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      loadDashboard();
    } catch (err: any) {
      notify(err?.message || 'Failed to download deliverable.', 'error');
    }
  };

  const acknowledgeHandover = async (projectId: number) => {
    try {
      const res = await apiFetch<{ completionCertificateNumber: string }>(
        `/api/projects/${projectId}/acknowledge-handover`,
        { method: 'POST' }
      );
      notify(`Handover acknowledged. Completion Certificate ${res.completionCertificateNumber} generated.`, 'success');
      loadDashboard();
    } catch (err: any) {
      notify(err?.message || 'Failed to acknowledge handover.', 'error');
    }
  };

  const unreadCount = (data?.notifications || []).filter((n: any) => !n.isRead).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs font-semibold text-blue-700">Customer Portal</div>
          <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">
            {dbUser?.fullName || dbUser?.email || 'Account'}
          </h1>
          <div className="text-xs text-slate-500 font-mono">
            {dbUser?.email} · Role: {dbUser?.role || 'customer'}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-4 py-2 bg-[#0B1B3B] text-white text-xs font-semibold rounded-lg"
            >
              Open Admin Console
            </button>
          )}
          <button
            onClick={signOut}
            className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 hover:bg-slate-100"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
        {[
          ['overview', 'Overview'],
          ['profile', 'Profile & Addresses'],
          ['projects', 'Projects & Quotations'],
          ['printing', '3D Printing Orders'],
          ['orders', 'Store Orders'],
          ['pcb_b2b', 'PCB & B2B'],
          ['finance', 'Payments & Invoices'],
          ['wishlist', 'Wishlist'],
          ['support', 'Support Tickets'],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k as TabKey)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              tab === k ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="py-12 text-sm text-slate-500">Loading your dashboard...</div>
      ) : (
        <div className="space-y-8">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  ['Project Enquiries', data.projectEnquiries.length],
                  ['Active Projects', data.projects.length],
                  ['3D Printing Orders', data.printingOrders.length],
                  ['Store Orders', data.storeOrders.length],
                ].map(([label, val]) => (
                  <div key={String(label)} className="rounded-xl border border-slate-200 bg-white p-5 space-y-1">
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="font-mono text-2xl font-bold text-slate-950 tabular-nums">{val}</div>
                  </div>
                ))}
              </div>

              {/* KRASHIVANTRI Spraying & Pilot Portal Shortcuts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                      <Sprout className="w-4 h-4" /> KRASHIVANTRI Farmer Portal
                    </div>
                    <div className="text-xs text-slate-600">
                      {data.farmerProfile
                        ? `${data.farmerProfile.farmerCode} · KYC: ${data.farmerProfile.kycStatus}`
                        : 'Register farm plots, draw boundaries & book spraying drones.'}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/krashivantri/farmer-portal')}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                  >
                    Open Farmer Portal
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                      <Navigation className="w-4 h-4" /> KRASHIVANTRI Drone Pilot Portal
                    </div>
                    <div className="text-xs text-slate-600">
                      {data.pilotProfile
                        ? `${data.pilotProfile.pilotCode} · KYC: ${data.pilotProfile.kycStatus}`
                        : 'Enroll DGCA RPC credentials, go online & manage spraying ops.'}
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/krashivantri/pilot-portal')}
                    className="px-4 py-2 bg-[#0B1B3B] hover:bg-blue-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap"
                  >
                    Open Pilot Portal
                  </button>
                </div>
              </div>

              {(data.droneRepairs || []).length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                  <h2 className="font-display font-bold text-slate-950">
                    Drone Repair &amp; Diagnostics Bookings ({data.droneRepairs.length})
                  </h2>
                  <div className="divide-y divide-slate-100 text-xs">
                    {data.droneRepairs.map((dr: any) => (
                      <div key={dr.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-[#0B1B3B]">{dr.referenceNumber}</span> · {dr.droneBrandModel} ({dr.serviceMode})
                          <div className="text-slate-500">{dr.problemDescription}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-semibold text-blue-700">{dr.status}</div>
                          {dr.repairQuotationInr && <div>Quote: ₹{dr.repairQuotationInr.toLocaleString('en-IN')}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display font-bold text-slate-950 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-700" />
                    Notifications & Activity ({unreadCount} unread)
                  </h2>
                </div>
                {data.notifications.length === 0 ? (
                  <p className="text-sm text-slate-500">No recent notifications.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.notifications.map((n: any) => (
                      <div key={n.id} className="py-3 flex items-start justify-between gap-4 text-sm">
                        <div>
                          <div className="font-semibold text-slate-900">{n.title}</div>
                          <div className="text-slate-600 text-xs">{n.message}</div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono shrink-0">
                          {new Date(n.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROFILE & ADDRESSES */}
          {tab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <form
                onSubmit={handleSaveProfile}
                className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-4 h-fit"
              >
                <h2 className="font-display font-bold text-lg text-slate-950">Personal Details</h2>
                <input
                  placeholder="Full Name"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <input
                  placeholder="Mobile Number"
                  value={profileForm.mobile}
                  onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <input
                  placeholder="Company or College Name"
                  value={profileForm.companyOrCollege}
                  onChange={(e) => setProfileForm({ ...profileForm, companyOrCollege: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <button type="submit" className="px-5 py-2.5 bg-blue-700 text-white text-xs font-semibold rounded-lg">
                  Save Profile
                </button>
              </form>

              <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-6 space-y-6">
                <AddressSelector
                  title="Saved Billing & Delivery Addresses"
                  addresses={data.addresses}
                  selected={null}
                  onSelect={() => {}}
                  onAddressSaved={loadDashboard}
                />
                {data.addresses.length > 0 && (
                  <div className="divide-y divide-slate-100 text-xs">
                    {data.addresses.map((a: AddressData & { id: number }) => (
                      <div key={a.id} className="py-3 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-semibold text-slate-900">{a.fullName} · {a.label}</div>
                          <div className="text-slate-600">{a.houseFlat}, {a.streetArea}, {a.city}, {a.state} — {a.pinCode}</div>
                        </div>
                        <button onClick={() => deleteAddress(a.id)} className="text-slate-400 hover:text-red-600 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECTS & QUOTATIONS */}
          {tab === 'projects' && (
            <div className="space-y-8">
              {/* Active Projects, Milestones, Final Balance & Handover */}
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold text-slate-950">Active Projects, Payments &amp; Deliverable Handover</h2>
                {data.projects.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                    No active projects yet. Projects activate automatically once a quotation is accepted and advance payment is verified.
                  </div>
                ) : (
                  data.projects.map((p: any) => {
                    const workOrder = (data.workOrders || []).find((w: any) => w.projectId === p.id);
                    const clearanceCert = (data.clearanceCertificates || []).find((c: any) => c.projectId === p.id);
                    const handoverDocs = (data.handoverDocuments || []).filter((d: any) => d.projectId === p.id);
                    const deliveries = (data.deliveryRecords || []).filter((d: any) => d.projectId === p.id);
                    const payMilestones = (data.paymentMilestones || []).filter(
                      (m: any) => m.projectId === p.id || (p.quotationId && m.quotationId === p.quotationId)
                    );
                    const customerEmail = dbUser?.email || '';

                    return (
                      <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="font-mono text-xs text-blue-700 font-semibold">{p.projectCode}</div>
                            <h3 className="font-display text-lg font-bold text-slate-950">{p.title}</h3>
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-semibold text-slate-900">
                              Status: {p.status} · Engineer: {p.assignedEngineer}
                            </div>
                            <div className="font-mono text-slate-600 tabular-nums mt-0.5">
                              Total ₹{Number(p.totalAmountInr || 0).toLocaleString('en-IN')} · Paid ₹
                              {Number(p.paidAmountInr || 0).toLocaleString('en-IN')} · Balance ₹
                              {Number(p.balanceAmountInr || 0).toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        {/* Balance Due Banner */}
                        {Number(p.balanceAmountInr || 0) > 0 && p.quotationId && (
                          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-xs text-amber-950 space-y-0.5">
                              <div className="font-bold">
                                Final Balance Pending: ₹{Number(p.balanceAmountInr).toLocaleString('en-IN')}
                              </div>
                              <div>
                                {p.handoverExceptionAuthorized
                                  ? 'Exception authorized by Super Admin. Complete remaining balance per agreed schedule.'
                                  : 'Complete final payment to unlock gated digital deliverable downloads and issue your Payment Clearance Certificate.'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setPayModal({
                                  open: true,
                                  entityType: 'project_quotation',
                                  entityId: p.quotationId,
                                  paymentMode: 'balance',
                                  title: `Final Balance — ${p.projectCode}`,
                                  amountInr: p.balanceAmountInr,
                                })
                              }
                              className="px-4 py-2 bg-[#0B1B3B] hover:bg-blue-900 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay Remaining Balance ₹
                              {Number(p.balanceAmountInr).toLocaleString('en-IN')}
                            </button>
                          </div>
                        )}

                        {/* Payment Milestones */}
                        {payMilestones.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {payMilestones.map((m: any) => (
                              <div key={m.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs flex justify-between items-center">
                                <div>
                                  <div className="font-semibold text-slate-900">{m.stageName} ({m.percent}%)</div>
                                  <div className="text-[11px] text-slate-500">{m.dueTrigger}</div>
                                </div>
                                <div className="text-right font-mono tabular-nums">
                                  <div className="font-bold text-slate-950">₹{m.amountInr.toLocaleString('en-IN')}</div>
                                  <div className={m.status === 'paid' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                                    {m.status}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Engineering Milestones */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {(p.milestones || []).map((m: any) => (
                            <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs space-y-1">
                              <div className="font-semibold text-slate-900">{m.title}</div>
                              <div className="text-blue-700 font-medium">{m.status}</div>
                              {m.notes && <div className="text-slate-600">{m.notes}</div>}
                            </div>
                          ))}
                        </div>

                        {/* Official Project Documents & Handover Deliverables */}
                        <div className="flex flex-wrap gap-2">
                          {workOrder && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadWorkOrderPdf({
                                  workOrderNumber: workOrder.workOrderNumber,
                                  projectCode: p.projectCode,
                                  projectTitle: p.title,
                                  assignedEngineer: workOrder.assignedEngineer || p.assignedEngineer,
                                  estimatedCompletionDate: workOrder.estimatedCompletionDate,
                                  scopeSummary: workOrder.scopeSummary,
                                  issuedAt: workOrder.issuedAt,
                                  customerEmail,
                                })
                              }
                              className="px-3 py-1.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-700" /> Work Order ({workOrder.workOrderNumber})
                            </button>
                          )}

                          {clearanceCert && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadClearanceCertificatePdf({
                                  certificateNumber: clearanceCert.certificateNumber,
                                  projectCode: p.projectCode,
                                  projectTitle: p.title,
                                  totalAmountInr: clearanceCert.totalAmountInr,
                                  advancePaidInr: clearanceCert.advancePaidInr,
                                  finalPaidInr: clearanceCert.finalPaidInr,
                                  balanceInr: clearanceCert.balanceInr,
                                  paymentRefs: clearanceCert.paymentRefs || [],
                                  issuedAt: clearanceCert.issuedAt,
                                  issuedBy: clearanceCert.issuedBy,
                                  customerEmail,
                                })
                              }
                              className="px-3 py-1.5 border border-emerald-300 bg-emerald-50 text-emerald-950 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5 text-emerald-700" /> Payment Clearance Cert ({clearanceCert.certificateNumber})
                            </button>
                          )}

                          {p.completionCertificateNumber && (
                            <button
                              type="button"
                              onClick={() =>
                                downloadCompletionCertificatePdf({
                                  certificateNumber: p.completionCertificateNumber,
                                  projectCode: p.projectCode,
                                  projectTitle: p.title,
                                  acknowledgedBy: p.customerAcknowledgedBy || customerEmail,
                                  acknowledgedAt: p.customerAcknowledgedAt || new Date().toISOString(),
                                  assignedEngineer: p.assignedEngineer || 'NexusTekFusion Engineering',
                                })
                              }
                              className="px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-950 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-blue-700" /> Completion Cert ({p.completionCertificateNumber})
                            </button>
                          )}
                        </div>

                        {/* Gated Deliverables Vault */}
                        {handoverDocs.length > 0 && (
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                            <div className="font-semibold text-[#0B1B3B] flex items-center gap-1.5">
                              {p.handoverUnlocked ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <Lock className="w-4 h-4 text-amber-700" />
                              )}
                              Project Deliverable Vault ({handoverDocs.length} files)
                            </div>
                            <div className="divide-y divide-slate-200">
                              {handoverDocs.map((doc: any) => (
                                <div key={doc.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <div className="font-semibold text-slate-900">
                                      {doc.title} ({doc.versionLabel})
                                    </div>
                                    <div className="font-mono text-[11px] text-slate-500">
                                      {doc.fileName} · Category: {doc.category}
                                    </div>
                                  </div>
                                  {doc.unlocked && doc.downloadToken ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        downloadPrivateHandover(p.id, doc.id, doc.downloadToken, doc.fileName)
                                      }
                                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded font-semibold inline-flex items-center gap-1"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Download
                                    </button>
                                  ) : (
                                    <span className="font-mono text-[11px] text-amber-800 inline-flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> Locked until balance cleared
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Courier Dispatch & Handover Acknowledgment */}
                        {(deliveries.length > 0 || p.trackingId) && (
                          <div className="text-xs text-slate-700 font-mono flex items-center gap-2">
                            <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                            <span>
                              Dispatch:{' '}
                              {deliveries[0]
                                ? `${deliveries[0].courierName} · AWB ${deliveries[0].trackingNumber} (${deliveries[0].dispatchDate})`
                                : `${p.trackingCourier} · ${p.trackingId}`}
                            </span>
                          </div>
                        )}

                        {p.handoverUnlocked && !p.customerAcknowledgedAt && (
                          <button
                            type="button"
                            onClick={() => acknowledgeHandover(p.id)}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Acknowledge Deliverable Receipt &amp; Issue Completion Certificate
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Project Enquiries & Quotations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-slate-950">Project Enquiries & Quotations</h2>
                  <button
                    onClick={() => navigate('/project-enquiry')}
                    className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
                  >
                    New Project Enquiry
                  </button>
                </div>
                {data.projectEnquiries.map((enq: any) => {
                  const enqQuotes = (data.quotations || []).filter((q: any) => q.enquiryId === enq.id);
                  const linkedProject = (data.projects || []).find((p: any) => p.enquiryId === enq.id);
                  const stageIdx = resolveProjectStageIndex(enq.status, linkedProject?.status);
                  return (
                    <div key={enq.id} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="font-mono text-xs text-slate-500">
                            {enq.enquiryNumber} · {enq.engineeringBranch}
                            {linkedProject ? ` · Project ${linkedProject.projectCode}` : ''}
                          </div>
                          <h3 className="font-display font-bold text-slate-950">{enq.projectTitle}</h3>
                        </div>
                        <span className="text-xs font-semibold text-blue-700">
                          {linkedProject?.status || enq.status}
                        </span>
                      </div>

                      {/* 12-Stage Visual Progress Tracker */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span>12-Stage Project Lifecycle</span>
                          <span>Stage {stageIdx + 1} / {PROJECT_STAGES.length}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5">
                          {PROJECT_STAGES.map((stageName, idx) => {
                            const reached = idx <= stageIdx;
                            const isCurrent = idx === stageIdx;
                            return (
                              <div
                                key={stageName}
                                className={`px-2 py-1.5 rounded-lg border text-[10px] leading-tight ${
                                  isCurrent
                                    ? 'border-blue-700 bg-blue-50 text-blue-950 font-semibold'
                                    : reached
                                    ? 'border-blue-200 bg-blue-50/40 text-blue-900'
                                    : 'border-slate-200 bg-slate-50 text-slate-400'
                                }`}
                              >
                                <div className="font-mono text-[9px]">{idx + 1}.</div>
                                <div className="truncate" title={stageName}>{stageName}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <p className="text-sm text-slate-600">{enq.projectDescription}</p>

                      {enq.rejectionReason && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-900">
                          <span className="font-semibold">Enquiry Declined Reason:</span> {enq.rejectionReason}
                        </div>
                      )}
                      {enq.clarificationNotes && (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                          <span className="font-semibold">Engineering Clarification Needed:</span> {enq.clarificationNotes}
                        </div>
                      )}

                      {enqQuotes.map((q: any) => {
                        const paidSoFar = Number(q.paidAmountInr || 0);
                        const remainingInr = Math.max(0, q.totalAmountInr - paidSoFar);
                        return (
                          <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-semibold text-slate-950">
                                Quotation Rev #{q.revisionNumber} · Status: {q.status} · Payment: {q.paymentStatus || 'pending'}
                              </span>
                              <span className="font-mono font-bold text-slate-950 tabular-nums">
                                Total ₹{q.totalAmountInr.toLocaleString('en-IN')} · Paid ₹{paidSoFar.toLocaleString('en-IN')} · Balance ₹{remainingInr.toLocaleString('en-IN')}
                              </span>
                            </div>
                            {(q.estimatedDuration || q.paymentTerms) && (
                              <div className="text-[11px] text-slate-600 flex flex-wrap gap-4">
                                {q.estimatedDuration && <span>Duration: {q.estimatedDuration}</span>}
                                {q.validityDays && <span>Validity: {q.validityDays} days</span>}
                                {q.paymentTerms && <span>Terms: {q.paymentTerms}</span>}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  downloadQuotationPdf({
                                    enquiryNumber: enq.enquiryNumber,
                                    projectTitle: enq.projectTitle,
                                    customerName: enq.customerName,
                                    customerEmail: enq.customerEmail,
                                    quotation: q,
                                    gstin: settings.companyInfo?.gstin,
                                  })
                                }
                                className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg font-semibold inline-flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" /> Download PDF
                              </button>

                              {q.status === 'Sent' && (
                                <>
                                  <button
                                    onClick={() => respondQuotation(q.id, 'accept')}
                                    className="px-3 py-1.5 bg-blue-700 text-white rounded-lg font-semibold"
                                  >
                                    Accept Quotation
                                  </button>
                                  <button
                                    onClick={() => {
                                      setModifyQuoteId(modifyQuoteId === q.id ? null : q.id);
                                      setModifyFeedback('');
                                    }}
                                    className="px-3 py-1.5 border border-amber-500 text-amber-800 bg-amber-50 rounded-lg font-semibold"
                                  >
                                    Request Modification
                                  </button>
                                  <button
                                    onClick={() => respondQuotation(q.id, 'reject')}
                                    className="px-3 py-1.5 border border-red-300 text-red-700 rounded-lg font-semibold"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {q.status === 'Accepted' && remainingInr > 0 && (
                                <>
                                  {paidSoFar === 0 ? (
                                    <>
                                      <button
                                        onClick={() =>
                                          setPayModal({
                                            open: true,
                                            entityType: 'project_quotation',
                                            entityId: q.id,
                                            paymentMode: 'advance',
                                            title: `Advance Payment — ${enq.enquiryNumber}`,
                                            amountInr: q.advanceAmountInr,
                                          })
                                        }
                                        className="px-4 py-1.5 bg-blue-700 text-white rounded-lg font-semibold inline-flex items-center gap-1"
                                      >
                                        <CreditCard className="w-3.5 h-3.5" /> Pay Advance ₹{q.advanceAmountInr.toLocaleString('en-IN')}
                                      </button>
                                      {q.advanceAmountInr < q.totalAmountInr && (
                                        <button
                                          onClick={() =>
                                            setPayModal({
                                              open: true,
                                              entityType: 'project_quotation',
                                              entityId: q.id,
                                              paymentMode: 'full',
                                              title: `Full Payment — ${enq.enquiryNumber}`,
                                              amountInr: q.totalAmountInr,
                                            })
                                          }
                                          className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold inline-flex items-center gap-1"
                                        >
                                          <CreditCard className="w-3.5 h-3.5" /> Pay Full ₹{q.totalAmountInr.toLocaleString('en-IN')}
                                        </button>
                                      )}
                                    </>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        setPayModal({
                                          open: true,
                                          entityType: 'project_quotation',
                                          entityId: q.id,
                                          paymentMode: 'balance',
                                          title: `Balance Payment — ${enq.enquiryNumber}`,
                                          amountInr: remainingInr,
                                        })
                                      }
                                      className="px-4 py-1.5 bg-blue-700 text-white rounded-lg font-semibold inline-flex items-center gap-1"
                                    >
                                      <CreditCard className="w-3.5 h-3.5" /> Pay Balance ₹{remainingInr.toLocaleString('en-IN')}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            {modifyQuoteId === q.id && (
                              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                                <input
                                  placeholder="Describe required changes (components, budget, timeline)..."
                                  value={modifyFeedback}
                                  onChange={(e) => setModifyFeedback(e.target.value)}
                                  className="flex-1 min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => respondQuotation(q.id, 'modify', modifyFeedback)}
                                  className="px-3 py-1.5 bg-amber-700 text-white rounded-lg font-semibold"
                                >
                                  Send Revision Request
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3D PRINTING ORDERS */}
          {tab === 'printing' && (
            <div className="space-y-4">
              {data.printingOrders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center space-y-3">
                  <p className="text-sm text-slate-500">No 3D printing orders yet.</p>
                  <button
                    onClick={() => navigate('/services/3d-printing')}
                    className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
                  >
                    Upload a 3D Model
                  </button>
                </div>
              ) : (
                data.printingOrders.map((po: any) => (
                  <div key={po.id} className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="font-mono text-xs text-slate-500">
                          {po.orderNumber} · {po.technology} · {po.materialName} ({po.colorName})
                        </div>
                        <div className="font-display font-bold text-slate-950">{po.fileName}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-slate-950">₹{po.totalInr.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-blue-700">{po.orderStatus} · {po.paymentStatus}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span>Layer: {po.layerHeightMm} mm</span>
                      <span>Infill: {po.infillPercent}%</span>
                      <span>Qty: {po.quantity}</span>
                      {po.trackingId && <span className="font-mono">Tracking: {po.trackingCourier} ({po.trackingId})</span>}
                    </div>
                    {po.paymentStatus !== 'paid' && !po.pricingBreakdown?.technicalReviewRequired && (
                      <button
                        onClick={() =>
                          setPayModal({
                            open: true,
                            entityType: 'printing_order',
                            entityId: po.id,
                            title: `3D Print ${po.orderNumber}`,
                            amountInr: po.totalInr,
                          })
                        }
                        className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Pay Now
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* STORE ORDERS */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {data.storeOrders.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                  No store orders placed yet.
                </div>
              ) : (
                data.storeOrders.map((ord: any) => (
                  <div key={ord.id} className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-950">{ord.orderNumber}</div>
                        <div className="text-xs text-slate-500">{new Date(ord.createdAt).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-slate-950">₹{ord.totalInr.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-blue-700">{ord.orderStatus} · {ord.paymentStatus}</div>
                      </div>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      {ord.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.name} × {it.qty}</span>
                          <span className="font-mono">₹{it.lineTotalInr.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>
                    {ord.trackingId && (
                      <div className="text-xs font-mono text-slate-700 pt-1">
                        Tracking: {ord.trackingCourier} · {ord.trackingId}
                      </div>
                    )}
                    {ord.paymentStatus !== 'paid' && (
                      <button
                        onClick={() =>
                          setPayModal({
                            open: true,
                            entityType: 'store_order',
                            entityId: ord.id,
                            title: `Order ${ord.orderNumber}`,
                            amountInr: ord.totalInr,
                          })
                        }
                        className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
                      >
                        Complete Payment
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* PCB & B2B */}
          {tab === 'pcb_b2b' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h2 className="font-display font-bold text-lg text-slate-950">PCB Enquiries</h2>
                {data.pcbEnquiries.map((pcb: any) => (
                  <div key={pcb.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="font-mono">{pcb.enquiryNumber}</span>
                      <span className="text-blue-700">{pcb.status}</span>
                    </div>
                    <div className="text-slate-600">
                      {pcb.boardDimensionsMm} · {pcb.layerCount} Layers · Qty {pcb.boardQuantity}
                    </div>
                    {pcb.quotedAmountInr && (
                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-mono font-bold text-sm">Quote: ₹{pcb.quotedAmountInr.toLocaleString('en-IN')}</span>
                        {pcb.paymentStatus !== 'paid' && (
                          <button
                            onClick={() =>
                              setPayModal({
                                open: true,
                                entityType: 'pcb_enquiry',
                                entityId: pcb.id,
                                title: `PCB Order ${pcb.enquiryNumber}`,
                                amountInr: pcb.quotedAmountInr,
                              })
                            }
                            className="px-3 py-1.5 bg-blue-700 text-white rounded-lg font-semibold"
                          >
                            Pay Quote
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h2 className="font-display font-bold text-lg text-slate-950">B2B Bulk Enquiries</h2>
                {data.b2bEnquiries.map((b2b: any) => (
                  <div key={b2b.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="font-mono">{b2b.enquiryNumber}</span>
                      <span className="text-blue-700">{b2b.status}</span>
                    </div>
                    <div className="text-slate-900 font-semibold">{b2b.companyName} · {b2b.requirementCategory} (Qty {b2b.quantity})</div>
                    {b2b.quotedAmountInr && (
                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-mono font-bold text-sm">Quote: ₹{b2b.quotedAmountInr.toLocaleString('en-IN')}</span>
                        {b2b.paymentStatus !== 'paid' && (
                          <button
                            onClick={() =>
                              setPayModal({
                                open: true,
                                entityType: 'b2b_enquiry',
                                entityId: b2b.id,
                                title: `B2B Order ${b2b.enquiryNumber}`,
                                amountInr: b2b.quotedAmountInr,
                              })
                            }
                            className="px-3 py-1.5 bg-blue-700 text-white rounded-lg font-semibold"
                          >
                            Pay Quote
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FINANCE */}
          {tab === 'finance' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <h2 className="font-display font-bold text-lg text-slate-950">Payment History</h2>
                {data.payments.length === 0 ? (
                  <p className="text-sm text-slate-500">No payments recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {data.payments.map((p: any) => (
                      <div key={p.id} className="py-3 flex justify-between">
                        <div>
                          <div className="font-mono font-semibold text-slate-950">{p.paymentRef}</div>
                          <div className="text-slate-500">{p.entityType} · {p.mode === 'test_mode' ? 'Sandbox Test Mode' : 'Razorpay'}</div>
                        </div>
                        <div className="text-right font-mono">
                          <div className="font-bold">₹{p.amountInr.toLocaleString('en-IN')}</div>
                          <div className="text-blue-700 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {p.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                <h2 className="font-display font-bold text-lg text-slate-950">Invoices &amp; Official Receipts</h2>
                {(data.receipts || []).length > 0 && (
                  <div className="space-y-2 pb-3 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-700">Verified Payment Receipts</div>
                    <div className="divide-y divide-slate-100 text-xs">
                      {data.receipts.map((rcp: any) => (
                        <div key={rcp.id} className="py-2 flex items-center justify-between gap-2">
                          <div>
                            <span className="font-mono font-semibold text-[#0B1B3B]">{rcp.receiptNumber}</span> ·{' '}
                            <span className="text-slate-500">
                              {rcp.paymentStage} · ₹{Number(rcp.amountInr).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              downloadPaymentReceiptPdf({
                                receiptNumber: rcp.receiptNumber,
                                paymentRef: rcp.paymentRef,
                                razorpayPaymentId: rcp.razorpayPaymentId,
                                paymentStage: rcp.paymentStage,
                                amountInr: rcp.amountInr,
                                issuedAt: rcp.issuedAt,
                                customerEmail: dbUser?.email || '',
                                referenceCode: rcp.payload?.projectCode || rcp.paymentRef,
                              })
                            }
                            className="px-3 py-1 border border-slate-300 rounded-lg font-semibold inline-flex items-center gap-1 hover:bg-slate-50"
                          >
                            <Download className="w-3 h-3" /> Receipt PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.invoices.length === 0 ? (
                  <p className="text-sm text-slate-500">No invoices issued yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {data.invoices.map((inv: any) => (
                      <div key={inv.id} className="py-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-mono font-semibold text-slate-950">{inv.invoiceNumber}</div>
                          <div className="text-slate-500">{inv.docType} · ₹{inv.amountInr.toLocaleString('en-IN')}</div>
                        </div>
                        <button
                          onClick={() =>
                            downloadInvoicePdf({
                              invoiceNumber: inv.invoiceNumber,
                              docType: inv.docType,
                              entityType: inv.entityType,
                              amountInr: inv.amountInr,
                              gstInr: inv.gstInr,
                              issuedAt: inv.issuedAt,
                              customerEmail: dbUser?.email || '',
                              gstin:
                                settings.projectSettings?.enableGstTax && settings.companyInfo?.gstin
                                  ? settings.companyInfo.gstin
                                  : undefined,
                              payload: inv.payload || {},
                            })
                          }
                          className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold inline-flex items-center gap-1 hover:bg-slate-50"
                        >
                          <Download className="w-3.5 h-3.5" /> Invoice PDF
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WISHLIST */}
          {tab === 'wishlist' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.wishlist.length === 0 ? (
                <div className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Your wishlist is empty.
                </div>
              ) : (
                data.wishlist.map((prod: any) => (
                  <button
                    key={prod.id}
                    onClick={() => navigate(`/product/${prod.slug}`)}
                    className="text-left rounded-xl border border-slate-200 bg-white overflow-hidden"
                  >
                    <img src={prod.imageUrl} alt={prod.name} referrerPolicy="no-referrer" className="w-full aspect-[4/3] object-cover" />
                    <div className="p-4 space-y-1">
                      <div className="font-display font-semibold text-sm">{prod.name}</div>
                      <div className="font-mono text-xs font-bold">₹{(prod.discountPriceInr ?? prod.priceInr).toLocaleString('en-IN')}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {/* SUPPORT TICKETS */}
          {tab === 'support' && (
            <div className="space-y-4">
              {data.supportTickets.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                  No support tickets yet. Visit Contact to open a ticket.
                </div>
              ) : (
                data.supportTickets.map((t: any) => (
                  <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-mono text-xs text-slate-500">{t.ticketNumber} · {t.serviceCategory}</span>
                        <h3 className="font-display font-bold text-slate-950">{t.subject}</h3>
                      </div>
                      <span className="text-xs font-semibold text-blue-700">{t.status}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      {(t.messages || []).map((m: any, i: number) => (
                        <div key={i} className={`p-3 rounded-lg ${m.role === 'admin' ? 'bg-blue-50 text-blue-950' : 'bg-slate-50 text-slate-800'}`}>
                          <div className="font-semibold">{m.sender} ({m.role})</div>
                          <div className="mt-0.5">{m.text}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Write a reply..."
                        value={replyText[t.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [t.id]: e.target.value })}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs"
                      />
                      <button
                        onClick={() => sendTicketReply(t.id)}
                        className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {payModal && (
        <RazorpayCheckoutModal
          open={payModal.open}
          onClose={() => setPayModal(null)}
          entityType={payModal.entityType}
          entityId={payModal.entityId}
          paymentMode={payModal.paymentMode}
          title={payModal.title}
          amountInr={payModal.amountInr}
          onSuccess={loadDashboard}
        />
      )}
    </div>
  );
};
