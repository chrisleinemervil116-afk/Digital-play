const SUPABASE_URL = 'https://zynblmmdtpyhdeabwxnh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_GwCmIhhrrNeSSzDbtxMJdA_FFD8giZd';

const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
};

const STATUS_PENDING = 'En attente';
const STATUS_APPROVED = 'Validée';
const STATUS_REJECTED = 'Rejetée';

function createPendingOrder(label) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    label,
    status: STATUS_PENDING,
    createdAt: new Date().toISOString()
  };
}

function normalizeOrders(rawOrders) {
  return (rawOrders || []).map((entry) => {
    if (typeof entry === 'string') return createPendingOrder(entry);
    return {
      id: entry.id || `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      label: entry.label || entry.text || 'Commande',
      status: entry.status || STATUS_PENDING,
      createdAt: entry.createdAt || new Date().toISOString()
    };
  });
}

function statusClass(status) {
  if (status === STATUS_APPROVED) return 'status-approved';
  if (status === STATUS_REJECTED) return 'status-rejected';
  return 'status-pending';
}


window.addEventListener('load', () => {
  setTimeout(() => document.getElementById('loader')?.classList.add('hide'), 650);
  initParticles();
  animateCounters();
  initFilters();
  initWallet();
  initForms();
  initAdmin();
  initBuyButtons();
  initFreeFireOrder();
  initProductPage();
  initSupabase();
});

function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  const ctx = c.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  let w, h;
  const nodes = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .0013, vy: (Math.random() - .5) * .0013 }));
  const resize = () => { w = c.width = innerWidth * dpr; h = c.height = innerHeight * dpr; };
  resize(); addEventListener('resize', resize);
  (function loop() {
    ctx.clearRect(0, 0, w, h);
    nodes.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > 1) p.vx *= -1;
      if (p.y < 0 || p.y > 1) p.vy *= -1;
      ctx.beginPath(); ctx.fillStyle = 'rgba(34,211,238,.8)'; ctx.arc(p.x * w, p.y * h, 1.7 * dpr, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(loop);
  })();
}

function animateCounters() {
  document.querySelectorAll('.counter').forEach(el => {
    const target = Number(el.dataset.target || 0);
    let current = 0;
    const step = Math.max(20, Math.floor(target / 120));
    const itv = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(itv); }
      el.textContent = `${current.toLocaleString('fr-FR')}+`;
    }, 16);
  });
}

function initFilters() {
  const game = document.getElementById('filter-game');
  const price = document.getElementById('filter-price');
  const tag = document.getElementById('filter-tag');
  if (!game || !price || !tag) return;
  const cards = [...document.querySelectorAll('.product-card')];
  [game, price, tag].forEach(select => select.addEventListener('change', () => {
    cards.forEach(card => {
      const p = Number(card.dataset.price);
      const matchesGame = game.value === 'all' || card.dataset.game === game.value;
      const matchesTag = tag.value === 'all' || card.dataset.tag === tag.value;
      const matchesPrice = price.value === 'all' || (price.value === 'low' && p < 200) || (price.value === 'mid' && p >= 200 && p <= 500) || (price.value === 'high' && p > 500);
      card.style.display = matchesGame && matchesTag && matchesPrice ? 'block' : 'none';
    });
  }));
}

function initWallet() {
  const balanceEl = document.getElementById('wallet-balance');
  const historyEl = document.getElementById('wallet-history');
  if (!balanceEl || !historyEl) return;
  const wallet = store.get('wallet', { balance: 0, history: [] });
  const rechargeRequests = store.get('rechargeRequests', []);
  renderWallet(wallet);

  document.getElementById('wallet-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById('amount').value || 0);
    const method = document.getElementById('method').value;
    const fullname = document.getElementById('fullname').value.trim();
    const emailOrUsername = document.getElementById('username-email').value.trim();
    const paidNumber = document.getElementById('paid-number').value.trim();
    const paymentDate = document.getElementById('payment-date').value;
    const proofFile = document.getElementById('proof').files[0];
    if (amount <= 0 || !method || !fullname || !emailOrUsername || !paidNumber || !paymentDate || !proofFile) return;

    rechargeRequests.unshift({
      fullname,
      emailOrUsername,
      amount,
      method,
      paidNumber,
      paymentDate,
      proofFile: proofFile.name,
      status: STATUS_PENDING
    });
    store.set('rechargeRequests', rechargeRequests);

    wallet.history.unshift(`Demande recharge ${method}: ${amount.toLocaleString('fr-FR')} HTG (En attente)`);
    store.set('wallet', wallet);
    renderWallet(wallet);

    alert(`Votre demande de recharge a été envoyée avec succès.
Notre équipe va vérifier votre paiement et ajouter le solde dans votre wallet.
Merci d’utiliser Digital-Play 🌟`);
    e.target.reset();
  });

  document.getElementById('btn-withdraw')?.addEventListener('click', () => {
    const amount = 500;
    if (wallet.balance >= amount) {
      wallet.balance -= amount;
      wallet.history.unshift(`Retrait: -${amount.toLocaleString('fr-FR')} HTG`);
      store.set('wallet', wallet);
      renderWallet(wallet);
    } else {
      alert('Solde insuffisant pour le retrait.');
    }
  });

  function renderWallet(w) {
    balanceEl.textContent = `${w.balance.toLocaleString('fr-FR')} HTG`;
    historyEl.innerHTML = w.history.length ? w.history.map(i => `<li>${i}</li>`).join('') : '<li>Aucune transaction pour le moment.</li>';
  }
}

function initForms() {
  const users = store.get('users', []);
  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    users.push({ name, email });
    store.set('users', users);
    alert('Compte créé avec succès.');
    e.target.reset();
  });
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Connexion réussie (mode démo).');
  });
  document.getElementById('contact-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Message envoyé. Notre équipe vous répond rapidement.');
    e.target.reset();
  });
}

function initBuyButtons() {
  const orders = normalizeOrders(store.get('orders', []));
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.closest('.product-card').querySelector('h3').textContent;
      orders.unshift(createPendingOrder(`${name} commandé`));
      store.set('orders', orders);
      alert(`${name} ajouté à votre commande.`);
    });
  });
}

function initAdmin() {
  if (!location.pathname.includes('admin')) return;
  const users = store.get('users', []);
  const orders = normalizeOrders(store.get('orders', []));
  const recharges = store.get('rechargeRequests', []);
  const products = store.get('adminProducts', []);

  const userList = document.getElementById('admin-users');
  const orderList = document.getElementById('admin-orders');
  const rechargeList = document.getElementById('admin-recharges');
  document.getElementById('stat-orders').textContent = orders.length;
  document.getElementById('stat-users').textContent = users.length;
  document.getElementById('stat-payments').textContent = recharges.length;

  userList.innerHTML = users.length ? users.map(u => `<li>${u.name} • ${u.email}</li>`).join('') : '<li>Aucun utilisateur enregistré.</li>';

  function renderAdminLists() {
    orderList.innerHTML = orders.length ? orders.map((o, i) => `
      <li class="admin-item">
        <div><strong>${o.label}</strong></div>
        <div class="meta"><span class="status-badge ${statusClass(o.status)}">${o.status}</span></div>
        <div class="admin-actions">
          <button class="view-btn" data-order-action="approve" data-order-index="${i}" type="button">Valider</button>
          <button class="view-btn" data-order-action="reject" data-order-index="${i}" type="button">Rejeter</button>
        </div>
      </li>`).join('') : '<li>Aucune commande.</li>';

    if (rechargeList) {
      rechargeList.innerHTML = recharges.length ? recharges.map((r, i) => `
        <li class="admin-item">
          <div><strong>${r.fullname}</strong> • ${Number(r.amount || 0).toLocaleString('fr-FR')} HTG via ${r.method || '-'}</div>
          <div class="meta">${r.emailOrUsername || '-'} • ${r.paidNumber || '-'} • <span class="status-badge ${statusClass(r.status)}">${r.status || STATUS_PENDING}</span></div>
          <div class="admin-actions">
            <button class="view-btn" data-recharge-action="approve" data-recharge-index="${i}" type="button">Valider</button>
            <button class="view-btn" data-recharge-action="reject" data-recharge-index="${i}" type="button">Rejeter</button>
          </div>
        </li>`).join('') : '<li>Aucune demande de recharge.</li>';
    }
  }

  renderAdminLists();
  store.set('orders', orders);

  orderList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-order-action]');
    if (!button) return;
    const index = Number(button.dataset.orderIndex);
    const action = button.dataset.orderAction;
    if (!orders[index]) return;
    orders[index].status = action === 'approve' ? STATUS_APPROVED : STATUS_REJECTED;
    store.set('orders', orders);
    renderAdminLists();
  });

  rechargeList?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-recharge-action]');
    if (!button) return;
    const index = Number(button.dataset.rechargeIndex);
    const action = button.dataset.rechargeAction;
    const request = recharges[index];
    if (!request) return;

    request.status = action === 'approve' ? STATUS_APPROVED : STATUS_REJECTED;

    if (action === 'approve') {
      const wallet = store.get('wallet', { balance: 0, history: [] });
      const amount = Number(request.amount || 0);
      wallet.balance += amount;
      wallet.history.unshift(`Recharge validée (${request.method}): +${amount.toLocaleString('fr-FR')} HTG`);
      store.set('wallet', wallet);
    }

    store.set('rechargeRequests', recharges);
    renderAdminLists();
  });

  document.getElementById('admin-product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('admin-product-name').value;
    const price = Number(document.getElementById('admin-product-price').value);
    products.push({ name, price });
    store.set('adminProducts', products);
    document.getElementById('stat-products').textContent = 5 + products.length;
    alert('Produit ajouté au catalogue admin.');
    e.target.reset();
  });
}



function initFreeFireOrder() {
  const form = document.getElementById('ff-order-form');
  const offer = document.getElementById('ff-offer');
  const selectedPrice = document.getElementById('ff-selected-price');
  if (!form || !offer || !selectedPrice) return;

  const updatePrice = () => {
    const value = Number(offer.value || 0);
    selectedPrice.textContent = `Prix sélectionné : ${value.toLocaleString('fr-FR')} HTG`;
  };

  offer.addEventListener('change', updatePrice);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const playerId = document.getElementById('ff-player-id').value.trim();
    const accountName = document.getElementById('ff-account-name').value.trim();
    const amount = Number(offer.value || 0);
    if (!playerId || !accountName || amount <= 0) return;

    const orders = normalizeOrders(store.get('orders', []));
    orders.unshift(createPendingOrder(`Free Fire Diamonds (${amount.toLocaleString('fr-FR')} HTG) - ${accountName} / ID ${playerId}`));
    store.set('orders', orders);

    alert('Commande Free Fire enregistrée. Vérification rapide et livraison des diamants en cours.');
    form.reset();
    updatePrice();
  });

  updatePrice();
}


function initProductPage() {
  const image = document.getElementById('detail-image');
  const title = document.getElementById('detail-title');
  const description = document.getElementById('detail-description');
  const price = document.getElementById('detail-price');
  const offersWrap = document.getElementById('detail-offers-wrap');
  const offersList = document.getElementById('detail-offers');
  const requiredInfoWrap = document.getElementById('ff-required-info');
  const playerIdInput = document.getElementById('detail-player-id');
  const accountNameInput = document.getElementById('detail-account-name');
  const copyRequiredInfoButton = document.getElementById('copy-required-info');
  const accountRequiredInfoWrap = document.getElementById('account-required-info');
  const accountEmailInput = document.getElementById('detail-account-email');
  const accountPasswordInput = document.getElementById('detail-account-password');
  const accountWhatsappInput = document.getElementById('detail-account-whatsapp');
  const pubgRequiredInfoWrap = document.getElementById('pubg-required-info');
  const pubgEmailInput = document.getElementById('detail-pubg-email');
  const buyButton = document.getElementById('detail-buy');
  if (!image || !title || !description || !price || !buyButton) return;

  const products = {
    'free-fire': {
      title: 'Free Fire - Diamants',
      price: 'À partir de 157 HTG',
      description: 'Recharge rapide et sécurisée de diamants Free Fire.',
      image: 'assets/products/free-fire.svg',
      offers: [
        '100 + 10 Diamonds — 160 HTG',
        '210 + 10 Diamonds — 330 HTG',
        '310 + 31 Diamonds — 490 HTG',
        '420 + 21 Diamonds — 550 HTG',
        '1060 + 106 Diamonds — 1600 HTG'
      ]
    },
    'fc-mobile': {
      title: 'FC Mobile - Points',
      price: 'À partir de 95 Gdes',
      description: 'Achetez vos points FC Mobile instantanément.',
      image: 'assets/products/fc-mobile.svg',
      offers: [
        '40 Points - 95 Gdes',
        '100 Points - 210 Gdes',
        '500 + 20 Bonus Points - 1085 Gdes',
        '1000 + 70 Bonus Points - 2192 Gdes',
        '2000 + 200 Bonus Points - 4250 Gdes',
        '5000 + 750 Bonus Points - 20750 Gdes',
        '10000 + 2000 Bonus Points - 10500 Gdes'
      ]
    },
    'efootball': {
      title: 'eFootball - Pièces',
      price: 'À partir de 220 HTG',
      description: 'Pièces eFootball pour booster votre équipe.',
      image: 'assets/products/efootball.svg',
      offers: [
        '130 pièces — 220 HTG',
        '300 pièces — 550 HTG',
        '550 pièces — 885 HTG',
        '1 040 pièces — 1625 HTG',
        '2 130 pièces — 3140 HTG',
        '3 250 pièces — 4675 HTG',
        '12 800 pièces — 16230 HTG'
      ]
    },
    'pubg-mobile': {
      title: 'PUBG Mobile - UC',
      price: 'À partir de 180 HTG',
      description: 'UC livrés rapidement pour PUBG Mobile.',
      image: 'assets/products/pubg-mobile.svg',
      offers: [
        '60 UC - 180 HTG',
        '300+25 UC - 891 HTG',
        '600+60 UC - 1780 HTG',
        '1500+300 UC - 4130 HTG',
        '3000+850 UC - 8075 HTG'
      ]
    },
    'blood-strike': { title: 'Blood Strike - GOLD', price: 'À partir de 157 HTG', description: 'Top-up GOLD Blood Strike en quelques minutes.', image: 'assets/products/blood-strike.svg', offers: [] },
    'roblox': { title: 'Roblox - Robux', price: 'À partir de 750 HTG', description: 'Recharge Robux pour vos achats premium.', image: 'assets/products/roblox.svg', offers: [] },
    'dls': {
      title: 'DLS 26 - Coins & Gems',
      price: 'À partir de 400 HTG',
      description: 'Packs coins et gems DLS 26 pour construire l\'équipe ultime.',
      image: 'assets/products/dls.svg',
      offers: [
        'Packs coins',
        '900 Coins - 400 HTG',
        '1950 Coins - 825 HTG',
        '3450 Coins - 1400 HTG',
        '6700 Coins - 2375 HTG',
        '14500 Coins - 4000 HTG',
        '40500 Coins - 9250 HTG',
        'Packs gem',
        '90 Gems - 400 HTG',
        '400 Gems - 1600 HTG',
        '910 Gems - 3400 HTG',
        '2700 Gems - 8850 HTG',
        '6000 Gems - 20250 HTG'
      ]
    },
    'minecraft': { title: 'Minecraft - Minecoins', price: 'À partir de 316 HTG', description: 'Minecoins pour skins, maps et packs Minecraft.', image: 'assets/products/minecraft.svg', offers: [] },
    'flex-city': { title: 'Flex City', price: 'À partir de 195 HTG', description: 'Crédits Flex City livrés après validation.', image: 'assets/products/flex-city.svg', offers: [] }
  };

  const productSlug = new URLSearchParams(window.location.search).get('product') || 'free-fire';
  const selected = products[productSlug] || products['free-fire'];

  image.src = selected.image;
  image.alt = selected.title;
  title.textContent = selected.title;
  description.textContent = selected.description;
  price.textContent = selected.price;

  if (offersWrap && offersList) {
    if (selected.offers && selected.offers.length) {
      offersWrap.style.display = 'block';
      offersList.innerHTML = selected.offers.map((offer) => `<li>${offer}</li>`).join('');
    } else {
      offersWrap.style.display = 'none';
      offersList.innerHTML = '';
    }
  }

  const isFreeFire = productSlug === 'free-fire';
  const isFcMobile = productSlug === 'fc-mobile';
  const needsAccountInfo = isFcMobile || productSlug === 'efootball' || productSlug === 'dls';
  const isPubgMobile = productSlug === 'pubg-mobile';

  if (requiredInfoWrap) {
    requiredInfoWrap.style.display = isFreeFire ? 'block' : 'none';
  }
  if (accountRequiredInfoWrap) {
    accountRequiredInfoWrap.style.display = needsAccountInfo ? 'block' : 'none';
  }
  if (pubgRequiredInfoWrap) {
    pubgRequiredInfoWrap.style.display = isPubgMobile ? 'block' : 'none';
  }

  copyRequiredInfoButton?.addEventListener('click', async () => {
    if (!playerIdInput || !accountNameInput) return;
    const copyText = `Player ID: ${playerIdInput.value.trim() || '________'}\nNom du compte: ${accountNameInput.value.trim() || '________'}`;
    try {
      await navigator.clipboard.writeText(copyText);
      alert('Informations copiées.');
    } catch (error) {
      console.warn('Copie impossible:', error);
      alert('Impossible de copier automatiquement.');
    }
  });

  buyButton.addEventListener('click', () => {
    let orderText = `${selected.title} commandé via page dédiée`;

    if (isFreeFire) {
      const playerId = playerIdInput?.value.trim() || '';
      const accountName = accountNameInput?.value.trim() || '';
      if (!playerId || !accountName) {
        alert('Player ID et Nom du compte sont obligatoires pour Free Fire.');
        return;
      }
      orderText = `${selected.title} - ${accountName} / ID ${playerId}`;
    }

    if (needsAccountInfo) {
      const email = accountEmailInput?.value.trim() || '';
      const password = accountPasswordInput?.value.trim() || '';
      const whatsapp = accountWhatsappInput?.value.trim() || '';
      if (!email || !password || !whatsapp) {
        alert('Email du compte, mot de passe et numéro WhatsApp sont obligatoires.');
        return;
      }
      orderText = `${selected.title} - Email ${email} / WhatsApp ${whatsapp}`;
    }

    if (isPubgMobile) {
      const pubgEmail = pubgEmailInput?.value.trim() || '';
      if (!pubgEmail) {
        alert("E-mail du compte est obligatoire pour PUBG Mobile.");
        return;
      }
      orderText = `${selected.title} - E-mail ${pubgEmail}`;
    }

    const orders = normalizeOrders(store.get('orders', []));
    orders.unshift(createPendingOrder(orderText));
    store.set('orders', orders);
    alert('Commande enregistrée avec succès.');
  });
}


function initSupabase() {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.warn('Supabase SDK non chargé.');
    return;
  }

  try {
    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    window.supabaseClient = client;

    client.auth.getSession()
      .then(() => console.info('Supabase connecté avec succès.'))
      .catch((error) => console.warn('Supabase connecté, mais session non disponible:', error?.message || error));
  } catch (error) {
    console.error('Échec de connexion Supabase:', error);
  }
}
