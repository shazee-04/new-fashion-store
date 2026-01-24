document.getElementById('login-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    await loginUser();
})

async function loginUser() {
    clearErrors();

    const loadingToast = getLoadingToast("Logging you in...").showToast();
    document.getElementById('loginBtn').disabled = true;

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

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
            showToast(result.message, true);

            sessionStorage.setItem("user", JSON.stringify(result.data));

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
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