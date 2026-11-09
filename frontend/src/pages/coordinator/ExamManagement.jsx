import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import Badge from '../../components/common/Badge';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Users,
  UserCheck,
  Calendar,
  Clock,
  Search,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isAssignStudentsOpen, setIsAssignStudentsOpen] = useState(false);
  const [isAssignInvigilatorsOpen, setIsAssignInvigilatorsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  // Form state
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    examDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    duration: 60,
    status: 'scheduled',
    instructions: [
      'Read all questions carefully before answering.',
      'Do not switch browser tabs or exit fullscreen mode.',
      'Ensure a stable internet connection throughout the session.',
      'The examination will automatically submit when the countdown reaches zero.'
    ],
    questions: [
      {
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 2
      }
    ]
  });

  // Assign selection states
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [selectedInvigilatorIds, setSelectedInvigilatorIds] = useState([]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get('/exams', {
        params: { status: statusFilter, search }
      });
      if (res.data.success) {
        setExams(res.data.exams);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users?limit=100');
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchUsers();
  }, [statusFilter]);

  const openCreateExam = () => {
    setSelectedExam(null);
    setExamForm({
      title: '',
      description: '',
      examDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '11:00',
      duration: 60,
      status: 'scheduled',
      instructions: [
        'Read all questions carefully before answering.',
        'Do not switch browser tabs or exit fullscreen mode.',
        'Ensure a stable internet connection throughout the session.',
        'The examination will automatically submit when the countdown reaches zero.'
      ],
      questions: [
        {
          questionText: 'What is the primary role of a distributed consensus algorithm?',
          options: ['Ensure data consistency', 'Encrypt client traffic', 'Compress storage', 'Balance CPU load'],
          correctOptionIndex: 0,
          marks: 2
        }
      ]
    });
    setIsExamModalOpen(true);
  };

  const openEditExam = (exam) => {
    setSelectedExam(exam);
    setExamForm({
      title: exam.title,
      description: exam.description || '',
      examDate: exam.examDate ? new Date(exam.examDate).toISOString().split('T')[0] : '',
      startTime: exam.startTime,
      endTime: exam.endTime,
      duration: exam.duration,
      status: exam.status,
      instructions: exam.instructions || [],
      questions: exam.questions?.length > 0 ? exam.questions : [
        { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 1 }
      ]
    });
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    try {
      if (selectedExam) {
        await api.put(`/exams/${selectedExam._id}`, examForm);
      } else {
        await api.post('/exams', examForm);
      }
      setIsExamModalOpen(false);
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save examination');
    }
  };

  const handleDeleteExam = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete examination "${title}"?`)) {
      try {
        await api.delete(`/exams/${id}`);
        fetchExams();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete exam');
      }
    }
  };

  // Question manipulation
  const addQuestion = () => {
    setExamForm({
      ...examForm,
      questions: [
        ...examForm.questions,
        { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0, marks: 2 }
      ]
    });
  };

  const removeQuestion = (index) => {
    const updated = examForm.questions.filter((_, i) => i !== index);
    setExamForm({ ...examForm, questions: updated });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...examForm.questions];
    updated[index][field] = value;
    setExamForm({ ...examForm, questions: updated });
  };

  const updateOption = (qIndex, optIndex, value) => {
    const updated = [...examForm.questions];
    updated[qIndex].options[optIndex] = value;
    setExamForm({ ...examForm, questions: updated });
  };

  // Assign modals
  const openAssignStudentsModal = (exam) => {
    setSelectedExam(exam);
    setSelectedStudentIds(exam.assignedStudents?.map(s => s._id || s) || []);
    setIsAssignStudentsOpen(true);
  };

  const openAssignInvigilatorsModal = (exam) => {
    setSelectedExam(exam);
    setSelectedInvigilatorIds(exam.assignedInvigilators?.map(i => i._id || i) || []);
    setIsAssignInvigilatorsOpen(true);
  };

  const handleSaveAssignedStudents = async () => {
    try {
      await api.post(`/exams/${selectedExam._id}/assign-students`, {
        studentIds: selectedStudentIds
      });
      setIsAssignStudentsOpen(false);
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign students');
    }
  };

  const handleSaveAssignedInvigilators = async () => {
    try {
      await api.post(`/exams/${selectedExam._id}/assign-invigilators`, {
        invigilatorIds: selectedInvigilatorIds
      });
      setIsAssignInvigilatorsOpen(false);
      fetchExams();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign invigilators');
    }
  };

  const allStudents = users.filter(u => u.role === 'student');
  const allInvigilators = users.filter(u => u.role === 'invigilator');

  const statusVariant = {
    scheduled: 'primary',
    ongoing: 'success',
    completed: 'default',
    cancelled: 'danger'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Examination Curriculum & Papers</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure examination schedules, question banks, candidate rosters, and proctor assignments
          </p>
        </div>
        <button
          onClick={openCreateExam}
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Examination</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchExams()}
            placeholder="Search examinations..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-medium text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">All States</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            No examinations found. Click "Create Examination" to publish your first paper.
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{exam.title}</h3>
                  <Badge variant={statusVariant[exam.status] || 'default'} size="sm">
                    {exam.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {exam.description || 'No description provided.'}
                </p>

                <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(exam.examDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.startTime} - {exam.endTime} ({exam.duration} mins)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>{exam.questions?.length || 0} Questions • {exam.totalMarks || 0} Total Marks</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    <strong className="text-slate-700">{exam.assignedStudents?.length || 0}</strong> Candidates
                  </span>
                  <span className="text-slate-500">
                    <strong className="text-slate-700">{exam.assignedInvigilators?.length || 0}</strong> Invigilators
                  </span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openAssignStudentsModal(exam)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Assign Students"
                  >
                    <Users className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openAssignInvigilatorsModal(exam)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    title="Assign Invigilators"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditExam(exam)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Edit Exam"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam._id, exam.title)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Examination Creator / Editor Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title={selectedExam ? "Edit Examination Details" : "Create New Examination"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Examination Title</label>
            <input
              type="text"
              required
              value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              placeholder="e.g. Distributed Computing and Network Systems"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description / Syllabus Scope</label>
            <textarea
              rows="2"
              value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              placeholder="Overview of examination topics..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={examForm.examDate}
                onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={examForm.startTime}
                onChange={(e) => setExamForm({ ...examForm, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={examForm.endTime}
                onChange={(e) => setExamForm({ ...examForm, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Duration (Mins)</label>
              <input
                type="number"
                required
                min="5"
                value={examForm.duration}
                onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lifecycle Status</label>
            <select
              value={examForm.status}
              onChange={(e) => setExamForm({ ...examForm, status: e.target.value })}
              className="w-full sm:w-48 px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 bg-white"
            >
              <option value="scheduled">Scheduled</option>
              <option value="ongoing">Ongoing (Active)</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Questions Section */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-800 text-sm">
                Question Bank ({examForm.questions.length} Items)
              </h4>
              <button
                type="button"
                onClick={addQuestion}
                className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold"
              >
                + Add Question
              </button>
            </div>

            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
              {examForm.questions.map((q, qIndex) => (
                <div key={qIndex} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Question {qIndex + 1}</span>
                    {examForm.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                    placeholder="Enter question statement..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className="flex items-center space-x-1.5">
                        <input
                          type="radio"
                          name={`correct_${qIndex}`}
                          checked={q.correctOptionIndex === optIndex}
                          onChange={() => updateQuestion(qIndex, 'correctOptionIndex', optIndex)}
                          className="text-blue-600"
                          title="Mark as correct option"
                        />
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => updateOption(qIndex, optIndex, e.target.value)}
                          placeholder={`Option ${optIndex + 1}`}
                          className="w-full px-2.5 py-1 border border-slate-200 rounded-lg bg-white outline-none text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsExamModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Save Examination
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Students Modal */}
      <Modal
        isOpen={isAssignStudentsOpen}
        onClose={() => setIsAssignStudentsOpen(false)}
        title={`Assign Candidates to ${selectedExam?.title || 'Exam'}`}
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-500">Select candidates enrolled for this examination session:</p>
          <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
            {allStudents.map(student => {
              const isChecked = selectedStudentIds.includes(student._id);
              return (
                <label
                  key={student._id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds([...selectedStudentIds, student._id]);
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter(id => id !== student._id));
                        }
                      }}
                      className="rounded text-blue-600"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">{student.name}</p>
                      <p className="text-[10px] text-slate-400">{student.email} • {student.studentId || 'No ID'}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <button
              onClick={() => setIsAssignStudentsOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignedStudents}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
            >
              Confirm ({selectedStudentIds.length} Selected)
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Invigilators Modal */}
      <Modal
        isOpen={isAssignInvigilatorsOpen}
        onClose={() => setIsAssignInvigilatorsOpen(false)}
        title={`Assign Invigilators to ${selectedExam?.title || 'Exam'}`}
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-500">Select faculty members to monitor this session:</p>
          <div className="max-h-64 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2">
            {allInvigilators.map(invig => {
              const isChecked = selectedInvigilatorIds.includes(invig._id);
              return (
                <label
                  key={invig._id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isChecked ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvigilatorIds([...selectedInvigilatorIds, invig._id]);
                        } else {
                          setSelectedInvigilatorIds(selectedInvigilatorIds.filter(id => id !== invig._id));
                        }
                      }}
                      className="rounded text-indigo-600"
                    />
                    <div>
                      <p className="font-semibold text-slate-800">{invig.name}</p>
                      <p className="text-[10px] text-slate-400">{invig.email} • {invig.department}</p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <button
              onClick={() => setIsAssignInvigilatorsOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAssignedInvigilators}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
            >
              Confirm ({selectedInvigilatorIds.length} Selected)
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamManagement;
