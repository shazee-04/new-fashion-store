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
        sessionStorage.removeItem('user');
        window.dispatchEvent(new Event('userChanged'));
    },

    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = '/login.html';
        }
    }
};