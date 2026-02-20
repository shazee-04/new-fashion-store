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