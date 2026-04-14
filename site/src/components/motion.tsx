'use client';

import { useRef, useEffect, ReactNode } from 'react';

function useReveal(ref: React.RefObject<HTMLElement | null>, once = true, margin = '-60px') {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          if (once) observer.disconnect();
        } else if (!once) {
          el.classList.remove('is-visible');
        }
      },
      { rootMargin: margin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, once, margin]);
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  once?: boolean;
}

export function FadeIn({ children, delay = 0, direction = 'up', className = '', once = true }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, once);

  const dirClass = direction === 'left' ? 'from-left' : direction === 'right' ? 'from-right' : direction === 'none' ? 'from-none' : '';

  return (
    <div
      ref={ref}
      className={`reveal ${dirClass} ${className}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}

export function StaggerContainer({ children, className = '', stagger = 0.1 }: { children: ReactNode; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);

  return (
    <div ref={ref} className={`reveal from-none ${className}`}>
      {children}
    </div>
  );
}

export function StaggerItem({ children, className = '' }: { children: ReactNode; className?: string; index?: number }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
