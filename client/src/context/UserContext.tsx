import React, { createContext, useContext, useState, ReactNode } from "react";
import { apiConfig } from "@/config/api";

export interface RolePermissions {
  [role: string]: string[]; // Maps role to array of roles it can modify
}

interface User {
  id: string;
  name: string;
  email: string;
  token: string;
  rolePermissions?: RolePermissions; // Maps role to array of modifiable roles
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  fetchUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userState, setUserState] = useState<User | null>(() => {
    // Try to load user from localStorage on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setUser = (userData: User | null) => {
    setUserState(userData);
    if (userData) {
      // Store token in localStorage for API calls
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  const logout = async () => {
    const token = localStorage.getItem("token");

    // Call backend logout API if token exists
    if (token) {
      try {
        await fetch(`${apiConfig.baseURL}/api/logout`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (err) {
        // Continue with logout even if API call fails
        console.error("Logout API call failed:", err);
      }
    }

    // Clear all user data
    setUser(null);

    // Clear all localStorage items
    localStorage.clear();
  };

  const fetchUserData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(apiConfig.users.me, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();

      // Get current user from state or localStorage
      let currentUser = userState;
      if (!currentUser) {
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            currentUser = JSON.parse(stored);
          } catch {
            return;
          }
        }
      }

      if (!currentUser) return;

      const updatedUser = {
        ...currentUser,
        rolePermissions: data.role_permissions as RolePermissions,
      };

      setUserState(updatedUser);
      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to fetch user data:", err);
    }
  };

  return (
    <UserContext.Provider
      value={{ user: userState, setUser, logout, fetchUserData }}
    >
      {children}
    </UserContext.Provider>
  );
};
