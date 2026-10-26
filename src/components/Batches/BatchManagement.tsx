import React, { useState } from 'react';
import {
  Plus,
  Users,
  Calendar,
  Clock,
  User,
  BookOpen,
  Edit,
  Trash2,
  CheckCircle2,
  X,
  MapPin,
  TrendingUp,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Batch, Student } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface BatchManagementProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToAttendance?: (batchId: string) => void;
}

export const BatchManagement: React.FC<BatchManagementProps> = ({
  onShowToast,
  onNavigateToAttendance,
}) => {
  const { batches, students, addBatch, updateBatch, deleteBatch, getBatchStats } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [batchToEdit, setBatchToEdit] = useState<Batch | null>(null);
  const [selectedBatchForStudents, setSelectedBatchForStudents] = useState<Batch | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [timings, setTimings] = useState('');
  const [teacher, setTeacher] = useState('');
  const [capacity, setCapacity] = useState<number>(30);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseFee, setBaseFee] = useState<number>(40000);
  const [room, setRoom] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setBatchToEdit(null);
    setName('');
    setSubject('');
    setTimings('Mon, Wed, Fri • 04:00 PM - 06:00 PM');
    setTeacher('');
    setCapacity(25);
    setStartDate(new Date().toISOString().split('T')[0]);
    const end = new Date();
    end.setFullYear(end.getFullYear() + 1);
    setEndDate(end.toISOString().split('T')[0]);
    setBaseFee(45000);
    setRoom('Hall A-1');
    setDescription('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditModal = (batch: Batch) => {
    setBatchToEdit(batch);
    setName(batch.name);
    setSubject(batch.subject);
    setTimings(batch.timings);
    setTeacher(batch.teacher);
    setCapacity(batch.capacity);
    setStartDate(batch.startDate);
    setEndDate(batch.endDate);
    setBaseFee(batch.baseFee);
    setRoom(batch.room || '');
    setDescription(batch.description || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Batch name is required.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Subject is required.');
      return;
    }
    if (!teacher.trim()) {
      setFormError('Teacher name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      subject: subject.trim(),
      timings: timings.trim(),
      teacher: teacher.trim(),
      capacity: Number(capacity) || 25,
      startDate,
      endDate,
      baseFee: Number(baseFee) || 0,
      room: room.trim() || undefined,
      description: description.trim() || undefined,
    };

    if (batchToEdit) {
      updateBatch(batchToEdit.id, payload);
      onShowToast(`Batch "${name}" updated successfully.`, 'success');
    } else {
      addBatch(payload);
      onShowToast(`Created batch "${name}" successfully.`, 'success');
    }

    setIsFormOpen(false);
  };

  const handleDelete = (batch: Batch) => {
    const res = deleteBatch(batch.id);
    if (!res.success) {
      onShowToast(res.error || 'Failed to delete batch.', 'error');
    } else {
      onShowToast(`Batch ${batch.name} deleted.`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Batch & Course Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize academic courses, faculty schedules, and student allocations
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Batch
        </button>
      </div>

      {/* Batch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((batch) => {
          const stats = getBatchStats(batch.id);
          const occupancyPercent = Math.min(100, Math.round((stats.enrolledCount / stats.capacity) * 100));

          return (
            <div
              key={batch.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                      {batch.id}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mt-1.5">
                      {batch.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {batch.subject}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(batch)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      title="Edit Batch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(batch)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Faculty & Timings */}
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {batch.teacher}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{batch.timings}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(batch.startDate)} – {formatDate(batch.endDate)}</span>
                  </div>
                  {batch.room && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{batch.room}</span>
                    </div>
                  )}
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Enrollment Capacity:
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {stats.enrolledCount} / {stats.capacity} students ({occupancyPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        occupancyPercent >= 90
                          ? 'bg-rose-500'
                          : occupancyPercent >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${occupancyPercent}%` }}
                    />
                  </div>
                </div>

                {/* Performance stats pills */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 font-medium block">
                      Avg Attendance
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {stats.attendanceRate}%
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 font-medium block">
                      Course Base Fee
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      {formatCurrency(batch.baseFee)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="p-4 bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedBatchForStudents(batch)}
                  className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  <Users className="w-3.5 h-3.5 mr-1" /> View Enrolled ({stats.enrolledCount})
                </button>

                {onNavigateToAttendance && (
                  <button
                    onClick={() => onNavigateToAttendance(batch.id)}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <UserCheck className="w-3 h-3 mr-1 text-indigo-600" />
                    Attendance
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Enrolled Students Modal */}
      {selectedBatchForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                  Enrolled Students in {selectedBatchForStudents.name}
                </h4>
                <p className="text-xs text-slate-500">
                  Teacher: {selectedBatchForStudents.teacher} • Timings: {selectedBatchForStudents.timings}
                </p>
              </div>
              <button
                onClick={() => setSelectedBatchForStudents(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {students.filter((s) => s.batchId === selectedBatchForStudents.id).length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No students enrolled in this batch yet.
                </div>
              ) : (
                students
                  .filter((s) => s.batchId === selectedBatchForStudents.id)
                  .map((s) => (
                    <div key={s.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img
                          src={s.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=6366f1&color=fff&size=80`}
                          alt={s.name}
                          className="w-9 h-9 rounded-xl object-cover"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100">{s.name}</p>
                          <p className="text-slate-500 text-[11px]">{s.phone} • Joined: {formatDate(s.joiningDate)}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {s.status}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedBatchForStudents(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Create / Edit Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {batchToEdit ? 'Edit Batch Details' : 'Create New Batch'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 pt-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch / Course Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JEE Advanced 2025"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Subject(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physics & Math"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Faculty / Teacher <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prof. Arvind Sharma"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Class Timings
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mon, Wed, Fri • 4 PM"
                    value={timings}
                    onChange={(e) => setTimings(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classroom / Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room A-102"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Maximum Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Base Course Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={baseFee}
                    onChange={(e) => setBaseFee(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Syllabus Outline
                </label>
                <textarea
                  rows={2}
                  placeholder="Key targets, target exam, curriculum highlights..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {batchToEdit ? 'Save Changes' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
