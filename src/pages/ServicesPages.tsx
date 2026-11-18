import React, { useState } from 'react';
import { ArrowRight, Upload, CheckCircle2 } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

interface ServiceSpec {
  slug: string;
  title: string;
  subtitle: string;
  image: string;
  capabilities: string[];
  applications: string[];
}

const SERVICES_DATA: Record<string, ServiceSpec> = {
  'ai-ml': {
    slug: 'ai-ml',
    title: 'Artificial Intelligence & Machine Learning',
    subtitle: 'Applied computer vision, predictive analytics, and intelligent automation tailored for industrial and field deployments.',
    image: '/src/assets/images/hero_nexustek_engineering_1794981062404.jpg',
    capabilities: [
      'AI Application Development',
      'Computer Vision & Real-Time Object Detection',
      'Image Processing & Crop / Defect Inspection',
      'Predictive Analytics & Time-Series Modeling',
      'Data Analysis & Automated Reporting Pipelines',
      'Intelligent Edge Automation (Jetson / Embedded Linux)',
    ],
    applications: ['Precision agriculture imaging', 'Automated optical quality inspection', 'Predictive equipment maintenance'],
  },
  'drone-development': {
    slug: 'drone-development',
    title: 'Drone Development & UAV Engineering',
    subtitle: 'Custom agricultural spraying drones, mapping UAVs, flight controller integration, and structural airframe prototyping.',
    image: '/src/assets/images/service_agri_drone_1794981061744.jpg',
    capabilities: [
      'Agricultural Spraying & Seeding Drones',
      'Survey & Photogrammetry Mapping Drones',
      'Custom Carbon-Fiber Airframe Development',
      'Payload & Gimbal Integration',
      'Flight Controller Tuning & Telemetry Systems',
      'UAV Electronics, Power Distribution & Repair',
    ],
    applications: ['Precision agriculture spraying', 'Topographic land surveying', 'Industrial infrastructure inspection'],
  },
  robotics: {
    slug: 'robotics',
    title: 'Robotics & Autonomous Systems',
    subtitle: 'Autonomous mobile robots, articulated robotic arms, kinematics, and closed-loop sensor control.',
    image: '/src/assets/images/service_robotics_automation_1794981063545.jpg',
    capabilities: [
      'Autonomous Mobile Robots (AMRs & Rovers)',
      'Multi-Axis Robotic Arms & Grippers',
      'Industrial Robotic Pick-and-Place Cells',
      'LiDAR SLAM & Ultrasonic Obstacle Avoidance',
      'Motor Control & Encoder Feedback Loops',
      'ROS2 / Embedded Control Firmware',
    ],
    applications: ['Warehouse material movement', 'Laboratory sample automation', 'Academic & R&D robotics testbeds'],
  },
  'iot-embedded': {
    slug: 'iot-embedded',
    title: 'IoT & Embedded Systems',
    subtitle: 'Reliable microcontroller firmware, wireless sensor networks, and cloud telemetry dashboards.',
    image: '/src/assets/images/service_pcb_electronics_1794981062614.jpg',
    capabilities: [
      'ESP32, STM32, Arduino & Raspberry Pi Architecture',
      'Multi-Protocol Sensor Integration (I2C, SPI, UART, CAN)',
      'Wireless Monitoring (Wi-Fi, LoRa, BLE, GSM/4G)',
      'Custom Web & Mobile IoT Dashboards',
      'Low-Power Embedded C/C++ Firmware',
      'Smart Environmental & Industrial Monitoring',
    ],
    applications: ['Smart agriculture soil/weather telemetry', 'Cold-chain & energy monitoring', 'Connected industrial equipment'],
  },
  automation: {
    slug: 'automation',
    title: 'Industrial & Workflow Automation',
    subtitle: 'Mechatronic actuation, PLC/microcontroller control cabinets, and custom assembly fixtures.',
    image: '/src/assets/images/service_robotics_automation_1794981063545.jpg',
    capabilities: [
      'Custom Actuator & Conveyor Control Systems',
      'Automated Test Jigs & Calibration Rigs',
      'Relay, VFD & Stepper/Servo Drive Integration',
      'Safety Interlocks & HMI Control Panels',
      'Data Logging & Process Traceability',
    ],
    applications: ['Small-batch manufacturing jigs', 'Automated QA test benches', 'Smart workshop automation'],
  },
};

export const ServicesOverviewPage: React.FC = () => {
  const { navigate } = usePlatform();
  const list = [
    ...Object.values(SERVICES_DATA),
    {
      slug: 'pcb-design',
      title: 'PCB Design & Fabrication',
      subtitle: 'Schematic capture, multi-layer Gerber layout, BOM engineering, and prototype assembly.',
      image: '/src/assets/images/service_pcb_electronics_1794981062614.jpg',
    },
    {
      slug: '3d-printing',
      title: 'Custom 3D Printing & Rapid Prototyping',
      subtitle: 'Interactive STL/OBJ viewer, real slicing engine, FDM & SLA materials, and online ordering.',
      image: '/src/assets/images/service_3d_printing_1794981063445.jpg',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      <div className="space-y-3 max-w-3xl">
        <div className="text-xs font-semibold text-blue-700">Services</div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">
          Comprehensive Engineering & Manufacturing Services
        </h1>
        <p className="text-slate-600 text-base leading-relaxed">
          From concept research and electronics schematics to autonomous UAVs, robotics, and custom 3D printed enclosures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {list.map((svc) => (
          <div key={svc.slug} className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col justify-between">
            <div>
              <div className="aspect-[16/10] bg-slate-100">
                <img src={svc.image} alt={svc.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              </div>
              <div className="p-6 space-y-2">
                <h2 className="font-display text-lg font-bold text-slate-950">{svc.title}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{svc.subtitle}</p>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => navigate(`/services/${svc.slug}`)}
                className="w-full py-2.5 px-4 bg-[#0B1B3B] hover:bg-[#132954] text-white text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-2"
              >
                Explore Service <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ServiceDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { navigate, settings } = usePlatform();
  const svc = SERVICES_DATA[slug];
  const krashi = settings.krashivantriInfo;

  if (!svc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold">Service Not Found</h1>
        <button onClick={() => navigate('/services')} className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm">
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-semibold text-blue-700">Engineering Service</div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">{svc.title}</h1>
          <p className="text-slate-600 text-base leading-relaxed">{svc.subtitle}</p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/project-enquiry')}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg inline-flex items-center gap-2"
            >
              Start Your Project <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="px-5 py-2.5 border border-slate-300 text-slate-800 text-sm font-semibold rounded-lg hover:bg-slate-100"
            >
              Request a Quote
            </button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <img src={svc.image} alt={svc.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-950">Core Capabilities</h2>
          <ul className="space-y-2.5 text-sm text-slate-700">
            {svc.capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="font-display text-xl font-bold text-slate-950">Industrial & Research Applications</h2>
          <ul className="space-y-2.5 text-sm text-slate-700">
            {svc.applications.map((app) => (
              <li key={app} className="flex items-start gap-2">
                <span className="text-blue-700 font-bold">·</span>
                <span>{app}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {slug === 'drone-development' && krashi && (
        <div className="rounded-xl border border-slate-800 bg-[#0B1B3B] text-white p-8 space-y-4">
          <div className="text-xs font-semibold text-blue-300">Verified UAV Platform</div>
          <h2 className="font-display text-2xl font-bold">{krashi.platformName}</h2>
          <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{krashi.summary}</p>
          {krashi.verifiedSpecs && krashi.verifiedSpecs.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {krashi.verifiedSpecs.map((sp, i) => (
                <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                  <div className="text-xs text-slate-400">{sp.label}</div>
                  <div className="font-mono text-sm font-semibold text-white mt-0.5">{sp.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Detailed KRASHIVANTRI specifications and payload options are published directly by NexusTekFusion engineers via Admin CMS.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const PcbServicePage: React.FC = () => {
  const { isSignedIn, dbUser, signInWithGoogle, apiFetch, notify, navigate } = usePlatform();
  const [form, setForm] = useState({
    customerName: dbUser?.fullName || '',
    email: dbUser?.email || '',
    mobile: dbUser?.mobile || '',
    boardDimensionsMm: '',
    layerCount: 2,
    boardQuantity: 5,
    assemblyRequired: false,
    surfaceFinish: 'HASL Lead-Free',
    specialInstructions: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCode, setSubmittedCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      await signInWithGoogle();
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
      files.forEach((f) => fd.append('attachments', f));

      const res = await apiFetch<{ enquiry: { enquiryNumber: string } }>('/api/pcb-enquiries', {
        method: 'POST',
        body: fd,
      });
      setSubmittedCode(res.enquiry.enquiryNumber);
      notify(`PCB enquiry ${res.enquiry.enquiryNumber} submitted for engineering quotation.`, 'success');
    } catch (err: any) {
      notify(err?.message || 'Failed to submit PCB enquiry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-6 space-y-4">
          <div className="text-xs font-semibold text-blue-700">PCB Design & Fabrication</div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">
            Custom PCB Design, Gerber Review & Assembly
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Submit your circuit diagrams, schematics, Gerber archives, and Bill of Materials (BOM). Our hardware engineers validate DFM tolerances and issue an itemized quotation and payment link — no unreliable automated guessing on complex multi-layer stackups.
          </p>
        </div>
        <div className="lg:col-span-6">
          <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <img
              src="/src/assets/images/service_pcb_electronics_1794981062614.jpg"
              alt="Multi-layer gold-plated PCB prototype"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {submittedCode ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-8 space-y-3">
          <h2 className="font-display text-xl font-bold text-[#0B1B3B]">
            PCB Enquiry Submitted — {submittedCode}
          </h2>
          <p className="text-sm text-slate-700">
            Our engineers are reviewing your files and specifications. Once quoted, you can pay directly from your Account Dashboard.
          </p>
          <button
            onClick={() => navigate('/my-account')}
            className="px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
          >
            View in My Account
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-bold text-slate-950">Request PCB Quotation</h2>
              <p className="text-xs text-slate-500">Upload Gerber (.zip/.gbr), schematics (.pdf), or BOM (.csv/.xlsx)</p>
            </div>
            {!isSignedIn && (
              <button
                type="button"
                onClick={signInWithGoogle}
                className="px-4 py-2 bg-[#0B1B3B] text-white text-xs font-semibold rounded-lg"
              >
                Sign In to Submit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              placeholder="Email Address *"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
            />
            <input
              required
              placeholder="Mobile Number *"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className="rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Board Dimensions (mm) *</label>
              <input
                required
                placeholder="e.g. 100 x 80"
                value={form.boardDimensionsMm}
                onChange={(e) => setForm({ ...form, boardDimensionsMm: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Layer Count</label>
              <select
                value={form.layerCount}
                onChange={(e) => setForm({ ...form, layerCount: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
              >
                {[1, 2, 4, 6, 8].map((l) => (
                  <option key={l} value={l}>{l} Layers</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Board Quantity</label>
              <input
                type="number"
                min={1}
                value={form.boardQuantity}
                onChange={(e) => setForm({ ...form, boardQuantity: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Surface Finish</label>
              <select
                value={form.surfaceFinish}
                onChange={(e) => setForm({ ...form, surfaceFinish: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
              >
                <option value="HASL Lead-Free">HASL Lead-Free</option>
                <option value="ENIG Gold">ENIG Gold</option>
                <option value="OSP">OSP</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.assemblyRequired}
              onChange={(e) => setForm({ ...form, assemblyRequired: e.target.checked })}
              className="rounded border-slate-300"
            />
            Include SMD / Through-Hole Component Assembly (PCBA)
          </label>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Upload Gerber / Schematics / BOM / Diagrams
            </label>
            <label className="flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-lg p-5 cursor-pointer hover:bg-slate-50 text-sm text-slate-600">
              <Upload className="w-4 h-4 text-blue-700" />
              <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Select files (.zip, .gbr, .pdf, .csv, .xlsx, .png)'}</span>
              <input
                type="file"
                multiple
                accept=".zip,.rar,.gbr,.gerber,.pdf,.csv,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="hidden"
              />
            </label>
          </div>

          <textarea
            rows={4}
            placeholder="Special instructions, impedance requirements, copper weight, or design scope..."
            value={form.specialInstructions}
            onChange={(e) => setForm({ ...form, specialInstructions: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : isSignedIn ? 'Submit PCB Quotation Request' : 'Sign In & Submit Request'}
          </button>
        </form>
      )}
    </div>
  );
};
