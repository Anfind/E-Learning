/**
 * TypeScript Types for Learning Platform
 * Based on v3 backend Prisma schema
 */

// ============================================
// USER TYPES
// ============================================

export type Role = 'USER' | 'ADMIN' | 'TEACHER';

export type UserStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'DEACTIVE';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: Role;
  status: UserStatus;
  faceImage?: string;
  faceRegistered: boolean;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

// ============================================
// LEARNING STRUCTURE
// ============================================

export interface Major {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  _count?: {
    subjects: number;
    enrollments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  majorId: string;
  teacherId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  prerequisiteId?: string;
  prerequisite?: {
    id: string;
    name: string;
  };
  major?: Major;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    lessons: number;
    exams: number;
  };
  userProgress?: {
    completedLessons: number;
    totalLessons: number;
    isLocked: boolean;
    lockedReason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  videoUrl?: string;
  duration: number; // minutes
  order: number;
  isActive: boolean;
  prerequisiteId?: string;
  prerequisite?: {
    id: string;
    name: string;
  };
  subject?: Subject;
  progress?: LessonProgress;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PROGRESS TYPES
// ============================================

export type EnrollmentStatus = 'ACTIVE' | 'COMPLETED' | 'DROPPED';

export interface Enrollment {
  id: string;
  userId: string;
  majorId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  user?: User;
  major?: Major;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  watchTime: number; // minutes
  completed: boolean;
  completedAt?: string;
  faceVerifiedBefore: boolean;
  faceVerifiedAfter: boolean;
  canComplete?: boolean; // Computed: watchTime >= 2/3 duration
  isLocked?: boolean;
  lockedReason?: string;
  percentComplete?: number;
  requiredWatchTime?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// EXAM TYPES
// ============================================

export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY';

export type ExamStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

export interface Exam {
  id: string;
  subjectId: string;
  name: string;
  description?: string;
  duration: number; // minutes
  passingScore: number; // percentage
  order: number;
  isActive: boolean;
  isRequired: boolean;
  subject?: Subject;
  questions?: ExamQuestion[];
  attemptId?: string;
  startedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: string;
  examId: string;
  question: string;
  type: QuestionType;
  options?: string[]; // For multiple choice
  correctAnswer?: string; // Only in admin view or after submission
  points: number;
  order: number;
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  userId: string;
  examId: string;
  answers?: Record<string, string>; // { questionId: answer }
  score?: number; // percentage
  passed: boolean;
  status: ExamStatus;
  faceVerifiedStart: boolean;
  startedAt: string;
  submittedAt?: string;
  exam?: Exam;
  user?: User;
}

export interface ExamResult {
  attemptId: string;
  score: number; // percentage
  totalScore: number; // points earned
  maxScore: number; // total points
  passingScore: number;
  passed: boolean;
  results: {
    questionId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    points: number;
    maxPoints: number;
  }[];
}

// ============================================
// COMMUNITY TYPES
// ============================================

export interface BlogPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  imageUrl?: string;
  published: boolean;
  views: number;
  user?: User;
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export type QuestionStatus = 'OPEN' | 'ANSWERED' | 'CLOSED';

export interface Question {
  id: string;
  userId: string;
  subjectId?: string;
  lessonId?: string;
  title: string;
  content: string;
  views: number;
  status: QuestionStatus;
  user?: User;
  subject?: Subject;
  lesson?: Lesson;
  answers?: Answer[];
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  isAccepted: boolean;
  question?: Question;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  description?: string;
  blogPostCount?: number;
  questionCount?: number;
  totalUsage?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  post?: BlogPost;
  user?: User;
  createdAt: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardOverview {
  enrolledMajors: number;
  completedLessons: number;
  passedExams: number;
  inProgressLessons: number;
  majors: Major[];
  recentActivities: Activity[];
}

export interface Activity {
  type: 'lesson' | 'exam';
  id: string;
  name: string;
  subjectName: string;
  isCompleted?: boolean;
  progress?: number;
  score?: number;
  passed?: boolean;
  timestamp: string;
}

// ============================================
// ADMIN STATS TYPES
// ============================================

export interface AdminStats {
  users: {
    total: number;
    pending: number;
    active: number;
    deactive: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  learning: {
    majors: number;
    subjects: number;
    lessons: number;
    exams: number;
    enrollments: number;
  };
  progress: {
    completedLessons: number;
    examPassRate: number;
  };
  community: {
    blogPosts: number;
    questions: number;
    answers: number;
    comments: number;
  };
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  // Không còn faceImage - user sẽ đăng ký face sau khi login
}

export interface AuthResponse {
  token: string;
  user: User;
}
