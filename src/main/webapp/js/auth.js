document.getElementById('register-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    await submitRegistration();
});

async function submitRegistration() {
    clearErrors();

    const loadingToast = getLoadingToast("Creating your account.").showToast();
    document.getElementById('registerBtn').disabled = true;

    const data = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        mobile: document.getElementById('mobile').value
    };

    try {
        const response = await fetch('api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast(result.message, true);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            const errorText = result.message || "";

            const errors = errorText.includes(",") ? errorText.split(", ") : [errorText];

            errors.forEach(err => {
                const msg = err.toLowerCase();

                if (msg.includes("first name")) showErrorWithField('firstNameError', 'firstName', err);
                else if (msg.includes("last name")) showErrorWithField('lastNameError', 'lastName', err);
                else if (msg.includes("email")) showErrorWithField('emailError', 'email', err);
                else if (msg.includes("mobile")) showErrorWithField('mobileError', 'mobile', err);
                else if (msg.includes("password")) showErrorWithField('passwordError', 'password', err);
            });

            showToast("Registration failed. Please try again.", false);
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast("Server connection failed! Please try again.", false);
    } finally {
        document.getElementById('registerBtn').disabled = false;
        loadingToast.hideToast();
    }
}