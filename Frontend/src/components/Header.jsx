import React from "react";
import { Search, Bell } from "lucide-react";

const Header = ({ user }) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-8 py-3.5 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3 bg-slate-100/70 border border-slate-200/60 rounded-xl px-3 py-1.5 w-72">
        <Search size={15} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search reports or profiles..."
          className="bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none w-full font-medium"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="w-9 h-9 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <Bell size={16} />
        </button>
        <div className="h-4 w-px bg-slate-200" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
            {user?.username?.charAt(0).toUpperCase() || "N"}
          </div>
          <span className="text-xs font-bold text-slate-700">
            {user?.username || "Nishant Nikhil"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
