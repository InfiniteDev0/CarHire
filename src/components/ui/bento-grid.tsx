import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

interface BentoGridProps extends ComponentPropsWithoutRef<'div'> {
  children?: ReactNode;
  className?: string;
}

interface BentoCardProps {
  [key: string]: unknown;
  name: string;
  className: string;
  background: ReactNode;
  Icon: ElementType;
  description: string;
  href?: string;
  cta?: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => {
  return (
    <div
      className={cn('grid w-full auto-rows-[16rem] grid-cols-3 gap-4 md:gap-3', className)}
      {...props}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  ...props
}: BentoCardProps) => (
  <div
    key={name}
    className={cn(
      'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-lg',
      // light styles
      'bg-background [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_1px_2px_rgba(0,0,0,.05),0_6px_12px_rgba(0,0,0,.05)]',
      // dark styles
      'dark:bg-background transform-gpu dark:[box-shadow:0_-10px_40px_-10px_#ffffff1f_inset] dark:[border:1px_solid_rgba(255,255,255,.1)]',
      className
    )}
    {...props}
  >
    <div>{background}</div>
    <div className="p-3">
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-6">
        <Icon className="h-8 w-8 origin-left transform-gpu text-neutral-700 transition-all duration-300 ease-in-out group-hover:scale-75" />
        <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">{name}</h3>
        <p className="max-w-md text-sm text-neutral-400">{description}</p>
      </div>
    </div>
  </div>
);

export { BentoCard, BentoGrid };
