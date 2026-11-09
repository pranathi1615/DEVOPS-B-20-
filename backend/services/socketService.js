let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client joins exam room
    socket.on('join_exam', ({ examId, role, studentId, userName }) => {
      if (examId) {
        socket.join(`exam_${examId}`);
        // If invigilator or admin, also join invigilator room
        if (role === 'invigilator' || role === 'admin' || role === 'coordinator') {
          socket.join(`invigilator_${examId}`);
        }
      }
    });

    socket.on('leave_exam', ({ examId }) => {
      if (examId) {
        socket.leave(`exam_${examId}`);
        socket.leave(`invigilator_${examId}`);
      }
    });

    // Real-time ping/heartbeat from student
    socket.on('student_heartbeat', (data) => {
      if (data && data.examId) {
        io.to(`invigilator_${data.examId}`).emit('student_activity_ping', {
          ...data,
          timestamp: new Date()
        });
      }
    });

    socket.on('disconnect', () => {
      // Disconnection handled if needed
    });
  });

  return ioInstance;
};

const getIO = () => {
  return ioInstance;
};

const emitToExam = (examId, event, data) => {
  if (ioInstance && examId) {
    ioInstance.to(`exam_${examId}`).emit(event, data);
  }
};

const emitToInvigilators = (examId, event, data) => {
  if (ioInstance && examId) {
    ioInstance.to(`invigilator_${examId}`).emit(event, data);
  }
};

const broadcastAll = (event, data) => {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitToExam,
  emitToInvigilators,
  broadcastAll
};
