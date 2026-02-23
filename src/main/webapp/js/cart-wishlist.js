async function addToWishlist(productId) {
    if (!productId) return;

    if (!Auth.isLoggedIn()) {
        showToast("Please login to add items to wishlist!", false);
        return;
    }

    try {
        const response = await fetch(`api/wishlist/add?pId=${productId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )
        const result = await response.json();

        if (response.ok && result.success) {
            showToast(result.message, true);
            document.querySelector(`[data-product-id="${productId}"]`).classList.add('text-danger');
            document.querySelector('header-component')?.refreshWishlistCount();
        } else {
            showToast(result.message || "Failed adding item to wishlist!", false);
        }
    } catch (error) {
        console.error('Wishlist error:', error);
        showToast("Server connection failed! Please try again.", false);
    }
}

async function quickAddToCart(stockId) {
    if (!stockId || stockId === 0) return;

    try {
        const response = await fetch(`api/cart/add?stockId=${stockId}&qty=1`, {
            method: 'POST'
        });
        const result = await response.json();
        if (response.ok && result.success) {
            showToast(result.message, true);
            document.querySelector('header-component')?.refreshCartCount();
        } else {
            showToast(result.message || "Failed adding item to cart!", false);
        }
    } catch (error) {
        console.error('Cart error:', error);
        showToast("Server connection failed! Please try again.", false);
    }
}

async function getCartList() {
    try {
        const response = await fetch('api/cart/list');
        const result = await response.json();

        if (response.ok && result.success) {
            return result.data;
        } else {
            showToast(result.message || "Failed fetching cart items!", false);
        }
    } catch (error) {
        console.error('Cart list error:', error);
        showToast("Server connection failed! Please try again.", false);
    }
    return null;
}