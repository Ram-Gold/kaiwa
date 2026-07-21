export default function Sticker({ children, color = 'bg-mustard', className = '' }) {
  return (
    <span
      className={`brutal-border inline-flex rotate-[-2deg] items-center px-3 py-1 font-mono text-xs font-black uppercase tracking-[0.16em] shadow-shadow ${color} ${className}`}
    >
      {children}
    </span>
  );
}
