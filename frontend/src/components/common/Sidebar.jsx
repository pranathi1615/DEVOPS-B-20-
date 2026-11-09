import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  Video,
  AlertTriangle,
  FileText,
  Activity,
  UserCheck,
  Send,
  ClipboardList,
  Settings,
  LogOut,
  X,
  GraduationCap
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Nav definitions per role
  const getNavLinks = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { label: 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'User Directory', path: '/admin/users', icon: Users },
          { label: 'Exam Management', path: '/coordinator/exams', icon: BookOpen },
          { label: 'Exam Scheduling', path: '/coordinator/scheduling', icon: Calendar },
          { label: 'Live Invigilation', path: '/invigilator/live', icon: Video },
          { label: 'Incident Records', path: '/incidents', icon: AlertTriangle },
          { label: 'Reports Hub', path: '/reports/exam-summary', icon: FileText, children: [
            { label: 'Exam Session Summary', path: '/reports/exam-summary' },
            { label: 'Attendance & Login', path: '/reports/attendance' },
            { label: 'Incident Register', path: '/reports/incidents' },
            { label: 'Submission Status', path: '/reports/submissions' }
          ]},
          { label: 'Audit Activity Logs', path: '/admin/audit-logs', icon: Activity },
          { label: 'Profile & Settings', path: '/profile', icon: Settings }
        ];

      case 'coordinator':
        return [
          { label: 'Coordinator Dashboard', path: '/coordinator/dashboard', icon: LayoutDashboard },
          { label: 'Exam Management', path: '/coordinator/exams', icon: BookOpen },
          { label: 'Exam Scheduling', path: '/coordinator/scheduling', icon: Calendar },
          { label: 'Live Invigilation', path: '/invigilator/live', icon: Video },
          { label: 'Incident Records', path: '/incidents', icon: AlertTriangle },
          { label: 'Session Reports', path: '/reports/exam-summary', icon: FileText, children: [
            { label: 'Exam Session Summary', path: '/reports/exam-summary' },
            { label: 'Attendance & Login', path: '/reports/attendance' },
            { label: 'Incident Register', path: '/reports/incidents' },
            { label: 'Submission Status', path: '/reports/submissions' }
          ]},
          { label: 'Profile & Settings', path: '/profile', icon: Settings }
        ];

      case 'invigilator':
        return [
          { label: 'Invigilator Dashboard', path: '/invigilator/dashboard', icon: LayoutDashboard },
          { label: 'Live Invigilation', path: '/invigilator/live', icon: Video },
          { label: 'Incident Management', path: '/incidents', icon: AlertTriangle },
          { label: 'Reports Hub', path: '/reports/exam-summary', icon: FileText, children: [
            { label: 'Exam Session Summary', path: '/reports/exam-summary' },
            { label: 'Attendance & Login', path: '/reports/attendance' },
            { label: 'Incident Register', path: '/reports/incidents' },
            { label: 'Submission Status', path: '/reports/submissions' }
          ]},
          { label: 'Profile & Settings', path: '/profile', icon: Settings }
        ];

      case 'student':
        return [
          { label: 'Student Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
          { label: 'My Examinations', path: '/student/dashboard', icon: BookOpen },
          { label: 'Profile & Settings', path: '/profile', icon: Settings }
        ];

      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-navy-950 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-navy-800 bg-navy-900">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight block">
                ExamWatch
              </span>
              <span className="text-[10px] text-blue-300 uppercase tracking-widest block font-medium">
                Proctor Suite
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            if (item.children) {
              return (
                <div key={item.label} className="pt-2">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{item.label}</span>
                  </div>
                  <div className="mt-1 space-y-0.5 pl-3 border-l border-navy-800 ml-4">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={onClose}
                        className={({ isActive }) =>
                          `block px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-navy-900'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-navy-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-navy-800 bg-navy-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-navy-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
