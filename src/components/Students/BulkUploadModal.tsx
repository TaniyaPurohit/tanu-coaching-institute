import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { downloadSampleStudentCSV, parseStudentCSV } from '../../utils/csvHelpers';
import { Student } from '../../types';

interface BulkUploadModalProps {
  onClose: () => void;
  onSuccess: (count: number) => void;
}

export const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ onClose, onSuccess }) => {
  const { batches, students, bulkAddStudents } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedValid, setParsedValid] = useState<Omit<Student, 'id'>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [hasParsed, setHasParsed] = useState(false);

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const { validStudents, errors } = parseStudentCSV(content, batches, students);
        setParsedValid(validStudents);
        setParseErrors(errors);
        setHasParsed(true);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedValid.length === 0) return;
    const addedCount = bulkAddStudents(parsedValid);
    onSuccess(addedCount);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-indigo-600" />
              Bulk Import Students via CSV
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Upload spreadsheets with student contacts, batches, and fee details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Download Sample Banner */}
          <div className="flex items-center justify-between p-3.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 rounded-xl">
            <div className="text-xs">
              <p className="font-semibold text-indigo-900 dark:text-indigo-200">
                Need the standard spreadsheet format?
              </p>
              <p className="text-indigo-700 dark:text-indigo-300">
                Download our sample template with pre-filled columns and headers.
              </p>
            </div>
            <button
              onClick={downloadSampleStudentCSV}
              type="button"
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Sample CSV
            </button>
          </div>

          {/* Drag & Drop Upload Box */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {fileName ? fileName : 'Click to upload or drag & drop CSV file'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports standard UTF-8 comma-separated `.csv` files
            </p>
          </div>

          {/* Validation & Results Preview */}
          {hasParsed && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Validation Results:
                </span>
                <div className="flex items-center space-x-3">
                  <span className="flex items-center font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> {parsedValid.length} Ready to Import
                  </span>
                  {parseErrors.length > 0 && (
                    <span className="flex items-center font-medium text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> {parseErrors.length} Issue(s) Skipped
                    </span>
                  )}
                </div>
              </div>

              {/* Errors List */}
              {parseErrors.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 max-h-36 overflow-y-auto space-y-1">
                  <p className="font-bold mb-1">Rows with errors (will be ignored):</p>
                  {parseErrors.map((err, i) => (
                    <p key={i} className="flex items-start">
                      <span className="mr-1.5">•</span> {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Valid Students Preview Table */}
              {parsedValid.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">Phone</th>
                        <th className="py-2 px-3">Batch</th>
                        <th className="py-2 px-3">Guardian</th>
                        <th className="py-2 px-3 text-right">Fee (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedValid.slice(0, 10).map((s, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-1.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                            {s.name}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">
                            {s.phone}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">
                            {s.batchId}
                          </td>
                          <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                            {s.guardianName}
                          </td>
                          <td className="py-1.5 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                            ₹{s.feePlan.totalFee}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedValid.length > 10 && (
                    <div className="p-2 text-center text-slate-500 bg-slate-50 dark:bg-slate-800 text-[11px]">
                      + {parsedValid.length - 10} more rows
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <span className="text-xs text-slate-500">
            {parsedValid.length > 0 ? `${parsedValid.length} valid students will be added` : 'Upload CSV to continue'}
          </span>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedValid.length === 0}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
            >
              Import {parsedValid.length} Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
