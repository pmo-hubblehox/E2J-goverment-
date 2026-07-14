import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import CounsellorLayout from './layouts/CounsellorLayout';

import StudentRegisterPage from './pages/auth/StudentRegisterPage';
import InstituteRegisterPage from './pages/auth/InstituteRegisterPage';
import CounsellorRegisterPage from './pages/auth/CounsellorRegisterPage';
import InstituteOnboardingPage from './pages/institute/InstituteOnboardingPage';
import InstituteGate from './components/InstituteGate';
import InstituteSetupPage from './pages/institute/InstituteSetupPage';
import InstituteApplicationStatusPage from './pages/institute/InstituteApplicationStatusPage';
import InstitutePendingStatusPage from './pages/institute/InstitutePendingStatusPage';
import InstitutePendingProfilePage from './pages/institute/InstitutePendingProfilePage';
import CounsellorOnboardingPage from './pages/counsellor/CounsellorOnboardingPage';
import OtpPage from './pages/auth/OtpPage';
import CreatePasswordPage from './pages/auth/CreatePasswordPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoginPage from './pages/LoginPage';

import CounsellorDashboardPage from './pages/counsellor/CounsellorDashboardPage';
import BookedSessionPage from './pages/counsellor/BookedSessionPage';
import CounsellorProfilePage from './pages/counsellor/CounsellorProfilePage';

import HomePage from './pages/student/HomePage';
import StudentDashboard from './pages/student/StudentDashboard';
import MyAspirationPage from './pages/student/MyAspirationPage';
import CoursesPage from './pages/student/CoursesPage';
import JobsPage from './pages/student/JobsPage';
import CounsellingPage from './pages/student/CounsellingPage';
import StudentProfilePage from './pages/student/ProfilePage';
import ProfileSetupPage from './pages/student/ProfileSetupPage';
import ApplicationsPage from './pages/student/ApplicationsPage';
import StudentWorkshopsPage from './pages/student/WorkshopsPage';

import InstituteDashboard from './pages/institute/InstituteDashboard';
import CurriculumPage from './pages/institute/CurriculumPage';
import DashboardAnalyticsPage from './pages/institute/DashboardAnalyticsPage';
import ProgramsPage from './pages/institute/ProgramsPage';
import FacultyPage from './pages/institute/FacultyPage';
import InstituteWorkshopsPage from './pages/institute/WorkshopsPage';
import VenuesPage from './pages/institute/VenuesPage';
import InstituteLabBookingPage from './pages/institute/InstituteLabBookingPage';
import CampusRecruitmentPage from './pages/institute/CampusRecruitmentPage';
import StudentsPage from './pages/institute/StudentsPage';
import ReportsPage from './pages/institute/ReportsPage';
import InstituteProfilePage from './pages/institute/ProfilePage';

import VerifierDashboard from './pages/verifier/VerifierDashboard';
import BosApprovalPage from './pages/bos/BosApprovalPage';
import SmeDashboardPage from './pages/sme/SmeDashboardPage';
import CounsellorPendingPage from './pages/counsellor/CounsellorPendingPage';
import HeadCounsellorDashboard from './pages/head-counsellor/HeadCounsellorDashboard';

import SkillGapReportPage from './pages/student/SkillGapReportPage';
import InterviewHistoryPage from './pages/student/InterviewHistoryPage';
import InterviewSessionPage from './pages/student/InterviewSessionPage';
import InterviewReportPage from './pages/student/InterviewReportPage';
import IndustryRegisterPage from './pages/auth/IndustryRegisterPage';
import IndustryOnboardingPage from './pages/industry-partner/IndustryOnboardingPage';
import IndustryHomePage from './pages/industry-partner/IndustryHomePage';
import IndustryStatusPage from './pages/industry-partner/IndustryStatusPage';
import IndustryProfilePage from './pages/industry-partner/IndustryProfilePage';

// Approved Industry Portal
import IndustryApprovedLayout from './layouts/IndustryApprovedLayout';
import IndustryPortalHome from './pages/industry-portal/IndustryPortalHome';
import JobListingPage from './pages/industry-portal/JobListingPage';
import AddJobPage from './pages/industry-portal/AddJobPage';
import ViewJobPage from './pages/industry-portal/ViewJobPage';
import InterviewPage from './pages/industry-portal/InterviewPage';
import CandidatesPage from './pages/industry-portal/CandidatesPage';
import ResumeDatabasePage from './pages/industry-portal/ResumeDatabasePage';
import IndustryCampusPage from './pages/industry-portal/IndustryCampusPage';
import AddCampusInvitePage from './pages/industry-portal/AddCampusInvitePage';
import SmeListingPage from './pages/industry-portal/SmeListingPage';
import AddSmePage from './pages/industry-portal/AddSmePage';
import IndustryDashboardPage from './pages/industry-portal/IndustryDashboardPage';
import IndustryVenuesPage from './pages/industry-portal/IndustryVenuesPage';
import IndustryReportsPage from './pages/industry-portal/IndustryReportsPage';
import IndustryWorkshopsPage from './pages/industry-portal/WorkshopsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login/:role" element={<LoginPage />} />
          <Route path="/login" element={<Navigate to="/login/student" replace />} />
          <Route path="/register" element={<StudentRegisterPage />} />
          <Route path="/register/institute" element={<InstituteRegisterPage />} />
          <Route path="/register/counsellor" element={<CounsellorRegisterPage />} />
          <Route path="/register/industry" element={<IndustryRegisterPage />} />
          <Route path="/register/otp" element={<OtpPage />} />
          <Route path="/register/create-password" element={<CreatePasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Profile setup wizard — standalone full-page (no sidebar) */}
        <Route path="/student/profile" element={<ProfileSetupPage />} />

        {/* Interview session — standalone full-screen (no sidebar) */}
        <Route path="/student/interview/session" element={<InterviewSessionPage />} />

        {/* Institute onboarding wizard — standalone full-page (no sidebar) */}
        <Route path="/institute/onboarding" element={<InstituteOnboardingPage />} />
        <Route path="/institute/setup" element={<InstituteSetupPage />} />

        {/* Counsellor onboarding wizard — standalone full-page (no sidebar) */}
        <Route path="/counsellor/onboarding" element={<CounsellorOnboardingPage />} />

        {/* Industry Partner onboarding wizard — standalone full-page (no sidebar) */}
        <Route path="/industry-partner/onboarding" element={<IndustryOnboardingPage />} />

        {/* Counsellor pending approval page */}
        <Route path="/counsellor/pending" element={<CounsellorPendingPage />} />

        {/* Head Counsellor dashboard */}
        <Route path="/head-counsellor" element={<HeadCounsellorDashboard />} />

        {/* Student */}
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<HomePage />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/aspiration" element={<MyAspirationPage />} />
          <Route path="/student/courses" element={<CoursesPage />} />
          <Route path="/student/jobs" element={<JobsPage />} />
          <Route path="/student/applications" element={<ApplicationsPage />} />
          <Route path="/student/counselling" element={<CounsellingPage />} />
          <Route path="/student/workshops" element={<StudentWorkshopsPage />} />
          <Route path="/student/profile-view" element={<StudentProfilePage />} />
          <Route path="/student/skill-gap/report" element={<SkillGapReportPage />} />
          <Route path="/student/interview" element={<InterviewHistoryPage />} />
          <Route path="/student/interview/:sessionId/report" element={<InterviewReportPage />} />
        </Route>

        {/* Institute — pending pages are outside the gate */}
        <Route element={<DashboardLayout />}>
          <Route path="/institute/application-status" element={<InstituteApplicationStatusPage />} />
          <Route path="/institute/pending/profile"    element={<InstitutePendingProfilePage />} />
          <Route path="/institute/pending/status"     element={<InstitutePendingStatusPage />} />
        </Route>

        {/* Institute — gate checks onboarding/setup/approval before allowing dashboard access */}
        <Route element={<DashboardLayout />}>
          <Route element={<InstituteGate />}>
            <Route path="/institute" element={<InstituteDashboard />} />
            <Route path="/institute/dashboard" element={<DashboardAnalyticsPage />} />
            <Route path="/institute/programs" element={<ProgramsPage />} />
            <Route path="/institute/curriculum" element={<CurriculumPage />} />
            <Route path="/institute/students" element={<StudentsPage />} />
            <Route path="/institute/faculty" element={<FacultyPage />} />
            <Route path="/institute/workshops" element={<InstituteWorkshopsPage />} />
            <Route path="/institute/venues" element={<InstituteLabBookingPage />} />
            <Route path="/institute/venues/availability" element={<VenuesPage initialSubView="availability" />} />
            <Route path="/institute/recruitment" element={<CampusRecruitmentPage />} />
            <Route path="/institute/reports" element={<ReportsPage />} />
            <Route path="/institute/profile" element={<InstituteProfilePage />} />
          </Route>
        </Route>

        {/* Verifier */}
        <Route element={<DashboardLayout />}>
          <Route path="/verifier" element={<VerifierDashboard />} />
        </Route>

        {/* BOS Member */}
        <Route path="/bos" element={<BosApprovalPage />} />

        {/* SME */}
        <Route path="/sme" element={<SmeDashboardPage />} />

        {/* Industry Partner (pre-approval) */}
        <Route element={<DashboardLayout />}>
          <Route path="/industry-partner" element={<IndustryHomePage />} />
          <Route path="/industry-partner/status" element={<IndustryStatusPage />} />
          <Route path="/industry-partner/profile" element={<IndustryProfilePage />} />
        </Route>

        {/* Industry Portal (post-approval full portal) */}
        <Route element={<IndustryApprovedLayout />}>
          <Route path="/industry-portal" element={<IndustryPortalHome />} />
          <Route path="/industry-portal/jobs" element={<JobListingPage />} />
          <Route path="/industry-portal/jobs/add" element={<AddJobPage />} />
          <Route path="/industry-portal/jobs/:id" element={<ViewJobPage />} />
          <Route path="/industry-portal/jobs/:id/edit" element={<AddJobPage />} />
          <Route path="/industry-portal/internships/add" element={<AddJobPage />} />
          <Route path="/industry-portal/internships/:id" element={<ViewJobPage />} />
          <Route path="/industry-portal/internships/:id/edit" element={<AddJobPage />} />
          <Route path="/industry-portal/interviews" element={<InterviewPage />} />
          <Route path="/industry-portal/candidates" element={<CandidatesPage />} />
          <Route path="/industry-portal/resumes" element={<ResumeDatabasePage />} />
          <Route path="/industry-portal/campus" element={<IndustryCampusPage />} />
          <Route path="/industry-portal/campus/add" element={<AddCampusInvitePage />} />
          <Route path="/industry-portal/sme" element={<SmeListingPage />} />
          <Route path="/industry-portal/sme/add" element={<AddSmePage />} />
          <Route path="/industry-portal/sme/:id/edit" element={<AddSmePage />} />
          <Route path="/industry-portal/venues" element={<IndustryVenuesPage />} />
          <Route path="/industry-portal/dashboard" element={<IndustryDashboardPage />} />
          <Route path="/industry-portal/profile" element={<IndustryProfilePage />} />
          <Route path="/industry-portal/reports" element={<IndustryReportsPage />} />
          <Route path="/industry-portal/workshops" element={<IndustryWorkshopsPage />} />
        </Route>

        {/* Counsellor */}
        <Route element={<CounsellorLayout />}>
          <Route path="/counsellor" element={<CounsellorDashboardPage />} />
          <Route path="/counsellor/sessions" element={<BookedSessionPage />} />
          <Route path="/counsellor/profile" element={<CounsellorProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login/student" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
