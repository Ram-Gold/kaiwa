const variants = {
  primary: 'bg-shu text-paper shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none',
  secondary: 'bg-mustard text-ink shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none',
  ghost: 'bg-paper text-ink hover:bg-mustard',
  dark: 'bg-ink text-paper shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none',
};

export default function Button({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`brutal-border inline-flex items-center justify-center gap-2 px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.12em] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
