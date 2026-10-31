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
import Browse from "./pages/Browse";
import CreatePlaylist from "./pages/CreatePlaylist";
import CommunityPlaylists from "./pages/CommunityPlaylists";
import SetBirthdayPage from "./components/Profile/SetBirthdayModal";
import AppealReportPage from "./pages/AppealReportPage";
// Admin Dashboard Imports
import { Dashboard } from "./pages/admin/Dashboard";
import { Games } from "./pages/admin/Games";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}> {/* <--- 3. Wrap your providers with Redux */}
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster richColors position="top-right" />

        <BrowserRouter>
          <AuthProvider>
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
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/set-birthday" element={<SetBirthdayPage/>} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/interests" element={<ChooseInterest />} />
              <Route path="/appeal-report" element={<AppealReportPage />} />
              {/* Admin Routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/games" element={<Games />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;