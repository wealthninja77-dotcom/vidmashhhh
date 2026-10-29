import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  onResetHome?: () => void;
  user?: FirebaseUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onOpenSavedDossiers?: () => void;
  savedCount?: number;
  activeDocumentTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onResetHome,
  user,
  onSignIn,
  onSignOut,
  onOpenSavedDossiers,
  savedCount = 0,
  activeDocumentTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#F7F6F2]/95 backdrop-blur-md border-b border-[#E2E0D8] no-print">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Masthead & Context Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onResetHome}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none shrink-0"
          >
            <div className="w-6 h-6 rounded bg-[#111111] flex items-center justify-center text-white text-[11px] font-mono font-semibold tracking-tighter">
              VM
            </div>
            <span className="font-semibold text-[15px] tracking-tight text-[#111111] group-hover:opacity-75 transition-opacity">
              VidMash
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-[#787670] border-l border-[#E2E0D8] pl-2.5">
              Monograph Engine
            </span>
          </button>

          {activeDocumentTitle && (
            <div className="hidden md:flex items-center gap-2 text-[12px] text-[#4A4945] min-w-0 border-l border-[#E2E0D8] pl-3">
              <span className="text-[#787670] font-mono uppercase text-[10px] tracking-wider shrink-0">
                Active Dossier
              </span>
              <span className="text-[#787670]">/</span>
              <span className="font-medium text-[#111111] truncate max-w-[340px]">
                {activeDocumentTitle}
              </span>
            </div>
          )}
        </div>

        {/* Right: Library Vault & Authentication */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenSavedDossiers && (
            <button
              type="button"
              onClick={onOpenSavedDossiers}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium text-[#111111] bg-white border border-[#E2E0D8] hover:border-[#111111] transition cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#4A4945]">
                library_books
              </span>
              <span>Vault</span>
              <span className="px-1.5 py-0.5 bg-[#EFECE6] text-[#111111] text-[10px] font-mono tabular-nums rounded font-semibold">
                {savedCount}
              </span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-2 pl-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-6 h-6 rounded border border-[#E2E0D8]"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-[#111111] text-white text-[11px] font-mono font-semibold flex items-center justify-center">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={onSignOut}
                className="text-[12px] text-[#4A4945] hover:text-[#111111] font-medium transition cursor-pointer"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111111] text-white text-[12px] font-medium hover:bg-neutral-800 transition cursor-pointer"
            >
              <span>Sign in</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
