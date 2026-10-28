import React, { useState, useEffect } from 'react';
import { ordersApi } from '../../services/api';
import {
  PackageCheck,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertCircle,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const FarmerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dispatch modal state
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ordersApi.getAll();
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch farmer dispatch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDispatchOrder = async (e) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;
    try {
      setUpdating(true);
      await ordersApi.updateStatus(dispatchModalOrder.id, {
        status: 'Dispatched',
        tracking_number: trackingNumber,
        dispatch_notes: dispatchNotes,
      });
      setDispatchModalOrder(null);
      setTrackingNumber('');
      setDispatchNotes('');
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to mark order as dispatched');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    if (!window.confirm('Confirm delivery of produce batch to the buyer depot?')) return;
    try {
      await ordersApi.updateStatus(orderId, { status: 'Delivered' });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update order status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
          <Truck className="w-4 h-4" />
          <span>Fulfillment & Logistics Hub</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Farmer Dispatches & Order Tracking</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor incoming institutional procurement orders through the end-to-end lifecycle.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading procurement orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No active dispatch orders</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once a buyer accepts your counter-offer or you accept their proposal, and an order is confirmed, it will appear here for logistics fulfillment.
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
                    Buyer: <strong className="text-slate-800">{order.buyer?.organization_name || order.buyer?.full_name}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-400">Escrow Value</div>
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
                  <p className="text-slate-800 font-medium">{order.delivery_address || 'Central Sourcing Warehouse'}</p>
                </div>
                <div>
                  <span className="text-slate-500 block">Logistics Tracking</span>
                  {order.tracking_number ? (
                    <div>
                      <strong className="text-indigo-700 font-mono">{order.tracking_number}</strong>
                      <span className="text-slate-500 block text-[11px]">{order.dispatch_notes}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Not dispatched yet</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                {order.status === 'Confirmed' && (
                  <button
                    onClick={() => setDispatchModalOrder(order)}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Dispatch Shipment & Add Tracking</span>
                  </button>
                )}

                {order.status === 'Dispatched' && (
                  <button
                    onClick={() => handleMarkDelivered(order.id)}
                    className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Delivery Complete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Dispatch Order #{dispatchModalOrder.id}</h3>
              <button
                onClick={() => setDispatchModalOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Logistics Carrier & Tracking ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BlueDart Agri / MH-15-TR-9988"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dispatch Notes / Truck Details
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Loaded on refrigerated reefer truck. Temperature maintained at 4°C."
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {updating ? 'Updating...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
