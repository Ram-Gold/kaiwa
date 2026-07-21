import { useEffect, useState } from 'react';

export default function AnimatedPopover({ show, children, className = '' }) {
  const [render, setRender] = useState(show);

  useEffect(() => {
    if (show) setRender(true);
  }, [show]);

  const onAnimationEnd = () => {
    if (!show) setRender(false);
  };

  return render ? (
    <div
      className={`${show ? 'animate-panel-in' : 'animate-panel-out'} ${className}`}
      onAnimationEnd={onAnimationEnd}
    >
      {children}
    </div>
  ) : null;
}
