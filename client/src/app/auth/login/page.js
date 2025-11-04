"use client";
import { useState } from "react";
import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const dispatch = useDispatch();
  const router = useRouter();

  const { loading, error } = useSelector((state) => state.auth);

  const handleLogin = async () => {
    const result = await dispatch(loginUser({ email, password }));

    if (loginUser.fulfilled.match(result)) {
      router.push("/admin/overview");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-10">
        <div className="w-full max-w-sm space-y-6">
          <h2 className="text-2xl font-bold text-center primaryText">Admin Login</h2>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#33A6DB] text-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border text-gray-700 border-[#33A6DB] p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* 👁️ Eye Toggle */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </div>

      {/* Right Side - Logo */}
      <div className="flex-1 flex justify-center items-center bg-white">
        <Image
          src="/assets/logo/logo.png" // replace with your logo
          alt="Big Logo"
          width={500}
          height={500}
          priority
        />
      </div>
    </div>
  );
}
