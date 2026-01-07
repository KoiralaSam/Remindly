import { FC, useRef, useEffect, useState, useContext } from "react";
import { Mic, MicOff, Video as VideoIcon, VideoOff, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/context/SidebarContext";
import { SignalingContext } from "@/context/SignalingContext";
import { useGroupMembers } from "@/context/GroupMemberContext";
import { useUser } from "@/context/UserContext";
import { useWebRTC } from "@/hooks/useWebRTC";

interface VideoCallProps {
  callType: "audio" | "video";
  onEndCall: () => void;
}

export const VideoCall: FC<VideoCallProps> = ({ callType, onEndCall }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localVideoPosition, setLocalVideoPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const localVideoContainerRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Initialize position to bottom-right on mount
  useEffect(() => {
    const initializePosition = () => {
      if (
        videoContainerRef.current &&
        localVideoPosition.x === 0 &&
        localVideoPosition.y === 0
      ) {
        const containerRect = videoContainerRef.current.getBoundingClientRect();
        const videoWidth = 192; // w-48 = 12rem = 192px
        const videoHeight = 144; // h-36 = 9rem = 144px
        setLocalVideoPosition({
          x: containerRect.width - videoWidth - 16, // 16px = 1rem margin
          y: containerRect.height - videoHeight - 100 - 16, // Leave space for call controls
        });
      }
    };

    // Try immediately
    initializePosition();

    // Also try after a short delay in case container isn't ready
    const timeout = setTimeout(initializePosition, 100);

    return () => clearTimeout(timeout);
  }, [localVideoPosition.x, localVideoPosition.y]);

  // Handle mouse move for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (
        !isDragging ||
        !localVideoContainerRef.current ||
        !videoContainerRef.current
      )
        return;

      const containerRect = videoContainerRef.current.getBoundingClientRect();
      const videoWidth = 192; // w-48 = 12rem = 192px
      const videoHeight = 144; // h-36 = 9rem = 144px

      let newX = e.clientX - containerRect.left - dragStart.x;
      let newY = e.clientY - containerRect.top - dragStart.y;

      // Constrain to container bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - videoWidth));
      newY = Math.max(
        0,
        Math.min(newY, containerRect.height - videoHeight - 100)
      ); // Leave space for call controls

      setLocalVideoPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);
  const { selectedGroupId, incomingCall, setIncomingCall } = useSidebar();
  const { connect, setOnMessage, isConnected, sendSignal } =
    useContext(SignalingContext);
  const { getGroupMembers } = useGroupMembers();
  const { user } = useUser();

  // Track if we're handling an incoming call
  const incomingCallRef = useRef(false);
  const isIncomingCallRef = useRef(!!incomingCall);

  // Use WebRTC hook
  const {
    localStream,
    remoteStream,
    callState,
    startCall,
    acceptCall,
    endCall,
    handleIncomingOffer,
    handleIncomingAnswer,
    handleIncomingIceCandidate,
  } = useWebRTC(
    selectedGroupId || "",
    user?.id || "",
    user?.name || "User",
    callType
  );

  // Set up message handler for incoming signaling messages
  // Note: This handler should NOT override MainContent's handler for call-start
  useEffect(() => {
    const handleMessage = (message: any) => {
      // For call-start, let MainContent handle it (it will show notification)
      // VideoCall only handles WebRTC-specific messages
      if (message.type === "call-start") {
        console.log(
          "📞 VideoCall: Ignoring call-start (handled by MainContent)"
        );
        return;
      }

      switch (message.type) {
        case "offer":
          handleIncomingOffer(message);
          break;
        case "answer":
          console.log(
            "📞 VideoCall: Received answer message, calling handleIncomingAnswer"
          );
          handleIncomingAnswer(message);
          break;
        case "ice-candidate":
          handleIncomingIceCandidate(message);
          break;
        case "call-accept":
          // Handle call accepted notification
          break;
        case "call-end":
          console.log("📞 Received call-end");
          callStartedRef.current = false;
          incomingCallRef.current = false;
          endCall();
          onEndCall();
          break;
        default:
          break;
      }
    };

    setOnMessage(handleMessage);

    // Check for queued offer message that arrived before VideoCall mounted
    const queuedOffer = (window as any).__queuedOffer;
    if (queuedOffer) {
      console.log("📞 VideoCall: Processing queued offer message");
      setTimeout(() => {
        handleIncomingOffer(queuedOffer);
        delete (window as any).__queuedOffer;
      }, 100);
    }

    return () => {
      setOnMessage(() => {});
    };
  }, [
    handleIncomingOffer,
    handleIncomingAnswer,
    handleIncomingIceCandidate,
    acceptCall,
    endCall,
    onEndCall,
    setOnMessage,
  ]);

  // Connect to signaling server when component mounts
  useEffect(() => {
    if (!selectedGroupId) {
      console.log("⏳ No selectedGroupId, skipping signaling connection");
      return;
    }
    console.log(
      "🔌 Connecting to signaling server for group:",
      selectedGroupId
    );
    console.log("🔌 connect function type:", typeof connect);
    console.log("🔌 connect function:", connect);
    console.log("🔌 connect.toString():", connect.toString().substring(0, 200));
    console.log("🔌 Calling connect with:", selectedGroupId);
    try {
      const result = connect(selectedGroupId);
      console.log("🔌 connect() call completed, result:", result);
    } catch (error) {
      console.error("❌ Error calling connect:", error);
    }
  }, [selectedGroupId, connect]);

  // Track if call has been started to prevent multiple initializations
  const callStartedRef = useRef(false);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializingRef = useRef(false);

  // Start call once signaling is connected (only when callType is set)
  useEffect(() => {
    // Don't auto-start call - wait for user to initiate via UI
    // This effect is just for ensuring signaling connection
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
  }, [selectedGroupId, isConnected]);

  // Handle incoming call acceptance when VideoCall mounts from Accept button
  useEffect(() => {
    if (incomingCall && !callStartedRef.current && !isInitializingRef.current) {
      isInitializingRef.current = true;
      isIncomingCallRef.current = true;

      console.log(
        "📞 VideoCall: Accepting incoming call from:",
        incomingCall.callerId
      );

      const acceptIncomingCall = async () => {
        try {
          // Connect to signaling if not already connected
          if (!isConnected || selectedGroupId !== incomingCall.groupId) {
            console.log("🔌 Connecting to signaling for incoming call");
            connect(incomingCall.groupId);

            // Wait for connection
            let acceptInterval: ReturnType<typeof setInterval> | null = null;
            acceptInterval = setInterval(() => {
              const signalingConn = (window as any).__signalingConn;
              if (signalingConn?.readyState === WebSocket.OPEN) {
                if (acceptInterval) clearInterval(acceptInterval);
                console.log("✅ Signaling connected, accepting call");
                acceptCall(incomingCall.callerId);
                callStartedRef.current = true;
              }
            }, 200);

            setTimeout(() => {
              if (acceptInterval) clearInterval(acceptInterval);
              console.log("📞 Accepting call after timeout");
              acceptCall(incomingCall.callerId);
              callStartedRef.current = true;
            }, 3000);
          } else {
            console.log("✅ Already connected, accepting call immediately");
            acceptCall(incomingCall.callerId);
            callStartedRef.current = true;

            // Check if there's a queued offer message from before VideoCall mounted
            // The offer might have arrived while MainContent was handling messages
            const queuedOffer = (window as any).__queuedOffer;
            if (
              queuedOffer &&
              queuedOffer.sender_id === incomingCall.callerId
            ) {
              console.log("📞 Processing queued offer message");
              setTimeout(() => {
                handleIncomingOffer(queuedOffer);
                delete (window as any).__queuedOffer;
              }, 500);
            }
          }

          // Don't clear incomingCall immediately - wait a bit to ensure VideoCall is fully mounted
          // The state will be cleared after the call is properly established
          setTimeout(() => {
            setIncomingCall(null);
          }, 2000);
        } catch (error) {
          console.error("❌ Error accepting incoming call:", error);
          setIncomingCall(null);
        } finally {
          isInitializingRef.current = false;
        }
      };

      setTimeout(() => {
        acceptIncomingCall();
      }, 500);

      return () => {
        isIncomingCallRef.current = false;
      };
    }
  }, [
    incomingCall,
    isConnected,
    selectedGroupId,
    connect,
    acceptCall,
    setIncomingCall,
    handleIncomingOffer,
  ]);

  // Auto-start call when component mounts with callType (user clicked Audio/Video)
  // Skip if this is an incoming call
  useEffect(() => {
    if (
      isIncomingCallRef.current ||
      !selectedGroupId ||
      !user?.id ||
      !isConnected ||
      callStartedRef.current ||
      isInitializingRef.current
    ) {
      return;
    }

    isInitializingRef.current = true;

    const initializeCall = async () => {
      try {
        console.log("📞 Auto-initializing call...");
        // Get group members
        const groupMembers = getGroupMembers(selectedGroupId);
        const otherMembers = groupMembers.filter(
          (member) => member.user_id !== user.id
        );

        console.log("👥 Group members:", {
          total: groupMembers.length,
          others: otherMembers.length,
        });

        // Start call with first available member and notify all others
        if (otherMembers.length > 0) {
          const firstMember = otherMembers[0];
          console.log("📞 Starting call with:", firstMember.user_id);
          console.log("📞 Notifying all group members:", otherMembers.length);
          callStartedRef.current = true;

          // Start the call (this will send call-start to first member and create offer)
          await startCall(firstMember.user_id);

          // Also send call-start to all other members so they can join
          // Note: startCall already sends to firstMember, so we skip them
          const remainingMembers = otherMembers.slice(1);
          if (remainingMembers.length > 0) {
            console.log(
              "📞 Notifying additional members:",
              remainingMembers.length
            );
            remainingMembers.forEach((member) => {
              sendSignal({
                type: "call-start",
                target_id: member.user_id,
                data: {
                  caller_username: user?.name || "User",
                  call_type: callType,
                },
                timestamp: new Date().toISOString(),
              });
              console.log("📞 Call-start sent to:", member.user_id);
            });
          }
        } else {
          console.log("⚠️ No other members to call");
        }
      } catch (error) {
        console.error("❌ Error initializing call:", error);
        callStartedRef.current = false;
      } finally {
        isInitializingRef.current = false;
      }
    };

    // Delay to ensure everything is ready
    initTimeoutRef.current = setTimeout(() => {
      initializeCall();
    }, 1000);

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, user?.id, isConnected, callType]);

  // Update video elements when streams change
  useEffect(() => {
    const videoEl = localVideoRef.current;

    console.log("🎥 Local stream effect triggered:", {
      hasLocalStream: !!localStream,
      hasVideoRef: !!videoEl,
      callType,
      videoTracks: localStream?.getVideoTracks().length || 0,
      audioTracks: localStream?.getAudioTracks().length || 0,
      streamId: localStream?.id,
      streamActive: localStream?.active,
    });

    if (!videoEl) {
      console.log(
        "⚠️ localVideoRef.current is null, video element not mounted yet"
      );
      return;
    }

    if (localStream) {
      console.log("✅ Setting local video srcObject");

      // Only set if different to avoid unnecessary updates
      if (videoEl.srcObject !== localStream) {
        videoEl.srcObject = localStream;
      }

      // Ensure video is visible
      videoEl.style.display = "block";

      // Wait for metadata to load before playing
      const handleLoadedMetadata = () => {
        console.log("📹 Video metadata loaded");
        videoEl
          .play()
          .then(() => {
            console.log("✅ Local video playing successfully");
            console.log("📹 Video element state:", {
              videoWidth: videoEl.videoWidth,
              videoHeight: videoEl.videoHeight,
              readyState: videoEl.readyState,
              paused: videoEl.paused,
              muted: videoEl.muted,
            });
          })
          .catch((err) => {
            console.error("❌ Error playing local video:", err);
          });
      };

      if (videoEl.readyState >= 1) {
        // Already has metadata, play immediately
        handleLoadedMetadata();
      } else {
        // Wait for metadata
        videoEl.addEventListener("loadedmetadata", handleLoadedMetadata, {
          once: true,
        });
      }
    } else {
      console.log("⚠️ No local stream, clearing srcObject");
      if (videoEl.srcObject) {
        videoEl.srcObject = null;
      }
      videoEl.style.display = "none";
    }
  }, [localStream, callType]);

  // Update remote video element when remote stream changes
  useEffect(() => {
    const videoEl = remoteVideoRef.current;

    console.log("🎥 Remote stream effect triggered:", {
      hasRemoteStream: !!remoteStream,
      hasVideoRef: !!videoEl,
      callType,
      videoTracks: remoteStream?.getVideoTracks().length || 0,
      audioTracks: remoteStream?.getAudioTracks().length || 0,
      streamId: remoteStream?.id,
      streamActive: remoteStream?.active,
    });

    if (!videoEl) {
      console.log(
        "⚠️ remoteVideoRef.current is null, video element not mounted yet"
      );
      return;
    }

    if (remoteStream) {
      console.log("✅ Setting remote video srcObject");

      // Only set if different to avoid unnecessary updates
      if (videoEl.srcObject !== remoteStream) {
        videoEl.srcObject = remoteStream;
      }

      // Ensure video is visible
      videoEl.style.display = "block";

      // Wait for metadata to load before playing
      const handleLoadedMetadata = () => {
        console.log("✅ Remote video metadata loaded, attempting to play");
        videoEl
          .play()
          .then(() => {
            console.log("✅ Remote video playing successfully");
            console.log("📹 Remote video element state:", {
              videoWidth: videoEl.videoWidth,
              videoHeight: videoEl.videoHeight,
              readyState: videoEl.readyState,
              paused: videoEl.paused,
              muted: videoEl.muted,
            });
          })
          .catch((err) => {
            console.error("❌ Error playing remote video:", err);
            // Retry logic
            setTimeout(() => {
              videoEl.play().catch((e) => {
                console.error("❌ Retry play also failed:", e);
              });
            }, 100);
          });
      };

      if (videoEl.readyState >= 1) {
        // Already has metadata, play immediately
        handleLoadedMetadata();
      } else {
        // Wait for metadata
        videoEl.addEventListener("loadedmetadata", handleLoadedMetadata, {
          once: true,
        });
      }
    } else {
      console.log("⚠️ No remote stream, clearing srcObject");
      if (videoEl.srcObject) {
        videoEl.srcObject = null;
      }
      videoEl.style.display = "none";
    }
  }, [remoteStream, callType]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleEndCall = () => {
    console.log("📞 User ending call");
    callStartedRef.current = false;
    incomingCallRef.current = false;
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    endCall();
    onEndCall();
  };

  return (
    <div className="flex flex-col w-full h-full bg-gray-900 relative">
      {/* Remote Video Feed (Larger) */}
      <div
        ref={videoContainerRef}
        className="flex-1 relative bg-black flex items-center justify-center"
      >
        {callType === "video" ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-white">
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4">
              <span className="text-4xl font-semibold">R</span>
            </div>
            <p className="text-lg">Remote User</p>
          </div>
        )}
        {!remoteVideoRef.current?.srcObject && callType === "video" && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center mb-4 mx-auto">
                <span className="text-4xl font-semibold">R</span>
              </div>
              <p className="text-lg">
                {callState === "calling"
                  ? "Calling..."
                  : callState === "connected"
                  ? "Connected"
                  : "Waiting for remote video..."}
              </p>
            </div>
          </div>
        )}

        {/* Local Video Feed (Smaller, draggable) */}
        {callType === "video" && (
          <div
            ref={localVideoContainerRef}
            className="absolute w-48 h-36 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-black z-20 cursor-move select-none"
            style={{
              left: `${localVideoPosition.x}px`,
              top: `${localVideoPosition.y}px`,
            }}
            onMouseDown={(e) => {
              if (e.button !== 0) return; // Only handle left mouse button
              setIsDragging(true);
              const rect =
                localVideoContainerRef.current?.getBoundingClientRect();
              const containerRect =
                videoContainerRef.current?.getBoundingClientRect();
              if (rect && containerRect) {
                setDragStart({
                  x:
                    e.clientX -
                    containerRect.left -
                    (rect.left - containerRect.left),
                  y:
                    e.clientY -
                    containerRect.top -
                    (rect.top - containerRect.top),
                });
              }
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover relative z-0 pointer-events-none"
            />
            {!localStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10 pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xl font-semibold text-white">L</span>
                </div>
              </div>
            )}
            {isVideoOff && localStream && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10 pointer-events-none">
                <VideoOff className="h-8 w-8 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Audio-only local indicator */}
        {callType === "audio" && (
          <div className="absolute bottom-4 right-4 w-32 h-32 rounded-lg border-2 border-white shadow-lg bg-gray-800 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-2 mx-auto">
                <span className="text-2xl font-semibold text-white">L</span>
              </div>
              <p className="text-xs text-white">You</p>
            </div>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="secondary"
            size="icon"
            className={`h-12 w-12 rounded-full ${
              isMuted
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={toggleMute}
          >
            {isMuted ? (
              <MicOff className="h-5 w-5 text-white" />
            ) : (
              <Mic className="h-5 w-5 text-white" />
            )}
          </Button>

          {callType === "video" && (
            <Button
              variant="secondary"
              size="icon"
              className={`h-12 w-12 rounded-full ${
                isVideoOff
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={toggleVideo}
            >
              {isVideoOff ? (
                <VideoOff className="h-5 w-5 text-white" />
              ) : (
                <VideoIcon className="h-5 w-5 text-white" />
              )}
            </Button>
          )}

          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleEndCall}
          >
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
