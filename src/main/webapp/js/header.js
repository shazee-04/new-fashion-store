class Header extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
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
                            <a href="" class="search-button">
                                <i class="bi bi-search" style="font-size: 20px;"></i>
                            </a>
                        </li>
                        <li>
                            <a href="wishlist.html" class="text-uppercase d-flex mx-2 me-4">
                                <i class="bi bi-heart" style="font-size: 20px;"></i>
                                <span class="wishlist-count m-auto"></span>
                            </a>
                        </li>
                        <li>
                            <a href="my-account.html#like" class="ms-2">
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
