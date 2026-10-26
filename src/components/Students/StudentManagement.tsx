import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  Download,
  Upload,
  ArrowUpDown,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Phone,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, Batch } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportStudentsToCSV } from '../../utils/csvHelpers';
import { StudentFormModal } from './StudentFormModal';
import { StudentProfileModal } from './StudentProfileModal';
import { BulkUploadModal } from './BulkUploadModal';

interface StudentManagementProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onRecordFeeForStudent?: (student: Student) => void;
}

export const StudentManagement: React.FC<StudentManagementProps> = ({
  onShowToast,
  onRecordFeeForStudent,
}) => {
  const { students, batches, deleteStudent, getStudentStats } = useApp();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedFeeDue, setSelectedFeeDue] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'newest' | 'highest_due' | 'attendance'>('name_asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Student | null>(null);

  const batchMap = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);

  // Filtered & Sorted Students
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            s.name.toLowerCase().includes(q) ||
            s.phone.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            s.guardianName.toLowerCase().includes(q) ||
            s.id.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // Batch filter
        if (selectedBatch !== 'all' && s.batchId !== selectedBatch) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'all' && s.status !== selectedStatus) {
          return false;
        }

        // Fee Due filter
        if (selectedFeeDue !== 'all') {
          const stats = getStudentStats(s.id);
          if (selectedFeeDue === 'pending' && stats.pendingDue <= 0) return false;
          if (selectedFeeDue === 'paid' && stats.pendingDue > 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'newest') return new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime();
        if (sortBy === 'highest_due') {
          const dueA = getStudentStats(a.id).pendingDue;
          const dueB = getStudentStats(b.id).pendingDue;
          return dueB - dueA;
        }
        if (sortBy === 'attendance') {
          const attA = getStudentStats(a.id).attendancePercentage;
          const attB = getStudentStats(b.id).attendancePercentage;
          return attB - attA;
        }
        return 0;
      });
  }, [students, searchQuery, selectedBatch, selectedStatus, selectedFeeDue, sortBy, getStudentStats]);

  const handleExportCSV = () => {
    exportStudentsToCSV(filteredStudents, batches);
    onShowToast(`Exported ${filteredStudents.length} student records to CSV!`, 'success');
  };

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) return;
    deleteStudent(deleteCandidate.id);
    onShowToast(`Student ${deleteCandidate.name} deleted successfully.`, 'info');
    setDeleteCandidate(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Student Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {students.length} students enrolled • Showing {filteredStudents.length} records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Upload className="w-4 h-4 mr-1.5 text-slate-500" />
            Bulk Import CSV
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setStudentToEdit(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Admit New Student
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by student name, phone, email, guardian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Filter Selects */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Batch Filter */}
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Batches ({batches.length})</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Fee Due Filter */}
            <select
              value={selectedFeeDue}
              onChange={(e) => setSelectedFeeDue(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Fee Status</option>
              <option value="pending">Pending Dues Only</option>
              <option value="paid">Fully Paid Only</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name_asc">Sort: Name (A to Z)</option>
              <option value="name_desc">Sort: Name (Z to A)</option>
              <option value="newest">Sort: Newest First</option>
              <option value="highest_due">Sort: Highest Due</option>
              <option value="attendance">Sort: Attendance %</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Grid Cards"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="List Table"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredStudents.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No students match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, batch, or fee filter, or admit a new student.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedBatch('all');
              setSelectedStatus('all');
              setSelectedFeeDue('all');
            }}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const batch = batchMap.get(student.batchId);
            const stats = getStudentStats(student.id);
            const cleanPhone = (student.guardianPhone || student.phone).replace(/[^0-9]/g, '');
            const whatsAppUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
              `Hello ${student.guardianName || 'Parent'}, this is from EduTrack Academy regarding ${student.name}.`
            )}`;

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-4">
                  {/* Top info row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img
                        src={student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=100`}
                        alt={student.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0">
                        <h4
                          onClick={() => setProfileStudent(student)}
                          className="font-bold text-slate-900 dark:text-slate-100 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate"
                        >
                          {student.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="font-mono text-[11px]">{student.id}</span>
                          <span>•</span>
                          <span className="truncate">{student.phone}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase shrink-0 ${
                        student.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {student.status}
                    </span>
                  </div>

                  {/* Batch Badge & Guardian */}
                  <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                    <div className="inline-block px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium text-[11px] truncate max-w-full">
                      {batch?.name || student.batchId}
                    </div>
                    <p className="truncate text-slate-500 dark:text-slate-400">
                      Guardian: <span className="text-slate-700 dark:text-slate-300">{student.guardianName}</span>
                    </p>
                  </div>

                  {/* Stats Mini Row */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Attendance</span>
                      <span
                        className={`font-bold text-sm ${
                          stats.attendancePercentage >= 75
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {stats.attendancePercentage}%
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Pending Due</span>
                      <span
                        className={`font-bold text-sm ${
                          stats.pendingDue > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {stats.pendingDue > 0 ? formatCurrency(stats.pendingDue) : 'Cleared'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                  <button
                    onClick={() => setProfileStudent(student)}
                    className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      title="WhatsApp Guardian"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => {
                        setStudentToEdit(student);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Edit Student"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteCandidate(student)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Delete Student"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Attendance</th>
                  <th className="py-3 px-4">Fee Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredStudents.map((student) => {
                  const batch = batchMap.get(student.batchId);
                  const stats = getStudentStats(student.id);

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=60`}
                            alt={student.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                          <div>
                            <p
                              onClick={() => setProfileStudent(student)}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 cursor-pointer"
                            >
                              {student.name}
                            </p>
                            <span className="text-[11px] font-mono text-slate-400">
                              {student.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-200">{student.phone}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{student.guardianName}</p>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {batch?.name || student.batchId}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            stats.attendancePercentage >= 75
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {stats.attendancePercentage}%
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          ({stats.attendedClasses}/{stats.totalClasses})
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`font-bold ${
                            stats.pendingDue > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {stats.pendingDue > 0 ? formatCurrency(stats.pendingDue) : 'Paid'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            student.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setProfileStudent(student)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg dark:hover:bg-indigo-950/40"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setStudentToEdit(student);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-700"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteCandidate(student)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg dark:hover:bg-rose-950/40"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-slate-900 dark:text-slate-100">
                Delete Student Record?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to remove <strong>{deleteCandidate.name}</strong> ({deleteCandidate.id})? All associated fee and test entries will also be removed.
              </p>
            </div>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Form Modal */}
      {isFormOpen && (
        <StudentFormModal
          studentToEdit={studentToEdit}
          onClose={() => setIsFormOpen(false)}
          onSuccess={(name, isNew) => {
            onShowToast(
              isNew ? `Admitted new student ${name} successfully!` : `Updated record for ${name}.`,
              'success'
            );
          }}
        />
      )}

      {/* Student Profile Modal */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          batch={batchMap.get(profileStudent.batchId)}
          onClose={() => setProfileStudent(null)}
          onEdit={(s) => {
            setProfileStudent(null);
            setStudentToEdit(s);
            setIsFormOpen(true);
          }}
          onRecordPayment={(s) => {
            setProfileStudent(null);
            if (onRecordFeeForStudent) {
              onRecordFeeForStudent(s);
            }
          }}
        />
      )}

      {/* Bulk Upload Modal */}
      {isBulkOpen && (
        <BulkUploadModal
          onClose={() => setIsBulkOpen(false)}
          onSuccess={(count) => {
            onShowToast(`Successfully imported ${count} students from CSV!`, 'success');
          }}
        />
      )}
    </div>
  );
};
