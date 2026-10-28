import React, { useState, useEffect } from 'react';
import { productsApi, offersApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { CreateProduceModal } from '../../components/CreateProduceModal';
import { ProductDetailModal } from '../../components/ProductDetailModal';
import { CuteTomPlaceholder } from '../../components/CuteTomPlaceholder';
import {
  Search,
  Plus,
  ArrowUpDown,
  Info,
  Calendar,
  MapPin,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2,
  Sprout,
  Eye,
  ShieldCheck
} from 'lucide-react';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains & Pulses', 'Spices & Condiments'];
const GRADES = ['All', 'Grade A', 'Grade B', 'Grade C'];

export const BuyerDiscoveryHub = () => {
  const { user, isFarmer } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedGrade, setSelectedGrade] = useState('Grade A');
  const [sortBy, setSortBy] = useState('featured');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewProductDetail, setViewProductDetail] = useState(null);

  // Track image load failures to gracefully show Cute Tom
  const [failedImageIds, setFailedImageIds] = useState({});

  // Make an Offer Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [proposedQuantity, setProposedQuantity] = useState('');
  const [counterNotes, setCounterNotes] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [offerError, setOfferError] = useState(null);
  const [offerSuccessMessage, setOfferSuccessMessage] = useState(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedGrade !== 'All') params.quality_grade = selectedGrade;
      if (sortBy) params.sort = sortBy;

      const res = await productsApi.getAll(params);
      setProducts(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch marketplace batches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedGrade, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedGrade('All');
    setSortBy('featured');
  };

  const handleImageError = (id) => {
    setFailedImageIds((prev) => ({ ...prev, [id]: true }));
  };

  const handleOpenOfferModal = (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedProduct(product);
    setProposedPrice(product.instant_buy_rate || product.base_price_per_unit);
    setProposedQuantity(product.min_order_quantity || 100);
    setCounterNotes(`Greetings ${product.farmer?.full_name || 'Farmer'}! We require ${product.min_order_quantity || 100} ${product.unit} of ${product.title} and propose ₹${product.instant_buy_rate || product.base_price_per_unit}/${product.unit} with immediate UPI escrow lock.`);
    setOfferError(null);
    setOfferSuccessMessage(null);
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    try {
      setSubmittingOffer(true);
      setOfferError(null);
      await offersApi.create({
        listing_id: selectedProduct.id,
        proposed_price_per_unit: parseFloat(proposedPrice),
        proposed_quantity: parseFloat(proposedQuantity),
        counter_notes: counterNotes,
      });

      setOfferSuccessMessage('Offer transmitted! Direct negotiation channel initiated.');
      setTimeout(() => {
        setSelectedProduct(null);
        navigate('/negotiations');
      }, 1200);
    } catch (err) {
      setOfferError(err.response?.data?.detail || 'Failed to submit price offer');
    } finally {
      setSubmittingOffer(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
      
      {/* 1. Deep Green Hero Banner */}
      <div className="bg-[#0c3931] text-white rounded-3xl p-8 sm:p-10 shadow-lg border border-[#0a2f28] relative overflow-hidden">
        <div className="max-w-3xl space-y-3.5 relative z-10">
          
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#082923] text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
            <Sprout className="w-3.5 h-3.5" />
            <span>FARM GATE DISCOVERY HUB</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Direct Agricultural Produce Marketplace
          </h1>

          <p className="text-sm text-emerald-100/80 leading-relaxed font-normal max-w-2xl">
            Connect directly with verified farmers. Browse standardized Grade A/B/C harvest batches, view moisture & quality passports, and propose dynamic negotiated prices with zero middleman commissions.
          </p>

          <div className="pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-xl bg-[#00d084] hover:bg-[#00ba76] text-slate-950 font-bold text-xs flex items-center space-x-2 shadow-md shadow-emerald-900/30 transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>List New Crop Produce</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. White Search & Filter Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        
        {/* Top Row: Search Input + Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by crop, variety, farmer or district (e.g. Nashik Onions, Shimla, Rice)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </form>

          <div className="flex items-center space-x-2 shrink-0">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-7 pr-8 py-2.5 text-xs font-bold text-slate-700 rounded-xl border border-slate-200 bg-white focus:outline-none cursor-pointer appearance-none"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="qty_desc">Stock: Highest Volume</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bottom Row: Category & Grade Pills */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          
          {/* CATEGORY: Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              CATEGORY:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#00a86b] text-white shadow-xs font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* GRADE: Pills */}
          <div className="flex items-center space-x-2 shrink-0 text-xs">
            <span className="font-bold text-[11px] text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              GRADE:
            </span>
            {GRADES.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedGrade === grade
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grade}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* 3. Section Title Bar */}
      <div className="flex items-center justify-between pt-1">
        <h3 className="text-xs font-black tracking-wider text-slate-500 uppercase">
          AVAILABLE PRODUCE ({products.length} BATCHES)
        </h3>
        <button
          onClick={handleResetFilters}
          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
        >
          Reset Filters
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. Produce Grid: Essential info on card face + View Details button */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading direct farm-gate produce batches...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2">
          <h4 className="text-base font-bold text-slate-800">No matching produce batches found</h4>
          <p className="text-xs text-slate-500">Try adjusting your filters or resetting to view all categories.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((item) => {
            const hasValidImage = item.image_url && !failedImageIds[item.id];

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Image Header with Grade and Category Pills */}
                  <div
                    onClick={() => setViewProductDetail(item)}
                    className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center"
                  >
                    {hasValidImage ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        onError={() => handleImageError(item.id)}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                      />
                    ) : (
                      /* Cute Tom Saying No Picture Available */
                      <CuteTomPlaceholder className="w-full h-full" />
                    )}
                    
                    {/* Top-left Grade badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-[11px] font-bold bg-[#e6f7f2] text-[#00a86b] border border-emerald-300/80 shadow-xs backdrop-blur-xs">
                        <span>🏷️ {item.quality_grade} Premium</span>
                        <Info className="w-3 h-3 text-emerald-600" />
                      </span>
                    </div>

                    {/* Top-right Category badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#111827]/90 text-white shadow-xs">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Content: Essential Details Only (Clean, Uncluttered) */}
                  <div className="p-5 space-y-3.5 text-xs">
                    <div>
                      <h4
                        onClick={() => setViewProductDetail(item)}
                        className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        {item.title}
                      </h4>
                      {item.variety && (
                        <span className="text-[11px] font-semibold text-emerald-700 block mt-0.5">
                          Variety: {item.variety}
                        </span>
                      )}
                    </div>

                    {/* Farm Origin & Location */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center space-x-1 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{item.location || 'Local Farm Mandi'}</span>
                      </span>
                      <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                        {item.farmer?.organization_name || item.farmer?.full_name}
                      </span>
                    </div>

                    {/* Essential Pricing & Stock Numbers */}
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          BASE ASK RATE
                        </span>
                        <span className="text-xl font-black text-slate-900">
                          ₹{item.base_price_per_unit}
                          <span className="text-xs font-normal text-slate-500">/{item.unit || 'Kg'}</span>
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          AVAILABLE STOCK
                        </span>
                        <span className="text-xs font-bold text-emerald-700 block">
                          {item.quantity} {item.unit || 'Kg'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          MOQ: {item.min_order_quantity} {item.unit || 'Kg'}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Bottom Action Buttons: View Details + Make an Offer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/40 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setViewProductDetail(item)}
                    className="py-2.5 px-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View Details</span>
                  </button>

                  <button
                    onClick={() => handleOpenOfferModal(item)}
                    className="py-2.5 px-3 text-xs font-bold text-white bg-[#00a86b] hover:bg-[#00915c] rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Make an Offer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Product Details Modal */}
      {viewProductDetail && (
        <ProductDetailModal
          product={viewProductDetail}
          onClose={() => setViewProductDetail(null)}
          onMakeOffer={(prod) => {
            setViewProductDetail(null);
            handleOpenOfferModal(prod);
          }}
        />
      )}

      {/* Make an Offer Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-slate-900">Make an Offer: {selectedProduct.title}</h4>
                <p className="text-xs text-slate-500">
                  {selectedProduct.quality_grade} • Stock: {selectedProduct.quantity} {selectedProduct.unit}
                </p>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="p-6 space-y-4 text-xs">
              {offerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{offerError}</span>
                </div>
              )}

              {offerSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{offerSuccessMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block">Farmer Ask Price</span>
                  <strong className="text-slate-900 text-sm">₹{selectedProduct.base_price_per_unit}/{selectedProduct.unit}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Instant Buy Rate</span>
                  <strong className="text-emerald-600 text-sm">₹{selectedProduct.instant_buy_rate || selectedProduct.base_price_per_unit}/{selectedProduct.unit}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Proposed Rate (₹/{selectedProduct.unit})
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={proposedPrice}
                    onChange={(e) => setProposedPrice(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Volume ({selectedProduct.unit})
                  </label>
                  <input
                    type="number"
                    min={selectedProduct.min_order_quantity}
                    max={selectedProduct.quantity}
                    required
                    value={proposedQuantity}
                    onChange={(e) => setProposedQuantity(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-900">Total Escrow Commitment:</span>
                <span className="text-base font-extrabold text-emerald-700">
                  ₹{(parseFloat(proposedPrice || 0) * parseFloat(proposedQuantity || 0)).toLocaleString()}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Proposal Message to Farmer
                </label>
                <textarea
                  rows="3"
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="px-5 py-2 font-bold text-white bg-[#00a86b] hover:bg-[#00915c] rounded-xl shadow-md shadow-emerald-600/30 flex items-center space-x-1.5"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{submittingOffer ? 'Transmitting...' : 'Propose Rate & Open Room'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Produce Harvest Modal */}
      {showCreateModal && (
        <CreateProduceModal
          onClose={() => setShowCreateModal(false)}
          onProductCreated={() => {
            fetchProducts();
          }}
        />
      )}

    </div>
  );
};
