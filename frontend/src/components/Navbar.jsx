import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Store,
  MessageSquare,
  LayoutGrid,
  ShoppingCart,
  Bell,
  LogOut,
  ChevronDown,
  User,
  CheckCircle2,
  Sprout,
  Users
} from 'lucide-react';

export const Navbar = () => {
  const { user, login, logout, isFarmer, isBuyer } = useAuth();
  const { isConnected, notifications, clearNotification } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === '/' && (location.pathname === '/' || location.pathname === '/buyer/browse')) return true;
    return location.pathname.startsWith(path);
  };

  const handleSwitchAccount = async (targetEmail) => {
    try {
      setShowUserMenu(false);
      await login(targetEmail, 'password123');
      if (targetEmail.includes('farmer')) {
        navigate('/');
      } else {
        navigate('/negotiations');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="z-60 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18 items-center">
          
          {/* Left: Brand Logo matching screenshots */}
          <div className="flex items-center space-x-10">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 20h10" />
                  <path d="M10 20c0-4.4 3.6-8 8-8" />
                  <path d="M4 20c0-6.6 5.4-12 12-12 1.5 0 3 .3 4.3.8" />
                </svg>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                    FarmLink
                  </span>
                </div>
              </div>
            </Link>

            {/* Navigation Tabs matching screenshots */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                to="/"
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isActive('/') && !location.pathname.startsWith('/negotiations') && !location.pathname.startsWith('/farmer/orders') && !location.pathname.startsWith('/buyer/orders')
                    ? 'bg-[#e6f7f2] text-emerald-800 border border-emerald-300/70 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Produce Market</span>
              </Link>
              
              {/* Add this Negotiation Hub link right after the Produce Market link */}
              {user && (
                <Link
                  to="/negotiations"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    location.pathname.startsWith('/negotiations')
                      ? 'bg-[#e6f7f2] text-emerald-800 border border-emerald-300/70 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>Negotiation Hub</span>
                </Link>
              )}

              {/* Farmer Inventory Tab */}
              {user && isFarmer && (
                <Link
                  to="/farmer/inventory"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    location.pathname.startsWith('/farmer/inventory')
                      ? 'bg-[#e6f7f2] text-emerald-800 border border-emerald-300/70 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <span>My Inventory</span>
                </Link>
              )}

              {user && isFarmer && (
                <Link
                  to="/farmer/orders"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    location.pathname.startsWith('/farmer/orders')
                      ? 'bg-[#e6f7f2] text-emerald-800 border border-emerald-300/70 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 text-emerald-600" />
                  <span>Farmer Command</span>
                </Link>
              )}

              {user && isBuyer && (
                <Link
                  to="/buyer/orders"
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                    location.pathname.startsWith('/buyer/orders')
                      ? 'bg-[#e6f7f2] text-emerald-800 border border-emerald-300/70 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <span>Buyer Procurement</span>
                </Link>
              )}
            </div>
          </div>

          {/* Right Action Items */}
          <div className="flex items-center space-x-4">
            
            {/* Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
                    <span>Negotiation Notifications</span>
                    <span className="text-[10px] text-slate-400">{notifications.length} new</span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No new notifications. Counter proposals and escrow updates appear here.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 hover:bg-slate-50 flex items-start space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-slate-800 text-[11px] font-medium">{n.text}</p>
                            <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Pill matching screenshot */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2.5 p-1.5 pl-2 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-white shadow-xs transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/60 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {isFarmer ? '🌾' : '🏢'}
                  </div>

                  <div className="text-left text-xs leading-tight hidden sm:block">
                    <span className="font-bold text-slate-800 block truncate max-w-[130px]">
                      {user.full_name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      {isFarmer ? 'Farmer Account' : 'Buyer Account'}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden p-2 text-xs">
                    <div className="p-2 border-b border-slate-100 mb-1">
                      <div className="font-bold text-slate-900">{user.full_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.organization_name}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 capitalize">
                        Role: {user.role}
                      </div>
                    </div>

                    {/* <div className="space-y-1 py-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
                        Switch Demo Role
                      </span>
                      <button
                        onClick={() => handleSwitchAccount('ramesh@farmer.com')}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center space-x-2 ${
                          user?.email === 'ramesh@farmer.com' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>🌾 Ramesh Patil (Patil Farms)</span>
                      </button>
                      <button
                        onClick={() => handleSwitchAccount('rao@farmer.com')}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center space-x-2 ${
                          user?.email === 'rao@farmer.com' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>🌶️ Kishan Rao (Rao Agri Co-op)</span>
                      </button>
                      <button
                        onClick={() => handleSwitchAccount('ananya@buyer.com')}
                        className={`w-full text-left px-2.5 py-2 rounded-xl flex items-center space-x-2 ${
                          isBuyer ? 'bg-amber-50 text-amber-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>🏢 Ananya Sharma (Buyer)</span>
                      </button>
                    </div> */}

                    <div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                          navigate('/login');
                        }}
                        className="w-full text-left px-2.5 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-semibold flex items-center space-x-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-xs font-bold">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                >
                  Sign Up
                </Link>
              </div>
            )}

          </div>

        </div>
      </div>
    </nav>
  );
};
