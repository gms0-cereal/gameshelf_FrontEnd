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
// Admin Dashboard Imports
import { Dashboard } from "./pages/admin/Dashboard";
import { Games } from "./pages/admin/Games";
import Discover from "./pages/Discover";
//Legal Stuff
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Help from "@/pages/Help";
import PrivacyPolicy from "@/pages/Privacypolicy";
import Terms from "@/pages/Terms";
import Settings from "@/pages/Settings";
import BirthdayPrompt from "@/components/layout/BirthdayPrompt";

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
                {/* Edit playlist: the create page, pre-filled with the playlist */}
                <Route path="/playlists/:id/edit" element={<CreatePlaylist />} />
                <Route path="/playlists/:username/:id" element={<PlaylistDetails />} />
                <Route path="/playlists" element={<CommunityPlaylists />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/set-birthday" element={<SetBirthdayPage />} />

                <Route path="/discover" element={<Discover />} />
                <Route path="/interests" element={<ChooseInterest />} />
                <Route path="/appeal-report" element={<AppealReportPage />} />
                {/* Admin Routes */}
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/games" element={<Games />} />
                {/* Legal Routes */}
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/help" element={<Help />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                {/* Settings Route */}
                <Route path="/settings" element={<Settings />} />
              </Routes>
              <BirthdayPrompt />
            </SettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;