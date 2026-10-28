import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../services/api';
import { RazorpayCheckoutModal } from '../../components/RazorpayCheckoutModal';
import {
  PackageCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  AlertCircle,
  QrCode
} from 'lucide-react';

export const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active payment modal order
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ordersApi.getAll();
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch procurement orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm('Confirm that the produce batch was delivered in good condition to release escrow?')) return;
    try {
      await ordersApi.updateStatus(orderId, { status: 'Delivered' });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to confirm delivery');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">
            <PackageCheck className="w-4 h-4" />
            <span>Procurement Lifecycle</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Procurement Orders & Escrow Payments</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track agreed procurement deals, initiate native Razorpay UPI payments, and verify delivery milestones.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading your procurement orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No procurement orders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once a farmer accepts your price proposal or you accept their counter-offer, click 'Generate Order' to begin payment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-slate-900">Order #{order.id}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.status === 'Confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.status === 'Dispatched'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'Delivered'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Producer: <strong className="text-slate-800">{order.farmer?.organization_name || order.farmer?.full_name}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Escrow Value</div>
                  <div className="text-xl font-extrabold text-emerald-700">₹{order.total_amount?.toLocaleString()}</div>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="py-2">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {['Pending Payment', 'Confirmed', 'Dispatched', 'Delivered'].map((step, idx) => {
                    const steps = ['Pending Payment', 'Confirmed', 'Dispatched', 'Delivered'];
                    const currentIdx = steps.indexOf(order.status);
                    const isDone = idx <= currentIdx;
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mb-1 ${
                            isDone
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className={`text-[11px] font-semibold ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-500 block">Produce Item</span>
                  <strong className="text-slate-900 text-sm">{order.listing?.title}</strong>
                  <span className="text-slate-500 block mt-0.5">{order.quantity} {order.unit} @ ₹{order.price_per_unit}/{order.unit}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Delivery Destination</span>
                  <p className="text-slate-800 font-medium">{order.delivery_address || 'Central Depot'}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Tracking & Shipment</span>
                  {order.tracking_number ? (
                    <div>
                      <strong className="text-indigo-700 font-mono">{order.tracking_number}</strong>
                      <span className="text-slate-500 block text-[11px]">{order.dispatch_notes}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Awaiting farmer dispatch</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                {order.status === 'Pending Payment' && (
                  <button
                    onClick={() => setPaymentModalOrder(order)}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-102"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay ₹{order.total_amount?.toLocaleString()} via Razorpay UPI Escrow</span>
                  </button>
                )}

                {order.status === 'Dispatched' && (
                  <button
                    onClick={() => handleConfirmDelivery(order.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Produce Receipt & Release Escrow</span>
                  </button>
                )}

                {order.status === 'Delivered' && (
                  <span className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Procurement Lifecycle Complete</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Razorpay UPI Checkout Modal */}
      {paymentModalOrder && (
        <RazorpayCheckoutModal
          order={paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          onPaymentSuccess={() => {
            setPaymentModalOrder(null);
            fetchOrders();
          }}
        />
      )}

    </div>
  );
};
