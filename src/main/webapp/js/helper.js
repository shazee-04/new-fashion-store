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

