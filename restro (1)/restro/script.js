const visual = document.querySelector(".hero-visual");
const glow = document.querySelector(".visual-glow");
const logoSurface = document.querySelector(".logo-surface");
const logoRotor = document.querySelector(".logo-rotor");

if (visual && glow && logoSurface) {
  visual.addEventListener("mousemove", (event) => {
    const rect = visual.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const px = Math.min(Math.max(x, 0), 1);
    const py = Math.min(Math.max(y, 0), 1);

    glow.style.left = `${px * 100}%`;
    glow.style.top = `${py * 100}%`;
    glow.style.transform = `translate(-${px * 50}%, -${py * 50}%)`;

    const tiltX = (py - 0.5) * 14;
    const tiltY = (px - 0.5) * 18;
    const offsetX = (px - 0.5) * 12;
    const offsetY = (py - 0.5) * 10;

    logoSurface.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  });

  visual.addEventListener("mouseleave", () => {
    glow.style.left = "50%";
    glow.style.top = "50%";
    glow.style.transform = "translate(-50%, -50%)";
    logoSurface.style.transform =
      "translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg)";
  });
}

// scroll-driven parallax & directional reveal
const hero = document.querySelector("#hero");
let lastScrollTop = 0;

function onScroll() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // Parallax background offset
  if (hero) {
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
    hero.style.backgroundPosition = `center ${50 + progress * 15}%`;
  }

  // Scroll Up/Down directional trigger for header slide reveal
  if (scrollTop > 80) {
    if (scrollTop < lastScrollTop) {
      // Scrolling UP - slide down header & trigger scroll-up micro-animations
      document.body.classList.add("scroll-up");
      document.body.classList.remove("scroll-down");
    } else {
      // Scrolling DOWN - slide up and hide header
      document.body.classList.add("scroll-down");
      document.body.classList.remove("scroll-up");
    }
  } else {
    // At very top - reset classes
    document.body.classList.remove("scroll-up", "scroll-down");
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Premium Video Splash Screen Transition Logic
(function () {
  const splash = document.getElementById("intro-splash");
  const video = document.getElementById("intro-video");
  let splashTransitioned = false;

  // Check if splash was already played in this session
  if (sessionStorage.getItem("splashPlayed")) {
    if (splash) {
      splash.remove();
    }
    document.body.classList.remove("splash-active");
    return;
  }

  function fadeOutSplash() {
    if (splashTransitioned) return;
    splashTransitioned = true;

    // Mark as played
    sessionStorage.setItem("splashPlayed", "true");

    if (splash) {
      splash.classList.add("fade-out");
      document.body.classList.remove("splash-active");

      // Clean up the DOM after transition finishes (1500ms matches CSS transition)
      setTimeout(() => {
        splash.remove();
      }, 1500);
    }
  }

  if (video) {
    // Set video playback rate to 1.5x speed for snappy, premium delivery
    video.playbackRate = 1.5;
    video.addEventListener("loadedmetadata", () => {
      video.playbackRate = 1.5;
    });

    // Modern browsers sometimes block autoplay or fail.
    // Fall-through backup safety timer of 8 seconds to ensure user is not stuck.
    let safetyTimeout = setTimeout(() => {
      console.log("Splash screen safety fallback triggered.");
      fadeOutSplash();
    }, 8000);

    // Transition immediately when the video completes playback naturally (where the logo is fully displayed at the end of the video)
    video.addEventListener("ended", () => {
      clearTimeout(safetyTimeout);
      console.log("Video ended. Transitioning immediately to the home page...");
      fadeOutSplash();
    });

    // Explicitly trigger play to handle potential browser autoplay restrictions
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn("Autoplay was prevented by browser policy:", error);
        // If autoplay is blocked, clear timeout and fade out immediately instead of waiting
        clearTimeout(safetyTimeout);
        fadeOutSplash();
      });
    }
  } else {
    // Fall-safe if the video tag isn't loaded/found
    fadeOutSplash();
  }
})();

// --- INTERACTIVE RESTAURANT STATE ENGINE ---

// 1. Shahi Menu Category Filtering
function filterMenu(category, clickedBtn) {
  const sections = document.querySelectorAll(".menu-tier-section");
  const buttons = document.querySelectorAll(".menu-tab-btn");

  // Toggle active tab buttons styling
  buttons.forEach((btn) => btn.classList.remove("active"));
  if (clickedBtn) clickedBtn.classList.add("active");

  const transitionDuration = 300; // ms

  function fadeElement(el, show) {
    if (!el) return;
    if (el.fadeTimeout1) clearTimeout(el.fadeTimeout1);
    if (el.fadeTimeout2) clearTimeout(el.fadeTimeout2);
    if (show) {
      el.style.display = "block";
      el.fadeTimeout1 = setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "scale(1)";
      }, 50);
    } else {
      el.style.opacity = "0";
      el.style.transform = "scale(0.98)";
      el.fadeTimeout2 = setTimeout(() => {
        el.style.display = "none";
      }, transitionDuration);
    }
  }

  sections.forEach((section) => {
    if (section) {
      section.style.transition = `opacity ${transitionDuration}ms ease, transform ${transitionDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
      section.style.transformOrigin = "top center";
      
      if (category === "all") {
        fadeElement(section, true);
      } else {
        const targetId = category + "-menu-section";
        fadeElement(section, section.id === targetId);
      }
    }
  });
}
// 2. Cart State Management
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("coastaltawa_cart")) || [];
} catch (e) {
  console.error("Failed to parse cart from localStorage:", e);
  cart = [];
}

function addToCart(name, price) {
  const existingItem = cart.find((item) => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }

  // Render Ledger
  renderCart();

  // Show toast notification instead of opening drawer directly
  // toggleCartDrawer(true);
  showToast(`Added ${name} to cart`);

  const badge = document.getElementById("cart-badge-count");
  badge.classList.add("badge-highlight");
  setTimeout(() => badge.classList.remove("badge-highlight"), 500);
}

function updateCartQuantity(name, newQty) {
  const item = cart.find((item) => item.name === name);
  if (item) {
    item.quantity = parseInt(newQty);
    if (item.quantity <= 0) {
      removeFromCart(name);
      return;
    }
  }
  renderCart();
}

function removeFromCart(name) {
  cart = cart.filter((item) => item.name !== name);
  renderCart();
}

function renderCart() {
  const itemsContainer = document.getElementById("cart-items-list");
  const subtotalEl = document.getElementById("cart-subtotal");
  const taxEl = document.getElementById("cart-tax");
  const totalEl = document.getElementById("cart-total");
  const checkoutBtn = document.getElementById("proceed-checkout-btn");
  const badgeCount = document.getElementById("cart-badge-count");

  // Save cart state
  localStorage.setItem("coastaltawa_cart", JSON.stringify(cart));

  if (cart.length === 0) {
    itemsContainer.innerHTML = `<p class="empty-cart-msg">Your cart is empty. Add delicacies from our coastal menu.</p>`;
    subtotalEl.innerText = "₹ 0";
    taxEl.innerText = "₹ 0";
    totalEl.innerText = "₹ 0";
    checkoutBtn.disabled = true;
    badgeCount.innerText = "0";
    return;
  }

  // Render Cart Item Rows
  itemsContainer.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item-row">
      <div class="cart-item-info">
        <h4>${item.name}</h4>
        <span>₹ ${item.price} each</span>
      </div>
      <div class="cart-item-actions">
        <div class="qty-adjuster">
          <button onclick="updateCartQuantity('${item.name}', ${item.quantity - 1})">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartQuantity('${item.name}', ${item.quantity + 1})">+</button>
        </div>
        <button class="remove-item-btn" onclick="removeFromCart('${item.name}')">&times;</button>
      </div>
    </div>
  `,
    )
    .join("");

  // Calculate Costs
  let subtotal = 0;
  let totalItems = 0;
  cart.forEach((item) => {
    subtotal += item.price * item.quantity;
    totalItems += item.quantity;
  });

  const tax = Math.round(subtotal * 0.1); // 10% combined CGST & SGST
  const grandTotal = subtotal + tax;

  subtotalEl.innerText = `₹ ${subtotal}`;
  taxEl.innerText = `₹ ${tax}`;
  totalEl.innerText = `₹ ${grandTotal}`;
  badgeCount.innerText = totalItems;
  checkoutBtn.disabled = false;

  // Save cart state
  localStorage.setItem("coastaltawa_cart", JSON.stringify(cart));

  // Pre-populate checkout modal totals
  document.getElementById("checkout-count").innerText =
    `${totalItems} Delicacies`;
  document.getElementById("checkout-total-price").innerText = `₹ ${grandTotal}`;
}

// 3. Drawer Toggles
function toggleCartDrawer(isOpen) {
  const drawer = document.getElementById("cart-drawer");
  const backdrop = document.getElementById("cart-drawer-backdrop");
  if (isOpen) {
    drawer.classList.add("open");
    backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  } else {
    drawer.classList.remove("open");
    backdrop.classList.remove("open");
    document.body.style.overflow = "";
  }
}

// 4. Checkout & Payment Modals
function openCheckoutModal() {
  toggleCartDrawer(false);
  document.getElementById("checkout-modal").classList.add("open");
  document.getElementById("checkout-modal-backdrop").classList.add("open");
}

function closeCheckoutModal() {
  document.getElementById("checkout-modal").classList.remove("open");
  document.getElementById("checkout-modal-backdrop").classList.remove("open");
}

function togglePaymentFields(method) {
  const cardBtn = document.getElementById('pay-method-card');
  const upiBtn = document.getElementById('pay-method-upi');
  const codBtn = document.getElementById('pay-method-cod');
  
  const cardFields = document.getElementById('card-fields');
  const upiFields = document.getElementById('upi-fields');
  const codFields = document.getElementById('cod-fields');
  
  if(cardBtn) cardBtn.classList.remove('active');
  if(upiBtn) upiBtn.classList.remove('active');
  if(codBtn) codBtn.classList.remove('active');
  
  if(cardFields) cardFields.classList.add('hidden');
  if(upiFields) upiFields.classList.add('hidden');
  if(codFields) codFields.classList.add('hidden');
  
  const cardInputs = cardFields ? cardFields.querySelectorAll('input') : [];
  const upiInputs = upiFields ? upiFields.querySelectorAll('input') : [];
  cardInputs.forEach(i => i.removeAttribute('required'));
  upiInputs.forEach(i => i.removeAttribute('required'));

  if (method === 'card') {
    if(cardBtn) cardBtn.classList.add('active');
    if(cardFields) cardFields.classList.remove('hidden');
    cardInputs.forEach(i => i.setAttribute('required', 'true'));
  } else if (method === 'upi') {
    if(upiBtn) upiBtn.classList.add('active');
    if(upiFields) upiFields.classList.remove('hidden');
    upiInputs.forEach(i => i.setAttribute('required', 'true'));
  } else if (method === 'cod') {
    if(codBtn) codBtn.classList.add('active');
    if(codFields) codFields.classList.remove('hidden');
  }
}

// 5. Payment Processing & Success State
function processPayment(event) {
  event.preventDefault();

  const payBtn = document.getElementById("pay-now-btn");
  const originalText = payBtn.innerText;

  // Transition button to loading status
  payBtn.disabled = true;
  payBtn.innerHTML = `<span class="spinner"></span> Authorizing Payment...`;

  setTimeout(() => {
    // Payment Successful
    closeCheckoutModal();
    alert(
      "Payment completed successfully! Your order is confirmed.",
    );

    // Clear Cart
    cart = [];
    renderCart();

    // Start tracking carriage
    openTrackingModal();
    startTrackingEngine();

    // Restore button text
    payBtn.disabled = false;
    payBtn.innerText = originalText;
  }, 2200);
}

// 6. Live Carriage Order Dispatch Tracker
let trackingInterval = null;

function openTrackingModal() {
  document.getElementById("tracking-modal").classList.add("open");
  document.getElementById("tracking-modal-backdrop").classList.add("open");
}

function closeTrackingModal() {
  document.getElementById("tracking-modal").classList.remove("open");
  document.getElementById("tracking-modal-backdrop").classList.remove("open");
  if (trackingInterval) clearInterval(trackingInterval);
}

function startTrackingEngine() {
  const timerEl = document.getElementById("tracking-timer");
  const statusEl = document.getElementById("tracking-status-text");

  const step1 = document.getElementById("step-1");
  const step2 = document.getElementById("step-2");
  const step3 = document.getElementById("step-3");
  const step4 = document.getElementById("step-4");

  // Reset stages
  step2.className = "step";
  step3.className = "step";
  step4.className = "step";

  statusEl.innerText = "Order received by The Coastal Tawa kitchen...";

  let timeRemainingSeconds = 25 * 60; // 25:00 minutes

  // Clear any existing tracking interval
  if (trackingInterval) clearInterval(trackingInterval);

  let ticks = 0;

  trackingInterval = setInterval(() => {
    ticks++;
    timeRemainingSeconds--;

    // Format minutes and seconds
    const minutes = Math.floor(timeRemainingSeconds / 60);
    const seconds = timeRemainingSeconds % 60;
    timerEl.innerText = `${minutes}:${seconds.toString().padStart(2, "0")}`;

    // Progress Stepper Updates
    if (ticks === 6) {
      // Step 2 is reached: Kitchen Preparation
      step1.className = "step active";
      step2.className = "step active";
      statusEl.innerText =
        "Our chefs have commenced preparing your coastal feast...";
    } else if (ticks === 14) {
      // Step 3 is reached: Dispatch
      step3.className = "step active";
      statusEl.innerText =
        "Your delivery partner has departed with your order...";
    } else if (ticks === 22) {
      // Step 4 is reached: Arrived
      step4.className = "step active";
      statusEl.innerText =
        "Order arrived! Enjoy your coastal feast.";
      clearInterval(trackingInterval);
    }

    if (timeRemainingSeconds <= 0) {
      clearInterval(trackingInterval);
    }
  }, 1000);
}

// 7. Manage quantity directly on separate Menu Page
const menuQuantities = {};

function adjustMenuQty(name, amount) {
  if (!menuQuantities[name]) {
    menuQuantities[name] = 1;
  }
  menuQuantities[name] += amount;
  if (menuQuantities[name] < 1) {
    menuQuantities[name] = 1;
  }
  const el = document.getElementById(`menu-qty-${name}`);
  if (el) {
    el.innerText = menuQuantities[name];
  }
}

function addMenuToCart(name, price) {
  const qty = menuQuantities[name] || 1;
  const existingItem = cart.find((item) => item.name === name);
  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    cart.push({ name, price, quantity: qty });
  }

  // Reset quantity input on menu card back to 1
  menuQuantities[name] = 1;
  const el = document.getElementById(`menu-qty-${name}`);
  if (el) {
    el.innerText = 1;
  }

  renderCart();
  // toggleCartDrawer(true); // Disable automatic drawer slide to rely on toast instead
  showToast(`Added ${qty}x ${name} to cart`);

  // Micro-animation trigger
  const badge = document.getElementById("cart-badge-count");
  if (badge) {
    badge.classList.add("badge-highlight");
    setTimeout(() => badge.classList.remove("badge-highlight"), 500);
  }
}

// 8. Auto-render cart on load to sync between separate pages
function initApp() {
  renderCart();

  // Add subtle fade-in transition to active page bodies for luxury feel
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.6s ease";
  setTimeout(() => {
    document.body.style.opacity = "1";
  }, 100);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}



function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="var(--accent)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}
