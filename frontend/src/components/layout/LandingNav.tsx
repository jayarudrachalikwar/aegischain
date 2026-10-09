import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Menu, X } from 'lucide-react';

export const LandingNav: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#bel-problem', label: '01 The Problem' },
    { href: '#solution', label: '02 Architecture' },
    { href: '#roles', label: '03 Separation of Duties' },
    { href: '#demo', label: '04 Live Verification' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 border-b-2 border-bel-navy ${
        scrolled ? 'bg-parchment/95 backdrop-blur-sm py-2.5 shadow-ink-sm' : 'bg-parchment py-3.5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 bg-bel-navy text-parchment border border-bel-navy flex items-center justify-center font-mono font-bold text-xs shadow-ink-sm group-hover:bg-muted-blue group-hover:text-bel-navy transition-colors">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-mono text-sm tracking-widest font-black uppercase text-bel-navy">
            AEGIS<span className="text-muted-blue">CHAIN</span>
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.5 bg-bel-navy/10 text-bel-navy border border-bel-navy/30 font-semibold tracking-wider hidden sm:inline-block">
            BEL DEFENCE
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 font-mono text-xs text-bel-navy tracking-wider">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-muted-blue transition-colors uppercase font-bold hover:underline underline-offset-4"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right CTA Button */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="px-3.5 py-1.5 font-mono text-xs font-bold uppercase bg-bel-navy hover:bg-bel-navy-light text-parchment border-[1.5px] border-bel-navy shadow-ink-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all inline-flex items-center gap-1.5"
          >
            <span>Enter Vault</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-blue" />
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-bel-navy hover:text-muted-blue focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-parchment-light border-b-2 border-bel-navy px-4 py-4 space-y-3 font-mono text-xs shadow-ink">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-bel-navy hover:text-muted-blue uppercase font-bold"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-bel-navy/20">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2 bg-bel-navy text-parchment border border-bel-navy font-bold uppercase shadow-ink-sm"
            >
              Enter Defence Vault
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
