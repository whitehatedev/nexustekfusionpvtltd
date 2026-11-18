import React, { useEffect, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  Send,
  RotateCcw,
  Plus,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import {
  AndroidAppLinkConfig,
  CmsPageRecord,
  HomepageSectionConfig,
  KrashivantriModelConfig,
} from '../types/platform';

type EditorTab = 'sections' | 'krashivantri' | 'apps' | 'pages' | 'branding_seo' | 'revisions';

export const WebsiteEditorPage: React.FC = () => {
  const { isSignedIn, isAdmin, signInWithGoogle, apiFetch, notify, refreshBootstrap, navigate } = usePlatform();
  const [tab, setTab] = useState<EditorTab>('sections');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  const [previewUrl, setPreviewUrl] = useState('/?previewDraft=true');

  const [sections, setSections] = useState<HomepageSectionConfig[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [pages, setPages] = useState<CmsPageRecord[]>([]);

  const [krashivantri, setKrashivantri] = useState<{
    platformName: string;
    summary: string;
    bannerImageUrl?: string;
    models: KrashivantriModelConfig[];
  }>({ platformName: '', summary: '', models: [] });

  const [appLinks, setAppLinks] = useState<AndroidAppLinkConfig[]>([]);
  const [announcement, setAnnouncement] = useState({ enabled: true, text: '', link: '', ctaLabel: '' });
  const [seoConfig, setSeoConfig] = useState({ defaultTitle: '', defaultDescription: '', ga4MeasurementId: '' });

  const [newPageForm, setNewPageForm] = useState({ title: '', slug: '', heroHeadline: '', heroSubheadline: '' });

  const loadEditorState = async () => {
    if (!isSignedIn || !isAdmin) return;
    setLoading(true);
    try {
      const res = await apiFetch<{ settings: any; pages: CmsPageRecord[]; revisions: any[] }>(
        '/api/admin/website-editor/state'
      );
      const s = res.settings || {};
      setSections(s.homepageLayout?.draft || s.homepageLayout?.published || []);
      setKrashivantri(s.krashivantriCatalog || { platformName: '', summary: '', models: [] });
      setAppLinks(s.appLinks || []);
      setAnnouncement(s.announcementBar || { enabled: true, text: '', link: '', ctaLabel: '' });
      setSeoConfig(s.seoConfig || { defaultTitle: '', defaultDescription: '', ga4MeasurementId: '' });
      setPages(res.pages || []);
      setRevisions(res.revisions || []);
    } catch (err: any) {
      notify(err?.message || 'Failed to load Website Editor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEditorState();
  }, [isSignedIn, isAdmin]);

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="font-display text-3xl font-bold text-[#0B1B3B]">Visual Website Editor</h1>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/admin/login')} className="px-5 py-2.5 bg-[#0B1B3B] text-white rounded-lg text-sm font-semibold">
            Admin Login
          </button>
          <button onClick={signInWithGoogle} className="px-5 py-2.5 border border-slate-300 bg-white text-slate-900 rounded-lg text-sm font-semibold">
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-3">
        <h1 className="font-display text-2xl font-bold text-slate-950">Admin Access Required</h1>
      </div>
    );
  }

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const [item] = copy.splice(idx, 1);
    copy.splice(target, 0, item);
    setSections(copy);
    setSelectedIdx(target);
  };

  const updateSelectedSection = (patch: Partial<HomepageSectionConfig>) => {
    setSections((prev) => prev.map((s, i) => (i === selectedIdx ? { ...s, ...patch } : s)));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/admin/website-editor/draft', {
        method: 'PUT',
        body: JSON.stringify({ sections }),
      });
      setPreviewUrl('/?previewDraft=true');
      setPreviewKey((k) => k + 1);
      notify('Draft saved. Preview refreshed.', 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to save draft.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/admin/website-editor/publish', {
        method: 'POST',
        body: JSON.stringify({ sections, label: `Published ${new Date().toLocaleTimeString('en-IN')}` }),
      });
      await refreshBootstrap();
      setPreviewKey((k) => k + 1);
      loadEditorState();
      notify('Homepage layout published live!', 'success');
    } catch (err: any) {
      notify(err?.message || 'Publish failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (revisionId: number) => {
    setSaving(true);
    try {
      const res = await apiFetch<{ homepageLayout: { draft: HomepageSectionConfig[] } }>(
        `/api/admin/website-editor/rollback/${revisionId}`,
        { method: 'POST', body: JSON.stringify({ publishImmediately: false }) }
      );
      setSections(res.homepageLayout.draft || []);
      setPreviewKey((k) => k + 1);
      notify('Revision restored into Draft. Review Preview and click Publish Live.', 'info');
    } catch (err: any) {
      notify(err?.message || 'Rollback failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const selected = sections[selectedIdx];
  const previewWidthClass =
    viewport === 'mobile' ? 'max-w-[390px]' : viewport === 'tablet' ? 'max-w-[768px]' : 'w-full';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            ← Admin Console
          </button>
          <div>
            <div className="font-display font-bold text-base text-slate-950">Visual Website Editor</div>
            <div className="text-[11px] text-slate-500">Draft · Live Preview · Publish · Revision Rollback</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setViewport('desktop')}
              title="Desktop"
              className={`p-1.5 rounded ${viewport === 'desktop' ? 'bg-white shadow-sm text-slate-950' : 'text-slate-500'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('tablet')}
              title="Tablet"
              className={`p-1.5 rounded ${viewport === 'tablet' ? 'bg-white shadow-sm text-slate-950' : 'text-slate-500'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport('mobile')}
              title="Mobile"
              className={`p-1.5 rounded ${viewport === 'mobile' ? 'bg-white shadow-sm text-slate-950' : 'text-slate-500'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="px-3 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>

          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 border border-slate-300 bg-white rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Preview
          </a>

          <button
            disabled={saving}
            onClick={handleSaveDraft}
            className="px-4 py-2 border border-slate-900 bg-white text-slate-950 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>

          <button
            disabled={saving}
            onClick={handlePublish}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" /> Publish Live
          </button>
        </div>
      </div>

      {/* Main Split Workspace */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12">
        {/* Left Editor Panel */}
        <div className="xl:col-span-5 bg-white border-r border-slate-200 p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-64px)]">
          <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            {[
              ['sections', 'Homepage Sections'],
              ['krashivantri', 'KRASHIVANTRI'],
              ['apps', 'Android Apps'],
              ['pages', 'Custom Pages'],
              ['branding_seo', 'Banner & SEO'],
              ['revisions', 'Revisions'],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k as EditorTab)}
                className={`px-2.5 py-1.5 rounded-md font-semibold ${
                  tab === k ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-xs text-slate-500">Loading editor state...</div>
          ) : (
            <>
              {tab === 'sections' && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700">Section Order &amp; Visibility</div>
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                      {sections.map((sec, idx) => (
                        <div
                          key={sec.id}
                          onClick={() => setSelectedIdx(idx)}
                          className={`px-3 py-2.5 flex items-center justify-between gap-2 cursor-pointer ${
                            idx === selectedIdx ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="truncate font-medium text-slate-900">
                            <span className="font-mono text-[11px] text-slate-400 mr-2">{idx + 1}.</span>
                            {sec.type} {sec.heading ? `— ${sec.heading}` : ''}
                          </div>
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                setSections((prev) =>
                                  prev.map((s, i) => (i === idx ? { ...s, visible: !s.visible } : s))
                                );
                              }}
                              className="p-1 text-slate-500 hover:text-slate-900"
                              title={sec.visible ? 'Hide section' : 'Show section'}
                            >
                              {sec.visible ? <Eye className="w-3.5 h-3.5 text-blue-700" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => moveSection(idx, -1)}
                              className="p-1 text-slate-500 hover:text-slate-900"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveSection(idx, 1)}
                              className="p-1 text-slate-500 hover:text-slate-900"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selected && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
                      <div className="font-display font-bold text-sm text-slate-950">
                        Edit Section: {selected.type}
                      </div>
                      <input
                        placeholder="Kicker / Eyebrow Label"
                        value={selected.kicker || ''}
                        onChange={(e) => updateSelectedSection({ kicker: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      />
                      <input
                        placeholder="Section Heading"
                        value={selected.heading || ''}
                        onChange={(e) => updateSelectedSection({ heading: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      />
                      <textarea
                        rows={2}
                        placeholder="Subheading"
                        value={selected.subheading || ''}
                        onChange={(e) => updateSelectedSection({ subheading: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      />
                      <textarea
                        rows={2}
                        placeholder="Body Copy"
                        value={selected.body || ''}
                        onChange={(e) => updateSelectedSection({ body: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          placeholder="Primary CTA Label"
                          value={selected.primaryCtaLabel || ''}
                          onChange={(e) => updateSelectedSection({ primaryCtaLabel: e.target.value })}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                        <input
                          placeholder="Primary CTA Link"
                          value={selected.primaryCtaLink || ''}
                          onChange={(e) => updateSelectedSection({ primaryCtaLink: e.target.value })}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                        <input
                          placeholder="Secondary CTA Label"
                          value={selected.secondaryCtaLabel || ''}
                          onChange={(e) => updateSelectedSection({ secondaryCtaLabel: e.target.value })}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                        />
                        <input
                          placeholder="Secondary CTA Link"
                          value={selected.secondaryCtaLink || ''}
                          onChange={(e) => updateSelectedSection({ secondaryCtaLink: e.target.value })}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                        />
                      </div>
                      <input
                        placeholder="Image URL"
                        value={selected.imageUrl || ''}
                        onChange={(e) => updateSelectedSection({ imageUrl: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {tab === 'krashivantri' && (
                <div className="space-y-4 text-xs">
                  <div className="font-display font-bold text-sm text-slate-950">KRASHIVANTRI Platform &amp; Drone Models</div>
                  <input
                    placeholder="Platform Name"
                    value={krashivantri.platformName}
                    onChange={(e) => setKrashivantri({ ...krashivantri, platformName: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <textarea
                    rows={3}
                    placeholder="Platform Summary"
                    value={krashivantri.summary}
                    onChange={(e) => setKrashivantri({ ...krashivantri, summary: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                  {krashivantri.models.map((m, idx) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                      <div className="font-bold text-slate-950">{m.name}</div>
                      <input
                        placeholder="Tagline"
                        value={m.tagline}
                        onChange={(e) =>
                          setKrashivantri({
                            ...krashivantri,
                            models: krashivantri.models.map((mm, i) => (i === idx ? { ...mm, tagline: e.target.value } : mm)),
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      />
                      <textarea
                        rows={2}
                        placeholder="Model Summary"
                        value={m.summary}
                        onChange={(e) =>
                          setKrashivantri({
                            ...krashivantri,
                            models: krashivantri.models.map((mm, i) => (i === idx ? { ...mm, summary: e.target.value } : mm)),
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      />
                      <div className="space-y-2">
                        <div className="flex justify-between items-center font-semibold">
                          <span>Verified Technical Specs ({m.specs.length})</span>
                          <button
                            type="button"
                            onClick={() =>
                              setKrashivantri({
                                ...krashivantri,
                                models: krashivantri.models.map((mm, i) =>
                                  i === idx ? { ...mm, specs: [...mm.specs, { label: '', value: '' }] } : mm
                                ),
                              })
                            }
                            className="text-blue-700 font-semibold inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Spec Row
                          </button>
                        </div>
                        {m.specs.map((sp, spIdx) => (
                          <div key={spIdx} className="flex gap-2">
                            <input
                              placeholder="Spec Label (e.g. Tank Capacity)"
                              value={sp.label}
                              onChange={(e) =>
                                setKrashivantri({
                                  ...krashivantri,
                                  models: krashivantri.models.map((mm, i) =>
                                    i === idx
                                      ? {
                                          ...mm,
                                          specs: mm.specs.map((s, si) => (si === spIdx ? { ...s, label: e.target.value } : s)),
                                        }
                                      : mm
                                  ),
                                })
                              }
                              className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                            />
                            <input
                              placeholder="Verified Value"
                              value={sp.value}
                              onChange={(e) =>
                                setKrashivantri({
                                  ...krashivantri,
                                  models: krashivantri.models.map((mm, i) =>
                                    i === idx
                                      ? {
                                          ...mm,
                                          specs: mm.specs.map((s, si) => (si === spIdx ? { ...s, value: e.target.value } : s)),
                                        }
                                      : mm
                                  ),
                                })
                              }
                              className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setKrashivantri({
                                  ...krashivantri,
                                  models: krashivantri.models.map((mm, i) =>
                                    i === idx ? { ...mm, specs: mm.specs.filter((_, si) => si !== spIdx) } : mm
                                  ),
                                })
                              }
                              className="p-1.5 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={async () => {
                      await apiFetch('/api/admin/settings/krashivantriCatalog', {
                        method: 'PUT',
                        body: JSON.stringify({ value: krashivantri }),
                      });
                      await refreshBootstrap();
                      setPreviewUrl('/krashivantri');
                      setPreviewKey((k) => k + 1);
                      notify('KRASHIVANTRI catalog updated.', 'success');
                    }}
                    className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg"
                  >
                    Save KRASHIVANTRI Catalog
                  </button>
                </div>
              )}

              {tab === 'apps' && (
                <div className="space-y-4 text-xs">
                  <div className="font-display font-bold text-sm text-slate-950">Farmer, Drone Pilot &amp; Buyer Android Apps</div>
                  {appLinks.map((app, idx) => (
                    <div key={app.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                      <div className="font-bold text-slate-950">{app.name}</div>
                      <label className="flex items-center gap-2 font-medium">
                        <input
                          type="checkbox"
                          checked={app.comingSoon}
                          onChange={(e) =>
                            setAppLinks(appLinks.map((a, i) => (i === idx ? { ...a, comingSoon: e.target.checked } : a)))
                          }
                        />
                        Show &quot;Coming Soon on Google Play&quot;
                      </label>
                      <input
                        placeholder="Google Play Store URL"
                        value={app.playStoreUrl}
                        onChange={(e) =>
                          setAppLinks(appLinks.map((a, i) => (i === idx ? { ...a, playStoreUrl: e.target.value } : a)))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                      />
                      <input
                        placeholder="Direct APK URL (optional)"
                        value={app.apkDownloadUrl || ''}
                        onChange={(e) =>
                          setAppLinks(appLinks.map((a, i) => (i === idx ? { ...a, apkDownloadUrl: e.target.value } : a)))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                      />
                    </div>
                  ))}
                  <button
                    onClick={async () => {
                      await apiFetch('/api/admin/settings/appLinks', {
                        method: 'PUT',
                        body: JSON.stringify({ value: appLinks }),
                      });
                      await refreshBootstrap();
                      setPreviewKey((k) => k + 1);
                      notify('Android app links saved.', 'success');
                    }}
                    className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg"
                  >
                    Save Android App Links
                  </button>
                </div>
              )}

              {tab === 'pages' && (
                <div className="space-y-5 text-xs">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await apiFetch('/api/admin/website-editor/pages', {
                        method: 'POST',
                        body: JSON.stringify({
                          title: newPageForm.title,
                          slug: newPageForm.slug,
                          status: 'published',
                          draftContent: {
                            heroHeadline: newPageForm.heroHeadline || newPageForm.title,
                            heroSubheadline: newPageForm.heroSubheadline,
                            ctaLabel: 'Contact Us',
                            ctaLink: '/contact',
                            blocks: [{ id: 'b1', heading: 'Details', body: newPageForm.heroSubheadline }],
                          },
                        }),
                      });
                      setNewPageForm({ title: '', slug: '', heroHeadline: '', heroSubheadline: '' });
                      loadEditorState();
                      refreshBootstrap();
                      notify('Custom landing page created and published.', 'success');
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5"
                  >
                    <div className="font-display font-bold text-sm text-slate-950">Create Custom Page (/p/:slug)</div>
                    <input
                      required
                      placeholder="Page Title"
                      value={newPageForm.title}
                      onChange={(e) => setNewPageForm({ ...newPageForm, title: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    />
                    <input
                      placeholder="URL Slug (optional, e.g. agri-subsidy)"
                      value={newPageForm.slug}
                      onChange={(e) => setNewPageForm({ ...newPageForm, slug: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                    />
                    <textarea
                      rows={2}
                      placeholder="Hero Summary"
                      value={newPageForm.heroSubheadline}
                      onChange={(e) => setNewPageForm({ ...newPageForm, heroSubheadline: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    />
                    <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg">
                      Create &amp; Publish Page
                    </button>
                  </form>

                  <div className="space-y-2">
                    <div className="font-semibold text-slate-700">Published &amp; Draft Pages ({pages.length})</div>
                    {pages.map((pg) => (
                      <div key={pg.id} className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-950">{pg.title}</div>
                          <div className="font-mono text-[11px] text-slate-500">/p/{pg.slug} · {pg.status}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPreviewUrl(`/p/${pg.slug}?preview=true`);
                              setPreviewKey((k) => k + 1);
                            }}
                            className="px-2.5 py-1 border border-slate-300 rounded font-semibold"
                          >
                            Preview
                          </button>
                          <button
                            onClick={async () => {
                              await apiFetch(`/api/admin/website-editor/pages/${pg.id}`, { method: 'DELETE' });
                              loadEditorState();
                              refreshBootstrap();
                            }}
                            className="p-1 text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'branding_seo' && (
                <div className="space-y-4 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                    <div className="font-bold text-slate-950">Announcement Banner</div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={announcement.enabled}
                        onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                      />
                      Show Top Announcement Bar
                    </label>
                    <input
                      placeholder="Banner Message"
                      value={announcement.text}
                      onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="CTA Label"
                        value={announcement.ctaLabel}
                        onChange={(e) => setAnnouncement({ ...announcement, ctaLabel: e.target.value })}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                      />
                      <input
                        placeholder="CTA Link"
                        value={announcement.link}
                        onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                    <div className="font-bold text-slate-950">SEO Metadata &amp; Analytics</div>
                    <input
                      placeholder="Default SEO Title"
                      value={seoConfig.defaultTitle}
                      onChange={(e) => setSeoConfig({ ...seoConfig, defaultTitle: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    />
                    <textarea
                      rows={2}
                      placeholder="Default SEO Meta Description"
                      value={seoConfig.defaultDescription}
                      onChange={(e) => setSeoConfig({ ...seoConfig, defaultDescription: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                    />
                    <input
                      placeholder="Google Analytics 4 Measurement ID (G-XXXXXXXXXX)"
                      value={seoConfig.ga4MeasurementId || ''}
                      onChange={(e) => setSeoConfig({ ...seoConfig, ga4MeasurementId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono"
                    />
                  </div>

                  <button
                    onClick={async () => {
                      await Promise.all([
                        apiFetch('/api/admin/settings/announcementBar', {
                          method: 'PUT',
                          body: JSON.stringify({ value: announcement }),
                        }),
                        apiFetch('/api/admin/settings/seoConfig', {
                          method: 'PUT',
                          body: JSON.stringify({ value: seoConfig }),
                        }),
                      ]);
                      await refreshBootstrap();
                      setPreviewKey((k) => k + 1);
                      notify('Banner & SEO configuration saved.', 'success');
                    }}
                    className="px-4 py-2 bg-blue-700 text-white font-semibold rounded-lg"
                  >
                    Save Banner &amp; SEO
                  </button>
                </div>
              )}

              {tab === 'revisions' && (
                <div className="space-y-3 text-xs">
                  <div className="font-display font-bold text-sm text-slate-950">
                    Published Revision History ({revisions.length})
                  </div>
                  {revisions.length === 0 ? (
                    <div className="text-slate-500">Click &quot;Publish Live&quot; to store a restorable layout snapshot.</div>
                  ) : (
                    revisions.map((rev) => (
                      <div key={rev.id} className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-950">{rev.label}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            By {rev.createdBy} · {new Date(rev.createdAt).toLocaleString('en-IN')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRollback(rev.id)}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg font-semibold inline-flex items-center gap-1 hover:bg-slate-50"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore Draft
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Live Preview Canvas */}
        <div className="xl:col-span-7 p-4 sm:p-6 flex flex-col items-center overflow-auto bg-slate-200/70">
          <div className={`${previewWidthClass} h-[calc(100vh-110px)] bg-white rounded-xl border border-slate-300 shadow-lg overflow-hidden transition-all`}>
            <iframe
              key={previewKey}
              src={previewUrl}
              title="Live Website Preview"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
