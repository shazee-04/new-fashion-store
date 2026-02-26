let currentStockList = [];
let selectedStockId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadSingleProduct();
    initQuantityButtons();
});

// ─── Load Product ────────────────────────────────────────────

async function loadSingleProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('pId');

    const productContainer = document.getElementById('productContent');
    const skeletonContainer = document.getElementById('productSkeleton');
    const errorContainer = document.getElementById('productNotFound');
    const tabsSection = document.querySelector('.product-tabs');
    const relatedSection = document.getElementById('related-products');

    productContainer.classList.add('d-none');
    errorContainer.classList.add('d-none');
    if (tabsSection) tabsSection.classList.add('d-none');
    if (relatedSection) relatedSection.classList.add('d-none');
    skeletonContainer.classList.remove('d-none');

    if (!productId) {
        skeletonContainer.classList.add('d-none');
        errorContainer.classList.remove('d-none');
        return;
    }

    try {
        const response = await fetch(`api/products/singleProduct?pId=${productId}`);
        const result = await response.json();

        if (response.ok && result.success) {
            const data = result.data;
            currentStockList = data.stockList || [];
            const firstStock = currentStockList[0];

            if (!firstStock) {
                skeletonContainer.classList.add('d-none');
                errorContainer.classList.remove('d-none');
                return;
            }

            selectedStockId = firstStock.id;

            // Breadcrumb (optional)
            const breadcrumbCategory = document.getElementById('breadcrumbCategory');
            const breadcrumbProduct = document.getElementById('breadcrumbProduct');
            if (breadcrumbCategory) {
                breadcrumbCategory.innerHTML =
                    `<a href="shop.html?category=${encodeURIComponent(data.category)}" class="text-decoration-none text-dark">${data.category}</a>`;
            }
            if (breadcrumbProduct) {
                breadcrumbProduct.textContent = data.title;
            }

            // Badges + Title + Price + Description
            document.getElementById('productBrand').textContent = data.brand;
            document.getElementById('productCategory').textContent = data.category;
            document.getElementById('productTitle').textContent = data.title;
            document.getElementById('productPrice').textContent = `LKR ${firstStock.price.toFixed(2)}`;
            document.getElementById('productDescription').textContent = data.description;
            document.title = `New Fashion Store | ${data.title}`;

            // Images
            renderImages(data.imageList, data.title);

            // Color & Size swatches
            renderColorOptions(currentStockList);
            renderSizeOptions(currentStockList, firstStock.colorName);

            // Select first color + size
            document.getElementById('selectedColorName').textContent = firstStock.colorName;
            document.getElementById('selectedSizeName').textContent = firstStock.size;
            updateStockStatus(firstStock.qty);

            // Wishlist state
            updateWishlistButton(data.wishlisted);

            // Cart state
            updateCartButton(data.inCart, data.qtyInCart);

            // Meta section
            const metaCategoryEl = document.getElementById('metaCategory');
            metaCategoryEl.textContent = data.category;
            metaCategoryEl.href = `shop.html?category=${encodeURIComponent(data.category)}`;
            document.getElementById('metaBrand').textContent = data.brand;

            // Tabs content
            document.getElementById('tabDescription').textContent = data.description;
            document.getElementById('infoTableBrand').textContent = data.brand;
            document.getElementById('infoTableCategory').textContent = data.category;
            document.getElementById('infoTableColors').textContent =
                [...new Set(currentStockList.map(s => s.colorName))].join(', ');
            document.getElementById('infoTableSizes').textContent =
                [...new Set(currentStockList.map(s => s.size))].join(', ');

            // Quantity max
            document.getElementById('quantity').max = firstStock.qty;
            document.getElementById('quantity').value = 1;

            // Bind action buttons
            bindAddToCart(data.id);
            bindWishlistButton(data.id);

            // Swap visibility
            skeletonContainer.classList.add('d-none');
            productContainer.classList.remove('d-none');
            if (tabsSection) tabsSection.classList.remove('d-none');
            if (relatedSection) relatedSection.classList.remove('d-none');

        } else {
            skeletonContainer.classList.add('d-none');
            errorContainer.classList.remove('d-none');
            showToast(result.message || "Failed to load product details!", false);
        }

    } catch (error) {
        console.error('Error loading product:', error);
        skeletonContainer.classList.add('d-none');
        document.getElementById('productNotFound').classList.remove('d-none');
        showToast("Server connection failed! Please try again.", false);
    }
}

// ─── Image Gallery ───────────────────────────────────────────

function renderImages(imageList, title) {
    if (!imageList || imageList.length === 0) {
        imageList = ['assets/images/products/product-placeholder.jpg'];
    }

    const mainContainer = document.getElementById('mainImageSlides');
    const thumbContainer = document.getElementById('thumbnailSlides');
    const mobileContainer = document.getElementById('mobileThumbnails');

    // Main large slides
    mainContainer.innerHTML = imageList.map(img => `
            <div class="swiper-slide">
                  <div class="image-zoom" data-scale="2.5" data-image="${img}">
                        <img src="${img}" alt="${title}" class="img-fluid"
                             onerror="this.onerror=null;this.src='assets/images/products/product-placeholder.jpg';">
                  </div>
            </div>
      `).join('');

    // Thumbnail slides
    thumbContainer.innerHTML = imageList.map(img => `
            <div class="swiper-slide">
                  <img src="${img}" alt="${title}" class="thumb-image img-fluid"
                       onerror="this.onerror=null;this.src='assets/images/products/product-placeholder.jpg';">
            </div>
      `).join('');

    // Mobile thumbnails
    mobileContainer.innerHTML = imageList.map((img, i) => `
            <img src="${img}" alt="${title}" class="${i === 0 ? 'active' : ''}"
                 onclick="slideTo(${i})"
                 onerror="this.onerror=null;this.src='assets/images/products/product-placeholder.jpg';">
      `).join('');

    // Re-initialize Swipers after DOM update
    initProductSwipers();
}

let productLargeSwiper = null;
let productThumbSwiper = null;

function initProductSwipers() {
    // Destroy existing instances
    if (productThumbSwiper) productThumbSwiper.destroy(true, true);
    if (productLargeSwiper) productLargeSwiper.destroy(true, true);

    productThumbSwiper = new Swiper('#productThumbnailSlider', {
        direction: 'vertical',
        slidesPerView: 4,
        spaceBetween: 10,
        freeMode: true,
        watchSlidesProgress: true,
        breakpoints: {
            0: {direction: 'horizontal', slidesPerView: 4},
            992: {direction: 'vertical', slidesPerView: 4}
        }
    });

    productLargeSwiper = new Swiper('#productLargeSlider', {
        spaceBetween: 0,
        pagination: {el: '#productLargeSlider .swiper-pagination', clickable: true},
        thumbs: {swiper: productThumbSwiper}
    });
}

function slideTo(index) {
    if (productLargeSwiper) {
        productLargeSwiper.slideTo(index);
    }
    // Update mobile thumbnail active state
    document.querySelectorAll('#mobileThumbnails img').forEach((img, i) => {
        img.classList.toggle('active', i === index);
    });
}

// ─── Color Options ───────────────────────────────────────────

function renderColorOptions(stockList) {
    const container = document.getElementById('colorOptions');
    const uniqueColors = [];
    const seen = new Set();

    stockList.forEach(stock => {
        if (!seen.has(stock.colorName)) {
            seen.add(stock.colorName);
            uniqueColors.push(stock);
        }
    });

    container.innerHTML = uniqueColors.map((stock, i) => `
            <div data-value="${stock.colorName}" class="swatch-element ${i === 0 ? 'active' : ''}">
                  <input class="swatch-input color-swatch-input" id="color-${stock.colorName.toLowerCase().replace(/\s+/g, '-')}-${stock.id}"
                         type="radio" name="option-color" value="${stock.colorName}" data-color-code="${stock.colorCode}"
                         ${i === 0 ? 'checked' : ''}
                         onchange="selectColor(this.value, this)">
                  <label class="swatch-label color-link-label" for="color-${stock.colorName.toLowerCase().replace(/\s+/g, '-')}-${stock.id}">
                        <span class="sp-color-dot" style="background-color: ${stock.colorCode};"></span>
                        <span>${stock.colorName}</span>
                  </label>
            </div>
      `).join('');
}

function selectColor(colorOrElement, inputEl) {
    let colorName;
    let selectedInput = inputEl;

    if (typeof colorOrElement === 'string') {
        colorName = colorOrElement;
    } else {
        colorName = colorOrElement?.dataset?.color || colorOrElement?.value;
        selectedInput = colorOrElement?.tagName === 'INPUT'
            ? colorOrElement
            : colorOrElement?.querySelector('input[type="radio"]');
    }

    // Update active state
    document.querySelectorAll('#colorOptions .swatch-element').forEach(s => s.classList.remove('active'));
    if (selectedInput?.closest('.swatch-element')) {
        selectedInput.closest('.swatch-element').classList.add('active');
    }

    document.getElementById('selectedColorName').textContent = colorName;

    // Re-render sizes available for this color
    renderSizeOptions(currentStockList, colorName);

    // Auto-select the first available size for this color
    const firstSizeBtn = document.querySelector('#sizeOptions .swatch-element input');
    if (firstSizeBtn) {
        firstSizeBtn.checked = true;
        const sizeName = firstSizeBtn.value;
        document.getElementById('selectedSizeName').textContent = sizeName;
        updateSelectedStock(colorName, sizeName);
    }
}

// ─── Size Options ────────────────────────────────────────────

function renderSizeOptions(stockList, activeColor) {
    const container = document.getElementById('sizeOptions');

    // Filter sizes for the active color
    const sizesForColor = stockList.filter(s => s.colorName === activeColor);
    const uniqueSizes = [...new Map(sizesForColor.map(s => [s.size, s])).values()];

    container.innerHTML = uniqueSizes.map((stock, i) => `
            <div data-value="${stock.size}" class="swatch-element">
                  <input class="swatch-input" id="size-${stock.size.toLowerCase()}-${stock.id}"
                         type="radio" name="option-1" value="${stock.size}"
                         ${i === 0 ? 'checked' : ''}
                         onchange="selectSize('${stock.size}')">
                  <label class="swatch-label square-only"
                         for="size-${stock.size.toLowerCase()}-${stock.id}">${stock.size}</label>
            </div>
      `).join('');

    // Update selected size label
    if (uniqueSizes.length > 0) {
        document.getElementById('selectedSizeName').textContent = uniqueSizes[0].size;
    }
}

function selectSize(sizeName) {
    document.getElementById('selectedSizeName').textContent = sizeName;
    const activeColor = document.getElementById('selectedColorName').textContent;
    updateSelectedStock(activeColor, sizeName);
}

// ─── Stock Matching ──────────────────────────────────────────

function updateSelectedStock(colorName, sizeName) {
    const match = currentStockList.find(s => s.colorName === colorName && s.size === sizeName);

    if (match) {
        selectedStockId = match.id;
        document.getElementById('productPrice').textContent = `LKR ${match.price.toFixed(2)}`;
        updateStockStatus(match.qty);
        document.getElementById('quantity').max = match.qty;
        document.getElementById('quantity').value = 1;
    } else {
        selectedStockId = null;
        document.getElementById('productPrice').textContent = 'LKR 0.00';
        updateStockStatus(0);
    }
}

function updateStockStatus(qty) {
    const pill = document.getElementById('stockStatus');
    const text = document.getElementById('stockText');
    const addBtn = document.getElementById('addToCartBtn');

    if (qty > 0) {
        pill.className = 'sp-stock-pill in-stock';
        pill.querySelector('i').className = 'bi bi-check-circle me-1';
        text.textContent = `In Stock (${qty} left)`;
        if (addBtn) addBtn.disabled = false;
    } else {
        pill.className = 'sp-stock-pill out-stock';
        pill.querySelector('i').className = 'bi bi-x-circle me-1';
        text.textContent = 'Out of Stock';
        if (addBtn) addBtn.disabled = true;
    }
}

// ─── Wishlist Button ─────────────────────────────────────────

function updateWishlistButton(wishlisted) {
    const btn = document.getElementById('wishlistBtn');
    if (wishlisted) {
        btn.classList.add('wishlisted');
        btn.title = 'Remove from Wishlist';
    } else {
        btn.classList.remove('wishlisted');
        btn.title = 'Add to Wishlist';
    }
}

function bindWishlistButton(productId) {
    const btn = document.getElementById('wishlistBtn');
    btn.onclick = async () => {
        if (!Auth.isLoggedIn()) {
            showToast('Please login to manage your wishlist!', false);
            return;
        }

        const isWishlisted = btn.classList.contains('wishlisted');
        const endpoint = isWishlisted
            ? `api/wishlist/remove?pId=${productId}`
            : `api/wishlist/add?pId=${productId}`;

        try {
            const response = await fetch(endpoint, {method: 'POST'});
            const result = await response.json();

            if (response.ok && result.success) {
                updateWishlistButton(!isWishlisted);
                showToast(result.message, true);
                document.querySelector('header-component')?.refreshWishlistCount?.();
            } else {
                showToast(result.message || 'Wishlist action failed!', false);
            }
        } catch (error) {
            console.error('Wishlist error:', error);
            showToast('Server connection failed! Please try again.', false);
        }
    };
}

// ─── Cart Button ─────────────────────────────────────────────

function updateCartButton(inCart, qtyInCart) {
    const btn = document.getElementById('addToCartBtn');
    const span = btn.querySelector('span');
    const icon = btn.querySelector('i');

    if (inCart && qtyInCart > 0) {
        span.textContent = `In Cart (${qtyInCart})`;
        icon.className = 'bi bi-cart-check me-2';
    } else {
        span.textContent = 'Add to Cart';
        icon.className = 'bi bi-cart-plus me-2';
    }
}

function bindAddToCart(productId) {
    const btn = document.getElementById('addToCartBtn');
    btn.onclick = async () => {
        if (!selectedStockId) {
            showToast('Please select a variant!', false);
            return;
        }

        const qty = parseInt(document.getElementById('quantity').value) || 1;
        const loadingToast = getLoadingToast('Adding to cart...');
        loadingToast.showToast();
        btn.disabled = true;

        try {
            const response = await fetch(`api/cart/add?stockId=${selectedStockId}&qty=${qty}`, {
                method: 'POST'
            });
            const result = await response.json();
            loadingToast.hideToast();

            if (response.ok && result.success) {
                showToast(result.message, true);
                const span = btn.querySelector('span');
                const icon = btn.querySelector('i');
                span.textContent = `In Cart`;
                icon.className = 'bi bi-cart-check me-2';
                document.querySelector('header-component')?.refreshCartCount?.();
            } else {
                showToast(result.message || 'Failed to add to cart!', false);
            }
        } catch (error) {
            loadingToast.hideToast();
            console.error('Cart error:', error);
            showToast('Server connection failed! Please try again.', false);
        } finally {
            btn.disabled = false;
        }
    };
}

// ─── Quantity Buttons ────────────────────────────────────────

function initQuantityButtons() {
    document.querySelector('.quantity-left-minus')?.addEventListener('click', () => {
        const input = document.getElementById('quantity');
        let val = parseInt(input.value) || 1;
        if (val > 1) input.value = val - 1;
    });

    document.querySelector('.quantity-right-plus')?.addEventListener('click', () => {
        const input = document.getElementById('quantity');
        const max = parseInt(input.max) || 100;
        let val = parseInt(input.value) || 1;
        if (val < max) input.value = val + 1;
    });

    // Prevent non-numeric input
    document.getElementById('quantity')?.addEventListener('input', (e) => {
        const max = parseInt(e.target.max) || 100;
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) e.target.value = 1;
        else if (val > max) e.target.value = max;
    });
}