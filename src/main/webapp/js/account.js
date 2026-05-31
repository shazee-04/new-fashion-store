const PROFILE_FIELD_IDS = [
    'accountFirstName',
    'accountLastName',
    'accountEmail',
    'accountPhone',
    'accountPassword'
];

const accountState = {
    addresses: [],
    cities: [],
    orders: [],
    isEditingProfile: false,
    isSavingProfile: false,
    addressModal: null,
    editingAddressId: null
};

document.addEventListener('DOMContentLoaded', onAccountReady);

function onAccountReady() {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    bindAccountEvents();
    setProfileEditing(false);
    fillProfileFromSession();
    initializeAccount();
}

async function initializeAccount() {
    await Promise.all([
        loadProfileDetails(),
        loadAddresses(),
        loadOrders(),
        loadCities()
    ]);
}

function bindAccountEvents() {
    getEl('accountEditBtn')?.addEventListener('click', handleProfileEditClick);
    getEl('accountForm')?.addEventListener('submit', handleProfileSubmit);
    getEl('accountSignOutBtn')?.addEventListener('click', () => Auth.logout());
    getEl('addAddressBtn')?.addEventListener('click', () => openAddressModal());

    const addressList = getEl('addressList');
    addressList?.addEventListener('click', handleAddressActionClick);
}

function setProfileEditing(isEditing) {
    accountState.isEditingProfile = isEditing;
    PROFILE_FIELD_IDS.forEach(id => {
        const element = getEl(id);
        if (!element) return;
        if (id === 'accountPassword') {
            element.disabled = !isEditing;
            if (!isEditing) element.value = '';
            return;
        }
        element.disabled = !isEditing;
    });

    const editBtn = getEl('accountEditBtn');
    if (editBtn) {
        editBtn.textContent = isEditing ? 'Save' : 'Edit';
    }
}

function handleProfileEditClick() {
    if (accountState.isSavingProfile) return;

    if (accountState.isEditingProfile) {
        getEl('accountForm')?.requestSubmit();
        return;
    }

    setProfileEditing(true);
    getEl('accountFirstName')?.focus();
}

async function handleProfileSubmit(event) {
    event.preventDefault();
    if (!accountState.isEditingProfile || accountState.isSavingProfile) return;

    const form = getEl('accountForm');
    if (!form?.checkValidity()) {
        form?.classList.add('was-validated');
        showToast('Please complete the required profile fields.', false);
        return;
    }

    const payload = {
        firstName: String(getEl('accountFirstName')?.value || '').trim(),
        lastName: String(getEl('accountLastName')?.value || '').trim(),
        email: String(getEl('accountEmail')?.value || '').trim(),
        mobile: String(getEl('accountPhone')?.value || '').trim(),
        password: String(getEl('accountPassword')?.value || '').trim() || null
    };

    accountState.isSavingProfile = true;

    try {
        const result = await requestJson('api/profile/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (result.status === 401 || result.status === 403) {
            redirectToLogin();
            return;
        }

        if (!result.success) {
            showToast(result.message || 'Failed to update profile.', false);
            return;
        }

        const sessionUser = Auth.getUser() || {};
        Auth.login({...sessionUser, ...(result.data || {})});
        fillProfileFromSession();
        setProfileEditing(false);
        showToast(result.message || 'Profile updated successfully!', true);
    } catch (error) {
        console.error('Profile update error:', error);
        showToast('Server connection failed! Please try again.', false);
    } finally {
        accountState.isSavingProfile = false;
    }
}

function fillProfileFromSession() {
    const user = Auth.getUser() || {};
    setInputValue('accountFirstName', user.firstName || '');
    setInputValue('accountLastName', user.lastName || '');
    setInputValue('accountEmail', user.email || '');
    setInputValue('accountPhone', user.mobile || '');
    setInputValue('accountPassword', '');
}

async function loadProfileDetails() {
    const result = await requestJson('api/profile/details', {method: 'GET'});
    if (result.status === 401 || result.status === 403) {
        redirectToLogin();
        return;
    }

    if (!result.success) {
        showToast(result.message || 'Failed to load profile details.', false);
        return;
    }

    const sessionUser = Auth.getUser() || {};
    Auth.login({...sessionUser, ...(result.data || {})});
    fillProfileFromSession();
}

async function loadAddresses() {
    const result = await requestJson('api/profile/address/list', {method: 'GET'});
    if (result.status === 401 || result.status === 403) {
        redirectToLogin();
        return;
    }

    if (!result.success) {
        showToast(result.message || 'Failed to load addresses.', false);
        accountState.addresses = [];
        renderAddresses();
        return;
    }

    const addresses = Array.isArray(result?.data?.addresses) ? result.data.addresses : [];
    accountState.addresses = addresses;
    renderAddresses();
}

function renderAddresses() {
    const list = getEl('addressList');
    const empty = getEl('addressEmpty');

    if (!list) return;

    if (!Array.isArray(accountState.addresses) || accountState.addresses.length === 0) {
        list.innerHTML = '';
        empty?.classList.remove('d-none');
        return;
    }

    empty?.classList.add('d-none');

    list.innerHTML = accountState.addresses.map((address, index) => {
        const lineOne = escapeHtml(address?.lineOne || '');
        const lineTwo = escapeHtml(address?.lineTwo || '');
        const city = escapeHtml(address?.city?.name || address?.city?.city || '');
        const postalCode = escapeHtml(address?.postalCode || '');
        const title = `Address ${index + 1}`;
        const isPrimary = Boolean(address?.primary);
        const actionButtons = `
            <button type="button" class="btn btn-light border-0 p-1 px-2" data-action="edit-address" data-address-id="${address.id}">
                <i class="bi bi-pencil"></i>
            </button>
            <button type="button" class="btn btn-light border-0 p-1 px-2" data-action="remove-address" data-address-id="${address.id}">
                <i class="bi bi-x-lg text-danger"></i>
            </button>
        `;

        return `
            <div class="col-md-6">
                <div class="border p-4 h-100">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="fs-6 text-uppercase mb-1">${title}</h5>
                            <p class="mb-0 text-muted small">${lineOne}${lineTwo ? `, ${lineTwo}` : ''}</p>
                            <p class="mb-0 text-muted small">${city}${postalCode ? `, ${postalCode}` : ''}</p>
                        </div>
                        <div class="d-flex gap-1">
                            ${actionButtons}
                        </div>
                    </div>
                    ${isPrimary ? '<div class="mt-4 d-flex gap-2"><span class="p-1 px-2 btn fs-9 btn-primary text-uppercase">Default</span></div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function handleAddressActionClick(event) {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) return;

    const action = actionBtn.getAttribute('data-action');
    const addressId = Number(actionBtn.getAttribute('data-address-id') || 0);
    const address = accountState.addresses.find(item => Number(item?.id || 0) === addressId);

    if (!address) return;

    if (action === 'edit-address') {
        openAddressModal(address);
        return;
    }

    if (action === 'remove-address') {
        await removeAddress(addressId);
    }
}

async function loadCities() {
    const result = await requestJson('api/content/city/list', {method: 'GET'});
    if (!result.success) {
        accountState.cities = [];
        return;
    }

    const cities = Array.isArray(result?.data) ? result.data : [];
    accountState.cities = cities.map(city => ({
        id: Number(city?.id || 0),
        name: String(city?.name || city?.city || '').trim()
    })).filter(city => city.id || city.name);
}

function openAddressModal(address = null) {
    ensureAddressModal();
    accountState.editingAddressId = address?.id || null;

    renderCityOptions(accountState.cities);

    const user = Auth.getUser() || {};
    setInputValue('addressFirstName', address?.firstName || user.firstName || '');
    setInputValue('addressLastName', address?.lastName || user.lastName || '');
    setInputValue('addressEmail', address?.email || user.email || '');
    setInputValue('addressMobile', address?.mobile || user.mobile || '');
    setInputValue('addressLineOne', address?.lineOne || '');
    setInputValue('addressLineTwo', address?.lineTwo || '');
    setInputValue('addressPostal', address?.postalCode || '');

    const citySelect = getEl('addressCity');
    if (citySelect) {
        const cityId = String(address?.city?.id || '');
        if (cityId && [...citySelect.options].some(option => option.value === cityId)) {
            citySelect.value = cityId;
        } else {
            citySelect.value = '';
        }
    }

    const modalTitle = getEl('addressModalTitle');
    if (modalTitle) {
        modalTitle.textContent = accountState.editingAddressId ? 'Edit address' : 'Add address';
    }

    accountState.addressModal.show();
}

function ensureAddressModal() {
    if (accountState.addressModal) return;

    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'addressModal';
    modal.tabIndex = -1;
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content rounded-0">
                <form id="addressForm">
                    <div class="modal-header py-3 px-4">
                        <h5 class="modal-title text-uppercase" id="addressModalTitle">Add address</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body px-4">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label" for="addressFirstName">First name</label>
                                <input class="form-control" id="addressFirstName" required type="text">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="addressLastName">Last name</label>
                                <input class="form-control" id="addressLastName" required type="text">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="addressEmail">Email</label>
                                <input class="form-control" id="addressEmail" required type="email">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="addressMobile">Mobile</label>
                                <input class="form-control" id="addressMobile" required type="tel">
                            </div>
                            <div class="col-md-12">
                                <label class="form-label" for="addressLineOne">Address line 1</label>
                                <input class="form-control" id="addressLineOne" required type="text">
                            </div>
                            <div class="col-md-12">
                                <label class="form-label" for="addressLineTwo">Address line 2</label>
                                <input class="form-control" id="addressLineTwo" type="text">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="addressCity">City</label>
                                <select class="form-select" id="addressCity" required></select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="addressPostal">Postal code</label>
                                <input class="form-control" id="addressPostal" required type="text">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer px-4">
                        <button type="button" class="btn btn-light text-uppercase" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-dark text-uppercase" id="addressSaveBtn">Save</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    accountState.addressModal = new bootstrap.Modal(modal);

    modal.querySelector('#addressForm')?.addEventListener('submit', handleAddressSubmit);
}

function renderCityOptions(cities) {
    const citySelect = getEl('addressCity');
    if (!citySelect) return;

    const options = ['<option value="" hidden>Select city</option>'];
    (cities || []).forEach(city => {
        options.push(`<option value="${city.id}">${escapeHtml(city.name)}</option>`);
    });
    citySelect.innerHTML = options.join('');
}

async function handleAddressSubmit(event) {
    event.preventDefault();
    const form = getEl('addressForm');

    if (!form?.checkValidity()) {
        form?.classList.add('was-validated');
        showToast('Please complete the required address fields.', false);
        return;
    }

    const payload = {
        id: Number(accountState.editingAddressId || 0),
        firstName: String(getEl('addressFirstName')?.value || '').trim(),
        lastName: String(getEl('addressLastName')?.value || '').trim(),
        email: String(getEl('addressEmail')?.value || '').trim(),
        mobile: String(getEl('addressMobile')?.value || '').trim(),
        lineOne: String(getEl('addressLineOne')?.value || '').trim(),
        lineTwo: String(getEl('addressLineTwo')?.value || '').trim(),
        postalCode: String(getEl('addressPostal')?.value || '').trim(),
        city: {
            id: Number(getEl('addressCity')?.value || 0)
        }
    };

    const endpoint = accountState.editingAddressId
        ? 'api/profile/address/update'
        : 'api/profile/address/add';

    const result = await requestJson(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });

    if (result.status === 401 || result.status === 403) {
        redirectToLogin();
        return;
    }

    if (!result.success) {
        showToast(result.message || 'Failed to save address.', false);
        return;
    }

    showToast(result.message || 'Address saved successfully!', true);
    accountState.addressModal.hide();
    accountState.editingAddressId = null;
    await loadAddresses();
}

async function removeAddress(addressId) {
    const confirmed = await confirmModal('Remove this address?');
    if (!confirmed) return;

    const result = await requestJson(`api/profile/address/delete?addressId=${encodeURIComponent(addressId)}`,
        {method: 'DELETE'});

    if (result.status === 401 || result.status === 403) {
        redirectToLogin();
        return;
    }

    if (!result.success) {
        showToast(result.message || 'Failed to remove address.', false);
        return;
    }

    showToast(result.message || 'Address removed successfully!', true);
    await loadAddresses();
}

async function loadOrders() {
    const result = await requestJson('api/orders/list', {method: 'GET'});
    if (result.status === 401 || result.status === 403) {
        redirectToLogin();
        return;
    }

    if (!result.success) {
        showToast(result.message || 'Failed to load orders.', false);
        accountState.orders = [];
        renderOrders();
        return;
    }

    accountState.orders = Array.isArray(result?.data?.orders) ? result.data.orders : [];
    renderOrders();
}

function renderOrders() {
    const tableBody = getEl('ordersTableBody');
    const tableWrap = getEl('ordersTableWrap');
    const empty = getEl('ordersEmpty');

    if (!tableBody) return;

    if (!Array.isArray(accountState.orders) || accountState.orders.length === 0) {
        tableBody.innerHTML = '';
        tableWrap?.classList.add('d-none');
        empty?.classList.remove('d-none');
        return;
    }

    tableWrap?.classList.remove('d-none');
    empty?.classList.add('d-none');

    tableBody.innerHTML = accountState.orders.map(order => {
        const code = escapeHtml(order?.orderCode || 'NF-00000');
        const date = formatOrderDate(order?.orderDate);
        const status = escapeHtml(order?.status || 'Pending');
        const total = formatCurrency(order?.totalAmount || 0);
        return `
            <tr>
                <td>${code}</td>
                <td>${date}</td>
                <td><span class="p-1 px-2 btn fs-9 btn-primary text-uppercase">${status}</span></td>
                <td class="text-end">${total}</td>
            </tr>
        `;
    }).join('');
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

function redirectToLogin() {
    window.location.href = 'login.html';
}

function getEl(id) {
    return document.getElementById(id);
}

function setInputValue(id, value) {
    const element = getEl(id);
    if (!element) return;
    element.value = String(value || '');
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