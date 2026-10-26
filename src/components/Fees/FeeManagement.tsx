import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Receipt,
  User,
  X,
  Send,
  Building,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Student, Batch, FeePayment, PaymentMethod } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { ReceiptModal } from './ReceiptModal';

interface FeeManagementProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  preSelectedStudent?: Student | null;
  onClearPreSelected?: () => void;
}

export const FeeManagement: React.FC<FeeManagementProps> = ({
  onShowToast,
  preSelectedStudent,
  onClearPreSelected,
}) => {
  const { students, batches, feePayments, recordFeePayment, getStudentStats } = useApp();

  const [activeTab, setActiveTab] = useState<'students' | 'transactions'>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('all');
  const [selectedDueFilter, setSelectedDueFilter] = useState<'all' | 'pending' | 'cleared'>('all');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<Student | null>(null);
  const [selectedReceiptForPrint, setSelectedReceiptForPrint] = useState<FeePayment | null>(null);

  // Record Payment Form Fields
  const [payStudentId, setPayStudentId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(10000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [payTxnRef, setPayTxnRef] = useState<string>('');
  const [payRemarks, setPayRemarks] = useState<string>('Installment fee payment');
  const [formError, setFormError] = useState<string | null>(null);

  const batchMap = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  // If a student was passed in to receive payment, open modal automatically
  React.useEffect(() => {
    if (preSelectedStudent) {
      openRecordPayment(preSelectedStudent);
      if (onClearPreSelected) onClearPreSelected();
    }
  }, [preSelectedStudent]);

  // Overall Financial Calculations
  const { totalAgreed, totalCollected, totalPending, collectionRate } = useMemo(() => {
    let agreed = 0;
    students.forEach((s) => {
      const net = Math.max(0, (s.feePlan?.totalFee || 0) - (s.feePlan?.discount || 0));
      agreed += net;
    });

    const collected = feePayments.reduce((sum, p) => sum + p.amount, 0);
    const pending = Math.max(0, agreed - collected);
    const rate = agreed > 0 ? Math.round((collected / agreed) * 100) : 0;

    return { totalAgreed: agreed, totalCollected: collected, totalPending: pending, collectionRate: rate };
  }, [students, feePayments]);

  const openRecordPayment = (student?: Student) => {
    const s = student || students[0];
    if (!s) return;
    setPayStudentId(s.id);
    setSelectedStudentForPayment(s);

    const stats = getStudentStats(s.id);
    setPayAmount(stats.pendingDue > 0 ? stats.pendingDue : 5000);
    setPayMethod('upi');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayTxnRef('');
    setPayRemarks('Course fee installment payment');
    setFormError(null);
    setIsRecordModalOpen(true);
  };

  const handleStudentSelectInModal = (id: string) => {
    setPayStudentId(id);
    const s = studentMap.get(id);
    if (s) {
      setSelectedStudentForPayment(s);
      const stats = getStudentStats(s.id);
      if (stats.pendingDue > 0) {
        setPayAmount(stats.pendingDue);
      }
    }
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStudentId) {
      setFormError('Please select a student.');
      return;
    }
    if (!payAmount || payAmount <= 0) {
      setFormError('Please enter a valid payment amount.');
      return;
    }

    const currentStudent = studentMap.get(payStudentId);
    if (!currentStudent) return;

    const newPayment = recordFeePayment({
      studentId: payStudentId,
      batchId: currentStudent.batchId,
      amount: Number(payAmount),
      paymentDate: payDate,
      paymentMethod: payMethod,
      transactionRef: payTxnRef.trim() || undefined,
      remarks: payRemarks.trim() || undefined,
      collectedBy: 'Accounts Officer',
    });

    onShowToast(`Payment of ${formatCurrency(payAmount)} recorded! Receipt: ${newPayment.receiptNumber}`, 'success');
    setIsRecordModalOpen(false);

    // Offer to immediately print receipt
    setSelectedReceiptForPrint(newPayment);
  };

  // Filtered Students for Fee Ledger
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          s.name.toLowerCase().includes(q) ||
          s.phone.includes(q) ||
          s.id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedBatchId !== 'all' && s.batchId !== selectedBatchId) return false;

      const stats = getStudentStats(s.id);
      if (selectedDueFilter === 'pending' && stats.pendingDue <= 0) return false;
      if (selectedDueFilter === 'cleared' && stats.pendingDue > 0) return false;

      return true;
    });
  }, [students, searchQuery, selectedBatchId, selectedDueFilter, getStudentStats]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return feePayments
      .filter((p) => {
        const s = studentMap.get(p.studentId);
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches =
            p.receiptNumber.toLowerCase().includes(q) ||
            p.transactionRef?.toLowerCase().includes(q) ||
            s?.name.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (selectedBatchId !== 'all' && p.batchId !== selectedBatchId) return false;

        return true;
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [feePayments, searchQuery, selectedBatchId, studentMap]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Fee Collection & Receipts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage fee schedules, record installment payments, and print formal tax receipts
          </p>
        </div>

        <button
          onClick={() => openRecordPayment()}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Record Fee Payment
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Total Billed Fees
          </span>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(totalAgreed)}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Across {students.length} students
          </span>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
            Collected Revenue
          </span>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {formatCurrency(totalCollected)}
          </p>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {collectionRate}% collection efficiency
          </span>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            Outstanding Dues
          </span>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
            {formatCurrency(totalPending)}
          </p>
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Pending collection
          </span>
        </div>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 shadow-xs">
          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
            Total Receipts Issued
          </span>
          <p className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mt-1">
            {feePayments.length} Transactions
          </p>
          <span className="text-xs text-indigo-600 dark:text-indigo-400">
            Printable & verified
          </span>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tab buttons */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'students'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Student Fee Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Transactions & Receipts ({feePayments.length})</span>
            </button>
          </div>

          {/* Search box & filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={activeTab === 'students' ? 'Search student name, phone...' : 'Search receipt #, student...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
              />
            </div>

            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {activeTab === 'students' && (
              <select
                value={selectedDueFilter}
                onChange={(e) => setSelectedDueFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Dues</option>
                <option value="pending">Pending Due Only</option>
                <option value="cleared">Cleared Only</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: STUDENT FEE LEDGER */}
      {activeTab === 'students' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4 text-right">Agreed Fee</th>
                  <th className="py-3 px-4 text-right">Paid So Far</th>
                  <th className="py-3 px-4 text-right">Pending Due</th>
                  <th className="py-3 px-4">Plan</th>
                  <th className="py-3 px-4 text-right">Action</th>
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
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={student.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=6366f1&color=fff&size=60`}
                            alt={student.name}
                            className="w-7 h-7 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-semibold">{student.name}</p>
                            <span className="text-[11px] font-normal text-slate-500">{student.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {batch?.name || student.batchId}
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                        {formatCurrency(stats.totalFee)}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(stats.paidFee)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-bold ${
                            stats.pendingDue > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {stats.pendingDue > 0 ? formatCurrency(stats.pendingDue) : 'Cleared'}
                        </span>
                      </td>

                      <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-400">
                        {student.feePlan?.planType || 'quarterly'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openRecordPayment(student)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5 mr-1" />
                          Collect Fee
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: TRANSACTIONS & RECEIPTS */}
      {activeTab === 'transactions' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Transaction Ref</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredTransactions.map((payment) => {
                  const student = studentMap.get(payment.studentId);

                  return (
                    <tr
                      key={payment.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {payment.receiptNumber}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {formatDate(payment.paymentDate)}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {student?.name || payment.studentId}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {payment.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500">
                        {payment.transactionRef || '—'}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(payment.amount)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedReceiptForPrint(payment)}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/60 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 mr-1" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Record Fee Payment
              </h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 pt-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                  {formError}
                </div>
              )}

              {/* Student Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={payStudentId}
                  onChange={(e) => handleStudentSelectInModal(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Outstanding balance indicator */}
              {selectedStudentForPayment && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold block">Pending Dues</span>
                    <span className="font-bold text-amber-600 text-sm">
                      {formatCurrency(getStudentStats(selectedStudentForPayment.id).pendingDue)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const due = getStudentStats(selectedStudentForPayment.id).pendingDue;
                      if (due > 0) setPayAmount(due);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Pay Full Due
                  </button>
                </div>
              )}

              {/* Payment Amount */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Received (₹) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="100"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-base font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Payment Method & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="upi">UPI (GPay / PhonePe)</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card (Debit/Credit)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Transaction Ref */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction / Cheque / UTR Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI-9820-A1982 or Cheque No."
                  value={payTxnRef}
                  onChange={(e) => setPayTxnRef(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Receipt Remarks / Installment Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2nd Installment payment for Term 1"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Generate & Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptForPrint && (
        <ReceiptModal
          payment={selectedReceiptForPrint}
          student={studentMap.get(selectedReceiptForPrint.studentId)}
          batch={batchMap.get(selectedReceiptForPrint.batchId)}
          onClose={() => setSelectedReceiptForPrint(null)}
        />
      )}
    </div>
  );
};
