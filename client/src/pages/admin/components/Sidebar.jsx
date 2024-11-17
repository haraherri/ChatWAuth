import { NavLink } from "react-router-dom";
import { Users, Lock, MessageCircle } from "lucide-react";

const SidebarLink = ({ to, icon: Icon, children }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
      }`
    }
  >
    <Icon className="h-5 w-5" />
    <span>{children}</span>
  </NavLink>
);

const Sidebar = () => {
  return (
    <aside className="w-64 border-r h-screen">
      <div className="p-6">
        <h2 className="text-xl font-bold">Chat App</h2>
      </div>

      <nav className="space-y-2 px-3">
        <SidebarLink to="/admin/users" icon={Users}>
          Users
        </SidebarLink>
        <SidebarLink to="/admin/rooms" icon={MessageCircle}>
          Rooms
        </SidebarLink>
        <SidebarLink to="/admin/change-password" icon={Lock}>
          Change Password
        </SidebarLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
