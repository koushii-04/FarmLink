import React, { useState } from 'react';
import { paymentsApi, ordersApi } from '../services/api';
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  Lock,
  ArrowRight
} from 'lucide-react';

export const RazorpayCheckoutModal = ({ order, onClose, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [simulatedCheckoutOpen, setSimulatedCheckoutOpen] = useState(false);
  const [paymentSession, setPaymentSession] = useState(null);
  const [simulatingWebhook, setSimulatingWebhook] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!order) return null;

  const handleInitiatePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await paymentsApi.initiate(order.id);
      const sessionData = res.data;
      setPaymentSession(sessionData);

      // Check if standard Razorpay SDK is available
      if (window.Razorpay && !sessionData.key_id.startsWith('rzp_test_FarmlinkDev')) {
        const options = {
          key: sessionData.key_id,
          amount: Math.round(sessionData.amount * 100),
          currency: sessionData.currency || 'INR',
          name: 'FarmLink Agri Escrow',
          description: `Bulk Procurement Escrow for Order #${order.id}`,
          order_id: sessionData.razorpay_order_id,
          handler: async function (response) {
            try {
              // Client-side verification
              await paymentsApi.verify({
                order_id: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setSuccessMessage('Payment successful! Escrow confirmed.');
              if (onPaymentSuccess) onPaymentSuccess();
            } catch (vErr) {
              setError('Payment verification failed.');
            }
          },
          prefill: {
            name: order.buyer?.full_name || 'Institutional Buyer',
            email: order.buyer?.email || 'buyer@example.com',
            contact: order.buyer?.phone || '+919876543210',
          },
          theme: {
            color: '#059669',
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setError(`Payment Failed: ${response.error.description}`);
        });
        rzp.open();
      } else {
        // Fallback to simulated high-fidelity UPI checkout dialog
        setSimulatedCheckoutOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to initiate Razorpay checkout');
    } finally {
      setLoading(false);
    }
  };

  // Simulate Instant UPI payment completion
  const handleSimulateSuccessfulUPI = async () => {
    try {
      setLoading(true);
      setError(null);
      const simulatedPaymentId = `pay_${Date.now()}`;
      const simulatedSig = `simulated_sig_${paymentSession?.razorpay_order_id}`;

      await paymentsApi.verify({
        order_id: order.id,
        razorpay_order_id: paymentSession.razorpay_order_id,
        razorpay_payment_id: simulatedPaymentId,
        razorpay_signature: simulatedSig,
      });

      setSuccessMessage('Payment verified and locked in FarmLink Escrow! Order Confirmed.');
      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || 'Simulated verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Test Server-to-Server Webhook Reconciliation
  const handleTriggerWebhookReconciliation = async () => {
    try {
      setSimulatingWebhook(true);
      setError(null);

      const webhookPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: `pay_webhook_${Date.now()}`,
              order_id: paymentSession?.razorpay_order_id || `order_demo_${order.id}`,
              amount: Math.round(order.total_amount * 100),
              currency: 'INR',
              status: 'captured',
              method: 'upi',
            },
          },
        },
      };

      await paymentsApi.triggerWebhookReconciliation(
        webhookPayload,
        'simulated_wh_sig_valid'
      );

      setSuccessMessage('Server-to-server webhook callback verified! Database status reconciled.');
      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.detail || 'Webhook callback execution failed');
    } finally {
      setSimulatingWebhook(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Razorpay Native UPI Escrow
              </h3>
              <p className="text-xs text-slate-500">Order #{order.id} • Secure Automated Settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Order Summary Pill */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Item / Batch</span>
              <span className="font-semibold text-slate-800">{order.listing?.title}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Agreed Quantity</span>
              <span className="font-semibold text-slate-800">{order.quantity} {order.unit}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Agreed Unit Price</span>
              <span className="font-semibold text-slate-800">₹{order.price_per_unit}/{order.unit}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Total Escrow Amount</span>
              <span className="text-xl font-extrabold text-emerald-700">₹{order.total_amount?.toLocaleString()}</span>
            </div>
          </div>

          {/* Interactive Simulated Razorpay UI if active */}
          {simulatedCheckoutOpen ? (
            <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Razorpay UPI Sandbox Simulator</span>
                </span>
                <span className="text-[10px] font-semibold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                  Test Order: {paymentSession?.razorpay_order_id}
                </span>
              </div>

              <div className="flex items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="text-center space-y-1">
                  <div className="mx-auto w-24 h-24 bg-slate-900 p-2 rounded-lg text-white flex flex-col items-center justify-center">
                    <QrCode className="w-16 h-16" />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">UPI ID: farmlink.escrow@icici</div>
                  <div className="text-[10px] text-emerald-700 font-semibold">Scan with GPay, PhonePe, or Paytm</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleSimulateSuccessfulUPI}
                  disabled={loading}
                  className="w-full py-2.5 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
                >
                  <Lock className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : `Pay ₹${order.total_amount?.toLocaleString()} via UPI (Instant Success)`}</span>
                </button>

                <button
                  onClick={handleTriggerWebhookReconciliation}
                  disabled={simulatingWebhook}
                  className="w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center space-x-2 transition-colors"
                >
                  <span>⚡ Test Server-to-Server Webhook Reconciliation</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 space-y-1">
                <p className="font-semibold flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>FarmLink Escrow Protection</span>
                </p>
                <p className="text-[11px] text-amber-700">
                  Funds remain securely held in escrow until goods are dispatched and verified. Farmers are guaranteed automated payout upon delivery confirmation.
                </p>
              </div>

              <button
                onClick={handleInitiatePayment}
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-101"
              >
                <CreditCard className="w-4 h-4" />
                <span>{loading ? 'Initializing Gateway...' : 'Initiate Razorpay UPI Checkout'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-400">
          256-bit Encrypted • Direct Bank-to-Bank UPI Transfer • Zero Platform Intermediary Risk
        </div>

      </div>
    </div>
  );
};
