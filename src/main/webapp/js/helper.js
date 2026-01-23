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

