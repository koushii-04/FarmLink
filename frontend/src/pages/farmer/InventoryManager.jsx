import React, { useState, useEffect } from 'react';
import { productsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CreateProduceModal } from '../../components/CreateProduceModal';
import { EditProduceModal } from '../../components/EditProduceModal';
import { CuteTomPlaceholder } from '../../components/CuteTomPlaceholder';
import {
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Package,
  Calendar,
  MapPin,
  AlertCircle,
  Tag,
  CheckCircle2
} from 'lucide-react';

export const InventoryManager = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Track broken image URLs to fallback to Cute Tom
  const [failedImageIds, setFailedImageIds] = useState({});

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsApi.getMyListings();
      setListings(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch inventory listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleImageError = (id) => {
    setFailedImageIds((prev) => ({ ...prev, [id]: true }));
  };

  const handleDeleteListing = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove '${title}' from your inventory?`)) return;
    try {
      await productsApi.delete(id);
      setListings((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage(`Produce batch '${title}' removed successfully.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete listing');
    }
  };

  // Stats calculation
  const totalQuantity = listings.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalValuation = listings.reduce(
    (acc, curr) => acc + (curr.quantity || 0) * (curr.base_price_per_unit || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>PRODUCER CONTROL ROOM</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Farmer Inventory & Quality Grading</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your harvest listings, set available stock, upload produce photos, and assign standardized Grade A, B, or C tiers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>List New Harvest Batch</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Active Crop Batches</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{listings.length}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Directly discoverable by buyers</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Total Listed Produce</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {totalQuantity.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg/units</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Available for wholesale procurement</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Estimated Stock Value</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">
            ₹{Math.round(totalValuation).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Escrow settlement potential</div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Produce Listings Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading your farm produce batches...
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No produce batches listed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click 'List New Harvest Batch' to publish your crops with Grade A, B, or C certification to start receiving live buyer bids!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((item) => {
            const hasValidImage = item.image_url && !failedImageIds[item.id];

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Image & Grade Badge Header */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                    {hasValidImage ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        onError={() => handleImageError(item.id)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      /* Cute Tom Saying No Picture Available */
                      <CuteTomPlaceholder className="w-full h-full" />
                    )}

                    {/* Top-Left Quality Grade Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                          item.quality_grade === 'Grade A'
                            ? 'bg-emerald-600 text-white'
                            : item.quality_grade === 'Grade B'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-700 text-white'
                        }`}
                      >
                        {item.quality_grade}
                      </span>
                    </div>

                    {/* Top-Right Category Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/90 text-slate-700 shadow-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      {item.variety && (
                        <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                          Variety: {item.variety}
                        </span>
                      )}
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {item.description || item.quality_notes || `Direct farm gate batch harvested at ${item.location || 'farm hub'}.`}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-slate-600">
                        <span>Available Stock:</span>
                        {item.quantity === 0 ? (
                          <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-xs uppercase tracking-wider">
                            NO stock LEft
                          </span>
                        ) : (
                          <strong className="text-slate-900">{item.quantity} {item.unit || 'Kg'}</strong>
                        )}
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Min Order Quantity:</span>
                        <strong className="text-slate-900">{item.min_order_quantity} {item.unit || 'Kg'}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Base Ask Price:</span>
                        <strong className="text-emerald-700 font-extrabold text-sm">
                          ₹{item.base_price_per_unit}/{item.unit || 'Kg'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.location || 'Local Farm Hub'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.harvest_date || 'Fresh'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons: Edit Product + Delete Product */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">
                    Batch #{item.id}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingProduct(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors"
                      title="Edit this produce batch"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Edit Product</span>
                    </button>

                    <button
                      onClick={() => handleDeleteListing(item.id, item.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Edit Produce Modal */}
      {editingProduct && (
        <EditProduceModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={(updated) => {
            setListings((prev) =>
              prev.map((item) => (item.id === updated.id ? updated : item))
            );
            // Clear any previous image failure for this item
            setFailedImageIds((prev) => ({ ...prev, [updated.id]: false }));
            setSuccessMessage(`Produce batch '${updated.title}' updated successfully!`);
            setTimeout(() => setSuccessMessage(null), 3500);
          }}
        />
      )}

      {/* Add Produce Listing Modal */}
      {showAddModal && (
        <CreateProduceModal
          onClose={() => setShowAddModal(false)}
          onProductCreated={(created) => {
            setListings((prev) => [created, ...prev]);
            setSuccessMessage(`New harvest batch '${created.title}' published successfully!`);
            setTimeout(() => setSuccessMessage(null), 3500);
          }}
        />
      )}

    </div>
  );
};
