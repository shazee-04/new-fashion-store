const checkoutState = {
    addresses: [],
    cities: [],
    paymentMethods: [],
    selectedAddressId: null,
    selectedAddressSnapshot: null,
    isAddressDirty: false,
    cartItems: [],
    netTotal: 0,
    shippingFee: 350,
    isSubmitting: false,
    isProgrammaticFill: false
};

document.addEventListener('DOMContentLoaded', () => {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    bindCheckoutEvents();
    prefillFromSessionUser();
    initializeCheckout();
});

async function initializeCheckout() {
    try {
        await loadCities();

        await Promise.all([
            loadProfileData(),
            loadPaymentMethods(),
            loadCartSummary()
        ]);
    } catch (error) {
        console.error('Checkout initialization error:', error);
        showToast('Failed loading checkout data.', false);
    }
}

function bindCheckoutEvents() {
    const addressSelect = document.getElementById('addressSelect');
    const checkoutForm = document.getElementById('checkoutForm');
    const useNewAddressOption = document.getElementById('useNewAddressOption');

    addressSelect?.addEventListener('change', () => {
        const selectedId = Number(addressSelect.value || 0);
        if (!selectedId) {
            checkoutState.selectedAddressId = null;
            checkoutState.selectedAddressSnapshot = null;
            checkoutState.isAddressDirty = false;
            prefillFromSessionUser();
            updateUseNewAddressUi();
            return;
        }

        const selectedAddress = checkoutState.addresses.find(address => address.id === selectedId);
        if (!selectedAddress) return;

        checkoutState.selectedAddressId = selectedAddress.id;
        fillFormWithAddress(selectedAddress);
        checkoutState.isAddressDirty = false;
        updateUseNewAddressUi();
    });

    useNewAddressOption?.addEventListener('change', updateUseNewAddressUi);

    const addressFieldIds = ['fname', 'lname', 'email', 'phone', 'addressLine1', 'addressLine2', 'city', 'zip'];
    addressFieldIds.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        element?.addEventListener('input', handlePossibleSavedAddressEdit);
        element?.addEventListener('change', handlePossibleSavedAddressEdit);
    });

    checkoutForm?.addEventListener('submit', async event => {
        event.preventDefault();
        await handleCheckoutSubmit();
    });
}

async function loadProfileData() {
    const result = await requestJson('api/profile/address/list', {method: 'GET'});
    if (!result.success) {
        showToast(result.message || 'Failed loading profile data.', false);
        return;
    }

    const addresses = Array.isArray(result?.data?.addresses) ? result.data.addresses : [];
    checkoutState.addresses = addresses;

    renderAddressSelector(addresses);

    const primaryAddress = addresses.find(address => Boolean(address?.primary));
    const initialAddress = primaryAddress || addresses[0] || null;

    if (initialAddress) {
        checkoutState.selectedAddressId = initialAddress.id;
        const addressSelect = document.getElementById('addressSelect');
        if (addressSelect) addressSelect.value = String(initialAddress.id);
        fillFormWithAddress(initialAddress);
    }
}

async function loadCities() {
    const result = await requestJson('api/content/city/list', {method: 'GET'});
    if (!result.success) {
        showToast(result.message || 'Failed loading cities.', false);
        renderCityOptions([]);
        return;
    }

    const payloadCities = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result?.data?.cities)
            ? result.data.cities
            : [];

    checkoutState.cities = payloadCities.map(city => ({
        id: Number(city?.id || 0),
        city: String(city?.city || city?.name || '').trim()
    })).filter(city => city.id || city.city);

    renderCityOptions(checkoutState.cities);
}

function renderCityOptions(cities) {
    const citySelect = document.getElementById('city');
    if (!citySelect) return;

    const currentValue = String(citySelect.value || '');
    const options = ['<option hidden value="">Select city</option>'];

    (cities || []).forEach(city => {
        options.push(`<option value="${Number(city.id || 0)}">${escapeHtml(city.city || '')}</option>`);
    });

    citySelect.innerHTML = options.join('');

    if (currentValue) {
        citySelect.value = currentValue;
    }
}

function renderAddressSelector(addresses) {
    const wrap = document.getElementById('addressSelectorWrap');
    const select = document.getElementById('addressSelect');
    if (!wrap || !select) return;

    if (!Array.isArray(addresses) || addresses.length === 0) {
        wrap.classList.add('d-none');
        select.innerHTML = '<option class="text-dark fw-normal" value="">Add New Address</option>';
        return;
    }

    wrap.classList.remove('d-none');

    const sorted = [...addresses].sort((left, right) => Number(Boolean(right?.primary)) - Number(Boolean(left?.primary)));
    const options = ['<option class="text-dark fw-normal" value="">Add New Address</option>'];

    sorted.forEach(address => {
        const lineOne = escapeHtml(address?.lineOne || '');
        const lineTwo = escapeHtml(address?.lineTwo || '');
        const city = escapeHtml(address?.city?.city || address?.city?.name || '');
        const postalCode = escapeHtml(address?.postalCode || '');
        const primaryTag = address?.primary ? ' (Primary)' : '';
        const label = `${lineOne}${lineTwo ? `, ${lineTwo}` : ''}${city ? `, ${city}` : ''}${postalCode ? ` ${postalCode}` : ''}${primaryTag}`;
        options.push(`<option value="${Number(address?.id || 0)}">${label}</option>`);
    });

    select.innerHTML = options.join('');
}

function fillFormWithAddress(address) {
    checkoutState.isProgrammaticFill = true;
    setInputValue('fname', address?.firstName || '');
    setInputValue('lname', address?.lastName || '');
    setInputValue('email', address?.email || '');
    setInputValue('phone', address?.mobile || '');
    setInputValue('addressLine1', address?.lineOne || '');
    setInputValue('addressLine2', address?.lineTwo || '');
    setCityValue(address?.city);
    setInputValue('zip', address?.postalCode || '');

    checkoutState.isProgrammaticFill = false;
    checkoutState.selectedAddressSnapshot = getAddressSnapshotFromForm();
    checkoutState.isAddressDirty = false;
    updateUseNewAddressUi();

    flashAutofill([
        document.getElementById('fname'),
        document.getElementById('lname'),
        document.getElementById('email'),
        document.getElementById('phone'),
        document.getElementById('addressLine1'),
        document.getElementById('addressLine2'),
        document.getElementById('city'),
        document.getElementById('zip')
    ]);
}

function setCityValue(cityData) {
    const citySelect = document.getElementById('city');
    if (!citySelect) return;

    const cityId = String(cityData?.id || '');
    const cityName = String(cityData?.city || cityData?.name || '').trim();

    if (cityId && [...citySelect.options].some(option => option.value === cityId)) {
        citySelect.value = cityId;
        return;
    }

    if (cityName) {
        const matchedOption = [...citySelect.options].find(option => option.textContent?.trim().toLowerCase() === cityName.toLowerCase());
        if (matchedOption) {
            citySelect.value = matchedOption.value;
            return;
        }
    }

    citySelect.value = '';
}

function prefillFromSessionUser() {
    const user = Auth.getUser() || {};

    setInputIfEmpty('fname', user?.firstName || '');
    setInputIfEmpty('lname', user?.lastName || '');
    setInputIfEmpty('email', user?.email || '');
    setInputIfEmpty('phone', user?.mobile || '');
}

async function loadPaymentMethods() {
    const result = await requestJson('api/checkout/payment-methods', {method: 'GET'});
    if (!result.success) {
        showToast(result.message || 'Failed loading payment methods.', false);
        renderPaymentMethods([]);
        return;
    }

    const methods = Array.isArray(result?.data) ? result.data : [];
    checkoutState.paymentMethods = methods;
    renderPaymentMethods(methods);
}

function renderPaymentMethods(methods) {
    const container = document.getElementById('paymentMethodsList');
    if (!container) return;

    if (!Array.isArray(methods) || methods.length === 0) {
        container.innerHTML = `
			<label class="list-group-item payment-option" for="paymentUnavailable">
				<input checked class="form-check-input flex-shrink-0" id="paymentUnavailable" name="paymentMethod" type="radio" value="">
				<div class="d-flex align-items-center justify-content-between w-100 gap-2">
					<span class="fs-6 text-dark text-uppercase" style="line-height: normal;">
						No payment methods available
					</span>
				</div>
			</label>
		`;
        return;
    }

    container.innerHTML = methods.map((method, index) => {
        const id = Number(method?.id || 0);
        const name = String(method?.name || 'Payment method');
        const inputId = `paymentMethod_${id || index + 1}`;
        const checked = index === 0 ? 'checked' : '';
        const logo = getPaymentMethodLogo(name);

        return `
			<label class="list-group-item payment-option" for="${inputId}">
				<input ${checked} class="form-check-input flex-shrink-0" id="${inputId}" name="paymentMethod" type="radio" value="${id}">
				<div class="d-flex align-items-center justify-content-between w-100 gap-2">
					<span class="fs-6 text-dark text-uppercase" style="line-height: normal;">${escapeHtml(name)}</span>
					${logo ? `<span><img alt="${escapeHtml(name)}" class="ms-2" height="32" src="${logo}"></span>` : ''}
				</div>
			</label>
		`;
    }).join('');
}

function getPaymentMethodLogo(methodName) {
    const normalized = String(methodName || '').toLowerCase();
    if (normalized.includes('payhere')) {
        return 'assets/images/brand/other/payhere.png';
    }

    return '';
}

async function loadCartSummary() {
    const result = await requestJson('api/cart/list', {method: 'GET'});
    if (!result.success) {
        showToast(result.message || 'Failed loading cart items.', false);
        renderCartSummary([], 0);
        return;
    }

    const items = Array.isArray(result?.data?.items) ? result.data.items : [];
    const netTotal = Number(result?.data?.netTotal || 0);

    checkoutState.cartItems = items;
    checkoutState.netTotal = netTotal;

    renderCartSummary(items, netTotal);
}

function renderCartSummary(items, subtotal) {
    const cartCount = document.getElementById('checkoutCartCount');
    const cartList = document.getElementById('checkoutCartList');
    const subtotalElement = document.getElementById('checkoutSubtotal');
    const shippingElement = document.getElementById('checkoutShippingFee');
    const totalElement = document.getElementById('checkoutTotal');

    const productCount = items.length;
    const itemCount = items.reduce((sum, item) => sum + Number(item?.qty || 0), 0);
    const shippingFee = Number(checkoutState.shippingFee || 0);
    const total = subtotal + shippingFee;

    if (cartCount) {
        cartCount.textContent = `${productCount} Products. ${itemCount} items`;
    }

    if (cartList) {
        if (items.length === 0) {
            cartList.innerHTML = `
				<div class="d-flex justify-content-between align-items-center text-dark fw-light fs-7 text-uppercase">
					<span>No items</span>
					<span>LKR 0.00</span>
				</div>
			`;
        } else {
            cartList.innerHTML = items.map(item => `
				<div class="d-flex justify-content-between align-items-center text-dark fw-light fs-7 text-uppercase">
					<span class="text-truncate">${escapeHtml(item?.title || 'Product')} x ${Number(item?.qty || 0)}</span>
					<span class="text-nowrap">${formatCurrency(Number(item?.totalPrice || 0))}</span>
				</div>
			`).join('');
        }
    }

    if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
    if (shippingElement) shippingElement.textContent = formatCurrency(shippingFee);
    if (totalElement) totalElement.textContent = formatCurrency(total);
}

async function handleCheckoutSubmit() {
    if (checkoutState.isSubmitting) return;

    const checkoutForm = document.getElementById('checkoutForm');
    const submitButton = document.getElementById('checkoutSubmitBtn');

    if (!checkoutForm?.checkValidity()) {
        checkoutForm?.classList.add('was-validated');
        showToast('Please fill all required checkout fields.', false);
        return;
    }

    const paymentMethodId = Number(document.querySelector('input[name="paymentMethod"]:checked')?.value || 0);
    if (!paymentMethodId) {
        showToast('Please select a payment method.', false);
        return;
    }

    const addressPayload = getAddressPayload();
    if (!addressPayload) {
        showToast('Please fill a valid address.', false);
        return;
    }

    checkoutState.isSubmitting = true;
    setCheckoutProcessing(true);
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
    }

    let keepDisabled = false;

    try {
        const addressOk = await ensureAddressSaved(addressPayload);
        if (!addressOk) {
            return;
        }

        if (!checkoutState.selectedAddressId) {
            showToast('Failed to prepare address for checkout.', false);
            return;
        }

        addressPayload.id = checkoutState.selectedAddressId;

        const payload = {
            paymentMethodId: paymentMethodId,
            orderNotes: String(document.getElementById('orderNotes')?.value || '').trim(),
            address: addressPayload
        };
        console.log(payload);

        const checkoutResult = await requestJson('api/checkout/place-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!checkoutResult.success) {
            showToast(checkoutResult.message || 'Checkout failed.', false);
            return;
        }

        keepDisabled = Boolean(handleCheckoutSuccess(checkoutResult, paymentMethodId, addressPayload));
    } catch (error) {
        console.error('Checkout submit error:', error);
        showToast('Server connection failed! Please try again.', false);
    } finally {
        checkoutState.isSubmitting = false;
        if (!keepDisabled) {
            setCheckoutProcessing(false);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Place order';
            }
        }
    }
}

function getAddressPayload() {
    const firstName = String(document.getElementById('fname')?.value || '').trim();
    const lastName = String(document.getElementById('lname')?.value || '').trim();
    const email = String(document.getElementById('email')?.value || '').trim();
    const mobile = String(document.getElementById('phone')?.value || '').trim();
    const lineOne = String(document.getElementById('addressLine1')?.value || '').trim();
    const lineTwo = String(document.getElementById('addressLine2')?.value || '').trim();
    const citySelect = document.getElementById('city');
    const cityId = Number(citySelect?.value || 0);
    const cityText = String(citySelect?.selectedOptions?.[0]?.textContent || '').trim();
    const postalCode = String(document.getElementById('zip')?.value || '').trim();

    if (!firstName || !lastName || !email || !mobile || !lineOne || !cityId || !postalCode) {
        return null;
    }

    return {
        id: checkoutState.selectedAddressId || 0,
        firstName,
        lastName,
        email,
        mobile,
        lineOne,
        lineTwo,
        postalCode,
        city: {
            id: cityId,
            name: cityText
        },
        primary: checkoutState.addresses.length === 0
    };
}

async function saveAddress(addressPayload) {
    return requestJson('api/profile/address/add', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressPayload)
    });
}

function handleCheckoutSuccess(checkoutResult, paymentMethodId, addressPayload) {
    const orderId = Number(checkoutResult?.data?.orderId || 0);

    if (Number(paymentMethodId) === 1) {
        const payHereParams = checkoutResult?.data?.params;
        if (payHereParams && window.payhere && typeof window.payhere.startPayment === 'function') {
            attachPayHereHandlers();
            window.payhere.startPayment(payHereParams);
            return true;
        }

        showToast('Order placed, but PayHere is not available right now.', true);
        setTimeout(() => {
            window.location.href = 'order-tracking.html';
        }, 900);
        return false;
    }

    if (Number(paymentMethodId) === 2) {
        showToast(checkoutResult.message || 'Order placed.', true);
        setTimeout(() => {
            window.location.href = 'order-tracking.html';
        }, 900);
        return false;
    }

    if (Number(paymentMethodId) === 3) {
        showToast(checkoutResult.message || 'Order placed (COD).', true);
        setTimeout(() => {
            window.location.href = 'order-tracking.html';
        }, 900);
        return false;
    }

    const redirectUrl = checkoutResult?.data?.redirectUrl || checkoutResult?.data?.paymentUrl || checkoutResult?.data?.url;
    if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
    }

    const formHtml = checkoutResult?.data?.formHtml;
    if (formHtml) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = String(formHtml);
        const form = wrapper.querySelector('form');
        if (form) {
            document.body.appendChild(form);
            form.submit();
            return;
        }
    }

    const actionUrl = checkoutResult?.data?.actionUrl;
    const fields = checkoutResult?.data?.fields;
    if (actionUrl && fields && typeof fields === 'object') {
        submitExternalPostForm(actionUrl, fields);
        return;
    }

    showToast(checkoutResult.message || 'Checkout successful!', true);
    setTimeout(() => {
        window.location.href = 'order-tracking.html';
    }, 900);

    return false;
}

function attachPayHereHandlers() {
    if (!window.payhere) return;

    window.payhere.onCompleted = function () {
        window.location.href = 'order-tracking.html';
    };

    window.payhere.onDismissed = function () {
        restoreCheckoutUi();
        showToast('Payment cancelled.', false);
    };

    window.payhere.onError = function (error) {
        restoreCheckoutUi();
        const message = String(error || '').trim();
        showToast(message ? `Payment failed: ${message}` : 'Payment failed.', false);
    };
}

function restoreCheckoutUi() {
    setCheckoutProcessing(false);
    const submitButton = document.getElementById('checkoutSubmitBtn');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Place order';
    }
}

function setCheckoutProcessing(isProcessing) {
    const checkoutForm = document.getElementById('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.querySelectorAll('input, select, textarea, button').forEach(element => {
        const htmlElement = element;
        if (htmlElement?.id === 'checkoutSubmitBtn') return;
        htmlElement.disabled = Boolean(isProcessing);
    });

    const submitButton = document.getElementById('checkoutSubmitBtn');
    if (submitButton) submitButton.disabled = Boolean(isProcessing);
}

function handlePossibleSavedAddressEdit() {
    if (checkoutState.isProgrammaticFill) return;
    if (!checkoutState.selectedAddressId) return;
    if (!checkoutState.selectedAddressSnapshot) return;

    const current = getAddressSnapshotFromForm();
    checkoutState.isAddressDirty = !isSameSnapshot(current, checkoutState.selectedAddressSnapshot);
    updateUseNewAddressUi();
}

function updateUseNewAddressUi() {
    const wrap = document.getElementById('useNewAddressWrap');
    const checkbox = document.getElementById('useNewAddressOption');
    if (!wrap || !checkbox) return;

    const show = Boolean(checkoutState.selectedAddressId && checkoutState.isAddressDirty);
    wrap.classList.toggle('d-none', !show);

    if (!show) {
        checkbox.checked = false;
    }
}

function getAddressSnapshotFromForm() {
    const citySelect = document.getElementById('city');
    const cityId = Number(citySelect?.value || 0);
    const cityName = String(citySelect?.selectedOptions?.[0]?.textContent || '').trim();

    return normalizeSnapshot({
        firstName: String(document.getElementById('fname')?.value || '').trim(),
        lastName: String(document.getElementById('lname')?.value || '').trim(),
        email: String(document.getElementById('email')?.value || '').trim(),
        mobile: String(document.getElementById('phone')?.value || '').trim(),
        lineOne: String(document.getElementById('addressLine1')?.value || '').trim(),
        lineTwo: String(document.getElementById('addressLine2')?.value || '').trim(),
        postalCode: String(document.getElementById('zip')?.value || '').trim(),
        cityId,
        cityName
    });
}

function normalizeSnapshot(snapshot) {
    return {
        firstName: String(snapshot?.firstName || '').trim(),
        lastName: String(snapshot?.lastName || '').trim(),
        email: String(snapshot?.email || '').trim(),
        mobile: String(snapshot?.mobile || '').trim(),
        lineOne: String(snapshot?.lineOne || '').trim(),
        lineTwo: String(snapshot?.lineTwo || '').trim(),
        postalCode: String(snapshot?.postalCode || '').trim(),
        cityId: Number(snapshot?.cityId || 0),
        cityName: String(snapshot?.cityName || '').trim().toLowerCase()
    };
}

function isSameSnapshot(left, right) {
    if (!left || !right) return false;
    return (
        left.firstName === right.firstName &&
        left.lastName === right.lastName &&
        left.email === right.email &&
        left.mobile === right.mobile &&
        left.lineOne === right.lineOne &&
        left.lineTwo === right.lineTwo &&
        left.postalCode === right.postalCode &&
        left.cityId === right.cityId &&
        left.cityName === right.cityName
    );
}

async function ensureAddressSaved(addressPayload) {
    const snapshotNow = getAddressSnapshotFromForm();
    const useNewAddress = Boolean(document.getElementById('useNewAddressOption')?.checked);

    if (checkoutState.selectedAddressId) {
        if (!checkoutState.isAddressDirty) {
            return true;
        }

        if (!useNewAddress) {
            const updatePayload = {
                ...addressPayload,
                id: checkoutState.selectedAddressId
            };

            const updateResult = await updateAddress(updatePayload);
            if (!updateResult.success) {
                showToast(updateResult.message || 'Failed updating address.', false);
                return false;
            }

            applyAddressUpdateToState(updatePayload);
            checkoutState.selectedAddressSnapshot = snapshotNow;
            checkoutState.isAddressDirty = false;
            updateUseNewAddressUi();
            return true;
        }
    }

    const savePayload = {
        ...addressPayload,
        id: 0
    };

    const saveResult = await saveAddress(savePayload);
    if (!saveResult.success) {
        showToast(saveResult.message || 'Failed saving address.', false);
        return false;
    }

    const savedId = Number(
        saveResult?.data?.addressId ||
        saveResult?.data?.id ||
        saveResult?.data?.savedAddressId ||
        saveResult?.data?.address?.id ||
        (typeof saveResult?.data === 'number' ? saveResult.data : 0) ||
        0
    );

    if (!savedId) {
        showToast('Address saved, but missing address id from server.', false);
        return false;
    }

    checkoutState.selectedAddressId = savedId;
    checkoutState.selectedAddressSnapshot = snapshotNow;
    checkoutState.isAddressDirty = false;

    const savedAddressForUi = {
        id: savedId,
        firstName: addressPayload.firstName,
        lastName: addressPayload.lastName,
        email: addressPayload.email,
        mobile: addressPayload.mobile,
        lineOne: addressPayload.lineOne,
        lineTwo: addressPayload.lineTwo,
        postalCode: addressPayload.postalCode,
        city: {
            id: Number(addressPayload?.city?.id || 0),
            name: String(addressPayload?.city?.name || addressPayload?.city?.city || '').trim()
        },
        primary: false
    };

    checkoutState.addresses = [...(checkoutState.addresses || []), savedAddressForUi];
    renderAddressSelector(checkoutState.addresses);

    const addressSelect = document.getElementById('addressSelect');
    if (addressSelect) addressSelect.value = String(savedId);
    updateUseNewAddressUi();

    return true;
}

async function updateAddress(addressPayload) {
    return requestJson('api/profile/address/update', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressPayload)
    });
}

function applyAddressUpdateToState(addressPayload) {
    const addressId = Number(addressPayload?.id || 0);
    if (!addressId) return;

    const updated = {
        id: addressId,
        firstName: addressPayload.firstName,
        lastName: addressPayload.lastName,
        email: addressPayload.email,
        mobile: addressPayload.mobile,
        lineOne: addressPayload.lineOne,
        lineTwo: addressPayload.lineTwo,
        postalCode: addressPayload.postalCode,
        city: {
            id: Number(addressPayload?.city?.id || 0),
            name: String(addressPayload?.city?.name || addressPayload?.city?.city || '').trim()
        }
    };

    checkoutState.addresses = (checkoutState.addresses || []).map(address => {
        if (Number(address?.id || 0) !== addressId) return address;
        return {
            ...address,
            ...updated
        };
    });

    renderAddressSelector(checkoutState.addresses);
    const addressSelect = document.getElementById('addressSelect');
    if (addressSelect) addressSelect.value = String(addressId);
}

function flashAutofill(elements) {
    (elements || []).forEach(element => {
        if (!element) return;
        element.classList.add('checkout-autofill');
        window.setTimeout(() => {
            element.classList.remove('checkout-autofill');
        }, 1200);
    });
}


function submitExternalPostForm(actionUrl, fields) {
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = String(actionUrl);
    form.style.display = 'none';

    Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = String(name);
        input.value = String(value ?? '');
        form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
}

function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    element.value = String(value || '');
}

function setInputIfEmpty(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    if (String(element.value || '').trim().length > 0) return;
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
