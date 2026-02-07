'use client';

import React from 'react';

export const Testimonials = () => {
  const cardsData = [
    {
      image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
      name: 'Briar Martin',
      handle: '@neilstellar',
      quote: 'Systemly made designing complex infrastructure an absolute breeze.',
    },
    {
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
      name: 'Avery Johnson',
      handle: '@averywrites',
      quote: 'The UI polish and performance are honestly next level.',
    },
    {
      image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=60',
      name: 'Jordan Lee',
      handle: '@jordantalks',
      quote: 'We shipped faster than ever with this setup.',
    },
    {
      image: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&q=60',
      name: 'Sam Carter',
      handle: '@samcodes',
      quote: 'Feels like Linear + Stripe had a baby.',
    },
  ];

  return (
    <section className="relative overflow-hidden py-24">
      <div className="px-8">
        <h4 className="mx-auto max-w-5xl text-center text-3xl font-medium tracking-tight text-black lg:text-5xl lg:leading-tight dark:text-white">
          Loved by builders
        </h4>

        <p className="mx-auto my-4 max-w-2xl text-center text-sm font-normal text-neutral-500 lg:text-base dark:text-neutral-300">
          Teams and indie hackers trust us to ship faster and cleaner.
        </p>
      </div>

      {/* Row 1 */}
      <Marquee>
        {[...cardsData, ...cardsData].map((card, i) => (
          <TestimonialCard key={i} card={card} />
        ))}
      </Marquee>

      {/* Row 2 */}
      <Marquee reverse>
        {[...cardsData, ...cardsData].map((card, i) => (
          <TestimonialCard key={i} card={card} />
        ))}
      </Marquee>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  MARQUEE                                   */
/* -------------------------------------------------------------------------- */

const Marquee = ({ children, reverse }: { children: React.ReactNode; reverse?: boolean }) => {
  return (
    <div className="relative mx-auto max-w-full overflow-hidden">
      {/* Fade edges */}
      <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent dark:from-zinc-950" />
      <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent dark:from-zinc-950" />

      <div
        className={`animate-marquee flex min-w-[200%] gap-6 py-6 ${
          reverse ? 'animate-marquee-reverse' : ''
        }`}
      >
        {children}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                   CARD                                     */
/* -------------------------------------------------------------------------- */

const TestimonialCard = ({ card }: any) => {
  return (
    <div className="group relative w-80 shrink-0 rounded-2xl border border-neutral-200 bg-white/70 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-900/60">
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <img src={card.image} alt={card.name} className="h-10 w-10 rounded-full object-cover" />
          <div>
            <p className="text-sm font-medium text-black dark:text-white">{card.name}</p>
            <p className="text-xs text-neutral-500">{card.handle}</p>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          “{card.quote}”
        </p>
      </div>
    </div>
  );
};
