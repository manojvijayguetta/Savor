const API_URL = 'http://localhost:3000/api';

let foodData = [];
let restaurantData = [];
let cart = [];
let favorites = [];

// DOM Elements
const foodGrid = document.getElementById('foodGrid');
const restaurantGrid = document.getElementById('restaurantGrid');
const categoryBtns = document.querySelectorAll('.category-pill');
const cartToggleBtn = document.getElementById('cartToggleBtn');
const cartSidebar = document.getElementById('cartSidebar');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartBadge = document.getElementById('cartBadge');
const subtotalAmount = document.getElementById('subtotalAmount');
const deliveryAmount = document.getElementById('deliveryAmount');
const totalAmount = document.getElementById('totalAmount');
const toastContainer = document.getElementById('toastContainer');
const favoritesGrid = document.getElementById('favoritesGrid');
const favEmptyState = document.getElementById('favEmptyState');

// Initialization
async function init() {
    // Update User Profile UI
    const currentUserName = sessionStorage.getItem('currentUserName');
    const userFavorites = JSON.parse(sessionStorage.getItem('userFavorites')) || [];
    favorites = userFavorites;

    if (currentUserName) {
        const userNameEl = document.querySelector('.user-name');
        const userImgEl = document.querySelector('.user-profile img');
        if (userNameEl) userNameEl.textContent = currentUserName;
        if (userImgEl) {
            userImgEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserName)}&background=ff5e3a&color=fff&rounded=true`;
        }
    }

    // Fetch Initial Data
    try {
        const [foodRes, restRes] = await Promise.all([
            fetch(`${API_URL}/menu`),
            fetch(`${API_URL}/restaurants`)
        ]);
        
        foodData = await foodRes.json();
        restaurantData = await restRes.json();
        
        renderFoodItems('all');
        renderRestaurants();
        renderFavorites();
        setupEventListeners();
    } catch (err) {
        console.error('Failed to fetch initial data:', err);
    }

    // Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            sessionStorage.removeItem('currentUserName');
            sessionStorage.removeItem('currentEmail');
            sessionStorage.removeItem('userFavorites');
            window.location.replace('login.html');
        });
    }
}

function renderRestaurants() {
    if (!restaurantGrid) return;
    restaurantGrid.innerHTML = '';
    restaurantData.forEach(rest => {
        const restCard = document.createElement('div');
        restCard.className = 'restaurant-card';
        restCard.innerHTML = `
            <div class="restaurant-img-wrapper">
                <img src="${rest.img}" alt="${rest.name}" class="restaurant-img" loading="lazy">
                <div class="restaurant-rating"><i class="fa-solid fa-star"></i> ${rest.rating}</div>
            </div>
            <div class="restaurant-info">
                <h3>${rest.name}</h3>
                <div class="restaurant-meta">
                    <span class="location"><i class="fa-solid fa-location-dot"></i> ${rest.location}</span>
                    <span class="distance">${rest.distance}</span>
                </div>
            </div>
        `;
        restaurantGrid.appendChild(restCard);
    });
}

function setupEventListeners() {
    // Navigation
    const navLinks = document.querySelectorAll('.nav-links li');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove active classes
            navLinks.forEach(l => l.classList.remove('active'));
            viewSections.forEach(v => v.classList.remove('active'));

            // Add active to clicked target
            link.classList.add('active');
            const targetId = link.dataset.target;
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.add('active');
            }
        });
    });

    // Category Filtering
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFoodItems(btn.dataset.category);
        });
    });

    // Cart Toggle
    cartToggleBtn.addEventListener('click', toggleCart);
    closeCartBtn.addEventListener('click', toggleCart);
    cartOverlay.addEventListener('click', toggleCart);
}

function renderFoodItems(category) {
    foodGrid.innerHTML = '';

    const filteredFood = category === 'all'
        ? foodData
        : foodData.filter(item => item.category === category);

    filteredFood.forEach(item => {
        const foodCard = document.createElement('div');
        foodCard.className = 'food-card';
        const isFav = favorites.includes(item.id);
        foodCard.innerHTML = `
            <div class="food-img-wrapper">
                <img src="${item.img}" alt="${item.title}" class="food-img" loading="lazy">
                <div class="food-rating"><i class="fa-solid fa-star"></i> ${item.rating}</div>
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(${item.id})">
                    <i class="fa-${isFav ? 'solid' : 'regular'} fa-heart"></i>
                </button>
            </div>
            <div class="food-info">
                <h3>${item.title}</h3>
                <p class="food-desc">${item.desc}</p>
                <div class="food-footer">
                    <div class="food-price"><span>₹</span>${item.price.toFixed(2)}</div>
                    <button class="add-btn" onclick="addToCart(${item.id})">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </div>
            </div>
        `;
        foodGrid.appendChild(foodCard);
    });
}

// Cart Logic
function addToCart(id) {
    const item = foodData.find(f => f.id === id);
    const existingItem = cart.find(c => c.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    updateCartUI();
    showToast(`Added ${item.title} to cart`);
}

function removeFromCart(id, removeAll = false) {
    const itemIndex = cart.findIndex(c => c.id === id);
    if (itemIndex > -1) {
        if (removeAll || cart[itemIndex].quantity === 1) {
            cart.splice(itemIndex, 1);
        } else {
            cart[itemIndex].quantity -= 1;
        }
        updateCartUI();
    }
}

function updateCartUI() {
    renderCartItems();
    updateCartTotals();

    // Update badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;

    // Animate badge
    cartBadge.style.transform = 'scale(1.3)';
    setTimeout(() => {
        cartBadge.style.transform = 'scale(1)';
    }, 200);
}

function renderCartItems() {
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Your cart is empty.</p>
            </div>
        `;
        return;
    }

    cartItemsContainer.innerHTML = '';
    cart.forEach(item => {
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.innerHTML = `
            <img src="${item.img}" alt="${item.title}" class="cart-item-img">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-item" onclick="removeFromCart(${item.id}, true)">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
                <div class="qty-controls">
                    <button class="qty-btn" onclick="removeFromCart(${item.id})"><i class="fa-solid fa-minus"></i></button>
                    <span class="qty">${item.quantity}</span>
                    <button class="qty-btn" onclick="addToCart(${item.id})"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItemEl);
    });
}

function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery = subtotal > 0 ? 40.00 : 0; // Flat ₹40 delivery if cart not empty
    const total = subtotal + delivery;

    subtotalAmount.textContent = `₹${subtotal.toFixed(2)}`;
    deliveryAmount.textContent = `₹${delivery.toFixed(2)}`;
    totalAmount.textContent = `₹${total.toFixed(2)}`;
}

function toggleCart() {
    cartSidebar.classList.toggle('open');
    cartOverlay.classList.toggle('active');
}

// Toast Notifications
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Remove toast element after animation completes
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Favorites Logic
async function toggleFavorite(id) {
    const email = sessionStorage.getItem('currentEmail');
    if (!email) return;

    try {
        const res = await fetch(`${API_URL}/user/favorite`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, foodId: id })
        });
        
        const data = await res.json();
        if (data.success) {
            const wasFav = favorites.includes(id);
            favorites = data.favorites;
            sessionStorage.setItem('userFavorites', JSON.stringify(favorites));
            
            showToast(wasFav ? 'Removed from favorites' : 'Added to favorites ♥');
            
            const currentCategory = document.querySelector('.category-pill.active')?.dataset.category || 'all';
            renderFoodItems(currentCategory);
            renderFavorites();
        }
    } catch (err) {
        console.error('Failed to toggle favorite:', err);
    }
}

function renderFavorites() {
    if (!favoritesGrid || !favEmptyState) return;
    favoritesGrid.innerHTML = '';

    const favItems = foodData.filter(item => favorites.includes(item.id));

    if (favItems.length === 0) {
        favEmptyState.style.display = 'flex';
    } else {
        favEmptyState.style.display = 'none';

        favItems.forEach(item => {
            const foodCard = document.createElement('div');
            foodCard.className = 'food-card';
            foodCard.innerHTML = `
                <div class="food-img-wrapper">
                    <img src="${item.img}" alt="${item.title}" class="food-img" loading="lazy">
                    <div class="food-rating"><i class="fa-solid fa-star"></i> ${item.rating}</div>
                    <button class="fav-btn active" onclick="toggleFavorite(${item.id})">
                        <i class="fa-solid fa-heart"></i>
                    </button>
                </div>
                <div class="food-info">
                    <h3>${item.title}</h3>
                    <p class="food-desc">${item.desc}</p>
                    <div class="food-footer">
                        <div class="food-price"><span>₹</span>${item.price.toFixed(2)}</div>
                        <button class="add-btn" onclick="addToCart(${item.id})">
                            <i class="fa-solid fa-plus"></i>
                        </button>
                    </div>
                </div>
            `;
            favoritesGrid.appendChild(foodCard);
        });
    }
}

// Ensure init runs when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
