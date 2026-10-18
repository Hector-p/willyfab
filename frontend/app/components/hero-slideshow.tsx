"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { landingSlides } from "../data/landing-slides";

export function HeroSlideshow() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const slide = landingSlides[activeIndex];

  useEffect(() => {
    landingSlides.slice(1).forEach((item) => {
      const image = new Image();
      image.src = item.src;
    });
  }, []);

  useEffect(() => {
    if (reduceMotion || isHovered || isFocused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % landingSlides.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isFocused, isHovered, reduceMotion]);

  function moveSlide(direction: number) {
    setActiveIndex((index) => (index + direction + landingSlides.length) % landingSlides.length);
  }

  return (
    <div
      aria-label="Engineering image slideshow"
      aria-roledescription="carousel"
      className="home-hero-image-wrap"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsFocused(false);
      }}
      onFocus={() => setIsFocused(true)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") moveSlide(-1);
        if (event.key === "ArrowRight") moveSlide(1);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      tabIndex={0}
    >
      <div className="home-hero-image">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            aria-label={slide.alt}
            animate={{ opacity: 1, scale: reduceMotion ? 1 : 1.035 }}
            className="home-hero-slide"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.075 }}
            key={slide.src}
            role="img"
            style={{ backgroundImage: `url("${slide.src}")` }}
            transition={{ duration: reduceMotion ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}
          />
        </AnimatePresence>
        <div aria-label="Slideshow navigation" className="home-slide-controls">
          <button aria-label="Previous image" className="slide-arrow" onClick={() => moveSlide(-1)} type="button">
            <ArrowLeft aria-hidden="true" size={16} />
          </button>
          <div aria-label="Choose an image" className="slide-dots">
            {landingSlides.map((item, index) => (
              <button
                aria-current={activeIndex === index ? "true" : undefined}
                aria-label={`Show image ${index + 1}: ${item.caption}`}
                className={activeIndex === index ? "slide-dot is-active" : "slide-dot"}
                key={item.src}
                onClick={() => setActiveIndex(index)}
                type="button"
              />
            ))}
          </div>
          <button aria-label="Next image" className="slide-arrow" onClick={() => moveSlide(1)} type="button">
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}