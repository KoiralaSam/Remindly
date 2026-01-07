import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { GroupProvider } from "./context/GroupContext";
import { GroupMemberProvider } from "./context/GroupMemberContext";
import { InvitationProvider } from "./context/InvitationContext";
import { MessageProvider } from "./context/MessageContext";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { SignalingProvider } from "./context/SignalingContext";
import Homepage from "./routes/Homepage";
import Dashboard from "./routes/Dashboard";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <GroupProvider>
          <GroupMemberProvider>
            <InvitationProvider>
              <MessageProvider>
                <WebSocketProvider>
                  <SignalingProvider>
                    <SidebarProvider>
                      <Router>
                        <Routes>
                          <Route path="/" element={<Homepage />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route
                            path="*"
                            element={<Navigate to="/" replace />}
                          />
                        </Routes>
                      </Router>
                    </SidebarProvider>
                  </SignalingProvider>
                </WebSocketProvider>
              </MessageProvider>
            </InvitationProvider>
          </GroupMemberProvider>
        </GroupProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
