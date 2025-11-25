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
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[480px] flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold mb-2 text-slate-900 tracking-tight">
            Remindly
          </h1>
          <p className="text-sm text-indigo-600 max-w-md mx-auto">
            Never miss a task again. Organize, collaborate, and stay on top of
            your reminders with your team.
          </p>
        </div>

        <div className="w-full">
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

        <div className="flex justify-center gap-6 flex-wrap pt-6 border-t border-purple-200">
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
              ✓
            </span>
            <span>Task Management</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
              ✓
            </span>
            <span>Team Collaboration</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
              ✓
            </span>
            <span>Smart Reminders</span>
          </div>
        </div>
      </div>
    </div>
  );
}

