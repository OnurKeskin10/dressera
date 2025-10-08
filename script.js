// Kullanıcı ve Sepet Yönetimi
class ShopManager {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.orders = JSON.parse(localStorage.getItem('orders')) || [];
    }

    // Kullanıcı Kayıt
    register(name, email, password, confirmPassword) {
        if (!name || !email || !password || !confirmPassword) {
            return { success: false, message: 'Tüm alanlar zorunludur.' };
        }
        if (!this.validateEmail(email)) {
            return { success: false, message: 'Geçersiz e-posta adresi.' };
        }
        if (password.length < 8) {
            return { success: false, message: 'Şifre en az 8 karakter olmalı.' };
        }
        if (password !== confirmPassword) {
            return { success: false, message: 'Şifreler eşleşmiyor.' };
        }
        if (this.users.some(u => u.email === email)) {
            return { success: false, message: 'Bu e-posta zaten kullanılıyor.' };
        }

        this.users.push({ name, email, password, createdAt: new Date().toISOString() });
        localStorage.setItem('users', JSON.stringify(this.users));
        return { success: true, message: 'Kayıt başarılı!' };
    }

    // Kullanıcı Giriş
    login(username, password) {
        if (!username || !password) {
            return { success: false, message: 'Kullanıcı adı/e-posta ve şifre gerekli.' };
        }

        const user = this.users.find(u => 
            (u.email === username || u.name === username) && u.password === password
        );

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, message: 'Giriş başarılı!' };
        }
        return { success: false, message: 'Kullanıcı adı/e-posta veya şifre hatalı.' };
    }

    // Çıkış
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        return { success: true, message: 'Çıkış yapıldı.' };
    }

    // E-posta Validasyonu
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Sepete Ürün Ekle
    addToCart(product) {
        if (!this.currentUser) {
            return { success: false, message: 'Lütfen önce giriş yapın.', requiresLogin: true };
        }

        const existingProduct = this.cart.find(item => 
            item.id === product.id && item.size === product.size && item.color === product.color
        );

        if (existingProduct) {
            existingProduct.quantity += 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartBadge();
        return { success: true, message: `${product.name} sepete eklendi!` };
    }

    // Sepetten Ürün Çıkar
    removeFromCart(productId, size, color) {
        this.cart = this.cart.filter(item => 
            !(item.id === productId && item.size === size && item.color === color)
        );
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartBadge();
        return { success: true, message: 'Ürün sepetten çıkarıldı.' };
    }

    // Ürün Miktarını Güncelle
    updateQuantity(productId, size, color, quantity) {
        const product = this.cart.find(item => 
            item.id === productId && item.size === size && item.color === color
        );
        if (product) {
            if (quantity <= 0) {
                return this.removeFromCart(productId, size, color);
            }
            product.quantity = quantity;
            localStorage.setItem('cart', JSON.stringify(this.cart));
            return { success: true };
        }
        return { success: false };
    }

    // Sepeti Temizle
    clearCart() {
        this.cart = [];
        localStorage.setItem('cart', JSON.stringify(this.cart));
        this.updateCartBadge();
        return { success: true, message: 'Sepet temizlendi.' };
    }

    // Sepet Toplamı
    getCartTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Sepet Badge Güncelle
    updateCartBadge() {
        const badge = document.getElementById('cart-badge');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (badge) {
            if (totalItems > 0) {
                badge.textContent = totalItems;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Favorilere Ekle/Çıkar
    toggleFavorite(productId) {
        if (!this.currentUser) {
            return { success: false, message: 'Lütfen önce giriş yapın.', requiresLogin: true };
        }

        const index = this.favorites.indexOf(productId);
        if (index > -1) {
            this.favorites.splice(index, 1);
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            return { success: true, message: 'Favorilerden çıkarıldı.', isFavorite: false };
        } else {
            this.favorites.push(productId);
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
            return { success: true, message: 'Favorilere eklendi.', isFavorite: true };
        }
    }

    // Sipariş Oluştur
    createOrder(orderDetails) {
        if (!this.currentUser) {
            return { success: false, message: 'Lütfen önce giriş yapın.' };
        }
        if (this.cart.length === 0) {
            return { success: false, message: 'Sepetiniz boş.' };
        }

        const order = {
            id: 'ORD-' + Date.now(),
            userId: this.currentUser.email,
            items: [...this.cart],
            total: this.getCartTotal(),
            details: orderDetails,
            status: 'Beklemede',
            createdAt: new Date().toISOString()
        };

        this.orders.push(order);
        localStorage.setItem('orders', JSON.stringify(this.orders));
        this.clearCart();
        return { success: true, message: 'Siparişiniz alındı!', orderId: order.id };
    }

    // Kullanıcının Siparişlerini Getir
    getUserOrders() {
        if (!this.currentUser) return [];
        return this.orders.filter(order => order.userId === this.currentUser.email);
    }
}

// Toast Bildirimleri
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Global Instance
const shopManager = new ShopManager();

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı Durumunu Güncelle
    updateNavbar();
    shopManager.updateCartBadge();

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            const result = shopManager.login(username, password);
            if (result.success) {
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);
            } else {
                showToast(result.message, 'error');
            }
        });
    }

    // Register Form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();
            const confirmPassword = document.getElementById('confirm-password').value.trim();
            
            const result = shopManager.register(name, email, password, confirmPassword);
            if (result.success) {
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'login.html', 1000);
            } else {
                showToast(result.message, 'error');
            }
        });
    }

    // Payment Form
    const paymentForm = document.getElementById('payment-form');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const orderDetails = {
                fullName: document.getElementById('full-name').value.trim(),
                address: document.getElementById('address').value.trim(),
                phone: document.getElementById('phone')?.value.trim() || '',
                cardNumber: document.getElementById('card-number').value.replace(/\s/g, ''),
                expiryDate: document.getElementById('expiry-date').value.trim(),
                cvv: document.getElementById('cvv').value.trim()
            };

            // Validasyonlar
            if (!validatePaymentDetails(orderDetails)) return;

            const result = shopManager.createOrder(orderDetails);
            if (result.success) {
                showToast(result.message, 'success');
                setTimeout(() => window.location.href = 'siparisler.html', 1500);
            } else {
                showToast(result.message, 'error');
            }
        });
    }

    // Sepet Sayfası
    if (window.location.pathname.includes('sepet.html')) {
        displayCart();
        
        const clearCartBtn = document.getElementById('clear-cart');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', function() {
                if (confirm('Sepetinizi temizlemek istediğinizden emin misiniz?')) {
                    shopManager.clearCart();
                    displayCart();
                    showToast('Sepet temizlendi', 'success');
                }
            });
        }
    }

    // Siparişler Sayfası
    if (window.location.pathname.includes('siparisler.html')) {
        displayOrders();
    }
});

// Navbar Güncelle
function updateNavbar() {
    const loginBtn = document.querySelector('[href="login.html"]');
    const registerBtn = document.querySelector('[href="register.html"]');
    const navbarNav = document.querySelector('.navbar-nav');

    if (shopManager.currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Profil ve Çıkış butonları ekle
        if (navbarNav && !document.getElementById('user-menu')) {
            const userMenu = document.createElement('li');
            userMenu.className = 'nav-item dropdown';
            userMenu.id = 'user-menu';
            userMenu.innerHTML = `
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-circle"></i> ${shopManager.currentUser.name}
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="profil.html">Profilim</a></li>
                    <li><a class="dropdown-item" href="siparisler.html">Siparişlerim</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()">Çıkış Yap</a></li>
                </ul>
            `;
            navbarNav.insertBefore(userMenu, navbarNav.lastElementChild);
        }
    }
}

// Çıkış Fonksiyonu
function logout() {
    const result = shopManager.logout();
    showToast(result.message, 'success');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

// Sepeti Görüntüle
function displayCart() {
    const cartItemsDiv = document.getElementById('cart-items');
    const cartTotalDiv = document.getElementById('cart-total');

    if (!shopManager.currentUser) {
        cartItemsDiv.innerHTML = '<p class="text-center">Lütfen giriş yapın.</p>';
        cartTotalDiv.textContent = 'Toplam: 0 TL';
        return;
    }

    if (shopManager.cart.length === 0) {
        cartItemsDiv.innerHTML = '<p class="text-center">Sepetiniz boş.</p>';
        cartTotalDiv.textContent = 'Toplam: 0 TL';
        return;
    }

    cartItemsDiv.innerHTML = shopManager.cart.map(item => `
        <div class="cart-item card mb-3">
            <div class="card-body">
                <div class="row align-items-center">
                    <div class="col-md-2">
                        <img src="${item.image}" class="img-fluid rounded" alt="${item.name}">
                    </div>
                    <div class="col-md-4">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text text-muted">
                            ${item.size ? `Beden: ${item.size}` : ''} 
                            ${item.color ? `| Renk: ${item.color}` : ''}
                        </p>
                    </div>
                    <div class="col-md-2">
                        <p class="mb-0"><strong>${item.price} TL</strong></p>
                    </div>
                    <div class="col-md-2">
                        <div class="input-group">
                            <button class="btn btn-outline-secondary btn-sm" onclick="updateCartQuantity('${item.id}', '${item.size}', '${item.color}', ${item.quantity - 1})">-</button>
                            <input type="text" class="form-control form-control-sm text-center" value="${item.quantity}" readonly style="max-width: 50px;">
                            <button class="btn btn-outline-secondary btn-sm" onclick="updateCartQuantity('${item.id}', '${item.size}', '${item.color}', ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <div class="col-md-2 text-end">
                        <button class="btn btn-danger btn-sm" onclick="removeFromCart('${item.id}', '${item.size}', '${item.color}')">
                            <i class="bi bi-trash"></i> Sil
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    const total = shopManager.getCartTotal();
    cartTotalDiv.innerHTML = `<strong>Toplam: ${total.toFixed(2)} TL</strong>`;
}

// Sepet Miktarını Güncelle
function updateCartQuantity(productId, size, color, quantity) {
    shopManager.updateQuantity(productId, size, color, quantity);
    displayCart();
    shopManager.updateCartBadge();
}

// Sepetten Çıkar
function removeFromCart(productId, size, color) {
    shopManager.removeFromCart(productId, size, color);
    displayCart();
    showToast('Ürün sepetten çıkarıldı', 'success');
}

// Siparişleri Görüntüle
function displayOrders() {
    const ordersDiv = document.getElementById('orders-list');
    if (!shopManager.currentUser) {
        ordersDiv.innerHTML = '<p class="text-center">Lütfen giriş yapın.</p>';
        return;
    }

    const orders = shopManager.getUserOrders();
    if (orders.length === 0) {
        ordersDiv.innerHTML = '<p class="text-center">Henüz siparişiniz bulunmuyor.</p>';
        return;
    }

    ordersDiv.innerHTML = orders.map(order => `
        <div class="card mb-3">
            <div class="card-header">
                <strong>Sipariş No: ${order.id}</strong> - ${new Date(order.createdAt).toLocaleDateString('tr-TR')}
                <span class="badge bg-warning float-end">${order.status}</span>
            </div>
            <div class="card-body">
                <ul class="list-unstyled">
                    ${order.items.map(item => `<li>${item.name} x ${item.quantity} - ${(item.price * item.quantity).toFixed(2)} TL</li>`).join('')}
                </ul>
                <hr>
                <p class="text-end"><strong>Toplam: ${order.total.toFixed(2)} TL</strong></p>
            </div>
        </div>
    `).join('');
}

// Ödeme Detayları Validasyonu
function validatePaymentDetails(details) {
    if (!details.fullName || !details.address) {
        showToast('Tüm alanları doldurun', 'error');
        return false;
    }
    if (!/^\d{16}$/.test(details.cardNumber)) {
        showToast('Kart numarası 16 hane olmalı', 'error');
        return false;
    }
    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(details.expiryDate)) {
        showToast('Geçersiz son kullanım tarihi (MM/YY)', 'error');
        return false;
    }
    if (!/^\d{3}$/.test(details.cvv)) {
        showToast('CVV 3 hane olmalı', 'error');
        return false;
    }
    return true;
}

// Kart Numarası Formatlama
function formatCardNumber(input) {
    let value = input.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    input.value = formattedValue;
}