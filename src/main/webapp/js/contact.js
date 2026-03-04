document.getElementById('contactForm').addEventListener('submit', async (e) => {
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


