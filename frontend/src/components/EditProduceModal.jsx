import React, { useState } from 'react';
import { productsApi } from '../services/api';
import {
  X,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Sparkles,
  Camera
} from 'lucide-react';
import { CuteTomPlaceholder } from './CuteTomPlaceholder';

export const EditProduceModal = ({ product, onClose, onProductUpdated }) => {
  if (!product) return null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: product.title || '',
    category: product.category || 'Vegetables',
    variety: product.variety || '',
    quality_grade: product.quality_grade || 'Grade A',
    quantity: product.quantity || '',
    unit: product.unit || 'Kg',
    base_price_per_unit: product.base_price_per_unit || '',
    min_order_quantity: product.min_order_quantity || '100',
    instant_buy_rate: product.instant_buy_rate || '',
    min_floor_price: product.min_floor_price || '',
    moisture_content: product.moisture_content || '9.5',
    size_uniformity: product.size_uniformity || '92',
    shelf_life_days: product.shelf_life_days || '45',
    pesticide_residue: product.pesticide_residue || 'FSSAI Export Standard',
    packaging_type: product.packaging_type || '50kg Ventilated Jute Bags',
    is_organic: product.is_organic || false,
    image_url: product.image_url || '',
    location: product.location || '',
    harvest_date: product.harvest_date || '',
    quality_notes: product.quality_notes || '',
    description: product.description || '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle local image file upload (converts to base64 Data URL)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller image.');
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

      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        base_price_per_unit: parseFloat(formData.base_price_per_unit),
        min_order_quantity: parseFloat(formData.min_order_quantity),
        instant_buy_rate: formData.instant_buy_rate ? parseFloat(formData.instant_buy_rate) : null,
        min_floor_price: formData.min_floor_price ? parseFloat(formData.min_floor_price) : null,
        moisture_content: formData.moisture_content ? parseFloat(formData.moisture_content) : null,
        size_uniformity: formData.size_uniformity ? parseFloat(formData.size_uniformity) : null,
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null,
        image_url: formData.image_url || null,
      };

      const res = await productsApi.update(product.id, payload);
      if (onProductUpdated) {
        onProductUpdated(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update produce listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0c3931] text-white p-6 relative border-b border-[#0a2f28] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase bg-[#082823] text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              FARMER DASHBOARD
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Edit Produce Batch #{product.id}
            </h3>
            <p className="text-xs text-emerald-100/80">
              Update pricing, available stock volume, quality tier, or produce photograph.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/35 flex items-center justify-center text-emerald-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto text-xs font-semibold text-slate-700">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Photo Management Section (With Cute Tom Placeholder Preview if No Picture!) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>Produce Photograph</span>
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
              {/* Preview Box: Either Uploaded Photo OR Cute Tom */}
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
                  Upload an image from your device or paste an image URL. If no picture is uploaded, Cute Tom will greet buyers!
                </p>

                {/* File picker */}
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

                {/* Or paste URL */}
                <div>
                  <input
                    type="url"
                    placeholder="Or paste image URL (https://...)"
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
                Produce Name / Title
              </label>
              <input
                type="text"
                required
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Crop Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              >
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
                <option value="Grains & Pulses">Grains & Pulses</option>
                <option value="Spices & Condiments">Spices & Condiments</option>
                <option value="Oilseeds">Oilseeds</option>
              </select>
            </div>
          </div>

          {/* Row 2: Variety & Grade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Variety / Cultivar
              </label>
              <input
                type="text"
                name="variety"
                value={formData.variety}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Quality Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Grade A', 'Grade B', 'Grade C'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, quality_grade: g }))}
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

          {/* Row 3: Stock, Base Price, MOQ */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                Available Stock ({formData.unit})
              </label>
              <input
                type="number"
                step="0.5"
                required
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                Base Ask Price (₹/{formData.unit})
              </label>
              <input
                type="number"
                step="0.5"
                required
                name="base_price_per_unit"
                value={formData.base_price_per_unit}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-1">
                Min Order (MOQ)
              </label>
              <input
                type="number"
                required
                name="min_order_quantity"
                value={formData.min_order_quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Pricing Controls: Instant Buy Rate & Floor */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Instant Buy Rate (₹/{formData.unit})
              </label>
              <input
                type="number"
                step="0.5"
                name="instant_buy_rate"
                value={formData.instant_buy_rate}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Minimum Negotiation Floor (₹/{formData.unit})
              </label>
              <input
                type="number"
                step="0.5"
                name="min_floor_price"
                value={formData.min_floor_price}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Moisture (%)</label>
              <input
                type="number"
                step="0.1"
                name="moisture_content"
                value={formData.moisture_content}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Size Uniformity (%)</label>
              <input
                type="number"
                step="0.1"
                name="size_uniformity"
                value={formData.size_uniformity}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">Shelf Life (Days)</label>
              <input
                type="number"
                name="shelf_life_days"
                value={formData.shelf_life_days}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
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
              {submitting ? 'Saving Changes...' : 'Save Product Updates'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
