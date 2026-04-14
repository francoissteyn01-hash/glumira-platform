import React, { useState, useEffect } from 'react';

// GuestProfile component
const GuestProfile = () => {
  const slides = [
    { src: '/public/images/showcase/showcase-01.webp', alt: 'Levemir 24h basal activity curve' },
    { src: '/public/images/showcase/showcase-02.webp', alt: '60-second interpretation card — Tresiba' },
    { src: '/public/images/showcase/showcase-03.webp', alt: '3-day Tresiba depot-release model' },
    { src: '/public/images/showcase/showcase-04.webp', alt: 'Full basal + bolus overlay, 3-day snapshot' },
    { src: '/public/images/showcase/showcase-05.webp', alt: '24-hour insulin pressure map' },
    { src: '/public/images/showcase/showcase-06.webp', alt: '60-second interpretation card — pressure map' },
    { src: '/public/images/showcase/showcase-07.webp', alt: 'Pressure map feature description' },
  ];

  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const nextIndex = (current + 1) % slides.length;

  useEffect(() => {
    if (!isPaused && !isTransitioning) {
      const timer = setInterval(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrent(nextIndex);
          setIsTransitioning(false);
        }, 500); // Half of the transition duration for smooth fade
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [isPaused, isTransitioning, nextIndex]);

  const handleDotClick = (index: number) => {
    if (!isTransitioning) {
      setCurrent(index);
    }
  };

  return (
    <div className="guest-profile">
      {/* Hero Section */}
      <section className="hero">
        <picture>
          <source srcSet="/public/images/hero-dark.webp" media="(prefers-color-scheme: dark)" />
          <img src="/public/images/hero-light.webp" alt="GluMira Hero" loading="lazy" className="hero-image" />
        </picture>
      </section>

      {/* Showcase Carousel */}
      <section className="showcase">
        <div
          className="carousel"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div className="slides">
            <img
              src={slides[current].src}
              alt={slides[current].alt}
              className={`slide current ${isTransitioning ? 'fadeOut' : 'fadeIn'}`}
              loading="lazy"
            />
            {isTransitioning && (
              <img
                src={slides[nextIndex].src}
                alt={slides[nextIndex].alt}
                className="slide next fadeIn"
                loading="lazy"
              />
            )}
          </div>
          <div className="indicators">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === current ? 'active' : ''}`}
                onClick={() => handleDotClick(index)}
              ></span>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer Footer */}
      <footer className="disclaimer">
        <p className="disclaimer-text">
          GluMira™ is an educational platform, not a medical device. This visualisation does not constitute medical advice.
        </p>
      </footer>
    </div>
  );
};

export default GuestProfile;
