document.addEventListener('DOMContentLoaded', () => {
    getBannerData();
    getBrands();
    getNewArrivals();
    getBestSelling();
    getMoreProducts();
})

async function getBannerData() {
    try {
        const response = await fetch("api/products/banner");
        const result = await response.json();

        if (response.ok && result.success) {
            renderBanners(result.data.banners);
        }
    } catch (error) {
        console.error("Failed to load banner data:", error);
    }
}

function renderBanners(banners) {
    const swiperWrapper = document.getElementById('swiper-slide-container');

    swiperWrapper.innerHTML = '';

    banners.forEach((b) => {
        const bannerImage = b.imagePath || 'assets/images/banner-placeholder.jpg';

        swiperWrapper.innerHTML += `
        <div class="swiper-slide d-flex align-items-center"
             style="background-image:url(${bannerImage});">
            <div class="banner-content w-100">
                <div class="container">
                    <div class="row">
                        <div class="col-md-6 offset-md-6">
                            <h2 class="display-1 text-uppercase mt-5 pt-5">${b.title}</h2>
                            <p class="caption">${b.description}</p>
                            <div class="btn-left btn-swiper">
                                <a href="${b.url}" class="btn btn-light text-uppercase mt-3">Shop Collection</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `;
    })
}

async function getBrands() {
    try {
        const response = await fetch("api/filters/brands")
        const result = await response.json();

        if (response.ok && result.success) {
            renderBrands(result.data.brands);
        }
    } catch (error) {
        console.error("Failed to load banner data:", error);
    }
}

function renderBrands(brands) {
    const brandsContainer = document.getElementById('brands-container');

    brandsContainer.innerHTML = '';

    brands.slice(0, 5).forEach((b) => {
        const brandName = b.name;
        const brandImage = b.path || 'assets/images/brand/clothing/brand-placeholder.jpg';

        brandsContainer.innerHTML += `
        <div class="col-6 col-md-4 col-lg d-flex">
            <div class="image-zoom-effect w-100">
                <div class="image-holder">
                    <a href="shop.html?brand=${brandName}" class="brand-tile">
                        <img src="${brandImage}" alt="${brandName}" class="img-fluid brand-logo"
                        onerror="this.onerror=null;this.src='assets/images/brand/clothing/brand-placeholder.jpg';">
                    </a>
                </div>
            </div>
        </div>
        `
    })
}

async function getNewArrivals() {
    try {
        const response = await fetch("api/products/search?sort=0&size=8");
        const result = await response.json();

        if (response.ok && result.success) {
            renderNewArrivals(result.data.products);
        }
    } catch (error) {
        console.error("Failed to load new arrivals:", error);
    }
}

function renderNewArrivals(products) {
    const newArrivalSwiperWrapper = document.getElementById('new-arrival-slide-container');

    newArrivalSwiperWrapper.innerHTML = '';

    products.forEach((p) => {
        const thumbUrl = p.images && p.images.length > 0 ? p.images[0] : 'assets/images/product-placeholder.jpg';
        const cartAction = p.defStockId ? `onclick="quickAddToCart(${p.defStockId})"`
            : `onclick="showToast("Product is out of stock!", false)"`;

        newArrivalSwiperWrapper.innerHTML += `
        <div class="swiper-slide">
            <div class="product-item image-zoom-effect link-effect">
                <div class="image-holder position-relative">
                    <a href="single-product.html?id=${p.id}">
                        <img src="${thumbUrl}" alt="${p.title}" class="product-image img-fluid"
                        onerror="this.onerror=null;this.src='assets/images/product-placeholder.jpg';">
                    </a>
                    <a onclick="addToWishlist(${p.id})" class="btn-icon btn-wishlist c-pointer 
                                ${p.wishlisted ? 'text-danger' : ''}" data-product-id="${p.id}">
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
            </div>
        </div>
        `;
    })
}

async function getBestSelling() {
    try {
        const response = await fetch("api/products/search?sort=1&size=8");
        const result = await response.json();

        if (response.ok && result.success) {
            renderBestSelling(result.data.products);
        }
    } catch (error) {
        console.error("Failed to load best selling products:", error);
    }
}

function renderBestSelling(products) {
    const bestSellingSwiperWrapper = document.getElementById('best-selling-slide-container');

    bestSellingSwiperWrapper.innerHTML = '';

    products.forEach((p) => {
        const thumbUrl = p.images && p.images.length > 0 ? p.images[0] : 'assets/images/product-placeholder.jpg';
        const cartAction = p.defStockId ? `onclick="quickAddToCart(${p.defStockId})"`
            : `onclick="showToast("Product is out of stock!", false)"`;

        bestSellingSwiperWrapper.innerHTML += `
        <div class="swiper-slide">
            <div class="product-item image-zoom-effect link-effect">
                <div class="image-holder position-relative">
                    <a href="single-product.html?id=${p.id}">
                        <img src="${thumbUrl}" alt="${p.title}" class="product-image img-fluid"
                        onerror="this.onerror=null;this.src='assets/images/product-placeholder.jpg';">
                    </a>
                    <a onclick="addToWishlist(${p.id})" class="btn-icon btn-wishlist c-pointer 
                                ${p.wishlisted ? 'text-danger' : ''}" data-product-id="${p.id}">
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
            </div>
        </div>
        `;
    })
}

async function getMoreProducts() {
    try {
        const response = await fetch("api/products/search?sort=2&size=8");
        const result = await response.json();

        if (response.ok && result.success) {
            renderMoreProducts(result.data.products);
        }
    } catch (error) {
        console.error("Failed to load best selling products:", error);
    }
}

function renderMoreProducts(products) {
    const moreProductsSwiperWrapper = document.getElementById('more-products-slide-container');

    moreProductsSwiperWrapper.innerHTML = '';

    products.forEach((p) => {
        const thumbUrl = p.images && p.images.length > 0 ? p.images[0] : 'assets/images/product-placeholder.jpg';
        const cartAction = p.defStockId ? `onclick="quickAddToCart(${p.defStockId})"`
            : `onclick="showToast("Product is out of stock!", false)"`;

        moreProductsSwiperWrapper.innerHTML += `
        <div class="swiper-slide">
            <div class="product-item image-zoom-effect link-effect">
                <div class="image-holder position-relative">
                    <a href="single-product.html?id=${p.id}">
                        <img src="${thumbUrl}" alt="${p.title}" class="product-image img-fluid"
                        onerror="this.onerror=null;this.src='assets/images/product-placeholder.jpg';">
                    </a>
                    <a onclick="addToWishlist(${p.id})" class="btn-icon btn-wishlist c-pointer 
                                ${p.wishlisted ? 'text-danger' : ''}" data-product-id="${p.id}">
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
            </div>
        </div>
        `;
    })
}