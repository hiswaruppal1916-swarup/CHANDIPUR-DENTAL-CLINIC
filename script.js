/**
 * CHANDIPUR DENTAL CLINIC - MAIN APPLICATION LOGIC
 * High-performance 300-frame Hero sequence engine, fallback frame search, & ultra-fast mobile UI
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_FRAMES = 300;
  const frames = [];
  let loadedCount = 0;
  let preloaderHidden = false;

  let currentFrameIndex = 0;
  let targetFrameIndex = 0;
  const lerpFactor = 0.22;

  // DOM Elements
  const preloader = document.getElementById('preloader');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  const canvas = document.getElementById('hero-sequence-canvas');
  const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null;
  const heroFrameBadge = document.getElementById('hero-frame-num');
  const heroSection = document.getElementById('hero');

  const mainHeader = document.getElementById('main-header');
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileDrawer = document.getElementById('mobile-drawer');

  const bookingModal = document.getElementById('booking-modal');
  const openBookingBtns = document.querySelectorAll('.open-booking-btn');
  const modalCloseBtn = document.getElementById('modal-close');

  const appointmentForm = document.getElementById('appointment-form');
  const modalForm = document.getElementById('modal-form');

  /* ==========================================================================
     1. Image Preloading Engine with Immediate Fallback Support
     ========================================================================== */
  function getFrameUrl(index) {
    const padded = String(index).padStart(3, '0');
    return `frames/ezgif-frame-${padded}.jpg`;
  }

  function preloadImages() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);

      img.onload = () => {
        loadedCount++;
        const percent = Math.floor((loadedCount / TOTAL_FRAMES) * 100);

        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) progressText.innerText = `${percent}%`;

        // Render immediately when initial keyframe loads
        if (i === 1 || !preloaderHidden) {
          renderFrame(currentFrameIndex);
        }

        // Hide preloader once 15% loaded or 100% loaded for ultra-fast startup
        if ((loadedCount >= 25 || loadedCount === TOTAL_FRAMES) && !preloaderHidden) {
          preloaderHidden = true;
          if (preloader) preloader.classList.add('loaded');
        }
      };

      img.onerror = () => {
        setTimeout(() => { img.src = getFrameUrl(i); }, 300);
      };

      frames.push(img);
    }
  }

  /* ==========================================================================
     2. Nearest Loaded Frame Resolver (Prevents Freezing on Slow Networks)
     ========================================================================== */
  function getBestAvailableFrame(targetIdx) {
    const safeIdx = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(targetIdx)));
    
    // 1. Check exact target frame
    if (frames[safeIdx] && frames[safeIdx].complete && frames[safeIdx].naturalWidth > 0) {
      return { img: frames[safeIdx], index: safeIdx };
    }

    // 2. Search backwards for most recent loaded frame
    for (let i = safeIdx - 1; i >= 0; i--) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
        return { img: frames[i], index: i };
      }
    }

    // 3. Search forwards if no earlier frame is loaded yet
    for (let i = safeIdx + 1; i < TOTAL_FRAMES; i++) {
      if (frames[i] && frames[i].complete && frames[i].naturalWidth > 0) {
        return { img: frames[i], index: i };
      }
    }

    return null;
  }

  /* ==========================================================================
     3. Bulletproof Hero Canvas Render Engine
     ========================================================================== */
  function renderFrame(index) {
    if (!canvas || !ctx) return;

    const frameData = getBestAvailableFrame(index);
    if (!frameData) return;

    const img = frameData.img;
    const activeIndex = frameData.index;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (width === 0 || height === 0) return;

    const isMobile = window.innerWidth <= 768;
    const dpr = isMobile ? 1.2 : Math.min(window.devicePixelRatio || 1, 2);
    const targetWidth = Math.round(width * dpr);
    const targetHeight = Math.round(height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    const imgRatio = imgWidth / imgHeight;
    const canvasRatio = width / height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      drawHeight = height;
      drawWidth = height * imgRatio;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    } else {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    }

    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    ctx.restore();

    if (heroFrameBadge) {
      const displayNum = String(activeIndex + 1).padStart(3, '0');
      heroFrameBadge.innerText = `FRAME ${displayNum} / ${TOTAL_FRAMES}`;
    }
  }

  function calculateTargetFrame() {
    if (!heroSection) return;
    const rect = heroSection.getBoundingClientRect();
    const scrollableHeight = heroSection.offsetHeight - window.innerHeight;

    if (scrollableHeight > 0) {
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));
      targetFrameIndex = progress * (TOTAL_FRAMES - 1);
    }
  }

  function startSequenceRenderLoop() {
    function loop() {
      calculateTargetFrame();
      currentFrameIndex += (targetFrameIndex - currentFrameIndex) * lerpFactor;
      renderFrame(currentFrameIndex);
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  /* ==========================================================================
     4. Header & Navigation Controls
     ========================================================================== */
  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      mainHeader.classList.add('scrolled');
    } else {
      mainHeader.classList.remove('scrolled');
    }
  });

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('active');
    });

    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('active');
      });
    });
  }

  /* ==========================================================================
     5. Booking Modal & Form Handler
     ========================================================================== */
  openBookingBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (bookingModal) bookingModal.classList.add('active');
      if (mobileDrawer) mobileDrawer.classList.remove('active');
    });
  });

  if (modalCloseBtn && bookingModal) {
    modalCloseBtn.addEventListener('click', () => {
      bookingModal.classList.remove('active');
    });

    bookingModal.addEventListener('click', (e) => {
      if (e.target === bookingModal) {
        bookingModal.classList.remove('active');
      }
    });
  }

  function handleFormSubmit(form, feedbackEl) {
    if (!form || !feedbackEl) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      feedbackEl.className = 'form-feedback success';
      feedbackEl.innerText = 'Thank you! Appointment request sent. Dr. N.D. Maity\'s team will call you shortly.';
      form.reset();

      setTimeout(() => {
        feedbackEl.innerText = '';
        if (bookingModal) bookingModal.classList.remove('active');
      }, 4000);
    });
  }

  handleFormSubmit(appointmentForm, document.getElementById('form-feedback'));
  handleFormSubmit(modalForm, document.getElementById('modal-feedback'));

  window.addEventListener('resize', () => renderFrame(currentFrameIndex));
  window.addEventListener('orientationchange', () => renderFrame(currentFrameIndex));

  /* Initialize Preloader & Start Animation Loop */
  preloadImages();
  startSequenceRenderLoop();
});
