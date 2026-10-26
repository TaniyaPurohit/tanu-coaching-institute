import React from 'react';
import { X, Printer, CheckCircle, GraduationCap } from 'lucide-react';
import { FeePayment, Student, Batch } from '../../types';
import { formatCurrency, formatDate, numberToWords } from '../../utils/formatters';

interface ReceiptModalProps {
  payment: FeePayment;
  student?: Student;
  batch?: Batch;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  payment,
  student,
  batch,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const totalAgreed = student ? Math.max(0, (student.feePlan?.totalFee || 0) - (student.feePlan?.discount || 0)) : 0;
  // Calculate remaining balance after this payment
  // (assuming payment was recorded)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Top Action Bar (hidden in print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Payment Recorded
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Receipt No: {payment.receiptNumber}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-1.5 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-8 bg-white text-slate-900">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-5">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <GraduationCap className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  EduTrack Learning Academy
                </h1>
                <p className="text-xs text-slate-600">
                  Premier Coaching for IIT-JEE, NEET & CBSE Board Excellence
                </p>
                <p className="text-[11px] text-slate-500">
                  Reg No: MH-2021-EDU-0918 | GSTIN: 27AABCT8910Q1Z5
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs uppercase tracking-wider rounded">
                Official Fee Receipt
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Date: <strong className="text-slate-800">{formatDate(payment.paymentDate)}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Receipt #: <strong className="text-slate-800">{payment.receiptNumber}</strong>
              </p>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="grid grid-cols-2 gap-4 my-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Student Details
              </p>
              <p className="font-semibold text-slate-900 mt-0.5">{student?.name || 'Student'}</p>
              <p className="text-xs text-slate-600">ID: {student?.id || payment.studentId}</p>
              <p className="text-xs text-slate-600">Phone: {student?.phone || '—'}</p>
              <p className="text-xs text-slate-600">Guardian: {student?.guardianName || '—'}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Course & Batch Details
              </p>
              <p className="font-semibold text-slate-900 mt-0.5">{batch?.name || 'Class Batch'}</p>
              <p className="text-xs text-slate-600">Subject: {batch?.subject || 'Comprehensive'}</p>
              <p className="text-xs text-slate-600">Teacher: {batch?.teacher || 'Senior Faculty'}</p>
              <p className="text-xs text-slate-600">Payment Mode: <strong className="uppercase">{payment.paymentMethod}</strong></p>
            </div>
          </div>

          {/* Particulars Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden my-4">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Particulars / Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500">1</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800">
                      Coaching & Academic Tuition Fees
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.remarks || 'Standard installment payment'}
                      {payment.transactionRef && ` (Ref: ${payment.transactionRef})`}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900">
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Amount In Words & Totals */}
          <div className="grid grid-cols-12 gap-4 pt-2">
            <div className="col-span-7">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-[11px] font-semibold text-slate-500 uppercase">Amount in Words:</p>
                <p className="text-xs font-medium text-indigo-900 italic mt-0.5">
                  {numberToWords(payment.amount)}
                </p>
              </div>

              <div className="mt-4 text-[11px] text-slate-500 space-y-0.5">
                <p>• Fees once paid are non-refundable and non-transferable.</p>
                <p>• This is a computer-generated receipt and requires no physical stamp.</p>
                <p>• Helpline: +91 98200 12345 | Email: accounts@edutrack.edu</p>
              </div>
            </div>

            <div className="col-span-5 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-sm">
              <div className="flex justify-between py-1 text-slate-600 text-xs">
                <span>Total Agreed Course Fee:</span>
                <span className="font-medium">{formatCurrency(totalAgreed)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-200 font-bold text-slate-900 text-base">
                <span>Amount Paid Now:</span>
                <span className="text-indigo-600">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-dashed border-slate-300 text-xs text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-semibold uppercase">{payment.paymentMethod}</span>
              </div>
              {payment.transactionRef && (
                <div className="flex justify-between py-0.5 text-[11px] text-slate-500">
                  <span>Txn Ref:</span>
                  <span className="font-mono">{payment.transactionRef}</span>
                </div>
              )}
            </div>
          </div>

          {/* Signatures */}
          <div className="flex justify-between items-end mt-12 pt-4 border-t border-slate-200 text-xs">
            <div className="text-slate-500">
              <p>Collected By: <strong className="text-slate-700">{payment.collectedBy || 'Accounts Officer'}</strong></p>
              <p className="text-[11px]">System Timestamp: {new Date().toLocaleTimeString()}</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-slate-400 mb-1"></div>
              <p className="font-semibold text-slate-700">Authorized Signatory</p>
              <p className="text-[10px] text-slate-500">EduTrack Learning Academy</p>
            </div>
          </div>
        </div>

        {/* Footer (hidden in print) */}
        <div className="no-print flex justify-end px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
