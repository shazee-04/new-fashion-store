// Shared JavaScript for Admin Dashboard

// 1. Immediately check Admin Authorization
(async function checkAdminAuth() {
    const userSession = sessionStorage.getItem('user');
    if (!userSession) {
        window.location.href = '../login.html';
        return;
    }

    try {
        // Double-check with backend to ensure the user is an authorized admin
        const response = await fetch('../api/admin/dashboard/stats');
        if (response.status === 401 || response.status === 403) {
            sessionStorage.removeItem('user');
            window.location.href = '../login.html';
        }
    } catch (e) {
        console.error("Auth check failed:", e);
    }
})();

// 2. Define Sidebar Custom Element
class AdminSidebar extends HTMLElement {
    connectedCallback() {
        const currentPath = window.location.pathname;
        const activeClass = (page) => currentPath.includes(page) ? 'active' : '';

        this.innerHTML = `
        <div class="sidebar-brand">
            <h4 class="m-0 text-white fs-4">New Fashion</h4>
            <span class="fs-8 text-muted">Admin Panel</span>
        </div>
        <ul class="sidebar-menu">
            <li class="${activeClass('dashboard.html')}">
                <a href="dashboard.html"><i class="bi bi-speedometer2"></i> Dashboard</a>
            </li>
            <li class="${activeClass('products.html')}">
                <a href="products.html"><i class="bi bi-box-seam"></i> Products</a>
            </li>
            <li class="${activeClass('orders.html')}">
                <a href="orders.html"><i class="bi bi-receipt"></i> Orders</a>
            </li>
            <li class="${activeClass('users.html')}">
                <a href="users.html"><i class="bi bi-people"></i> Customers</a>
            </li>
            <li class="${activeClass('banners.html')}">
                <a href="banners.html"><i class="bi bi-image"></i> Banners</a>
            </li>
            <li class="${activeClass('attributes.html')}">
                <a href="attributes.html"><i class="bi bi-sliders"></i> Attributes</a>
            </li>
            <li class="mt-5">
                <a href="../index.html"><i class="bi bi-shop"></i> View Shop</a>
            </li>
            <li>
                <a href="#" id="admin-logout-btn" class="text-danger"><i class="bi bi-box-arrow-right"></i> Logout</a>
            </li>
        </ul>
        `;

        // Bind logout action
        this.querySelector('#admin-logout-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            logoutAdmin();
        });
    }
}

customElements.define('admin-sidebar', AdminSidebar);

// 3. Define Navbar Custom Element
class AdminNavbar extends HTMLElement {
    connectedCallback() {
        const title = this.getAttribute('title') || 'Dashboard';
        let userFullName = 'Admin User';
        try {
            const user = JSON.parse(sessionStorage.getItem('user'));
            if (user) {
                userFullName = user.firstName + ' ' + user.lastName;
            }
        } catch (e) {
        }

        this.innerHTML = `
        <div class="admin-navbar d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
                <button class="btn btn-light d-lg-none me-3 shadow-none border-0" id="sidebar-toggle-btn">
                    <i class="bi bi-list fs-4"></i>
                </button>
                <h3 class="m-0 fs-4 text-uppercase">${title}</h3>
            </div>
            
            <div class="dropdown">
                <button class="btn btn-light dropdown-toggle border-0 d-flex align-items-center gap-2" type="button" id="userMenuBtn" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-person-circle fs-5"></i>
                    <span class="d-none d-md-inline">${userFullName}</span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end rounded-0 shadow-sm" aria-labelledby="userMenuBtn">
                    <li><a class="dropdown-item py-2" href="../my-account.html"><i class="bi bi-person me-2"></i> Profile</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item py-2 text-danger" href="#" id="admin-navbar-logout"><i class="bi bi-box-arrow-right me-2"></i> Logout</a></li>
                </ul>
            </div>
        </div>
        `;

        // Mobile sidebar toggle handler
        this.querySelector('#sidebar-toggle-btn')?.addEventListener('click', () => {
            const sidebar = document.getElementById('admin-sidebar-container');
            sidebar?.classList.toggle('show');
        });

        // Logout
        this.querySelector('#admin-navbar-logout')?.addEventListener('click', (e) => {
            e.preventDefault();
            logoutAdmin();
        });
    }
}

customElements.define('admin-navbar', AdminNavbar);

// 4. Logout Helper
function logoutAdmin() {
    fetch('../api/logout', {method: 'POST'})
        .finally(() => {
            sessionStorage.removeItem('user');
            window.location.href = '../login.html';
        });
}

// 5. Shared UI Utilities
function formatLkr(value) {
    const amount = Number(value) || 0;
    return `LKR ${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function getStatusBadge(status) {
    const st = (status || '').toLowerCase();
    let badgeClass = 'badge-status';

    if (st === 'active' || st === 'completed' || st === 'delivered' || st === 'verified') {
        badgeClass += ' active';
    } else if (st === 'inactive' || st === 'suspended' || st === 'cancelled') {
        badgeClass += ' suspended';
    } else if (st === 'pending') {
        badgeClass += ' pending';
    } else if (st === 'shipped') {
        badgeClass += ' shipped';
    } else {
        badgeClass += ' cancelled';
    }

    return `<span class="${badgeClass}">${status}</span>`;
}

// Toast Notification
function showToast(message, isSuccess) {
    if (typeof Toastify === "function") {
        Toastify({
            text: message,
            duration: 2000,
            gravity: "bottom",
            position: "right",
            style: {
                background: isSuccess ? "#2ecc71" : "#e74c3c",
            }
        }).showToast();
    } else {
        alert(message);
    }
}

// Loading Toast
function getLoadingToast(message) {
    if (typeof Toastify === "function") {
        return Toastify({
            text: `<div class="toast-loader" style="border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; width: 12px; height: 12px; display: inline-block; animation: spin 1s linear infinite; margin-right: 10px;"></div>` + message,
            duration: -1,
            close: false,
            gravity: "bottom",
            position: "right",
            escapeMarkup: false,
            style: {
                background: "#333",
                color: "#fff",
                display: "flex",
                alignItems: "center"
            }
        });
    }
    return {
        showToast: () => console.log(message), hideToast: () => {
        }
    };
}
