// Orders Management Script

let ordersList = [];
let orderDetailModal;
let currentViewingOrderId = null;

document.addEventListener('DOMContentLoaded', () => {
    orderDetailModal = new bootstrap.Modal(document.getElementById('orderDetailModal'));

    loadOrders();
    setupEventListeners();
});

async function loadOrders() {
    const tableBody = document.getElementById('orders-table-body');
    tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-4"><div class="spinner-border spinner-border-sm text-dark" role="status"></div></td></tr>`;

    try {
        const response = await fetch('../api/admin/orders/list');
        const result = await response.json();

        if (response.ok && result.success) {
            ordersList = result.data || [];
            renderOrdersTable(ordersList);
        } else {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Failed to load orders: ${result.message}</td></tr>`;
        }
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-4">Error connecting to server.</td></tr>`;
    }
}

function renderOrdersTable(orders) {
    const tableBody = document.getElementById('orders-table-body');
    if (!orders || orders.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No orders found.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById('order-search-input').value.toLowerCase().trim();
    const statusVal = document.getElementById('filter-order-status').value;

    let filtered = orders.filter(o => {
        const matchesSearch = o.orderCode.toLowerCase().includes(searchVal) || o.email.toLowerCase().includes(searchVal) || o.customerName.toLowerCase().includes(searchVal);
        const matchesStatus = !statusVal || o.statusId == statusVal;
        return matchesSearch && matchesStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No matching orders found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    filtered.forEach(o => {
        tableBody.innerHTML += `
        <tr>
            <td><span class="fw-semibold text-dark">${o.orderCode}</span></td>
            <td>${o.customerName}</td>
            <td>${o.email}</td>
            <td>${formatLkr(o.totalAmount)}</td>
            <td>${o.paymentMethod}</td>
            <td>${getStatusBadge(o.statusName)}</td>
            <td>${o.orderDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-dark" onclick="viewOrderDetails(${o.id})">Details</button>
            </td>
        </tr>
        `;
    });
}

function setupEventListeners() {
    document.getElementById('order-search-input')?.addEventListener('input', () => renderOrdersTable(ordersList));
    document.getElementById('filter-order-status')?.addEventListener('change', () => renderOrdersTable(ordersList));
    document.getElementById('reset-orders-filter-btn')?.addEventListener('click', () => {
        document.getElementById('order-search-input').value = '';
        document.getElementById('filter-order-status').value = '';
        renderOrdersTable(ordersList);
    });

    // Update status trigger inside modal
    document.getElementById('update-status-submit')?.addEventListener('click', updateOrderStatus);
}

async function viewOrderDetails(id) {
    currentViewingOrderId = id;
    const loading = getLoadingToast("Loading order details...");
    loading.showToast();

    try {
        const response = await fetch(`../api/admin/orders/detail?id=${id}`);
        const result = await response.json();

        loading.hideToast();
        if (response.ok && result.success) {
            const data = result.data;

            document.getElementById('orderDetailModalLabel').textContent = "Order Details - " + data.orderCode;

            // Populating customer information
            document.getElementById('detail-cust-name').textContent = data.customer.name;
            document.getElementById('detail-cust-email').textContent = data.customer.email;
            document.getElementById('detail-cust-mobile').textContent = data.customer.mobile;

            // Populating delivery address
            document.getElementById('detail-shipping-line1').textContent = data.address.line1;
            document.getElementById('detail-shipping-line2').textContent = data.address.line2 || '';
            document.getElementById('detail-shipping-city').textContent = data.address.city;
            document.getElementById('detail-shipping-postal').textContent = data.address.postalCode || '';

            // Meta Info
            document.getElementById('detail-order-date').textContent = data.orderDate;
            document.getElementById('detail-payment-method').textContent = data.paymentMethod;
            document.getElementById('detail-order-status').innerHTML = getStatusBadge(data.statusName);
            document.getElementById('update-order-status-select').value = data.statusId;

            // Notes
            const notesEl = document.getElementById('detail-order-notes');
            if (data.orderNotes && data.orderNotes.trim() !== '') {
                notesEl.textContent = data.orderNotes;
                notesEl.classList.remove('text-muted');
            } else {
                notesEl.textContent = 'No customer notes provided.';
                notesEl.classList.add('text-muted');
            }

            // Items
            const itemsBody = document.getElementById('detail-items-body');
            itemsBody.innerHTML = '';

            data.items.forEach(item => {
                itemsBody.innerHTML += `
                <tr>
                    <td><span class="fw-semibold text-dark">${item.productTitle}</span></td>
                    <td><small class="text-muted">Color: ${item.color}, Size: ${item.size}</small></td>
                    <td>${item.qty}</td>
                    <td>${formatLkr(item.unitPrice)}</td>
                    <td>${formatLkr(item.totalPrice)}</td>
                </tr>
                `;
            });

            document.getElementById('detail-net-total').textContent = formatLkr(data.totalAmount);

            orderDetailModal.show();
        } else {
            showToast("Failed to load order: " + result.message, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Error retrieving order details.", false);
    }
}

async function updateOrderStatus() {
    if (!currentViewingOrderId) return;

    const select = document.getElementById('update-order-status-select');
    const newStatusId = parseInt(select.value);

    const loading = getLoadingToast("Updating order status...");
    loading.showToast();

    try {
        const response = await fetch('../api/admin/orders/update-status', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                orderId: currentViewingOrderId,
                statusId: newStatusId
            })
        });

        const result = await response.json();
        loading.hideToast();

        if (response.ok && result.success) {
            showToast("Order status updated successfully!", true);
            orderDetailModal.hide();
            loadOrders();
        } else {
            showToast("Failed to update status: " + result.message, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Server connection error during status update.", false);
    }
}
