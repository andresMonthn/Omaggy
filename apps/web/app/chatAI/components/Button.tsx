import React, { forwardRef } from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'neutral' | 'primary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  toggleTransparency?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'neutral', size = 'md', iconLeft, iconRight, disabled, children, toggleTransparency, onClick, ...props },
  ref
) {
  const base = 'inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white/20';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (toggleTransparency) {
      document.body.classList.toggle('transparent-mode');
    }
    if (onClick) onClick(e);
  };

  const variantCls =
    variant === 'primary'
      ? 'bg-white text-black hover:bg-neutral-200'
      : variant === 'ghost'
      ? 'bg-transparent text-neutral-300 hover:text-white'
      : 'text-neutral-400 hover:text-white bg-[#1a1a1a]/80 hover:bg-[#222] border border-white/10';

  const sizeCls =
    size === 'sm'
      ? 'px-3 py-1.5 text-sm'
      : size === 'lg'
      ? 'px-5 py-3 text-base'
      : 'px-4 py-2 text-sm';

  const disabledCls = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      ref={ref}
      className={cx(base, variantCls, sizeCls, disabledCls, className)}
      disabled={disabled}
      onClick={handleClick}
      {...props}
    >
      {iconLeft ? <span className="mr-2">{iconLeft}</span> : null}
      <span>{children}</span>
      {iconRight ? <span className="ml-2">{iconRight}</span> : null}
    </button>
  );
});

