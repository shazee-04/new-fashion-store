document.addEventListener('DOMContentLoaded', () => {
    getBannerData();
})

async function getBannerData() {
    try {
        const response = await fetch("api/products/banner");
        const result = await response.json();

        if(response.ok && result.success) {
            renderHeroSwiper(result.data.banners);
        }
    } catch (error) {
        console.error("Failed to load banner data:", error);
    }
}

function renderHeroSwiper(banners) {
    const swiperWrapper = document.getElementById('swiper-slide-container');

    swiperWrapper.innerHTML = '';

    banners.forEach((b) => {
        const bannerImage = b.imagePath || 'assets/images/banner-placeholder.jpg';

        swiperWrapper.innerHTML += `
        <div class="swiper-slide">
            <div class="row banner-item text-center align-items-center">
                <div class="col-lg-6">
                    <div class="image-holder">
                        <img src="${bannerImage}" alt="product" class="product-image img-fluid"
                        onerror="this.onerror=null;this.src='assets/images/banner-placeholder.jpg';">
                    </div>
                </div>
                <div class="banner-content col-lg-6 p-5">
                    <h2 class="display-2 text-uppercase txt-fx slide-up">${b.title}</h2>
                    <p>${b.description}</p>
                    <a href="${b.url}" class="btn btn-outline-dark text-uppercase mt-3">Shop
                        Collection</a>
                </div>
            </div>
        </div>
        `;
    })
}