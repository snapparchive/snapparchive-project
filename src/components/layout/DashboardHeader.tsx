'use client';

import { Menu, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="flex h-16 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold">SnappArchive</span>
        </div>
      </div>
    </header>
  );
}
