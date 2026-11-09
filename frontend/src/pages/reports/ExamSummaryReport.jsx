import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import {
  FileText,
  Download,
  Printer,
  Filter,
  BarChart2,
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

const ExamSummaryReport = () => {
  const [data, setData] = useState({ summary: [], stats: {} });
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.data.success) setExams(res.data.exams);
    } catch (e) {}
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/exam-summary', {
        params: { examId: selectedExamId }
      });
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load exam summary report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [selectedExamId]);

  const handleExportCSV = () => {
    const token = localStorage.getItem('exam_auth_token');
    const url = `${api.defaults.baseURL}/reports/exam-summary?examId=${selectedExamId}&format=csv`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = () => {
    const url = `${api.defaults.baseURL}/reports/exam-summary?examId=${selectedExamId}&format=pdf`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = data.summary || [];
  const stats = data.stats || {};

  // Chart data
  const chartData = summary.map((s) => ({
    name: s.examTitle.length > 20 ? `${s.examTitle.slice(0, 18)}...` : s.examTitle,
    Registered: s.totalRegistered,
    Present: s.presentStudents,
    Completed: s.completedSubmissions,
    Incidents: s.totalIncidents
  }));

  return (
    <div className="space-y-6">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800">1. Examination Session Summary Report</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional verification of candidate enrollment, attendance, completion rates, and logged incidents
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Official PDF</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between no-print">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Filter by Examination:</span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 text-slate-700 outline-none"
          >
            <option value="all">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex._id} value={ex._id}>{ex.title}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400">
          Showing {summary.length} Examination Paper Summaries
        </span>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Papers</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{stats.totalExams || summary.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Candidates</span>
          <span className="text-xl font-bold text-blue-600 mt-1 block">{stats.totalRegistered || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Present</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">{stats.totalPresent || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Papers</span>
          <span className="text-xl font-bold text-purple-600 mt-1 block">{stats.totalSubmissions || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Logged Incidents</span>
          <span className="text-xl font-bold text-rose-600 mt-1 block">{stats.totalIncidents || 0}</span>
        </div>
      </div>

      {/* Visual Analytics Comparison */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs no-print">
          <h3 className="text-sm font-bold text-slate-800 mb-4">
            Candidate Turnout & Completion Metrics
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="Registered" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Present" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Completed" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Incidents" fill="#F43F5E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Formal Structured Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900 text-white font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Examination Title</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-center">Registered</th>
                <th className="py-3 px-4 text-center">Present</th>
                <th className="py-3 px-4 text-center">Absent</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Incidents</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : summary.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No examination records found.
                  </td>
                </tr>
              ) : (
                summary.map((row) => (
                  <tr key={row.examId} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {row.examTitle}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {row.examDate} ({row.startTime} - {row.endTime})
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-700">
                      {row.totalRegistered}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-emerald-600">
                      {row.presentStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-slate-400">
                      {row.absentStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-purple-600">
                      {row.completedSubmissions}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold font-mono text-rose-600">
                      {row.totalIncidents}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={row.status === 'ongoing' ? 'success' : row.status === 'completed' ? 'default' : 'primary'} size="sm">
                        {row.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamSummaryReport;
