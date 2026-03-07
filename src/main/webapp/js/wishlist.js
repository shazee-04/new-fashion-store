document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    loadWishlistItems();
});

const wishlistState = {
    items: [],
    netTotal: 0
};

async function loadWishlistItems() {
    const skeletonContainer = document.getElementById('wishlistSkeletons');
    const itemsContainer = document.getElementById('wishlistItems');
    const emptyContainer = document.getElementById('wishlistEmpty');

    skeletonContainer?.classList.remove('d-none');
    itemsContainer?.classList.add('d-none');
    emptyContainer?.classList.add('d-none');

    try {
        const response = await fetch('api/wishlist/list', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        const items = Array.isArray(result?.data?.items) ? result.data.items : [];
        const netTotal = Number(result?.data?.netTotal || 0);

        if (response.ok && result.success) {
            wishlistState.items = items;
            wishlistState.netTotal = netTotal;

            renderWishlistState();
        } else {
            showToast(result.message || 'Failed fetching wishlist items!', false);
            skeletonContainer?.classList.add('d-none');
            emptyContainer?.classList.remove('d-none');
        }
    } catch (error) {
        console.error('Wishlist load error:', error);
        skeletonContainer?.classList.add('d-none');
        emptyContainer?.classList.remove('d-none');
        showToast('Server connection failed! Please try again.', false);
    }
}

function renderWishlistState() {
    const skeletonContainer = document.getElementById('wishlistSkeletons');
    const itemsContainer = document.getElementById('wishlistItems');
    const emptyContainer = document.getElementById('wishlistEmpty');

    const itemCount = wishlistState.items.length;
    const netTotal = Number(wishlistState.netTotal || 0);

    updateWishlistSummary(itemCount, netTotal);

    skeletonContainer?.classList.add('d-none');

    if (itemCount === 0) {
        itemsContainer?.classList.add('d-none');
        emptyContainer?.classList.remove('d-none');
        return;
    }

    renderWishlistItems(wishlistState.items);
    emptyContainer?.classList.add('d-none');
    itemsContainer?.classList.remove('d-none');
}

function renderWishlistItems(items) {
    const itemsContainer = document.getElementById('wishlistItems');

    if (!itemsContainer) return;

    itemsContainer.classList.remove('vstack', 'gap-3');
    itemsContainer.classList.add('list-group', 'list-group-flush');

    const fragment = document.createDocumentFragment();

    items.forEach(item => {
        const imagePath = item?.imagePath || 'assets/images/product-placeholder.jpg';
        const productId = Number(item?.productId || 0);
        const title = item?.title || 'Untitled Product';
        const description = item?.description || '';
        const unitPrice = Number(item?.unitPrice || 0);
        const productLink = productId > 0
            ? `single-product.html?pId=${encodeURIComponent(productId)}`
            : 'javascript:void(0)';
        const remainingStock = Number(item?.remainingStock || 0);
        const stockText = remainingStock > 10
            ? 'Yes'
            : (remainingStock > 0 ? 'Low' : 'No');
        const stockClass = remainingStock > 10
            ? 'text-success'
            : (remainingStock > 0 ? 'text-warning' : 'text-danger');

        const rowItem = document.createElement('div');
        rowItem.className = 'list-group-item px-0 py-3 wishlist-row-item';
        rowItem.setAttribute('data-product-id', String(productId));

        rowItem.innerHTML = `
            <div class="row g-3 g-md-4 align-items-center">
                <div class="col-4 col-md-2">
                    <a href="${productLink}" class="d-block">
                        <img src="${imagePath}" alt="${title}" class="img-fluid border wishlist-product-thumb"
                             onerror="this.onerror=null;this.src='assets/images/product-placeholder.jpg';">
                    </a>
                </div>

                <div class="col-8 col-md-4">
                    <h5 class="fs-4 text-uppercase mb-2">
                        <a href="${productLink}" class="text-dark text-decoration-none wishlist-title">${title}</a>
                    </h5>
                    <p class="mb-0 wishlist-item-description">${description}</p>
                </div>

                <div class="col-6 col-md-2 text-md-center">
                    <div class="text-muted fs-6 text-uppercase mb-1">Price</div>
                    <div class="fs-6 mb-0">${formatCurrency(unitPrice)}</div>
                </div>

                <div class="col-6 col-md-2 text-md-center">
                    <div class="text-muted fs-6 text-uppercase mb-1">In Stock</div>
                    <span class="fs-6 mb-0 ${stockClass}">${stockText}</span>
                </div>

                <div class="col-12 col-md-2">
                    <div class="d-flex flex-column justify-content-end gap-2">
                        <a href="${productLink}" class="btn btn-dark text-uppercase">View</a>
                        <button type="button" class="btn btn-light border-0" 
                        onclick="removeFromWishlist(${productId})" 
                        title="Remove from wishlist">
                            <i class="bi bi-x-lg text-danger"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        fragment.appendChild(rowItem);
    });

    itemsContainer.innerHTML = '';
    itemsContainer.appendChild(fragment);
}

async function removeFromWishlist(productId) {
    if (!productId) return;

    try {
        const response = await fetch(`api/wishlist/remove?pId=${encodeURIComponent(productId)}`,
            {
                method: 'DELETE'
            });
        const result = await response.json();

        if (response.ok && result.success) {
            const removedItem = wishlistState.items.find(item => Number(item?.productId) === Number(productId));
            wishlistState.items = wishlistState.items.filter(item => Number(item?.productId) !== Number(productId));
            if (removedItem) {
                wishlistState.netTotal = Math.max(0, Number(wishlistState.netTotal || 0) - Number(removedItem?.unitPrice || 0));
            } else {
                wishlistState.netTotal = wishlistState.items.reduce((total, item) => total + Number(item?.unitPrice || 0), 0);
            }
            renderWishlistState();
            showToast(result.message || 'Item removed from wishlist.', true);
            document.querySelector('header-component')?.refreshWishlistCount();
        } else {
            showToast(result.message || 'Failed removing item from wishlist!', false);
        }
    } catch (error) {
        console.error('Wishlist remove error:', error);
        showToast('Server connection failed! Please try again.', false);
    }
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

function formatCurrency(value) {
    return `LKR ${Number(value || 0).toFixed(2)}`;
}
