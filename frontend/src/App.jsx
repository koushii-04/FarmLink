import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { RoleRoute } from './components/RoleRoute';

// Pages
import { BuyerDiscoveryHub } from './pages/buyer/BuyerDiscoveryHub';
import { NegotiationHub } from './pages/NegotiationHub';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';

// Farmer Experience
import { InventoryManager } from './pages/farmer/InventoryManager';
import { FarmerOrders } from './pages/farmer/FarmerOrders';

// Buyer Experience
import { BuyerOrders } from './pages/buyer/BuyerOrders';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Marketplace Discovery Hub matching Image 1 */}
                <Route path="/" element={<BuyerDiscoveryHub />} />
                <Route path="/buyer/browse" element={<BuyerDiscoveryHub />} />

                {/* Real-Time Negotiation Hub matching Image 5 */}
                <Route
                  path="/negotiations"
                  element={
                    <RoleRoute allowedRoles={['farmer', 'buyer']}>
                      <NegotiationHub />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/buyer/offers"
                  element={
                    <RoleRoute allowedRoles={['farmer', 'buyer']}>
                      <NegotiationHub />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/farmer/offers"
                  element={
                    <RoleRoute allowedRoles={['farmer', 'buyer']}>
                      <NegotiationHub />
                    </RoleRoute>
                  }
                />

                {/* Auth */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Farmer Command / Orders */}
                <Route
                  path="/farmer/inventory"
                  element={
                    <RoleRoute allowedRoles={['farmer']}>
                      <InventoryManager />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/farmer/orders"
                  element={
                    <RoleRoute allowedRoles={['farmer']}>
                      <FarmerOrders />
                    </RoleRoute>
                  }
                />

                {/* Buyer Procurement / Orders */}
                <Route
                  path="/buyer/orders"
                  element={
                    <RoleRoute allowedRoles={['buyer']}>
                      <BuyerOrders />
                    </RoleRoute>
                  }
                />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}
