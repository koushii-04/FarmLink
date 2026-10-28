import React, { useState, useEffect } from 'react';
import { offersApi, ordersApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { TradeInvoiceModal } from '../components/TradeInvoiceModal';
import { RazorpayCheckoutModal } from '../components/RazorpayCheckoutModal';
import {
  Sprout,
  LogOut,
  ShieldCheck,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  FileText,
  CreditCard,
  Send,
  AlertCircle,
  Check
} from 'lucide-react';

export const NegotiationHub = () => {
  const { user, logout, isFarmer, isBuyer } = useAuth();
  const { socket, isConnected, joinOfferRoom, leaveOfferRoom, activeOfferUpdates } = useSocket();

  const [offers, setOffers] = useState([]);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Counter proposal form
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQty, setCounterQty] = useState('');
  const [counterText, setCounterText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [relatedOrder, setRelatedOrder] = useState(null);

  const fetchOffers = async (preferredOfferId = null) => {
    try {
      setLoading(true);
      setError(null);
      const res = await offersApi.getMyOffers();
      setOffers(res.data);

      if (res.data.length > 0) {
        const targetId = preferredOfferId || selectedOfferId || res.data[0].id;
        setSelectedOfferId(targetId);
        const detailRes = await offersApi.getById(targetId);
        setSelectedOffer(detailRes.data);
        setCounterPrice(detailRes.data.proposed_price_per_unit);
        setCounterQty(detailRes.data.proposed_quantity);

        // Fetch associated order if accepted
        if (detailRes.data.status === 'Accepted') {
          fetchRelatedOrder(detailRes.data.id);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch active negotiations');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedOrder = async (offerId) => {
    try {
      const ordersRes = await ordersApi.getAll();
      const match = ordersRes.data.find((o) => o.offer_id === offerId);
      if (match) setRelatedOrder(match);
    } catch (e) {
      console.warn('Could not fetch related order:', e);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [user?.id]);

  // Join socket room when selected offer changes
  useEffect(() => {
    if (selectedOfferId) {
      joinOfferRoom(selectedOfferId);
    }
    return () => {
      if (selectedOfferId) leaveOfferRoom(selectedOfferId);
    };
  }, [selectedOfferId]);

  // Synchronize live updates via Socket.io
  useEffect(() => {
    if (selectedOfferId && activeOfferUpdates[selectedOfferId]) {
      const update = activeOfferUpdates[selectedOfferId];
      setSelectedOffer((prev) => (prev ? { ...prev, ...update } : prev));
      setOffers((prev) =>
        prev.map((o) => (o.id === selectedOfferId ? { ...o, ...update } : o))
      );
      if (update.status === 'Accepted') {
        fetchRelatedOrder(selectedOfferId);
      }
    }
  }, [activeOfferUpdates, selectedOfferId]);

  const handleSelectOffer = async (id) => {
    setSelectedOfferId(id);
    try {
      const res = await offersApi.getById(id);
      setSelectedOffer(res.data);
      setCounterPrice(res.data.proposed_price_per_unit);
      setCounterQty(res.data.proposed_quantity);
      if (res.data.status === 'Accepted') {
        fetchRelatedOrder(res.data.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Turn verification
  const isTerminal = ['Accepted', 'Rejected', 'Expired'].includes(selectedOffer?.status);
  const isMyTurn = !isTerminal && selectedOffer && selectedOffer.last_action_user_id !== user?.id;

  // Actions
  const handleCounter = async (e) => {
    e.preventDefault();
    if (!isMyTurn || !selectedOffer) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await offersApi.counter(selectedOffer.id, {
        proposed_price_per_unit: parseFloat(counterPrice),
        proposed_quantity: parseFloat(counterQty),
        counter_notes: counterText,
      });
      setSelectedOffer(res.data);
      setCounterText('');
      fetchOffers(selectedOffer.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit counter offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAccept = async () => {
    if (!isMyTurn || !selectedOffer) return;
    try {
      setSubmitting(true);
      const res = await offersApi.accept(selectedOffer.id);
      setSelectedOffer(res.data);
      fetchRelatedOrder(selectedOffer.id);
      fetchOffers(selectedOffer.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept deal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!isMyTurn || !selectedOffer) return;
    const reason = prompt('Rejection reason:');
    try {
      setSubmitting(true);
      const res = await offersApi.reject(selectedOffer.id, { reason });
      setSelectedOffer(res.data);
      fetchOffers(selectedOffer.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reject deal');
    } finally {
      setSubmitting(false);
    }
  };

  // Parse timeline
  let timeline = [];
  if (selectedOffer?.timeline_json) {
    try {
      timeline = JSON.parse(selectedOffer.timeline_json);
    } catch (e) {
      timeline = [];
    }
  }

  // Fallback timeline if empty
  if (timeline.length === 0 && selectedOffer) {
    timeline = [
      {
        type: 'initial',
        sender_role: 'buyer',
        sender_name: selectedOffer.buyer?.full_name || 'Buyer',
        sender_org: selectedOffer.buyer?.organization_name || 'Institutional Procurement',
        proposed_price: selectedOffer.proposed_price_per_unit,
        proposed_quantity: selectedOffer.proposed_quantity,
        total_amount: selectedOffer.total_amount,
        text: selectedOffer.counter_notes || `Initial bid proposed at ₹${selectedOffer.proposed_price_per_unit}/unit.`,
        timestamp: '07:45 pm',
        date_str: 'Deal initiated',
      },
    ];
  }
  const handleProceedToPayment = async () => {
    // If the order already exists, just open the modal
    if (relatedOrder) {
      setShowPaymentModal(true);
      return;
    }

    // Otherwise, generate the order in the database first
    try {
      setSubmitting(true);
      setError(null);
      
      const address = `${user?.organization_name || user?.full_name || 'Buyer'} Hub, ${user?.location || 'Central Depot'}`;
      
      const res = await ordersApi.createFromOffer(selectedOffer.id, {
        delivery_address: address,
      });
      
      setRelatedOrder(res.data);
      setShowPaymentModal(true); // Now the modal will actually render!
      
    } catch (err) {
      console.error("Order generation failed:", err);
      setError(err?.response?.data?.detail || "Failed to generate order for payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      
      {/* 1. Dark Green Banner matching Image 5 */}
      <div className="bg-[#0c3931] text-white rounded-3xl p-7 sm:p-9 shadow-lg border border-[#0a2f28] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#082923] text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
            <Sprout className="w-3.5 h-3.5" />
            <span>STRUCTURED PRICE DISCOVERY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Real-Time Negotiation Hub
          </h1>

          <p className="text-xs text-emerald-100/80 leading-relaxed font-normal">
            Live multi-sided dynamic counter-offer engine between farmers and institutional buyers with immediate deal lock-in.
          </p>
        </div>

        {/* Right Corner Badge matching Image 5 */}
        <div className="p-3 bg-[#082923] rounded-2xl border border-emerald-500/20 flex items-center space-x-3 shrink-0">
          <div className="text-right text-xs">
            <span className="text-[10px] text-emerald-400 block font-medium">Logged in as</span>
            <span className="font-bold text-white block">
              {user?.full_name} ({user?.role === 'farmer' ? 'Farmer' : 'Buyer'})
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-xl bg-black/30 hover:bg-black/50 text-emerald-300 hover:text-white transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Two-Column Layout matching Image 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: ACTIVE NEGOTIATIONS (N) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
            <span className="text-xs font-black tracking-wider text-slate-500 uppercase">
              ACTIVE NEGOTIATIONS ({offers.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto">
            {offers.map((off) => {
              const isSelected = off.id === selectedOfferId;
              const isTurn = !['Accepted', 'Rejected', 'Expired'].includes(off.status) && off.last_action_user_id !== user?.id;

              return (
                <div
                  key={off.id}
                  onClick={() => handleSelectOffer(off.id)}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all flex items-start space-x-3 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/10'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <img
                    src={
                      off.listing?.image_url ||
                      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={off.listing?.title}
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200"
                  />

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {off.listing?.title}
                    </h4>
                    <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                      Farmer: {off.farmer?.organization_name || off.farmer?.full_name}
                    </span>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-slate-800">
                        Offer: ₹{off.proposed_price_per_unit}/{off.listing?.unit || 'Kg'} ({off.proposed_quantity} {off.listing?.unit || 'Kgs'})
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center space-x-1.5">
                      {off.status === 'Accepted' ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Deal Accepted</span>
                        </span>
                      ) : isTurn ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                          <span>Action Required</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                          {off.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Negotiation Thread & Deal Card */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          
          {selectedOffer ? (
            <div>
              
              {/* Top Bar matching Image 5 */}
              <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <img
                    src={
                      selectedOffer.listing?.image_url ||
                      'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=400&q=80'
                    }
                    alt={selectedOffer.listing?.title}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-200"
                  />
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {selectedOffer.listing?.quality_grade} Premium
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700">
                        {selectedOffer.listing?.category}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedOffer.listing?.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Volume: <strong>{selectedOffer.proposed_quantity} {selectedOffer.listing?.unit || 'Kgs'}</strong> • List Price: <strong>₹{selectedOffer.listing?.base_price_per_unit}/{selectedOffer.listing?.unit || 'Kg'}</strong>
                    </p>
                  </div>
                </div>

                {/* CURRENT OFFER ON TABLE */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 text-right shrink-0 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    CURRENT OFFER ON TABLE
                  </span>
                  <span className="text-xl font-black text-emerald-600 block leading-tight">
                    ₹{selectedOffer.proposed_price_per_unit}/{selectedOffer.listing?.unit || 'Kg'}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Total: ₹{selectedOffer.total_amount?.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Negotiation Thread Container */}
              <div className="p-6 sm:p-8 space-y-6 bg-slate-50/30">
                
                {/* Date separator matching Image 5 */}
                <div className="flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                    Deal initiated on 28 Aug, 07:45 pm
                  </span>
                </div>

                {/* Timeline Messages */}
                {timeline.map((msg, idx) => {
                  const isInitial = msg.type === 'initial';
                  const isAccepted = msg.type === 'accepted';

                  return (
                    <div key={idx} className="space-y-1.5">
                      
                      {/* Author Header */}
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-semibold px-1">
                        <span>
                          {msg.sender_name} ({msg.sender_org || (msg.sender_role === 'farmer' ? 'Farmer' : 'Buyer')})
                        </span>
                        <span>•</span>
                        <span>{msg.timestamp || '07:45 pm'}</span>
                      </div>

                      {/* Bubble Container: Dark for Initial Proposal (Image 5), Light for Counter */}
                      {isInitial ? (
                        <div className="bg-[#101e2e] text-white p-5 rounded-2xl shadow-sm space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                              INITIAL PROPOSAL
                            </span>
                            <span className="text-xl font-extrabold text-white">
                              ₹{msg.proposed_price}/{selectedOffer.listing?.unit || 'Kg'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed font-normal">
                            {msg.text}
                          </p>

                          <div className="pt-2 text-[11px] font-semibold text-slate-400 flex justify-between">
                            <span>Deal Total: ₹{msg.total_amount?.toLocaleString()} ({msg.proposed_quantity} {selectedOffer.listing?.unit || 'Kgs'})</span>
                            <span className="text-emerald-400">Escrow Ready</span>
                          </div>
                        </div>
                      ) : isAccepted ? (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl shadow-xs space-y-2">
                          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>DEAL ACCEPTED & LOCKED IN</span>
                          </div>
                          <p className="text-xs text-emerald-900">{msg.text}</p>
                          <div className="text-[11px] font-bold text-emerald-700">
                            Agreed Final Rate: ₹{msg.proposed_price}/{selectedOffer.listing?.unit || 'Kg'} • Total Escrow: ₹{msg.total_amount?.toLocaleString()}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700">
                              COUNTER PROPOSAL
                            </span>
                            <span className="text-xl font-extrabold text-slate-900">
                              ₹{msg.proposed_price}/{selectedOffer.listing?.unit || 'Kg'}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-normal">
                            {msg.text}
                          </p>

                          <div className="pt-2 text-[11px] font-semibold text-slate-500 flex justify-between">
                            <span>Total Volume: {msg.proposed_quantity} {selectedOffer.listing?.unit || 'Kgs'}</span>
                            <span className="text-emerald-600 font-bold">Total: ₹{msg.total_amount?.toLocaleString()}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}

                {/* Bottom Interactive Area */}
                {selectedOffer.status === 'Accepted' ? (
                  <div className="p-5 rounded-2xl bg-white border border-emerald-300 shadow-sm space-y-3">
                    <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Deal Locked at ₹{selectedOffer.proposed_price_per_unit}/{selectedOffer.listing?.unit || 'Kg'}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Both parties agreed on terms. The transaction is secured via native UPI escrow.
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center space-x-2 shadow-xs transition-colors"
                      >
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <span>View Official Escrow Invoice & Trade Bill</span>
                      </button>

                      {user?.role === 'buyer' && (!relatedOrder || relatedOrder.status === 'Pending Payment') && (
                        <button
                          onClick={handleProceedToPayment}
                          disabled={submitting}
                          className="px-5 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#00915c] text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/30 transition-all hover:scale-102 disabled:opacity-75"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>{submitting ? 'Connecting...' : 'Complete Razorpay UPI Escrow Payment'}</span>
                        </button>
                      )}
                      {/* ----------------------------------- */}
                      {/* {user?.role === 'buyer' && (!relatedOrder || relatedOrder.status === 'Pending Payment') && (
                        <button
                          onClick={() => setShowPaymentModal(true)}
                          className="px-5 py-2.5 rounded-xl bg-[#00a86b] hover:bg-[#00915c] text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-600/30 transition-all hover:scale-102"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Complete Razorpay UPI Escrow Payment</span>
                        </button>
                      )} */}
                    </div>
                  </div>
                ) : isMyTurn ? (
                  <form onSubmit={handleCounter} className="p-5 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                        Action Required: Propose Counter or Accept
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Strict Turn-Taking Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Counter Rate (₹/{selectedOffer.listing?.unit || 'Kg'})
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          required
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">
                          Volume ({selectedOffer.listing?.unit || 'Kgs'})
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={counterQty}
                          onChange={(e) => setCounterQty(e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">
                        Counter Rationale / Terms
                      </label>
                      <textarea
                        rows="2"
                        placeholder="Write your counter message to the counterparty..."
                        value={counterText}
                        onChange={(e) => setCounterText(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      ></textarea>
                    </div>

                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={handleReject}
                        disabled={submitting}
                        className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200"
                      >
                        Reject Offer
                      </button>
                      <button
                        type="button"
                        onClick={handleAccept}
                        disabled={submitting}
                        className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                      >
                        Accept Deal (Lock-in)
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Counter</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      Waiting for {selectedOffer.last_action_by === 'buyer' ? 'Farmer' : 'Buyer'}'s counter proposal... Turn-taking is locked to prevent race conditions.
                    </span>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="py-24 text-center text-slate-400 text-xs">
              Select an active negotiation from the left panel to enter the live negotiation room.
            </div>
          )}

        </div>

      </div>

      {/* Official Agricultural Trade Bill & Escrow Invoice Modal */}
      {showInvoiceModal && selectedOffer && (
        <TradeInvoiceModal
          order={relatedOrder}
          offer={selectedOffer}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {/* Razorpay UPI Checkout Modal */}
      {showPaymentModal && relatedOrder && (
        <RazorpayCheckoutModal
          order={relatedOrder}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
            fetchOffers(selectedOffer?.id);
          }}
        />
      )}

    </div>
  );
};
