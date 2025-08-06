"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";

export const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "petugas">("admin");

  const { handleLogin, loading, message } = useAuth();

  return (
    <div className="bg-[#e0e5ec] shadow-[inset_8px_8px_16px_#bebebe,inset_-8px_-8px_16px_#ffffff] rounded-2xl p-8 w-[90%] max-w-md h-full">
      <h2 className="text-center text-2xl font-semibold mb-6">Login</h2>

      <div className="mb-4">
        <label className="block mb-1">Username</label>
        <input
          type="text"
          className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_10px_#bebebe,inset_-4px_-4px_10px_#ffffff] outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Password</label>
        <input
          type="password"
          className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_10px_#bebebe,inset_-4px_-4px_10px_#ffffff] outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-1">Login Sebagai:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "admin" | "petugas")}
          className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_10px_#bebebe,inset_-4px_-4px_10px_#ffffff] outline-none"
          disabled={loading}
        >
          <option value="admin">Admin</option>
          <option value="petugas">Petugas</option>
        </select>
      </div>

      <button
        onClick={() => handleLogin(username, password, role)}
        className="w-full mt-4 p-3 rounded-xl bg-[#e0e5ec] text-gray-800 shadow-[4px_4px_10px_#bebebe,-4px_-4px_10px_#ffffff] font-semibold hover:scale-[1.02] transition disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Loading..." : "Login"}
      </button>

      {message && <p className="text-center text-sm mt-4">{message}</p>}
    </div>
  );
};
