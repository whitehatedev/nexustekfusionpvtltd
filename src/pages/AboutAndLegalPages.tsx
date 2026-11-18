import React from 'react';
import { ArrowRight } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

export const AboutPage: React.FC = () => {
  const { settings, navigate } = usePlatform();
  const company = settings.companyInfo;
  const testimonials = settings.testimonials || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 space-y-12">
      <div className="space-y-4 border-b border-slate-200 pb-8">
        <div className="text-xs font-semibold text-blue-700">Company Profile</div>
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-950">
          {company?.legalName || 'NEXUSTEKFUSION PRIVATE LIMITED'}
        </h1>
        <p className="text-lg text-slate-600 leading-relaxed">
          {company?.primaryTagline || 'Transforming Ideas into Reality'} —{' '}
          {company?.secondaryTagline || 'Engineering the Future with Intelligence'}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-1">
          <div className="text-xs text-slate-500">Founder & CEO</div>
          <div className="font-display font-bold text-slate-950 text-base">
            {company?.founderCeo || 'Sahil Prakash Bhagat'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-1">
          <div className="text-xs text-slate-500">Corporate Identification Number (CIN)</div>
          <div className="font-mono font-semibold text-slate-950">
            {company?.cin || 'U30305ME2026PTC474052'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-1">
          <div className="text-xs text-slate-500">Established</div>
          <div className="font-mono font-semibold text-slate-950">
            {company?.established || '2026'} · Nagpur, India
          </div>
        </div>
      </div>

      <div className="prose prose-slate max-w-none space-y-4 text-slate-700 leading-relaxed">
        <p>
          NexusTekFusion Private Limited is an engineering, technology development and innovation company headquartered at H NO. 565/19 NIT, SANKUL NEW COTTON MARK, Ganjipeth, Nagpur 440018, Maharashtra, India.
        </p>
        <p>
          We specialize in Artificial Intelligence & Machine Learning, Agricultural Drones & UAV Systems, Robotics & Autonomous Platforms, IoT & Embedded Systems, PCB Design & Electronics, 3D Printing & Rapid Prototyping, Industrial Automation, and customized engineering product development.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-950">Core Technologies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            'Artificial Intelligence and Machine Learning',
            'Agricultural Drones and Drone Technology',
            'Robotics and Autonomous Systems',
            'IoT and Smart Devices',
            'Embedded Systems (ESP32, STM32, Raspberry Pi)',
            'PCB Design and Electronics Assembly',
            '3D Printing and Rapid Prototyping',
            'Industrial Automation & Product Engineering',
          ].map((tech) => (
            <div key={tech} className="rounded-lg border border-slate-200 bg-white px-4 py-3 font-medium text-slate-800">
              {tech}
            </div>
          ))}
        </div>
      </div>

      {testimonials.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-slate-950">Client Feedback</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
                <p className="text-sm text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                <div className="text-xs font-semibold text-slate-950">
                  {t.name} · {t.role}, {t.org}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
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
          Contact Us
        </button>
      </div>
    </div>
  );
};

export const FaqPage: React.FC = () => {
  const { settings } = usePlatform();
  const faqs = settings.faqs || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-8">
      <div className="space-y-2 border-b border-slate-200 pb-6">
        <div className="text-xs font-semibold text-blue-700">Help Center</div>
        <h1 className="font-display text-3xl font-bold text-slate-950">Frequently Asked Questions</h1>
      </div>
      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 space-y-2">
            <h3 className="font-display font-semibold text-slate-950">{item.q}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PolicyPage: React.FC<{
  type: 'shipping' | 'returnRefund' | 'privacy' | 'terms';
  title: string;
}> = ({ type, title }) => {
  const { settings } = usePlatform();
  const content = settings.policies?.[type] || '';
  const company = settings.companyInfo;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14 space-y-6">
      <div className="border-b border-slate-200 pb-6 space-y-1">
        <div className="text-xs font-semibold text-blue-700">Legal & Compliance</div>
        <h1 className="font-display text-3xl font-bold text-slate-950">{title}</h1>
        <div className="text-xs text-slate-500 font-mono">
          {company?.legalName} · CIN {company?.cin}
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
        {content}
      </div>
    </div>
  );
};
