import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/ScrollToTop";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import LivePage from "@/pages/LivePage";
import AccountPage from "@/pages/AccountPage";
import ProfileCompletionPage from "@/pages/ProfileCompletionPage";
import HistoryPage from "@/pages/HistoryPage";
import PaymentPage from "@/pages/PaymentPage";
import PaymentSuccessPage from "@/pages/PaymentSuccessPage";
import PaymentCancelPage from "@/pages/PaymentCancelPage";
import CheckOrderPage from "@/pages/CheckOrderPage";
import TermsPage from "@/pages/TermsPage";
import PrivacyPage from "@/pages/PrivacyPage";
import HowItWorksUserPage from "@/pages/HowItWorksPage";
import FAQPage from "@/pages/FAQPage";
import AboutPage from "@/pages/AboutPage";
import BrandPage from "@/pages/BrandPage";
import AdminLoginPage from "@/pages/admin/AdminLoginPage";
import DashboardPage from "@/pages/admin/DashboardPage";
import EventsListPage from "@/pages/admin/EventsListPage";
import CreateEventPage from "@/pages/admin/CreateEventPage";
import EditEventPage from "@/pages/admin/EditEventPage";
import EventParticipantsPage from "@/pages/admin/EventParticipantsPage";
import EventManagerPage from "@/pages/admin/EventManagerPage";
import BannersPage from "@/pages/admin/BannersPage";
import MembersPage from "@/pages/admin/MembersPage";
import TransactionsPage from "@/pages/admin/TransactionsPage";
import WinnersPage from "@/pages/admin/WinnersPage";
import VideosPage from "@/pages/admin/VideosPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import PartnersPage from "@/pages/admin/PartnersPage";
import HowItWorksPage from "@/pages/admin/HowItWorksPage";
import TermsConditionsPage from "@/pages/admin/TermsConditionsPage";
import BanksPage from "@/pages/admin/BanksPage";
import SettingsPage from "@/pages/admin/SettingsPage";
import FooterPage from "@/pages/admin/FooterPage";
import IpWhitelistPage from "@/pages/admin/IpWhitelistPage";
import PaymentMethodsPage from "@/pages/admin/PaymentMethodsPage";
import PagesPage from "@/pages/admin/PagesPage";
import WebsiteConfirmPage from "@/pages/admin/WebsiteConfirmPage";
import EditLain2Page from "@/pages/admin/EditLain2Page";
import AdminManagementPage from "@/pages/admin/AdminManagementPage";
import DaftarTransferPage from "@/pages/admin/DaftarTransferPage";
import { AdminRoute } from "@/components/AdminRoute";
import { RequireProfile } from "@/components/RequireProfile";
import { VideoProvider } from "@/contexts/VideoContext";

function Router() {
  return (
    <>
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
    </>
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
