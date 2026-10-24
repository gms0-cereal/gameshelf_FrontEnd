import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

import Friends from "./pages/Friends";
import Browse from "./pages/Browse";
import CreatePlaylist from "./pages/CreatePlaylist";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster richColors position="top-right" />

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Home />} />
            <Route path="/gamedetails/:appid" element={<GameDetails />} />
            <Route path="/gamedetails/:appid/reviews" element={<GameReviews />} />
            <Route path="/my-library" element={<MyLibrary />} />
            <Route path="/playlists/new" element={<CreatePlaylist />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:username" element={<Profile />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile/edit" element={<EditProfile />} />
            <Route path="/browse" element={<Browse />} />
            
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;