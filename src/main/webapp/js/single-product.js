let currentStockList = [];
let selectedStockId = null;
let selectedColorName = null;
let selectedSizeName = null;
let allColorOptions = [];
let allSizeOptions = [];

document.addEventListener('DOMContentLoaded', () => {
    loadSingleProduct();
    initActionButtons();
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

        if (!response.ok || !result.success || !result.data) {
            skeletonContainer.classList.add('d-none');
            errorContainer.classList.remove('d-none');
            notify(result.message || 'Failed to load product details!', false);
            return;
        }

        const data = result.data;
        currentStockList = Array.isArray(data.stockList) ? data.stockList : [];

        if (currentStockList.length === 0) {
            skeletonContainer.classList.add('d-none');
            errorContainer.classList.remove('d-none');
            notify('This product has no available stock variants.', false);
            return;
        }

        resetVariantSelectionState();
        initializeVariantCatalog(currentStockList);
        renderStaticProductInfo(data);
        renderImages(data.imageList, data.title);
        renderColorOptions();
        renderSizeOptions();
        renderMetaAndTabs(data, currentStockList);
        updateStockStatus(null);

        skeletonContainer.classList.add('d-none');
        productContainer.classList.remove('d-none');
        if (tabsSection) tabsSection.classList.remove('d-none');
        if (relatedSection) relatedSection.classList.remove('d-none');
    } catch (error) {
        console.error('Error loading product:', error);
        skeletonContainer.classList.add('d-none');
        errorContainer.classList.remove('d-none');
        notify('Server connection failed! Please try again.', false);
    }
}

function renderStaticProductInfo(data) {
    document.title = `New Fashion Store | ${data.title || 'Product'}`;

    document.getElementById('productBrand').textContent = data.brand || '';
    document.getElementById('productCategory').textContent = data.category || '';
    document.getElementById('productTitle').textContent = data.title || '';
    document.getElementById('productDescription').textContent = data.description || '';

    document.getElementById('selectedColorName').textContent = 'Select';
    document.getElementById('selectedSizeName').textContent = 'Select';

    updateDisplayedPrice();

    const quantityInput = document.getElementById('quantity');
    quantityInput.value = 1;
    quantityInput.max = 100;
}

function initializeVariantCatalog(stockList) {
    const colorMap = new Map();
    const sizeSet = new Set();

    stockList.forEach(stock => {
        if (stock.colorName && !colorMap.has(stock.colorName)) {
            colorMap.set(stock.colorName, {
                colorName: stock.colorName,
                colorCode: stock.colorCode
            });
        }
        if (stock.size) {
            sizeSet.add(stock.size);
        }
    });

    allColorOptions = [...colorMap.values()];
    allSizeOptions = [...sizeSet.values()];
}

function renderMetaAndTabs(data, stockList) {
    const uniqueColors = [...new Set(stockList.map(s => s.colorName).filter(Boolean))];
    const uniqueSizes = [...new Set(stockList.map(s => s.size).filter(Boolean))];

    const metaCategoryEl = document.getElementById('metaCategory');
    metaCategoryEl.textContent = data.category || '';
    metaCategoryEl.href = data.category
        ? `shop.html?category=${encodeURIComponent(data.category)}`
        : '#';

    document.getElementById('metaBrand').textContent = data.brand || '';
    document.getElementById('metaTags').textContent = uniqueColors.join(', ');

    document.getElementById('tabDescription').textContent = data.description || '';
    document.getElementById('infoTableBrand').textContent = data.brand || '–';
    document.getElementById('infoTableCategory').textContent = data.category || '–';
    document.getElementById('infoTableColors').textContent = uniqueColors.join(', ') || '–';
    document.getElementById('infoTableSizes').textContent = uniqueSizes.join(', ') || '–';
}

// ─── Image Gallery ───────────────────────────────────────────

function renderImages(imageList, title) {
    const safeImages = Array.isArray(imageList) && imageList.length > 0
        ? imageList
        : ['assets/images/products/product-placeholder.jpg'];

    const mainContainer = document.querySelector('.product-large-slider .swiper-wrapper');
    const thumbContainer = document.querySelector('.product-thumbnail-slider .swiper-wrapper');

    if (!mainContainer || !thumbContainer) {
        return;
    }

    mainContainer.innerHTML = safeImages.map(img => `
        <div class="swiper-slide">
            <div class="image-zoom" data-scale="2.5" data-image="${img}">
                <img src="${img}" alt="${title}" class="img-fluid"
                     onerror="this.onerror=null;this.src='assets/images/products/product-placeholder.jpg';
                     this.parentElement.dataset.image='assets/images/products/product-placeholder.jpg';">
            </div>
        </div>
    `).join('');

    thumbContainer.innerHTML = safeImages.map(img => `
        <div class="swiper-slide">
            <img src="${img}" alt="${title}" class="thumb-image img-fluid"
                 onerror="this.onerror=null;this.src='assets/images/products/product-placeholder.jpg';">
        </div>
    `).join('');

    const thumbSwiper = document.querySelector('.product-thumbnail-slider')?.swiper;
    const largeSwiper = document.querySelector('.product-large-slider')?.swiper;

    if (thumbSwiper) {
        thumbSwiper.update();
        thumbSwiper.slideTo(0, 0);
    }

    if (largeSwiper) {
        largeSwiper.update();
        largeSwiper.slideTo(0, 0);
    }
}

// ─── Color & Size Options ───────────────────────────────────

function renderColorOptions() {
    const container = document.getElementById('colorOptions');
    container.innerHTML = allColorOptions.map((color, index) => {
        const colorId = `color-${color.colorName.toLowerCase().replace(/\s+/g, '-')}-${index}`;
        const checked = selectedColorName === color.colorName ? 'checked' : '';
        const disabled = isColorDisabled(color.colorName) ? 'disabled' : '';

        return `
            <div data-value="${color.colorName}" class="swatch-element ${disabled ? 'opacity-50' : ''}">
                <input class="swatch-input color-swatch-input"
                       id="${colorId}"
                       type="radio"
                       name="option-color"
                       value="${color.colorName}"
                       data-color-code="${color.colorCode}"
                       ${checked}
                       ${disabled}
                       onchange="selectColor(this.value)">
                <label class="swatch-label color-link-label" for="${colorId}">
                    <span class="sp-color-dot" style="background-color: ${color.colorCode};"></span>
                    <a class="btn-link">${color.colorName}</a>
                </label>
            </div>
        `;
    }).join('');
}

function renderSizeOptions() {
    const container = document.getElementById('sizeOptions');

    container.innerHTML = allSizeOptions.map((size, index) => {
        const sizeId = `size-${size.toLowerCase()}-${index}`;
        const checked = selectedSizeName === size ? 'checked' : '';
        const disabled = isSizeDisabled(size) ? 'disabled' : '';

        return `
            <div data-value="${size}" class="swatch-element ${disabled ? 'opacity-50' : ''}">
                <input class="swatch-input"
                       id="${sizeId}"
                       type="radio"
                       name="option-1"
                       value="${size}"
                       ${checked}
                       ${disabled}
                       onchange="selectSize('${size}')">
                <label class="swatch-label square-only" for="${sizeId}">
                    <a class="btn-link">${size}</a>
                </label>
            </div>
        `;
    }).join('');
}

function selectColor(colorName) {
    if (isColorDisabled(colorName)) return;

    selectedColorName = colorName;
    if (selectedSizeName && !isCombinationAvailable(selectedColorName, selectedSizeName)) {
        selectedSizeName = null;
    }

    document.getElementById('selectedColorName').textContent = colorName || 'Select';
    document.getElementById('selectedSizeName').textContent = selectedSizeName || 'Select';

    renderColorOptions();
    renderSizeOptions();
    syncSelectionState();
}

function selectSize(sizeName) {
    if (isSizeDisabled(sizeName)) return;

    selectedSizeName = sizeName;
    if (selectedColorName && !isCombinationAvailable(selectedColorName, selectedSizeName)) {
        selectedColorName = null;
    }

    document.getElementById('selectedColorName').textContent = selectedColorName || 'Select';
    document.getElementById('selectedSizeName').textContent = sizeName || 'Select';

    renderColorOptions();
    renderSizeOptions();
    syncSelectionState();
}

// ─── Stock Matching ──────────────────────────────────────────

function updateSelectedStock() {
    if (!selectedColorName || !selectedSizeName) {
        selectedStockId = null;
        updateStockStatus(null);
        return;
    }

    const match = currentStockList.find(
        s => s.colorName === selectedColorName && s.size === selectedSizeName
    );

    if (!match) {
        selectedStockId = null;
        updateDisplayedPrice();
        updateStockStatus(0);
        return;
    }

    selectedStockId = match.id;
    document.getElementById('productPrice').textContent = `LKR ${Number(match.price).toFixed(2)}`;

    const quantityInput = document.getElementById('quantity');
    quantityInput.max = Math.max(match.qty, 1);
    quantityInput.value = 1;

    updateStockStatus(match.qty);
}

function updateDisplayedPrice() {
    const priceEl = document.getElementById('productPrice');

    if (selectedColorName && selectedSizeName) {
        const selectedMatch = currentStockList.find(
            s => s.colorName === selectedColorName && s.size === selectedSizeName
        );

        if (selectedMatch) {
            priceEl.textContent = `LKR ${Number(selectedMatch.price).toFixed(2)}`;
            return;
        }
    }

    const filtered = currentStockList.filter(stock => {
        if (selectedColorName && stock.colorName !== selectedColorName) return false;
        if (selectedSizeName && stock.size !== selectedSizeName) return false;
        return true;
    });

    const pricePool = filtered.length > 0 ? filtered : currentStockList;

    if (pricePool.length === 0) {
        priceEl.textContent = 'LKR --';
    } else {
        const minPrice = Math.min(...pricePool.map(item => Number(item.price)));
        priceEl.textContent = `LKR ${minPrice.toFixed(2)}`;
    }

    const quantityInput = document.getElementById('quantity');
    quantityInput.max = 100;
    quantityInput.value = 1;
}

function updateStockStatus(qty) {
    const text = document.getElementById('stockText');

    text.classList.remove('border-success-subtle', 'text-success', 'border-danger-subtle', 'text-danger', 'border-secondary-subtle', 'text-muted');

    if (qty === null) {
        text.textContent = 'Select color and size';
        text.classList.add('border-secondary-subtle', 'text-muted');
        return;
    }

    if (qty > 0) {
        text.textContent = `In Stock (${qty} left)`;
        text.classList.add('border-success-subtle', 'text-success');
        return;
    }

    text.textContent = 'Out of Stock';
    text.classList.add('border-danger-subtle', 'text-danger');
}

function resetVariantSelectionState() {
    selectedColorName = null;
    selectedSizeName = null;
    selectedStockId = null;
}

function isCombinationAvailable(colorName, sizeName) {
    return currentStockList.some(stock => stock.colorName === colorName && stock.size === sizeName);
}

function isColorDisabled(colorName) {
    if (!selectedSizeName) return false;
    return !isCombinationAvailable(colorName, selectedSizeName);
}

function isSizeDisabled(sizeName) {
    if (!selectedColorName) return false;
    return !isCombinationAvailable(selectedColorName, sizeName);
}

function syncSelectionState() {
    updateDisplayedPrice();
    updateSelectedStock();
}

// ─── Cart/Wishlist (disabled for now) ───────────────────────

function initActionButtons() {
    const addToCartBtn = document.getElementById('addToCartBtn');
    const wishlistBtn = document.getElementById('wishlistBtn');

    if (addToCartBtn) {
        addToCartBtn.onclick = null;
    }

    if (wishlistBtn) {
        wishlistBtn.onclick = null;
    }
}

function notify(message, isSuccess) {
    if (typeof showToast === 'function') {
        showToast(message, isSuccess);
    }
}
