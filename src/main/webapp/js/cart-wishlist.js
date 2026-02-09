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