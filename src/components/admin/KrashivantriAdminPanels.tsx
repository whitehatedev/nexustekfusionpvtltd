import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Gavel,
  Landmark,
  MapPin,
  Navigation,
  RefreshCw,
  ShieldCheck,
  Sprout,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import { GeoMap } from '../GeoMap';
import { downloadKrashivantriReportPdf } from '../../lib/pdf';
import { KrashivantriOpsConfig } from '../../types/platform';

export type KrashivantriAdminSection =
  | 'farmers'
  | 'pilots'
  | 'live_tracking'
  | 'orders_live'
  | 'farmer_payments'
  | 'pilot_payouts'
  | 'penalties'
  | 'finance';

async function downloadAuthedFile(url: string, filename: string, getToken: () => Promise<string | null>) {
  const token = await getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const resp = await fetch(url, { headers, credentials: 'same-origin' });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Download failed.' }));
    throw new Error(err.error || 'Download failed.');
  }
  const blob = await resp.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}

export const KrashivantriAdminWorkspace: React.FC<{
  section: KrashivantriAdminSection;
  isSuperAdmin: boolean;
}> = ({ section, isSuperAdmin }) => {
  const { apiFetch, getIdToken, notify } = usePlatform();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // State per section
  const [farmersData, setFarmersData] = useState<any[]>([]);
  const [farmerNotes, setFarmerNotes] = useState<Record<number, string>>({});

  const [pilotsData, setPilotsData] = useState<any[]>([]);
  const [pilotNotes, setPilotNotes] = useState<Record<number, string>>({});

  const [liveData, setLiveData] = useState<{ pilots: any[]; bookings: any[]; opsConfig?: KrashivantriOpsConfig } | null>(
    null
  );
  const [selectedPilotAssign, setSelectedPilotAssign] = useState<Record<number, string>>({});
  const [verifyAcres, setVerifyAcres] = useState<Record<number, string>>({});
  const [verifyNotes, setVerifyNotes] = useState<Record<number, string>>({});

  const [farmerPaymentsData, setFarmerPaymentsData] = useState<{ payments: any[]; refunds: any[] }>({
    payments: [],
    refunds: [],
  });
  const [refundForm, setRefundForm] = useState({ bookingId: '', amountInr: '', reason: '', providerRefundId: '' });

  const [payoutsData, setPayoutsData] = useState<{ balances: any[]; payouts: any[]; ledger: any[] }>({
    balances: [],
    payouts: [],
    ledger: [],
  });
  const [payoutUtrInputs, setPayoutUtrInputs] = useState<Record<number, string>>({});
  const [initPayoutUtr, setInitPayoutUtr] = useState<Record<number, string>>({});

  const [penaltiesData, setPenaltiesData] = useState<{ penalties: any[]; appeals: any[] }>({
    penalties: [],
    appeals: [],
  });
  const [penaltyForm, setPenaltyForm] = useState({
    targetType: 'pilot',
    targetId: '',
    bookingId: '',
    reasonCategory: 'Late arrival',
    description: '',
    evidenceSummary: '',
    amountInr: '200',
  });
  const [appealDecisionNotes, setAppealDecisionNotes] = useState<Record<number, string>>({});

  const [financeData, setFinanceData] = useState<any>(null);
  const [opsConfig, setOpsConfig] = useState<KrashivantriOpsConfig | null>(null);

  const loadSection = async () => {
    setLoading(true);
    try {
      if (section === 'farmers') {
        const res = await apiFetch<{ farmers: any[] }>('/api/admin/krashivantri/farmers');
        setFarmersData(res.farmers || []);
      } else if (section === 'pilots') {
        const res = await apiFetch<{ pilots: any[] }>('/api/admin/krashivantri/pilots');
        setPilotsData(res.pilots || []);
      } else if (section === 'live_tracking' || section === 'orders_live') {
        const res = await apiFetch<any>('/api/admin/krashivantri/live-tracking');
        setLiveData(res);
      } else if (section === 'farmer_payments') {
        const res = await apiFetch<any>('/api/admin/krashivantri/farmer-payments');
        setFarmerPaymentsData(res);
      } else if (section === 'pilot_payouts') {
        const res = await apiFetch<any>('/api/admin/krashivantri/pilot-payouts');
        setPayoutsData(res);
      } else if (section === 'penalties') {
        const [penRes, fRes, pRes] = await Promise.all([
          apiFetch<any>('/api/admin/krashivantri/penalties'),
          apiFetch<{ farmers: any[] }>('/api/admin/krashivantri/farmers'),
          apiFetch<{ pilots: any[] }>('/api/admin/krashivantri/pilots'),
        ]);
        setPenaltiesData(penRes);
        setFarmersData(fRes.farmers || []);
        setPilotsData(pRes.pilots || []);
      } else if (section === 'finance') {
        const [fRes, cfgRes] = await Promise.all([
          apiFetch<any>('/api/admin/krashivantri/finance'),
          apiFetch<{ config: KrashivantriOpsConfig }>('/api/admin/krashivantri/ops-config'),
        ]);
        setFinanceData(fRes);
        setOpsConfig(cfgRes.config);
      }
    } catch (err: any) {
      notify(err?.message || 'Failed to load KRASHIVANTRI admin data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSection();
  }, [section]);

  // Auto-poll live tracking every 15s
  useEffect(() => {
    if (section !== 'live_tracking' && section !== 'orders_live') return;
    const id = window.setInterval(() => {
      apiFetch<any>('/api/admin/krashivantri/live-tracking')
        .then((res) => setLiveData(res))
        .catch(() => {});
    }, 15000);
    return () => window.clearInterval(id);
  }, [section]);

  const verifyFarmer = async (id: number, action: 'Approved' | 'Rejected' | 'Suspended' | 'Clarification Requested') => {
    const note = (farmerNotes[id] || '').trim();
    if (action !== 'Approved' && !note) {
      notify(`Enter a clear reason before selecting "${action}".`, 'error');
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/admin/krashivantri/farmers/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ action, rejectionReason: note, notes: note }),
      });
      notify(`Farmer account updated: ${action}.`, 'success');
      loadSection();
    } catch (err: any) {
      notify(err?.message || 'Action failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const verifyPilot = async (id: number, action: 'Approved' | 'Rejected' | 'Suspended' | 'Clarification Requested') => {
    const note = (pilotNotes[id] || '').trim();
    if (action !== 'Approved' && !note) {
      notify(`Enter a clear reason before selecting "${action}".`, 'error');
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/admin/krashivantri/pilots/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ action, rejectionReason: note, notes: note }),
      });
      notify(`Drone pilot updated: ${action}.`, 'success');
      loadSection();
    } catch (err: any) {
      notify(err?.message || 'Failed to update pilot.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const assignPilot = async (bookingId: number, autoNearest: boolean) => {
    const pilotId = selectedPilotAssign[bookingId];
    if (!autoNearest && !pilotId) {
      notify('Select a pilot or use Auto-Assign Nearest.', 'error');
      return;
    }
    setBusy(true);
    try {
      await apiFetch(`/api/admin/krashivantri/bookings/${bookingId}/assign-pilot`, {
        method: 'POST',
        body: JSON.stringify(autoNearest ? { autoNearest: true } : { pilotId: Number(pilotId) }),
      });
      notify('Drone pilot assigned & notified.', 'success');
      loadSection();
    } catch (err: any) {
      notify(err?.message || 'Assignment failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const verifyOperation = async (bookingId: number, verificationStatus: 'Approved' | 'Adjusted' | 'Rejected') => {
    setBusy(true);
    try {
      await apiFetch(`/api/admin/krashivantri/operations/${bookingId}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          verificationStatus,
          verifiedAreaAcres: verifyAcres[bookingId] ? Number(verifyAcres[bookingId]) : undefined,
          disputeNotes: verifyNotes[bookingId] || '',
        }),
      });
      notify(`Operation verified as ${verificationStatus}.`, 'success');
      loadSection();
    } catch (err: any) {
      notify(err?.message || 'Verification failed.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-xs text-slate-500">Loading KRASHIVANTRI operations data...</div>;
  }

  // ==================== 1. FARMERS VERIFICATION ====================
  if (section === 'farmers') {
    const allFarms = farmersData.flatMap((f) =>
      (f.farms || []).map((fm: any) => ({
        id: fm.id,
        label: `${fm.farmName} (${f.fullName})`,
        sublabel: `${fm.areaAcres} acres · ${fm.cropType}`,
        lat: fm.centerLat,
        lng: fm.centerLng,
        boundary: fm.boundaryGeoJson,
      }))
    );

    return (
      <div className="space-y-6 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0B1B3B] flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-700" />
              KRASHIVANTRI Farmer Profiles, KYC &amp; Farm Plots ({farmersData.length})
            </h2>
            <p className="text-slate-600 mt-0.5">
              Review Aadhaar, land records, and mapped field boundaries before approving spraying bookings.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSection}
            className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg font-semibold inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {allFarms.length > 0 && (
          <GeoMap farms={allFarms} className="h-64 w-full rounded-xl border border-slate-200 overflow-hidden" />
        )}

        {farmersData.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
            No farmer accounts registered yet.
          </div>
        ) : (
          <div className="space-y-4">
            {farmersData.map((f) => (
              <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="font-mono font-bold text-[#0B1B3B]">
                      {f.farmerCode} · {f.fullName}
                    </div>
                    <div className="text-slate-600">
                      {f.village}, {f.taluka}, {f.district}, {f.state} — {f.pinCode} · Mobile: {f.mobile}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-semibold text-blue-700">KYC: {f.kycStatus}</div>
                    <div className="text-slate-500">
                      {f.totalLandAcres} acres · {f.bookingsCount} bookings
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="flex flex-wrap gap-2">
                  {(f.documents || []).length === 0 ? (
                    <span className="text-slate-400">No KYC documents uploaded.</span>
                  ) : (
                    (f.documents || []).map((d: any) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() =>
                          downloadAuthedFile(
                            `/api/krashivantri/files/download?path=${encodeURIComponent(d.storagePath)}`,
                            d.fileName,
                            getIdToken
                          ).catch((e) => notify(e.message, 'error'))
                        }
                        className="px-3 py-1.5 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg font-medium inline-flex items-center gap-1.5"
                      >
                        <Download className="w-3 h-3 text-blue-700" /> {d.docType}: {d.fileName}
                      </button>
                    ))
                  )}
                </div>

                {/* Farms */}
                {(f.farms || []).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {f.farms.map((fm: any) => (
                      <div key={fm.id} className="rounded border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
                        <div className="font-semibold text-slate-900">
                          {fm.farmName} ({fm.areaAcres} ac · {fm.cropType})
                        </div>
                        <div className="font-mono text-slate-500">
                          {fm.centerLat.toFixed(5)}, {fm.centerLng.toFixed(5)} · {(fm.boundaryGeoJson || []).length} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Verification Toolbar */}
                <div className="flex flex-wrap gap-2 items-center pt-1">
                  <input
                    placeholder="Verification / rejection / clarification notes *"
                    value={farmerNotes[f.id] || ''}
                    onChange={(e) => setFarmerNotes({ ...farmerNotes, [f.id]: e.target.value })}
                    className="flex-1 min-w-[220px] rounded border border-slate-300 px-3 py-1.5"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => verifyFarmer(f.id, 'Approved')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded"
                  >
                    Approve Farmer
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => verifyFarmer(f.id, 'Clarification Requested')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded"
                  >
                    Clarification
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => verifyFarmer(f.id, 'Rejected')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => verifyFarmer(f.id, 'Suspended')}
                    className="px-3 py-1.5 border border-red-300 text-red-700 hover:bg-red-50 font-semibold rounded"
                  >
                    Suspend
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== 2. DRONE PILOTS VERIFICATION ====================
  if (section === 'pilots') {
    return (
      <div className="space-y-6 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0B1B3B] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-700" />
              KRASHIVANTRI Drone Pilot Verification, Drones &amp; Bank Accounts ({pilotsData.length})
            </h2>
            <p className="text-slate-600 mt-0.5">
              Validate DGCA Remote Pilot Certificate (RPC), Drone UINs, and encrypted payout bank accounts before dispatch.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSection}
            className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg font-semibold inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {pilotsData.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
            No drone pilots registered yet.
          </div>
        ) : (
          <div className="space-y-4">
            {pilotsData.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="font-mono font-bold text-[#0B1B3B]">
                      {p.pilotCode} · {p.fullName}
                    </div>
                    <div className="text-slate-600">
                      RPC: <span className="font-mono">{p.rpcNumber || 'N/A'}</span> (Valid until {p.rpcValidUntil || '—'}) ·{' '}
                      {p.city}, {p.district}, {p.state} · Radius {p.serviceRadiusKm} km
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-semibold text-blue-700">KYC: {p.kycStatus} ({p.accountStatus})</div>
                    <div className="text-slate-500">
                      Sprayed: {p.totalSprayedAcres} ac · Penalty Pts: {p.penaltyPoints}
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-slate-700">DGCA / Identity Documents</div>
                  <div className="flex flex-wrap gap-2">
                    {(p.documents || []).map((d: any) => (
                      <div key={d.id} className="inline-flex items-center gap-1 border border-slate-200 bg-slate-50 rounded-lg px-2.5 py-1">
                        <button
                          type="button"
                          onClick={() =>
                            downloadAuthedFile(
                              `/api/krashivantri/files/download?path=${encodeURIComponent(d.storagePath)}`,
                              d.fileName,
                              getIdToken
                            ).catch((e) => notify(e.message, 'error'))
                          }
                          className="text-blue-700 font-medium inline-flex items-center gap-1 hover:underline"
                        >
                          <Download className="w-3 h-3" /> {d.docType}
                        </button>
                        <span className="font-mono text-[10px] text-slate-500">[{d.verificationStatus}]</span>
                        {d.verificationStatus !== 'Verified' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await apiFetch(`/api/admin/krashivantri/pilots/documents/${d.id}/verify`, {
                                method: 'PATCH',
                                body: JSON.stringify({ verificationStatus: 'Verified' }),
                              });
                              loadSection();
                            }}
                            className="text-emerald-700 font-semibold ml-1"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drones & Masked Bank Accounts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                    <div className="font-semibold text-slate-800">Registered Spraying Drones</div>
                    {(p.drones || []).length === 0 ? (
                      <div className="text-slate-400">No drones added.</div>
                    ) : (
                      p.drones.map((dr: any) => (
                        <div key={dr.id} className="flex items-center justify-between gap-2 text-[11px]">
                          <span>
                            {dr.droneModel} · UIN <span className="font-mono">{dr.uinNumber}</span> ({dr.tankCapacityLiters}L)
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{dr.verificationStatus}</span>
                            {dr.verificationStatus !== 'Verified' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiFetch(`/api/admin/krashivantri/pilots/drones/${dr.id}/verify`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ verificationStatus: 'Verified' }),
                                  });
                                  loadSection();
                                }}
                                className="text-emerald-700 font-semibold"
                              >
                                Verify Drone
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                    <div className="font-semibold text-slate-800">Encrypted Payout Bank Accounts</div>
                    {(p.bankAccounts || []).length === 0 ? (
                      <div className="text-slate-400">No bank account added.</div>
                    ) : (
                      p.bankAccounts.map((bk: any) => (
                        <div key={bk.id} className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="font-mono">
                            {bk.bankName} {bk.accountNumberMasked} · {bk.ifscCode}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{bk.verificationStatus}</span>
                            {bk.verificationStatus !== 'Verified' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiFetch(`/api/admin/krashivantri/pilots/bank-accounts/${bk.id}/verify`, {
                                    method: 'PATCH',
                                    body: JSON.stringify({ verificationStatus: 'Verified' }),
                                  });
                                  loadSection();
                                }}
                                className="text-emerald-700 font-semibold"
                              >
                                Verify Bank
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pilot Verify Bar */}
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    placeholder="Verification / rejection / suspension reason *"
                    value={pilotNotes[p.id] || ''}
                    onChange={(e) => setPilotNotes({ ...pilotNotes, [p.id]: e.target.value })}
                    className="flex-1 min-w-[220px] rounded border border-slate-300 px-3 py-1.5"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => verifyPilot(p.id, 'Approved')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded"
                  >
                    Approve Pilot
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => verifyPilot(p.id, 'Clarification Requested')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded"
                  >
                    Clarification
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => verifyPilot(p.id, 'Rejected')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => verifyPilot(p.id, 'Suspended')}
                    className="px-3 py-1.5 border border-red-300 text-red-700 font-semibold rounded"
                  >
                    Suspend
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==================== 3. LIVE TRACKING & ORDERS DISPATCH ====================
  if (section === 'live_tracking' || section === 'orders_live') {
    const pilots = liveData?.pilots || [];
    const bookings = liveData?.bookings || [];
    const approvedPilots = pilots.filter((p) => p.kycStatus === 'Approved' && p.accountStatus === 'active');

    return (
      <div className="space-y-6 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-[#0B1B3B] flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-700" />
              {section === 'live_tracking'
                ? 'Live KRASHIVANTRI GPS Operations Map & Telemetry'
                : 'Live Spraying Orders Dispatch & Verification Queue'}
            </h2>
            <p className="text-slate-600 mt-0.5">
              Real browser GPS coordinates only. Stale or unavailable pilot telemetry is flagged honestly without synthetic movement.
            </p>
          </div>
          <button
            type="button"
            onClick={loadSection}
            className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg font-semibold inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
          </button>
        </div>

        {/* Live Map */}
        <GeoMap
          farms={bookings
            .filter((b) => b.farmLat && b.farmLng)
            .map((b) => ({
              id: b.id,
              label: `${b.bookingNumber} (${b.cropType})`,
              sublabel: `${b.bookedAreaAcres} ac · ${b.bookingStatus}`,
              lat: b.farmLat,
              lng: b.farmLng,
              boundary: b.farmBoundary || [],
            }))}
          pilots={pilots
            .filter((p) => p.availability?.currentLat != null && p.availability?.currentLng != null)
            .map((p) => ({
              id: p.id,
              code: p.pilotCode,
              name: p.fullName,
              lat: p.availability.currentLat,
              lng: p.availability.currentLng,
              status: p.availability.isOnline ? 'online' : 'offline',
              isStale: Boolean(p.availability.isStale),
              gpsStalenessSeconds: p.availability.gpsStalenessSeconds,
              accuracyMeters: p.availability.accuracyMeters,
              lastLocationAt: p.availability.lastLocationAt,
            }))}
          className="h-80 w-full rounded-xl border border-slate-200 overflow-hidden"
        />

        {/* Pilot Telemetry Cards */}
        {section === 'live_tracking' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {pilots.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#0B1B3B]">{p.pilotCode}</span>
                  <span
                    className={`font-semibold ${
                      p.availability?.isOnline && !p.availability?.isStale
                        ? 'text-emerald-700'
                        : p.availability?.isStale
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {p.availability?.isOnline ? (p.availability?.isStale ? 'Online · Stale GPS' : 'Online · Live GPS') : 'Offline'}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">{p.fullName}</div>
                {p.availability?.gpsAvailable ? (
                  <div className="font-mono text-[11px] text-slate-600">
                    {Number(p.availability.currentLat).toFixed(5)}, {Number(p.availability.currentLng).toFixed(5)} ·{' '}
                    {p.availability.gpsStalenessSeconds != null ? `${p.availability.gpsStalenessSeconds}s ago` : ''}
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Location Unavailable — pilot GPS not active
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Dispatch & Operation Verification Queue */}
        <div className="space-y-4">
          <h3 className="font-display text-base font-bold text-[#0B1B3B]">
            Spraying Service Bookings ({bookings.length})
          </h3>
          {bookings.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
              No spraying bookings created yet.
            </div>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="font-mono font-bold text-[#0B1B3B]">
                      {b.bookingNumber} · {b.cropType} ({b.bookedAreaAcres} acres)
                    </div>
                    <div className="text-slate-600">
                      Farmer: {b.farmer?.fullName || `#${b.farmerId}`} · Preferred: {b.preferredDate} ({b.preferredSlot}) ·{' '}
                      <MapPin className="w-3 h-3 inline" /> {Number(b.farmLat).toFixed(4)}, {Number(b.farmLng).toFixed(4)}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-slate-950">₹{b.totalAmountInr.toLocaleString('en-IN')} ({b.paymentStatus})</div>
                    <div className="text-blue-700 font-semibold">{b.bookingStatus}</div>
                  </div>
                </div>

                {/* Pilot Dispatch Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedPilotAssign[b.id] ?? String(b.assignedPilotId || '')}
                    onChange={(e) => setSelectedPilotAssign({ ...selectedPilotAssign, [b.id]: e.target.value })}
                    className="rounded border border-slate-300 px-2.5 py-1.5 bg-white"
                  >
                    <option value="">Select Approved Drone Pilot...</option>
                    {approvedPilots.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.pilotCode} — {p.fullName} ({p.availability?.isOnline ? 'Online' : 'Offline'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => assignPilot(b.id, false)}
                    className="px-3 py-1.5 bg-[#0B1B3B] text-white font-semibold rounded"
                  >
                    Assign Pilot
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => assignPilot(b.id, true)}
                    className="px-3 py-1.5 border border-blue-700 text-blue-800 bg-blue-50 font-semibold rounded"
                  >
                    Auto-Assign Nearest Live Pilot
                  </button>
                </div>

                {/* Session Telemetry & Proof Verification */}
                {b.session && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-2.5">
                    <div className="flex flex-wrap justify-between gap-2 text-[11px] font-mono">
                      <span>
                        Session {b.session.sessionCode} · Geofence Check:{' '}
                        {b.session.insideGeofenceOnStart
                          ? `Verified (${Math.round(b.session.geofenceDistanceMeters)}m)`
                          : `Outside Geofence (${Math.round(b.session.geofenceDistanceMeters)}m)`}
                      </span>
                      <span>
                        Completed Acres: {b.session.completedAreaAcres} · Farmer Confirmed:{' '}
                        {b.session.farmerConfirmed ? 'Yes' : b.session.farmerDisputeReason ? `Disputed (${b.session.farmerDisputeReason})` : 'Pending'}
                      </span>
                    </div>

                    {(b.evidence || []).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {b.evidence.map((ev: any) => (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() =>
                              downloadAuthedFile(
                                `/api/krashivantri/files/download?path=${encodeURIComponent(ev.storagePath)}`,
                                ev.fileName,
                                getIdToken
                              ).catch((e) => notify(e.message, 'error'))
                            }
                            className="px-2.5 py-1 bg-white border border-slate-300 rounded font-medium inline-flex items-center gap-1"
                          >
                            <Download className="w-3 h-3 text-blue-700" /> {ev.evidencePhase}: {ev.fileName}
                          </button>
                        ))}
                      </div>
                    )}

                    {b.bookingStatus !== 'Verified & Settled' && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <input
                          type="number"
                          step="0.1"
                          placeholder={`Verified acres (${b.session.completedAreaAcres || b.bookedAreaAcres})`}
                          value={verifyAcres[b.id] || ''}
                          onChange={(e) => setVerifyAcres({ ...verifyAcres, [b.id]: e.target.value })}
                          className="w-40 rounded border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                        />
                        <input
                          placeholder="Verification / adjustment note..."
                          value={verifyNotes[b.id] || ''}
                          onChange={(e) => setVerifyNotes({ ...verifyNotes, [b.id]: e.target.value })}
                          className="flex-1 min-w-[180px] rounded border border-slate-300 bg-white px-2.5 py-1.5"
                        />
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => verifyOperation(b.id, 'Approved')}
                          className="px-3 py-1.5 bg-emerald-700 text-white font-semibold rounded inline-flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Verify &amp; Credit Pilot
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => verifyOperation(b.id, 'Adjusted')}
                          className="px-3 py-1.5 bg-blue-700 text-white font-semibold rounded"
                        >
                          Verify Adjusted Area
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => verifyOperation(b.id, 'Rejected')}
                          className="px-3 py-1.5 bg-red-600 text-white font-semibold rounded"
                        >
                          Mark Disputed
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // ==================== 4. FARMER PAYMENTS & REFUNDS ====================
  if (section === 'farmer_payments') {
    return (
      <div className="space-y-6 text-xs">
        <h2 className="font-display text-xl font-bold text-[#0B1B3B] flex items-center gap-2">
          <Wallet className="w-5 h-5 text-blue-700" />
          KRASHIVANTRI Farmer Payments &amp; Refunds
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await apiFetch('/api/admin/krashivantri/farmer-refunds', {
                method: 'POST',
                body: JSON.stringify(refundForm),
              });
              setRefundForm({ bookingId: '', amountInr: '', reason: '', providerRefundId: '' });
              notify('Farmer refund recorded.', 'success');
              loadSection();
            } catch (err: any) {
              notify(err?.message || 'Failed to record refund.', 'error');
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
        >
          <div className="font-semibold text-[#0B1B3B]">Issue Farmer Booking Refund</div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            <input
              required
              placeholder="Booking ID #"
              value={refundForm.bookingId}
              onChange={(e) => setRefundForm({ ...refundForm, bookingId: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2 font-mono"
            />
            <input
              required
              type="number"
              placeholder="Refund Amount (₹)"
              value={refundForm.amountInr}
              onChange={(e) => setRefundForm({ ...refundForm, amountInr: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2 font-mono"
            />
            <input
              placeholder="Razorpay Refund ID (if processed)"
              value={refundForm.providerRefundId}
              onChange={(e) => setRefundForm({ ...refundForm, providerRefundId: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2 font-mono"
            />
            <input
              required
              placeholder="Refund reason *"
              value={refundForm.reason}
              onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2"
            />
            <button type="submit" disabled={busy} className="px-4 py-2 bg-[#0B1B3B] text-white font-semibold rounded-lg">
              Record Refund
            </button>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-bold text-[#0B1B3B]">
            Farmer Collections ({farmerPaymentsData.payments.length})
          </h3>
          {farmerPaymentsData.payments.length === 0 ? (
            <div className="text-slate-500">No farmer payments recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {farmerPaymentsData.payments.map((p) => (
                <div key={p.id} className="py-2.5 flex flex-wrap justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold">{p.paymentRef}</span> · Booking #{p.bookingId} (
                    {p.booking?.bookingNumber || ''}) · {p.farmer?.fullName || ''}
                  </div>
                  <div className="font-mono">
                    <span className="font-bold">₹{p.amountInr.toLocaleString('en-IN')}</span> · {p.status} ({p.mode})
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== 5. PILOT PAYOUTS ====================
  if (section === 'pilot_payouts') {
    return (
      <div className="space-y-6 text-xs">
        <h2 className="font-display text-xl font-bold text-[#0B1B3B] flex items-center gap-2">
          <Landmark className="w-5 h-5 text-blue-700" />
          Drone Pilot Payable Balances &amp; Bank Settlements
        </h2>
        <p className="text-slate-600">
          Marking a payout as Settled strictly requires a real Bank UTR / Gateway Payout Reference ID.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {payoutsData.balances.map((b) => (
            <div key={b.pilot.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-mono font-bold text-[#0B1B3B]">{b.pilot.pilotCode} · {b.pilot.fullName}</div>
                  <div className="text-slate-500 font-mono">
                    {b.primaryBank ? `${b.primaryBank.bankName} ${b.primaryBank.accountNumberMasked} (${b.primaryBank.ifscCode})` : 'No bank linked'}
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-base font-bold text-emerald-700">Payable ₹{b.payableBalanceInr.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500">Settled: ₹{b.settledTotalInr.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {b.payableBalanceInr > 0 && b.primaryBank && (
                <div className="flex gap-2">
                  <input
                    placeholder="Bank UTR Reference (optional if creating pending)"
                    value={initPayoutUtr[b.pilot.id] || ''}
                    onChange={(e) => setInitPayoutUtr({ ...initPayoutUtr, [b.pilot.id]: e.target.value })}
                    className="flex-1 rounded border border-slate-300 px-3 py-1.5 font-mono"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await apiFetch('/api/admin/krashivantri/pilot-payouts/initiate', {
                          method: 'POST',
                          body: JSON.stringify({
                            pilotId: b.pilot.id,
                            providerPayoutId: initPayoutUtr[b.pilot.id] || '',
                          }),
                        });
                        notify('Payout initiated.', 'success');
                        loadSection();
                      } catch (err: any) {
                        notify(err?.message || 'Failed to initiate payout.', 'error');
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-[#0B1B3B] text-white font-semibold rounded"
                  >
                    Initiate ₹{b.payableBalanceInr.toLocaleString('en-IN')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="font-display text-base font-bold text-[#0B1B3B]">
            Payout History &amp; Pending Settlements ({payoutsData.payouts.length})
          </h3>
          {payoutsData.payouts.length === 0 ? (
            <div className="text-slate-500">No payouts created yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payoutsData.payouts.map((po) => (
                <div key={po.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-[#0B1B3B]">
                      {po.payoutRef} · Pilot #{po.pilotId} · {po.bankAccountMasked}
                    </div>
                    <div className="text-slate-500 font-mono">
                      Amount: ₹{po.amountInr.toLocaleString('en-IN')} · Status: {po.status}
                      {po.providerPayoutId ? ` · UTR: ${po.providerPayoutId}` : ''}
                    </div>
                  </div>
                  {po.status !== 'Settled' && (
                    <div className="flex gap-2">
                      <input
                        placeholder="Mandatory Bank UTR *"
                        value={payoutUtrInputs[po.id] || ''}
                        onChange={(e) => setPayoutUtrInputs({ ...payoutUtrInputs, [po.id]: e.target.value })}
                        className="rounded border border-slate-300 px-2.5 py-1 font-mono"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true);
                          try {
                            await apiFetch(`/api/admin/krashivantri/pilot-payouts/${po.id}/status`, {
                              method: 'PATCH',
                              body: JSON.stringify({
                                status: 'Settled',
                                providerPayoutId: payoutUtrInputs[po.id] || '',
                              }),
                            });
                            notify('Payout marked Settled.', 'success');
                            loadSection();
                          } catch (err: any) {
                            notify(err?.message || 'UTR required.', 'error');
                          } finally {
                            setBusy(false);
                          }
                        }}
                        className="px-3 py-1 bg-emerald-700 text-white font-semibold rounded"
                      >
                        Mark Settled
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== 6. PENALTIES & APPEALS ====================
  if (section === 'penalties') {
    const targets = penaltyForm.targetType === 'farmer' ? farmersData : pilotsData;
    return (
      <div className="space-y-6 text-xs">
        <h2 className="font-display text-xl font-bold text-[#0B1B3B] flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-700" />
          Compliance Penalties &amp; Appeals Review
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await apiFetch('/api/admin/krashivantri/penalties', {
                method: 'POST',
                body: JSON.stringify(penaltyForm),
              });
              setPenaltyForm({ ...penaltyForm, description: '', evidenceSummary: '', bookingId: '' });
              notify('Penalty imposed and recorded in ledger.', 'success');
              loadSection();
            } catch (err: any) {
              notify(err?.message || 'Failed to impose penalty.', 'error');
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
        >
          <div className="font-semibold text-[#0B1B3B]">Impose Compliance Penalty</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <select
              value={penaltyForm.targetType}
              onChange={(e) => setPenaltyForm({ ...penaltyForm, targetType: e.target.value, targetId: '' })}
              className="rounded border border-slate-300 px-2.5 py-2 bg-white"
            >
              <option value="pilot">Drone Pilot</option>
              <option value="farmer">Farmer</option>
            </select>
            <select
              required
              value={penaltyForm.targetId}
              onChange={(e) => setPenaltyForm({ ...penaltyForm, targetId: e.target.value })}
              className="rounded border border-slate-300 px-2.5 py-2 bg-white"
            >
              <option value="">Select Account *</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.pilotCode || t.farmerCode} — {t.fullName}
                </option>
              ))}
            </select>
            <select
              value={penaltyForm.reasonCategory}
              onChange={(e) => setPenaltyForm({ ...penaltyForm, reasonCategory: e.target.value })}
              className="rounded border border-slate-300 px-2.5 py-2 bg-white"
            >
              {['Late arrival', 'No-show', 'GPS manipulation', 'Unsafe flight', 'Incomplete spraying', 'Misconduct'].map(
                (r) => (
                  <option key={r} value={r}>{r}</option>
                )
              )}
            </select>
            <input
              type="number"
              min={0}
              placeholder="Amount (₹)"
              value={penaltyForm.amountInr}
              onChange={(e) => setPenaltyForm({ ...penaltyForm, amountInr: e.target.value })}
              className="rounded border border-slate-300 px-2.5 py-2 font-mono"
            />
            <input
              placeholder="Evidence / GPS note"
              value={penaltyForm.evidenceSummary}
              onChange={(e) => setPenaltyForm({ ...penaltyForm, evidenceSummary: e.target.value })}
              className="rounded border border-slate-300 px-2.5 py-2"
            />
            <button type="submit" disabled={busy} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg">
              Impose Penalty
            </button>
          </div>
          <input
            required
            placeholder="Detailed penalty description *"
            value={penaltyForm.description}
            onChange={(e) => setPenaltyForm({ ...penaltyForm, description: e.target.value })}
            className="w-full rounded border border-slate-300 px-3 py-2"
          />
        </form>

        <div className="space-y-3">
          {penaltiesData.penalties.map((pn) => (
            <div key={pn.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2.5">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-[#0B1B3B]">{pn.penaltyNumber}</span> · {pn.targetLabel} ·{' '}
                  <span className="font-semibold">{pn.reasonCategory}</span>
                </div>
                <div className="font-mono font-bold">
                  ₹{pn.amountInr.toLocaleString('en-IN')} · {pn.status} (Appeal: {pn.appealStatus})
                </div>
              </div>
              <p className="text-slate-600">{pn.description}</p>
              {(pn.appeals || [])
                .filter((a: any) => a.decision === 'Pending')
                .map((ap: any) => (
                  <div key={ap.id} className="rounded border border-amber-200 bg-amber-50 p-3 space-y-2">
                    <div className="font-semibold text-amber-950">Pending Appeal: {ap.explanation}</div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Decision note..."
                        value={appealDecisionNotes[ap.id] || ''}
                        onChange={(e) => setAppealDecisionNotes({ ...appealDecisionNotes, [ap.id]: e.target.value })}
                        className="flex-1 rounded border border-amber-300 bg-white px-2.5 py-1.5"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          await apiFetch(`/api/admin/krashivantri/penalty-appeals/${ap.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ decision: 'Waived', decisionNotes: appealDecisionNotes[ap.id] || '' }),
                          });
                          loadSection();
                        }}
                        className="px-3 py-1 bg-emerald-700 text-white font-semibold rounded"
                      >
                        Waive &amp; Credit Back
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                          await apiFetch(`/api/admin/krashivantri/penalty-appeals/${ap.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ decision: 'Upheld', decisionNotes: appealDecisionNotes[ap.id] || '' }),
                          });
                          loadSection();
                        }}
                        className="px-3 py-1 bg-red-600 text-white font-semibold rounded"
                      >
                        Uphold Penalty
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==================== 7. CONSOLIDATED FINANCE & OPS CONFIG ====================
  const s = financeData?.summary || {};
  return (
    <div className="space-y-6 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold text-[#0B1B3B] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-700" />
            KRASHIVANTRI Financial Ledger, Reports &amp; Ops Governance
          </h2>
          <p className="text-slate-600 mt-0.5">
            Commission rates, acreage pricing, geofence tolerances, farmer collections, pilot payouts, and CSV/PDF reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadKrashivantriReportPdf({ summary: s })}
          className="px-3.5 py-2 bg-[#0B1B3B] text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" /> Executive Summary PDF
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          ['Bookings (Settled)', `${s.totalBookings || 0} (${s.settledBookings || 0})`],
          ['Farmers (Approved)', `${s.totalFarmers || 0} (${s.approvedFarmers || 0})`],
          ['Pilots (Approved)', `${s.totalPilots || 0} (${s.approvedPilots || 0})`],
          ['Farmer Collections', `₹${Number(s.totalFarmerCollectionsInr || 0).toLocaleString('en-IN')}`],
          ['Commission Earned', `₹${Number(s.platformCommissionInr || 0).toLocaleString('en-IN')}`],
          ['Pending Pilot Payouts', `₹${Number(s.pendingPayoutsInr || 0).toLocaleString('en-IN')}`],
        ].map(([lbl, val]) => (
          <div key={lbl} className="rounded-xl border border-slate-200 bg-white p-4 space-y-1">
            <div className="text-[11px] text-slate-500">{lbl}</div>
            <div className="font-mono text-base font-bold text-[#0B1B3B] tabular-nums">{val}</div>
          </div>
        ))}
      </div>

      {/* CSV Report Exports */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <div className="font-semibold text-[#0B1B3B]">Audit &amp; Compliance CSV Exports</div>
        <div className="flex flex-wrap gap-2">
          {[
            ['bookings', 'Service Bookings CSV'],
            ['farmers', 'Farmers Registry CSV'],
            ['pilots', 'Drone Pilots Registry CSV'],
            ['farmer-payments', 'Farmer Payments CSV'],
            ['pilot-payouts', 'Pilot Payouts CSV'],
            ['penalties', 'Penalties Log CSV'],
          ].map(([rt, label]) => (
            <button
              key={rt}
              type="button"
              onClick={() =>
                downloadAuthedFile(
                  `/api/admin/krashivantri/export/${rt}`,
                  `krashivantri-${rt}.csv`,
                  getIdToken
                ).catch((e) => notify(e.message, 'error'))
              }
              className="px-3 py-1.5 border border-slate-300 bg-slate-50 hover:bg-slate-100 rounded-lg font-semibold inline-flex items-center gap-1"
            >
              <Download className="w-3 h-3 text-blue-700" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Super Admin Ops Config */}
      {opsConfig && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!isSuperAdmin) return;
            setBusy(true);
            try {
              const res = await apiFetch<{ config: KrashivantriOpsConfig }>('/api/admin/krashivantri/ops-config', {
                method: 'PUT',
                body: JSON.stringify(opsConfig),
              });
              setOpsConfig(res.config);
              notify('KRASHIVANTRI operations config updated.', 'success');
            } catch (err: any) {
              notify(err?.message || 'Failed to save config.', 'error');
            } finally {
              setBusy(false);
            }
          }}
          className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <div className="font-semibold text-[#0B1B3B]">
            Super Admin Operations Pricing, Geofence &amp; Commission Rules
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ['baseRatePerAcreInr', 'Base Rate / Acre (₹)'],
              ['minimumBookingAcres', 'Min Booking Acres'],
              ['platformCommissionPercent', 'Platform Commission (%)'],
              ['gpsStaleThresholdMinutes', 'GPS Stale Threshold (min)'],
              ['arrivalGeofenceMeters', 'Arrival Geofence Radius (m)'],
              ['pilotResponseTimeoutMinutes', 'Pilot Response Timeout (min)'],
              ['cancellationBeforeDispatchRefundPercent', 'Pre-Dispatch Refund (%)'],
              ['lateArrivalPenaltyInr', 'Default Late Penalty (₹)'],
            ].map(([k, label]) => (
              <div key={k}>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">{label}</label>
                <input
                  type="number"
                  step="0.5"
                  value={(opsConfig as any)[k]}
                  onChange={(e) => setOpsConfig({ ...opsConfig, [k]: Number(e.target.value) })}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                />
              </div>
            ))}
          </div>
          {isSuperAdmin && (
            <button type="submit" disabled={busy} className="px-4 py-2 bg-[#0B1B3B] text-white font-semibold rounded-lg">
              Save Ops Configuration
            </button>
          )}
        </form>
      )}
    </div>
  );
};
