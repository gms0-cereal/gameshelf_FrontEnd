import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Provider } from "react-redux"; // <--- 1. Import Redux Provider
import { store } from "./store/store";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgetPassword";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import GameDetails from "./pages/GameDetails";
import MyLibrary from "./pages/MyLibrary";
import GameReviews from "./pages/GameReviews";
import ChooseInterest from "./pages/ChooseInterest";
import PlaylistDetails from "./pages/PlaylistDetails";
import Friends from "./pages/Friends";
import CreatePlaylist from "./pages/CreatePlaylist";
import CommunityPlaylists from "./pages/CommunityPlaylists";
import SetBirthdayPage from "./components/Profile/SetBirthdayModal";
import AppealReportPage from "./pages/AppealReportPage";
import { SettingsProvider } from "./context/Settingscontext";
import Discover from "./pages/Discover";
import MyRestrictions from "./pages/account/MyRestrictions";
// Admin Dashboard Imports
import { Dashboard } from './pages/admin/Dashboard';
import { PlatformAnalytics } from './pages/admin/PlatformAnalytics';
import { UserManagement } from './pages/admin/UserManagement';
import { UserRoleManagement } from './pages/admin/UserRoleManagement';
import { SystemLogs } from './pages/admin/SystemLogs';
import { WebsiteSettings } from './pages/admin/WebsiteSettings';
import { Games } from './pages/admin/Games'; // your existing file, unchanged
//Legal Stuff
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Help from "@/pages/Help";
import PrivacyPolicy from "@/pages/Privacypolicy";
import Terms from "@/pages/Terms";
import Settings from "@/pages/Settings";
// Moderator Dashboard Imports

import ModeratorDashboard from "./pages/moderators/ModeratorDashboard";
import ModReport from "./pages/moderators/ModReport";
import ModSanctions from "./pages/moderators/ModSanctions";
import ModAppealManage from "./pages/moderators/ModAppealManage";
import ModHistory from "./pages/moderators/ModHistory";


import RoleRoute from "./components/RoleRoute"; // <--- 2. Import RoleRoute component
const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}> {/* <--- 3. Wrap your providers with Redux */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster richColors position="top-right" />

        <BrowserRouter>
          <AuthProvider>
            <SettingsProvider>
            <Routes>
              {/* Public / User Storefront Routes */}
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/home" element={<Home />} />
              <Route path="/gamedetails/:appid" element={<GameDetails />} />
              <Route path="/gamedetails/:appid/reviews" element={<GameReviews />} />
              <Route path="/my-library" element={<MyLibrary />} />
              <Route path="/playlists/new" element={<CreatePlaylist />} />
              <Route path="/playlists/:username/:id" element={<PlaylistDetails />} />
              <Route path="/playlists" element={<CommunityPlaylists />} />
              <Route path="/playlists/new" element={<CreatePlaylist />} />
              <Route path="/playlists/:id/edit" element={<CreatePlaylist />} />
              <Route path="/playlists/:username/:id" element={<PlaylistDetails />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/set-birthday" element={<SetBirthdayPage/>} />
              
              <Route path="/discover" element={<Discover />} />
              <Route path="/interests" element={<ChooseInterest />} />
              <Route path="/appeal-report" element={<AppealReportPage />} />

              <Route path="/account/restrictions" element={<MyRestrictions />} />
              {/* Legal Routes */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              {/* Admin Routes */}
              {/* <Route element={<RoleRoute allowedRoles={["admin"]} />}> */}
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/analytics" element={<PlatformAnalytics />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/roles" element={<UserRoleManagement />} />
                <Route path="/admin/roles/:userId" element={<UserRoleManagement />} />
                <Route path="/admin/games" element={<Games />} />
                <Route path="/admin/logs" element={<SystemLogs />} />
                <Route path="/admin/settings" element={<WebsiteSettings />} />
              {/* </Route> */}

              {/* Moderator Routes */}
              {/* <Route element={<RoleRoute allowedRoles={["moderator", "admin"]} />}> */}
                <Route path="/moderator" element={<ModeratorDashboard />} />
                <Route path="/moderator/reports" element={<ModReport />} />
                <Route path="/moderator/sanctions" element={<ModSanctions />} />
                <Route path="/moderator/appeals" element={<ModAppealManage />} />
                <Route path="/moderator/history" element={<ModHistory />} />
              {/* </Route> */}
              {/* Settings Route */}
              <Route path="/settings" element={<Settings />} />
            </Routes>
              
            </SettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;