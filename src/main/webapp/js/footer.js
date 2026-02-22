class Footer extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
    <section class="instagram py-5">
        <div class="container">
            <div class="row g-3">
                <h6 class="element-title text-center">Follow us on Instagram</h6>
                <div class="col-6 col-sm-4 col-md-2">
                    <div class="insta-item">
                        <a href="https://www.instagram.com/" target="_blank">
                            <img src="assets/images/insta-item1.jpg" alt="instagram" class="insta-image img-fluid">
                        </a>
                    </div>
                </div>
                <div class="col-6 col-sm-4 col-md-2">
                    <div class="insta-item">
                        <a href="https://www.instagram.com/" target="_blank">
                            <img src="assets/images/insta-item2.jpg" alt="instagram" class="insta-image img-fluid">
                        </a>
                    </div>
                </div>
                <div class="col-6 col-sm-4 col-md-2">
                    <div class="insta-item">
                        <a href="https://www.instagram.com/" target="_blank">
                            <img src="assets/images/insta-item3.jpg" alt="instagram" class="insta-image img-fluid">
                        </a>
                    </div>
                </div>
                <div class="col-6 col-sm-4 col-md-2">
                    <div class="insta-item">
                        <a href="https://www.instagram.com/" target="_blank">
                            <img src="assets/images/insta-item4.jpg" alt="instagram" class="insta-image img-fluid">
                        </a>
                    </div>
                </div>
                <div class="col-6 col-sm-4 col-md-2">
                    <div class="insta-item">
                        <a href="https://www.instagram.com/" target="_blank">
                            <img src="assets/images/insta-item5.jpg" alt="instagram" class="insta-image img-fluid">
                        </a>
                    </div>
                </div>
                <div class="col-6 col-sm-4 col-md-2">
                    <div class="insta-item">
                        <a href="https://www.instagram.com/" target="_blank">
                            <img src="assets/images/insta-item6.jpg" alt="instagram" class="insta-image img-fluid">
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <footer id="footer" class="mt-5">
        <div class="container">
            <div class="row d-flex flex-wrap justify-content-between py-5">
                <div class="col-md-3 col-sm-6">
                    <div class="footer-menu footer-menu-001">
                        <div class="footer-intro mb-4">
                            <a href="index.html">
<!--                                <img src="assets/images/main-logo.png" alt="logo">-->
                                <h5 class="widget-title text-uppercase mb-4">New Fashion</h5>
                            </a>
                        </div>
                        <p class="pe-3">
                            Lorem ipsum dolor, sit amet consectetur adipisicing elit. Nulla iure corrupti accusamus
                            similique ex. Pariatur ab numquam consectetur est repudiandae. Lorem, ipsum.
                        </p>
                        <div class="social-links">
                            <ul class="list-unstyled d-flex flex-wrap gap-3">
                                <li>
                                    <a href="#" class="text-secondary">
                                        <i class="bi bi-facebook" style="font-size: 21px;"></i>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="text-secondary">
                                        <i class="bi bi-instagram" style="font-size: 21px;"></i>
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="text-secondary">
                                        <i class="bi bi-whatsapp" style="font-size: 21px;"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="footer-menu footer-menu-002">
                        <h5 class="widget-title text-uppercase mb-4">Quick Links</h5>
                        <ul class="menu-list list-unstyled text-uppercase border-animation-left fs-6">
                            <li class="menu-item">
                                <a href="index.html" class="item-anchor">Home</a>
                            </li>
                            <li class="menu-item">
                                <a href="about.html" class="item-anchor">About</a>
                            </li>
                            <li class="menu-item">
                                <a href="services.html" class="item-anchor">Services</a>
                            </li>
                            <li class="menu-item">
                                <a href="cart.html" class="item-anchor">Cart</a>
                            </li>
                            <li class="menu-item">
                                <a href="wishlist.html" class="item-anchor">Wishlist</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="footer-menu footer-menu-003">
                        <h5 class="widget-title text-uppercase mb-4">Help & Info</h5>
                        <ul class="menu-list list-unstyled text-uppercase border-animation-left fs-6">
                            <li class="menu-item">
                                <a href="#" class="item-anchor">Track Your Order</a>
                            </li>
                            <li class="menu-item">
                                <a href="#" class="item-anchor">Returns + Exchanges</a>
                            </li>
                            <li class="menu-item">
                                <a href="#" class="item-anchor">Shipping + Delivery</a>
                            </li>
                            <li class="menu-item">
                                <a href="contact.html" class="item-anchor">Contact Us</a>
                            </li>
                            <li class="menu-item">
                                <a href="#" class="item-anchor">Find us easy</a>
                            </li>
                            <li class="menu-item">
                                <a href="faqs.html" class="item-anchor">Faqs</a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="col-md-3 col-sm-6">
                    <div class="footer-menu footer-menu-004 border-animation-left">
                        <h5 class="widget-title text-uppercase mb-4">More</h5>
                        <p>Do you have any questions or suggestions?
                            <a href="mailto:" class="item-anchor">contact@newfashionstore.com</a>
                        </p>
                        <p>Do you need support? Give us a call.
                            <a href="tel:" class="item-anchor">
                                +941 987 6543
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
        <div class="border-top py-4">
            <div class="container">
                <div class="row">
                    <div class="col-md-6 d-flex flex-wrap">
                        <div class="shipping me-4">
                            <span>Delivery partners:</span>
                            <img src="assets/images/arct-icon.png" alt="icon">
                            <img src="assets/images/dhl-logo.png" alt="icon">
                        </div>
                        <div class="payment-option">
                            <span>Payment options:</span>
                            <img src="assets/images/visa-card.png" alt="card">
                            <img src="assets/images/paypal-card.png" alt="card">
                            <img src="assets/images/master-card.png" alt="card">
                        </div>
                    </div>
                    <div class="col-md-6 text-end">
                        <p>
                            © Copyright 2026 NewFashionStore. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </footer>
        `;
    }
}

customElements.define('footer-component', Footer);
        