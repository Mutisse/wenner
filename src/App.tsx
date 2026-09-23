import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./contexts/CartContext";
import { LoginModalProvider } from "./contexts/LoginModalContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import ProductDetails from "./pages/ProductDetails";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Notifications from "./pages/Notifications";
import AllReviews from "./pages/AllReviews";
import NotFound from "./pages/NotFound";

import { store } from "./app/index";
import { Provider } from "react-redux";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrapper component to isolate errors per route
const RouteErrorBoundary = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

const App = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <LoginModalProvider>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <RouteErrorBoundary>
                        <ProtectedRoute requiredRole="client" redirectTo="/admin" requireAuth={false}>
                          <Index />
                        </ProtectedRoute>
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="/product/:slug"
                    element={
                      <RouteErrorBoundary>
                        <ProductDetails />
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <RouteErrorBoundary>
                        <ProtectedRoute requireAuth={true}>
                          <Profile />
                        </ProtectedRoute>
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="/auth"
                    element={
                      <RouteErrorBoundary>
                        <Auth />
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <RouteErrorBoundary>
                        <ProtectedRoute requiredRole={["admin", "manager"]}>
                          <Admin />
                        </ProtectedRoute>
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="/notificacoes"
                    element={
                      <RouteErrorBoundary>
                        <ProtectedRoute requireAuth={true}>
                          <Notifications />
                        </ProtectedRoute>
                      </RouteErrorBoundary>
                    }
                  />
                  <Route
                    path="/avaliacoes"
                    element={
                      <RouteErrorBoundary>
                        <ProtectedRoute requireAuth={true}>
                          <AllReviews />
                        </ProtectedRoute>
                      </RouteErrorBoundary>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route
                    path="*"
                    element={
                      <RouteErrorBoundary>
                        <NotFound />
                      </RouteErrorBoundary>
                    }
                  />
                </Routes>
              </LoginModalProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CartProvider>
      </QueryClientProvider>
    </Provider>
  </ErrorBoundary>
);

export default App;
