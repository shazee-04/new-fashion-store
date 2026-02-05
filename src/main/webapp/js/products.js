let currentPage = 0;
const pageSize = 8;

document.addEventListener('DOMContentLoaded', () => {
    loadProducts(0);

    // document.querySelectorAll('.filter-check').forEach(el => {
    //     el.addEventListener('change', () => loadProducts(0));
    // });
});

async function loadProducts(page = 0) {
    currentPage = page;

    // Get Filters
    const searchText = document.getElementById('shopSearchInput')?.value || "";
    const categories = Array.from(document.querySelectorAll('.filter-check[data-type="category"]:checked'))
        .map(c => c.value).join(',');
    const brands = Array.from(document.querySelectorAll('.filter-check[data-type="brand"]:checked'))
        .map(b => b.value).join(',');

    const minPrice = document.getElementById('minPrice')?.value || "";
    const maxPrice = document.getElementById('maxPrice')?.value || "";

    // Build URL
    const url = `api/products/search?page=${page}&size=${pageSize}` +
        `&query=${encodeURIComponent(searchText)}` +
        `&category=${categories}` +
        `&brand=${brands}` +
        `&minPrice=${minPrice}` +
        `&maxPrice=${maxPrice}`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            renderProducts(data.products);
            renderPagination(data.totalCount);
        } else {
            showToast("Failed to load products!", false);
        }
    } catch (e) {
        showToast("Connection error: " + e.message, false);
    }
}

function renderProducts(products) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '';

    if (products.length === 0) {
        productGrid.innerHTML = '<div class="col-12 text-center py-5"><h3>No products found matching your criteria.</h3></div>';
        return;
    }

    products.forEach(p => {
        const thumbUrl = p.images && p.images.length > 0 ? p.images[0] : 'assets/images/products/placeholder.jpg';
        productGrid.innerHTML += `
        <div class="col-md-3 mb-3 product-item link-effect">
          <div class="image-holder position-relative">
            <a href="single-product.html?id=${p.id}">
              <img src="${thumbUrl}" alt="${p.title}" class="product-image img-fluid">
            </a>
            <a href="#" onclick="addToWishlist(${p.id}); return false;" class="btn-icon btn-wishlist">
              <svg width="24" height="24" viewBox="0 0 24 24"><use xlink:href="#heart"></use></svg>
            </a>
            <div class="product-content">
              <h5 class="element-title text-uppercase fs-5 mt-3">
                <a href="single-product.html?id=${p.id}">${p.title}</a>
              </h5>
              <a href="#" class="text-decoration-none add-to-cart-btn"
                onclick="quickAddToCart(${p.id}); return false;"
                data-after="Add to cart"><span>$${p.minPrice.toFixed(2)}</span></a>
            </div>
          </div>
        </div>`;
    });
}

function renderPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / pageSize);
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return; // Don't show if only one page

    for (let i = 0; i < totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i + 1;
        // Highlight active page
        btn.className = `btn ${i === currentPage ? 'btn-dark' : 'btn-outline-dark'} me-2`;
        btn.onclick = () => {
            window.scrollTo(0, 0); // Scroll to top on page change
            loadProducts(i);
        };
        paginationContainer.appendChild(btn);
    }
}