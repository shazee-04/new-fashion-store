const ADDRESS_FIELD_IDS = ['fname', 'lname', 'email', 'phone', 'addressLine1', 'addressLine2', 'city', 'zip'];

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
    isProgrammaticFill: false,
    payhereReturnUrl: null,
    payhereCancelUrl: null,
    lastRedirectUrl: null
};

document.addEventListener('DOMContentLoaded', onCheckoutDomReady);

function onCheckoutDomReady() {
    if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    bindCheckoutEvents();
    prefillFromSessionUser();
    initializeCheckout();
}

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
    const addressSelect = getEl('addressSelect');
    const checkoutForm = getEl('checkoutForm');

    addressSelect?.addEventListener('change', () => {
        const selectedId = Number(addressSelect.value || 0);
        if (!selectedId) {
            checkoutState.selectedAddressId = null;
            checkoutState.selectedAddressSnapshot = null;
            checkoutState.isAddressDirty = false;
            prefillFromSessionUser();
            // Start fresh for new address entry (avoid duplicating a previously selected saved address)
            setInputValue('addressLine1', '');
            setInputValue('addressLine2', '');
            setInputValue('zip', '');
            setInputValue('city', '');
            clearAutofillIndicators(ADDRESS_FIELD_IDS);
            return;
        }

        const selectedAddress = (checkoutState.addresses || []).find(address => Number(address?.id || 0) === selectedId);
        if (!selectedAddress) return;

        checkoutState.selectedAddressId = Number(selectedAddress.id);
        fillFormWithAddress(selectedAddress);
        checkoutState.isAddressDirty = false;
    });

    ADDRESS_FIELD_IDS.forEach(fieldId => {
        const element = getEl(fieldId);
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
        const addressSelect = getEl('addressSelect');
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
    const citySelect = getEl('city');
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
    const wrap = getEl('addressSelectorWrap');
    const select = getEl('addressSelect');
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
    try {
        setInputValue('fname', address?.firstName || '');
        setInputValue('lname', address?.lastName || '');
        setInputValue('email', address?.email || '');
        setInputValue('phone', address?.mobile || '');
        setInputValue('addressLine1', address?.lineOne || '');
        setInputValue('addressLine2', address?.lineTwo || '');
        setCityValue(address?.city);
        setInputValue('zip', address?.postalCode || '');
    } finally {
        checkoutState.isProgrammaticFill = false;
    }

    checkoutState.selectedAddressSnapshot = getAddressSnapshotFromForm();
    checkoutState.isAddressDirty = false;

    applyAutofillIndicators(ADDRESS_FIELD_IDS);
}

function setCityValue(cityData) {
    const citySelect = getEl('city');
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
    const container = getEl('paymentMethodsList');
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
    const cartCount = getEl('checkoutCartCount');
    const cartList = getEl('checkoutCartList');
    const subtotalElement = getEl('checkoutSubtotal');
    const shippingElement = getEl('checkoutShippingFee');
    const totalElement = getEl('checkoutTotal');

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

    const checkoutForm = getEl('checkoutForm');
    const submitButton = getEl('checkoutSubmitBtn');

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
            orderNotes: String(getEl('orderNotes')?.value || '').trim(),
            address: addressPayload
        };

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
    const firstName = String(getEl('fname')?.value || '').trim();
    const lastName = String(getEl('lname')?.value || '').trim();
    const email = String(getEl('email')?.value || '').trim();
    const mobile = String(getEl('phone')?.value || '').trim();
    const lineOne = String(getEl('addressLine1')?.value || '').trim();
    const lineTwo = String(getEl('addressLine2')?.value || '').trim();
    const citySelect = getEl('city');
    const cityId = Number(citySelect?.value || 0);
    const cityText = String(citySelect?.selectedOptions?.[0]?.textContent || '').trim();
    const postalCode = String(getEl('zip')?.value || '').trim();

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
    if (Number(paymentMethodId) === 1) {
        const rawParams = checkoutResult?.data?.params;
        const payHereParams = preparePayHerePaymentParams(rawParams);
        const returnUrl = String(rawParams?.return_url || checkoutResult?.data?.returnUrl || checkoutResult?.data?.redirectUrl || '').trim();
        const cancelUrl = String(rawParams?.cancel_url || checkoutResult?.data?.cancelUrl || '').trim();
        checkoutState.payhereReturnUrl = returnUrl || null;
        checkoutState.payhereCancelUrl = cancelUrl || null;
        checkoutState.lastRedirectUrl = returnUrl || checkoutState.lastRedirectUrl;

        if (!payHereParams) {
            console.error('PayHere payment params missing/invalid. Raw params:', checkoutResult?.data?.params);
            showToast('Order created, but payment could not start (missing PayHere data). Please refresh and try again.', false);
            return false;
        }

        if (!window.payhere) {
            const payhereScript = document.querySelector('script[src*="payhere.lk/lib/payhere.js"]');
            console.error('PayHere SDK (window.payhere) is not available. Script tag:', payhereScript);
            showToast('PayHere failed to load in your browser. Check network/adblock and try again.', false);
            return false;
        }

        if (typeof window.payhere.startPayment !== 'function') {
            console.error('PayHere SDK loaded, but startPayment is not a function. payhere:', window.payhere);
            showToast('PayHere is not ready right now. Please refresh and try again.', false);
            return false;
        }

        showToast('Redirecting to PayHere to complete payment.', true);
        attachPayHereHandlers();
        window.payhere.startPayment(payHereParams);
        return true;
    }

    if (Number(paymentMethodId) === 2) {
        showToast(checkoutResult.message || 'Order placed.', true);
        redirectToUrl(checkoutResult?.data?.redirectUrl);
        return false;
    }

    if (Number(paymentMethodId) === 3) {
        showToast(checkoutResult.message || 'Order placed (COD).', true);
        redirectToUrl(checkoutResult?.data?.redirectUrl);
        return false;
    }

    const redirectUrl = checkoutResult?.data?.redirectUrl || checkoutResult?.data?.paymentUrl || checkoutResult?.data?.url;
    if (redirectUrl) {
        redirectToUrl(redirectUrl, 0);
        return true;
    }

    const formHtml = checkoutResult?.data?.formHtml;
    if (formHtml) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = String(formHtml);
        const form = wrapper.querySelector('form');
        if (form) {
            document.body.appendChild(form);
            form.submit();
            return true;
        }
    }

    const actionUrl = checkoutResult?.data?.actionUrl;
    const fields = checkoutResult?.data?.fields;
    if (actionUrl && fields && typeof fields === 'object') {
        submitExternalPostForm(actionUrl, fields);
        return true;
    }

    showToast(checkoutResult.message || 'Checkout successful!', true);
    redirectToUrl(checkoutState.lastRedirectUrl || checkoutResult?.data?.redirectUrl);

    return false;
}

function redirectToUrl(url, delayMs = 900) {
    const target = String(url || '').trim();
    if (!target) return;
    setTimeout(() => {
        window.location.href = target;
    }, Number(delayMs || 0));
}

function attachPayHereHandlers() {
    if (!window.payhere) return;

    // Payment completed (can be success or failure). Final status must be verified via notify_url on backend.
    window.payhere.onCompleted = function onCompleted(orderId) {
        const safeOrderId = String(orderId ?? '').trim();
        if (safeOrderId) {
            console.log(`PayHere completed. OrderID: ${safeOrderId}`);
        } else {
            console.log('PayHere completed.');
        }
        redirectToast('Payment completed.', `invoice.html?orderId=${safeOrderId}`);
    };

    window.payhere.onDismissed = function () {
        // restoreCheckoutUi();
        // Do not manually redirect; PayHere handles cancel_url.
        redirectToast('Payment was cancelled.', 'checkout.html', false);
    };

    window.payhere.onError = function (error) {
        // restoreCheckoutUi();
        const message = String(error || '').trim();
        // Do not manually redirect; PayHere handles cancel_url/error return handling.
        console.error('PayHere error:', error);
        redirectToast('PayHere returned an error. Please try again.', 'checkout.html', false);
    };
}

function preparePayHerePaymentParams(rawParams) {
    if (!rawParams || typeof rawParams !== 'object') {
        return null;
    }

    const params = {...rawParams};

    if (typeof params.amount === 'number') {
        params.amount = params.amount.toFixed(2);
    }

    const requiredKeys = [
        'merchant_id',
        'return_url',
        'cancel_url',
        'notify_url',
        'order_id',
        'items',
        'amount',
        'currency',
        'hash',
        'first_name',
        'last_name',
        'email',
        'phone',
        'address',
        'city',
        'country'
    ];

    const missing = requiredKeys.filter(key => {
        const value = params[key];
        return value === null || value === undefined || String(value).trim() === '';
    });

    if (missing.length > 0) {
        console.warn('PayHere params missing required keys:', missing);
        return null;
    }

    return params;
}

function restoreCheckoutUi() {
    setCheckoutProcessing(false);
    const submitButton = getEl('checkoutSubmitBtn');
    if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Place order';
    }
}

function setCheckoutProcessing(isProcessing) {
    const checkoutForm = getEl('checkoutForm');
    if (!checkoutForm) return;

    checkoutForm.querySelectorAll('input, select, textarea, button').forEach(element => {
        const htmlElement = element;
        if (htmlElement?.id === 'checkoutSubmitBtn') return;
        htmlElement.disabled = Boolean(isProcessing);
    });

    const submitButton = getEl('checkoutSubmitBtn');
    if (submitButton) submitButton.disabled = Boolean(isProcessing);
}

function handlePossibleSavedAddressEdit(event) {
    if (checkoutState.isProgrammaticFill) return;
    if (!checkoutState.selectedAddressId) return;
    if (!checkoutState.selectedAddressSnapshot) return;

    const current = getAddressSnapshotFromForm();
    checkoutState.isAddressDirty = !isSameSnapshot(current, checkoutState.selectedAddressSnapshot);

    const fieldId = String(event?.target?.id || '').trim();
    if (fieldId) {
        syncAutofillIndicatorForField(fieldId, current, checkoutState.selectedAddressSnapshot);
    }
}

function clearAutofillIndicators(fieldIds) {
    (fieldIds || []).forEach(fieldId => {
        const element = getEl(fieldId);
        element?.classList?.remove('checkout-autofill');
    });
}

function applyAutofillIndicators(fieldIds) {
    (fieldIds || []).forEach(fieldId => {
        const element = getEl(fieldId);
        element?.classList?.add('checkout-autofill');
    });
}

function syncAutofillIndicatorForField(fieldId, currentSnapshot, baseSnapshot) {
    const element = getEl(fieldId);
    if (!element) return;

    const current = currentSnapshot || getAddressSnapshotFromForm();
    const base = baseSnapshot || checkoutState.selectedAddressSnapshot;
    if (!current || !base) return;

    let matches = false;

    switch (fieldId) {
        case 'fname':
            matches = current.firstName === base.firstName;
            break;
        case 'lname':
            matches = current.lastName === base.lastName;
            break;
        case 'email':
            matches = current.email === base.email;
            break;
        case 'phone':
            matches = current.mobile === base.mobile;
            break;
        case 'addressLine1':
            matches = current.lineOne === base.lineOne;
            break;
        case 'addressLine2':
            matches = current.lineTwo === base.lineTwo;
            break;
        case 'zip':
            matches = current.postalCode === base.postalCode;
            break;
        case 'city':
            matches = current.cityId === base.cityId && current.cityName === base.cityName;
            break;
        default:
            return;
    }

    element.classList.toggle('checkout-autofill', Boolean(matches));
}

function getAddressSnapshotFromForm() {
    const citySelect = getEl('city');
    const cityId = Number(citySelect?.value || 0);
    const cityName = String(citySelect?.selectedOptions?.[0]?.textContent || '').trim();

    return normalizeSnapshot({
        firstName: String(getEl('fname')?.value || '').trim(),
        lastName: String(getEl('lname')?.value || '').trim(),
        email: String(getEl('email')?.value || '').trim(),
        mobile: String(getEl('phone')?.value || '').trim(),
        lineOne: String(getEl('addressLine1')?.value || '').trim(),
        lineTwo: String(getEl('addressLine2')?.value || '').trim(),
        postalCode: String(getEl('zip')?.value || '').trim(),
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

    if (checkoutState.selectedAddressId) {
        if (!checkoutState.isAddressDirty) {
            return true;
        }

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
        return true;
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

    const addressSelect = getEl('addressSelect');
    if (addressSelect) addressSelect.value = String(savedId);

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
    const addressSelect = getEl('addressSelect');
    if (addressSelect) addressSelect.value = String(addressId);
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
    const element = getEl(id);
    if (!element) return;
    element.value = String(value || '');
}

function setInputIfEmpty(id, value) {
    const element = getEl(id);
    if (!element) return;
    if (String(element.value || '').trim().length > 0) return;
    element.value = String(value || '');
}

function getEl(id) {
    return document.getElementById(id);
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
