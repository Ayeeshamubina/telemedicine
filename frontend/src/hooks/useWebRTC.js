import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// Generates an interactive virtual medical video stream when physical camera hardware is absent or in-use
const createVirtualVideoTrack = (userName = 'User', userRole = 'Patient') => {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let frame = 0;
  let animationId;

  const draw = () => {
    frame++;
    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#0c4a6e');
    grad.addColorStop(0.5, '#075985');
    grad.addColorStop(1, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const avatarRadius = 65;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 25;

    // Glowing pulse
    const pulse = Math.sin(frame * 0.05) * 6;
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius + 10 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner Circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = (userRole || '').toLowerCase() === 'doctor' ? '#0f766e' : '#0284c7';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // User initial
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(((userName || 'U').charAt(0) || 'U').toUpperCase(), centerX, centerY);

    // Name Tag
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(userName || 'User', centerX, centerY + 95);

    // Role Tag Badge
    ctx.fillStyle = '#7dd3fc';
    ctx.font = '600 14px sans-serif';
    ctx.fillText(`${(userRole || 'User').toUpperCase()} • LIVE STREAM`, centerX, centerY + 120);

    // Audio frequency visualizer
    const barCount = 12;
    const barWidth = 6;
    const totalW = barCount * 12;
    const startX = centerX - totalW / 2;
    for (let i = 0; i < barCount; i++) {
      const h = Math.abs(Math.sin(frame * 0.08 + i)) * 18 + 4;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(startX + i * 12, centerY + 140 - h / 2, barWidth, h);
    }

    animationId = requestAnimationFrame(draw);
  };

  draw();

  const videoStream = canvas.captureStream(30);
  const videoTrack = videoStream.getVideoTracks()[0];
  videoTrack.cleanup = () => cancelAnimationFrame(animationId);
  return videoTrack;
};

// Generates fallback audio track when physical microphone hardware is absent
const createVirtualAudioTrack = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    gain.gain.value = 0.00001; // virtually silent ambient carrier
    osc.connect(gain);
    gain.connect(dest);
    osc.start();
    return dest.stream.getAudioTracks()[0];
  } catch (e) {
    console.warn('AudioContext fallback unavailable:', e);
    return null;
  }
};

export const useWebRTC = (roomId, currentUser, socket) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { [socketId]: { stream, user } }
  const [permissionError, setPermissionError] = useState(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [connectionState, setConnectionState] = useState('initializing');
  const [isVirtualStream, setIsVirtualStream] = useState(false);
  const [hasRealMic, setHasRealMic] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);

  // References
  const localStreamRef = useRef(null);
  const peersRef = useRef({}); // { [socketId]: RTCPeerConnection }
  const userPeersRef = useRef({}); // { [socketId]: userData }
  const iceCandidateQueueRef = useRef({}); // { [socketId]: [candidates] }
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  // Expose explicit function to enable/capture real microphone
  const enableMicrophone = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('mediaDevices.getUserMedia not available');
        return false;
      }
      let micStream = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      } catch (err1) {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const newAudioTrack = micStream?.getAudioTracks()[0];

      if (newAudioTrack) {
        newAudioTrack.enabled = true;

        if (localStreamRef.current) {
          const oldAudioTrack = localStreamRef.current.getAudioTracks()[0];
          if (oldAudioTrack) {
            localStreamRef.current.removeTrack(oldAudioTrack);
            try { oldAudioTrack.stop(); } catch (e) {}
          }
          localStreamRef.current.addTrack(newAudioTrack);
        } else {
          localStreamRef.current = new MediaStream([newAudioTrack]);
        }

        // Replace or add track across all active RTCPeerConnections
        Object.values(peersRef.current).forEach((pc) => {
          const audioSender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio');
          if (audioSender) {
            audioSender.replaceTrack(newAudioTrack);
          } else {
            pc.addTrack(newAudioTrack, localStreamRef.current);
          }
        });

        setIsAudioMuted(false);
        setHasRealMic(true);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        return true;
      }
    } catch (err) {
      console.warn('Could not enable real microphone:', err.message);
      return false;
    }
    return false;
  }, []);

  // Expose explicit function to enable/capture real camera
  const enableCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('mediaDevices.getUserMedia not available');
        return false;
      }
      let camStream = null;
      try {
        camStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
      } catch (err1) {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      const newVideoTrack = camStream?.getVideoTracks()[0];

      if (newVideoTrack) {
        if (localStreamRef.current) {
          const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
          if (oldVideoTrack) {
            localStreamRef.current.removeTrack(oldVideoTrack);
            try {
              if (oldVideoTrack.cleanup) oldVideoTrack.cleanup();
              oldVideoTrack.stop();
            } catch (e) {}
          }
          localStreamRef.current.addTrack(newVideoTrack);
        } else {
          localStreamRef.current = new MediaStream([newVideoTrack]);
        }

        // Replace or add track across all active RTCPeerConnections
        Object.values(peersRef.current).forEach((pc) => {
          const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack);
          } else {
            pc.addTrack(newVideoTrack, localStreamRef.current);
          }
        });

        setIsVirtualStream(false);
        setCameraBusy(false);
        setIsVideoMuted(false);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        return true;
      }
    } catch (err) {
      console.warn('Could not enable real camera:', err.name, err.message);
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraBusy(true);
      }
      return false;
    }
    return false;
  }, []);

  // Create Virtual Stream with Real Mic if available, or synthetic audio if not
  const startVirtualMedia = useCallback(async () => {
    try {
      if (localStreamRef.current?.cleanup) {
        localStreamRef.current.cleanup();
      }

      const user = currentUserRef.current;
      const vTrack = createVirtualVideoTrack(user?.name, user?.role);
      let aTrack = null;

      // Try capturing real microphone even if camera is virtual!
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          aTrack = micStream.getAudioTracks()[0];
          setHasRealMic(true);
        }
      } catch (micErr) {
        try {
          const basicMic = await navigator.mediaDevices.getUserMedia({ audio: true });
          aTrack = basicMic.getAudioTracks()[0];
          setHasRealMic(true);
        } catch (e) {
          console.warn('Real microphone not available, using synthetic audio track:', micErr.name);
        }
      }

      if (!aTrack) {
        aTrack = createVirtualAudioTrack();
        setHasRealMic(false);
      }

      const tracks = [vTrack];
      if (aTrack) tracks.push(aTrack);

      const stream = new MediaStream(tracks);
      stream.cleanup = vTrack.cleanup;

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVirtualStream(true);
      setPermissionError(null);
      setConnectionState('connected');

      // Add to peers
      Object.values(peersRef.current).forEach((pc) => {
        stream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, stream);
          } catch (e) {}
        });
      });

      return stream;
    } catch (err) {
      console.error('Failed to create virtual stream:', err);
      return null;
    }
  }, []);

  // 1. Initialize User Media (Camera & Microphone)
  const startMedia = useCallback(async () => {
    try {
      setConnectionState('requesting_permissions');
      setPermissionError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return startVirtualMedia();
      }

      let vTrack = null;
      let aTrack = null;

      // Try capturing real camera & real microphone with standard-compliant adaptive constraints
      try {
        const fullStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        vTrack = fullStream.getVideoTracks()[0];
        aTrack = fullStream.getAudioTracks()[0];
        setHasRealMic(true);
      } catch (firstErr) {
        console.warn('Combined camera+mic capture failed, attempting independent captures:', firstErr.name);

        // Independent Microphone Capture (Crucial for live two-way voice)
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          aTrack = micStream.getAudioTracks()[0];
          setHasRealMic(true);
        } catch (micErr1) {
          try {
            const basicMic = await navigator.mediaDevices.getUserMedia({ audio: true });
            aTrack = basicMic.getAudioTracks()[0];
            setHasRealMic(true);
          } catch (micErr2) {
            console.warn('Microphone independent capture error:', micErr2.name);
          }
        }

        // Independent Camera Capture
        try {
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
          });
          vTrack = camStream.getVideoTracks()[0];
        } catch (camErr1) {
          try {
            const basicCam = await navigator.mediaDevices.getUserMedia({ video: true });
            vTrack = basicCam.getVideoTracks()[0];
          } catch (camErr2) {
            console.warn('Camera independent capture error:', camErr2.name);
            if (camErr2.name === 'NotReadableError' || camErr2.name === 'TrackStartError') {
              setCameraBusy(true);
            }
          }
        }
      }

      // If no video track found, generate virtual medical video track
      const user = currentUserRef.current;
      if (!vTrack) {
        vTrack = createVirtualVideoTrack(user?.name, user?.role);
        setIsVirtualStream(true);
      } else {
        setIsVirtualStream(false);
        setCameraBusy(false);
      }

      // If no audio track found, generate fallback audio track
      if (!aTrack) {
        aTrack = createVirtualAudioTrack();
        setHasRealMic(false);
      }

      const tracks = [];
      if (vTrack) tracks.push(vTrack);
      if (aTrack) tracks.push(aTrack);

      const stream = new MediaStream(tracks);
      if (vTrack.cleanup) stream.cleanup = vTrack.cleanup;

      localStreamRef.current = stream;
      setLocalStream(stream);
      setConnectionState('connected');

      // Attach tracks to existing peer connections
      Object.values(peersRef.current).forEach((pc) => {
        stream.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, stream);
          } catch (e) {}
        });
      });

      return stream;
    } catch (err) {
      console.error('[WebRTC Media Error]', err);
      return startVirtualMedia();
    }
  }, [startVirtualMedia]);

  // Create or retrieve Peer Connection for a specific remote socket
  const createPeerConnection = useCallback((remoteSocketId, remoteUserData) => {
    if (peersRef.current[remoteSocketId]) {
      return peersRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[remoteSocketId] = pc;
    userPeersRef.current[remoteSocketId] = remoteUserData;

    // Add local tracks cleanly to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.warn('Track add warning:', e);
        }
      });
    }

    // Ensure transceivers are configured to bidirectional sendrecv
    const transceivers = pc.getTransceivers();
    const audioTransceiver = transceivers.find((t) => (t.receiver?.track?.kind === 'audio') || (t.sender?.track?.kind === 'audio'));
    if (audioTransceiver) {
      audioTransceiver.direction = 'sendrecv';
    } else {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
    }

    const videoTransceiver = transceivers.find((t) => (t.receiver?.track?.kind === 'video') || (t.sender?.track?.kind === 'video'));
    if (videoTransceiver) {
      videoTransceiver.direction = 'sendrecv';
    } else {
      pc.addTransceiver('video', { direction: 'sendrecv' });
    }

    // Handle incoming ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice_candidate', {
          toSocketId: remoteSocketId,
          candidate: event.candidate
        });
      }
    };

    // Handle incoming remote media tracks (both audio and video seamlessly)
    pc.ontrack = (event) => {
      const remoteTrack = event.track;
      if (remoteTrack) {
        remoteTrack.enabled = true;
      }

      const incomingStream = event.streams && event.streams[0];

      setRemoteStreams((prev) => {
        const currentPeer = prev[remoteSocketId];
        let updatedStream;

        if (currentPeer && currentPeer.stream) {
          const currentStream = currentPeer.stream;
          if (remoteTrack && !currentStream.getTracks().some((t) => t.id === remoteTrack.id)) {
            currentStream.addTrack(remoteTrack);
          }
          // Create fresh MediaStream with all audio and video tracks so React detects update
          updatedStream = new MediaStream(currentStream.getTracks());
        } else if (incomingStream) {
          if (remoteTrack && !incomingStream.getTracks().some((t) => t.id === remoteTrack.id)) {
            incomingStream.addTrack(remoteTrack);
          }
          updatedStream = new MediaStream(incomingStream.getTracks());
        } else if (remoteTrack) {
          updatedStream = new MediaStream([remoteTrack]);
        }

        if (updatedStream) {
          updatedStream.getAudioTracks().forEach((t) => {
            t.enabled = true;
          });
        }

        return {
          ...prev,
          [remoteSocketId]: {
            stream: updatedStream,
            user: userPeersRef.current[remoteSocketId] || remoteUserData
          }
        };
      });
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        removePeer(remoteSocketId);
      }
    };

    return pc;
  }, [socket]);

  // Remove peer connection
  const removePeer = useCallback((socketId) => {
    if (peersRef.current[socketId]) {
      try {
        peersRef.current[socketId].close();
      } catch (e) {}
      delete peersRef.current[socketId];
    }
    delete userPeersRef.current[socketId];
    delete iceCandidateQueueRef.current[socketId];

    setRemoteStreams((prev) => {
      if (!prev[socketId]) return prev;
      const updated = { ...prev };
      delete updated[socketId];
      return updated;
    });
  }, []);

  // Main signalling effect
  useEffect(() => {
    const user = currentUserRef.current;
    if (!socket || !roomId || !user) return;

    startMedia().then(() => {
      socket.emit('join_room', {
        roomId,
        user: {
          id: user._id,
          name: user.name,
          role: user.role
        }
      });
    });

    const handleExistingPeers = async ({ peers }) => {
      for (const peer of peers) {
        const pc = createPeerConnection(peer.socketId, peer.user);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('offer', {
            toSocketId: peer.socketId,
            offer,
            fromUser: {
              id: user._id,
              name: user.name,
              role: user.role
            }
          });
        } catch (err) {
          console.error('[WebRTC] Failed to create offer:', err);
        }
      }
    };

    const handleUserJoined = ({ socketId, user: joinedUser }) => {
      createPeerConnection(socketId, joinedUser);
    };

    const handleOffer = async ({ fromSocketId, offer, fromUser }) => {
      const pc = createPeerConnection(fromSocketId, fromUser);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Flush queued ICE candidates received before remoteDescription was set
        if (iceCandidateQueueRef.current[fromSocketId]) {
          for (const cand of iceCandidateQueueRef.current[fromSocketId]) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
              console.warn('[WebRTC] Error adding queued ICE candidate:', err);
            }
          }
          delete iceCandidateQueueRef.current[fromSocketId];
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('answer', {
          toSocketId: fromSocketId,
          answer
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    const handleAnswer = async ({ fromSocketId, answer }) => {
      const pc = peersRef.current[fromSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));

          // Flush queued ICE candidates received before remoteDescription was set
          if (iceCandidateQueueRef.current[fromSocketId]) {
            for (const cand of iceCandidateQueueRef.current[fromSocketId]) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (err) {
                console.warn('[WebRTC] Error adding queued ICE candidate:', err);
              }
            }
            delete iceCandidateQueueRef.current[fromSocketId];
          }
        } catch (err) {
          console.error('[WebRTC] Error setting remote description:', err);
        }
      }
    };

    const handleIceCandidate = async ({ fromSocketId, candidate }) => {
      const pc = peersRef.current[fromSocketId];
      if (!pc || !candidate) return;

      // If remote description is not set yet, buffer candidate to prevent InvalidStateError
      if (!pc.remoteDescription || !pc.remoteDescription.type) {
        if (!iceCandidateQueueRef.current[fromSocketId]) {
          iceCandidateQueueRef.current[fromSocketId] = [];
        }
        iceCandidateQueueRef.current[fromSocketId].push(candidate);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('[WebRTC] Error adding ICE candidate:', err);
      }
    };

    const handleUserLeft = ({ socketId }) => {
      removePeer(socketId);
    };

    socket.on('existing_peers', handleExistingPeers);
    socket.on('user_joined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('user_left', handleUserLeft);

    return () => {
      socket.off('existing_peers', handleExistingPeers);
      socket.off('user_joined', handleUserJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('user_left', handleUserLeft);

      socket.emit('leave_room');

      Object.keys(peersRef.current).forEach((sid) => {
        removePeer(sid);
      });

      if (localStreamRef.current) {
        if (localStreamRef.current.cleanup) {
          localStreamRef.current.cleanup();
        }
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [socket, roomId, startMedia, createPeerConnection, removePeer]);

  const toggleAudio = async () => {
    if (!hasRealMic) {
      const success = await enableMicrophone();
      if (success) return;
    }
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    if (isVirtualStream || cameraBusy) {
      const success = await enableCamera();
      if (success) return;
    }
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const leaveCall = () => {
    if (socket) {
      socket.emit('leave_room');
    }
    Object.keys(peersRef.current).forEach((sid) => {
      removePeer(sid);
    });
    if (localStreamRef.current) {
      if (localStreamRef.current.cleanup) {
        localStreamRef.current.cleanup();
      }
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStreams({});
  };

  return {
    localStream,
    remoteStreams,
    permissionError,
    isAudioMuted,
    isVideoMuted,
    connectionState,
    isVirtualStream,
    hasRealMic,
    cameraBusy,
    enableMicrophone,
    enableCamera,
    toggleAudio,
    toggleVideo,
    startMedia,
    startVirtualMedia,
    leaveCall
  };
};
