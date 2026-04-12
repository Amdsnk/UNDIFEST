import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";
import { lazy, Suspense } from "react";
import { AdminRoute } from "@/components/AdminRoute";
import { RequireProfile } from "@/components/RequireProfile";
import { VideoProvider } from "@/contexts/VideoContext";

// Lazy load all pages to reduce initial bundle size
const NotFound = lazy(() => import("@/pages/not-found"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const LivePage = lazy(() => import("@/pages/LivePage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const ProfileCompletionPage = lazy(() => import("@/pages/ProfileCompletionPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const PaymentPage = lazy(() => import("@/pages/PaymentPage"));
const PaymentSuccessPage = lazy(() => import("@/pages/PaymentSuccessPage"));
const PaymentCancelPage = lazy(() => import("@/pages/PaymentCancelPage"));
const CheckOrderPage = lazy(() => import("@/pages/CheckOrderPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const HowItWorksUserPage = lazy(() => import("@/pages/HowItWorksPage"));
const FAQPage = lazy(() => import("@/pages/FAQPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const BrandPage = lazy(() => import("@/pages/BrandPage"));

// Admin pages - loaded only when navigating to admin routes
const AdminLoginPage = lazy(() => import("@/pages/admin/AdminLoginPage"));
const DashboardPage = lazy(() => import("@/pages/admin/DashboardPage"));
const EventsListPage = lazy(() => import("@/pages/admin/EventsListPage"));
const CreateEventPage = lazy(() => import("@/pages/admin/CreateEventPage"));
const EditEventPage = lazy(() => import("@/pages/admin/EditEventPage"));
const EventParticipantsPage = lazy(() => import("@/pages/admin/EventParticipantsPage"));
const EventManagerPage = lazy(() => import("@/pages/admin/EventManagerPage"));
const BannersPage = lazy(() => import("@/pages/admin/BannersPage"));
const MembersPage = lazy(() => import("@/pages/admin/MembersPage"));
const TransactionsPage = lazy(() => import("@/pages/admin/TransactionsPage"));
const WinnersPage = lazy(() => import("@/pages/admin/WinnersPage"));
const VideosPage = lazy(() => import("@/pages/admin/VideosPage"));
const ReportsPage = lazy(() => import("@/pages/admin/ReportsPage"));
const PartnersPage = lazy(() => import("@/pages/admin/PartnersPage"));
const HowItWorksPage = lazy(() => import("@/pages/admin/HowItWorksPage"));
const TermsConditionsPage = lazy(() => import("@/pages/admin/TermsConditionsPage"));
const BanksPage = lazy(() => import("@/pages/admin/BanksPage"));
const SettingsPage = lazy(() => import("@/pages/admin/SettingsPage"));
const FooterPage = lazy(() => import("@/pages/admin/FooterPage"));
const IpWhitelistPage = lazy(() => import("@/pages/admin/IpWhitelistPage"));
const PaymentMethodsPage = lazy(() => import("@/pages/admin/PaymentMethodsPage"));
const PagesPage = lazy(() => import("@/pages/admin/PagesPage"));
const WebsiteConfirmPage = lazy(() => import("@/pages/admin/WebsiteConfirmPage"));
const EditLain2Page = lazy(() => import("@/pages/admin/EditLain2Page"));
const AdminManagementPage = lazy(() => import("@/pages/admin/AdminManagementPage"));
const DaftarTransferPage = lazy(() => import("@/pages/admin/DaftarTransferPage"));

// Minimal loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#16202a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Switch>
      {/* Public Routes - Protected by RequireProfile for logged in users */}
      <Route path="/">
        <RequireProfile><HomePage /></RequireProfile>
      </Route>
      <Route path="/live">
        <RequireProfile><LivePage /></RequireProfile>
      </Route>
      <Route path="/account" component={AccountPage} />
      <Route path="/complete-profile" component={ProfileCompletionPage} />
      <Route path="/history">
        <RequireProfile><HistoryPage /></RequireProfile>
      </Route>

      {/* Payment Routes - Must be before /payment/:eventId to avoid matching */}
      <Route path="/payment/success" component={PaymentSuccessPage} />
      <Route path="/payment/cancel" component={PaymentCancelPage} />
      <Route path="/payment/:eventId" component={PaymentPage} />
      <Route path="/cek-pesanan" component={CheckOrderPage} />

      <Route path="/terms" component={TermsPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/how-it-works" component={HowItWorksUserPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/brand" component={BrandPage} />

      {/* Admin Routes */}
      <Route path="/admin-panel-7x9k" component={AdminLoginPage} />
      <Route path="/admin-panel-7x9k/login" component={AdminLoginPage} />
      <Route path="/admin-panel-7x9k/dashboard">
        <AdminRoute><DashboardPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/events">
        <AdminRoute><EventsListPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/events/create">
        <AdminRoute><CreateEventPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/events/:id/edit">
        <AdminRoute><EditEventPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/events/:id/participants">
        <AdminRoute><EventParticipantsPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/event-manager">
        <AdminRoute><EventManagerPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/banners">
        <AdminRoute><BannersPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/members">
        <AdminRoute><MembersPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/transactions">
        <AdminRoute><TransactionsPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/winners">
        <AdminRoute><WinnersPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/videos">
        <AdminRoute><VideosPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/reports">
        <AdminRoute><ReportsPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/partners">
        <AdminRoute><PartnersPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/how-it-works">
        <AdminRoute><HowItWorksPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/terms-conditions">
        <AdminRoute><TermsConditionsPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/banks">
        <AdminRoute><BanksPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/settings">
        <AdminRoute><SettingsPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/footer">
        <AdminRoute><FooterPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/ip-whitelist">
        <AdminRoute><IpWhitelistPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/account-method">
        <AdminRoute><PaymentMethodsPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/policy">
        <AdminRoute><PagesPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/about">
        <AdminRoute><PagesPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/website-confirm">
        <AdminRoute><WebsiteConfirmPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/edit-lain2">
        <AdminRoute><EditLain2Page /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/admin-management">
        <AdminRoute><AdminManagementPage /></AdminRoute>
      </Route>
      <Route path="/admin-panel-7x9k/daftar-transfer">
        <AdminRoute><DaftarTransferPage /></AdminRoute>
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VideoProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </VideoProvider>
    </QueryClientProvider>
  );
}

export default App;
