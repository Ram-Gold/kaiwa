export default function Card({
  children,
  className = '',
  as: Component = 'section',
  surface = 'paper',
  ...props
}) {
  const surfaceClass = surface === 'paper' ? 'bg-paper text-ink' : '';

  return (
    <Component
      className={`brutal-border shadow-shadow ${surfaceClass} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
