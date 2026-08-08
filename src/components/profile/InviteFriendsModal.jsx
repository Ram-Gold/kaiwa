'use client';

import { useState } from 'react';
import {
  IoCloseSharp,
  IoCopySharp,
  IoCheckmarkSharp,
  IoLogoTwitter,
  IoLogoFacebook,
  IoQrCodeSharp,
  IoTicketSharp
} from 'react-icons/io5';
import { cn } from '../../lib/utils.js';

export default function InviteFriendsModal({ onClose }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/invite` : 'https://kaiwa.app/invite';

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent("Practice Japanese with me on KAIwa! It's unthrottled, dynamic AI roleplay practice.");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(inviteUrl)}`, '_blank');
  };

  const handleShareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-paper/50 backdrop-blur-[3px] p-4">
      <div className="relative w-full max-w-md brutal-border bg-paper text-ink p-6 shadow-shadow animate-panel-in">
        {/* Top Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute -top-3 -right-3 brutal-border grid h-9 w-9 place-items-center bg-white text-ink text-lg shadow-nav hover:bg-mustard transition-transform active:scale-95 z-10"
        >
          <IoCloseSharp />
        </button>

        <div className="space-y-4">
          {/* Ticket Perforated Header */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-ink/30 pb-3">
            <div className="flex items-center gap-2">
              <IoTicketSharp className="text-2xl text-shu" />
              <div>
                <span className="label-mono text-mustard bg-aizome px-1.5 py-0.5 text-[9px]">KAIWA PASS</span>
                <h4 className="font-display text-2xl leading-none">Friend Pass</h4>
              </div>
            </div>
            <span className="font-mono font-black text-xs text-ink/50 uppercase">招待コード</span>
          </div>

          <p className="text-xs font-bold text-ink/80 leading-relaxed text-center">
            Tell your friends it&apos;s cool to learn conversational Japanese in KAIwa!
          </p>

          {/* Copy Bar */}
          <div className="brutal-border bg-white p-2 flex items-center justify-between shadow-nav gap-2">
            <span className="font-mono text-xs font-bold truncate text-ink/80 px-1">{inviteUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className={cn(
                "brutal-border px-3 py-1.5 font-mono text-xs font-black uppercase transition-all shrink-0 active:scale-95",
                copied ? "bg-emerald-400 text-ink" : "bg-mustard text-ink hover:bg-shu hover:text-paper"
              )}
            >
              {copied ? 'Copied! ✓' : 'Copy'}
            </button>
          </div>

          {/* In-Person QR Code Toggle */}
          <div className="pt-1 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowQR(!showQR)}
              className="font-mono text-xs font-black uppercase text-ink/70 hover:text-shu flex items-center gap-1 transition-colors"
            >
              <IoQrCodeSharp /> {showQR ? 'Hide QR Code' : 'Show In-Person QR Code'}
            </button>
          </div>

          {showQR && (
            <div className="brutal-border bg-white p-4 text-center animate-panel-in space-y-2">
              <div className="mx-auto h-32 w-32 brutal-border bg-ink p-2 grid place-items-center">
                <div className="h-full w-full bg-white p-2 font-mono text-[9px] font-black break-all flex items-center justify-center text-center leading-tight">
                  [QR CODE FOR KAIWA INVITE LINK]
                </div>
              </div>
              <p className="font-mono text-[10px] font-bold text-ink/60">Scan with phone camera</p>
            </div>
          )}

          {/* Social Share Buttons */}
          <div className="border-t-2 border-ink/10 pt-3 space-y-2">
            <p className="font-mono text-[10px] font-black uppercase text-ink/50 text-center">Or share on</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleShareTwitter}
                className="brutal-border bg-white p-2.5 font-mono text-xs font-black uppercase tracking-wider text-ink shadow-nav hover:bg-sky-400 transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <IoLogoTwitter className="text-sm text-sky-500" /> X (Twitter)
              </button>
              <button
                type="button"
                onClick={handleShareFacebook}
                className="brutal-border bg-white p-2.5 font-mono text-xs font-black uppercase tracking-wider text-ink shadow-nav hover:bg-blue-600 hover:text-paper transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <IoLogoFacebook className="text-sm text-blue-600" /> Facebook
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
