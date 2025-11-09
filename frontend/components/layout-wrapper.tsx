"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { View } from "@/lib/types";

interface LayoutWrapperProps {
  children: React.ReactNode;
  view?: View;
  onNavigate?: (view: View) => void;
}

export function LayoutWrapper({ children, view, onNavigate }: LayoutWrapperProps) {
  return (
    <SidebarProvider>
      <AppSidebar view={view} onNavigate={onNavigate} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
