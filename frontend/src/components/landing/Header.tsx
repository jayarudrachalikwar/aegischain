import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { NeonButton } from '../common/NeonButton';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { label: 'Solutions', href: '#solutions' },
    { label: 'Threat Vectors', href: '#vulnerabilities' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Roles', href: '#roles' },
    { label: 'Verification', href: '#verification' },
  ];

  return (
    <>
      {/* Floating Centered Pill Navbar matching Image 1 */}
      <div className="fixed top-4 sm:top-6 left-0 right-0 z-50 flex justify-center px-4 sm:px-6 pointer-events-none">
        <header
          className={`pointer-events-auto w-full max-w-[980px] h-[54px] sm:h-[58px] px-4 sm:px-6 flex items-center justify-between rounded-full transition-all duration-200 border border-black/[0.08] ${
            scrolled
              ? 'bg-[#f3f3f3]/90 backdrop-blur-md shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)]'
              : 'bg-[#f0f0f0]/80 backdrop-blur-md'
          }`}
        >
          {/* Left: Wordmark in bold tempo styling */}
          <a
            href="#"
            className="flex items-center gap-2 text-[#0d0d0d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d0d0d]"
          >
            <span className="font-extrabold tracking-[-0.8px] text-[17px] sm:text-[19px] uppercase font-sans">
              aegis<span className="text-[#0d0d0d]/70 font-normal">chain</span>
            </span>
            <span className="text-[9px] uppercase font-mono tracking-[0.08em] px-2 py-0.5 rounded-full bg-black/[0.05] text-[#4d4d4d] hidden sm:inline-block">
              BEL
            </span>
          </a>

          {/* Center: Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[14px] font-[450] text-[#4d4d4d]">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-[#0d0d0d] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d0d0d]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: Solid Black Pill CTA + Mobile toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <NeonButton
              as="link"
              to="/dashboard"
              variant="primary"
              pill={true}
              neonColor="#00E5FF"
              className="px-4 sm:px-5 py-1.5 sm:py-2 text-[13px] sm:text-[14px] font-[500]"
            >
              Enter Vault
            </NeonButton>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-[38px] h-[38px] flex flex-col items-center justify-center gap-1.5 text-[#0d0d0d] rounded-full hover:bg-black/[0.05] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d0d0d]"
            >
              <span
                className={`w-4 h-[1.5px] bg-[#0d0d0d] transition-transform duration-200 ${
                  mobileMenuOpen ? 'rotate-45 translate-y-[4.5px]' : ''
                }`}
              />
              <span
                className={`w-4 h-[1.5px] bg-[#0d0d0d] transition-transform duration-200 ${
                  mobileMenuOpen ? '-rotate-45 -translate-y-[3px]' : ''
                }`}
              />
            </button>
          </div>
        </header>
      </div>

      {/* Mobile Full-Screen Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#f3f3f3] pt-[95px] px-6 pb-12 flex flex-col justify-between overflow-y-auto md:hidden">
          <nav className="flex flex-col gap-5 py-4">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-[26px] font-[300] tracking-[-0.6px] text-[#0d0d0d] hover:text-[#4d4d4d] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-8 border-t border-black/[0.08] flex flex-col gap-4">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-[#0d0d0d] text-[#ffffff] px-6 py-3.5 rounded-full text-[15px] font-[500] tracking-[0.02em]"
            >
              Enter Defence Vault
            </Link>
            <p className="text-[12px] text-[#909090] text-center font-mono">
              Bharat Electronics Limited · Sovereign Defence Infrastructure
            </p>
          </div>
        </div>
      )}
    </>
  );
};
