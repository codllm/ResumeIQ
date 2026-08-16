import React from "react";
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  Code2,
  Video,
  Settings,
  LogOut,
} from "lucide-react";

const Sidebar = ({ activeNav, setActiveNav, user, activeProfile, onLogout, navigate }) => {
  const sidebarNav = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "reports", label: "Resume Reports", icon: FileText },
    { id: "oa", label: "Online Assessment", icon: Code2 },
    { id: "interview", label: "Mock Interview", icon: Video },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen sticky top-0 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between shrink-0 hidden md:flex z-30">
      <div className="space-y-6">
        {/* Logo Brand */}
        <div
          className="flex items-center gap-2.5 px-2 cursor-pointer"
          onClick={() => {
            setActiveNav("dashboard");
            navigate("/dashboard");
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
            <Sparkles size={18} />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">
            Resume<span className="text-emerald-600">IQ</span>
          </span>
        </div>

        {/* Nav Items */}
        <nav className="space-y-1">
          {sidebarNav.map((item) => {
            const Icon = item.icon;
            const isSelected = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === "oa") {
                    navigate("/online-assessment");
                  } else if (item.id === "settings") {
                    navigate("/complete-profile");
                  } else {
                    setActiveNav(item.id);
                    navigate("/dashboard");
                  }
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200/60"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon
                  size={17}
                  className={isSelected ? "text-emerald-600" : "text-slate-400"}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Profile Footer */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {user?.username?.charAt(0).toUpperCase() || "N"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-800 truncate">
              {user?.username || user?.email || "Nishant Nikhil"}
            </p>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {activeProfile?.targetRole || "Software Engineer"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          title="Sign Out"
          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
