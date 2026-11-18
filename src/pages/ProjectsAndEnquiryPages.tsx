import React, { useEffect, useState } from 'react';
import { Upload, ArrowRight, CheckCircle2, Play, ArrowLeft } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { AddressSelector } from '../components/AddressSelector';
import { AddressData, CaseStudy } from '../types/platform';

export const ProjectsShowcasePage: React.FC = () => {
  const { caseStudies, navigate } = usePlatform();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="space-y-2 max-w-2xl">
          <div className="text-xs font-semibold text-blue-700">Applied Research &amp; Builds</div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">
            Engineering R&amp;D &amp; Academic Projects
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Documented platforms, UAV prototypes, embedded builds, and robotics systems engineered by the NexusTekFusion team.
          </p>
        </div>
        <button
          onClick={() => navigate('/project-enquiry')}
          className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 shrink-0"
        >
          Start Your Project <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {caseStudies.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No published projects yet. Administrators can publish projects from the Admin Console.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {caseStudies.map((cs) => (
            <div key={cs.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between">
              <div>
                <button
                  onClick={() => navigate(`/projects/${cs.slug}`)}
                  className="aspect-[16/9] bg-slate-100 block w-full overflow-hidden"
                >
                  <img src={cs.imageUrl} alt={cs.title} referrerPolicy="no-referrer" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </button>
                <div className="p-6 space-y-3">
                  <div className="text-xs text-slate-500">{cs.relatedServices.join(' · ')}</div>
                  <h2 className="font-display text-xl font-bold text-slate-950">{cs.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{cs.description}</p>
                  <div className="border-t border-slate-100 pt-3 text-xs text-slate-600 space-y-1">
                    <div><span className="font-semibold text-slate-900">Technologies:</span> {cs.technologyUsed}</div>
                    <div><span className="font-semibold text-slate-900">Applications:</span> {cs.applications}</div>
                    <div><span className="font-semibold text-slate-900">Outcomes:</span> {cs.outcomes}</div>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-5 pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  onClick={() => navigate(`/projects/${cs.slug}`)}
                  className="px-4 py-2 bg-[#0B1B3B] hover:bg-[#132954] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                >
                  View Project <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => navigate('/project-enquiry')}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Request Similar Build
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const ProjectDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { apiFetch, navigate } = usePlatform();
  const [project, setProject] = useState<CaseStudy | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ project: CaseStudy }>(`/api/projects/${encodeURIComponent(slug)}`)
      .then((res) => setProject(res.project))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [slug, apiFetch]);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-sm text-slate-500">Loading project documentation...</div>;
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-slate-950">Project Not Found</h1>
        <button
          onClick={() => navigate('/projects')}
          className="px-5 py-2.5 bg-[#0B1B3B] text-white text-sm font-semibold rounded-lg"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <button
        onClick={() => navigate('/projects')}
        className="text-xs font-semibold text-slate-600 hover:text-blue-700 inline-flex items-center gap-1.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Engineering R&amp;D &amp; Academic Projects
      </button>

      <div className="space-y-4 border-b border-slate-200 pb-6">
        <div className="text-xs font-semibold text-blue-700">
          {project.relatedServices.join(' · ') || 'Engineering R&D Project'}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-950">{project.title}</h1>
        <p className="text-base text-slate-600 leading-relaxed">{project.description}</p>
      </div>

      <div className="aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
        <img
          src={project.imageUrl}
          alt={project.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      {project.videoUrl && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-900">
            <Play className="w-4 h-4 text-blue-700" /> Project Test &amp; Demonstration Video
          </div>
          <a
            href={project.videoUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
          >
            Watch Video
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <div className="text-xs font-semibold text-blue-700 uppercase">Technologies Used</div>
          <p className="text-sm text-slate-700 leading-relaxed">{project.technologyUsed || 'Configured in Admin CMS'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <div className="text-xs font-semibold text-blue-700 uppercase">Field Applications</div>
          <p className="text-sm text-slate-700 leading-relaxed">{project.applications || 'Industrial & Academic Deployment'}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
          <div className="text-xs font-semibold text-blue-700 uppercase">Engineering Outcomes</div>
          <p className="text-sm text-slate-700 leading-relaxed">{project.outcomes || 'Validated Production Prototype'}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#0B1B3B] text-white p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-bold">Need a Similar R&amp;D or Academic System?</h2>
          <p className="text-xs sm:text-sm text-slate-300">
            Request an itemized 14-category engineering quotation tailored to your technical scope.
          </p>
        </div>
        <button
          onClick={() => navigate('/project-enquiry')}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2 shrink-0"
        >
          Request Similar Project <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const ProjectEnquiryPage: React.FC = () => {
  const { isSignedIn, dbUser, signInWithGoogle, apiFetch, notify, navigate } = usePlatform();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [billingAddress, setBillingAddress] = useState<AddressData | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<AddressData | null>(null);
  const [sameAddress, setSameAddress] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState('');

  const [form, setForm] = useState({
    customerName: dbUser?.fullName || '',
    customerEmail: dbUser?.email || '',
    customerPhone: dbUser?.mobile || '',
    companyOrCollege: dbUser?.companyOrCollege || '',
    courseDepartment: '',
    teamType: 'Individual',
    teamCount: 1,
    projectTitle: '',
    engineeringBranch: 'Electronics & Communication (ECE)',
    academicLevel: 'B.E. / B.Tech Final Year',
    projectCategory: 'Robotics & Automation',
    projectType: 'Hardware + Software',
    projectDescription: '',
    problemStatement: '',
    expectedFunctionality: '',
    requiredTechnologies: '',
    expectedDeliverables: '',
    targetCompletionDate: '',
    budgetMinInr: '',
    budgetMaxInr: '',
    estimatedBudget: '',
    specialRequirements: '',
  });

  const [flags, setFlags] = useState({
    needHardware: true,
    needSoftware: true,
    needPcb: false,
    need3dPrinting: false,
    needAiMl: false,
    needIot: false,
    needPrototype: true,
    needDocumentation: true,
    needPpt: false,
    needResearchPaper: false,
    consultationMode: 'Online Video Review',
    acceptedTerms: false,
  });

  useEffect(() => {
    if (dbUser) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || dbUser.fullName,
        customerEmail: prev.customerEmail || dbUser.email,
        customerPhone: prev.customerPhone || dbUser.mobile,
        companyOrCollege: prev.companyOrCollege || dbUser.companyOrCollege,
      }));
    }
  }, [dbUser]);

  const loadAddresses = async () => {
    if (!isSignedIn) return;
    try {
      const me = await apiFetch<{ addresses: AddressData[] }>('/api/me');
      setAddresses(me.addresses || []);
      if (me.addresses?.length > 0 && !billingAddress) {
        const def = me.addresses.find((a) => a.isDefault) || me.addresses[0];
        setBillingAddress(def);
        setDeliveryAddress(def);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [isSignedIn]);

  const validateStep = (targetStep: number): boolean => {
    if (step === 1 && targetStep > 1) {
      if (!form.customerName.trim() || !form.customerEmail.trim() || !form.customerPhone.trim()) {
        notify('Please complete contact name, email, and mobile number.', 'error');
        return false;
      }
      const finalDelivery = sameAddress ? billingAddress : deliveryAddress;
      if (!billingAddress || !finalDelivery) {
        notify('Please select or save both Billing and Delivery addresses.', 'error');
        return false;
      }
    }
    if (step === 2 && targetStep > 2) {
      if (!form.projectTitle.trim() || !form.projectDescription.trim()) {
        notify('Please enter Project Title and Project Description.', 'error');
        return false;
      }
    }
    if (step === 4 && targetStep > 4) {
      if (!flags.acceptedTerms) {
        notify('Please accept the engineering review and quotation terms.', 'error');
        return false;
      }
    }
    return true;
  };

  const goStep = (next: 1 | 2 | 3 | 4 | 5) => {
    if (!validateStep(next)) return;
    setStep(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      await signInWithGoogle();
      return;
    }
    const finalDelivery = sameAddress ? billingAddress : deliveryAddress;
    if (!billingAddress || !finalDelivery) {
      notify('Please select or save both Billing and Delivery addresses.', 'error');
      return;
    }
    if (!flags.acceptedTerms) {
      notify('Please accept the terms before submitting.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const budgetSummary =
        form.budgetMinInr || form.budgetMaxInr
          ? `₹${form.budgetMinInr || '0'} – ₹${form.budgetMaxInr || 'Flexible'}`
          : form.estimatedBudget;

      const fd = new FormData();
      Object.entries({ ...form, estimatedBudget: budgetSummary }).forEach(([k, v]) =>
        fd.append(k, String(v))
      );
      fd.append('flags', JSON.stringify(flags));
      fd.append('billingAddress', JSON.stringify(billingAddress));
      fd.append('deliveryAddress', JSON.stringify(finalDelivery));
      files.forEach((f) => fd.append('attachments', f));

      const res = await apiFetch<{ enquiry: { enquiryNumber: string } }>('/api/project-enquiries', {
        method: 'POST',
        body: fd,
      });
      setSubmittedCode(res.enquiry.enquiryNumber);
      notify(`Project enquiry ${res.enquiry.enquiryNumber} submitted.`, 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to submit project enquiry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepsMeta: Array<{ num: 1 | 2 | 3 | 4 | 5; label: string }> = [
    { num: 1, label: 'Contact & Addresses' },
    { num: 2, label: 'Technical Scope' },
    { num: 3, label: 'Document Uploads' },
    { num: 4, label: 'Budget & Deliverables' },
    { num: 5, label: 'Review & Submit' },
  ];

  const finalDelivery = sameAddress ? billingAddress : deliveryAddress;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="text-xs font-semibold text-blue-700">Engineering R&amp;D &amp; Academic Projects</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-950">
          Project Enquiry &amp; Quotation
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Complete the guided engineering brief below. Our team evaluates technical feasibility and issues a 14-category itemized quotation directly inside your account.
        </p>
      </div>

      {!isSignedIn ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-950">Customer Sign-In Required</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Sign in with your account to submit project attachments securely, manage billing and delivery addresses, and receive quotations.
          </p>
          <button
            onClick={signInWithGoogle}
            className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg"
          >
            Sign In / Create Account
          </button>
        </div>
      ) : submittedCode ? (
        <div className="rounded-xl border border-blue-300 bg-blue-50 p-8 space-y-4">
          <div className="flex items-center gap-2 text-[#0B1B3B] font-display text-xl font-bold">
            <CheckCircle2 className="w-6 h-6 text-blue-700" />
            Enquiry Submitted: {submittedCode}
          </div>
          <p className="text-sm text-slate-700">
            Your enquiry and uploaded technical attachments are saved. Track all engineering workflow stages, accept quotations, and pay advance from your dashboard.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/my-account/project-enquiries')}
              className="px-5 py-2.5 bg-[#0B1B3B] hover:bg-[#132954] text-white text-sm font-semibold rounded-lg"
            >
              Track Project Enquiries
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="px-5 py-2.5 border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg bg-white"
            >
              View R&amp;D Projects
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 5-Step Progress Header */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {stepsMeta.map((s) => (
              <button
                key={s.num}
                type="button"
                onClick={() => {
                  if (s.num <= step || validateStep(s.num)) setStep(s.num);
                }}
                className={`p-3 rounded-xl border text-left transition-colors ${
                  step === s.num
                    ? 'border-blue-700 bg-blue-50 text-blue-950'
                    : s.num < step
                    ? 'border-[#0B1B3B] bg-slate-50 text-[#0B1B3B]'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                <div className="font-mono text-[11px] font-semibold">STEP {s.num} / 5</div>
                <div className="text-xs font-semibold mt-0.5 truncate">{s.label}</div>
              </button>
            ))}
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  1. Contact &amp; Organization Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    required
                    placeholder="Full Name *"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email *"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                  <input
                    required
                    placeholder="Mobile Number *"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                  <input
                    placeholder="Company or College Name"
                    value={form.companyOrCollege}
                    onChange={(e) => setForm({ ...form, companyOrCollege: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  Billing &amp; Project Delivery Addresses
                </h2>
                <AddressSelector
                  title="Billing Address"
                  addresses={addresses}
                  selected={billingAddress}
                  onSelect={setBillingAddress}
                  onAddressSaved={loadAddresses}
                />
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => setSameAddress(e.target.checked)}
                  />
                  Project delivery address is the same as billing address
                </label>
                {!sameAddress && (
                  <AddressSelector
                    title="Project Delivery Address"
                    addresses={addresses}
                    selected={deliveryAddress}
                    onSelect={setDeliveryAddress}
                    onAddressSaved={loadAddresses}
                  />
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => goStep(2)}
                  className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
                >
                  Continue to Technical Scope <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  2. Project Technical Specification &amp; Team Info
                </h2>
                <input
                  required
                  placeholder="Project Title *"
                  value={form.projectTitle}
                  onChange={(e) => setForm({ ...form, projectTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <select
                    value={form.engineeringBranch}
                    onChange={(e) => setForm({ ...form, engineeringBranch: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white"
                  >
                    {[
                      'Electronics & Communication (ECE)',
                      'Electrical Engineering',
                      'Computer Science / AI & ML',
                      'Mechanical / Mechatronics',
                      'Robotics & Aerospace',
                      'Industrial / Commercial R&D',
                    ].map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    value={form.academicLevel}
                    onChange={(e) => setForm({ ...form, academicLevel: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white"
                  >
                    {[
                      'B.E. / B.Tech Final Year',
                      'Mini Project',
                      'M.Tech / Research Prototype',
                      'Industrial / Startup Product',
                    ].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                  <select
                    value={form.projectCategory}
                    onChange={(e) => setForm({ ...form, projectCategory: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white"
                  >
                    {[
                      'AI & Machine Learning',
                      'Agricultural / Survey Drones',
                      'Robotics & Automation',
                      'IoT & Embedded Systems',
                      'PCB & Power Electronics',
                      '3D Printed Mechanical Prototype',
                    ].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <select
                    value={form.projectType}
                    onChange={(e) => setForm({ ...form, projectType: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="Hardware + Software">Hardware + Software</option>
                    <option value="Hardware Only">Hardware Only</option>
                    <option value="Software / AI Only">Software / AI Only</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    placeholder="Course / Department (e.g. Robotics Lab, R&D Dept)"
                    value={form.courseDepartment}
                    onChange={(e) => setForm({ ...form, courseDepartment: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                  <select
                    value={form.teamType}
                    onChange={(e) => setForm({ ...form, teamType: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm bg-white"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Student Group">Student Group</option>
                    <option value="Enterprise Team">Enterprise / Startup Team</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    placeholder="Team Size"
                    value={form.teamCount}
                    onChange={(e) => setForm({ ...form, teamCount: Math.max(1, Number(e.target.value)) })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>

                <textarea
                  required
                  rows={4}
                  placeholder="Project Description & Scope *"
                  value={form.projectDescription}
                  onChange={(e) => setForm({ ...form, projectDescription: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <textarea
                    rows={3}
                    placeholder="Problem Statement"
                    value={form.problemStatement}
                    onChange={(e) => setForm({ ...form, problemStatement: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                  <textarea
                    rows={3}
                    placeholder="Expected Functionality & Sensors / Actuators"
                    value={form.expectedFunctionality}
                    onChange={(e) => setForm({ ...form, expectedFunctionality: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="Required Technologies (e.g. ESP32, STM32, ROS2, YOLOv8)"
                    value={form.requiredTechnologies}
                    onChange={(e) => setForm({ ...form, requiredTechnologies: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                  <input
                    type="date"
                    placeholder="Target Completion Date"
                    value={form.targetCompletionDate}
                    onChange={(e) => setForm({ ...form, targetCompletionDate: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border border-slate-300 bg-white text-slate-800 text-sm font-semibold rounded-lg"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => goStep(3)}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
                >
                  Continue to Document Uploads <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  3. Technical Document Uploads
                </h2>
                <p className="text-xs text-slate-600">
                  Upload your project synopsis, block diagrams, CAD sketches, BOM sheets, or reference papers (up to 6 files, max 40 MB each). Optional if starting from a concept description.
                </p>
                <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:bg-slate-50 text-sm text-slate-600">
                  <Upload className="w-6 h-6 text-blue-700" />
                  <span className="font-medium">
                    {files.length > 0 ? `${files.length} file(s) selected` : 'Click to attach PDF, DOCX, PNG, JPG, ZIP, CSV'}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.csv,.txt"
                    onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 6))}
                    className="hidden"
                  />
                </label>

                {files.length > 0 && (
                  <div className="divide-y divide-slate-100 text-xs">
                    {files.map((f, i) => (
                      <div key={i} className="py-2 flex items-center justify-between gap-2">
                        <span className="font-mono text-slate-800">{f.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{(f.size / 1024).toFixed(1)} KB</span>
                          <button
                            type="button"
                            onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                            className="text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 border border-slate-300 bg-white text-slate-800 text-sm font-semibold rounded-lg"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => goStep(4)}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
                >
                  Continue to Budget &amp; Deliverables <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  4. Budget Range, Deliverables &amp; Consultation Preferences
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Minimum Budget (₹ INR)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 12000"
                      value={form.budgetMinInr}
                      onChange={(e) => setForm({ ...form, budgetMinInr: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Maximum Budget (₹ INR)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g. 35000"
                      value={form.budgetMaxInr}
                      onChange={(e) => setForm({ ...form, budgetMaxInr: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Consultation Mode</label>
                    <select
                      value={flags.consultationMode}
                      onChange={(e) => setFlags({ ...flags, consultationMode: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
                    >
                      <option value="Online Video Review">Online Video Review</option>
                      <option value="Phone Technical Discussion">Phone Technical Discussion</option>
                      <option value="In-Person (Nagpur Office)">In-Person (Nagpur Office)</option>
                      <option value="Async Dashboard / Email">Async Dashboard / Email</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-700">Required Engineering Modules &amp; Deliverables</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                    {[
                      ['needHardware', 'Hardware Build'],
                      ['needSoftware', 'Software / Firmware'],
                      ['needPcb', 'Custom PCB Design'],
                      ['need3dPrinting', '3D Printing / CAD'],
                      ['needAiMl', 'AI / ML Model'],
                      ['needIot', 'IoT & Cloud'],
                      ['needPrototype', 'Working Prototype'],
                      ['needDocumentation', 'Documentation / Report'],
                      ['needPpt', 'Presentation (PPT)'],
                      ['needResearchPaper', 'Research Paper Support'],
                    ].map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean((flags as any)[key])}
                          onChange={(e) => setFlags({ ...flags, [key]: e.target.checked })}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    placeholder="Expected Deliverables Summary (e.g. Working hardware + source code)"
                    value={form.expectedDeliverables}
                    onChange={(e) => setForm({ ...form, expectedDeliverables: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                  <input
                    placeholder="Special Requirements or Deadline Notes"
                    value={form.specialRequirements}
                    onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
                    className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
                  />
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flags.acceptedTerms}
                    onChange={(e) => setFlags({ ...flags, acceptedTerms: e.target.checked })}
                    className="mt-0.5"
                  />
                  <span>
                    I confirm these requirements are accurate for engineering feasibility analysis and agree to the{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/terms-and-conditions')}
                      className="text-blue-700 underline font-medium"
                    >
                      Terms &amp; Conditions
                    </button>{' '}
                    of NEXUSTEKFUSION PRIVATE LIMITED.
                  </span>
                </label>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 border border-slate-300 bg-white text-slate-800 text-sm font-semibold rounded-lg"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => goStep(5)}
                  className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
                >
                  Review Enquiry Summary <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5 text-sm">
                <h2 className="font-display text-lg font-bold text-slate-950">
                  5. Review &amp; Submit Enquiry
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-900">Contact &amp; Delivery</div>
                    <div>{form.customerName} · {form.customerPhone}</div>
                    <div className="text-slate-600">{form.customerEmail}</div>
                    {form.companyOrCollege && <div className="text-slate-600">{form.companyOrCollege} ({form.courseDepartment || form.teamType})</div>}
                    {finalDelivery && (
                      <div className="pt-2 border-t border-slate-200 text-slate-600">
                        Deliver to: {finalDelivery.houseFlat}, {finalDelivery.streetArea}, {finalDelivery.city}, {finalDelivery.state} — {finalDelivery.pinCode}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="font-semibold text-slate-900">Project Summary</div>
                    <div className="font-semibold text-blue-800">{form.projectTitle}</div>
                    <div className="text-slate-600">{form.engineeringBranch} · {form.projectCategory} · {form.projectType}</div>
                    <div className="text-slate-600 font-mono">
                      Budget: {form.budgetMinInr || form.budgetMaxInr ? `₹${form.budgetMinInr || '0'} – ₹${form.budgetMaxInr || 'Flexible'}` : 'Open to Quotation'}
                    </div>
                    <div className="text-slate-600">
                      Attachments: {files.length} file(s) · Consultation: {flags.consultationMode}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 border border-slate-300 bg-white text-slate-800 text-sm font-semibold rounded-lg"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Uploading & Submitting...' : 'Submit Project Enquiry'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};
