const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Exam = require('../models/Exam');
const ExamSession = require('../models/ExamSession');
const Answer = require('../models/Answer');
const Incident = require('../models/Incident');
const Attendance = require('../models/Attendance');
const AuditLog = require('../models/AuditLog');

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Exam.deleteMany({}),
      ExamSession.deleteMany({}),
      Answer.deleteMany({}),
      Incident.deleteMany({}),
      Attendance.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[Seed] Creating demo users across all 4 roles...');

    // 1. Users
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@examportal.edu',
      password: 'Admin@123',
      role: 'admin',
      department: 'Central Academic Directorate',
      isActive: true
    });

    const coordinatorUser = await User.create({
      name: 'Prof. Eleanor Vance',
      email: 'coordinator@examportal.edu',
      password: 'Coord@123',
      role: 'coordinator',
      department: 'Department of Computer Science',
      isActive: true
    });

    const invigilator1 = await User.create({
      name: 'Dr. Marcus Sterling',
      email: 'invigilator@examportal.edu',
      password: 'Invig@123',
      role: 'invigilator',
      department: 'Information Science',
      isActive: true
    });

    const invigilator2 = await User.create({
      name: 'Dr. Sarah Jenkins',
      email: 'dr.jenkins@examportal.edu',
      password: 'Invig@123',
      role: 'invigilator',
      department: 'Electronics Engineering',
      isActive: true
    });

    const student1 = await User.create({
      name: 'Alex Mercer',
      email: 'student@examportal.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU-1001',
      department: 'Computer Science and Engineering',
      isActive: true
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@examportal.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU-1002',
      department: 'Computer Science and Engineering',
      isActive: true
    });

    const student3 = await User.create({
      name: 'Rohit Sharma',
      email: 'rohit.sharma@examportal.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU-1003',
      department: 'Information Technology',
      isActive: true
    });

    const student4 = await User.create({
      name: 'Sneha Reddy',
      email: 'sneha.reddy@examportal.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU-1004',
      department: 'Computer Science and Engineering',
      isActive: true
    });

    const student5 = await User.create({
      name: 'David Miller',
      email: 'david.miller@examportal.edu',
      password: 'Student@123',
      role: 'student',
      studentId: 'STU-1005',
      department: 'Information Technology',
      isActive: true
    });

    console.log('[Seed] Created 9 users across Admin, Coordinator, Invigilator, Student roles.');

    // 2. Examinations
    console.log('[Seed] Creating examination schedules and question banks...');

    const exam1 = await Exam.create({
      title: 'Advanced Distributed Systems & Cloud Infrastructure',
      description: 'Covers CAP theorem, consensus protocols, Kubernetes orchestration, and microservice resiliency.',
      examDate: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      duration: 60,
      instructions: [
        'Each question has four options; choose the most appropriate answer.',
        'Continuous webcam verification status will be logged.',
        'Do not exit fullscreen mode or switch browser tabs; incidents are automatically recorded.',
        'The examination will automatically finalize when the timer reaches 00:00:00.'
      ],
      questions: [
        {
          questionText: 'Which theorem states that a distributed data store can at most provide two out of Consistency, Availability, and Partition Tolerance?',
          options: ['Amadahl Law', 'CAP Theorem', 'Little Theorem', 'Raft Consensus'],
          correctOptionIndex: 1,
          marks: 2
        },
        {
          questionText: 'In Kubernetes, which component is responsible for scheduling pods onto healthy worker nodes?',
          options: ['kube-proxy', 'kube-apiserver', 'kube-scheduler', 'etcd'],
          correctOptionIndex: 2,
          marks: 2
        },
        {
          questionText: 'Which consensus algorithm was specifically engineered to be more understandable than Paxos?',
          options: ['Byzantine Fault Tolerance', 'Raft', 'Two-Phase Commit', 'Gossip Protocol'],
          correctOptionIndex: 1,
          marks: 2
        },
        {
          questionText: 'In a microservice mesh, which proxy is commonly used for traffic interception and telemetry?',
          options: ['Envoy', 'Nginx', 'Apache HTTPD', 'HAProxy'],
          correctOptionIndex: 0,
          marks: 2
        },
        {
          questionText: 'What HTTP status code is standard for rate-limiting or exceeding API request quotas?',
          options: ['401 Unauthorized', '403 Forbidden', '429 Too Many Requests', '503 Service Unavailable'],
          correctOptionIndex: 2,
          marks: 2
        }
      ],
      assignedStudents: [student1._id, student2._id, student3._id, student4._id, student5._id],
      assignedInvigilators: [invigilator1._id, invigilator2._id],
      status: 'ongoing',
      createdBy: coordinatorUser._id
    });

    const exam2 = await Exam.create({
      title: 'Database Engineering & Distributed Query Optimization',
      description: 'Covers B-tree indexing, query execution plans, distributed transactions, and isolation levels.',
      examDate: new Date(Date.now() + 86400000 * 2), // 2 days later
      startTime: '10:00',
      endTime: '11:30',
      duration: 90,
      instructions: [
        'Mathematical formulas and query analysis questions are included.',
        'Answer all questions within the allocated time window.',
        'External devices or reference materials are strictly prohibited.'
      ],
      questions: [
        {
          questionText: 'Which index type is best suited for range-based queries on relational databases?',
          options: ['Hash Index', 'B+ Tree Index', 'Bitmap Index', 'GiST Index'],
          correctOptionIndex: 1,
          marks: 2
        },
        {
          questionText: 'Which SQL isolation level prevents dirty reads, non-repeatable reads, and phantom reads?',
          options: ['Read Committed', 'Repeatable Read', 'Serializable', 'Read Uncommitted'],
          correctOptionIndex: 2,
          marks: 2
        }
      ],
      assignedStudents: [student1._id, student2._id, student3._id],
      assignedInvigilators: [invigilator1._id],
      status: 'scheduled',
      createdBy: coordinatorUser._id
    });

    const exam3 = await Exam.create({
      title: 'Software Quality Assurance & DevOps Continuous Delivery',
      description: 'Covers CI/CD pipelines, automated testing pyramids, unit tests, and code coverage.',
      examDate: new Date(Date.now() - 86400000 * 3), // 3 days ago
      startTime: '14:00',
      endTime: '15:00',
      duration: 60,
      instructions: [
        'Submission confirmation must be verified upon completion.',
        'Negative marking is not applied in this test.'
      ],
      questions: [
        {
          questionText: 'Which test pyramid level forms the widest foundation with the largest number of tests?',
          options: ['End-to-End Tests', 'Integration Tests', 'Unit Tests', 'Manual Acceptance Tests'],
          correctOptionIndex: 2,
          marks: 2
        }
      ],
      assignedStudents: [student1._id, student2._id, student3._id, student4._id],
      assignedInvigilators: [invigilator2._id],
      status: 'completed',
      createdBy: coordinatorUser._id
    });

    // 3. ExamSessions & Attendance for Ongoing Exam (Exam 1)
    console.log('[Seed] Generating active exam sessions and real-time records...');

    // Student 1 (Alex Mercer): in_progress
    const session1 = await ExamSession.create({
      examId: exam1._id,
      studentId: student1._id,
      loginTime: new Date(Date.now() - 25 * 60000),
      sessionStart: new Date(Date.now() - 25 * 60000),
      status: 'in_progress',
      lastActivity: new Date(),
      webcamPermissionStatus: 'granted',
      tabSwitchCount: 1,
      fullscreenExitCount: 0,
      disconnectionCount: 0,
      networkStatus: 'online'
    });

    await Attendance.create({
      examId: exam1._id,
      studentId: student1._id,
      loginTime: session1.loginTime,
      attendanceStatus: 'present',
      durationMinutes: 25
    });

    // Student 1 answers
    await Answer.create({
      examId: exam1._id,
      studentId: student1._id,
      questionId: exam1.questions[0]._id,
      selectedAnswer: 1,
      isMarkedForReview: false
    });
    await Answer.create({
      examId: exam1._id,
      studentId: student1._id,
      questionId: exam1.questions[1]._id,
      selectedAnswer: 2,
      isMarkedForReview: true
    });

    // Student 2 (Priya Patel): completed
    const session2 = await ExamSession.create({
      examId: exam1._id,
      studentId: student2._id,
      loginTime: new Date(Date.now() - 45 * 60000),
      sessionStart: new Date(Date.now() - 45 * 60000),
      sessionEnd: new Date(Date.now() - 5 * 60000),
      logoutTime: new Date(Date.now() - 5 * 60000),
      submittedAt: new Date(Date.now() - 5 * 60000),
      status: 'completed',
      score: 8,
      isAutoSubmitted: false,
      lastActivity: new Date(Date.now() - 5 * 60000),
      webcamPermissionStatus: 'granted',
      tabSwitchCount: 0,
      fullscreenExitCount: 0,
      networkStatus: 'online'
    });

    await Attendance.create({
      examId: exam1._id,
      studentId: student2._id,
      loginTime: session2.loginTime,
      logoutTime: session2.logoutTime,
      attendanceStatus: 'present',
      durationMinutes: 40
    });

    // Student 3 (Rohit Sharma): in_progress with high incidents
    const session3 = await ExamSession.create({
      examId: exam1._id,
      studentId: student3._id,
      loginTime: new Date(Date.now() - 20 * 60000),
      sessionStart: new Date(Date.now() - 20 * 60000),
      status: 'in_progress',
      lastActivity: new Date(Date.now() - 1 * 60000),
      webcamPermissionStatus: 'granted',
      tabSwitchCount: 3,
      fullscreenExitCount: 2,
      networkStatus: 'online'
    });

    await Attendance.create({
      examId: exam1._id,
      studentId: student3._id,
      loginTime: session3.loginTime,
      attendanceStatus: 'present',
      durationMinutes: 20
    });

    // Student 4 (Sneha Reddy): late arrival
    await Attendance.create({
      examId: exam1._id,
      studentId: student4._id,
      loginTime: new Date(Date.now() - 10 * 60000),
      attendanceStatus: 'late',
      durationMinutes: 10
    });

    await ExamSession.create({
      examId: exam1._id,
      studentId: student4._id,
      loginTime: new Date(Date.now() - 10 * 60000),
      sessionStart: new Date(Date.now() - 10 * 60000),
      status: 'in_progress',
      lastActivity: new Date(),
      webcamPermissionStatus: 'granted',
      tabSwitchCount: 0,
      fullscreenExitCount: 0,
      networkStatus: 'online'
    });

    // Student 5 (David Miller): absent
    await Attendance.create({
      examId: exam1._id,
      studentId: student5._id,
      attendanceStatus: 'absent',
      durationMinutes: 0
    });

    // 4. Incidents
    console.log('[Seed] Logging incident observations...');
    await Incident.create({
      incidentId: 'INC-1001',
      examId: exam1._id,
      studentId: student3._id,
      invigilatorId: invigilator1._id,
      incidentType: 'tab_switch',
      severity: 'high',
      description: 'Candidate exited browser examination tab multiple times during question sequence 3.',
      status: 'open',
      reportedBy: 'system',
      timestamp: new Date(Date.now() - 15 * 60000),
      comments: [
        {
          author: invigilator1._id,
          comment: 'Notified candidate via warning dialog. Candidate re-focused onto the exam window.',
          createdAt: new Date(Date.now() - 12 * 60000)
        }
      ]
    });

    await Incident.create({
      incidentId: 'INC-1002',
      examId: exam1._id,
      studentId: student1._id,
      invigilatorId: invigilator1._id,
      incidentType: 'tab_switch',
      severity: 'low',
      description: 'Temporary loss of focus detected on browser window (single occurrence).',
      status: 'reviewed',
      reportedBy: 'system',
      timestamp: new Date(Date.now() - 22 * 60000)
    });

    await Incident.create({
      incidentId: 'INC-1003',
      examId: exam1._id,
      studentId: student4._id,
      invigilatorId: invigilator2._id,
      incidentType: 'late_login',
      severity: 'medium',
      description: 'Candidate connected 20 minutes after official session start time.',
      status: 'resolved',
      reportedBy: 'Dr. Sarah Jenkins',
      timestamp: new Date(Date.now() - 10 * 60000)
    });

    // 5. Audit Logs
    console.log('[Seed] Populating system audit trails...');
    await AuditLog.create({
      userId: adminUser._id,
      action: 'SYSTEM_BOOT',
      description: 'Online Examination Invigilation System service initialized.',
      ipAddress: '127.0.0.1'
    });
    await AuditLog.create({
      userId: coordinatorUser._id,
      action: 'EXAM_CREATED',
      description: 'Examination "Advanced Distributed Systems & Cloud Infrastructure" published.',
      ipAddress: '192.168.1.10'
    });
    await AuditLog.create({
      userId: student1._id,
      action: 'START_EXAM_SESSION',
      description: 'Candidate Alex Mercer commenced exam session.',
      ipAddress: '192.168.1.45'
    });

    console.log('[Seed] ============================================');
    console.log('[Seed] Database seeded successfully with full test dataset!');
    console.log('[Seed] Demo Credentials:');
    console.log('[Seed] Admin:       admin@examportal.edu       / Admin@123');
    console.log('[Seed] Coordinator: coordinator@examportal.edu / Coord@123');
    console.log('[Seed] Invigilator: invigilator@examportal.edu / Invig@123');
    console.log('[Seed] Student:     student@examportal.edu     / Student@123');
    console.log('[Seed] ============================================');

    if (require.main === module) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
