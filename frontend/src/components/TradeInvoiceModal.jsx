import React from 'react';
import {
  X,
  Printer,
  ShieldCheck,
  CheckCircle2,
  FileText,
  BadgeCheck
} from 'lucide-react';

export const TradeInvoiceModal = ({ order, offer, onClose }) => {
  // If order is passed or offer is passed, derive details
  const listing = order?.listing || offer?.listing;
  const buyer = order?.buyer || offer?.buyer;
  const farmer = order?.farmer || offer?.farmer;

  const invoiceNumber = order?.invoice_number || (offer?.id === 1 ? 'INV-FARMLINK-7093' : `INV-FARMLINK-${4400 + (offer?.id || 99)}`);
  const invoiceDate = '1 September 2026';
  const agreedRate = order?.price_per_unit || offer?.proposed_price_per_unit || 21;
  const quantity = order?.quantity || offer?.proposed_quantity || 2000;
  const totalAmount = order?.total_amount || offer?.total_amount || (agreedRate * quantity);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Dark Header matching Image 3 & 4 */}
        <div className="bg-[#0b1727] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Agricultural Trade Bill & Escrow Invoice</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body Container */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          
          {/* Header Row: Logo & Invoice Number */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 20h10" />
                  <path d="M10 20c0-4.4 3.6-8 8-8" />
                  <path d="M4 20c0-6.6 5.4-12 12-12 1.5 0 3 .3 4.3.8" />
                </svg>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-black text-slate-900 tracking-tight">FarmLink</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Direct Mandi
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct Agricultural Marketplace Platform (0% Middleman Margin)
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                INVOICE NUMBER
              </span>
              <span className="text-lg font-extrabold text-slate-900 block tracking-tight font-mono">
                {invoiceNumber}
              </span>
              <span className="text-xs text-slate-500 mt-0.5 block">Date: {invoiceDate}</span>
            </div>
          </div>

          {/* Two Columns: Seller & Buyer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            
            {/* Seller */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                SELLER / FARM ORIGIN:
              </span>
              <h4 className="text-base font-bold text-slate-900">
                {farmer?.organization_name || 'Patil Organic & Agro Farms'}
              </h4>
              <p className="text-xs text-slate-600">
                Farmer: {farmer?.full_name || 'Rameshwar "Ramesh" Patil'}
              </p>
              <p className="text-xs text-slate-500">
                {farmer?.location || 'Lasalgaon, Nashik, Maharashtra - 422306'}
              </p>
              <p className="text-xs text-slate-500">
                Contact: {farmer?.phone || '+91 98224 81720'}
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Kisan Verified ID</span>
                </span>
              </div>
            </div>

            {/* Buyer */}
            <div className="space-y-1.5 sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                BILLED & SHIPPED TO:
              </span>
              <h4 className="text-base font-bold text-slate-900">
                {buyer?.organization_name || 'GreenFork Kitchens & University Hostels'}
              </h4>
              <p className="text-xs text-slate-600">
                Procurement: {buyer?.full_name || 'Ananya Sharma (Procurement Head)'}
              </p>
              <p className="text-xs text-slate-500">
                {order?.delivery_address || buyer?.location || 'Main Campus Delivery Gate 4, Vellore / Chennai Hub, Tamil Nadu - 560064'}
              </p>
              <p className="text-xs text-slate-500 font-mono">
                GSTIN: {buyer?.gstin || '33AABCU9603R1ZM'}
              </p>
            </div>

          </div>

          {/* Item Table matching screenshot */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">ITEM DESCRIPTION</th>
                  <th className="py-3 px-3 text-center">QUALITY GRADE</th>
                  <th className="py-3 px-3 text-center">QUANTITY</th>
                  <th className="py-3 px-3 text-right">AGREED RATE</th>
                  <th className="py-3 px-4 text-right">TOTAL AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900 text-sm">
                      {listing?.title || 'Nashik Premium Red Onions (Garwa Summer Crop)'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Direct Farm Gate Harvest • Batch #ORD-FL-2026-2901
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {listing?.quality_grade || 'Grade A'}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center text-slate-800 font-semibold">
                    {quantity} Kgs
                  </td>
                  <td className="py-4 px-3 text-right text-slate-800 font-semibold">
                    ₹{agreedRate}
                  </td>
                  <td className="py-4 px-4 text-right font-extrabold text-slate-900 text-sm">
                    ₹{totalAmount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Section: Payment Status Box & Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 items-end">
            
            {/* Left: Escrow Status Box */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Payment & Escrow Status</span>
              </div>
              <div className="text-xs text-slate-600">
                Method: <strong className="text-slate-900 font-semibold">UPI Escrow (Razorpay)</strong>
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Ref: UPI/VERIFIED/ESCROW_HOLD
              </div>
              <div className="text-xs font-bold text-emerald-600 pt-0.5">
                Escrow Status: Secured in Escrow
              </div>
            </div>

            {/* Right: Totals Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Produce Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Agri-Freight & Handling:</span>
                <span className="font-semibold text-emerald-600">Included</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Commission:</span>
                <span className="font-semibold text-emerald-600">₹0 (0% Direct)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (Unprocessed Agri):</span>
                <span className="font-semibold text-slate-900">₹0 (Exempt)</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold">
                <span className="text-slate-900">Final Total:</span>
                <span className="text-xl text-emerald-600">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
