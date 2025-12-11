import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { GroupProvider } from "./context/GroupContext";
import { SidebarProvider } from "./context/SidebarContext";
import { ThemeProvider } from "./context/ThemeContext";
import Homepage from "./routes/Homepage";
import Dashboard from "./routes/Dashboard";
import "./App.css";

function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <GroupProvider>
          <SidebarProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Router>
          </SidebarProvider>
        </GroupProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
