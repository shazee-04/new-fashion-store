// User Management Script

let accountsList = [];
let subscribersList = [];

document.addEventListener('DOMContentLoaded', () => {
    loadAccounts();
    loadSubscribers();
    setupEventListeners();
});

async function loadAccounts() {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4"><div class="spinner-border spinner-border-sm text-dark" role="status"></div></td></tr>`;

    try {
        const response = await fetch('../api/admin/dashboard/users/list');
        const result = await response.json();

        if (response.ok && result.success) {
            accountsList = result.data || [];
            renderAccountsTable(accountsList);
        } else {
            tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Failed to load accounts: ${result.message}</td></tr>`;
        }
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-danger py-4">Error connecting to server.</td></tr>`;
    }
}

function renderAccountsTable(accounts) {
    const tableBody = document.getElementById('users-table-body');
    if (!accounts || accounts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No accounts found.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById('user-search-input').value.toLowerCase().trim();
    const roleVal = document.getElementById('filter-user-role').value;
    const statusVal = document.getElementById('filter-user-status').value;

    let filtered = accounts.filter(u => {
        const matchesSearch = u.firstName.toLowerCase().includes(searchVal) || u.lastName.toLowerCase().includes(searchVal) || u.email.toLowerCase().includes(searchVal);
        const matchesRole = !roleVal || u.userType === roleVal;
        const matchesStatus = !statusVal || u.statusId == statusVal;
        return matchesSearch && matchesRole && matchesStatus;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted py-4">No matching accounts found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    filtered.forEach(u => {
        const actionText = u.statusId === 1 ? 'Suspend' : 'Activate';
        const targetStatusId = u.statusId === 1 ? 2 : 1;
        const actionBtnClass = u.statusId === 1 ? 'btn-outline-danger' : 'btn-outline-success';
        const isSelf = isCurrentUser(u.email);

        tableBody.innerHTML += `
        <tr>
            <td>${u.id}</td>
            <td><span class="fw-semibold text-dark">${u.firstName} ${u.lastName}</span></td>
            <td>${u.email}</td>
            <td>${u.mobile}</td>
            <td><span class="badge bg-secondary text-uppercase py-1 rounded-0" style="font-size:0.65rem;">${u.userType}</span></td>
            <td>${u.isVerified ? '<span class="text-success"><i class="bi bi-patch-check-fill"></i></span>' : '<span class="text-muted"><i class="bi bi-x-circle"></i></span>'}</td>
            <td>${getStatusBadge(u.statusName)}</td>
            <td>${u.registeredDate}</td>
            <td>
                <button class="btn btn-sm ${actionBtnClass}" ${isSelf ? 'disabled title="You cannot suspend yourself"' : ''}
                    onclick="toggleUserStatus(${u.id}, ${targetStatusId})">${actionText}</button>
            </td>
        </tr>
        `;
    });
}

function isCurrentUser(email) {
    try {
        const user = JSON.parse(sessionStorage.getItem('user'));
        return user && user.email === email;
    } catch (e) {
        return false;
    }
}

async function loadSubscribers() {
    const tableBody = document.getElementById('subscribers-table-body');
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-dark" role="status"></div></td></tr>`;

    try {
        const response = await fetch('../api/admin/dashboard/subscribers/list');
        const result = await response.json();

        if (response.ok && result.success) {
            subscribersList = result.data || [];
            renderSubscribersTable(subscribersList);
        } else {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">Failed to load subscribers: ${result.message}</td></tr>`;
        }
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger py-4">Error connecting to server.</td></tr>`;
    }
}

function renderSubscribersTable(subs) {
    const tableBody = document.getElementById('subscribers-table-body');
    if (!subs || subs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No subscribers found.</td></tr>`;
        return;
    }

    const searchVal = document.getElementById('subscriber-search-input').value.toLowerCase().trim();

    let filtered = subs.filter(s => s.email.toLowerCase().includes(searchVal));

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No matching subscribers found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    filtered.forEach(s => {
        tableBody.innerHTML += `
        <tr>
            <td>${s.id}</td>
            <td><span class="fw-semibold text-dark">${s.email}</span></td>
            <td>${getStatusBadge(s.statusName)}</td>
            <td>${s.dateSubscribed}</td>
        </tr>
        `;
    });
}

function setupEventListeners() {
    // Registered Accounts Filters
    document.getElementById('user-search-input')?.addEventListener('input', () => renderAccountsTable(accountsList));
    document.getElementById('filter-user-role')?.addEventListener('change', () => renderAccountsTable(accountsList));
    document.getElementById('filter-user-status')?.addEventListener('change', () => renderAccountsTable(accountsList));
    document.getElementById('reset-users-filter-btn')?.addEventListener('click', () => {
        document.getElementById('user-search-input').value = '';
        document.getElementById('filter-user-role').value = '';
        document.getElementById('filter-user-status').value = '';
        renderAccountsTable(accountsList);
    });

    // Mailing List Filters
    document.getElementById('subscriber-search-input')?.addEventListener('input', () => renderSubscribersTable(subscribersList));
    document.getElementById('reset-subs-filter-btn')?.addEventListener('click', () => {
        document.getElementById('subscriber-search-input').value = '';
        renderSubscribersTable(subscribersList);
    });
}

async function toggleUserStatus(userId, targetStatusId) {
    const confirmation = await confirmUserToggle();
    if (!confirmation) return;

    const loading = getLoadingToast("Updating user status...");
    loading.showToast();

    try {
        const response = await fetch('../api/admin/dashboard/users/update-status', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                userId: userId,
                statusId: targetStatusId
            })
        });

        const result = await response.json();
        loading.hideToast();

        if (response.ok && result.success) {
            showToast("User status updated successfully!", true);
            loadAccounts();
        } else {
            showToast("Failed to update status: " + result.message, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Error updating status.", false);
    }
}

function confirmUserToggle() {
    return new Promise(resolve => {
        const modal = document.createElement("div");
        modal.classList.add("modal", "fade");
        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-0">
              <div class="modal-header py-2 px-3">
                <span class="modal-title text-dark fs-5 mt-2">Confirm Action</span>
              </div>
              <div class="modal-body text-muted py-4 px-3">
                Are you sure you want to change this user account status? Suspended users will not be allowed to log in.
              </div>
              <div class="modal-footer py-2 px-3">
                <button id="noBtn" class="btn btn-light px-4">Cancel</button>
                <button id="yesBtn" class="btn btn-dark px-4">Confirm</button>
              </div>
            </div>
        </div>`;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();

        modal.querySelector("#noBtn").onclick = () => {
            resolve(false);
            bsModal.hide();
            modal.remove();
        };
        modal.querySelector("#yesBtn").onclick = () => {
            resolve(true);
            bsModal.hide();
            modal.remove();
        };
    });
}
