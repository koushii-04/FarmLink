import React, { useState, useEffect } from 'react';
import { offersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { NegotiationModal } from '../../components/NegotiationModal';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Filter
} from 'lucide-react';

export const FarmerOffers = () => {
  const { user } = useAuth();
  const { activeOfferUpdates } = useSocket();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeOfferId, setActiveOfferId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await offersApi.getMyOffers();
      setOffers(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch incoming offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Update real-time state if active offer updates via socket
  useEffect(() => {
    if (Object.keys(activeOfferUpdates).length > 0) {
      setOffers((prev) =>
        prev.map((off) =>
          activeOfferUpdates[off.id]
            ? { ...off, ...activeOfferUpdates[off.id] }
            : off
        )
      );
    }
  }, [activeOfferUpdates]);

  const filteredOffers =
    filterStatus === 'ALL'
      ? offers
      : offers.filter((o) => o.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Negotiation Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Incoming Buyer Price Offers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review live price bids from institutional buyers. Strict turn-taking prevents double-acceptances.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl">
          {['ALL', 'Pending', 'Countered', 'Accepted', 'Rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading incoming negotiations...</div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No offers found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When institutional buyers discover your produce listings and click 'Make an Offer', their live proposals will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((offer) => {
            const isMyTurn =
              !['Accepted', 'Rejected', 'Expired'].includes(offer.status) &&
              offer.last_action_user_id !== user?.id;

            return (
              <div
                key={offer.id}
                onClick={() => setActiveOfferId(offer.id)}
                className={`cursor-pointer bg-white rounded-2xl border transition-all p-5 shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isMyTurn
                    ? 'border-indigo-400 ring-2 ring-indigo-500/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="space-y-4">
                  
                  {/* Top Bar: Status + Turn Tag */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        offer.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : offer.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : offer.status === 'Countered'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-indigo-100 text-indigo-900'
                      }`}
                    >
                      {offer.status}
                    </span>

                    {isMyTurn ? (
                      <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 animate-pulse">
                        <Sparkles className="w-3 h-3" />
                        <span>Action Required</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">
                        Waiting for Buyer
                      </span>
                    )}
                  </div>

                  {/* Crop Info */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {offer.listing?.title || 'Produce Batch'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      From Buyer: <strong className="text-slate-800">{offer.buyer?.organization_name || offer.buyer?.full_name}</strong>
                    </p>
                  </div>

                  {/* Pricing Comparison Box */}
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Proposed Bid:</span>
                      <strong className="text-emerald-700 font-extrabold text-sm">
                        ₹{offer.proposed_price_per_unit}/{offer.listing?.unit || 'kg'}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Your Base Ask:</span>
                      <span>₹{offer.listing?.base_price_per_unit}/{offer.listing?.unit || 'kg'}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Requested Volume:</span>
                      <strong className="text-slate-900">{offer.proposed_quantity} {offer.listing?.unit || 'kg'}</strong>
                    </div>
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                      <span>Escrow Total:</span>
                      <span className="text-emerald-700">₹{offer.total_amount?.toLocaleString()}</span>
                    </div>
                  </div>

                  {offer.counter_notes && (
                    <p className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded-lg border border-amber-200/40 line-clamp-2">
                      "{offer.counter_notes}"
                    </p>
                  )}
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Enter Negotiation Room</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real-Time Interactive Negotiation Modal */}
      {activeOfferId && (
        <NegotiationModal
          offerId={activeOfferId}
          onClose={() => {
            setActiveOfferId(null);
            fetchOffers();
          }}
        />
      )}

    </div>
  );
};
