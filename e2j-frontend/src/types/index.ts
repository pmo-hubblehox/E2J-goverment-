export type UserRole = 'STUDENT' | 'INSTITUTE' | 'VERIFIER' | 'COUNSELLOR' | 'HEAD_COUNSELLOR' | 'INDUSTRY_PARTNER' | 'BOS_MEMBER' | 'SME';

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  avatar?: string;
  designation?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

/* ---- Student ---- */
export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  program: string;
  specialization: string;
  semester: number;
  percentage: number;
  address: string;
  profilePhoto?: string;
  resumeUrl?: string;
  skills: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  createdAt: string;
}

export interface JobListing {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'FULL_TIME' | 'INTERNSHIP' | 'PART_TIME';
  salary?: string;
  skills: string[];
  description: string;
  eligibility: string;
  deadline: string;
  status: 'OPEN' | 'CLOSED';
  postedAt: string;
}

export interface JobApplication {
  id: number;
  jobId: number;
  job: JobListing;
  status: 'APPLIED' | 'SHORTLISTED' | 'REJECTED' | 'OFFERED';
  appliedAt: string;
}

/* ---- Institute ---- */
export interface Institute {
  id: number;
  name: string;
  type: string;
  websiteUrl: string;
  email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MORE_INFO';
  registrationDate: string;
  address?: InstituteAddress;
  placementOfficer?: PlacementOfficer;
}

export interface InstituteAddress {
  buildingName: string;
  roomNumber: string;
  country: string;
  pincode: string;
  state: string;
  city: string;
  area: string;
  landmark: string;
  locationPin: string;
}

export interface PlacementOfficer {
  name: string;
  email: string;
  phone: string;
  countryCode: string;
}

export interface Program {
  id: number;
  programId: string;
  degree: string;
  name: string;
  majors: string[];
  duration: number;
  totalFees: number;
  intakeCapacity: number;
  deadline: string;
  academicYear?: string;
  status: 'DRAFT' | 'UPLOADED';
  brochureUrl?: string;
  syllabusUrl?: string;
  creditStructureUrl?: string;
  calendarUrl?: string;
}

export interface Faculty {
  id: number;
  name: string;
  expertise: string[];
  days: string[];
  mode: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  bio?: string;
  rating?: number;
  studentsCounselled?: number;
  counsellingSessions?: number;
  languages?: string[];
}

export interface VenueBooking {
  id: number;
  roomType: string;
  roomNo: string;
  dateRange: string;
  timeSlot: string;
}

export interface CampusRecruitment {
  id: number;
  industryPartner: string;
  driveName: string;
  jobRole: string;
  programName: string;
  specialization: string;
  status: 'RECEIVED' | 'INVITED' | 'ACCEPTED' | 'REJECTED';
}

/* ---- Verifier ---- */
export interface VerifierReview {
  id: number;
  instituteId: number;
  instituteName: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MORE_INFO';
  remarks?: string;
}
