import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import SignupEmail from "./pages/SignupEmail";
import VerifyOTP from "./pages/VerifyOTP";
import CreatePassword from "./pages/CreatePassword";
import SignupSuccess from "./pages/SignupSuccess";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MyAspirations from "./pages/MyAspirations";
import AspirationsReportLoading from "./pages/AspirationsReportLoading";
import AspirationsAIReport from "./pages/AspirationsAIReport";
import CoursesPlaceholder from "./pages/CoursesPlaceholder";
import Profile from "./pages/Profile";
import RoleSelect from "./pages/RoleSelect";
import InstituteLogin from "./pages/InstituteLogin";
import InstituteRegister from "./pages/InstituteRegister";
import InstituteHome from "./pages/InstituteHome";
import InstituteOnboarding from "./pages/InstituteOnboarding";
import InstituteServices from "./pages/InstituteServices";
import InstitutePayments from "./pages/InstitutePayments";
import ForgotPassword from "./pages/ForgotPassword";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/role-select" replace />} />
        <Route path="/role-select" element={<RoleSelect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/signup" element={<SignupEmail />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/create-password" element={<CreatePassword />} />
        <Route path="/signup-success" element={<SignupSuccess />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/aspirations" element={<MyAspirations />} />
        <Route path="/dashboard/aspirations/loading" element={<AspirationsReportLoading />} />
        <Route path="/dashboard/aspirations/report" element={<AspirationsAIReport />} />
        <Route path="/courses" element={<CoursesPlaceholder />} />
        <Route path="/dashboard/courses" element={<Navigate to="/courses" replace />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Institute Routes */}
        <Route path="/login/institute" element={<InstituteLogin />} />
        <Route path="/register/institute" element={<InstituteRegister />} />
        <Route path="/institute/home" element={<InstituteHome />} />
        <Route path="/institute/onboarding" element={<InstituteOnboarding />} />
        <Route path="/institute/profile" element={<InstituteOnboarding />} />
        <Route path="/institute/services" element={<InstituteServices />} />
        <Route path="/institute/payments" element={<InstitutePayments />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/role-select" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
