import React from "react";
import {
  ScanLine,
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
      <div className="space-y-10">
        {/* Logo Brand */}
        <div
          className="flex items-center gap-2.5 px-2 cursor-pointer"
          onClick={() => {
            setActiveNav("dashboard");
            navigate("/dashboard");
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/20">
            <ScanLine size={18} />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            Resume<span className="text-emerald-600">IQ</span>
          </span>
        </div>

        {/* Nav Items */}
        <nav className="space-y-7">
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
      
    </aside>
  );
};

export default Sidebar;
