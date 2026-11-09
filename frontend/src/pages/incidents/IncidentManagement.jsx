import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import {
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertTriangle,
  User
} from 'lucide-react';

const IncidentManagement = () => {
  const [incidents, setIncidents] = useState([]);
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [examFilter, setExamFilter] = useState('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    examId: '',
    studentId: '',
    incidentType: 'tab_switch',
    severity: 'medium',
    description: '',
    status: 'open'
  });

  const [newComment, setNewComment] = useState('');

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incidents', {
        params: {
          search,
          severity: severityFilter,
          status: statusFilter,
          examId: examFilter
        }
      });
      if (res.data.success) {
        setIncidents(res.data.incidents);
      }
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [exRes, uRes] = await Promise.all([
        api.get('/exams'),
        api.get('/users?role=student&limit=100')
      ]);
      if (exRes.data.success) setExams(exRes.data.exams);
      if (uRes.data.success) setUsers(uRes.data.users);
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter, examFilter]);

  const openCreateModal = () => {
    setFormData({
      examId: exams[0]?._id || '',
      studentId: users[0]?._id || '',
      incidentType: 'suspicious_activity',
      severity: 'medium',
      description: '',
      status: 'open'
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateIncident = async (e) => {
    e.preventDefault();
    try {
      await api.post('/incidents', formData);
      setIsCreateModalOpen(false);
      fetchIncidents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create incident');
    }
  };

  const openDetailModal = (incident) => {
    setSelectedIncident(incident);
    setNewComment('');
    setIsDetailModalOpen(true);
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      const res = await api.put(`/incidents/${selectedIncident._id}`, {
        status: newStatus
      });
      if (res.data.success) {
        setSelectedIncident(res.data.incident);
        fetchIncidents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await api.put(`/incidents/${selectedIncident._id}`, {
        comment: newComment.trim()
      });
      if (res.data.success) {
        setSelectedIncident(res.data.incident);
        setNewComment('');
        fetchIncidents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const severityBadgeVariants = {
    low: 'primary',
    medium: 'warning',
    high: 'danger'
  };

  const statusBadgeVariants = {
    open: 'danger',
    reviewed: 'warning',
    resolved: 'success'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Incident Management & Proctoring Register</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured observations, security alerts, and candidate compliance records
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Incident</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchIncidents()}
            placeholder="Search by student, ID, or description..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Severity */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-medium text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="all">All Severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-medium text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-700 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Examination</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Reported By</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No proctoring incidents match your filter.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {inc.incidentId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-slate-800">{inc.studentId?.name || 'Candidate'}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{inc.studentId?.studentId || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                      {inc.examId?.title || 'Unknown Exam'}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-semibold text-[10px] text-slate-600">
                      {inc.incidentType.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={severityBadgeVariants[inc.severity] || 'default'} size="sm">
                        {inc.severity}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 capitalize">
                      {inc.reportedBy}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(inc.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={statusBadgeVariants[inc.status] || 'default'} size="sm">
                        {inc.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openDetailModal(inc)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Incident Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Record Proctoring Incident Observation"
      >
        <form onSubmit={handleCreateIncident} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Examination</label>
            <select
              value={formData.examId}
              onChange={(e) => setFormData({ ...formData, examId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            >
              {exams.map((ex) => (
                <option key={ex._id} value={ex._id}>{ex.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Candidate</label>
            <select
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            >
              {users.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.studentId || st.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.incidentType}
                onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              >
                <option value="tab_switch">Tab Switching</option>
                <option value="fullscreen_exit">Fullscreen Exit</option>
                <option value="multiple_disconnections">Multiple Disconnections</option>
                <option value="suspicious_activity">Suspicious Activity</option>
                <option value="late_login">Late Login</option>
                <option value="unauthorized_device">Unauthorized Device</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Observation Note</label>
            <textarea
              required
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="State clear objective observation details..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 shadow-xs"
            >
              Save Incident
            </button>
          </div>
        </form>
      </Modal>

      {/* Incident Details & Comments Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Incident Case File: ${selectedIncident?.incidentId || ''}`}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-800">
                {selectedIncident?.studentId?.name} ({selectedIncident?.studentId?.studentId || 'N/A'})
              </span>
              <div className="flex items-center space-x-2">
                <Badge variant={severityBadgeVariants[selectedIncident?.severity] || 'default'} size="sm">
                  {selectedIncident?.severity}
                </Badge>
                <Badge variant={statusBadgeVariants[selectedIncident?.status] || 'default'} size="sm">
                  {selectedIncident?.status}
                </Badge>
              </div>
            </div>
            <p className="text-slate-500">
              Exam: <strong className="text-slate-700">{selectedIncident?.examId?.title}</strong>
            </p>
            <p className="text-slate-700 font-medium bg-white p-3 rounded-lg border border-slate-200/80">
              {selectedIncident?.description}
            </p>
            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Reported by: {selectedIncident?.reportedBy}</span>
              <span>Logged at: {new Date(selectedIncident?.timestamp || Date.now()).toLocaleString()}</span>
            </div>
          </div>

          {/* Change Status Buttons */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700">Update Case Status:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleUpdateStatus('open')}
                className={`px-3 py-1 rounded-lg font-semibold border ${
                  selectedIncident?.status === 'open' ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700'
                }`}
              >
                Open
              </button>
              <button
                onClick={() => handleUpdateStatus('reviewed')}
                className={`px-3 py-1 rounded-lg font-semibold border ${
                  selectedIncident?.status === 'reviewed' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-700'
                }`}
              >
                Reviewed
              </button>
              <button
                onClick={() => handleUpdateStatus('resolved')}
                className={`px-3 py-1 rounded-lg font-semibold border ${
                  selectedIncident?.status === 'resolved' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700'
                }`}
              >
                Resolved
              </button>
            </div>
          </div>

          {/* Invigilator Comments Log */}
          <div>
            <h4 className="font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span>Invigilator Observations & Follow-ups</span>
            </h4>

            <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
              {selectedIncident?.comments?.length === 0 ? (
                <p className="text-slate-400 py-2">No comments recorded yet.</p>
              ) : (
                selectedIncident?.comments?.map((c, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-bold text-slate-700">{c.author?.name || 'Invigilator'}</span>
                      <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-700">{c.comment}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add invigilator observation comment..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                Add Note
              </button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default IncidentManagement;
