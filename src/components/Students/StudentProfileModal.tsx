import React, { useState } from 'react';
import {
  X,
  Calendar,
  Phone,
  Mail,
  MapPin,
  User,
  GraduationCap,
  CreditCard,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Edit,
  Send,
  PlusCircle,
  Percent,
} from 'lucide-react';
import { Student, Batch, FeePayment } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ReceiptModal } from '../Fees/ReceiptModal';

interface StudentProfileModalProps {
  student: Student;
  batch?: Batch;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onRecordPayment: (student: Student) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  student,
  batch,
  onClose,
  onEdit,
  onRecordPayment,
}) => {
  const { attendance, feePayments, tests, testResults, getStudentStats } = useApp();
  const [activeTab, setActiveTab] = useState<'attendance' | 'fees' | 'tests'>('attendance');
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);

  const stats = getStudentStats(student.id);

  // Student's attendance records
  const studentAttendanceList = attendance
    .filter((a) => a.batchId === student.batchId && a.records[student.id] !== undefined)
    .map((a) => ({
      date: a.date,
      status: a.records[student.id],
      markedBy: a.markedBy,
      notes: a.notes,
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Student's fee payments
  const studentPayments = feePayments
    .filter((p) => p.studentId === student.id)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

  // Student's test results
  const studentTestResults = testResults
    .filter((r) => r.studentId === student.id)
    .map((r) => {
      const test = tests.find((t) => t.id === r.testId);
      return {
        ...r,
        testTitle: test?.title || 'Assessment Test',
        testDate: test?.date || '',
        totalMarks: test?.totalMarks || 100,
        passingMarks: test?.passingMarks || 40,
      };
    })
    .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime());

  // Quick WhatsApp link to parent
  const cleanPhone = (student.guardianPhone || student.phone).replace(/[^0-9]/g, '');
  const whatsAppUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${student.guardianName || 'Parent'}, this is from EduTrack Academy regarding ${student.name}. Current Attendance: ${stats.attendancePercentage}%. Pending fee balance: ${formatCurrency(stats.pendingDue)}.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header Hero */}
        <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 px-6 py-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            {/* Avatar / Photo */}
            <div className="relative">
              <img
                src={student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=160`}
                alt={student.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white/20 shadow-lg bg-indigo-800"
              />
              <span
                className={`absolute bottom-1 right-1 px-2 py-0.5 text-[10px] font-bold rounded-full uppercase shadow ${
                  student.status === 'active'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {student.status}
              </span>
            </div>

            {/* Profile Overview Details */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold tracking-tight truncate">{student.name}</h2>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-white/20 text-white">
                  {student.id}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/50 border border-white/20 text-indigo-50">
                  {batch?.name || student.batchId}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 text-xs text-indigo-100">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Phone className="w-3.5 h-3.5 opacity-80" />
                  <span>Student: {student.phone}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <User className="w-3.5 h-3.5 opacity-80" />
                  <span>Guardian: {student.guardianName} ({student.guardianPhone})</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="w-3.5 h-3.5 opacity-80" />
                  <span className="truncate">{student.email}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-3.5 h-3.5 opacity-80" />
                  <span>DOB: {formatDate(student.dob)} • Joined: {formatDate(student.joiningDate)}</span>
                </div>
                {student.address && (
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 sm:col-span-2">
                    <MapPin className="w-3.5 h-3.5 opacity-80 shrink-0" />
                    <span className="truncate">{student.address}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <button
                  onClick={() => onEdit(student)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
                >
                  <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit Profile
                </button>
                <button
                  onClick={() => onRecordPayment(student)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-white text-indigo-700 hover:bg-indigo-50 shadow-sm transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Collect Fee
                </button>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> WhatsApp Parent
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Attendance
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xl font-bold ${stats.attendancePercentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {stats.attendancePercentage}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stats.attendedClasses}/{stats.totalClasses} Days
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Fee Balance
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className={`text-lg font-bold ${stats.pendingDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {stats.pendingDue > 0 ? formatCurrency(stats.pendingDue) : 'Paid in Full'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Tests Average
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.averageScorePercentage}%
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {stats.testsTaken} Tests
              </span>
            </div>
          </div>

          <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Batch Rank
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-bold text-violet-600 dark:text-violet-400">
                {stats.recentRank ? `#${stats.recentRank}` : '—'}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                In Batch
              </span>
            </div>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'attendance'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Attendance History ({studentAttendanceList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'fees'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Fee Ledger ({studentPayments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
              activeTab === 'tests'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Test Performance ({studentTestResults.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-900/50">
          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    Class Attendance Record
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Calculated from daily roll-call records for {batch?.name}
                  </p>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Present: {stats.attendedClasses}
                  </span>
                  <span className="flex items-center text-rose-600 dark:text-rose-400 font-medium">
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Absent: {stats.totalClasses - stats.attendedClasses}
                  </span>
                </div>
              </div>

              {studentAttendanceList.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                  No attendance records marked yet for this batch.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {studentAttendanceList.map((entry, idx) => {
                      const statusStyles = {
                        present: {
                          bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                          label: 'Present',
                        },
                        absent: {
                          bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                          icon: <XCircle className="w-4 h-4 text-rose-500" />,
                          label: 'Absent',
                        },
                        late: {
                          bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                          icon: <Clock className="w-4 h-4 text-amber-500" />,
                          label: 'Late',
                        },
                      };
                      const currentStyle = statusStyles[entry.status];

                      return (
                        <div key={idx} className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors">
                          <div className="flex items-center space-x-3">
                            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              <Calendar className="w-4 h-4" />
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                                {formatDate(entry.date)}
                              </p>
                              {entry.notes && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                                  Note: {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${currentStyle.bg}`}>
                              {currentStyle.icon}
                              <span className="ml-1.5">{currentStyle.label}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FEES */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Course Fee</span>
                    <p className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatCurrency(student.feePlan?.totalFee || 0)}
                    </p>
                    {student.feePlan?.discount > 0 && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400">
                        Discount: -{formatCurrency(student.feePlan.discount)}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Amount Paid</span>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatCurrency(stats.paidFee)}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {studentPayments.length} installment(s) received
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Remaining Balance</span>
                    <p className={`text-lg font-bold mt-0.5 ${stats.pendingDue > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {formatCurrency(stats.pendingDue)}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Plan: {student.feePlan?.planType || 'quarterly'} ({student.feePlan?.installmentsCount || 1} inst.)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                  Payment History & Receipts
                </h4>
                <button
                  onClick={() => onRecordPayment(student)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Payment
                </button>
              </div>

              {studentPayments.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                  No payment records found for this student.
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {studentPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                              {formatCurrency(payment.amount)}
                            </span>
                            <span className="px-2 py-0.5 text-[11px] font-semibold uppercase rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              {payment.paymentMethod}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {payment.receiptNumber}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Paid on {formatDate(payment.paymentDate)} • Collected by {payment.collectedBy}
                            {payment.remarks && ` • ${payment.remarks}`}
                          </p>
                        </div>

                        <button
                          onClick={() => setSelectedReceipt(payment)}
                          className="self-start sm:self-auto inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1.5" /> View Receipt
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TESTS */}
          {activeTab === 'tests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    Academic Test Scorecards
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Evaluated test submissions and subject-wise breakdown
                  </p>
                </div>
              </div>

              {studentTestResults.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-sm">
                  No test scores recorded yet for this student.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentTestResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700 pb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {result.testTitle}
                            </h5>
                            {result.rank && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                Rank #{result.rank}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Conducted on {formatDate(result.testDate)} • Passing: {result.passingMarks}/{result.totalMarks}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {result.totalScore} / {result.totalMarks}
                          </span>
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                            {result.percentage}% ({result.percentage >= 40 ? 'Passed' : 'Failed'})
                          </span>
                        </div>
                      </div>

                      {/* Subject Marks Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-1">
                        {Object.entries(result.subjectMarks).map(([subj, mark]) => (
                          <div key={subj} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-xs">
                            <span className="text-slate-500 dark:text-slate-400 block truncate">{subj}</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{mark} marks</span>
                          </div>
                        ))}
                      </div>

                      {result.remarks && (
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                          Teacher remarks: "{result.remarks}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Printable Receipt Modal if opened */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          student={student}
          batch={batch}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};
