document.addEventListener('DOMContentLoaded', () => {
    initCartEventDelegation();
    loadCartItems();
});

document.getElementById('cartCheckoutBtn').addEventListener('click', (e) => {
    if (cartState.items.length === 0) {
        e.preventDefault();
        showToast('Your cart is empty! Please add items before checkout.', false);
    }
})

const cartState = {
    items: [],
    netTotal: 0,
    isUpdating: false
};

async function loadCartItems() {
    const loadingContainer = document.getElementById('cartLoading');
    const contentContainer = document.getElementById('cartContent');
    const itemsContainer = document.getElementById('cartItems');
    const emptyContainer = document.getElementById('cartEmpty');

    loadingContainer?.classList.remove('d-none');
    contentContainer?.classList.add('d-none');
    itemsContainer?.classList.add('d-none');
    emptyContainer?.classList.add('d-none');

    try {
        const response = await fetch('api/cart/list', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok && result.success) {
            const items = Array.isArray(result?.data?.items) ? result.data.items : [];
            cartState.items = items.map(normalizeCartItem);
            cartState.netTotal = Number(result?.data?.netTotal || 0);
            renderCartState();
            return;
        }

        showToast(result.message || 'Failed fetching cart items!', false);
        cartState.items = [];
        cartState.netTotal = 0;
        renderCartState();
    } catch (error) {
        console.error('Cart load error:', error);
        showToast('Server connection failed! Please try again.', false);
        cartState.items = [];
        cartState.netTotal = 0;
        renderCartState();
    }
}

function normalizeCartItem(item) {
    const qty = Math.max(1, Number(item?.qty || 1));
    const unitPrice = Number(item?.unitPrice || 0);

    return {
        productId: Number(item?.productId || 0),
        stockId: Number(item?.stockId || 0),
        title: item?.title || 'Untitled Product',
        description: item?.description || '',
        imagePath: item?.imagePath || 'assets/images/product-placeholder.jpg',
        qty,
        size: item?.size || '-',
        color: item?.color || '-',
        remainingStock: Number(item?.remainingStock || 0),
        unitPrice,
        totalPrice: Number(item?.totalPrice || unitPrice * qty),
        available: item?.available || false
    };
}

function renderCartState() {
    const loadingContainer = document.getElementById('cartLoading');
    const contentContainer = document.getElementById('cartContent');
    const itemsContainer = document.getElementById('cartItems');
    const emptyContainer = document.getElementById('cartEmpty');

    updateCartSummary(cartState.items.length, cartState.netTotal);
    loadingContainer?.classList.add('d-none');

    if (cartState.items.length === 0) {
        contentContainer?.classList.add('d-none');
        itemsContainer?.classList.add('d-none');
        emptyContainer?.classList.remove('d-none');
        return;
    }

    contentContainer?.classList.remove('d-none');
    renderCartItems(cartState.items);
    itemsContainer?.classList.remove('d-none');
    emptyContainer?.classList.add('d-none');
}

function renderCartItems(items) {
    const itemsContainer = document.getElementById('cartItems');
    if (!itemsContainer) return;

    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const row = document.createElement('div');
        row.className = 'list-group-item px-0 py-3 cart-row-item';
        row.setAttribute('data-stock-id', String(item.stockId));

        const stockWarning = item.remainingStock > 5
            ? 'in stock'
            : (item.remainingStock > 0 ? `only ${item.remainingStock} left` : 'out of stock');
        const stockClass = item.remainingStock > 5
            ? 'text-success'
            : (item.remainingStock > 0 ? 'text-warning' : 'text-danger');
        const availabilityText = item.available
            ? `<span class="py-1 fs-9 ${stockClass}">${stockWarning}</span>`
            : '<span class="bi bi-exclamation-circle fs-9 py-1 text-danger"> Unavailable</span>';
        row.innerHTML = `
			<div class="row g-3 g-md-4 align-items-center">
				<div class="col-4 col-md-2">
					<a href="single-product.html?pId=${encodeURIComponent(item.productId)}" 
					    class="d-block ${item.available ? '' : 'opacity-25'}">
						<img src="${item.imagePath}" alt="${item.title}"
							 class="img-fluid border cart-product-thumb"
							 onerror="this.onerror=null;this.src='assets/images/product-placeholder.jpg';">
					</a>
				</div>

				<div class="col-8 col-md-4">
					<p class="fs-8 mb-0 text-uppercase">
					    ${availabilityText}
					</p>
					<h5 class="h6 text-uppercase mb-1">
						<a href="single-product.html?pId=${encodeURIComponent(item.productId)}" 
							class="fs-5 text-dark text-decoration-none cart-title">
							${item.title}
						</a>
					</h5>
					<p class="fs-8 mb-0 text-uppercase">
						<span class="p-1 px-2 btn fs-9 btn-primary">Size: ${item.size}</span>
						<span class="p-1 px-2 btn fs-9 btn-primary">Color: ${item.color}</span>
					</p>
					<p class="small mb-0">${formatCurrency(item.unitPrice)}</p>
				</div>

				<div class="col-6 col-md-3">
					<div class="input-group product-qty mx-md-auto">
						<button type="button" class="quantity-left-minus btn btn-sm btn-light btn-number"
								data-action="qty-minus" data-stock-id="${item.stockId}">
							<i class="bi bi-dash-lg"></i>
						</button>
						<input type="text" class="form-control input-number text-center text-dark shadow-none border-light"
							   data-action="qty-input" data-stock-id="${item.stockId}" value="${item.qty}" min="1" max="${Math.max(1, item.remainingStock)}">
						<button type="button" class="quantity-right-plus btn btn-sm btn-light btn-number"
								data-action="qty-plus" data-stock-id="${item.stockId}">
							<i class="bi bi-plus-lg"></i>
						</button>
					</div>
				</div>

				<div class="col-4 col-md-2 text-md-center">
					<span class="text-dark">${formatCurrency(item.totalPrice)}</span>
				</div>

				<div class="col-2 col-md-1 text-end">
					<button type="button" class="btn btn-light border-0 p-1 px-2"
							data-action="remove-item" data-stock-id="${item.stockId}" aria-label="Remove item">
						<i class="bi bi-x-lg text-danger"></i>
					</button>
				</div>
			</div>
		`;

        fragment.appendChild(row);
    });

    itemsContainer.innerHTML = '';
    itemsContainer.appendChild(fragment);
}

function initCartEventDelegation() {
    const itemsContainer = document.getElementById('cartItems');
    if (!itemsContainer) return;

    itemsContainer.addEventListener('click', async event => {
        const actionElement = event.target.closest('[data-action]');
        if (!actionElement || cartState.isUpdating) return;

        const stockId = Number(actionElement.getAttribute('data-stock-id') || 0);
        const action = actionElement.getAttribute('data-action');
        const item = getCartItem(stockId);
        if (!item) return;

        if (action === 'qty-plus') {
            if (item.qty >= item.remainingStock) {
                showToast('Reached available stock limit.', false);
                return;
            }
            await updateCartQty(stockId, item.qty + 1);
            return;
        }

        if (action === 'qty-minus') {
            if (item.qty <= 1) {
                await removeCartItem(stockId);
                return;
            }
            await updateCartQty(stockId, item.qty - 1);
            return;
        }

        if (action === 'remove-item') {
            await removeCartItem(stockId);
        }
    });

    itemsContainer.addEventListener('change', async event => {
        const input = event.target.closest('[data-action="qty-input"]');
        if (!input || cartState.isUpdating) return;

        const stockId = Number(input.getAttribute('data-stock-id') || 0);
        const item = getCartItem(stockId);
        if (!item) return;

        const requested = Number(input.value || 0);
        const nextQty = Math.min(Math.max(1, requested), Math.max(1, item.remainingStock));

        input.value = String(nextQty);

        if (nextQty === item.qty) return;
        await updateCartQty(stockId, nextQty);
    });
}

async function updateCartQty(stockId, nextQty) {
    const item = getCartItem(stockId);
    if (!item) return;
    const currentQty = Number(item.qty || 0);

    const previousItems = cartState.items.map(current => ({...current}));
    const target = cartState.items.find(current => current.stockId === stockId);
    if (!target) return;

    cartState.isUpdating = true;

    target.qty = nextQty;
    target.totalPrice = Number(target.unitPrice || 0) * Number(nextQty || 0);
    cartState.netTotal = calculateNetTotal(cartState.items);
    renderCartState();

    try {
        const result = await requestCartQtyTransition(stockId, currentQty, nextQty);
        if (!result.success) {
            cartState.items = previousItems;
            cartState.netTotal = calculateNetTotal(previousItems);
            renderCartState();
            showToast(result.message || 'Failed updating cart quantity.', false);
            return;
        }

        if (Array.isArray(result?.data?.items)) {
            cartState.items = result.data.items.map(normalizeCartItem);
            cartState.netTotal = Number(result?.data?.netTotal || calculateNetTotal(cartState.items));
            renderCartState();
        }

        document.querySelector('header-component')?.refreshCartCount();
    } catch (error) {
        console.error('Update qty error:', error);
        cartState.items = previousItems;
        cartState.netTotal = calculateNetTotal(previousItems);
        renderCartState();
        showToast('Server connection failed! Please try again.', false);
    } finally {
        cartState.isUpdating = false;
    }
}

async function requestCartQtyTransition(stockId, currentQty, nextQty) {
    if (nextQty === currentQty) {
        return {success: true};
    }

    if (nextQty > currentQty) {
        const incrementBy = nextQty - currentQty;
        return requestCartQtyUpdate(stockId, incrementBy);
    }

    if (nextQty <= 0) {
        return requestCartItemRemove(stockId);
    }

    const decrementBy = currentQty - nextQty;
    return requestCartQtyDecrease(stockId, decrementBy);
}

async function removeCartItem(stockId) {
    const confirmed = await confirmModal('Are you sure you want to remove this item from your cart?');
    if (!confirmed) return;

    const previousItems = cartState.items.map(current => ({...current}));

    cartState.items = cartState.items.filter(item => item.stockId !== stockId);
    cartState.netTotal = calculateNetTotal(cartState.items);
    renderCartState();

    try {
        const result = await requestCartItemRemove(stockId);
        if (!result.success) {
            cartState.items = previousItems;
            cartState.netTotal = calculateNetTotal(previousItems);
            renderCartState();
            showToast(result.message || 'Failed removing cart item.', false);
            return;
        }

        if (Array.isArray(result?.data?.items)) {
            cartState.items = result.data.items.map(normalizeCartItem);
            cartState.netTotal = Number(result?.data?.netTotal || calculateNetTotal(cartState.items));
            renderCartState();
        }

        showToast(result.message || 'Item removed from cart.', true);
        document.querySelector('header-component')?.refreshCartCount();
    } catch (error) {
        console.error('Remove cart item error:', error);
        cartState.items = previousItems;
        cartState.netTotal = calculateNetTotal(previousItems);
        renderCartState();
        showToast('Server connection failed! Please try again.', false);
    }
}

async function requestCartQtyUpdate(stockId, qty) {
    try {
        const response = await fetch(
            `api/cart/add?stockId=${encodeURIComponent(stockId)}&qty=${encodeURIComponent(qty)}`,
            {method: 'POST'}
        );
        const payload = await readJsonSafely(response);

        if (response.ok && payload.success) {
            return payload;
        }

        return {
            success: false,
            message: payload.message || 'Failed updating cart quantity.'
        };
    } catch (error) {
        console.error('Cart qty update request failed:', error);
        return {
            success: false,
            message: 'Server connection failed! Please try again.'
        };
    }
}

async function requestCartQtyDecrease(stockId, qty) {
    try {
        const response = await fetch(
            `api/cart/remove?stockId=${encodeURIComponent(stockId)}&qty=${encodeURIComponent(qty)}`,
            {method: 'DELETE'}
        );
        const payload = await readJsonSafely(response);

        if (response.ok && payload.success) {
            return payload;
        }

        return {
            success: false,
            message: payload.message || 'Failed decreasing cart quantity.'
        };
    } catch (error) {
        console.error('Cart qty decrease request failed:', error);
        return {
            success: false,
            message: 'Server connection failed! Please try again.'
        };
    }
}

async function requestCartItemRemove(stockId) {
    try {
        const response = await fetch(`api/cart/remove?stockId=${encodeURIComponent(stockId)}`, {
            method: 'DELETE'
        });
        const payload = await readJsonSafely(response);

        if (response.ok && payload.success) {
            return payload;
        }

        return {
            success: false,
            message: payload.message || 'Failed removing cart item.'
        };
    } catch (error) {
        console.error('Cart remove request failed:', error);
        return {
            success: false,
            message: 'Server connection failed! Please try again.'
        };
    }
}

function updateCartSummary(itemCount, netTotal) {
    const totalElement = document.getElementById('cartNetTotal');
    const checkoutButton = document.getElementById('cartCheckoutBtn');

    if (totalElement) {
        totalElement.textContent = formatCurrency(netTotal);
    }

    if (checkoutButton) {
        checkoutButton.disabled = itemCount === 0;
    }
}

function getCartItem(stockId) {
    return cartState.items.find(item => item.stockId === Number(stockId));
}

function calculateNetTotal(items) {
    return Number((items || []).reduce((sum, item) => sum + Number(item?.totalPrice || 0), 0));
}

function formatCurrency(value) {
    return `LKR ${Number(value || 0).toFixed(2)}`;
}

async function readJsonSafely(response) {
    const raw = await response.text();
    if (!raw) return {};

    try {
        return JSON.parse(raw);
    } catch {
        return {};
    }
}
