import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sprout,
  Store,
  ShieldCheck,
  TrendingUp,
  Zap,
  ArrowRight,
  CheckCircle2,
  Users,
  Coins,
  Scale,
  Award,
  Layers
} from 'lucide-react';

export const LandingPage = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (email, password, redirectPath) => {
    try {
      await login(email, password);
      navigate(redirectPath);
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Top Pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
              <span>Next-Gen Agri-Tech B2B Direct Procurement</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Direct from Farms to <span className="text-emerald-600 underline decoration-emerald-400">Institutional Buyers</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Eliminate exploitative middlemen. FarmLink connects local agricultural cooperatives with supermarket chains, food processors, and wholesale institutions through dynamic real-time price negotiations, standardized quality grading, and native UPI escrow settlement.
            </p>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-10 max-w-2xl mx-auto p-4 bg-white rounded-2xl shadow-xl border border-slate-200">
            <div className="text-center mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ⚡ Instant 1-Click Evaluation Accounts
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickLogin('ramesh@farmer.com', 'password123', '/farmer/inventory')}
                className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition-all text-left flex items-center space-x-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  🌾
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950 group-hover:text-emerald-800">
                    Log In as Farmer
                  </div>
                  <div className="text-[11px] text-emerald-700">Ramesh Patel (Patel Agro Orchards)</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickLogin('ananya@buyer.com', 'password123', '/buyer/browse')}
                className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 transition-all text-left flex items-center space-x-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                  🏢
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-950 group-hover:text-amber-800">
                    Log In as Bulk Buyer
                  </div>
                  <div className="text-[11px] text-amber-700">Ananya Sharma (Reliance Fresh)</div>
                </div>
              </button>
            </div>
          </div>

          {/* Architecture Badges */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">Core Architecture:</span>
            <span className="px-3 py-1 rounded-lg bg-slate-200/70 font-medium">React 19 + Tailwind</span>
            <span className="px-3 py-1 rounded-lg bg-slate-200/70 font-medium">FastAPI Python</span>
            <span className="px-3 py-1 rounded-lg bg-slate-200/70 font-medium">MySQL + SQLAlchemy ORM</span>
            <span className="px-3 py-1 rounded-lg bg-slate-200/70 font-medium">Socket.io FSM Engine</span>
            <span className="px-3 py-1 rounded-lg bg-slate-200/70 font-medium">Razorpay Native UPI Escrow</span>
          </div>

          {/* Core Modules Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Standardized Quality Tiers</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Replaces subjective physical checks with standardized <strong>Grade A</strong> (Export), <strong>Grade B</strong> (Processing), and <strong>Grade C</strong> (Economy) batches with transparent parameters.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Negotiation FSM</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bidirectional Socket.io channel replacing rigid fixed prices. Strict turn-taking prevents double-acceptance race conditions with automated 24-hr expiry.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Razorpay Escrow & Webhooks</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seamless native UPI payments locked in escrow upon deal acceptance. Server-to-server webhook reconciliation prevents orphaned orders.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          FarmLink B2B Digital Marketplace • Built with Layered Client-Server Architecture
        </div>
      </footer>
    </div>
  );
};
