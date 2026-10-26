export type StudentStatus = 'active' | 'inactive';

export interface FeePlan {
  totalFee: number;
  discount: number;
  planType: 'one-time' | 'monthly' | 'quarterly' | 'custom';
  installmentsCount: number;
}

export interface Student {
  id: string;
  name: string;
  photo?: string;
  phone: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  dob: string;
  batchId: string;
  joiningDate: string;
  feePlan: FeePlan;
  status: StudentStatus;
  notes?: string;
}

export interface Batch {
  id: string;
  name: string;
  subject: string;
  timings: string;
  teacher: string;
  capacity: number;
  startDate: string;
  endDate: string;
  baseFee: number;
  room?: string;
  description?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface BatchAttendance {
  id: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // studentId -> status
  markedBy: string;
  notes?: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'card';

export interface FeePayment {
  id: string;
  receiptNumber: string;
  studentId: string;
  batchId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  remarks?: string;
  collectedBy: string;
}

export interface SubjectBreakdown {
  name: string;
  maxMarks: number;
}

export interface Test {
  id: string;
  title: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  totalMarks: number;
  passingMarks: number;
  subjects: SubjectBreakdown[];
  description?: string;
}

export interface TestResult {
  id: string;
  testId: string;
  studentId: string;
  subjectMarks: Record<string, number>;
  totalScore: number;
  percentage: number;
  rank?: number;
  remarks?: string;
}

export type UserRole = 'admin' | 'teacher';

export interface CurrentUser {
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface StudentStats {
  totalFee: number;
  paidFee: number;
  pendingDue: number;
  totalClasses: number;
  attendedClasses: number;
  attendancePercentage: number;
  testsTaken: number;
  averageScorePercentage: number;
  recentRank?: number;
}
