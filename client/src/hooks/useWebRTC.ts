import { useContext, useRef, useState, useCallback } from "react";
import { SignalingContext, SignalingMessage } from "@/context/SignalingContext";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useWebRTC = (
  _roomId: string,
  _userId: string,
  username: string,
  callType: "audio" | "video" = "video"
) => {
  const { sendSignal } = useContext(SignalingContext);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteUserIdRef = useRef<string | null>(null);

  // Queue for ICE candidates received before remote description is set
  const iceCandidateQueueRef = useRef<RTCIceCandidateInit[]>([]);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callState, setCallState] = useState<"idle" | "calling" | "connected">(
    "idle"
  );

  // End call - defined early so it can be used in createPeerConnection
  const endCall = useCallback(() => {
    console.log("📞 endCall() called");

    // Notify remote peer
    if (remoteUserIdRef.current) {
      console.log("📞 Sending call-end to:", remoteUserIdRef.current);
      sendSignal({
        type: "call-end",
        target_id: remoteUserIdRef.current,
        timestamp: new Date().toISOString(),
      });
    }

    // Stop local stream tracks but keep stream for a moment to allow UI update
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind, track.label);
      });
      // Don't clear immediately - let useEffect handle it
      setTimeout(() => {
        localStreamRef.current = null;
        setLocalStream(null);
      }, 100);
    }

    // Close peer connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    // Clear queued candidates
    iceCandidateQueueRef.current = [];

    remoteUserIdRef.current = null;
    setRemoteStream(null);
    setCallState("idle");
  }, [sendSignal]);

  // Create peer connection
  const createPeerConnection = (targetUserId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    });

    // AUTOMATIC ICE CANDIDATE SENDING
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: "ice-candidate",
          target_id: targetUserId,
          data: event.candidate,
          timestamp: new Date().toISOString(),
        });
      }
    };

    pc.onicegatheringstatechange = () => {
      // ICE gathering state changed
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state changed:", pc.iceConnectionState);
      if (
        pc.iceConnectionState === "connected" ||
        pc.iceConnectionState === "completed"
      ) {
        console.log("✅ ICE connection established");
      } else if (pc.iceConnectionState === "failed") {
        console.error("❌ ICE connection failed");
      }
    };

    pc.ontrack = (event) => {
      console.log("🎥 Remote track received:", {
        streamId: event.streams[0]?.id,
        tracks: event.streams[0]?.getTracks().length || 0,
        videoTracks: event.streams[0]?.getVideoTracks().length || 0,
        audioTracks: event.streams[0]?.getAudioTracks().length || 0,
      });

      if (event.streams && event.streams[0]) {
        console.log("✅ Setting remote stream");
        setRemoteStream(event.streams[0]);

        // Log track details
        event.streams[0].getTracks().forEach((track, index) => {
          console.log(`🎥 Remote track ${index}:`, {
            kind: track.kind,
            enabled: track.enabled,
            readyState: track.readyState,
            muted: track.muted,
            label: track.label,
          });
        });
      } else {
        console.warn("⚠️ No streams in track event");
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("📞 Peer connection state changed:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setCallState("connected");
      } else if (pc.connectionState === "failed") {
        console.error("❌ Peer connection failed");
        // Don't auto-end on failed, let user decide
      } else if (pc.connectionState === "disconnected") {
        console.log("⚠️ Peer connection disconnected");
        // Don't auto-end on disconnected, might reconnect
      }
    };

    return pc;
  };

  // Process queued ICE candidates after setting remote description
  const processQueuedIceCandidates = async () => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;

    while (iceCandidateQueueRef.current.length > 0) {
      const candidateInit = iceCandidateQueueRef.current.shift();
      if (candidateInit) {
        try {
          const candidate = new RTCIceCandidate(candidateInit);
          await pc.addIceCandidate(candidate);
        } catch (error) {
          // Error adding queued ICE candidate
        }
      }
    }
  };

  // Handle incoming offer (receiver side)
  const handleIncomingOffer = async (message: SignalingMessage) => {
    try {
      console.log(
        "📞 handleIncomingOffer: Processing offer from:",
        message.sender_id
      );

      // Create peer connection if not exists
      if (!pcRef.current) {
        console.log("📞 Creating new peer connection for incoming offer");
        pcRef.current = createPeerConnection(message.sender_id);
        remoteUserIdRef.current = message.sender_id;
      }

      const pc = pcRef.current;

      // Add local stream tracks if we have them
      if (localStreamRef.current) {
        console.log("📞 Adding local tracks to peer connection");
        localStreamRef.current.getTracks().forEach((track) => {
          console.log(
            `📞 Adding track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`
          );
          pc.addTrack(track, localStreamRef.current!);
        });
      } else {
        console.warn("⚠️ No local stream available when processing offer");
      }

      // Set remote description (the offer)
      console.log("📞 Setting remote description (offer)");
      await pc.setRemoteDescription(new RTCSessionDescription(message.data));
      console.log("✅ Remote description set");

      // Process any queued ICE candidates
      await processQueuedIceCandidates();

      // Create answer
      console.log("📞 Creating answer");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log("✅ Answer created and local description set");

      // Send answer back
      sendSignal({
        type: "answer",
        target_id: message.sender_id,
        data: answer,
        timestamp: new Date().toISOString(),
      });
      console.log("✅ Answer sent to caller");

      setCallState("connected");
    } catch (error) {
      console.error("❌ Error handling incoming offer:", error);
      endCall();
    }
  };

  // Handle incoming answer (caller side)
  const handleIncomingAnswer = async (message: SignalingMessage) => {
    try {
      console.log(
        "📞 handleIncomingAnswer: Processing answer from:",
        message.sender_id
      );

      const pc = pcRef.current;
      if (!pc) {
        console.error("❌ No peer connection exists for answer");
        return;
      }

      console.log("📞 Setting remote description (answer)");
      // Set remote description (the answer)
      await pc.setRemoteDescription(new RTCSessionDescription(message.data));
      console.log("✅ Remote description (answer) set");

      // Process any queued ICE candidates
      await processQueuedIceCandidates();

      console.log("✅ Answer processed, call should be connected");
      setCallState("connected");
    } catch (error) {
      console.error("❌ Error handling incoming answer:", error);
      endCall();
    }
  };

  // Handle incoming ICE candidate
  const handleIncomingIceCandidate = async (message: SignalingMessage) => {
    try {
      const pc = pcRef.current;

      if (!pc) {
        iceCandidateQueueRef.current.push(message.data);
        return;
      }

      if (!pc.remoteDescription) {
        iceCandidateQueueRef.current.push(message.data);
        return;
      }

      // Add ICE candidate
      const candidate = new RTCIceCandidate(message.data);
      await pc.addIceCandidate(candidate);
    } catch (error) {
      // Error adding ICE candidate
    }
  };

  // Start call (caller side)
  const startCall = async (targetUserId: string) => {
    try {
      setCallState("calling");

      // Get local media based on call type
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      // Log stream details
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      console.log("✅ Local stream obtained:", {
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        callType,
        streamId: stream.id,
        active: stream.active,
      });

      // Log track details
      videoTracks.forEach((track, index) => {
        console.log(`📹 Video track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label,
        });
      });

      audioTracks.forEach((track, index) => {
        console.log(`🎤 Audio track ${index}:`, {
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted,
          label: track.label,
        });
      });

      // Ensure tracks are enabled
      videoTracks.forEach((track) => {
        track.enabled = true;
      });
      audioTracks.forEach((track) => {
        track.enabled = true;
      });

      // Set stream state - this will trigger useEffect in VideoCall
      setLocalStream(stream);
      localStreamRef.current = stream;
      remoteUserIdRef.current = targetUserId;

      console.log("✅ Stream state set, localStreamRef updated");

      // Create peer connection
      console.log("📞 Creating peer connection for caller");
      pcRef.current = createPeerConnection(targetUserId);
      const pc = pcRef.current;

      // Add local tracks to peer connection
      console.log("📞 Adding local tracks to caller's peer connection");
      stream.getTracks().forEach((track) => {
        console.log(
          `📞 Adding caller track: ${track.kind}, enabled: ${track.enabled}, readyState: ${track.readyState}`
        );
        pc.addTrack(track, stream);
      });
      console.log("✅ Caller's local tracks added to peer connection");

      // Send call-start notification to the target user
      sendSignal({
        type: "call-start",
        target_id: targetUserId,
        data: {
          caller_username: username,
          call_type: callType,
        },
        timestamp: new Date().toISOString(),
      });

      console.log("📞 Call-start notification sent to:", targetUserId);

      // Create offer
      console.log("📞 Creating offer");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("✅ Offer created and set as local description");

      // Send offer
      sendSignal({
        type: "offer",
        target_id: targetUserId,
        data: offer,
        timestamp: new Date().toISOString(),
      });

      console.log("✅ Offer sent, waiting for answer...");
      console.log("✅ Call started successfully");
    } catch (error) {
      console.error("❌ Error in startCall:", error);
      endCall();
    }
  };

  // Accept call (receiver side)
  const acceptCall = async (callerUserId: string) => {
    try {
      // Get local media based on call type
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === "video",
        audio: true,
      });

      setLocalStream(stream);
      localStreamRef.current = stream;
      remoteUserIdRef.current = callerUserId;

      // Send accept notification
      sendSignal({
        type: "call-accept",
        target_id: callerUserId,
        data: {
          accepter_username: username,
        },
        timestamp: new Date().toISOString(),
      });

      console.log("✅ Call accepted, waiting for offer...");

      // Note: peer connection will be created when offer arrives
      // Answer will be sent in handleIncomingOffer
    } catch (error) {
      console.error("❌ Error accepting call:", error);
      endCall();
    }
  };

  return {
    localStream,
    remoteStream,
    callState,
    startCall,
    acceptCall,
    endCall,
    handleIncomingOffer,
    handleIncomingAnswer,
    handleIncomingIceCandidate,
  };
};
