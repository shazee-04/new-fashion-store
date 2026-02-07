let currentPage = 0;
const pageSize = 12;

document.addEventListener('DOMContentLoaded', () => {
    applyFilters(0);

    document.querySelectorAll('.filter-check').forEach(el => {
        el.addEventListener('change', () => applyFilters(0));
    });
});

async function applyFilters(page = 0) {
    currentPage = page;

    // Get Filters
    const searchText = document.getElementById('shopSearchInput')?.value || "";
    const categories = Array.from(document.querySelectorAll('.filter-check[data-type="category"]:checked'))
        .map(c => c.value).join(';');
    const brands = Array.from(document.querySelectorAll('.filter-check[data-type="brand"]:checked'))
        .map(b => b.value).join(';');

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
        const result = await response.json();

        if (response.ok && result.success) {
            renderProducts(result.data.products);
            renderPagination(result.data.totalCount);
        } else {
            showToast("Failed to load products!", false);
        }
    } catch (error) {
        console.error('Shop error:', error);
        showToast("Server connection failed! Please try again.", false);
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
    const resultCount = document.getElementById('result-count');
    if (resultCount) {
        resultCount.innerHTML = `Showing ${pageSize * currentPage + 1}–
        ${Math.min(pageSize * (currentPage + 1), totalCount)} of ${totalCount} results`;
    }

    const totalPages = Math.ceil(totalCount / pageSize);
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 0 ? 'disabled' : ''}`;
    const prevA = document.createElement('a');
    prevA.className = 'page-link shadow-none';
    prevA.setAttribute('aria-label', 'Previous');
    prevA.innerHTML = '<i class="bi bi-arrow-left"></i>';
    prevA.href = '#';
    prevA.onclick = (e) => {
        e.preventDefault();
        if (currentPage > 0) {
            window.scrollTo(0, 0);
            applyFilters(currentPage - 1);
        }
    };
    prevLi.appendChild(prevA);
    paginationContainer.appendChild(prevLi);

    for (let i = 0; i < totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link shadow-none';
        a.innerText = i + 1;
        a.href = '#';
        a.onclick = (e) => {
            e.preventDefault();
            if (i !== currentPage) {
                window.scrollTo(0, 0);
                applyFilters(i);
            }
        };
        li.appendChild(a);
        paginationContainer.appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`;
    const nextA = document.createElement('a');
    nextA.className = 'page-link shadow-none';
    nextA.setAttribute('aria-label', 'Next');
    nextA.innerHTML = '<i class="bi bi-arrow-right"></i>';
    nextA.href = '#';
    nextA.onclick = (e) => {
        e.preventDefault();
        if (currentPage < totalPages - 1) {
            window.scrollTo(0, 0);
            applyFilters(currentPage + 1);
        }
    };
    nextLi.appendChild(nextA);
    paginationContainer.appendChild(nextLi);
}