import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import SignupForm from "../components/SignupForm";

export default function Homepage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    // Redirect to dashboard
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <div className="text-center mb-2">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
            Remindly
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Never miss a task again
          </p>
        </div>

        <div className="w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
          {isLogin ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToSignup={() => setIsLogin(false)}
            />
          ) : (
            <SignupForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
        </div>

        <div className="flex justify-center gap-4 flex-wrap pt-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-purple-600">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[10px]">
              ✓
            </span>
            <span>Task Management</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 flex items-center justify-center text-white text-[10px]">
              ✓
            </span>
            <span>Team Collaboration</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-pink-600">
            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white text-[10px]">
              ✓
            </span>
            <span>Smart Reminders</span>
          </div>
        </div>
      </div>
    </div>
  );
}

