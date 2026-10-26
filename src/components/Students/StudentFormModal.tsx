import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Calendar, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { Student, Batch, StudentStatus } from '../../types';
import { useApp } from '../../context/AppContext';

interface StudentFormModalProps {
  studentToEdit?: Student | null;
  onClose: () => void;
  onSuccess: (studentName: string, isNew: boolean) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  studentToEdit,
  onClose,
  onSuccess,
}) => {
  const { batches, addStudent, updateStudent } = useApp();

  const [name, setName] = useState(studentToEdit?.name || '');
  const [photo, setPhoto] = useState(
    studentToEdit?.photo || AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)]
  );
  const [phone, setPhone] = useState(studentToEdit?.phone || '');
  const [email, setEmail] = useState(studentToEdit?.email || '');
  const [guardianName, setGuardianName] = useState(studentToEdit?.guardianName || '');
  const [guardianPhone, setGuardianPhone] = useState(studentToEdit?.guardianPhone || '');
  const [address, setAddress] = useState(studentToEdit?.address || '');
  const [dob, setDob] = useState(studentToEdit?.dob || '2007-06-15');
  const [batchId, setBatchId] = useState(
    studentToEdit?.batchId || (batches[0]?.id || 'BATCH-01')
  );
  const [joiningDate, setJoiningDate] = useState(
    studentToEdit?.joiningDate || new Date().toISOString().split('T')[0]
  );
  const [totalFee, setTotalFee] = useState<number>(
    studentToEdit?.feePlan?.totalFee || (batches[0]?.baseFee || 45000)
  );
  const [discount, setDiscount] = useState<number>(studentToEdit?.feePlan?.discount || 0);
  const [planType, setPlanType] = useState<'one-time' | 'monthly' | 'quarterly' | 'custom'>(
    studentToEdit?.feePlan?.planType || 'quarterly'
  );
  const [installmentsCount, setInstallmentsCount] = useState<number>(
    studentToEdit?.feePlan?.installmentsCount || 3
  );
  const [status, setStatus] = useState<StudentStatus>(studentToEdit?.status || 'active');
  const [notes, setNotes] = useState(studentToEdit?.notes || '');
  const [error, setError] = useState<string | null>(null);

  // If user selects a batch and fee hasn't been modified yet, auto-fill base fee
  const handleBatchChange = (newBatchId: string) => {
    setBatchId(newBatchId);
    if (!studentToEdit) {
      const selected = batches.find((b) => b.id === newBatchId);
      if (selected?.baseFee) {
        setTotalFee(selected.baseFee);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide student full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide student phone number.');
      return;
    }
    if (!batchId) {
      setError('Please assign student to a batch.');
      return;
    }

    const feePlanData = {
      totalFee: Number(totalFee) || 0,
      discount: Number(discount) || 0,
      planType,
      installmentsCount: Number(installmentsCount) || 1,
    };

    if (studentToEdit) {
      const res = updateStudent(studentToEdit.id, {
        name: name.trim(),
        photo,
        phone: phone.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        guardianName: guardianName.trim() || 'Parent / Guardian',
        guardianPhone: guardianPhone.trim() || phone.trim(),
        address: address.trim(),
        dob,
        batchId,
        joiningDate,
        feePlan: feePlanData,
        status,
        notes: notes.trim(),
      });

      if (!res.success) {
        setError(res.error || 'Failed to update student.');
        return;
      }
      onSuccess(name, false);
    } else {
      const res = addStudent({
        name: name.trim(),
        photo,
        phone: phone.trim(),
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        guardianName: guardianName.trim() || 'Parent / Guardian',
        guardianPhone: guardianPhone.trim() || phone.trim(),
        address: address.trim(),
        dob,
        batchId,
        joiningDate,
        feePlan: feePlanData,
        status,
        notes: notes.trim(),
      });

      if (!res.success) {
        setError(res.error || 'Failed to create student.');
        return;
      }
      onSuccess(name, true);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {studentToEdit ? 'Edit Student Details' : 'New Student Admission'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {studentToEdit ? `Updating record for ${studentToEdit.id}` : 'Fill in student and guardian admission details'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="flex items-center p-3 text-sm text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Avatar & Photo Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Student Photo / Avatar
            </label>
            <div className="flex items-center space-x-4">
              <img
                src={photo}
                alt="Avatar Preview"
                className="w-16 h-16 rounded-xl object-cover border-2 border-indigo-500 shadow-sm"
              />
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-2">
                  {AVATAR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPhoto(p)}
                      className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                        photo === p ? 'border-indigo-600 scale-105 shadow-xs' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="url"
                  placeholder="Or paste custom image URL..."
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Phone <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9820112345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="e.g. rahul.v@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Guardian Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guardian / Parent Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Verma (Father)"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Guardian Contact Phone
              </label>
              <input
                type="tel"
                placeholder="e.g. 9820119999"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Residential Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Flat / Street / Area, City"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Batch & Enrollment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Batch / Course <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={batchId}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admission Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Fee Plan Breakdown */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Fee Structure & Installment Plan
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Total Course Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalFee}
                  onChange={(e) => setTotalFee(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Scholarship / Discount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Plan Frequency
                </label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="one-time">One-time Full</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Installments
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={installmentsCount}
                  onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Status & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Student Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StudentStatus)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="active">Active (Enrolled)</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Internal Remarks / Academic Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Target exam, special requests, strong subjects..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
            >
              {studentToEdit ? 'Save Changes' : 'Confirm Admission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
