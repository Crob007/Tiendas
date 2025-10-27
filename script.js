// =======================================
// 🍔 Lógica del Menú de Hamburguesa (Sin cambios)
// =======================================

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('main-nav');
const navLinks = nav.querySelectorAll('a');

function toggleMenu() {
    nav.classList.toggle('active');
    const isExpanded = nav.classList.contains('active');
    menuToggle.setAttribute('aria-expanded', isExpanded);
    menuToggle.textContent = isExpanded ? '✕' : '☰'; 
}

menuToggle.addEventListener('click', toggleMenu);

navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (nav.classList.contains('active')) {
            toggleMenu(); 
        }
    });
});

// =======================================
// 🛍️ Lógica del Carrito y LocalStorage
// =======================================

// 🔑 Variables Clave del Carrito
let cart = []; 
const cartCountSpan = document.getElementById('cart-count');
const cartIcon = document.getElementById('cart-icon');
const cartModal = document.getElementById('cart-modal');
const closeCartBtn = document.getElementById('close-cart-btn');
const checkoutBtn = document.getElementById('checkout-whatsapp-btn');
const productListContainer = document.getElementById('product-list'); // Contenedor de las tarjetas
const cartItemsUl = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const clientNameInput = document.getElementById('client-name'); // Nuevo campo de nombre
const checkoutMessage = document.getElementById('checkout-message');

// gestión de foco
let lastFocusedElement = null;

// 📞 TU NÚMERO DE TELÉFONO para WhatsApp
const WHATSAPP_PHONE = "584122021747"; // ¡Asegúrate de cambiar este número!

// --- LOCALSTORAGE ---

/**
 * Carga el carrito desde el almacenamiento local al inicio.
 */
function loadCartFromLocalStorage() {
    const storedCart = localStorage.getItem('santuarioSecretCart');
    if (storedCart) {
        // Usa JSON.parse para convertir el texto almacenado de vuelta a un array de JS
        cart = JSON.parse(storedCart);
        updateCartDisplay();
    }
}

/**
 * Guarda el carrito actual en el almacenamiento local.
 */
function saveCartToLocalStorage() {
    // Usa JSON.stringify para convertir el array de JS a texto para almacenarlo
    localStorage.setItem('santuarioSecretCart', JSON.stringify(cart));
}


// --- FUNCIONES DEL CARRITO ---

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price: parseFloat(price), quantity: 1 });
    }

    updateCartDisplay();
    saveCartToLocalStorage(); // 💾 Guardar al añadir
    alert(`"${name}" ha sido añadido a tu Santuario.`);
}

function updateCartDisplay() {
    let totalItems = 0;
    let totalPrice = 0;
    cartItemsUl.innerHTML = ''; 

    if (cart.length === 0) {
        cartItemsUl.innerHTML = '<li>El Santuario está esperando... (Carrito Vacío)</li>';
        cartTotalSpan.textContent = '$0.00';
        cartCountSpan.textContent = 0;
        updateCheckoutButtonState();
        return;
    }
    
    // Generar la lista de ítems
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        totalItems += item.quantity;
        
        const li = document.createElement('li');
        li.innerHTML = `
            ${item.name} (x${item.quantity}) 
            <span style="float:right;">$${itemTotal.toFixed(2)}</span>
            <button class="remove-item" data-id="${item.id}" aria-label="Eliminar un artículo de ${item.name}">-</button>
        `;
        cartItemsUl.appendChild(li);
    });

    cartCountSpan.textContent = totalItems;
    cartTotalSpan.textContent = `$${totalPrice.toFixed(2)}`;
    
    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', removeItemFromCart);
    });
    updateCheckoutButtonState();
}

function removeItemFromCart(event) {
    const idToRemove = event.currentTarget.dataset.id;
    const itemIndex = cart.findIndex(item => item.id === idToRemove);

    if (itemIndex > -1) {
        cart[itemIndex].quantity -= 1;

        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    updateCartDisplay();
    saveCartToLocalStorage(); // 💾 Guardar al remover
}


// --- FUNCIÓN WHATSAPP ACTUALIZADA ---

function generateWhatsAppLink() {
    // Validaciones: carrito y nombre/clavE obligatoria
    clearCheckoutMessage();
    if (cart.length === 0) {
        showCheckoutMessage('Tu carrito está vacío. Añade artículos antes de confirmar.', 'error');
        return;
    }

    const clientName = clientNameInput.value.trim();
    if (!clientName) {
        showCheckoutMessage('Por favor ingresa tu Nombre Discreto o Clave antes de confirmar el pedido.', 'error');
        clientNameInput.focus();
        return;
    }

    let message = `*PEDIDO SECRETO*\n\n*Nombre/Clave:* ${clientName}\n\n`;
    message += "He realizado un pedido en tu Santuario. Por favor, confírmalo:\n\n";
    let totalPrice = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        message += `${index + 1}. ${item.name} (Cant: ${item.quantity}) - $${itemTotal.toFixed(2)}\n`;
    });

    message += `\n*TOTAL ESTIMADO: $${totalPrice.toFixed(2)}*\n\n`;
    message += "Espero tu confirmación para proceder con el pago y envío.";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;
    
    // Indicar que se está abriendo WhatsApp y deshabilitar el botón para prevenir múltiples clicks
    showCheckoutMessage('Abriendo WhatsApp…', 'success');
    checkoutBtn.disabled = true;
    window.open(whatsappUrl, '_blank');

    // Limpiar el carrito y almacenamiento después del pedido
    cart = [];
    saveCartToLocalStorage();
    updateCartDisplay();
    closeCartModal();
    clientNameInput.value = ''; // Limpiar el campo de nombre
    // Mostrar confirmación breve
    setTimeout(() => clearCheckoutMessage(), 2500);
}

/* ======== Estado del botón de checkout ======== */
function updateCheckoutButtonState() {
    // Deshabilita el botón si no hay items o si la clave está vacía
    const hasItems = cart.length > 0;
    const hasName = clientNameInput && clientNameInput.value.trim().length > 0;
    if (checkoutBtn) checkoutBtn.disabled = !(hasItems && hasName);
}

// Escuchar cambios en el campo del nombre para habilitar/deshabilitar el checkout
if (clientNameInput) {
    clientNameInput.addEventListener('input', updateCheckoutButtonState);
}

// Helpers para mensajes inline
function showCheckoutMessage(text, type) {
    if (!checkoutMessage) return;
    checkoutMessage.textContent = text;
    checkoutMessage.classList.remove('error', 'success');
    checkoutMessage.classList.add(type === 'success' ? 'success' : 'error');
    checkoutMessage.hidden = false;
}

function clearCheckoutMessage() {
    if (!checkoutMessage) return;
    checkoutMessage.textContent = '';
    checkoutMessage.classList.remove('error', 'success');
    checkoutMessage.hidden = true;
}

// Funciones de apertura/cierre del modal con manejo de foco
function openCartModal() {
    lastFocusedElement = document.activeElement;
    cartModal.classList.add('active');
    cartModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // poner el foco en el primer control del modal
    const focusTarget = cartModal.querySelector('#client-name') || cartModal.querySelector('#close-cart-btn');
    if (focusTarget) focusTarget.focus();
}

function closeCartModal() {
    cartModal.classList.remove('active');
    cartModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearCheckoutMessage();
    if (lastFocusedElement) lastFocusedElement.focus();
}

// Cerrar modal con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartModal.classList.contains('active')) {
        closeCartModal();
    }
});


// =======================================
// 🔎 Lógica de Filtrado de Productos
// =======================================

const maxPriceRange = document.getElementById('filter-price');
const maxPriceDisplay = document.getElementById('max-price-display');
const searchTermInput = document.getElementById('search-term');

/**
 * Filtra los productos visibles basándose en el precio máximo y el término de búsqueda.
 */
function filterProducts() {
    const maxPrice = parseFloat(maxPriceRange.value);
    const searchTerm = searchTermInput.value.toLowerCase().trim();
    
    // Obtener todas las tarjetas de producto
    const productCards = productListContainer.querySelectorAll('.product-card');

    productCards.forEach(card => {
        const price = parseFloat(card.dataset.price);
        const name = card.dataset.name.toLowerCase();
        
        // Criterios de filtrado
        const matchesPrice = price <= maxPrice;
        const matchesSearch = name.includes(searchTerm);
        
        // Mostrar u ocultar la tarjeta
        if (matchesPrice && matchesSearch) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Actualizar la visualización del precio máximo
    maxPriceDisplay.textContent = `$${maxPrice.toFixed(0)}`;
}

// --- Event Listeners de Filtro ---
maxPriceRange.addEventListener('input', filterProducts);
searchTermInput.addEventListener('input', filterProducts);


// =======================================
// 🚀 Inicialización
// =======================================

// 1. Cargar el carrito al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    loadCartFromLocalStorage();
    filterProducts(); // Aplicar filtros iniciales
});

// 2. Evento: Botones "Añadir al Santuario"
productListContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('add-to-cart')) {
        const card = event.target.closest('.product-card');
        const id = card.dataset.id;
        const name = card.dataset.name;
        const price = card.dataset.price;
        addToCart(id, name, price);
    }
});

// 3. Evento: Ícono del Carrito (Mostrar Modal)
cartIcon.addEventListener('click', (e) => {
    e.preventDefault(); 
    updateCartDisplay();
    openCartModal();
});

// 4. Evento: Botón "Cerrar" Modal
closeCartBtn.addEventListener('click', () => {
    closeCartModal();
});

// 5. Evento: Botón "Confirmar Pedido (WhatsApp)"
checkoutBtn.addEventListener('click', generateWhatsAppLink);

// =======================================
// 🖼️ Lógica del Carrusel (Slider)
// =======================================

const slides = document.querySelectorAll('.carousel-slide');
const dotsContainer = document.querySelector('.carousel-dots-container');
let currentSlide = 0;
const slideInterval = 5000; // 5 segundos entre cada slide (elegante y lento)

/**
 * Muestra el slide y punto de navegación activos.
 * @param {number} n - El índice del slide a mostrar.
 */
function showSlide(n) {
    // 1. Ocultar todos los slides y quitar el estado activo de los puntos
    slides.forEach(slide => slide.classList.remove('active'));
    document.querySelectorAll('.dot').forEach(dot => dot.classList.remove('active'));
    
    // 2. Calcular el nuevo índice (maneja los límites del array)
    if (n >= slides.length) {
        currentSlide = 0;
    } else if (n < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = n;
    }
    
    // 3. Mostrar el slide activo y el punto activo
    slides[currentSlide].classList.add('active');
    document.querySelectorAll('.dot')[currentSlide].classList.add('active');
}

/**
 * Función que pasa al siguiente slide.
 */
function nextSlide() {
    showSlide(currentSlide + 1);
}

/**
 * Inicializa el carrusel: crea los puntos de navegación y activa el auto-play.
 */
function initializeCarousel() {
    // 1. Crear los puntos de navegación (dots)
    slides.forEach((slide, index) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        dot.addEventListener('click', () => showSlide(index)); // Navegación manual
        dotsContainer.appendChild(dot);
    });
    
    // 2. Mostrar el primer slide (índice 0)
    showSlide(currentSlide);
    
    // 3. Iniciar la transición automática
    setInterval(nextSlide, slideInterval);
}

// 🚀 Llamar a la inicialización del carrusel cuando la página esté lista
document.addEventListener('DOMContentLoaded', initializeCarousel);
