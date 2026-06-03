const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('contactFormBtn').disabled = true;

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const tele = document.getElementById('tele').value.trim();
    const subject = document.getElementById('subject').value.trim();
    const content = document.getElementById('message').value.trim();

    if (email && content) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address!', false);
            document.getElementById('contactFormBtn').disabled = false;
            return;
        }
    } else {
        showToast('Please fill required fields!', false);
        document.getElementById('contactFormBtn').disabled = false;
        return;
    }

    if (tele) {
        if (!/^\+?[0-9\s\-()]{7,}$/.test(tele)) {
            showToast('Please enter a valid telephone number!', false);
            document.getElementById('contactFormBtn').disabled = false;
            return;
        }
    }

    const contactData = {name: name, email: email, tele: tele, subject: subject, content: content};

    try {
        const response = await fetch('api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            showToast(result.message || 'Inquiry sent successfully!', true);
            document.getElementById('contactForm').reset();
        } else {
            showToast(result.message || 'Failed to send inquiry!', false);
        }
    } catch (error) {
        console.error('Contact form submission error:', error);
        showToast('Server connection failed! Please try again.', false);
    } finally {
        document.getElementById('contactFormBtn').disabled = false;
    }
    });
}

const newsletterForm = document.getElementById('newsletterForm');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('newsletterFormBtn').disabled = true;

    const email = document.getElementById('newsletterEmail').value.trim();
    if (email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showToast('Please enter a valid email address!', false);
            document.getElementById('newsletterFormBtn').disabled = true;
            return;
        }
    }
    try {
        const response = await fetch('api/contact/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({email: email})
        })
        const result = await response.json();
        if (response.ok && result.success) {
            showToast(result.message || 'Subscribed to newsletter!', true);
            document.getElementById('newsletterForm').reset();
        } else {
            showToast(result.message || 'Failed to subscribe to newsletter!', false);
        }
    } catch (error) {
        console.error('Newsletter subscription error:', error);
        showToast('Server connection failed! Please try again.', false);
    } finally {
        document.getElementById('newsletterFormBtn').disabled = false;
    }
    })
}

const unsubscribeForm = document.getElementById('unsubscribeForm');
if (unsubscribeForm) {
    const tokenHint = document.getElementById('tokenHint');
    const searchParams = new URLSearchParams(window.location.search);
    let token = searchParams.get('token');
    if (!token && window.location.search && window.location.search.length > 1) {
        const rawQuery = window.location.search.substring(1);
        token = rawQuery.includes('=') ? token : rawQuery;
    }

    if (tokenHint) {
        tokenHint.textContent = token
            ? 'Click confirm to unsubscribe this email address from our newsletter.'
            : 'Missing token. Please use the link from your newsletter email.';
    }

    unsubscribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const button = document.getElementById('unsubscribeBtn');
        button.disabled = true;

        if (!token) {
            showToast('Missing token. Please use the link from your newsletter email.', false);
            button.disabled = false;
            return;
        }

        try {
            const response = await fetch('api/contact/newsletter/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({token: token})
            });

            const result = await response.json();
            if (response.ok && result.success) {
                showToast(result.message || 'Unsubscribed from newsletter successfully!', true);
                document.getElementById('unsubscribeForm').reset();
            } else {
                showToast(result.message || 'Failed to unsubscribe from newsletter!', false);
            }
        } catch (error) {
            console.error('Newsletter unsubscription error:', error);
            showToast('Server connection failed! Please try again.', false);
        } finally {
            button.disabled = false;
        }
    });
}


