'use client';
import { useEffect, useRef, useState } from 'react';

const MAP_SRC = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3674.8!2d-42.007428!3d-22.8722589!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x97053ef8f2d339%3A0x5bac07988b0fb02c!2sMarina%20Prize%20Club%20-%20Churrascaria%20Ogiva%20-%20Cabo%20Frio!5e0!3m2!1spt-BR!2sbr!4v1712800000000';

export default function MapSection() {
  const ref = useRef<HTMLElement>(null);
  const [src, setSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSrc(MAP_SRC);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="w-full h-[280px] sm:h-[340px] lg:h-[380px]">
      {src && (
        <iframe
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Marina Prize Club - Cabo Frio"
        />
      )}
    </section>
  );
}
