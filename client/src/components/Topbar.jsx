"use client";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { Bell, User } from "lucide-react";
import { useState, useEffect, useState as useReactState } from "react";

const Topbar = () => {
  const { isAuthenticated, username } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  // 👇 Add this to make sure we render only after client is ready
  const [mounted, setMounted] = useReactState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // avoid mismatch

  if (!isAuthenticated) return null;

  return (
    <div className="flex justify-between items-center bg-white border-b border-gray-300 px-12 py-3">
      <h1 className="text-lg font-semibold primaryText">Admin Dashboard</h1>

      <div className="flex items-center space-x-4 relative">
        <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
        <div
          className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <User className="w-6 h-6 text-gray-600 cursor-pointer" />
          {open && (
            <div className="absolute z-9 right-0 w-40 bg-white border rounded-lg shadow-lg">
              <p className="px-4 py-2 text-gray-700 border-b">👋 {username}</p>
              <button
                onClick={() => dispatch(logout())}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
