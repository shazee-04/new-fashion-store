document.addEventListener('DOMContentLoaded', () => {
    const user = sessionStorage.getItem("user");
    if (user && user !== "undefined") {
        window.location.href = "index.html";
        return;
    }

    const emailCookie = getCookie("email");
    if (emailCookie) {
        document.getElementById('email').value = decodeURIComponent(emailCookie);
        document.getElementById('rememberMe').checked = true;
    }

    document.getElementById('login-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        loginUser();
    });
});

async function loginUser() {
    clearErrors();

    const loadingToast = getLoadingToast("Logging you in...");
    loadingToast?.showToast();
    document.getElementById('loginBtn').disabled = true;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const rememberMe = document.getElementById('rememberMe').checked;

    const data = {
        email: email,
        password: password
    };

    try {
        const response = await fetch('api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })

        const result = await response.json();

        if (response.ok && result.success) {
            if (result.data) {
                sessionStorage.setItem("user", JSON.stringify(result.data));
            }
            if (rememberMe) {
                const date = new Date();
                date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
                let expires = "expires=" + date.toUTCString();
                document.cookie = `email=${encodeURIComponent(result.data.email)};${expires};path=/`;
            } else {
                document.cookie = "email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            }

            redirectToast(result.message, "index.html", 1000, true);
        } else {
            const errorText = result.message || "";

            const errors = errorText.includes(",") ? errorText.split(",") : [errorText];

            errors.forEach(err => {
                const msg = err.toLowerCase();

                if (msg.includes("email")) showErrorWithField('emailError', 'email', err);
                if (msg.includes("password")) showErrorWithField('passwordError', 'password', err);
            });

            showToast("Login failed. Please try again.", false);
            console.log(errors);
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast("Server connection failed! Please try again.", false);
    } finally {
        document.getElementById('loginBtn').disabled = false;
        loadingToast.hideToast();
    }
}