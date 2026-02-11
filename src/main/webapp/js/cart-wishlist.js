async function addToWishlist(productId) {
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
        } else {
            showToast(result.message || "Failed adding item to wishlist!", false);
        }
    } catch (error) {
        console.error('Wishlist error:', error);
        showToast("Server connection failed! Please try again.", false);
    }
}

async function quickAddToCart(stockId) {
    if(!stockId || stockId === 0) return;

    try {
        const response = await fetch(`api/cart/add?stockId=${stockId}&qty=1`, { 
            method: 'POST' 
        });
        const result = await response.json();
        if (response.ok && result.success) {
            showToast(result.message, true);
        } else {
            showToast(result.message || "Failed adding item to cart!", false);
        }
    } catch (e) {
        console.error('Cart error:', error);
        showToast("Error connecting to server", false);
    }
}