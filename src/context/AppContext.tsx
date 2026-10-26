import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  Student,
  Batch,
  BatchAttendance,
  FeePayment,
  Test,
  TestResult,
  UserRole,
  CurrentUser,
  StudentStats,
  AttendanceStatus,
} from '../types';
import {
  SEED_BATCHES,
  SEED_STUDENTS,
  SEED_ATTENDANCE,
  SEED_FEE_PAYMENTS,
  SEED_TESTS,
  SEED_TEST_RESULTS,
} from '../data/seedData';

interface AppContextType {
  // Data
  students: Student[];
  batches: Batch[];
  attendance: BatchAttendance[];
  feePayments: FeePayment[];
  tests: Test[];
  testResults: TestResult[];
  currentUser: CurrentUser;
  theme: 'light' | 'dark';

  // Role & Theme
  switchRole: (role: UserRole) => void;
  toggleTheme: () => void;

  // Student Actions
  addStudent: (data: Omit<Student, 'id'>) => { success: boolean; error?: string; student?: Student };
  updateStudent: (id: string, data: Partial<Student>) => { success: boolean; error?: string };
  deleteStudent: (id: string) => void;
  bulkAddStudents: (students: Omit<Student, 'id'>[]) => number;

  // Batch Actions
  addBatch: (data: Omit<Batch, 'id'>) => Batch;
  updateBatch: (id: string, data: Partial<Batch>) => void;
  deleteBatch: (id: string) => { success: boolean; error?: string };

  // Attendance Actions
  markBatchAttendance: (batchId: string, date: string, records: Record<string, AttendanceStatus>, notes?: string) => void;

  // Fee Actions
  recordFeePayment: (payment: Omit<FeePayment, 'id' | 'receiptNumber'>) => FeePayment;
  deleteFeePayment: (id: string) => void;

  // Tests & Performance Actions
  addTest: (test: Omit<Test, 'id'>) => Test;
  updateTest: (id: string, data: Partial<Test>) => void;
  deleteTest: (id: string) => void;
  recordTestResults: (testId: string, results: { studentId: string; subjectMarks: Record<string, number>; remarks?: string }[]) => void;

  // Stats & Computation Helpers
  getStudentStats: (studentId: string) => StudentStats;
  getBatchStats: (batchId: string) => {
    enrolledCount: number;
    capacity: number;
    attendanceRate: number;
    collectedFee: number;
    pendingFee: number;
  };
  resetToSampleData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STUDENTS: 'edutrack_students_v2',
  BATCHES: 'edutrack_batches_v2',
  ATTENDANCE: 'edutrack_attendance_v2',
  FEES: 'edutrack_fees_v2',
  TESTS: 'edutrack_tests_v2',
  TEST_RESULTS: 'edutrack_test_results_v2',
  THEME: 'edutrack_theme',
  ROLE: 'edutrack_role',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Current User / Role state
  const [currentUser, setCurrentUser] = useState<CurrentUser>(() => {
    const savedRole = (localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole) || 'admin';
    return {
      name: savedRole === 'admin' ? 'Prof. A. K. Verma' : 'Teacher Sunita',
      email: savedRole === 'admin' ? 'director@edutrack.edu' : 'teacher@edutrack.edu',
      role: savedRole,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    };
  });

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const switchRole = (role: UserRole) => {
    setCurrentUser((prev) => ({
      ...prev,
      role,
      name: role === 'admin' ? 'Prof. A. K. Verma' : 'Dr. Sunita Deshmukh',
      email: role === 'admin' ? 'director@edutrack.edu' : 'sunita.deshmukh@edutrack.edu',
    }));
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  };

  // State with LocalStorage persistence
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      return saved ? JSON.parse(saved) : SEED_STUDENTS;
    } catch {
      return SEED_STUDENTS;
    }
  });

  const [batches, setBatches] = useState<Batch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return saved ? JSON.parse(saved) : SEED_BATCHES;
    } catch {
      return SEED_BATCHES;
    }
  });

  const [attendance, setAttendance] = useState<BatchAttendance[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      return saved ? JSON.parse(saved) : SEED_ATTENDANCE;
    } catch {
      return SEED_ATTENDANCE;
    }
  });

  const [feePayments, setFeePayments] = useState<FeePayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEES);
      return saved ? JSON.parse(saved) : SEED_FEE_PAYMENTS;
    } catch {
      return SEED_FEE_PAYMENTS;
    }
  });

  const [tests, setTests] = useState<Test[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TESTS);
      return saved ? JSON.parse(saved) : SEED_TESTS;
    } catch {
      return SEED_TESTS;
    }
  });

  const [testResults, setTestResults] = useState<TestResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TEST_RESULTS);
      return saved ? JSON.parse(saved) : SEED_TEST_RESULTS;
    } catch {
      return SEED_TEST_RESULTS;
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FEES, JSON.stringify(feePayments));
  }, [feePayments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(testResults));
  }, [testResults]);

  // Reset to initial sample data
  const resetToSampleData = () => {
    setStudents(SEED_STUDENTS);
    setBatches(SEED_BATCHES);
    setAttendance(SEED_ATTENDANCE);
    setFeePayments(SEED_FEE_PAYMENTS);
    setTests(SEED_TESTS);
    setTestResults(SEED_TEST_RESULTS);
  };

  // Student Actions
  const addStudent = (data: Omit<Student, 'id'>) => {
    // Validation: Required fields
    if (!data.name?.trim()) return { success: false, error: 'Student full name is required.' };
    if (!data.phone?.trim()) return { success: false, error: 'Student phone number is required.' };
    if (!data.batchId) return { success: false, error: 'Batch selection is required.' };

    const cleanPhone = data.phone.trim().replace(/[^0-9]/g, '');
    if (cleanPhone.length < 8) {
      return { success: false, error: 'Phone number must have at least 8 digits.' };
    }

    // Uniqueness check for phone number
    const duplicatePhone = students.some(
      (s) => s.phone.trim().replace(/[^0-9]/g, '') === cleanPhone
    );
    if (duplicatePhone) {
      return { success: false, error: `A student with phone number ${data.phone} already exists.` };
    }

    const newId = `STU-${Date.now().toString().slice(-4)}`;
    const newStudent: Student = {
      ...data,
      id: newId,
      phone: cleanPhone,
    };

    setStudents((prev) => [newStudent, ...prev]);
    return { success: true, student: newStudent };
  };

  const updateStudent = (id: string, data: Partial<Student>) => {
    if (data.phone) {
      const cleanPhone = data.phone.trim().replace(/[^0-9]/g, '');
      const duplicatePhone = students.some(
        (s) => s.id !== id && s.phone.trim().replace(/[^0-9]/g, '') === cleanPhone
      );
      if (duplicatePhone) {
        return { success: false, error: `Another student is already using phone number ${data.phone}.` };
      }
      data.phone = cleanPhone;
    }

    setStudents((prev) =>
      prev.map((student) => (student.id === id ? { ...student, ...data } : student))
    );
    return { success: true };
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    // Clean up fee payments, test results
    setFeePayments((prev) => prev.filter((f) => f.studentId !== id));
    setTestResults((prev) => prev.filter((r) => r.studentId !== id));
  };

  const bulkAddStudents = (newStudentsList: Omit<Student, 'id'>[]) => {
    let count = 0;
    const added: Student[] = [];

    newStudentsList.forEach((item, index) => {
      const newId = `STU-${(Date.now() + index).toString().slice(-5)}`;
      added.push({
        ...item,
        id: newId,
      });
      count++;
    });

    if (added.length > 0) {
      setStudents((prev) => [...added, ...prev]);
    }
    return count;
  };

  // Batch Actions
  const addBatch = (data: Omit<Batch, 'id'>) => {
    const newId = `BATCH-${String(batches.length + 1).padStart(2, '0')}`;
    const newBatch: Batch = { ...data, id: newId };
    setBatches((prev) => [...prev, newBatch]);
    return newBatch;
  };

  const updateBatch = (id: string, data: Partial<Batch>) => {
    setBatches((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  };

  const deleteBatch = (id: string) => {
    const assignedStudents = students.filter((s) => s.batchId === id);
    if (assignedStudents.length > 0) {
      return {
        success: false,
        error: `Cannot delete batch. There are ${assignedStudents.length} student(s) currently enrolled in it. Reassign them first.`,
      };
    }
    setBatches((prev) => prev.filter((b) => b.id !== id));
    return { success: true };
  };

  // Attendance Actions
  const markBatchAttendance = (
    batchId: string,
    date: string,
    records: Record<string, AttendanceStatus>,
    notes?: string
  ) => {
    setAttendance((prev) => {
      // Check if entry already exists for batch and date
      const existingIdx = prev.findIndex((a) => a.batchId === batchId && a.date === date);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          records: { ...updated[existingIdx].records, ...records },
          markedBy: currentUser.name,
          notes: notes !== undefined ? notes : updated[existingIdx].notes,
        };
        return updated;
      } else {
        const newRecord: BatchAttendance = {
          id: `ATT-${Date.now().toString().slice(-6)}`,
          batchId,
          date,
          records,
          markedBy: currentUser.name,
          notes,
        };
        return [newRecord, ...prev];
      }
    });
  };

  // Fee Actions
  const recordFeePayment = (data: Omit<FeePayment, 'id' | 'receiptNumber'>) => {
    const receiptYear = new Date().getFullYear();
    const count = feePayments.length + 101;
    const receiptNumber = `REC-${receiptYear}-${String(count).padStart(4, '0')}`;
    const newPayment: FeePayment = {
      ...data,
      id: `PAY-${Date.now().toString().slice(-6)}`,
      receiptNumber,
      collectedBy: currentUser.name,
    };
    setFeePayments((prev) => [newPayment, ...prev]);
    return newPayment;
  };

  const deleteFeePayment = (id: string) => {
    setFeePayments((prev) => prev.filter((p) => p.id !== id));
  };

  // Test Actions
  const addTest = (data: Omit<Test, 'id'>) => {
    const newId = `TEST-${String(tests.length + 1).padStart(2, '0')}`;
    const newTest: Test = { ...data, id: newId };
    setTests((prev) => [newTest, ...prev]);
    return newTest;
  };

  const updateTest = (id: string, data: Partial<Test>) => {
    setTests((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  };

  const deleteTest = (id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
    setTestResults((prev) => prev.filter((r) => r.testId !== id));
  };

  const recordTestResults = (
    testId: string,
    results: { studentId: string; subjectMarks: Record<string, number>; remarks?: string }[]
  ) => {
    const test = tests.find((t) => t.id === testId);
    if (!test) return;

    // Calculate total score, percentage, and ranks
    const calculated = results.map((r) => {
      const totalScore = Object.values(r.subjectMarks).reduce((acc, m) => acc + (m || 0), 0);
      const percentage = test.totalMarks > 0 ? (totalScore / test.totalMarks) * 100 : 0;
      return {
        ...r,
        totalScore,
        percentage: Number(percentage.toFixed(2)),
      };
    });

    // Rank within this test submission
    calculated.sort((a, b) => b.totalScore - a.totalScore);
    const rankedResults: TestResult[] = calculated.map((item, idx) => ({
      id: `RES-${Date.now().toString().slice(-5)}-${idx}`,
      testId,
      studentId: item.studentId,
      subjectMarks: item.subjectMarks,
      totalScore: item.totalScore,
      percentage: item.percentage,
      rank: idx + 1,
      remarks: item.remarks,
    }));

    // Replace or append results for this test
    setTestResults((prev) => {
      const filtered = prev.filter((r) => r.testId !== testId);
      return [...rankedResults, ...filtered];
    });
  };

  // Stats computation
  const getStudentStats = (studentId: string): StudentStats => {
    const student = students.find((s) => s.id === studentId);
    if (!student) {
      return {
        totalFee: 0,
        paidFee: 0,
        pendingDue: 0,
        totalClasses: 0,
        attendedClasses: 0,
        attendancePercentage: 0,
        testsTaken: 0,
        averageScorePercentage: 0,
      };
    }

    // Fee calculation
    const agreedFee = Math.max(0, (student.feePlan?.totalFee || 0) - (student.feePlan?.discount || 0));
    const paidFee = feePayments
      .filter((p) => p.studentId === studentId)
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingDue = Math.max(0, agreedFee - paidFee);

    // Attendance calculation
    const batchAttendance = attendance.filter((a) => a.batchId === student.batchId);
    let totalClasses = 0;
    let attendedClasses = 0;

    batchAttendance.forEach((entry) => {
      const status = entry.records[studentId];
      if (status !== undefined) {
        totalClasses++;
        if (status === 'present' || status === 'late') {
          attendedClasses++;
        }
      }
    });

    const attendancePercentage =
      totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 100;

    // Test performance calculation
    const results = testResults.filter((r) => r.studentId === studentId);
    const testsTaken = results.length;
    const averageScorePercentage =
      testsTaken > 0
        ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / testsTaken)
        : 0;

    const recentRank = results[0]?.rank;

    return {
      totalFee: agreedFee,
      paidFee,
      pendingDue,
      totalClasses,
      attendedClasses,
      attendancePercentage,
      testsTaken,
      averageScorePercentage,
      recentRank,
    };
  };

  const getBatchStats = (batchId: string) => {
    const batchStudents = students.filter((s) => s.batchId === batchId && s.status === 'active');
    const batch = batches.find((b) => b.id === batchId);

    let totalCollected = 0;
    let totalAgreed = 0;

    students
      .filter((s) => s.batchId === batchId)
      .forEach((s) => {
        const agreed = Math.max(0, (s.feePlan?.totalFee || 0) - (s.feePlan?.discount || 0));
        totalAgreed += agreed;
      });

    feePayments
      .filter((p) => p.batchId === batchId)
      .forEach((p) => {
        totalCollected += p.amount;
      });

    const pending = Math.max(0, totalAgreed - totalCollected);

    // Attendance average for batch
    const batchAttendance = attendance.filter((a) => a.batchId === batchId);
    let totalMarked = 0;
    let totalPresents = 0;

    batchAttendance.forEach((entry) => {
      Object.values(entry.records).forEach((stat) => {
        totalMarked++;
        if (stat === 'present' || stat === 'late') {
          totalPresents++;
        }
      });
    });

    const attendanceRate = totalMarked > 0 ? Math.round((totalPresents / totalMarked) * 100) : 95;

    return {
      enrolledCount: batchStudents.length,
      capacity: batch?.capacity || 30,
      attendanceRate,
      collectedFee: totalCollected,
      pendingFee: pending,
    };
  };

  const value = useMemo(
    () => ({
      students,
      batches,
      attendance,
      feePayments,
      tests,
      testResults,
      currentUser,
      theme,
      switchRole,
      toggleTheme,
      addStudent,
      updateStudent,
      deleteStudent,
      bulkAddStudents,
      addBatch,
      updateBatch,
      deleteBatch,
      markBatchAttendance,
      recordFeePayment,
      deleteFeePayment,
      addTest,
      updateTest,
      deleteTest,
      recordTestResults,
      getStudentStats,
      getBatchStats,
      resetToSampleData,
    }),
    [students, batches, attendance, feePayments, tests, testResults, currentUser, theme]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
