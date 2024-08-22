"use client";

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

type ClientSidebarWrapperProps = {
  children: ReactNode;
};

export default function ClientSidebarWrapper({ children }: ClientSidebarWrapperProps) {
  const pathname = usePathname();
  const showSidebar = !pathname.startsWith('/create-app');

  if (!showSidebar) {
    return null;
  }

  return <>{children}</>;
}