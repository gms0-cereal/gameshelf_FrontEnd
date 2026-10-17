import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import Login from "./pages/Login";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} /> {/*Login*/}
            </Routes>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
export default App;