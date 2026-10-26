import React, { useState, useMemo } from 'react';
import {
  Award,
  Plus,
  Calendar,
  CheckCircle2,
  Trophy,
  TrendingUp,
  X,
  Edit,
  Trash2,
  Users,
  BarChart3,
  Percent,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Test, TestResult, SubjectBreakdown, Student } from '../../types';
import { formatDate } from '../../utils/formatters';

interface TestsViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TestsView: React.FC<TestsViewProps> = ({ onShowToast }) => {
  const { tests, testResults, batches, students, addTest, deleteTest, recordTestResults } = useApp();

  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
  const [activeTestId, setActiveTestId] = useState<string>(tests[0]?.id || '');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScoreEntryModalOpen, setIsScoreEntryModalOpen] = useState(false);

  // New Test Form State
  const [title, setTitle] = useState('');
  const [batchId, setBatchId] = useState(batches[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [passingMarks, setPassingMarks] = useState<number>(40);
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState<SubjectBreakdown[]>([
    { name: 'Physics', maxMarks: 50 },
    { name: 'Mathematics', maxMarks: 50 },
  ]);

  // Score Entry State for selected test
  const [marksState, setMarksState] = useState<Record<string, Record<string, number>>>({});
  const [remarksState, setRemarksState] = useState<Record<string, string>>({});

  const batchMap = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  // Current selected test
  const activeTest = tests.find((t) => t.id === activeTestId) || tests[0];

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      if (selectedBatchFilter !== 'all' && t.batchId !== selectedBatchFilter) return false;
      return true;
    });
  }, [tests, selectedBatchFilter]);

  // Results for current active test
  const activeResults = useMemo(() => {
    if (!activeTest) return [];
    return testResults
      .filter((r) => r.testId === activeTest.id)
      .sort((a, b) => (a.rank || 99) - (b.rank || 99));
  }, [testResults, activeTest]);

  // Students in active test's batch
  const batchStudents = useMemo(() => {
    if (!activeTest) return [];
    return students.filter((s) => s.batchId === activeTest.batchId && s.status === 'active');
  }, [students, activeTest]);

  // Open Score Entry Modal
  const openScoreEntry = () => {
    if (!activeTest) return;

    // Prefill existing scores if already entered
    const currentScores: Record<string, Record<string, number>> = {};
    const currentRemarks: Record<string, string> = {};

    batchStudents.forEach((s) => {
      const existingRes = testResults.find((r) => r.testId === activeTest.id && r.studentId === s.id);
      if (existingRes) {
        currentScores[s.id] = { ...existingRes.subjectMarks };
        currentRemarks[s.id] = existingRes.remarks || '';
      } else {
        const initialSubs: Record<string, number> = {};
        activeTest.subjects.forEach((sub) => {
          initialSubs[sub.name] = Math.round(sub.maxMarks * 0.7); // sample decent score
        });
        currentScores[s.id] = initialSubs;
        currentRemarks[s.id] = '';
      }
    });

    setMarksState(currentScores);
    setRemarksState(currentRemarks);
    setIsScoreEntryModalOpen(true);
  };

  const handleSubjectMarksChange = (studentId: string, subjectName: string, val: number) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectName]: val,
      },
    }));
  };

  const handleSaveScores = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTest) return;

    const payload = batchStudents.map((s) => ({
      studentId: s.id,
      subjectMarks: marksState[s.id] || {},
      remarks: remarksState[s.id] || undefined,
    }));

    recordTestResults(activeTest.id, payload);
    onShowToast(`Recorded test scores & updated rankings for "${activeTest.title}".`, 'success');
    setIsScoreEntryModalOpen(false);
  };

  // Add dynamic subject row in test creation
  const addSubjectRow = () => {
    setSubjects((prev) => [...prev, { name: '', maxMarks: 50 }]);
  };

  const removeSubjectRow = (index: number) => {
    if (subjects.length <= 1) return;
    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      onShowToast('Please provide a test title.', 'error');
      return;
    }

    const validSubjects = subjects.filter((s) => s.name.trim().length > 0);
    if (validSubjects.length === 0) {
      onShowToast('At least one subject is required.', 'error');
      return;
    }

    const totalMarks = validSubjects.reduce((acc, s) => acc + (Number(s.maxMarks) || 0), 0);

    const newTest = addTest({
      title: title.trim(),
      batchId,
      date,
      totalMarks,
      passingMarks: Number(passingMarks) || 40,
      subjects: validSubjects,
      description: description.trim() || undefined,
    });

    onShowToast(`Created new test: ${newTest.title}`, 'success');
    setActiveTestId(newTest.id);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Tests & Academic Performance
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Record subject-wise marks, calculate ranks within batches, and track progress
          </p>
        </div>

        <button
          onClick={() => {
            setTitle('');
            setBatchId(batches[0]?.id || '');
            setDate(new Date().toISOString().split('T')[0]);
            setSubjects([
              { name: 'Physics', maxMarks: 50 },
              { name: 'Mathematics', maxMarks: 50 },
            ]);
            setDescription('');
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Test
        </button>
      </div>

      {/* Filter by Batch & Test Selector */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Filter by Batch
            </label>
            <select
              value={selectedBatchFilter}
              onChange={(e) => {
                setSelectedBatchFilter(e.target.value);
                const firstMatching = tests.find(
                  (t) => e.target.value === 'all' || t.batchId === e.target.value
                );
                if (firstMatching) setActiveTestId(firstMatching.id);
              }}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Select Assessment Test
            </label>
            <select
              value={activeTestId}
              onChange={(e) => setActiveTestId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[240px]"
            >
              {filteredTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({formatDate(t.date)})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeTest && (
          <div className="flex items-center space-x-2 self-end md:self-auto">
            <button
              onClick={openScoreEntry}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Enter / Update Marks
            </button>
            <button
              onClick={() => {
                deleteTest(activeTest.id);
                onShowToast(`Deleted test: ${activeTest.title}`, 'info');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete this test"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {activeTest ? (
        <div className="space-y-6">
          {/* Active Test Details Card */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-indigo-500/30 border border-indigo-400/30 text-indigo-200">
                  {batchMap.get(activeTest.batchId)?.name || activeTest.batchId}
                </span>
                <h3 className="text-xl font-bold tracking-tight mt-1">
                  {activeTest.title}
                </h3>
                <p className="text-xs text-slate-300">
                  Date: {formatDate(activeTest.date)} • Passing Criteria: {activeTest.passingMarks} / {activeTest.totalMarks} Marks
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs uppercase text-indigo-300 font-semibold block">Total Weightage</span>
                <span className="text-2xl font-bold text-white">{activeTest.totalMarks} Marks</span>
              </div>
            </div>

            {/* Subjects breakdown pills */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              {activeTest.subjects.map((sub, idx) => (
                <div key={idx} className="px-3 py-1 rounded-lg bg-white/10 text-xs">
                  <span className="text-slate-300">{sub.name}: </span>
                  <strong className="text-white">{sub.maxMarks} marks</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard Podium (Top 3 Performers) */}
          {activeResults.length >= 3 && (
            <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center">
                <Trophy className="w-4 h-4 mr-2 text-amber-500" />
                Batch Leaderboard (Top Rankers)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {activeResults.slice(0, 3).map((res, idx) => {
                  const student = studentMap.get(res.studentId);
                  const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
                  const borders = [
                    'border-amber-300 dark:border-amber-700/60 bg-amber-50/60 dark:bg-amber-950/30',
                    'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40',
                    'border-orange-300 dark:border-orange-700/60 bg-orange-50/60 dark:bg-orange-950/30',
                  ];

                  return (
                    <div
                      key={res.id}
                      className={`p-3.5 rounded-xl border ${borders[idx]} flex items-center space-x-3`}
                    >
                      <img
                        src={student?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'S')}&background=6366f1&color=fff&size=60`}
                        alt={student?.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                          {medals[idx]}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {student?.name || res.studentId}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold">
                          {res.totalScore} / {activeTest.totalMarks} ({res.percentage}%)
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Submissions Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Candidate Scorecards & Rankings
                </h4>
                <p className="text-xs text-slate-500">
                  {activeResults.length} scored submissions out of {batchStudents.length} enrolled students
                </p>
              </div>

              {activeResults.length === 0 && (
                <button
                  onClick={openScoreEntry}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white"
                >
                  Enter Scores Now
                </button>
              )}
            </div>

            {activeResults.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">
                No scores recorded for this test yet. Click "Enter / Update Marks" above to record student scores.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Student</th>
                      {activeTest.subjects.map((sub) => (
                        <th key={sub.name} className="py-3 px-4 text-center">
                          {sub.name} (Max {sub.maxMarks})
                        </th>
                      ))}
                      <th className="py-3 px-4 text-center">Total Score</th>
                      <th className="py-3 px-4 text-center">Percentage</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {activeResults.map((result) => {
                      const student = studentMap.get(result.studentId);
                      const isPassed = result.totalScore >= activeTest.passingMarks;

                      return (
                        <tr
                          key={result.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                result.rank === 1
                                  ? 'bg-amber-400 text-slate-900'
                                  : result.rank === 2
                                  ? 'bg-slate-300 text-slate-900'
                                  : result.rank === 3
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {result.rank}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={student?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'S')}&background=6366f1&color=fff&size=60`}
                                alt={student?.name}
                                className="w-7 h-7 rounded-lg object-cover"
                              />
                              <span>{student?.name || result.studentId}</span>
                            </div>
                          </td>

                          {activeTest.subjects.map((sub) => (
                            <td key={sub.name} className="py-3 px-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                              {result.subjectMarks[sub.name] ?? '—'}
                            </td>
                          ))}

                          <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {result.totalScore} / {activeTest.totalMarks}
                          </td>

                          <td className="py-3 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                            {result.percentage}%
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              }`}
                            >
                              {isPassed ? 'Passed' : 'Failed'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                            {result.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 text-sm">No test assessments created yet.</p>
        </div>
      )}

      {/* Enter / Edit Marks Modal */}
      {isScoreEntryModalOpen && activeTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Record Test Marks: {activeTest.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Total Marks: {activeTest.totalMarks} • Batch: {batchMap.get(activeTest.batchId)?.name}
                </p>
              </div>
              <button
                onClick={() => setIsScoreEntryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveScores} className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
              <div className="space-y-3">
                {batchStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex items-center space-x-2.5">
                      <img
                        src={student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=60`}
                        alt={student.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{student.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">({student.id})</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {activeTest.subjects.map((sub) => (
                        <div key={sub.name}>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 truncate">
                            {sub.name} (Max {sub.maxMarks})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={sub.maxMarks}
                            value={marksState[student.id]?.[sub.name] ?? 0}
                            onChange={(e) =>
                              handleSubjectMarksChange(student.id, sub.name, Number(e.target.value))
                            }
                            className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                      ))}

                      <div className="col-span-2 sm:col-span-3">
                        <input
                          type="text"
                          placeholder="Teacher remarks / feedback..."
                          value={remarksState[student.id] || ''}
                          onChange={(e) =>
                            setRemarksState((prev) => ({ ...prev, [student.id]: e.target.value }))
                          }
                          className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScoreEntryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Compute Ranks & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Test Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Create New Assessment Test
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTestSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Test Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit Mock Test 5: Mechanics & Calculus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Batch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={batchId}
                    onChange={(e) => setBatchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Dynamic Subjects List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300">
                    Subject Weightages
                  </label>
                  <button
                    type="button"
                    onClick={addSubjectRow}
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-0.5" /> Add Subject
                  </button>
                </div>

                {subjects.map((sub, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Subject Name (e.g. Physics)"
                      value={sub.name}
                      onChange={(e) => {
                        const copy = [...subjects];
                        copy[idx].name = e.target.value;
                        setSubjects(copy);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="number"
                      min="5"
                      placeholder="Max"
                      value={sub.maxMarks}
                      onChange={(e) => {
                        const copy = [...subjects];
                        copy[idx].maxMarks = Number(e.target.value);
                        setSubjects(copy);
                      }}
                      className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    {subjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubjectRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Passing Marks
                </label>
                <input
                  type="number"
                  min="0"
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Syllabus / Pattern Note
                </label>
                <textarea
                  rows={2}
                  placeholder="Exam format, negative marking policy, syllabus covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Create Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
