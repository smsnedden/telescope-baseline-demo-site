/**
 * Pulse Studio — Main Application
 * Handles navigation, scroll animations, form interactions,
 * and progressive enhancement features.
 */

(function () {
  'use strict';

  // ── Smooth scroll navigation ──────────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();

      var headerOffset = 80;
      var elementPosition = target.getBoundingClientRect().top;
      var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // Use View Transitions API if available for smoother navigation
      if (document.startViewTransition) {
        document.startViewTransition(function () {
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          });
        });
      } else {
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }

      // Close mobile menu if open
      var navLinks = document.getElementById('navLinks');
      var navToggle = document.getElementById('navToggle');
      if (navLinks && navLinks.classList.contains('nav-open')) {
        navLinks.classList.remove('nav-open');
        navToggle.classList.remove('nav-toggle--active');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  });

  // ── Mobile navigation toggle ──────────────────────────────────────
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.contains('nav-open');
      navLinks.classList.toggle('nav-open');
      this.classList.toggle('nav-toggle--active');
      this.setAttribute('aria-expanded', String(!isOpen));
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });
  }

  // ── Header scroll behavior ────────────────────────────────────────
  var header = document.getElementById('header');
  var lastScrollTop = 0;
  var ticking = false;

  function updateHeader() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100) {
      header.classList.add('header-scrolled');
    } else {
      header.classList.remove('header-scrolled');
    }

    if (scrollTop > lastScrollTop && scrollTop > 400) {
      header.classList.add('header-hidden');
    } else {
      header.classList.remove('header-hidden');
    }

    lastScrollTop = scrollTop;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });

  // ── Scroll-triggered fade-in animations ───────────────────────────
  var fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length > 0) {
    var fadeObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in--visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    fadeElements.forEach(function (el) {
      fadeObserver.observe(el);
    });
  }

  // ── Active nav link highlighting ──────────────────────────────────
  var sections = document.querySelectorAll('section[id]');

  if (sections.length > 0) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute('id');
            document.querySelectorAll('.nav-links a').forEach(function (link) {
              link.classList.remove('nav-active');
              if (link.getAttribute('href') === '#' + id) {
                link.classList.add('nav-active');
              }
            });
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-80px 0px -40% 0px',
      }
    );

    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  // ── Work item hover parallax effect ───────────────────────────────
  var workItems = document.querySelectorAll('.work-item');
  workItems.forEach(function (item) {
    var imageInner = item.querySelector('.work-image-inner');
    if (!imageInner) return;

    item.addEventListener('mousemove', function (e) {
      var rect = item.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
      var y = ((e.clientY - rect.top) / rect.height - 0.5) * 10;

      requestAnimationFrame(function () {
        imageInner.style.transform =
          'scale(1.05) translate(' + x + 'px, ' + y + 'px)';
      });
    });

    item.addEventListener('mouseleave', function () {
      requestAnimationFrame(function () {
        imageInner.style.transform = 'scale(1) translate(0, 0)';
      });
    });
  });

  // ── Contact form handling ─────────────────────────────────────────
  var contactForm = document.getElementById('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var btn = this.querySelector('button[type="submit"]');
      var originalText = btn.textContent;

      btn.textContent = 'Sending...';
      btn.disabled = true;

      // Simulate form submission
      setTimeout(function () {
        btn.textContent = 'Message Sent ✓';
        btn.classList.add('btn-success');

        setTimeout(function () {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.classList.remove('btn-success');
          contactForm.reset();
        }, 3000);
      }, 1500);
    });

    // Floating label behavior
    var formInputs = contactForm.querySelectorAll(
      'input, textarea, select'
    );
    formInputs.forEach(function (input) {
      input.addEventListener('focus', function () {
        this.parentElement.classList.add('form-group--focused');
      });
      input.addEventListener('blur', function () {
        this.parentElement.classList.remove('form-group--focused');
        if (this.value) {
          this.parentElement.classList.add('form-group--filled');
        } else {
          this.parentElement.classList.remove('form-group--filled');
        }
      });
    });
  }

  // ── Hero counter animation ────────────────────────────────────────
  var statNumbers = document.querySelectorAll('.stat-number');

  function animateCounter(el) {
    var text = el.textContent;
    var suffix = text.replace(/[0-9]/g, '');
    var target = parseInt(text, 10);
    var duration = 2000;
    var startTime = null;
    var startValue = 0;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(startValue + (target - startValue) * eased);
      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  if (statNumbers.length > 0) {
    var counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNumbers.forEach(function (stat) {
      counterObserver.observe(stat);
    });
  }

  // ── Scroll progress indicator (CSS custom property) ───────────────
  function updateScrollProgress() {
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    var docHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    var progress = docHeight > 0 ? scrollTop / docHeight : 0;
    document.documentElement.style.setProperty(
      '--scroll-progress',
      progress.toString()
    );
  }

  window.addEventListener('scroll', function () {
    requestAnimationFrame(updateScrollProgress);
  });

  // ── Emit custom event when page is fully interactive ──────────────
  window.addEventListener('load', function () {
    var readyEvent = new CustomEvent('pulseready', {
      bubbles: true,
      detail: { timestamp: Date.now() },
    });
    document.dispatchEvent(readyEvent);
  });
})();
