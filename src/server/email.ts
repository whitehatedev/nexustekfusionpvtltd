import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { projectEmailNotifications, siteSettings } from '../db/schema.ts';

export interface EmailTemplateDef {
  eventType: string;
  label: string;
  enabled: boolean;
  subject: string;
  body: string;
}

export const DEFAULT_PROJECT_EMAIL_TEMPLATES: EmailTemplateDef[] = [
  {
    eventType: 'enquiry_submitted',
    label: 'Project Enquiry Received',
    enabled: true,
    subject: 'Project Enquiry Received — {{enquiryNumber}} | NexusTekFusion',
    body: 'Dear {{customerName}}, we have received your project enquiry "{{projectTitle}}" ({{enquiryNumber}}). Our engineering team will review and respond shortly.',
  },
  {
    eventType: 'enquiry_under_review',
    label: 'Project Under Technical Review',
    enabled: true,
    subject: 'Technical Review Started — {{enquiryNumber}}',
    body: 'Dear {{customerName}}, your project enquiry {{enquiryNumber}} ("{{projectTitle}}") is currently under technical review by our engineering team.',
  },
  {
    eventType: 'quotation_sent',
    label: 'Quotation Ready',
    enabled: true,
    subject: 'Project Quotation Ready — {{quotationNumber}} ({{enquiryNumber}})',
    body: 'Dear {{customerName}}, your itemized quotation {{quotationNumber}} totaling ₹{{totalAmountInr}} (Advance: ₹{{advanceAmountInr}}, Balance: ₹{{balanceAmountInr}}) is ready in your dashboard.',
  },
  {
    eventType: 'project_approved',
    label: 'Project Approved — Advance Payment Required',
    enabled: true,
    subject: 'Project Approved — {{advancePercent}}% Advance Payment Required ({{enquiryNumber}})',
    body: 'Dear {{customerName}}, thank you for accepting quotation {{quotationNumber}}. Please pay the {{advancePercent}}% advance (₹{{advanceAmountInr}}) to activate your project work order.',
  },
  {
    eventType: 'advance_payment_confirmed',
    label: 'Advance Payment Confirmed & Project Activated',
    enabled: true,
    subject: 'Advance Payment Confirmed — Project {{projectCode}} Activated',
    body: 'Dear {{customerName}}, we have verified your advance payment of ₹{{amountInr}} (Ref: {{paymentRef}}). Project {{projectCode}} is now active.',
  },
  {
    eventType: 'project_started',
    label: 'Project Started',
    enabled: true,
    subject: 'Engineering Started — {{projectCode}}',
    body: 'Dear {{customerName}}, development work has started on project {{projectCode}} ("{{projectTitle}}"). Assigned Engineer: {{assignedEngineer}}.',
  },
  {
    eventType: 'milestone_updated',
    label: 'Project Milestone Updated',
    enabled: true,
    subject: 'Milestone Progress Update — {{projectCode}}',
    body: 'Dear {{customerName}}, project {{projectCode}} has a new milestone update: {{summary}}.',
  },
  {
    eventType: 'project_ready_for_final_payment',
    label: 'Project Completed — Final Payment Required',
    enabled: true,
    subject: 'Project Completed — Awaiting Final {{finalPercent}}% Payment ({{projectCode}})',
    body: 'Dear {{customerName}}, development & testing for {{projectCode}} are complete. Please pay the remaining balance of ₹{{balanceAmountInr}} to unlock final project handover and download deliverables.',
  },
  {
    eventType: 'final_payment_reminder',
    label: 'Final Payment Reminder',
    enabled: true,
    subject: 'Payment Reminder: Remaining Balance ₹{{balanceAmountInr}} — {{projectCode}}',
    body: 'Dear {{customerName}}, this is a friendly reminder to complete the remaining balance payment of ₹{{balanceAmountInr}} for {{projectCode}} so we can proceed with handover.',
  },
  {
    eventType: 'final_payment_confirmed',
    label: 'Final Payment Confirmed & Payment Cleared',
    enabled: true,
    subject: 'Payment Cleared — {{projectCode}} Ready for Handover',
    body: 'Dear {{customerName}}, your final payment of ₹{{amountInr}} (Ref: {{paymentRef}}) is verified. Clearance Certificate {{certificateNumber}} is issued and your project handover is now unlocked.',
  },
  {
    eventType: 'handover_ready',
    label: 'Project Ready for Handover',
    enabled: true,
    subject: 'Project Deliverables Ready for Download — {{projectCode}}',
    body: 'Dear {{customerName}}, final deliverables for {{projectCode}} are uploaded in your NexusTekFusion dashboard.',
  },
  {
    eventType: 'project_dispatched',
    label: 'Physical Hardware / Kit Dispatched',
    enabled: true,
    subject: 'Hardware Dispatched — {{projectCode}} via {{courierName}}',
    body: 'Dear {{customerName}}, your hardware deliverables for {{projectCode}} have been dispatched via {{courierName}} (Tracking: {{trackingNumber}}).',
  },
  {
    eventType: 'project_delivered',
    label: 'Project Handover Completed',
    enabled: true,
    subject: 'Project Delivered & Completed — {{projectCode}}',
    body: 'Dear {{customerName}}, project {{projectCode}} has been marked Delivered & Completed. Thank you for partnering with NEXUSTEKFUSION PRIVATE LIMITED.',
  },
  {
    eventType: 'payment_failed',
    label: 'Payment Failed / Cancelled',
    enabled: true,
    subject: 'Payment Attempt Unsuccessful — {{projectCode}}',
    body: 'Dear {{customerName}}, a recent payment attempt for {{projectCode}} did not complete. Please retry from your account dashboard.',
  },
  {
    eventType: 'enquiry_rejected',
    label: 'Project Enquiry Declined',
    enabled: true,
    subject: 'Update on Project Enquiry {{enquiryNumber}}',
    body: 'Dear {{customerName}}, thank you for reaching out. Unfortunately enquiry {{enquiryNumber}} could not proceed: {{reason}}.',
  },
];

function interpolateTemplate(tpl: string, vars: Record<string, string | number | undefined>): string {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_m, k) => (vars[k] !== undefined ? String(vars[k]) : ''));
}

export async function dispatchLifecycleEmail(params: {
  userId?: number | null;
  projectId?: number | null;
  enquiryId?: number | null;
  recipientEmail: string;
  eventType: string;
  vars: Record<string, string | number | undefined>;
}) {
  if (!params.recipientEmail || !params.recipientEmail.includes('@')) {
    return { deliveryStatus: 'failed', errorMessage: 'Missing valid recipient email' };
  }

  let templates = DEFAULT_PROJECT_EMAIL_TEMPLATES;
  try {
    const [row] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'projectEmailTemplates'))
      .limit(1);
    if (Array.isArray(row?.value)) {
      templates = row.value as EmailTemplateDef[];
    }
  } catch {
    // use defaults
  }

  const tpl =
    templates.find((t) => t.eventType === params.eventType) ||
    DEFAULT_PROJECT_EMAIL_TEMPLATES.find((t) => t.eventType === params.eventType);

  if (tpl && !tpl.enabled) {
    return { deliveryStatus: 'disabled', errorMessage: 'Template disabled by admin' };
  }

  const subject = interpolateTemplate(
    tpl?.subject || `NexusTekFusion Update — ${params.eventType}`,
    params.vars
  );
  const bodyText = interpolateTemplate(
    tpl?.body || 'Please check your NexusTekFusion account dashboard for updates.',
    params.vars
  );

  const fromEmail = process.env.EMAIL_FROM || 'NEXUSTEKFUSION <info@nexustekfusion.in>';
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const webhookUrl = process.env.EMAIL_WEBHOOK_URL?.trim();

  let provider = 'none';
  let deliveryStatus: 'sent' | 'failed' | 'not_configured' = 'not_configured';
  let providerMessageId = '';
  let errorMessage = '';

  if (resendKey) {
    provider = 'resend';
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [params.recipientEmail],
          subject,
          text: bodyText,
        }),
      });
      const json: any = await resp.json().catch(() => ({}));
      if (resp.ok && json?.id) {
        deliveryStatus = 'sent';
        providerMessageId = String(json.id);
      } else {
        deliveryStatus = 'failed';
        errorMessage = json?.message || `Resend HTTP ${resp.status}`;
      }
    } catch (err: any) {
      deliveryStatus = 'failed';
      errorMessage = err?.message || 'Resend request error';
    }
  } else if (webhookUrl) {
    provider = 'email_webhook';
    try {
      const resp = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromEmail,
          to: params.recipientEmail,
          subject,
          text: bodyText,
          eventType: params.eventType,
        }),
      });
      if (resp.ok) {
        deliveryStatus = 'sent';
        providerMessageId = `webhook-${Date.now()}`;
      } else {
        deliveryStatus = 'failed';
        errorMessage = `Email webhook HTTP ${resp.status}`;
      }
    } catch (err: any) {
      deliveryStatus = 'failed';
      errorMessage = err?.message || 'Email webhook error';
    }
  } else {
    errorMessage = 'No live email provider configured (RESEND_API_KEY or EMAIL_WEBHOOK_URL unset).';
  }

  try {
    await db.insert(projectEmailNotifications).values({
      userId: params.userId ?? null,
      projectId: params.projectId ?? null,
      enquiryId: params.enquiryId ?? null,
      recipientEmail: params.recipientEmail,
      eventType: params.eventType,
      subject,
      bodyPreview: bodyText.slice(0, 500),
      provider,
      deliveryStatus,
      providerMessageId,
      errorMessage,
    });
  } catch (err) {
    console.error('Email notification log write failed:', err);
  }

  return { deliveryStatus, provider, providerMessageId, errorMessage };
}
