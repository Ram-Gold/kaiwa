import { useState } from 'react';
import { IoSparklesSharp, IoCheckmarkSharp, IoCloseSharp } from 'react-icons/io5';
import { cn } from '../../lib/utils.js';

const TIER_DATA = [
  {
    feature: 'Roleplay (limited turns)',
    free: '5 turns/day',
    registered: 'Unlimited',
    pro: 'Unlimited',
  },
  {
    feature: 'JLPT Dictionary lookup',
    free: true,
    registered: true,
    pro: true,
  },
  {
    feature: 'AI Provider',
    free: 'Server proxy (Gemini Flash)',
    registered: 'BYOK or proxy',
    pro: 'BYOK + higher rate limit',
  },
  {
    feature: 'Progress tracking',
    free: false,
    registered: '✓ (Firestore)',
    pro: '✓ (Firestore)',
  },
  {
    feature: 'Profile',
    free: false,
    registered: true,
    pro: true,
  },
  {
    feature: 'Scenario history',
    free: false,
    registered: 'Last 30',
    pro: 'Unlimited',
  },
  {
    feature: 'Custom scenarios',
    free: false,
    registered: false,
    pro: true,
  },
];

function RenderCellVal(val) {
  if (val === true) {
    return <span className="font-mono text-base font-black text-emerald-600">✓</span>;
  }
  if (val === false) {
    return <span className="font-mono text-base font-black text-rose-500">x</span>;
  }
  return <span>{val}</span>;
}

export default function SubscriptionSettings() {
  // Mock active user tier (can be 'free', 'registered', or 'pro')
  const [userTier, setUserTier] = useState('registered');
  const [showNotice, setShowNotice] = useState(false);

  const handleUpgrade = () => {
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 3000);
  };

  return (
    <div className="space-y-4 text-ink">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-2 border-b-2 border-ink/10">
        <div>
          <p className="label-mono text-correction">Account Tier & Limits</p>
          <h3 className="mt-1 font-display text-4xl leading-none">Subscription</h3>
        </div>

        {/* Upgrade Button & Tag */}
        <div className="flex items-center gap-2">
          <div className="brutal-border bg-mustard px-3 py-1 font-mono text-xs font-black uppercase">
            Plan: {userTier}
          </div>
          {userTier !== 'pro' && (
            <button
              type="button"
              onClick={handleUpgrade}
              className="brutal-border bg-shu text-paper px-3 py-1.5 font-mono text-xs font-black uppercase shadow-nav hover:bg-mustard hover:text-ink transition-all flex items-center gap-1.5 active:scale-95"
            >
              <IoSparklesSharp /> Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      {showNotice && (
        <div className="brutal-border bg-mustard p-3 font-mono text-xs font-black uppercase text-ink shadow-nav animate-panel-in flex items-center justify-between">
          <span>Upgrade triggered! Redirecting to checkout portal...</span>
          <button type="button" onClick={() => setShowNotice(false)}>
            <IoCloseSharp />
          </button>
        </div>
      )}

      {/* Tier Definition Chart */}
      <div className="mt-2">
        <h4 className="font-display text-lg leading-none mb-2">Tier Definition</h4>
        <div className="brutal-border bg-white overflow-hidden shadow-nav">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b-[3px] border-ink bg-paper">
                  <th className="p-3 border-r-[2px] border-ink font-black uppercase">Feature</th>
                  <th className="p-3 border-r-[2px] border-ink font-black uppercase bg-paper/50">Free (Guest)</th>
                  <th className={cn("p-3 border-r-[2px] border-ink font-black uppercase", userTier === 'registered' && "bg-mustard/30")}>
                    Registered {userTier === 'registered' && '(Current)'}
                  </th>
                  <th className={cn("p-3 font-black uppercase", userTier === 'pro' && "bg-mustard/30")}>
                    Pro {userTier === 'pro' && '(Current)'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-[2px] divide-ink/20">
                {TIER_DATA.map((row, idx) => (
                  <tr key={idx} className="hover:bg-paper/40 transition-colors">
                    <td className="p-3 border-r-[2px] border-ink font-bold text-ink">{row.feature}</td>
                    <td className="p-3 border-r-[2px] border-ink font-bold text-ink/75 bg-paper/20">
                      {RenderCellVal(row.free)}
                    </td>
                    <td className={cn("p-3 border-r-[2px] border-ink font-bold text-ink", userTier === 'registered' && "bg-mustard/10")}>
                      {RenderCellVal(row.registered)}
                    </td>
                    <td className={cn("p-3 font-bold text-ink", userTier === 'pro' && "bg-mustard/10")}>
                      {RenderCellVal(row.pro)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
