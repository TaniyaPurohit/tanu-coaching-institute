/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navigation/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { StudentManagement } from './components/Students/StudentManagement';
import { BatchManagement } from './components/Batches/BatchManagement';
import { AttendanceView } from './components/Attendance/AttendanceView';
import { FeeManagement } from './components/Fees/FeeManagement';
import { TestsView } from './components/Tests/TestsView';
import { AIAssistantModal } from './components/AI/AIAssistantModal';
import { StudentProfileModal } from './components/Students/StudentProfileModal';
import { StudentFormModal } from './components/Students/StudentFormModal';
import { ToastContainer, ToastMessage } from './components/Common/Toast';
import { Student } from './types';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Award,
  Sparkles,
} from 'lucide-react';

function MainAppContent() {
  const { batches, students } = useApp();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // AI Modal State
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);

  // Student Profile Modal State (Global access)
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);

  // Fee Collection Pre-selection
  const [feeStudentTarget, setFeeStudentTarget] = useState<Student | null>(null);

  // Batch target for Attendance shortcut
  const [attendanceBatchTarget, setAttendanceBatchTarget] = useState<string | undefined>(undefined);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openAIDrafter = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setIsAIOpen(true);
  };

  const handleRecordFeeForStudent = (student: Student) => {
    setFeeStudentTarget(student);
    setCurrentTab('fees');
  };

  const handleNavigateToAttendance = (batchId: string) => {
    setAttendanceBatchTarget(batchId);
    setCurrentTab('attendance');
  };

  const batchMap = new Map(batches.map((b) => [b.id, b]));

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAIAssistant={() => {
          setAiInitialPrompt(undefined);
          setIsAIOpen(true);
        }}
        onShowToast={showToast}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentTab}
            onOpenStudentProfile={(s) => setProfileStudent(s)}
            onOpenAIAssistant={() => {
              setAiInitialPrompt(undefined);
              setIsAIOpen(true);
            }}
          />
        )}

        {currentTab === 'students' && (
          <StudentManagement
            onShowToast={showToast}
            onRecordFeeForStudent={handleRecordFeeForStudent}
          />
        )}

        {currentTab === 'batches' && (
          <BatchManagement
            onShowToast={showToast}
            onNavigateToAttendance={handleNavigateToAttendance}
          />
        )}

        {currentTab === 'attendance' && (
          <AttendanceView
            initialBatchId={attendanceBatchTarget}
            onShowToast={showToast}
            onOpenAIDrafter={openAIDrafter}
          />
        )}

        {currentTab === 'fees' && (
          <FeeManagement
            onShowToast={showToast}
            preSelectedStudent={feeStudentTarget}
            onClearPreSelected={() => setFeeStudentTarget(null)}
          />
        )}

        {currentTab === 'tests' && <TestsView onShowToast={showToast} />}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <div className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
        {[
          { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
          { id: 'fees', label: 'Fees', icon: CreditCard },
          { id: 'tests', label: 'Tests', icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Floating Ask AI Button (Mobile & Desktop quick access) */}
      <div className="no-print fixed bottom-18 md:bottom-6 right-5 z-40">
        <button
          onClick={() => {
            setAiInitialPrompt(undefined);
            setIsAIOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 transition-all group"
        >
          <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Ask AI Assistant</span>
        </button>
      </div>

      {/* AI Assistant Modal */}
      {isAIOpen && (
        <AIAssistantModal
          initialPrompt={aiInitialPrompt}
          onClose={() => {
            setIsAIOpen(false);
            setAiInitialPrompt(undefined);
          }}
        />
      )}

      {/* Student 360 Profile Modal */}
      {profileStudent && (
        <StudentProfileModal
          student={profileStudent}
          batch={batchMap.get(profileStudent.batchId)}
          onClose={() => setProfileStudent(null)}
          onEdit={(s) => {
            setProfileStudent(null);
            setStudentToEdit(s);
            setIsStudentFormOpen(true);
          }}
          onRecordPayment={(s) => {
            setProfileStudent(null);
            handleRecordFeeForStudent(s);
          }}
        />
      )}

      {/* Student Form Modal */}
      {isStudentFormOpen && (
        <StudentFormModal
          studentToEdit={studentToEdit}
          onClose={() => setIsStudentFormOpen(false)}
          onSuccess={(name, isNew) => {
            showToast(
              isNew ? `Admitted new student ${name} successfully!` : `Updated record for ${name}.`,
              'success'
            );
          }}
        />
      )}

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
