"use client";

import { Home, Brain, FileText, Grid3x3, Sparkles, Palette } from "lucide-react";
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import { View } from "@/lib/types";

interface AppSidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export function AppSidebar({ currentView, onNavigate }: AppSidebarProps) {
  const items = [
    {
      title: "Generate",
      icon: Home,
      view: "generate" as View,
    },
    {
      title: "Batch Runner",
      icon: Grid3x3,
      view: "batch" as View,
    },
    {
      title: "Visualize",
      icon: Sparkles,
      view: "visualize" as View,
    },
    {
      title: "Practice",
      icon: Brain,
      view: "practice" as View,
    },
    {
      title: "Review",
      icon: FileText,
      view: "review" as View,
    },
    {
      title: "Design Inspo",
      icon: Palette,
      view: "design" as View,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Model Similarity</span>
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
                    onClick={() => onNavigate(item.view)}
                    isActive={currentView === item.view}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground">
          Practice identifying AI models
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
