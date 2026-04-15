import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Packages from "./pages/Packages";
import MyRequests from "./pages/MyRequests";
import UploadDocuments from "./pages/UploadDocuments";
import RequestDocuments from "./pages/RequestDocuments";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRequests from "./pages/AdminRequests";
import AdminRoute from "./components/AdminRoute";
import AdminRequestDetails from "./pages/AdminRequestDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import WhatsAppButton from "./components/WhatsAppButton";
import ChatBot from "./components/ChatBot";

function App() {
  return (
    <BrowserRouter>
    <ChatBot />
    <WhatsAppButton />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/packages" element={<ProtectedRoute><Packages /></ProtectedRoute>} />
        <Route path="/my-requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
        <Route path="/upload/:id" element={<ProtectedRoute><UploadDocuments /></ProtectedRoute>} />
        <Route path="/request-documents/:id" element={<ProtectedRoute><RequestDocuments /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
        <Route path="/admin/request-details/:id" element={<AdminRoute><AdminRequestDetails /></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
