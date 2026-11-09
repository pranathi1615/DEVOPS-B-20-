import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import Badge from '../../components/common/Badge';
import {
  BookOpen,
  Calendar,
  Users,
  UserCheck,
  Plus,
  ArrowRight,
  FileText,
  Clock
} from 'lucide-react';

const CoordinatorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/stats/overview');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load coordinator dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const upcomingExams = data?.upcomingExams || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-purple-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-purple-300 font-semibold">
            Academic Operations Directorate
          </span>
          <h1 className="text-2xl font-bold mt-1">Examination Coordinator Command</h1>
          <p className="text-xs text-slate-300 mt-1">
            Publish question papers, manage master examination timetables, and monitor proctor allocations.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/coordinator/exams"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Examination</span>
          </Link>
          <Link
            to="/coordinator/scheduling"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>Master Timetable</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Examinations"
          value={stats.totalExams || 0}
          icon={BookOpen}
          color="purple"
          subtitle="All academic papers"
        />
        <StatCard
          title="Scheduled Timetables"
          value={stats.scheduledExams || 0}
          icon={Calendar}
          color="blue"
          subtitle="Upcoming slots"
        />
        <StatCard
          title="Enrolled Candidates"
          value={stats.totalStudents || 0}
          icon={Users}
          color="indigo"
          subtitle="Registered examinees"
        />
        <StatCard
          title="Faculty Invigilators"
          value={stats.totalInvigilators || 0}
          icon={UserCheck}
          color="navy"
          subtitle="Assigned proctors"
        />
      </div>

      {/* Grid: Upcoming Sessions & Reports Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Scheduled Examination Timetable</h3>
            <Link to="/coordinator/exams" className="text-xs text-blue-600 font-semibold flex items-center">
              <span>Manage Papers</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No examination timetables found.</p>
            ) : (
              upcomingExams.map((exam) => (
                <div key={exam._id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-slate-800">{exam.title}</h4>
                    <div className="mt-1 text-[11px] text-slate-500 flex items-center space-x-2">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{exam.startTime} - {exam.endTime} ({exam.duration}m)</span>
                      <span>•</span>
                      <span>Date: {new Date(exam.examDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant={exam.status === 'ongoing' ? 'success' : 'primary'} size="sm">
                    {exam.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reports Hub Shortcuts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Institutional Report Hub</h3>
          <p className="text-xs text-slate-400">
            Generate audited CSV and PDF outputs for academic accreditation:
          </p>

          <div className="space-y-2 pt-2">
            <Link
              to="/reports/exam-summary"
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 flex items-center justify-between transition-colors text-xs"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-700">Exam Session Summary</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/reports/attendance"
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 flex items-center justify-between transition-colors text-xs"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">Attendance & Login Report</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/reports/incidents"
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 flex items-center justify-between transition-colors text-xs"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <span className="font-semibold text-slate-700">Official Incident Register</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <Link
              to="/reports/submissions"
              className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/40 flex items-center justify-between transition-colors text-xs"
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-slate-700">Submission Status Verification</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;
