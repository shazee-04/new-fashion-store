const Auth = {
    getUser() {
        try {
            const user = sessionStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch (e) {
            return null;
        }
    },

    isLoggedIn() {
        return !!this.getUser();
    },

    login(userData) {
        sessionStorage.setItem('user', JSON.stringify(userData));
        window.dispatchEvent(new Event('userChanged'));
    },

    logout() {
        fetch('api/logout', { method: 'POST' })
            .finally(() => {
                sessionStorage.removeItem('user');
                window.dispatchEvent(new Event('userChanged'));
                redirectToast("Logging out!", "login.html", 1000, true);
            })
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
        }
    }
};