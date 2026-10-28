import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Lock, Mail, User, Building, MapPin, Phone, AlertCircle, ArrowRight } from 'lucide-react';

export const SignupPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'farmer',
    organization_name: '',
    phone: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const user = await signup(formData);
      if (user.role === 'farmer') {
        navigate('/farmer/inventory', { replace: true });
      } else {
        navigate('/buyer/browse', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to register account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-8 pb-6 text-center bg-slate-50 border-b border-slate-200">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mb-3 shadow-md shadow-emerald-600/20">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Create FarmLink Account</h2>
          <p className="text-xs text-slate-500 mt-1">Join as a Local Producer or Institutional Bulk Buyer</p>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Role Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: 'farmer' }))}
                  className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                    formData.role === 'farmer'
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-base mb-1">🌾 Farmer</span>
                  <span className="text-[11px] font-normal text-slate-500">Sell crops directly & negotiate bulk bids</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, role: 'buyer' }))}
                  className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                    formData.role === 'buyer'
                      ? 'border-amber-600 bg-amber-50/80 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <span className="text-base mb-1">🏢 Institutional Buyer</span>
                  <span className="text-[11px] font-normal text-slate-500">Procure verified Grade A/B/C batches with escrow</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    name="full_name"
                    placeholder="e.g. Ramesh Patel"
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Organization / Farm Name
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="organization_name"
                  placeholder="e.g. Patel Agro Farms or Reliance Wholesale"
                  value={formData.organization_name}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Location (State / District)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Nashik, Maharashtra"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  name="email"
                  placeholder="name@farmlink.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  name="password"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-bold hover:underline">
              Log in
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
