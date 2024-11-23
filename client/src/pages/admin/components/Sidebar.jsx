import { NavLink } from "react-router-dom";
import { Users, Lock, MessageCircle, LayoutDashboard } from "lucide-react";

const SidebarLink = ({ to, icon: Icon, children, end = false, onClick }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
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

const Sidebar = ({ closeMobileMenu }) => {
  const handleLinkClick = () => {
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <aside className="w-64 border-r h-screen bg-background">
      <div className="p-6">
        <h2 className="text-xl font-bold">Chat App</h2>
      </div>

      <nav className="space-y-2 px-3">
        <SidebarLink
          to="/admin"
          icon={LayoutDashboard}
          end
          onClick={handleLinkClick}
        >
          Dashboard
        </SidebarLink>
        <SidebarLink to="/admin/users" icon={Users} onClick={handleLinkClick}>
          Users
        </SidebarLink>
        <SidebarLink
          to="/admin/rooms"
          icon={MessageCircle}
          onClick={handleLinkClick}
        >
          Rooms
        </SidebarLink>
        <SidebarLink
          to="/admin/change-password"
          icon={Lock}
          onClick={handleLinkClick}
        >
          Change Password
        </SidebarLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
