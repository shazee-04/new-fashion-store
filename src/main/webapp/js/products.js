let currentPage = 0;
const pageSize = 12;

document.addEventListener('DOMContentLoaded', () => {
    loadFilters().then(() => {
        syncFiltersWithURL();
    })

    document.getElementById('sortSelect').addEventListener('change', () => applyFilters(0));

    document.getElementById('applyFiltersBtn').addEventListener('click', () => {
        applyFilters(0);
        window.scrollTo(0, 0);
        document.getElementById('offcanvasFilterClose')?.click();
    });

    document.getElementById('resetFilters').addEventListener('click', () => {
        resetFilters();
    })
});

async function loadFilters() {
    const response = await fetch('api/filters/all');
    const result = await response.json();

    const categoryContainer = document.getElementById('categoryContainer');
    const brandContainer = document.getElementById('brandContainer');

    categoryContainer.innerHTML = result.data.categories.map(c => `
        <div class="form-check">
            <input class="form-check-input filter-check ms-0 shadow-none"
                   type="checkbox"
                   value="${c.name.toLowerCase()}"
                   data-type="category"
                   id="cat-${c.id}">
            <label class="form-check-label fs-6"
                   for="cat-${c.id}">
                ${c.name}
            </label>
        </div>
    `).join('');

    brandContainer.innerHTML = result.data.brands.map(b => `
        <div class="form-check">
            <input class="form-check-input filter-check ms-0 shadow-none"
                   type="checkbox"
                   value="${b.name.toLowerCase()}"
                   data-type="brand"
                   id="brand-${b.id}">
            <label class="form-check-label fs-6"
                   for="brand-${b.id}">
                ${b.name}
            </label>
        </div>
    `).join('');
}

function syncFiltersWithURL() {
    const params = new URLSearchParams(window.location.search);
    const page = parseInt(params.get('page')) || 0;

    if (params.get('query')) {
        document.getElementById('search-form').value = params.get('query');
    }
    if (params.get('minPrice')) {
        document.getElementById('minPrice').value = params.get('minPrice');
    }
    if (params.get('maxPrice')) {
        document.getElementById('maxPrice').value = params.get('maxPrice');
    }

    // Restore checkboxes
    if (params.get('category')) {
        (params.get('category') || '').split(';').forEach(val => {
            const el = document.querySelector(`.filter-check[data-type="category"][value="${val}"]`);
            if (el) el.checked = true;
        });
    }

    if (params.get('brand')) {
        (params.get('brand') || '').split(';').forEach(val => {
            const el = document.querySelector(`.filter-check[data-type="brand"][value="${val}"]`);
            if (el) el.checked = true;
        });
    }

    // Restore sort
    if (params.get('sort')) {
        document.getElementById('sortSelect').value = params.get('sort');
    }

    applyFilters(page);
}

async function applyFilters(page = 0) {
    currentPage = page;

    // Get Filters
    const searchText = document.getElementById('search-form')?.value || "";
    const categories = Array.from(document.querySelectorAll('.filter-check[data-type="category"]:checked'))
        .map(c => c.value).join(';');
    const brands = Array.from(document.querySelectorAll('.filter-check[data-type="brand"]:checked'))
        .map(b => b.value).join(';');

    const minPrice = document.getElementById('minPrice')?.value || "";
    const maxPrice = document.getElementById('maxPrice')?.value || "";

    const sortSelect = document.getElementById('sortSelect')?.value || "0";

    // Build URL
    const url = `api/products/search?page=${page}&size=${pageSize}` +
        `&query=${encodeURIComponent(searchText)}` +
        `&category=${categories}` +
        `&brand=${brands}` +
        `&minPrice=${minPrice}` +
        `&maxPrice=${maxPrice}` +
        `&sort=${sortSelect}`;

    updateBrowserURL({
        page,
        searchText,
        categories,
        brands,
        minPrice,
        maxPrice
        // sort: sortSelect
    });

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
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

function resetFilters() {
    document.querySelectorAll('.form-check-input').forEach(el =>
        el.checked = false);
    document.getElementById('search-form').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('sortSelect').value = '0';
}

function renderProducts(products) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '';

    if (products.length === 0) {
        productGrid.innerHTML = '<div class="col-12 text-center py-5 vh-100"><h4>No products found matching your criteria.</h4></div>';
        return;
    }

    products.forEach(p => {
        const thumbUrl = p.images && p.images.length > 0 ? p.images[0] : 'assets/images/product-placeholder.jpg';

        const cartAction = p.defStockId ? `onclick="quickAddToCart(${p.defStockId})"` : `onclick="showToast("Product is out of stock!", false)"`;

        productGrid.innerHTML += `
        <div class="col-md-3 mb-3 product-item link-effect">
          <div class="image-holder position-relative">
            <a href="single-product.html?id=${p.id}">
              <img src="${thumbUrl}" alt="${p.title}" class="product-image img-fluid"
              onerror="this.onerror=null;this.src='assets/images/product-placeholder.jpg';">
            </a>
            <a onclick="addToWishlist(${p.id})" class="btn-icon btn-wishlist c-pointer ${p.wishlisted ? 'text-danger' : ''}" data-product-id="${p.id}">
              <svg width="24" height="24" viewBox="0 0 24 24"><use xlink:href="#heart"></use></svg>
            </a>
            <div class="product-content">
              <h5 class="element-title text-uppercase fs-5 mt-3">
                <a href="single-product.html?id=${p.id}">${p.title}</a>
              </h5>
              <a class="text-decoration-none add-to-cart-btn c-pointer"
                ${cartAction} data-stock-id="${p.defStockId}"
                data-after="Add to cart"><span>LKR${p.minPrice.toFixed(2)}</span>
              </a>
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