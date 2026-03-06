// Script pour Digital-Play
document.addEventListener('DOMContentLoaded', function() {
    // Simuler base de données avec localStorage
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    let wallet = JSON.parse(localStorage.getItem('wallet')) || { solde: 0, historique: [] };
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let recharges = JSON.parse(localStorage.getItem('recharges')) || [];

    // Fonctions utilitaires
    function saveData() {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('wallet', JSON.stringify(wallet));
        localStorage.setItem('transactions', JSON.stringify(transactions));
        localStorage.setItem('recharges', JSON.stringify(recharges));
    }

    function updateWalletDisplay() {
        const soldeEl = document.getElementById('solde');
        const userSoldeEl = document.getElementById('user-solde');
        if (soldeEl) soldeEl.textContent = wallet.solde + ' HTG';
        if (userSoldeEl) userSoldeEl.textContent = wallet.solde + ' HTG';
    }

    function updateHistorique() {
        const list = document.getElementById('historique-list');
        if (list) {
            list.innerHTML = wallet.historique.map(t => `<li>${t}</li>`).join('');
        }
    }

    // Authentification
    const loginForm = document.getElementById('login');
    const registerForm = document.getElementById('register');
    const showRegister = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');
    const dashboard = document.getElementById('dashboard');
    const auth = document.getElementById('auth');
    const logoutBtn = document.getElementById('logout');

    if (showRegister) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });
    }

    if (showLogin) {
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const user = users.find(u => (u.email === email || u.phone === email) && u.password === password);
            if (user) {
                currentUser = user;
                saveData();
                auth.style.display = 'none';
                dashboard.style.display = 'block';
                updateWalletDisplay();
            } else {
                alert('Identifiants incorrects');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const nom = document.getElementById('reg-nom').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            users.push({ nom, email, password });
            saveData();
            alert('Inscription réussie !');
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            currentUser = null;
            saveData();
            dashboard.style.display = 'none';
            auth.style.display = 'block';
        });
    }

    // Wallet
    const rechargeForm = document.getElementById('recharge-form');
    if (rechargeForm) {
        rechargeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const montant = parseInt(document.getElementById('montant').value);
            const methode = document.getElementById('methode').value;
            const preuve = document.getElementById('preuve').files[0];
            if (!preuve) {
                alert('Veuillez uploader une preuve de paiement.');
                return;
            }
            // Simuler l'upload : stocker le nom du fichier
            recharges.push({ montant, methode, status: 'En attente', preuve: preuve.name });
            saveData();
            alert('Demande de recharge avec preuve envoyée !');
        });
    }

    // Free Fire Recharge
    const freefireForm = document.getElementById('freefire-form');
    if (freefireForm) {
        freefireForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!currentUser) {
                alert('Veuillez vous connecter pour acheter.');
                return;
            }
            const playerId = document.getElementById('player-id').value;
            const pack = document.getElementById('pack').value;
            const prix = parseInt(pack.split(' - ')[1]);
            if (wallet.solde >= prix) {
                wallet.solde -= prix;
                wallet.historique.push(`Achat de ${pack} pour Player ID ${playerId}`);
                transactions.push({ user: currentUser.email, produit: `Free Fire ${pack}`, prix });
                saveData();
                updateWalletDisplay();
                updateHistorique();
                alert('Achat réussi ! Diamants envoyés à votre Player ID.');
            } else {
                alert('Solde insuffisant. Veuillez recharger votre wallet.');
            }
        });
    }

    // Produits
    const buyButtons = document.querySelectorAll('.produit button');
    buyButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (!currentUser) {
                alert('Veuillez vous connecter pour acheter.');
                return;
            }
            const produit = this.parentElement.querySelector('h3').textContent;
            const prix = parseInt(this.parentElement.querySelector('p:nth-child(3)').textContent.split(' ')[1]);
            let playerId = '';
            if (produit.includes('Free Fire')) {
                playerId = prompt('Entrez votre Player ID Free Fire :');
                if (!playerId) return;
            }
            if (wallet.solde >= prix) {
                wallet.solde -= prix;
                wallet.historique.push(`Achat de ${produit} pour ${prix} HTG${playerId ? ` (Player ID: ${playerId})` : ''}`);
                transactions.push({ user: currentUser.email, produit, prix, playerId });
                saveData();
                updateWalletDisplay();
                updateHistorique();
                alert(`Achat réussi !${playerId ? ' Diamants envoyés à votre Player ID.' : ''}`);
            } else {
                alert('Solde insuffisant.');
            }
        });
    });

    // Contact
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Message envoyé !');
        });
    }

    // Admin (simulé)
    if (window.location.pathname.includes('admin.html')) {
        // Simuler données admin
        document.getElementById('users-list').innerHTML = users.map(u => `<li>${u.nom} - ${u.email}</li>`).join('');
        document.getElementById('transactions-list').innerHTML = transactions.map(t => `<li>${t.user} - ${t.produit} - ${t.prix} HTG</li>`).join('');
        document.getElementById('recharges-list').innerHTML = recharges.map(r => `<li>${r.montant} HTG via ${r.methode} - ${r.status} <button onclick="validateRecharge(${recharges.indexOf(r)})">Valider</button> <button onclick="rejectRecharge(${recharges.indexOf(r)})">Refuser</button></li>`).join('');
        document.getElementById('total-users').textContent = users.length;
        document.getElementById('total-transactions').textContent = transactions.length;
    }

    // Initialisation
    updateWalletDisplay();
    updateHistorique();
    if (currentUser && dashboard) {
        auth.style.display = 'none';
        dashboard.style.display = 'block';
    }
});

// Fonctions admin
function validateRecharge(index) {
    const recharges = JSON.parse(localStorage.getItem('recharges')) || [];
    const wallet = JSON.parse(localStorage.getItem('wallet')) || { solde: 0, historique: [] };
    wallet.solde += recharges[index].montant;
    wallet.historique.push(`Recharge de ${recharges[index].montant} HTG validée`);
    recharges[index].status = 'Validé';
    localStorage.setItem('recharges', JSON.stringify(recharges));
    localStorage.setItem('wallet', JSON.stringify(wallet));
    location.reload();
}

function rejectRecharge(index) {
    const recharges = JSON.parse(localStorage.getItem('recharges')) || [];
    recharges[index].status = 'Refusé';
    localStorage.setItem('recharges', JSON.stringify(recharges));
    location.reload();
}