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
      : 'border-2 border-[var(--gdm-mangrove)] bg-white text-[var(--gdm-mangrove)] hover:bg-emerald-50';

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
