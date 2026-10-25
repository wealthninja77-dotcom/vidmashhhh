import React from 'react';

interface NavbarProps {
  onOpenPresentation?: () => void;
  onPrint?: () => void;
  activeDocTitle?: string;
  onScrollToDemo?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenPresentation,
  onPrint,
  activeDocTitle,
  onScrollToDemo,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#F9F9F8]/80 backdrop-blur-md border-b border-[#E8E8E6]/80 transition-all">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        {/* Logo */}
        <a className="flex items-center gap-2.5 group cursor-pointer" href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <div className="w-8 h-8 rounded-full bg-[#111111] flex items-center justify-center text-white text-xs font-semibold tracking-tighter shadow-sm">
            VM
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#111111] group-hover:opacity-80 transition-opacity">
            VidMash
          </span>
        </a>

        {/* Center Minimal Links */}
        <nav className="hidden md:flex items-center space-x-8 text-[14px] text-[#575754] font-medium">
          <a className="hover:text-[#111111] transition-colors" href="#synthesis-engine">
            Synthesis Engine
          </a>
          <a className="hover:text-[#111111] transition-colors" href="#knowledge-dossier">
            Knowledge Dossier
          </a>
          <a className="hover:text-[#111111] transition-colors" href="#architecture">
            Architecture
          </a>
          <a
            className="hover:text-[#111111] transition-colors"
            href="https://github.com/wealthninja77-dotcom/vidmash"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          {activeDocTitle && (
            <>
              {onOpenPresentation && (
                <button
                  type="button"
                  onClick={onOpenPresentation}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-[#575754] hover:text-[#111111] bg-white border border-[#E8E8E6] hover:border-neutral-400 transition shadow-sm"
                  title="Present as Executive Slides"
                >
                  <span className="material-symbols-outlined text-[17px]">present_to_all</span>
                  <span>Slides</span>
                </button>
              )}

              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-[#575754] hover:text-[#111111] bg-white border border-[#E8E8E6] hover:border-neutral-400 transition shadow-sm"
                  title="Export High-Fidelity PDF / Print"
                >
                  <span className="material-symbols-outlined text-[17px]">print</span>
                  <span>Export PDF</span>
                </button>
              )}
            </>
          )}

          <a
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#111111] text-white text-[13px] font-medium tracking-tight hover:bg-neutral-800 transition-all shadow-sm cursor-pointer"
            href="#demo"
            onClick={onScrollToDemo}
          >
            Get started
          </a>
        </div>
      </div>
    </header>
  );
};
