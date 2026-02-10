import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import InstagramSuccess from "./pages/AuthPages/InstagramSuccess";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import ClientsList from "./pages/Clients/ClientsList";
import ContentKanban from "./pages/Content/ContentKanban";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Briefing from "./pages/Briefing/Briefing";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Dashboard/Home";
import EditorialCalendar from "./pages/EditorialCalendar/EditorialCalendar";
import HistoryList from "./pages/History/HistoryList";
import IntegrationLogs from "./pages/Admin/IntegrationLogs";
import BillingManagement from "./pages/Admin/BillingManagement";
import MediaLibrary from "./pages/Media/MediaLibrary";
import Plans from "./pages/Subscription/Plans";
import ClientBilling from "./pages/Subscription/ClientBilling";
import Checkout from "./pages/Subscription/Checkout";
import Success from "./pages/Subscription/Success";
import Cancel from "./pages/Subscription/Cancel";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />

              {/* Others Page */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/clients" element={<ClientsList />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/billing" element={<ClientBilling />} />
              <Route path="/subscription/checkout" element={<Checkout />} />
              <Route path="/subscription/success" element={<Success />} />
              <Route path="/subscription/cancel" element={<Cancel />} />
              <Route path="/briefing" element={<Briefing />} />
              <Route path="/content" element={<ContentKanban />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/editorial-calendar" element={<EditorialCalendar />} />
              <Route path="/history" element={<HistoryList />} />
              <Route path="/media-library" element={<MediaLibrary />} />
              <Route path="/blank" element={<Blank />} />
              <Route path="/instagram/success/:clientId/*" element={<InstagramSuccess />} />
              <Route path="/linkedin/success/:clientId/*" element={<InstagramSuccess />} />
              <Route path="/whatsapp/success/:clientId/*" element={<InstagramSuccess />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />

              {/* Tables */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />

              {/* Admin */}
              <Route path="/admin/logs" element={<IntegrationLogs />} />
              <Route path="/admin/billing" element={<BillingManagement />} />
            </Route>
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
