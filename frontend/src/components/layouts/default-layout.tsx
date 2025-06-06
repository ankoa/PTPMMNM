import { Outlet } from "react-router-dom";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarProvider, SidebarInset } from "../ui/sidebar";
import AppNavbar from "../app/app-navbar";
import AppFooter from "../app/app-footer";
import { createContext, useState } from "react";

export const AppSideBarContext = createContext<{
  sidebarOpen: boolean;
  setSidebarOpen: (state: boolean) => void;
}>({
  sidebarOpen: true,
  setSidebarOpen: () => {},
});

function DefaultLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <AppSideBarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
      <div className="flex-col">
        <SidebarProvider
          open={sidebarOpen}
          className="min-h-[calc(100vh-4rem)]"
          style={
            {
              "--sidebar-width": "20rem",
              "--sidebar-width-icon": "4rem",
            } as React.CSSProperties
          }
        >
          <AppNavbar />

          <main className="mt-16 ml-2 flex max-h-[calc(100vh-8rem)] w-full flex-1">
            <AppSidebar className="mt-16 max-h-[calc(100vh-8rem)]" />
            <SidebarInset className="bg-primary-foreground m-2 ml-0 flex-1 overflow-auto rounded-md">
              <Outlet />
            </SidebarInset>
          </main>
        </SidebarProvider>
        <AppFooter />
      </div>
    </AppSideBarContext.Provider>
  );
}

export default DefaultLayout;
