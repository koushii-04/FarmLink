import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Calendar,
  MapPin,
  TrendingUp,
  Package,
  CheckCircle2,
  Sprout,
  Info,
  Clock,
  Layers,
  Sparkles
} from 'lucide-react';
import { CuteTomPlaceholder } from './CuteTomPlaceholder';

export const ProductDetailModal = ({ product, onClose, onMakeOffer }) => {
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    // Disable scrolling on the background body when modal opens
    document.body.style.overflow = 'hidden';

    // Re-enable scrolling when modal closes (cleanup function)
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []); // Empty dependency array ensures this runs on mount/unmount
  // ----------------------
  
  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="bg-[#0c3931] text-white p-5 sm:p-6 flex items-start justify-between border-b border-[#0a2f28]">
          <div className="space-y-1.5 max-w-md">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <Award className="w-3.5 h-3.5 text-emerald-300" />
                <span>{product.quality_grade} Premium</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-black/30 text-slate-200 border border-white/10">
                {product.category}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {product.title}
            </h3>
            {product.variety && (
              <p className="text-xs text-emerald-200/90 font-medium">
                Cultivar / Variety: <strong className="text-white">{product.variety}</strong>
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 text-xs text-slate-700">
          
          {/* Main Visual & Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
            <div className="sm:col-span-5 h-44 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
              {product.image_url && !imgFailed ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <CuteTomPlaceholder className="w-full h-full" />
              )}
            </div>

            <div className="sm:col-span-7 space-y-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Farmer Base Ask Rate:</span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{product.base_price_per_unit}
                    <span className="text-xs font-normal text-slate-500">/{product.unit || 'Kg'}</span>
                  </span>
                </div>

                {product.instant_buy_rate && (
                  <div className="flex justify-between items-center text-emerald-700 font-semibold">
                    <span>Instant Buy Rate (Discounted):</span>
                    <span>₹{product.instant_buy_rate}/{product.unit || 'Kg'}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Available Batch Stock:</span>
                  <strong className="text-slate-900">{product.quantity} {product.unit || 'Kg'}</strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Minimum Order Quantity (MOQ):</span>
                  <strong className="text-slate-900">{product.min_order_quantity} {product.unit || 'Kg'}</strong>
                </div>
              </div>

              {/* Farmer Origin Pill */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-200/70 text-[11px]">
                <div className="flex items-center space-x-1.5 text-emerald-900">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{product.location || 'Lasalgaon, Nashik'}</span>
                </div>
                <div className="font-bold text-slate-800">
                  {product.farmer?.organization_name || product.farmer?.full_name || 'Verified Agro Producer'}
                </div>
              </div>
            </div>
          </div>

          {/* Description & Farm Notes */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              HARVEST BATCH DESCRIPTION
            </span>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 p-3.5 rounded-xl border border-slate-200">
              {product.description || 'Direct farm gate harvest batch sorted and packed under certified quality controls.'}
            </p>
          </div>

          {/* Tiered Quality Assurance Specs (Passport Box) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-emerald-300 bg-emerald-50/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>VERIFIED QUALITY ASSURANCE PASSPORT</span>
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                100% Quality Guaranteed
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Moisture Content</span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {product.moisture_content || 9.5}%
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Standard Optimal</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Size Uniformity</span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {product.size_uniformity || 92}%
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Graded Uniform</span>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Shelf Life</span>
                <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
                  {product.shelf_life_days || 45} Days
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Ventilated Life</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Pesticide Residue:</span>
                <strong className="text-slate-900">{product.pesticide_residue || 'FSSAI Export Standard'}</strong>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 font-medium">Packaging Type:</span>
                <strong className="text-slate-900">{product.packaging_type || '50kg Ventilated Jute Bags'}</strong>
              </div>
            </div>

            {product.quality_notes && (
              <div className="text-[11px] text-slate-600 italic bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 not-italic">Grading Notes:</span> {product.quality_notes}
              </div>
            )}
          </div>

          {/* Farm Origin & Logistic Specifications */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Harvest Date</span>
              <strong className="text-slate-800 flex items-center space-x-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{product.harvest_date || 'Fresh Season Harvest'}</span>
              </strong>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Escrow Protection</span>
              <strong className="text-emerald-700 flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>UPI Escrow Lock Enabled</span>
              </strong>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close Window
          </button>

          <button
            onClick={() => {
              onClose();
              if (onMakeOffer) onMakeOffer(product);
            }}
            className="px-6 py-2.5 text-xs font-bold text-white bg-[#00a86b] hover:bg-[#00915c] rounded-xl shadow-md shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-102"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Make an Offer (Negotiate)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
