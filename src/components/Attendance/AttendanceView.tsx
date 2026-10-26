import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Users,
  AlertTriangle,
  Send,
  FileText,
  Filter,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus, Batch, Student } from '../../types';
import { formatDate } from '../../utils/formatters';

interface AttendanceViewProps {
  initialBatchId?: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenAIDrafter?: (prompt: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  initialBatchId,
  onShowToast,
  onOpenAIDrafter,
}) => {
  const { batches, students, attendance, markBatchAttendance, currentUser } = useApp();

  const [activeTab, setActiveTab] = useState<'daily' | 'report'>('daily');
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialBatchId || batches[0]?.id || ''
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sessionNotes, setSessionNotes] = useState<string>('');

  // Daily marking local state
  const [currentRecords, setCurrentRecords] = useState<Record<string, AttendanceStatus>>({});

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);
  const enrolledStudents = useMemo(
    () => students.filter((s) => s.batchId === selectedBatchId && s.status === 'active'),
    [students, selectedBatchId]
  );

  // Sync state when batch or date changes
  useEffect(() => {
    if (!selectedBatchId) return;

    // Look for existing attendance record for this batch and date
    const existing = attendance.find(
      (a) => a.batchId === selectedBatchId && a.date === selectedDate
    );

    if (existing) {
      setCurrentRecords(existing.records || {});
      setSessionNotes(existing.notes || '');
    } else {
      // Default all enrolled students to 'present' for easy workflow
      const initial: Record<string, AttendanceStatus> = {};
      enrolledStudents.forEach((s) => {
        initial[s.id] = 'present';
      });
      setCurrentRecords(initial);
      setSessionNotes('');
    }
  }, [selectedBatchId, selectedDate, attendance, enrolledStudents]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setCurrentRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    enrolledStudents.forEach((s) => {
      updated[s.id] = status;
    });
    setCurrentRecords(updated);
  };

  const handleSaveDaily = () => {
    if (!selectedBatchId) {
      onShowToast('Please select a batch first.', 'error');
      return;
    }

    markBatchAttendance(selectedBatchId, selectedDate, currentRecords, sessionNotes.trim() || undefined);
    onShowToast(`Attendance recorded for ${selectedBatch?.name} (${selectedDate}).`, 'success');
  };

  // Daily Counts
  const presentCount = Object.values(currentRecords).filter((s) => s === 'present').length;
  const absentCount = Object.values(currentRecords).filter((s) => s === 'absent').length;
  const lateCount = Object.values(currentRecords).filter((s) => s === 'late').length;
  const totalCount = enrolledStudents.length;
  const attendanceRate = totalCount > 0 ? Math.round(((presentCount + lateCount) / totalCount) * 100) : 0;

  // Monthly Report Calculations
  const reportData = useMemo(() => {
    if (!selectedBatchId) return [];

    const batchAttendanceList = attendance.filter((a) => a.batchId === selectedBatchId);
    const totalSessions = batchAttendanceList.length;

    return enrolledStudents.map((student) => {
      let presentDays = 0;
      let absentDays = 0;
      let lateDays = 0;

      batchAttendanceList.forEach((entry) => {
        const stat = entry.records[student.id];
        if (stat === 'present') presentDays++;
        else if (stat === 'absent') absentDays++;
        else if (stat === 'late') lateDays++;
      });

      const totalMarkedDays = presentDays + absentDays + lateDays;
      const rate =
        totalMarkedDays > 0
          ? Math.round(((presentDays + lateDays) / totalMarkedDays) * 100)
          : 100;

      return {
        student,
        presentDays,
        absentDays,
        lateDays,
        totalMarkedDays,
        rate,
        isLow: rate < 75,
      };
    });
  }, [selectedBatchId, attendance, enrolledStudents]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Attendance Tracking
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daily roll-call marking and monthly percentage compliance reports
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 self-start sm:self-auto border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'daily'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Roll Call</span>
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'report'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Monthly Report</span>
          </button>
        </div>
      </div>

      {/* Batch & Date Selection Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Select Batch
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.teacher})
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'daily' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Attendance Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        {activeTab === 'daily' && (
          <div className="flex items-center space-x-2 self-end md:self-auto">
            <button
              onClick={() => markAll('present')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 transition-colors border border-emerald-200 dark:border-emerald-800/60"
            >
              All Present
            </button>
            <button
              onClick={() => markAll('absent')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-800/60"
            >
              All Absent
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: DAILY ROLL CALL */}
      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] uppercase text-slate-400 font-semibold block">Total Enrolled</span>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">{totalCount} Students</p>
            </div>
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
              <span className="text-[11px] uppercase text-emerald-600 dark:text-emerald-400 font-semibold block">Present</span>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{presentCount}</p>
            </div>
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-800/50">
              <span className="text-[11px] uppercase text-rose-600 dark:text-rose-400 font-semibold block">Absent</span>
              <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-0.5">{absentCount}</p>
            </div>
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50">
              <span className="text-[11px] uppercase text-amber-600 dark:text-amber-400 font-semibold block">Late</span>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-0.5">{lateCount}</p>
            </div>
          </div>

          {/* Student Roll Call Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Mark Roll Call: {selectedBatch?.name}
                </h4>
                <p className="text-xs text-slate-500">
                  {formatDate(selectedDate)} • Faculty: {selectedBatch?.teacher}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Attendance Rate: <strong className="text-indigo-600 dark:text-indigo-400">{attendanceRate}%</strong>
                </span>
              </div>
            </div>

            {enrolledStudents.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No active students currently enrolled in this batch.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {enrolledStudents.map((student, idx) => {
                  const status = currentRecords[student.id] || 'present';

                  return (
                    <div
                      key={student.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono text-slate-400 w-6">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <img
                          src={student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=80`}
                          alt={student.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {student.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {student.phone} • {student.guardianName}
                          </p>
                        </div>
                      </div>

                      {/* 3-State Toggle */}
                      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'present')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                            status === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Present</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'absent')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                            status === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Absent</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus(student.id, 'late')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
                            status === 'late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Late</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Session Remarks & Save */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Optional notes for today's session (e.g. topic covered, tests announced)..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                onClick={handleSaveDaily}
                className="inline-flex items-center justify-center px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY ATTENDANCE REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Cumulative Attendance Compliance
                </h4>
                <p className="text-xs text-slate-500">
                  Threshold: 75% minimum required attendance for board and entrance exams.
                </p>
              </div>
              {onOpenAIDrafter && (
                <button
                  onClick={() => onOpenAIDrafter(`Show students with attendance below 75% in ${selectedBatch?.name || 'this batch'} and draft WhatsApp reminders.`)}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  AI Attendance Alert
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Phone / Guardian</th>
                    <th className="py-3 px-4 text-center">Present</th>
                    <th className="py-3 px-4 text-center">Absent</th>
                    <th className="py-3 px-4 text-center">Late</th>
                    <th className="py-3 px-4">Compliance %</th>
                    <th className="py-3 px-4 text-right">Parent Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {reportData.map(({ student, presentDays, absentDays, lateDays, totalMarkedDays, rate, isLow }) => {
                    const cleanPhone = (student.guardianPhone || student.phone).replace(/[^0-9]/g, '');
                    const whatsAppUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
                      `Dear ${student.guardianName || 'Parent'}, this is an official attendance notice from EduTrack Academy for ${student.name}. Current attendance is ${rate}%, which is below the mandatory 75% threshold (${presentDays}/${totalMarkedDays} classes). Please ensure regular attendance.`
                    )}`;

                    return (
                      <tr
                        key={student.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors ${
                          isLow ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <img
                              src={student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=60`}
                              alt={student.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <span>{student.name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {student.phone} ({student.guardianName})
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-emerald-600">
                          {presentDays}
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-rose-600">
                          {absentDays}
                        </td>

                        <td className="py-3 px-4 text-center font-semibold text-amber-600">
                          {lateDays}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-bold ${
                                !isLow ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {rate}%
                            </span>
                            {isLow && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                Low (&lt;75%)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isLow ? (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-2xs transition-colors"
                            >
                              <Send className="w-3 h-3 mr-1" /> WhatsApp Alert
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">Compliant</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
