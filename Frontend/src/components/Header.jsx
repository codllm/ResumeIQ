import React, { useState,useContext } from "react";
import { Bell, ChevronDown, LogOut, Menu, X, ScanLine } from "lucide-react";
import { sidebarNav } from "./Sidebar";
import {logoutUserApi} from "../api/user.api"
import { useNavigate } from "react-router";
import {UserContext} from "../context/user.context"

const Header = ({ user, activeNav, setActiveNav, showBrandOnDesktop = false }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const {setUser} = useContext(UserContext)

  const initial = user?.username?.charAt(0).toUpperCase() || "N";
  const username = user?.username || "Nishant Nikhil";
  const navigate = useNavigate()
  const onLogout =async()=>{

    const token = localStorage.getItem("resumeiq_token");

    console.log("user token on click",token)
    const res = await logoutUserApi(token);
    console.log(res.message)
    if(res.success)
    {
      localStorage.removeItem("resumeiq_token");
      localStorage.removeItem("active_profile_id");
      setUser(null);
      navigate('/landing')
    }
  }

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 sm:px-8 py-3 flex items-center justify-between sticky top-0 z-30 transition-all print:hidden">
      {/* Mobile Brand */}
      <div className={`flex items-center gap-2 ${showBrandOnDesktop ? "" : "md:hidden"}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
          <ScanLine size={16} />
        </div>
        <span className="text-xl font-extrabold tracking-tight text-slate-900">
          Resume<span className="text-emerald-600">IQ</span>
        </span>
      </div>

      {/* Right Controls Section */}
      <div className="flex items-center gap-3 justify-end ml-auto">
        <div className="relative md:hidden">
          <button
            type="button"
            aria-label={showMobileMenu ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={showMobileMenu}
            onClick={() => setShowMobileMenu((previous) => !previous)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200/80 bg-white text-gray-600 shadow-xs transition hover:bg-gray-50 hover:text-gray-900"
          >
            <span className="relative flex h-[18px] w-[18px] items-center justify-center">
              <Menu
                size={18}
                className={`absolute transition-all duration-300 ease-in-out ${
                  showMobileMenu
                    ? "rotate-90 scale-75 opacity-0"
                    : "rotate-0 scale-100 opacity-100"
                }`}
              />
              <X
                size={18}
                className={`absolute transition-all duration-300 ease-in-out ${
                  showMobileMenu
                    ? "rotate-0 scale-100 opacity-100"
                    : "-rotate-90 scale-75 opacity-0"
                }`}
              />
            </span>
          </button>

          {showMobileMenu && (
            <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10">
              <p className="px-3 pb-2 pt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Navigate
              </p>
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const isSelected = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setShowMobileMenu(false);
                      setActiveNav(item.id);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-extrabold transition ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} className={isSelected ? "text-emerald-600" : "text-slate-400"} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notification Bell with Active Indicator */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-xl border border-gray-200/80 bg-white flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer shadow-xs"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-gray-200/80 mx-1" />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 pr-2.5 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200/80 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#00875A] text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              {initial}
            </div>
            <span className="text-xs font-bold text-gray-800 tracking-tight hidden sm:inline-block">
              {username}
            </span>
            <ChevronDown size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-950/5 py-1.5 text-xs text-gray-700 animate-in fade-in slide-in-from-top-2 duration-150 z-40">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="font-bold text-gray-900 truncate">{username}</p>
                <p className="text-[11px] text-gray-400 font-medium truncate">{user?.email || "user@resumeiq.ai"}</p>
              </div>

              <div className="my-1 border-t border-gray-100" />

              <button
                type="button"
                onClick={onLogout}
                className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-rose-50 text-rose-600 font-bold transition cursor-pointer"
              >
                <LogOut size={14} className="text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
