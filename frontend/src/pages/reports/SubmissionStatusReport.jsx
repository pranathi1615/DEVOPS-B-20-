import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import {
  FileText,
  Download,
  Printer,
  Filter,
  CheckCircle,
  Clock,
  Search,
  Award
} from 'lucide-react';

const SubmissionStatusReport = () => {
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.data.success) setExams(res.data.exams);
    } catch (e) {}
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/submissions', {
        params: {
          examId: selectedExamId,
          status: selectedStatus
        }
      });
      if (res.data.success) {
        setSubmissions(res.data.submissions);
        setStats(res.data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load submission report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [selectedExamId, selectedStatus]);

  const handleExportCSV = () => {
    const url = `${api.defaults.baseURL}/reports/submissions?examId=${selectedExamId}&status=${selectedStatus}&format=csv`;
    window.open(url, '_blank');
  };

  const handleDownloadPDF = () => {
    const url = `${api.defaults.baseURL}/reports/submissions?examId=${selectedExamId}&status=${selectedStatus}&format=pdf`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = submissions.filter(s => {
    const name = s.studentName?.toLowerCase() || '';
    const id = s.studentId?.toLowerCase() || '';
    const exam = s.examTitle?.toLowerCase() || '';
    return name.includes(search.toLowerCase()) || id.includes(search.toLowerCase()) || exam.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-800">4. Submission Status Verification Report</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Validation of candidate submissions, completion timestamps, automatic timer triggers, and evaluated scores
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

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Records</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{stats.total || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed</span>
          <span className="text-xl font-bold text-emerald-600 mt-1 block">{stats.completed || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">In-Progress</span>
          <span className="text-xl font-bold text-blue-600 mt-1 block">{stats.inProgress || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Manual Submissions</span>
          <span className="text-xl font-bold text-purple-600 mt-1 block">{stats.manualSubmitted || 0}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Auto-Submitted (Timer)</span>
          <span className="text-xl font-bold text-amber-600 mt-1 block">{stats.autoSubmitted || 0}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between no-print">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate name or ID..."
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Paper:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="all">All Examinations</option>
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">State:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="all">All States</option>
              <option value="completed">Completed Submissions</option>
              <option value="in_progress">In-Progress Testing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Structured Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-900 text-white font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Examination Paper</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">Time Taken</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Evaluated Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No candidate submissions match your query.
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                      {s.studentId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {s.studentName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                      {s.examTitle}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={s.submissionStatus === 'COMPLETED' ? 'success' : 'primary'}
                        size="sm"
                      >
                        {s.submissionStatus}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {s.submissionTime}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {s.timeTaken}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {s.submissionMethod}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                      {s.score}
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

export default SubmissionStatusReport;
