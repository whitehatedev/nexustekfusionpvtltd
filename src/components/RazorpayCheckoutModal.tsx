import React, { useState } from 'react';
import { ShieldCheck, CreditCard, X } from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

interface RazorpayModalProps {
  open: boolean;
  onClose: () => void;
  entityType: 'store_order' | 'printing_order' | 'project_quotation' | 'pcb_enquiry' | 'b2b_enquiry' | 'farmer_booking';
  entityId: number;
  paymentMode?: 'advance' | 'full' | 'balance';
  title: string;
  amountInr: number;
  createOrderUrl?: string;
  verifyUrl?: string;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const RazorpayCheckoutModal: React.FC<RazorpayModalProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  paymentMode,
  title,
  amountInr,
  createOrderUrl = '/api/payments/create-order',
  verifyUrl = '/api/payments/verify',
  onSuccess,
}) => {
  const { apiFetch, notify } = usePlatform();
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const orderData = await apiFetch<{
        mode: 'live_razorpay' | 'test_mode';
        razorpayOrderId: string;
        keyId: string | null;
        amountPaise: number;
        customer: { name: string; email: string; contact: string };
      }>(createOrderUrl, {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId, paymentMode }),
      });

      if (orderData.mode === 'live_razorpay' && orderData.keyId) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error('Failed to load Razorpay Checkout script.');
        }

        const rzp = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: 'INR',
          name: 'NEXUSTEKFUSION PRIVATE LIMITED',
          description: title,
          order_id: orderData.razorpayOrderId,
          prefill: orderData.customer,
          handler: async (resp: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            await apiFetch(verifyUrl, {
              method: 'POST',
              body: JSON.stringify({
                entityType,
                entityId,
                paymentMode,
                razorpayOrderId: resp.razorpay_order_id,
                razorpayPaymentId: resp.razorpay_payment_id,
                razorpaySignature: resp.razorpay_signature,
              }),
            });
            notify('Payment verified and confirmed.', 'success');
            onSuccess();
            onClose();
          },
          theme: { color: '#1d4ed8' },
        });
        rzp.open();
      } else {
        // Explicit server-verified Sandbox Test Mode when RAZORPAY_KEY_ID / SECRET are not configured
        await apiFetch(verifyUrl, {
          method: 'POST',
          body: JSON.stringify({
            entityType,
            entityId,
            paymentMode,
            razorpayOrderId: orderData.razorpayOrderId,
          }),
        });
        notify('Sandbox Test Payment verified on server.', 'success');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      notify(err?.message || 'Payment initiation failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-medium text-slate-500">Razorpay Secure Checkout</div>
            <h3 className="font-display text-lg font-bold text-slate-950 mt-0.5">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">Payable Amount</span>
          <span className="font-mono text-xl font-bold text-slate-950 tabular-nums">
            ₹{amountInr.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <span>
              Payments are created and HMAC-verified on the NexusTekFusion backend server. If live Razorpay API keys are not yet configured in environment variables, this transaction executes in labeled Sandbox Test Mode.
            </span>
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handlePay}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {loading ? 'Processing...' : `Pay ₹${amountInr.toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
};
