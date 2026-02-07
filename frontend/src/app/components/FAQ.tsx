'use client';
import React from 'react';
import { useState } from 'react';

export const FAQ = () => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);

  const faqs = [
    {
      question: 'What is Systemly?',
      answer:
        'It’s an AI-powered platform that converts your idea into a complete system design — including architecture, tech stack, data flow, scalability, and trade-offs.',
    },
    {
      question: 'How is this different from ChatGPT?',
      answer:
        'Instead of one generic response, multiple specialized AI agents collaborate — each focused on requirements, architecture, scalability, security, and cost.',
    },
    {
      question: 'Is this suitable for real production systems?',
      answer:
        'Yes. The designs follow industry-grade patterns like microservices, queues, caching, load balancing, and fault tolerance.',
    },
    {
      question: 'Can I use this for system design interviews?',
      answer:
        'Absolutely. It helps you think like a senior engineer and explains decisions clearly — perfect for interviews and practice.',
    },
    {
      question: 'Do I need deep system design knowledge?',
      answer:
        'No. Beginners get structured guidance, while experienced developers get faster, cleaner design iterations.',
    },
    {
      question: 'Can I customize or iterate on a design?',
      answer:
        'Yes. You can refine prompts, regenerate specific agents, and evolve the system as requirements change.',
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Poppins', sans-serif; }
      `}</style>

      <section className="mx-auto max-w-3xl px-4 py-24">
        <div className="mb-12 px-8">
          <h4 className="mx-auto max-w-5xl text-center text-3xl font-medium tracking-tight text-black lg:text-5xl lg:leading-tight dark:text-white">
            Questions? We have answers.
          </h4>

          <p className="mx-auto my-4 max-w-2xl text-center text-sm font-normal text-neutral-500 lg:text-base dark:text-neutral-300">
            Learn how Systemly empowers your engineering workflow with AI-driven architecture and
            design.
          </p>
        </div>
        {/* FAQ List */}
        <div className="space-y-1">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="group cursor-pointer border-b border-neutral-200/70 py-6 transition-colors dark:border-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-medium text-slate-900 dark:text-white">
                    {faq.question}
                  </h3>

                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    className={`shrink-0 text-slate-900 transition-transform duration-300 ease-out dark:text-white ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2"
                      stroke="#1D293D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Answer */}
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <p className="overflow-hidden text-sm leading-relaxed text-slate-900 dark:text-white">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};
