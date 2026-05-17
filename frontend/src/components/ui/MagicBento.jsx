import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';

const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 300;
const DEFAULT_GLOW_COLOR = '132, 0, 255';
const MOBILE_BREAKPOINT = 768;

const cardData = [
  {
    color: '#060010',
    title: 'Analytics',
    description: 'Track user behavior and growth trends with real-time insights.',
    label: 'Insights'
  },
  {
    color: '#060010',
    title: 'Dashboard',
    description: 'Centralized data view for all your critical metrics.',
    label: 'Overview'
  },
  {
    color: '#060010',
    title: 'Collaboration',
    description: 'Work together seamlessly across teams and timezones.',
    label: 'Teamwork'
  },
  {
    color: '#060010',
    title: 'Automation',
    description: 'Streamline workflows with intelligent trigger actions.',
    label: 'Efficiency'
  },
  {
    color: '#060010',
    title: 'Integration',
    description: 'Connect your favorite tools into one unified platform.',
    label: 'Connectivity'
  },
  {
    color: '#060010',
    title: 'Security',
    description: 'Enterprise-grade protection for your sensitive data.',
    label: 'Protection'
  }
];

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

const ParticleCard = ({
  children,
  className = '',
  disableAnimations = false,
  style,
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
  enableTilt = true,
  clickEffect = false,
  enableMagnetism = false
}) => {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const timeoutsRef = useRef([]);
  const isHoveredRef = useRef(false);
  const magnetismAnimationRef = useRef(null);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    magnetismAnimationRef.current?.kill();
    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle);
        }
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return;
        const x = Math.random() * width;
        const y = Math.random() * height;
        const particle = createParticleElement(x, y, glowColor);
        cardRef.current.appendChild(particle);
        particlesRef.current.push(particle);

        gsap.fromTo(particle, 
          { scale: 0, opacity: 0 }, 
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );

        gsap.to(particle, {
          x: (Math.random() - 0.5) * 100,
          y: (Math.random() - 0.5) * 100,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        });
      }, i * 100);
      timeoutsRef.current.push(timeoutId);
    }
  }, [particleCount, glowColor]);

  useEffect(() => {
    if (disableAnimations || !cardRef.current) return;
    const element = cardRef.current;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      gsap.to(element, { rotateX: 0, rotateY: 0, x: 0, y: 0, duration: 0.3, ease: 'power2.out' });
    };

    const handleMouseMove = (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      if (enableTilt) {
        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;
        gsap.to(element, { rotateX, rotateY, duration: 0.1, ease: 'power2.out', transformPerspective: 1000 });
      }

      if (enableMagnetism) {
        const magnetX = (x - centerX) * 0.05;
        const magnetY = (y - centerY) * 0.05;
        magnetismAnimationRef.current = gsap.to(element, { x: magnetX, y: magnetY, duration: 0.3, ease: 'power2.out' });
      }
    };

    const handleClick = (e) => {
      if (!clickEffect) return;
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(${glowColor}, 0.5);
        left: ${x}px;
        top: ${y}px;
        pointer-events: none;
        z-index: 1000;
      `;
      element.appendChild(ripple);
      gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 50, opacity: 0, duration: 0.8, ease: 'power2.out', onComplete: () => ripple.remove() });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('click', handleClick);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles, disableAnimations, enableTilt, enableMagnetism, clickEffect, glowColor]);

  return (
    <div ref={cardRef} className={className} style={{ ...style, position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
  );
};

export const MagicBento = ({
  textAutoHide = true,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  disableAnimations = false,
  spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
  particleCount = DEFAULT_PARTICLE_COUNT,
  enableTilt = true,
  glowColor = DEFAULT_GLOW_COLOR,
  clickEffect = true,
  enableMagnetism = true
}) => {
  const gridRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shouldDisableAnimations = disableAnimations || isMobile;

  useEffect(() => {
    if (!enableSpotlight || shouldDisableAnimations) return;

    const handleMouseMove = (e) => {
      if (!gridRef.current) return;
      const cards = gridRef.current.querySelectorAll('.bento-card');
      
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        card.style.setProperty('--spotlight-radius', `${spotlightRadius}px`);
        card.style.setProperty('--glow-color', `rgba(${glowColor}, 0.15)`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableSpotlight, shouldDisableAnimations, spotlightRadius, glowColor]);

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 bg-transparent">
      <style>
        {`
          .bento-grid {
            display: grid;
            gap: 1rem;
            width: 100%;
            grid-template-columns: repeat(1, 1fr);
          }
          
          @media (min-width: 640px) {
            .bento-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          
          @media (min-width: 1024px) {
            .bento-grid {
              grid-template-columns: repeat(4, 1fr);
              grid-template-rows: repeat(2, 200px);
            }
            .card-0 { grid-column: span 2; grid-row: span 1; }
            .card-1 { grid-column: span 1; grid-row: span 1; }
            .card-2 { grid-column: span 1; grid-row: span 2; }
            .card-3 { grid-column: span 1; grid-row: span 1; }
            .card-4 { grid-column: span 2; grid-row: span 1; }
            .card-5 { grid-column: span 1; grid-row: span 1; }
          }

          .bento-card {
            background: rgba(10, 4, 26, 0.6);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 24px;
            position: relative;
            overflow: hidden;
            transition: border-color 0.3s ease;
          }

          .bento-card:hover {
            border-color: rgba(${glowColor}, 0.3);
          }

          .spotlight-overlay {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: radial-gradient(
              var(--spotlight-radius) circle at var(--mouse-x) var(--mouse-y),
              var(--glow-color),
              transparent 80%
            );
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .bento-card:hover .spotlight-overlay {
            opacity: 1;
          }

          .border-glow {
            position: absolute;
            inset: 0;
            pointer-events: none;
            border-radius: inherit;
            padding: 1px;
            background: radial-gradient(
              var(--spotlight-radius) circle at var(--mouse-x) var(--mouse-y),
              rgba(${glowColor}, 0.8),
              transparent 40%
            );
            -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          .bento-card:hover .border-glow {
            opacity: 1;
          }
        `}
      </style>
      
      <div className="w-full mb-6 flex justify-between items-end">
         <div>
           <h2 className="text-2xl font-bold tracking-tight">Platform Overview</h2>
           <p className="text-muted-foreground mt-1 text-sm">A unified look at your system modules</p>
         </div>
      </div>
      
      <div ref={gridRef} className="bento-grid">
        {cardData.map((card, index) => {
          const Content = (
            <div className="bento-card h-full w-full p-6 flex flex-col justify-between group">
              <div className="spotlight-overlay" />
              {enableBorderGlow && <div className="border-glow" />}
              
              <div className="relative z-10">
                <span className="text-xs font-medium tracking-wider text-primary uppercase opacity-70 group-hover:opacity-100 transition-opacity">
                  {card.label}
                </span>
                <h3 className="text-xl font-semibold text-white mt-2">
                  {card.title}
                </h3>
              </div>
              
              <div className="relative z-10">
                <p className={`text-sm text-gray-400 leading-relaxed ${textAutoHide ? 'line-clamp-2' : ''}`}>
                  {card.description}
                </p>
              </div>
            </div>
          );

          if (enableStars) {
            return (
              <ParticleCard
                key={index}
                className={`bento-card card-${index}`}
                particleCount={particleCount}
                glowColor={glowColor}
                enableTilt={enableTilt}
                enableMagnetism={enableMagnetism}
                clickEffect={clickEffect}
                disableAnimations={shouldDisableAnimations}
              >
                {Content}
              </ParticleCard>
            );
          }

          return (
            <div key={index} className={`bento-card card-${index}`}>
              {Content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MagicBento;
