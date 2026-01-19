import { FC } from "react";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IncomingCallNotificationProps {
  callerName: string;
  callType: "audio" | "video";
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallNotification: FC<IncomingCallNotificationProps> = ({
  callerName,
  callType,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg p-8 max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Caller Avatar/Icon */}
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            {callType === "video" ? (
              <Video className="h-12 w-12 text-primary" />
            ) : (
              <Mic className="h-12 w-12 text-primary" />
            )}
          </div>

          {/* Caller Info */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Incoming Call</h2>
            <p className="text-lg text-muted-foreground">{callerName}</p>
            <p className="text-sm text-muted-foreground">
              {callType === "video" ? "Video Call" : "Audio Call"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 w-full">
            <Button
              variant="destructive"
              size="lg"
              className="flex-1 h-14 rounded-full"
              onClick={onDecline}
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Decline
            </Button>
            <Button
              variant="default"
              size="lg"
              className="flex-1 h-14 rounded-full bg-green-600 hover:bg-green-700"
              onClick={onAccept}
            >
              <Phone className="h-5 w-5 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
