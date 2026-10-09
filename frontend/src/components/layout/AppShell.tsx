import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export const AppShell: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-parchment text-bel-navy font-sans bg-blueprint-grid selection:bg-bel-navy selection:text-parchment">
      <Header />

      <div className="flex-1 flex max-w-[1920px] w-full mx-auto relative">
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
};
