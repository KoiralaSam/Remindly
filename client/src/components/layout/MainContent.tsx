import { FC, useEffect, useContext, useRef } from "react";
import { useSidebar } from "@/context/SidebarContext";
import { SignalingContext, SignalingMessage } from "@/context/SignalingContext";
import { GroupMessages } from "@/components/groups/GroupMessages";
import { GroupTasks } from "@/components/tasks/GroupTasks";
import { InvitationsView } from "@/components/invitations/InvitationsView";
import { ContentHeader } from "@/components/layout/ContentHeader";
import { DirectMessages } from "@/components/messages/DirectMessages";
import { VideoCall } from "../calls/VideoCall";
import { IncomingCallNotification } from "../calls/IncomingCallNotification";
import { useUser } from "@/context/UserContext";

export const MainContent: FC = () => {
  const {
    selectedGroupId,
    activeTab,
    messagesSubTab,
    groupSubTab,
    setCallType,
    callType,
    setSelectedGroupId,
    incomingCall,
    setIncomingCall,
  } = useSidebar();

  const { connect, isConnected, setOnMessage, sendSignal } =
    useContext(SignalingContext);
  const { user } = useUser();
  const incomingCallRef = useRef(false);
  const handlerSetRef = useRef(false);

  // Connect to signaling when a group is selected (so users can receive call notifications)
  useEffect(() => {
    if (selectedGroupId && !callType) {
      // Only connect if not already in a call
      console.log(
        "🔌 MainContent: Connecting to signaling for group:",
        selectedGroupId
      );
      connect(selectedGroupId);
      handlerSetRef.current = false; // Reset handler flag when group changes
    }
  }, [selectedGroupId, callType, connect]);

  // Set up global message handler for call-start notifications (even when VideoCall isn't mounted)
  // This handler will be called BEFORE VideoCall mounts, so it can trigger VideoCall to mount
  useEffect(() => {
    // Always set up handler when not in a call - it will handle call-start messages
    if (callType) {
      // VideoCall is mounted, let it handle messages
      console.log("📞 MainContent: Skipping handler setup (callType is set)");
      return;
    }

    if (!selectedGroupId) {
      console.log(
        "📞 MainContent: Skipping handler setup (no selectedGroupId)"
      );
      return;
    }

    console.log(
      "📞 MainContent: Setting up call-start handler for group:",
      selectedGroupId,
      "incomingCall:",
      !!incomingCall,
      "callType:",
      callType
    );

    const handleMessage = (message: SignalingMessage) => {
      console.log(
        "📞 MainContent: Received signaling message:",
        message.type,
        "from:",
        message.sender_id,
        "current incomingCall:",
        !!incomingCall,
        "current callType:",
        callType
      );

      // If VideoCall is mounted, let it handle WebRTC messages (offer, answer, ice-candidate)
      // If VideoCall is not mounted yet but we have an incoming call, queue the offer for when VideoCall mounts
      if (
        message.type === "offer" ||
        message.type === "answer" ||
        message.type === "ice-candidate"
      ) {
        if (callType) {
          console.log(
            "📞 MainContent: Forwarding WebRTC message to VideoCall (it will handle it)"
          );
          // VideoCall's handler will process these messages
          return;
        } else if (incomingCall && message.type === "offer") {
          // Queue the offer message - VideoCall will process it when it mounts
          console.log(
            "📞 MainContent: Queuing offer message for VideoCall (not mounted yet)"
          );
          (window as any).__queuedOffer = message;
          return;
        }
        // For other WebRTC messages when VideoCall isn't mounted, ignore them
        return;
      }

      if (
        message.type === "call-start" &&
        message.sender_id &&
        !incomingCallRef.current &&
        !incomingCall &&
        !callType
      ) {
        incomingCallRef.current = true;
        console.log(
          "📞 MainContent: Processing call-start from:",
          message.sender_id
        );

        const groupIdForCall = message.room_id || selectedGroupId;
        if (!groupIdForCall) {
          console.error(
            "❌ MainContent: No group ID available for incoming call"
          );
          incomingCallRef.current = false;
          return;
        }

        // Set selected group if needed
        if (!selectedGroupId || selectedGroupId !== groupIdForCall) {
          console.log(
            "📞 MainContent: Setting selected group to:",
            groupIdForCall
          );
          setSelectedGroupId(groupIdForCall);
        }

        // Show incoming call notification instead of auto-accepting
        const incomingCallType = message.data?.call_type || "video";
        const callerName =
          message.data?.caller_username || message.username || "Unknown";

        console.log("📞 MainContent: Setting incoming call state:", {
          callerId: message.sender_id,
          callerName,
          callType: incomingCallType,
          groupId: groupIdForCall,
        });

        try {
          setIncomingCall({
            callerId: message.sender_id,
            callerName,
            callType: incomingCallType as "audio" | "video",
            groupId: groupIdForCall,
          });
          console.log("✅ MainContent: incomingCall state set successfully");
        } catch (error) {
          console.error("❌ MainContent: Error setting incomingCall:", error);
        }

        // Reset ref after a delay
        setTimeout(() => {
          incomingCallRef.current = false;
        }, 5000);
      }
    };

    setOnMessage(handleMessage);

    return () => {
      // Only clear if VideoCall is still not mounted
      if (!callType) {
        console.log("📞 MainContent: Cleaning up call-start handler");
        setOnMessage(() => {});
      }
    };
  }, [
    selectedGroupId,
    setCallType,
    setSelectedGroupId,
    setOnMessage,
    callType,
    incomingCall,
    setIncomingCall,
  ]);

  // Handle accept call
  const handleAcceptCall = () => {
    if (!incomingCall) return;

    console.log("📞 MainContent: Accepting incoming call");

    // Set call type to mount VideoCall component
    // Note: We keep incomingCall set so VideoCall can use it to accept the call
    setCallType(incomingCall.callType);

    // Don't clear incomingCall here - VideoCall will clear it after accepting
  };

  // Handle decline call
  const handleDeclineCall = () => {
    if (!incomingCall) return;

    console.log("📞 MainContent: Declining incoming call");

    // Send call-end signal to caller
    sendSignal({
      type: "call-end",
      target_id: incomingCall.callerId,
      data: {},
      timestamp: new Date().toISOString(),
    });

    // Clear incoming call notification
    setIncomingCall(null);
    incomingCallRef.current = false;
  };

  return (
    <div className={`flex ${callType ? "flex-row" : "flex-col"} w-full h-full`}>
      <div className={`flex flex-col ${callType ? "w-2/3" : "w-full"} h-full`}>
        <ContentHeader />
        <div className="flex-1 overflow-hidden">
          {activeTab === "private-space" && selectedGroupId ? (
            groupSubTab === "tasks" ? (
              <GroupTasks groupId={selectedGroupId} />
            ) : (
              <GroupMessages groupId={selectedGroupId} />
            )
          ) : activeTab === "groups" && selectedGroupId ? (
            groupSubTab === "tasks" ? (
              <GroupTasks groupId={selectedGroupId} />
            ) : (
              <GroupMessages groupId={selectedGroupId} />
            )
          ) : activeTab === "direct-messages" && selectedGroupId ? (
            groupSubTab === "tasks" ? (
              <GroupTasks groupId={selectedGroupId} />
            ) : (
              <GroupMessages groupId={selectedGroupId} />
            )
          ) : activeTab === "direct-messages" ? (
            <DirectMessages />
          ) : activeTab === "messages" ? (
            messagesSubTab === "invitations" ? (
              <InvitationsView />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">
                    No messages to display
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Messages content coming soon
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  No content to display
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeTab === "groups"
                    ? "Select a group from the sidebar"
                    : "Content for this section coming soon"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {callType && (
        <div className="w-1/3 h-full border-l border-border">
          <VideoCall callType={callType} onEndCall={() => setCallType(null)} />
        </div>
      )}

      {/* Incoming Call Notification */}
      {incomingCall && !callType && (
        <IncomingCallNotification
          callerName={incomingCall.callerName}
          callType={incomingCall.callType}
          onAccept={handleAcceptCall}
          onDecline={handleDeclineCall}
        />
      )}
    </div>
  );
};
