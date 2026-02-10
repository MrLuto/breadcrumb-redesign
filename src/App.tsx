import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PostcodeProvider } from "@/components/PostcodeChecker";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { ProtectedRoute } from "@/components/admin/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Assortiment from "./pages/Assortiment";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import PaymentReturn from "./pages/PaymentReturn";
import OverOns from "./pages/OverOns";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Profile from "./pages/auth/Profile";
import AuthCallback from "./pages/auth/AuthCallback";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCatalog from "./pages/admin/AdminCatalog";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminCompanies from "./pages/admin/AdminCompanies";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminDeliveryZones from "./pages/admin/AdminDeliveryZones";
import AdminOpeningHours from "./pages/admin/AdminOpeningHours";
import AdminProductOptions from "./pages/admin/AdminProductOptions";
import AdminPrinters from "./pages/admin/AdminPrinters";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PostcodeProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/assortiment" element={<Assortiment />} />
                <Route path="/bestellen" element={<Navigate to="/assortiment" replace />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/bestelling-bevestigd/:orderId" element={<OrderConfirmation />} />
                <Route path="/betaling/:orderId" element={<PaymentReturn />} />
                <Route path="/over-ons" element={<OverOns />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/registreren" element={<Register />} />
                <Route path="/profiel" element={<Profile />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                
                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/catalog" element={
                  <ProtectedRoute>
                    <AdminCatalog />
                  </ProtectedRoute>
                } />
                <Route path="/admin/categories" element={
                  <ProtectedRoute>
                    <AdminCatalog />
                  </ProtectedRoute>
                } />
                <Route path="/admin/products" element={
                  <ProtectedRoute>
                    <AdminCatalog />
                  </ProtectedRoute>
                } />
                <Route path="/admin/orders" element={
                  <ProtectedRoute>
                    <AdminOrders />
                  </ProtectedRoute>
                } />
                <Route path="/admin/companies" element={
                  <ProtectedRoute>
                    <AdminCompanies />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/delivery-zones" element={
                  <ProtectedRoute>
                    <AdminDeliveryZones />
                  </ProtectedRoute>
                } />
                <Route path="/admin/closed-days" element={
                  <ProtectedRoute>
                    <AdminOpeningHours />
                  </ProtectedRoute>
                } />
                <Route path="/admin/opening-hours" element={
                  <ProtectedRoute>
                    <AdminOpeningHours />
                  </ProtectedRoute>
                } />
                <Route path="/admin/product-options" element={
                  <ProtectedRoute>
                    <AdminProductOptions />
                  </ProtectedRoute>
                } />
                <Route path="/admin/printers" element={
                  <ProtectedRoute>
                    <AdminPrinters />
                  </ProtectedRoute>
                } />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PostcodeProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
