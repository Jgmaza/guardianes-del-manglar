import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'bg-[var(--gdm-mangrove)] text-white hover:bg-[var(--gdm-tide)]'
      : 'border border-[var(--gdm-mangrove)] text-[var(--gdm-mangrove)] hover:bg-white/70';

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
