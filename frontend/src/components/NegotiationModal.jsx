import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { offersApi, ordersApi } from '../services/api';
import { RazorpayCheckoutModal } from './RazorpayCheckoutModal';
import {
  X,
  Clock,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  Scale,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export const NegotiationModal = ({ offerId, onClose, onOrderCreated }) => {
  const { user } = useAuth();
  const { socket, joinOfferRoom, leaveOfferRoom, activeOfferUpdates } = useSocket();

  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Counter form state
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [showCounterForm, setShowCounterForm] = useState(false);

  // Time remaining
  const [timeLeft, setTimeLeft] = useState('');

  const [createdOrder, setCreatedOrder] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch initial offer data
  const fetchOffer = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await offersApi.getById(offerId);
      setOffer(res.data);
      setCounterPrice(res.data.proposed_price_per_unit);
      setCounterQty(res.data.proposed_quantity);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load offer negotiation details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (offerId) {
      fetchOffer();
      joinOfferRoom(offerId);
    }
    return () => {
      if (offerId) {
        leaveOfferRoom(offerId);
      }
    };
  }, [offerId]);

  // Synchronize when real-time updates arrive via Socket.io
  useEffect(() => {
    if (activeOfferUpdates[offerId]) {
      const update = activeOfferUpdates[offerId];
      setOffer((prev) => (prev ? { ...prev, ...update } : prev));
      if (update.proposed_price_per_unit) setCounterPrice(update.proposed_price_per_unit);
      if (update.proposed_quantity) setCounterQty(update.proposed_quantity);
    }
  }, [activeOfferUpdates, offerId]);

  // Calculate 24-hour expiry countdown
  useEffect(() => {
    if (!offer?.expires_at || ['Accepted', 'Rejected', 'Expired'].includes(offer.status)) {
      setTimeLeft('');
      return;
    }

    const interval = setInterval(() => {
      const diff = new Date(offer.expires_at).getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeLeft('Expired');
        setOffer((prev) => (prev ? { ...prev, status: 'Expired' } : prev));
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [offer?.expires_at, offer?.status]);

  if (!offerId) return null;

  // Turn-taking rule calculation
  const isTerminal = ['Accepted', 'Rejected', 'Expired'].includes(offer?.status);
  const isMyTurn = !isTerminal && offer && offer.last_action_user_id !== user?.id;
  const waitingForWho = offer?.last_action_by === 'buyer' ? 'Farmer' : 'Buyer';

  // Actions
  const handleCounter = async (e) => {
    e.preventDefault();
    if (!isMyTurn) return;
    try {
      setSubmitting(true);
      setError(null);

      // Emit via socket if connected, or fallback to REST API
      if (socket && socket.connected) {
        socket.emit(
          'counter_offer',
          {
            offer_id: offer.id,
            proposed_price_per_unit: parseFloat(counterPrice),
            proposed_quantity: parseFloat(counterQty),
            counter_notes: counterNotes,
          },
          (response) => {
            if (response?.error) {
              setError(response.error);
            } else {
              setShowCounterForm(false);
              setCounterNotes('');
            }
          }
        );
      } else {
        const res = await offersApi.counter(offer.id, {
          proposed_price_per_unit: parseFloat(counterPrice),
          proposed_quantity: parseFloat(counterQty),
          counter_notes: counterNotes,
        });
        setOffer(res.data);
        setShowCounterForm(false);
        setCounterNotes('');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit counter proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!isMyTurn) return;
    try {
      setSubmitting(true);
      setError(null);
      if (socket && socket.connected) {
        socket.emit('accept_offer', { offer_id: offer.id }, (response) => {
          if (response?.error) setError(response.error);
        });
      } else {
        const res = await offersApi.accept(offer.id);
        setOffer(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!isMyTurn) return;
    const reason = prompt('Please provide an optional rejection note:');
    try {
      setSubmitting(true);
      setError(null);
      if (socket && socket.connected) {
        socket.emit('reject_offer', { offer_id: offer.id, reason }, (response) => {
          if (response?.error) setError(response.error);
        });
      } else {
        const res = await offersApi.reject(offer.id, { reason });
        setOffer(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      console.log("1. Starting order creation...");
      setSubmitting(true);
      setError(null);
      
      // Ultra-safe address string that won't crash if 'user' is temporarily null
      const address = `${user?.organization_name || user?.full_name || 'Buyer'} Hub, ${user?.location || 'Central Depot'}`;
      console.log("2. Address generated safely:", address);
      
      console.log(`3. Calling API: /orders/from-offer/${offer.id}`);
      const res = await ordersApi.createFromOffer(offer.id, {
        delivery_address: address,
      });
      
      console.log("4. Backend Success! Order generated:", res.data);
      if (onOrderCreated) {
        onOrderCreated(res.data);
      }
      
      setCreatedOrder(res.data);
      setShowPaymentModal(true);

    } catch (err) {
      console.error("🚨 CRASH DETECTED:", err);
      // Safely extract the error message
      const errorMessage = err?.response?.data?.detail || err?.message || 'Failed to generate order';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg">
              #{offer?.id || offerId}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                <span>Negotiation Room</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-slate-200 text-slate-700">
                  {offer?.listing?.category || 'Produce'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Crop: <strong className="text-slate-700">{offer?.listing?.title || 'Listing'}</strong> ({offer?.listing?.quality_grade})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {timeLeft && (
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5" />
                <span>Expires in: {timeLeft}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
              <XCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm">Fetching real-time negotiation state...</p>
            </div>
          ) : (
            <>
              {/* Status & Turn Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  offer.status === 'Accepted'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : offer.status === 'Rejected'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : offer.status === 'Expired'
                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                    : isMyTurn
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-white/80 shadow-xs">
                    {offer.status === 'Accepted' ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : offer.status === 'Rejected' ? (
                      <XCircle className="w-6 h-6 text-rose-600" />
                    ) : isMyTurn ? (
                      <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
                    ) : (
                      <Clock className="w-6 h-6 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider opacity-75">
                      FSM State: <span className="underline">{offer.status}</span>
                    </div>
                    <div className="text-sm font-semibold mt-0.5">
                      {offer.status === 'Accepted'
                        ? 'Deal Locked! Both parties accepted terms.'
                        : offer.status === 'Rejected'
                        ? 'Offer rejected by counterparty.'
                        : offer.status === 'Expired'
                        ? 'Negotiation expired after 24 hours of inactivity.'
                        : isMyTurn
                        ? 'Your Turn! You may Accept, Reject, or Counter-propose.'
                        : `Waiting for ${waitingForWho}'s response (Turn-taking locked).`}
                    </div>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/90 shadow-xs">
                  {offer.status}
                </span>
              </div>

              {/* Deal Terms Metric Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Proposed Price</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                    ₹{offer.proposed_price_per_unit}
                    <span className="text-xs font-normal text-slate-500">/{offer.listing?.unit || 'kg'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Base: ₹{offer.listing?.base_price_per_unit}/{offer.listing?.unit}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Quantity</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {offer.proposed_quantity} {offer.listing?.unit || 'kg'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Available: {offer.listing?.quantity} {offer.listing?.unit}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <div className="text-xs text-emerald-700 font-medium">Total Escrow Value</div>
                  <div className="text-lg font-extrabold text-emerald-800 mt-0.5">
                    ₹{offer.total_amount?.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1">Native UPI / Escrow</div>
                </div>
              </div>

              {/* Counter Notes / Message */}
              {offer.counter_notes && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>Last Proposal Note</span>
                    <span className="text-[11px] font-normal text-slate-400">
                      (from {offer.last_action_by === 'buyer' ? 'Buyer' : 'Farmer'})
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 italic">"{offer.counter_notes}"</p>
                </div>
              )}

              {/* Counter Proposal Form (if opened) */}
              {showCounterForm && isMyTurn && (
                <form onSubmit={handleCounter} className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
                  <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Submit Counter Proposal</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        New Price (₹/{offer.listing?.unit || 'kg'})
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        required
                        value={counterPrice}
                        onChange={(e) => setCounterPrice(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quantity ({offer.listing?.unit || 'kg'})
                      </label>
                      <input
                        type="number"
                        min={offer.listing?.min_order_quantity || 1}
                        max={offer.listing?.quantity}
                        required
                        value={counterQty}
                        onChange={(e) => setCounterQty(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Counter Rationale / Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Can meet you halfway if delivery is expedited"
                      value={counterNotes}
                      onChange={(e) => setCounterNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCounterForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
                    >
                      {submitting ? 'Transmitting...' : 'Send Counter Offer'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {offer?.status === 'Accepted' ? (
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>Offer Accepted & Deal Sealed</span>
              </span>
            ) : isMyTurn ? (
              <span className="text-indigo-700 font-semibold flex items-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>Strict Turn-Taking: Action Required</span>
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                Turn locked. Waiting for counterparty.
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {offer?.status === 'Accepted' && user?.role === 'buyer' && (
              <button
                onClick={handleCreateOrder}
                disabled={submitting}
                className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-102"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{submitting ? 'Creating Order...' : 'Generate Order & Proceed to Pay'}</span>
              </button>
            )}

            {isMyTurn && !showCounterForm && (
              <>
                <button
                  onClick={handleReject}
                  disabled={submitting}
                  className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => setShowCounterForm(true)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center space-x-1"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Counter Offer</span>
                </button>
                <button
                  onClick={handleAccept}
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center space-x-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Accept Deal</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div> {/* <-- Closes the inner white modal box */}

      {/* Razorpay Modal positioned outside the inner container */}
      {showPaymentModal && createdOrder && (
        <RazorpayCheckoutModal 
          order={createdOrder}
          onClose={() => {
            setShowPaymentModal(false);
            onClose(); // Close the entire negotiation window if they cancel payment
          }}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            onClose();
          }}
        />
      )}
      
    </div> 
  );
};