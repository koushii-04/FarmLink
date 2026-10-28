import React, { useState } from 'react';
import { productsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ShieldCheck,
  Sprout,
  Check,
  AlertCircle,
  Upload,
  Camera,
  Trash2
} from 'lucide-react';
import { CuteTomPlaceholder } from './CuteTomPlaceholder';

export const CreateProduceModal = ({ onClose, onProductCreated }) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: 'Nashik Cured Red Onions',
    category: 'Vegetables',
    variety: 'Garwa Dark Red / 1121 Pusa',
    quality_grade: 'Grade A',
    moisture_content: '9.5',
    size_uniformity: '92',
    shelf_life_days: '45',
    pesticide_residue: 'FSSAI Export Standard',
    packaging_type: '50kg Ventilated Jute Bags',
    is_organic: false,
    quantity: '2500',
    unit: 'Kg',
    base_price_per_unit: '24',
    min_order_quantity: '100',
    instant_buy_rate: '23',
    min_floor_price: '20',
    image_url: '', // Default empty so Cute Tom shows unless photo is uploaded!
    location: user?.location || 'Lasalgaon, Nashik',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleGradeSelect = (grade) => {
    setFormData((prev) => ({ ...prev, quality_grade: grade }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please select a smaller photo.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image_url: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await productsApi.create({
        ...formData,
        quantity: parseFloat(formData.quantity),
        base_price_per_unit: parseFloat(formData.base_price_per_unit),
        min_order_quantity: parseFloat(formData.min_order_quantity),
        instant_buy_rate: formData.instant_buy_rate ? parseFloat(formData.instant_buy_rate) : undefined,
        min_floor_price: formData.min_floor_price ? parseFloat(formData.min_floor_price) : undefined,
        moisture_content: formData.moisture_content ? parseFloat(formData.moisture_content) : undefined,
        size_uniformity: formData.size_uniformity ? parseFloat(formData.size_uniformity) : undefined,
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : undefined,
        image_url: formData.image_url || null,
      });

      if (onProductCreated) {
        onProductCreated(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to list fresh produce harvest');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Dark Forest Green Header */}
        <div className="bg-[#0c3931] text-white p-6 sm:p-7 relative border-b border-[#0a2f28]">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#082823] text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/20">
            <Sprout className="w-3.5 h-3.5" />
            <span>FARMER INVENTORY MANAGER</span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight">
            List Fresh Produce Harvest
          </h3>
          <p className="text-xs text-emerald-100/80 mt-1">
            Publish your stock to institutional university messes, restaurants, and wholesalers.
          </p>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto text-xs font-semibold text-slate-700">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Upload with Cute Tom Preview if No Picture Uploaded */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Produce Photo (Optional)</span>
              </span>
              {formData.image_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 bg-white px-2 py-0.5 rounded-md border border-rose-200"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove (Show Cute Tom)</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Preview Box */}
              <div className="sm:col-span-5 h-36 rounded-xl border border-slate-300 overflow-hidden bg-white shadow-xs">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Produce Preview"
                    className="w-full h-full object-cover"
                    onError={handleRemovePhoto}
                  />
                ) : (
                  <CuteTomPlaceholder className="w-full h-full" />
                )}
              </div>

              {/* Upload Controls */}
              <div className="sm:col-span-7 space-y-2.5">
                <p className="text-[11px] text-slate-500 font-normal">
                  If left empty, Cute Tom will display saying "No picture available". You can upload from your computer anytime!
                </p>

                <div>
                  <label className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Picture from Computer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <input
                    type="url"
                    placeholder="Or enter image URL (https://...)"
                    value={formData.image_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image_url: e.target.value }))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 1: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                PRODUCE NAME / TITLE
              </label>
              <input
                type="text"
                required
                name="title"
                placeholder="e.g. Nashik Cured Red Onions"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                CROP CATEGORY
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains & Pulses">Grains & Pulses</option>
                <option value="Spices & Condiments">Spices & Condiments</option>
                <option value="Oilseeds">Oilseeds</option>
              </select>
            </div>
          </div>

          {/* Row 2: Variety & Produce Standard Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                VARIETY / CULTIVAR
              </label>
              <input
                type="text"
                name="variety"
                placeholder="e.g. Garwa Dark Red / 1121 Pusa"
                value={formData.variety}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                PRODUCE STANDARD GRADE
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Grade A', 'Grade B', 'Grade C'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeSelect(g)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      formData.quality_grade === g
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Green Bordered Box: TIERED QUALITY ASSURANCE SPECS */}
          <div className="p-4 sm:p-5 rounded-2xl border border-emerald-300 bg-emerald-50/20 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>TIERED QUALITY ASSURANCE SPECS</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Moisture Content (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="moisture_content"
                  value={formData.moisture_content}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Size Uniformity (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="size_uniformity"
                  value={formData.size_uniformity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Shelf Life (Days)
                </label>
                <input
                  type="number"
                  name="shelf_life_days"
                  value={formData.shelf_life_days}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Pesticide Residue Level
                </label>
                <select
                  name="pesticide_residue"
                  value={formData.pesticide_residue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                >
                  <option value="FSSAI Export Standard">FSSAI Export Standard</option>
                  <option value="Zero Chemical Organic">Zero Chemical Organic</option>
                  <option value="EU MRL Tested">EU MRL Tested</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Packaging Type
                </label>
                <input
                  type="text"
                  name="packaging_type"
                  placeholder="50kg Ventilated Jute Bags"
                  value={formData.packaging_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="create_is_organic"
                name="is_organic"
                checked={formData.is_organic}
                onChange={handleChange}
                className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="create_is_organic" className="text-xs text-slate-800 font-semibold cursor-pointer">
                Certified 100% Organic (NPOP / Jaivik Bharat)
              </label>
            </div>
          </div>

          {/* Row 3: Stock, Base Price, MOQ */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                TOTAL STOCK AVAILABLE
              </label>
              <div className="flex">
                <input
                  type="number"
                  required
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-l-xl border border-r-0 border-slate-300 bg-white focus:outline-none"
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="px-2 py-2 text-xs font-bold bg-slate-100 border border-slate-300 rounded-r-xl"
                >
                  <option value="Kg">Kg</option>
                  <option value="Kgs">Kgs</option>
                  <option value="Quintal">Quintal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                BASE PRICE (₹ / KG)
              </label>
              <input
                type="number"
                step="0.5"
                required
                name="base_price_per_unit"
                value={formData.base_price_per_unit}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                MIN ORDER (MOQ)
              </label>
              <input
                type="number"
                required
                name="min_order_quantity"
                value={formData.min_order_quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Light Gray/Blue Box */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                  INSTANT BUY RATE (₹ / KG)
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="instant_buy_rate"
                  value={formData.instant_buy_rate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-normal block mt-1">
                  Discounted rate for buyers bypassing negotiation
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                  MINIMUM NEGOTIATION FLOOR PRICE (₹ / KG)
                </label>
                <input
                  type="number"
                  step="0.5"
                  name="min_floor_price"
                  value={formData.min_floor_price}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-normal block mt-1">
                  Soft threshold below which buyer offers show a caution warning
                </span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/30 transition-all"
            >
              {submitting ? 'Publishing Batch...' : 'Publish Harvest Listing'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
