import React from 'react';
import { Outlet } from 'react-router-dom';

export const LandingLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#4d4d4d] font-sans antialiased selection:bg-[#0d0d0d] selection:text-[#ffffff] relative">
      <Outlet />
    </div>
  );
};
