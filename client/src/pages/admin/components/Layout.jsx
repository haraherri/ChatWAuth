import { Outlet } from "react-router-dom";
import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const AdminLayout = () => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="h-screen flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar closeMobileMenu={() => setShowMobileSidebar(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setShowMobileSidebar(true)} />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
