import React from 'react';
import { Outlet } from 'react-router-dom';
import { LandingNav } from './LandingNav';
import { Footer } from './Footer';

export const LandingLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-parchment text-bel-navy font-sans bg-blueprint-grid selection:bg-bel-navy selection:text-parchment relative">
      <LandingNav />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16 sm:pt-20 pb-12">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
