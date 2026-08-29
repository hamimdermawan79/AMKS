'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedMarqueeHeroProps {
  title: React.ReactNode;
  description: string;
  actions: React.ReactNode;
  stats?: React.ReactNode;
  images: string[];
  className?: string;
}

export const AnimatedMarqueeHero: React.FC<AnimatedMarqueeHeroProps> = ({
  title,
  description,
  actions,
  stats,
  images,
  className,
}) => {
  const FADE_IN_ANIMATION_VARIANTS = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

  const validImages = images && images.length > 0 ? images.filter(Boolean) : [];
  // Duplicate images for a seamless loop if available
  const duplicatedImages = validImages.length > 0 
    ? [...validImages, ...validImages, ...validImages]
    : [];

  return (
    <section
      id="home-hero"
      className={cn(
        'relative w-full min-h-[92vh] lg:min-h-screen overflow-hidden bg-white flex flex-col items-center justify-between text-center pt-28 sm:pt-36 lg:pt-32 pb-6 px-4',
        className
      )}
    >
      {/* Central Content */}
      <div className="z-10 flex flex-col items-center max-w-4xl mx-auto my-auto">
        {/* Main Title */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: {
              transition: {
                staggerChildren: 0.08,
              },
            },
          }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-[1.1]"
        >
          {title}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.3 }}
          className="mt-5 sm:mt-6 max-w-2xl text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed text-center"
        >
          {description}
        </motion.p>

        {/* Call to Action Buttons */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE_IN_ANIMATION_VARIANTS}
          transition={{ delay: 0.45 }}
          className="mt-7 sm:mt-8"
        >
          {actions}
        </motion.div>

        {/* Minimalist Stats */}
        {stats && (
          <motion.div
            initial="hidden"
            animate="show"
            variants={FADE_IN_ANIMATION_VARIANTS}
            transition={{ delay: 0.6 }}
          >
            {stats}
          </motion.div>
        )}
      </div>

      {/* Animated Image Marquee (Pure background, non-clickable, no hover effects) */}
      <div className="relative w-full h-44 sm:h-52 md:h-64 mt-10 pointer-events-none select-none overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
        <motion.div
          className="flex gap-3 sm:gap-4 md:gap-5 w-max"
          animate={{
            x: ['0%', '-50%'],
            transition: {
              ease: 'linear',
              duration: 35,
              repeat: Infinity,
            },
          }}
        >
          {duplicatedImages.map((src, index) => (
            <div
              key={index}
              className="relative aspect-[4/3] sm:aspect-[16/10] h-32 sm:h-44 md:h-52 flex-shrink-0"
              style={{
                transform: `rotate(${index % 2 === 0 ? -2 : 3}deg)`,
              }}
            >
              <img
                src={src}
                alt=""
                draggable={false}
                className="w-full h-full object-cover rounded-2xl md:rounded-3xl shadow-md border border-slate-100/80"
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AnimatedMarqueeHero;
