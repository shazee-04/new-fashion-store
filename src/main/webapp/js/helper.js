// Toast notifications
function showToast(message, isSuccess) {
    Toastify({
        text: message,
        duration: 2000,
        gravity: "bottom",
        position: "right",
        style: {
            background: isSuccess ? "#2ecc71" : "#e74c3c",
        }
    }).showToast();
}

// Loading toast
function getLoadingToast(message) {
    return Toastify({
        text: `<div class="toast-loader"></div>` + message,
        duration: -1,
        close: false,
        gravity: "bottom",
        position: "right",
        stopOnFocus: true,
        escapeMarkup: false,
        style: {
            background: "#333",
            color: "#fff",
            display: "flex",
            alignItems: "center"
        }
    });
}

// Redirect with toast notification
function redirectToast(message, url, delay = 1000, isSuccess = true) {
    Toastify({
        text: message,
        duration: delay,
        gravity: "bottom",
        position: "right",
        style: {
            background: isSuccess ? "#2ecc71" : "#e74c3c",
        },
        callback: function () {
            window.location.href = url;
        }
    }).showToast();
}

// Display error messages for form fields
function showError(spanId, message) {
    const spanElement = document.getElementById(spanId);
    if (spanElement) {
        spanElement.innerText = message;
    }
}

// Display error messages for form fields
function showErrorWithField(spanId, fieldId, message) {
    const spanElement = document.getElementById(spanId);
    const fieldElement = document.getElementById(fieldId);
    if (spanElement) {
        spanElement.innerText = message;
    }
    if (fieldElement) {
        fieldElement.classList.add('invalid-input');
    }
}

// Clear error messages
function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.innerText = '');
    document.querySelectorAll('.invalid-input').forEach(el => el.classList.remove('invalid-input'));
}

// Get cookie value by name
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let cookie of cookies) {
        const [key, value] = cookie.split('=');
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
}

// Update browser URL with filters
function updateBrowserURL({
    page,
    searchText,
    categories,
    brands,
    minPrice,
    maxPrice
}) {
    const params = new URLSearchParams();

    if (page > 0) params.set('page', page);
    if (searchText) params.set('query', searchText);
    if (categories) params.set('category', categories);
    if (brands) params.set('brand', brands);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    // if (sort) params.set('sort', sort);

    const newUrl = `${window.location.pathname}` + (params.toString() ? `?${params.toString()}` : '');

    window.history.pushState({}, '', newUrl);
}
