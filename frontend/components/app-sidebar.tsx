"use client";

import { Home, BookOpen, GraduationCap, Brain } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { View } from "@/lib/types";

interface AppSidebarProps {
  view?: View;
  onNavigate?: (view: View) => void;
}

export function AppSidebar({ view = "generate", onNavigate }: AppSidebarProps) {
  const items = [
    {
      title: "Generate",
      icon: Home,
      value: "generate" as const,
    },
    {
      title: "Review",
      icon: BookOpen,
      value: "review" as const,
    },
    {
      title: "Practice",
      icon: GraduationCap,
      value: "practice" as const,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-2">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold">Model Similarity</h2>
              <p className="text-xs text-muted-foreground">AI Response Comparator</p>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={view === item.value}
                    onClick={() => onNavigate?.(item.value)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
