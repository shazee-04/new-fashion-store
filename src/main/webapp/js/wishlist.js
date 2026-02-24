document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    loadWishlistItems();
});

async function loadWishlistItems() {
    const skeletonContainer = document.getElementById('wishlistSkeletons');
    const itemsContainer = document.getElementById('wishlistItems');
    const emptyContainer = document.getElementById('wishlistEmpty');

    try {
        const response = await fetch('api/wishlist/list', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        const data = result.data;

        if (response.ok && result.success) {

            if (!data || data.items.length === 0) {
                skeletonContainer?.classList.add('d-none');
                emptyContainer?.classList.remove('d-none');
                return;
            }

            renderWishlistItems(data.items);
            updateWishlistSummary(data.items.length, data.netTotal);

            skeletonContainer?.classList.add('d-none');
            itemsContainer.classList.remove('d-none');
        } else {
            showToast(result.message || 'Failed fetching wishlist items!', false);
            skeletonContainer?.classList.add('d-none');
            emptyContainer?.classList.remove('d-none');
            return;
        }
    } catch (error) {
        console.error('Wishlist load error:', error);
        skeletonContainer?.classList.add('d-none');
        emptyContainer?.classList.remove('d-none');
        showToast('Server connection failed! Please try again.', false);
    }
}

function renderWishlistItems(items) {

    const itemsContainer = document.getElementById('wishlistItems');
    itemsContainer.innerHTML = '';

    items.forEach(item => {
        const imagePath = item.imagePath || 'assets/images/product-placeholder.jpg';
        const stockClass = item.remainingStock > 0 ? 'in-stock' : 'out-stock';
        const stockText = item.remainingStock > 0 ? `In Stock (${item.remainingStock} left)` : 'Out of Stock';

        itemsContainer.innerHTML += `
            <div class="border-0 p-0 mb-5" data-stock-id="${item.stockId}">
			<div class="row g-3 align-items-center">
				<div class="col-4 col-md-2">
					<a href="single-product.html?stockId=${item.stockId}" class="wishlist-image-link d-block">
						<img src="${imagePath}" alt="${item.title}" class="wishlist-thumb img-fluid"
							 onerror="this.onerror=null;this.src='assets/images/product-placeholder.jpg';">
					</a>
				</div>

				<div class="col-8 col-md-4">
					<h5 class="text-uppercase mb-2">
						<a href="single-product.html?stockId=${item.stockId}" class="text-dark text-decoration-none">${item.title}</a>
					</h5>
					<p class="wishlist-description mb-2 d-none d-md-block">${item.description}</p>
					<div class="wishlist-meta small">
						<span><strong>Color:</strong> ${item.color}</span>
						<span class="ms-2"><strong>Size:</strong> ${item.size}</span>
						<span class="ms-2"><strong>Qty:</strong> ${item.quantity}</span>
					</div>
				</div>

				<div class="col-6 col-md-2">
					<div class="wishlist-label text-uppercase">Price</div>
					<div class="wishlist-price">LKR ${item.unitPrice.toFixed(2)}</div>
					<div class="wishlist-sub-price">Total: LKR ${item.totalPrice.toFixed(2)}</div>
				</div>

				<div class="col-6 col-md-2">
					<div class="wishlist-label text-uppercase">Stock</div>
					<div class="wishlist-stock-pill ${stockClass}">${stockText}</div>
				</div>

				<div class="col-12 col-md-2 d-flex flex-column align-items-md-end gap-2">
					<button class="btn btn-dark text-uppercase w-100" ${item.remainingStock <= 0 ? 'disabled' : ''}
							onclick="quickAddToCart(${item.stockId})">
						Add To Cart
					</button>
				</div>
			</div>
		</div>
            `;
    });
}

function updateWishlistSummary(itemCount, netTotal) {
    const totalElement = document.getElementById('wishlistNetTotal');
    const countElement = document.getElementById('wishlistItemCount');

    if (totalElement) {
        totalElement.textContent = `LKR ${Number(netTotal).toFixed(2)}`;
    }
    if (countElement) {
        countElement.textContent = `${itemCount} ${itemCount === 1 ? 'Item' : 'Items'}`;
    }
}
