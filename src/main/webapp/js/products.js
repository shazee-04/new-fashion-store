document.addEventListener('DOMContentLoaded', loadProducts);

function renderProducts(products) {
    const productGrid = document.getElementById('product-grid');

    productGrid.innerHTML = '';

    products.forEach(p => {
        const thumbUrl = p.images && p.images.length > 0 ? p.images[0] : 'assets/images/products/placeholder.jpg';

        const productHTML = `
        <div class="col-md-3 mb-3 product-item link-effect">
          <div class="image-holder position-relative">
            <a href="single-product.html" id="${p.id}">
              <img src="${thumbUrl}" alt="${p.title}" class="product-image img-fluid">
            </a>
            <a href="#" onclick="addToWishlist(${p.id}); return false;" class="btn-icon btn-wishlist">
              <svg width="24" height="24" viewBox="0 0 24 24">
                <use xlink:href="#heart"></use>
              </svg>
            </a>
            <div class="product-content">
              <h5 class="element-title text-uppercase fs-5 mt-3">
                <a href="single-product.html?id=${p.id}">${p.title}</a>
              </h5>
              <a href="#" class="text-decoration-none add-to-cart-btn"
                onclick="quickAddToCart(${p.id}); return false;"
                data-after="Add to cart"><span>${p.minPrice.toFixed(2)}</span></a>
            </div>
          </div>
        </div>
        `;
        productGrid.innerHTML += productHTML;
    });
}

async function loadProducts() {
    try {
        const response = await fetch("api/products");
        if (response.ok) {
            const products = await response.json();
            renderProducts(products);
        } else {
            showToast("Failed to load products!", false);
        }
    } catch (e) {
        showToast(e.message, false);
    }
}