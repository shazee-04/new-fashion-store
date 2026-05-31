document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('order-tracking-form');
    const orderIdInput = document.getElementById('orderIdInput');
    const orderEmailInput = document.getElementById('orderEmailInput');

    const params = new URLSearchParams(window.location.search);
    const prefillOrderId = params.get('orderId');
    const prefillEmail = params.get('email');

    if (prefillOrderId && orderIdInput) {
        orderIdInput.value = prefillOrderId;
    }

    if (prefillEmail && orderEmailInput) {
        orderEmailInput.value = prefillEmail;
    }

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        await handleTrackOrder();
    });
});

async function handleTrackOrder() {
    const orderId = String(document.getElementById('orderIdInput')?.value || '').trim();
    const email = String(document.getElementById('orderEmailInput')?.value || '').trim();

    if (!orderId || !email) {
        showToast('Please provide your order ID and billing email.', false);
        return;
    }

    const button = document.getElementById('trackOrderBtn');
    if (button) {
        button.disabled = true;
        button.textContent = 'Tracking...';
    }

    try {
        const result = await requestJson('api/order-tracking/track', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                orderId: orderId,
                email: email
            })
        });

        if (!result.success) {
            showToast(result.message || 'Order not found.', false);
            renderEmptyState();
            return;
        }

        renderOrderDetails(result.data || {});
    } catch (error) {
        console.error('Track order error:', error);
        showToast('Server connection failed! Please try again.', false);
        renderEmptyState();
    } finally {
        if (button) {
            button.disabled = false;
            button.textContent = 'Track';
        }
    }
}

function renderOrderDetails(order) {
    const resultWrap = document.getElementById('orderTrackingResult');
    const emptyWrap = document.getElementById('orderTrackingEmpty');
    const itemsWrap = document.getElementById('orderItems');

    if (!resultWrap || !itemsWrap) return;

    document.getElementById('orderCode').textContent = order?.orderCode || 'Order';
    document.getElementById('orderDate').textContent = formatOrderDate(order?.orderDate);
    document.getElementById('orderStatus').textContent = order?.status || 'Pending';
    document.getElementById('orderTotal').textContent = formatCurrency(order?.totalAmount || 0);

    const billing = order?.billingAddress || {};
    document.getElementById('orderBilling').innerHTML = [
        escapeHtml(`${billing.firstName || ''} ${billing.lastName || ''}`.trim()),
        escapeHtml(billing.email || ''),
        escapeHtml(billing.mobile || ''),
        escapeHtml([billing.lineOne, billing.lineTwo].filter(Boolean).join(', ')),
        escapeHtml([billing.city, billing.postalCode].filter(Boolean).join(', '))
    ].filter(Boolean).join('<br>');

    document.getElementById('orderPayment').innerHTML = [
        escapeHtml(order?.paymentMethod || '—'),
        order?.orderNotes ? `Notes: ${escapeHtml(order.orderNotes)}` : ''
    ].filter(Boolean).join('<br>');

    const items = Array.isArray(order?.items) ? order.items : [];
    itemsWrap.innerHTML = items.map(item => {
        const title = escapeHtml(item?.title || 'Item');
        const image = escapeHtml(item?.imagePath || 'assets/images/product-placeholder.jpg');
        const qty = Number(item?.qty || 0);
        const unitPrice = formatCurrency(item?.unitPrice || 0);
        const totalPrice = formatCurrency(item?.totalPrice || 0);
        const color = escapeHtml(item?.color || '-');
        const size = escapeHtml(item?.size || '-');

        return `
			<div class="d-flex flex-wrap gap-3 align-items-center border-bottom py-3">
				<img src="${image}" alt="${title}" class="border" style="width: 72px; height: 72px; object-fit: cover;" onerror="this.onerror=null;this.src='assets/images/product-placeholder.jpg';">
				<div class="flex-grow-1">
					<div class="text-uppercase fw-semibold">${title}</div>
					<div class="text-muted small">Color: ${color} · Size: ${size}</div>
					<div class="text-muted small">Qty: ${qty} · Unit: ${unitPrice}</div>
				</div>
				<div class="text-end fw-semibold">${totalPrice}</div>
			</div>
		`;
    }).join('') || '<div class="text-muted small">No items found.</div>';

    resultWrap.classList.remove('d-none');
    emptyWrap?.classList.add('d-none');
}

function renderEmptyState() {
    const resultWrap = document.getElementById('orderTrackingResult');
    const emptyWrap = document.getElementById('orderTrackingEmpty');
    resultWrap?.classList.add('d-none');
    emptyWrap?.classList.remove('d-none');
}

function formatOrderDate(value) {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
    });
}

function formatCurrency(value) {
    return `LKR ${Number(value || 0).toFixed(2)}`;
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function requestJson(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const payload = await readJsonSafely(response);

        return {
            ...payload,
            success: Boolean(response.ok && payload?.success),
            status: response.status,
            message: payload?.message || (response.ok ? '' : 'Request failed.')
        };
    } catch (error) {
        console.error(`Request failed (${url}):`, error);
        return {
            success: false,
            status: 0,
            message: 'Server connection failed! Please try again.'
        };
    }
}

async function readJsonSafely(response) {
    try {
        const raw = await response.text();
        if (!raw) return {};
        return JSON.parse(raw);
    } catch {
        return {};
    }
}
