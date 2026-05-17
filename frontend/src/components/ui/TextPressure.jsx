import React, { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

export function TextPressure({
  text = "ETHARA AI",
  fontFamily = '"Roboto Flex", sans-serif',
  maxDistance = 200,
  className = ""
}) {
  const containerRef = useRef(null);
  const charRefs = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    let animationFrameId;

    const animate = () => {
      if (charRefs.current.length > 0) {
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;

        charRefs.current.forEach((charEl) => {
          if (!charEl) return;
          
          const rect = charEl.getBoundingClientRect();
          const charCenterX = rect.left + rect.width / 2;
          const charCenterY = rect.top + rect.height / 2;

          const dx = mouseX - charCenterX;
          const dy = mouseY - charCenterY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Map distance to a 0-1 factor
          const factor = Math.max(0, 1 - distance / maxDistance);

          // Closer = Higher Weight (900), Wider Width (150), Higher Slant
          // Further = Lower Weight (100), Narrower Width (25), No Slant
          const weight = 100 + factor * 800; // 100 to 900
          const width = 25 + factor * 125;   // 25 to 150
          const slant = -10 + factor * 10;   // -10 to 0

          charEl.style.fontVariationSettings = `"wght" ${weight}, "wdth" ${width}, "slnt" ${slant}`;
        });
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [maxDistance]);

  return (
    <div 
      ref={containerRef} 
      className={cn("flex flex-wrap justify-center items-center select-none text-white/50 tracking-tight", className)}
      style={{ fontFamily }}
    >
      {text.split('').map((char, index) => (
        <span
          key={index}
          ref={(el) => (charRefs.current[index] = el)}
          className="inline-block transition-transform duration-75"
          style={{
            fontVariationSettings: '"wght" 100, "wdth" 25, "slnt" -10',
            willChange: 'font-variation-settings'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}

export default TextPressure;
