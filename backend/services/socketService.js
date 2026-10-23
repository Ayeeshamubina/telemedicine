const socketIO = require('socket.io');

let ioInstance = null;

const initSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  ioInstance = io;

  // Active rooms tracking: roomId -> Set of socketIds
  const roomUsers = new Map();

  io.on('connection', (socket) => {
    // Join personal notification channel for direct user notifications
    socket.on('register_user', (userId) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // WebRTC Room Signalling
    socket.on('join_room', ({ roomId, user }) => {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.userData = user;

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, new Set());
      }
      roomUsers.get(roomId).add(socket.id);

      // Get list of existing peers in the room
      const existingPeers = [];
      roomUsers.get(roomId).forEach((peerSocketId) => {
        if (peerSocketId !== socket.id) {
          const peerSocket = io.sockets.sockets.get(peerSocketId);
          if (peerSocket && peerSocket.userData) {
            existingPeers.push({
              socketId: peerSocketId,
              user: peerSocket.userData
            });
          }
        }
      });

      // Send the list of existing peers to the newly joined peer
      socket.emit('existing_peers', { peers: existingPeers });

      // Notify other peers in the room that a new user joined
      socket.to(roomId).emit('user_joined', {
        socketId: socket.id,
        user
      });
    });

    // WebRTC Offer forwarding (directed to specific peer socketId)
    socket.on('offer', ({ toSocketId, offer, fromUser }) => {
      io.to(toSocketId).emit('offer', {
        fromSocketId: socket.id,
        offer,
        fromUser
      });
    });

    // WebRTC Answer forwarding
    socket.on('answer', ({ toSocketId, answer }) => {
      io.to(toSocketId).emit('answer', {
        fromSocketId: socket.id,
        answer
      });
    });

    // ICE Candidate forwarding
    socket.on('ice_candidate', ({ toSocketId, candidate }) => {
      io.to(toSocketId).emit('ice_candidate', {
        fromSocketId: socket.id,
        candidate
      });
    });

    // In-call text messaging / translation side-panel
    socket.on('send_message', ({ roomId, message }) => {
      io.to(roomId).emit('receive_message', message);
    });

    // Real-time speech recognition event (broadcast to other peers in room)
    socket.on('speech_transcript', ({ roomId, transcriptData }) => {
      socket.to(roomId).emit('speech_transcript', transcriptData);
    });

    // In-call language selection synchronization across room peers
    socket.on('update_languages', ({ roomId, pLang, dLang }) => {
      socket.to(roomId).emit('language_update', { pLang, dLang });
    });

    // Interpreter request dispatch to all listening online interpreters
    socket.on('dispatch_interpreter_request', (requestData) => {
      io.emit('new_interpreter_request', requestData);
    });

    // Interpreter accepted notification
    socket.on('interpreter_accepted_call', ({ roomId, interpreter }) => {
      io.to(roomId).emit('interpreter_joined_notification', { interpreter });
    });

    // End call / Leave room
    socket.on('leave_room', () => {
      const roomId = socket.roomId;
      if (roomId && roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId);
        }
        socket.to(roomId).emit('user_left', {
          socketId: socket.id,
          user: socket.userData
        });
        socket.leave(roomId);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const roomId = socket.roomId;
      if (roomId && roomUsers.has(roomId)) {
        roomUsers.get(roomId).delete(socket.id);
        if (roomUsers.get(roomId).size === 0) {
          roomUsers.delete(roomId);
        }
        socket.to(roomId).emit('user_left', {
          socketId: socket.id,
          user: socket.userData
        });
      }
    });
  });

  return io;
};

const getIO = () => ioInstance;

module.exports = { initSocket, getIO };
