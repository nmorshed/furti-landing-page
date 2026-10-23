// Furti landing page. Small, no libraries.
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  // ---------- Google Tag Manager events (set up the tags in GTM, not here) ----------
  window.dataLayer = window.dataLayer || [];
  function track(event, data) {
    window.dataLayer.push(Object.assign({ event: event }, data || {}));
  }

  // Meta custom events: clicks are interactions, not completed registrations.
  function trackMeta(event, data) {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', event, data || {});
    }
  }

  document.addEventListener('click', function (event) {
    var button = event.target.closest('button, a.btn, [data-demo], [data-call]');
    if (!button) return;
    trackMeta('ButtonClick', {
      button_text: button.textContent.trim(),
      button_location: button.dataset.cta || button.dataset.demo || button.dataset.call || 'pricing',
      button_type: button.dataset.cta ? 'signup' : button.dataset.demo ? 'demo' : button.dataset.call ? 'call' : 'billing',
      billing_period: button.dataset.billing || ''
    });
  });

  // Fire once per page load when a scroll reaches within 2px of the bottom.
  var bottomTracked = false;
  window.addEventListener('scroll', function () {
    var pageHeight = document.documentElement.scrollHeight;
    if (!bottomTracked && window.scrollY > 0 && window.scrollY + window.innerHeight >= pageHeight - 2) {
      bottomTracked = true;
      trackMeta('ScrollToBottom', { scroll_depth: 100 });
      track('scroll_to_bottom', { scroll_depth: 100 });
    }
  }, { passive: true });

  // Every "ফ্রিতেই স্টার্ট করুন" button says which section it is in (data-cta="hero", "final"...)
  document.querySelectorAll('[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () {
      track('cta_click', { cta_location: el.dataset.cta });
    });
  });
  document.querySelectorAll('[data-demo]').forEach(function (el) {
    el.addEventListener('click', function () {
      track('demo_click', { cta_location: el.dataset.demo });
    });
  });
  document.querySelectorAll('[data-call]').forEach(function (el) {
    el.addEventListener('click', function () {
      track('call_click', { cta_location: el.dataset.call });
    });
  });
  document.querySelectorAll('.faq details').forEach(function (el) {
    el.addEventListener('toggle', function () {
      if (el.open) track('faq_open', { faq_question: el.querySelector('summary').textContent.trim() });
    });
  });

  // ---------- Bangla digits and Taka the Bangladeshi way (৳১,২০,০০০) ----------
  var BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  function toBangla(text) {
    return String(text).replace(/\d/g, function (d) { return BN_DIGITS[d]; });
  }
  function taka(amount) {
    return '৳' + toBangla(Math.round(amount).toLocaleString('en-IN'));
  }

  // ---------- Calculator: orders × return rate × ৳120 per returned parcel ----------
  var COST_PER_RETURN = 120;
  var orders = document.getElementById('orders');
  var returns = document.getElementById('returns');
  if (orders && returns) {
    var calcTracked = false;
    var paintRange = function (input) {
      var pct = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.background = 'linear-gradient(90deg, #ea580c ' + pct + '%, #e2e8f0 ' + pct + '%)';
    };
    var updateCalc = function () {
      var monthly = orders.value * (returns.value / 100) * COST_PER_RETURN;
      document.getElementById('orders-out').textContent = toBangla(Number(orders.value).toLocaleString('en-IN'));
      document.getElementById('returns-out').textContent = toBangla(returns.value) + '%';
      document.getElementById('loss-month').textContent = taka(monthly);
      document.getElementById('loss-year').textContent = taka(monthly * 12);
      paintRange(orders);
      paintRange(returns);
    };
    var onInput = function () {
      updateCalc();
      if (!calcTracked) {
        calcTracked = true;
        track('calculator_used');
      }
    };
    orders.addEventListener('input', onInput);
    returns.addEventListener('input', onInput);
    updateCalc();
  }

  // ---------- Pricing: monthly or yearly ----------
  var PREMIUM = {
    month: { price: '৳৯৯৯', period: '/ মাস', note: 'বিকাশে পেমেন্ট, যখন খুশি বন্ধ করুন' },
    year: { price: '৳৯,৯৯০', period: '/ বছর', note: 'মাসে প্রায় ৳৮৩৩, ২ মাস একদম ফ্রি' }
  };
  document.querySelectorAll('[data-billing]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var plan = PREMIUM[btn.dataset.billing];
      document.querySelectorAll('[data-billing]').forEach(function (b) {
        b.classList.toggle('on', b === btn);
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      document.getElementById('premium-price').textContent = plan.price;
      document.getElementById('premium-period').textContent = plan.period;
      document.getElementById('premium-note').textContent = plan.note;
    });
  });

  // ---------- Header border and the sticky phone button ----------
  var header = document.querySelector('.site-header');
  var sticky = document.getElementById('sticky-cta');
  var hero = document.querySelector('.hero');
  var finalCta = document.querySelector('.final');
  var heroGone = false;
  var finalVisible = false;
  var updateSticky = function () {
    if (sticky) sticky.classList.toggle('show', heroGone && !finalVisible);
  };
  window.addEventListener('scroll', function () {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroGone = !entries[0].isIntersecting;
      updateSticky();
    }).observe(hero);
    // Hide the sticky button while the big final button is on screen, so there are never two
    new IntersectionObserver(function (entries) {
      finalVisible = entries[0].isIntersecting;
      updateSticky();
    }).observe(finalCta);

    // ---------- Sections slide in once while scrolling ----------
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { revealer.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
})();
