export function attachPlayerInteractions(
  container: HTMLElement,
  player: any,
  setIsZoomed: (z: boolean | ((prev: boolean) => boolean)) => void
) {
  let lastTap = 0;

  function showFeedback(type: 'rewind' | 'forward') {
    const feedback = document.createElement('div');
    feedback.className = `absolute top-0 bottom-0 w-[40%] flex items-center justify-center bg-white/10 z-[100] pointer-events-none transition-all duration-300 ease-out animate-pulse ${
      type === 'rewind' ? 'left-0 rounded-r-[100%]' : 'right-0 rounded-l-[100%]'
    }`;
    feedback.innerHTML = `<span class="text-white bg-black/60 px-4 py-2 rounded-full font-bold text-xl backdrop-blur-sm">${
      type === 'rewind' ? '-10s' : '+10s'
    }</span>`;
    container.appendChild(feedback);
    
    // Animate out
    setTimeout(() => {
      feedback.style.opacity = '0';
      setTimeout(() => feedback.remove(), 300);
    }, 400);
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      container.dataset.pinchStart = dist.toString();
    } else if (e.touches.length === 1) {
      // For double tap
      const now = Date.now();
      if (now - lastTap < 300) {
        // Double tap confirmed
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const isRewind = touch.clientX < rect.left + rect.width / 2;

        if (isRewind) {
          if (player && typeof player.rewind === 'function') player.rewind(10);
          showFeedback('rewind');
        } else {
          if (player && typeof player.forward === 'function') player.forward(10);
          showFeedback('forward');
        }
        e.preventDefault(); // Sometimes helps avoid native zoom if not already disabled
      }
      lastTap = now;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2 && container.dataset.pinchStart) {
      const startDist = parseFloat(container.dataset.pinchStart);
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      const threshold = 40;
      if (currentDist > startDist + threshold) {
        setIsZoomed(true);
        container.dataset.pinchStart = currentDist.toString();
      } else if (currentDist < startDist - threshold) {
        setIsZoomed(false);
        container.dataset.pinchStart = currentDist.toString();
      }
      e.preventDefault(); // Stop native pinch
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length < 2) {
      delete container.dataset.pinchStart;
    }
  };

  container.addEventListener('touchstart', handleTouchStart, { passive: false });
  container.addEventListener('touchmove', handleTouchMove, { passive: false });
  container.addEventListener('touchend', handleTouchEnd);

  return () => {
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
  };
}
