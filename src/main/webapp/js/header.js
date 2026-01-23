class Header extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <!-- Search Popup -->
    <div class="search-popup">
        <div class="search-popup-container">
            <form role="search" method="get" class="form-group" action="">
                <label for="search-form"></label>
                <div class="position-relative">
                    <input type="search" id="search-form" class="form-control border-0 border-bottom shadow-none"
                        placeholder="Type and press enter" value="" name="s" />
                    <button type="submit" class="search-submit border-0 position-absolute bg-transparent"
                        style="bottom: 10px;right: 15px;">
                        <i class="bi bi-arrow-right" style="font-size: 24px;"></i>
                    </button>
                </div>
            </form>

            <h5 class="cat-list-title">Browse Categories</h5>

            <ul class="cat-list">
                <li class="cat-list-item">
                    <a href="#">Jackets</a>
                </li>
                <li class="cat-list-item">
                    <a href="#">T-shirts</a>
                </li>
                <li class="cat-list-item">
                    <a href="#">Handbags</a>
                </li>
                <li class="cat-list-item">
                    <a href="#">Accessories</a>
                </li>
                <li class="cat-list-item">
                    <a href="#">Cosmetics</a>
                </li>
                <li class="cat-list-item">
                    <a href="#">Dresses</a>
                </li>
                <li class="cat-list-item">
                    <a href="#">Jumpsuits</a>
                </li>
            </ul>

        </div>
    </div>

    <!-- Cart offcanvas -->
    <div class="offcanvas offcanvas-end" data-bs-scroll="true" tabindex="-1" id="offcanvasCart">
        <div class="offcanvas-header justify-content-between align-items-center">
            <h5 class="offcanvas-title" id="offcanvasCartLabel">
                Your Cart <span class="fs-6 text-muted">(3)</span>
            </h5>
            <button type="button" class="text-reset shadow-none border-0 bg-transparent" data-bs-dismiss="offcanvas"
                aria-label="Close">
                <i class="bi bi-x-lg text-black"></i>
            </button>
        </div>

        <div class="offcanvas-body">
            <div class="order-md-last">
                <ul class="list-group mb-3">
                    <li class="list-group-item d-flex justify-content-between lh-sm">
                        <div class="d-flex align-items-start gap-2">
                            <img src="assets/images/product-item1.jpg" class="object-fit-cover"
                                style="aspect-ratio: 1 / 1; height: 100px;" alt="Product image">
                            <div class="p-1">
                                <h6 class="my-0 cart-item-title">Growers cider</h6>
                                <p class="text-muted cart-item-desc small mb-1">
                                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. Saepe dolor quia beatae
                                    dolores ab ea unde eligendi debitis quisquam cupiditate, at culpa consequuntur
                                    incidunt earum vitae in quaerat aspernatur aliquid odio doloremque corrupti, sint
                                    autem facere ad. Dolore totam nobis dolorum necessitatibus.
                                </p>
                                <span class="cart-item-qty">1 x $12</span>
                            </div>
                        </div>
                        <span class="text-muted cart-item-price">
                            $120000
                        </span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between lh-sm">
                        <div class="d-flex align-items-start gap-2">
                            <img src="assets/images/product-item1.jpg" class="object-fit-cover"
                                style="aspect-ratio: 1 / 1; height: 100px;" alt="Product image">
                            <div class="p-1">
                                <h6 class="my-0 cart-item-title">Growers cider</h6>
                                <p class="text-muted cart-item-desc small mb-1">
                                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. Saepe dolor quia beatae
                                    dolores ab ea unde eligendi debitis quisquam cupiditate, at culpa consequuntur
                                    incidunt earum vitae in quaerat aspernatur aliquid odio doloremque corrupti, sint
                                    autem facere ad. Dolore totam nobis dolorum necessitatibus.
                                </p>
                                <span class="cart-item-qty">1 x $12</span>
                            </div>
                        </div>
                        <span class="text-muted cart-item-price">
                            $120000
                        </span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between lh-sm">
                        <div class="d-flex align-items-start gap-2">
                            <img src="assets/images/product-item1.jpg" class="object-fit-cover"
                                style="aspect-ratio: 1 / 1; height: 100px;" alt="Product image">
                            <div class="p-1">
                                <h6 class="my-0 cart-item-title">Growers cider</h6>
                                <p class="text-muted cart-item-desc small mb-1">
                                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. Saepe dolor quia beatae
                                    dolores ab ea unde eligendi debitis quisquam cupiditate, at culpa consequuntur
                                    incidunt earum vitae in quaerat aspernatur aliquid odio doloremque corrupti, sint
                                    autem facere ad. Dolore totam nobis dolorum necessitatibus.
                                </p>
                                <span class="cart-item-qty">1 x $12</span>
                            </div>
                        </div>
                        <span class="text-muted cart-item-price">
                            $120000
                        </span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between lh-sm">
                        <div class="d-flex align-items-start gap-2">
                            <img src="assets/images/product-item1.jpg" class="object-fit-cover"
                                style="aspect-ratio: 1 / 1; height: 100px;" alt="Product image">
                            <div class="p-1">
                                <h6 class="my-0 cart-item-title">Growers cider</h6>
                                <p class="text-muted cart-item-desc small mb-1">
                                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. Saepe dolor quia beatae
                                    dolores ab ea unde eligendi debitis quisquam cupiditate, at culpa consequuntur
                                    incidunt earum vitae in quaerat aspernatur aliquid odio doloremque corrupti, sint
                                    autem facere ad. Dolore totam nobis dolorum necessitatibus.
                                </p>
                                <span class="cart-item-qty">1 x $12</span>
                            </div>
                        </div>
                        <span class="text-muted cart-item-price">
                            $120000
                        </span>
                    </li>
                </ul>

                <div class="list-group-item d-flex justify-content-between text-dark py-2 fw-medium">
                    <span>Total (LKR)</span>
                    <span>20000</span>
                </div>
                <button class="w-100 btn btn-outline-dark btn-lg" type="submit">
                    Continue to checkout
                    <i class="bi bi-arrow-right"></i>
                </button>
            </div>
        </div>
    </div>

    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg text-uppercase fs-6 p-3 px-1 border-bottom align-items-center">
        <div class="container-fluid justify-content-evenly">
            <div class="row justify-content-between align-items-center w-100 flex-nowrap">

                <div class="col-auto d-flex align-items-center">
                    <button class="navbar-toggler shadow-none border-0 bg-light py-1 px-2 me-2" type="button"
                        data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar">
                        <i class="bi bi-list-nested"></i>
                    </button>
                    <a class="navbar-brand" href="index.html"><img height="32px" src="assets/images/main-logo.png"
                            alt="logo"></a>
                </div>

                <div class="col-auto">
                    <div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNavbar"
                        aria-labelledby="offcanvasNavbarLabel">
                        <div class="offcanvas-header">
                            <h5 class="offcanvas-title" id="offcanvasNavbarLabel">Menu</h5>
                            <button type="button" class="text-reset shadow-none border-0 bg-transparent"
                                data-bs-dismiss="offcanvas" aria-label="Close">
                                <i class="bi bi-x-lg text-black"></i>
                            </button>
                        </div>

                        <div class="offcanvas-body">
                            <ul class="navbar-nav justify-content-end flex-grow-1 gap-1 gap-lg-3 gap-xl-5 pe-3">
                                <li class="nav-item">
                                    <a class="nav-link" href="index.html">Home</a>
                                </li>
                                <li class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" href="my-account.html#" id="dropdownShop"
                                        data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Shop</a>
                                    <ul class="dropdown-menu list-unstyled" aria-labelledby="dropdownShop">
                                        <li>
                                            <a href="#" class="dropdown-item item-anchor">
                                                New Arrivals
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" class="dropdown-item item-anchor">
                                                Trending
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" class="dropdown-item item-anchor">
                                                Mens
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" class="dropdown-item item-anchor">
                                                Womens
                                            </a>
                                        </li>
                                        <li>
                                            <a href="#" class="dropdown-item item-anchor">
                                                Shop All
                                            </a>
                                        </li>
                                    </ul>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link text-danger" href="about.html">Sale</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="about.html">About</a>
                                </li>
                                <li class="nav-item">
                                    <a class="nav-link" href="contact.html">Contact</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="col-auto">
                    <ul class="list-unstyled d-flex justify-content-end align-items-center mb-0">
                        <li class="search-box mx-2">
                            <a class="search-button c-pointer">
                                <i class="bi bi-search" style="font-size: 20px;"></i>
                            </a>
                        </li>
                        <li>
                            <a href="wishlist.html" class="text-uppercase d-flex mx-2" data-bs-toggle="tooltip" data-bs-placement="bottom"
                                data-bs-title="wishlist">
                                <i class="bi bi-heart" style="font-size: 20px;"></i>
                                <span class="wishlist-count m-auto"></span>
                            </a>
                        </li>
                        <li>
                            <a href="cart.html" class="text-uppercase mx-2 me-4" data-bs-toggle="offcanvas" data-bs-target="#offcanvasCart"
                                aria-controls="offcanvasCart">
                                <i class="bi bi-bag" style="font-size: 20px;"  
                                    data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="cart">
                                </i>
                            </a>
                        </li>
                        <li>
                            <a href="my-account.html" class="ms-2">
                                <i class="bi bi-person-circle" style="font-size: 22px;"></i>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>
        `;
    }
}
customElements.define('header-component', Header);
