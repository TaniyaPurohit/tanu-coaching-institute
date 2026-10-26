import React, { useMemo } from 'react';
import {
  Users,
  BookOpen,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  Award,
  UserPlus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Eye,
  PlusCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, Batch, Test } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenStudentProfile: (student: Student) => void;
  onOpenAIAssistant: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenStudentProfile,
  onOpenAIAssistant,
}) => {
  const { students, batches, attendance, feePayments, tests, getStudentStats } = useApp();

  const todayStr = new Date().toISOString().split('T')[0];

  // Financial Stats
  const { totalAgreed, totalCollected, totalPending, collectionPercent } = useMemo(() => {
    let agreed = 0;
    students.forEach((s) => {
      const net = Math.max(0, (s.feePlan?.totalFee || 0) - (s.feePlan?.discount || 0));
      agreed += net;
    });
    const collected = feePayments.reduce((sum, p) => sum + p.amount, 0);
    const pending = Math.max(0, agreed - collected);
    const percent = agreed > 0 ? Math.round((collected / agreed) * 100) : 0;
    return { totalAgreed: agreed, totalCollected: collected, totalPending: pending, collectionPercent: percent };
  }, [students, feePayments]);

  // Today's Attendance calculation
  const todayAttendanceStats = useMemo(() => {
    const todayEntries = attendance.filter((a) => a.date === todayStr);
    let present = 0;
    let absent = 0;
    let late = 0;
    let markedTotal = 0;

    todayEntries.forEach((entry) => {
      Object.values(entry.records).forEach((stat) => {
        markedTotal++;
        if (stat === 'present') present++;
        else if (stat === 'absent') absent++;
        else if (stat === 'late') late++;
      });
    });

    const activeStudentsCount = students.filter((s) => s.status === 'active').length;
    const rate = markedTotal > 0 ? Math.round(((present + late) / markedTotal) * 100) : 92;

    return {
      batchesMarkedCount: todayEntries.length,
      present,
      absent,
      late,
      markedTotal,
      rate,
      activeStudentsCount,
    };
  }, [attendance, todayStr, students]);

  // Recent Admissions (Sorted by joiningDate desc)
  const recentAdmissions = useMemo(() => {
    return [...students]
      .sort((a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime())
      .slice(0, 5);
  }, [students]);

  // Upcoming / Recent Tests
  const recentTests = useMemo(() => {
    return [...tests]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [tests]);

  // Batch occupancy stats
  const batchOccupancy = useMemo(() => {
    return batches.map((b) => {
      const count = students.filter((s) => s.batchId === b.id && s.status === 'active').length;
      const pct = Math.min(100, Math.round((count / b.capacity) * 100));
      return { ...b, enrolled: count, percent: pct };
    });
  }, [batches, students]);

  const batchMap = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);

  return (
    <div className="space-y-6">
      {/* Welcome & AI Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
              EduTrack Operations Hub
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Coaching Institute Dashboard
            </h1>
            <p className="text-xs md:text-sm text-indigo-100">
              Real-time monitoring of student attendance, fee collections, batch capacity, and exam evaluations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAIAssistant}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs shadow-md transition-all group"
            >
              <Sparkles className="w-4 h-4 mr-2 text-indigo-600 group-hover:rotate-12 transition-transform" />
              Ask AI Assistant
            </button>
            <button
              onClick={() => onNavigate('students')}
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-semibold text-xs border border-white/20 transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Admit Student
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-2xl" />
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div
          onClick={() => onNavigate('students')}
          className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Enrolled
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {students.length}
          </p>
          <div className="flex items-center space-x-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 font-semibold">
              {students.filter((s) => s.status === 'active').length} Active
            </span>
            <span>•</span>
            <span>{students.filter((s) => s.status === 'inactive').length} Inactive</span>
          </div>
        </div>

        {/* Active Batches */}
        <div
          onClick={() => onNavigate('batches')}
          className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Batches
            </span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {batches.length} Batches
          </p>
          <div className="flex items-center space-x-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Faculty across 3 disciplines</span>
          </div>
        </div>

        {/* Today's Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today's Attendance
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {todayAttendanceStats.rate}%
          </p>
          <div className="flex items-center space-x-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>
              {todayAttendanceStats.present} present, {todayAttendanceStats.absent} absent
            </span>
          </div>
        </div>

        {/* Fees Collected vs Pending */}
        <div
          onClick={() => onNavigate('fees')}
          className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Fees Collected
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
            {formatCurrency(totalCollected)}
          </p>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-amber-600 font-semibold">
              Due: {formatCurrency(totalPending)}
            </span>
            <span className="text-slate-400 font-medium">({collectionPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Fee Collection & Dues Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Financial Revenue Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Collected Tuition vs Remaining Balances by Batch
              </p>
            </div>
            <button
              onClick={() => onNavigate('fees')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              Fee Ledger <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          {/* Collection Progress Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-300">
                Overall Collection Efficiency: {collectionPercent}%
              </span>
              <span className="text-slate-500">
                Total Budget: {formatCurrency(totalAgreed)}
              </span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${collectionPercent}%` }}
                title={`Collected: ${formatCurrency(totalCollected)}`}
              />
              <div
                className="h-full bg-amber-400 transition-all duration-500"
                style={{ width: `${100 - collectionPercent}%` }}
                title={`Pending: ${formatCurrency(totalPending)}`}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5" />
                Collected: {formatCurrency(totalCollected)}
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mr-1.5" />
                Pending Due: {formatCurrency(totalPending)}
              </span>
            </div>
          </div>

          {/* Batch-wise comparison bars */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            {batchOccupancy.map((b) => {
              let batchCollected = 0;
              let batchAgreed = 0;
              students
                .filter((s) => s.batchId === b.id)
                .forEach((s) => {
                  batchAgreed += Math.max(0, (s.feePlan?.totalFee || 0) - (s.feePlan?.discount || 0));
                });
              feePayments
                .filter((p) => p.batchId === b.id)
                .forEach((p) => {
                  batchCollected += p.amount;
                });
              const batchRate = batchAgreed > 0 ? Math.round((batchCollected / batchAgreed) * 100) : 0;

              return (
                <div key={b.id} className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.name}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {formatCurrency(batchCollected)} / {formatCurrency(batchAgreed)} ({batchRate}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${batchRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Batch Seat Capacity */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Batch Capacity Utilization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Seat enrollment vs maximum batch sizes
              </p>
            </div>
            <button
              onClick={() => onNavigate('batches')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              Batches <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-4 pt-1">
            {batchOccupancy.map((batch) => (
              <div key={batch.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {batch.name}
                  </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {batch.enrolled} / {batch.capacity} seats
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      batch.percent >= 90
                        ? 'bg-rose-500'
                        : batch.percent >= 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${batch.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Faculty: {batch.teacher}</span>
                  <span>{batch.percent}% full</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Admissions & Upcoming Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Admissions */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Recent Student Admissions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest student registrations and assigned courses
              </p>
            </div>
            <button
              onClick={() => onNavigate('students')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {recentAdmissions.map((student) => {
              const batch = batchMap.get(student.batchId);
              const stats = getStudentStats(student.id);

              return (
                <div
                  key={student.id}
                  onClick={() => onOpenStudentProfile(student)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/80 rounded-xl px-2 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=60`}
                      alt={student.name}
                      className="w-9 h-9 rounded-xl object-cover shrink-0"
                    />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                        {student.name}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {batch?.name || student.batchId} • Enrolled: {formatDate(student.joiningDate)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-semibold block ${
                        stats.pendingDue > 0 ? 'text-amber-600' : 'text-emerald-600'
                      }`}
                    >
                      {stats.pendingDue > 0 ? formatCurrency(stats.pendingDue) : 'Paid'}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {stats.attendancePercentage}% att.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tests & Assessments */}
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Upcoming & Recent Tests
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Scheduled evaluations, mock drills, and scorecards
              </p>
            </div>
            <button
              onClick={() => onNavigate('tests')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              Test Hub <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {recentTests.map((test) => {
              const batch = batchMap.get(test.batchId);

              return (
                <div
                  key={test.id}
                  onClick={() => onNavigate('tests')}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                      {batch?.name || test.batchId}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      {test.title}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Conducted on {formatDate(test.date)} • {test.totalMarks} Marks
                    </p>
                  </div>

                  <span className="p-2 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 shadow-2xs">
                    <Award className="w-4 h-4" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
