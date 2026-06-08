// Products Page Script

let productsList = [];
let categories = [];
let brands = [];
let colors = [];
let sizes = [];

let uploadedImages = [];
let productVariations = [];
let productModal;

document.addEventListener('DOMContentLoaded', () => {
    productModal = new bootstrap.Modal(document.getElementById('productModal'));

    initializePage();
    setupEventListeners();
});

async function initializePage() {
    await loadAttributeLookups();
    await loadProducts();
}

async function loadAttributeLookups() {
    try {
        const response = await fetch('../api/admin/attributes/list');
        const result = await response.json();

        if (response.ok && result.success) {
            const data = result.data;
            categories = data.categories || [];
            brands = data.brands || [];
            colors = data.colors || [];
            sizes = data.sizes || [];

            // Populate Filter Selects
            populateSelect('filter-category', categories, 'id', 'name', 'All Categories');
            populateSelect('filter-brand', brands, 'id', 'name', 'All Brands');

            // Populate Modal Selects
            populateSelect('product-category', categories, 'id', 'name', 'Select Category');
            populateSelect('product-brand', brands, 'id', 'name', 'Select Brand');
            populateSelect('var-color', colors, 'id', 'name', 'Select Color');
            populateSelect('var-size', sizes, 'id', 'name', 'Select Size');
        }
    } catch (e) {
        console.error("Error loading lookups:", e);
    }
}

function populateSelect(elementId, items, valueProp, textProp, defaultText) {
    const select = document.getElementById(elementId);
    if (!select) return;

    select.innerHTML = `<option value="">${defaultText}</option>`;
    items.forEach(item => {
        select.innerHTML += `<option value="${item[valueProp]}">${item[textProp]}</option>`;
    });
}

async function loadProducts() {
    const tableBody = document.getElementById('products-table-body');
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm text-dark" role="status"></div></td></tr>`;

    try {
        const response = await fetch('../api/admin/products/list');
        const result = await response.json();

        if (response.ok && result.success) {
            productsList = result.data || [];
            renderProductsTable(productsList);
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load products: ${result.message}</td></tr>`;
        }
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error connecting to server.</td></tr>`;
    }
}

function renderProductsTable(products) {
    const tableBody = document.getElementById('products-table-body');
    if (!products || products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No products found.</td></tr>`;
        return;
    }

    // Filter local lists
    const searchVal = document.getElementById('product-search-input').value.toLowerCase().trim();
    const catVal = document.getElementById('filter-category').value;
    const brandVal = document.getElementById('filter-brand').value;

    let filtered = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchVal);
        const matchesCategory = !catVal || p.categoryName === getSelectedText('filter-category');
        const matchesBrand = !brandVal || p.brandName === getSelectedText('filter-brand');
        return matchesSearch && matchesCategory && matchesBrand;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No matching products found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    filtered.forEach(p => {
        const statusText = p.status.id === 1 ? 'Active' : 'Inactive';
        const statusToggleActionText = p.status.id === 1 ? 'Deactivate' : 'Activate';
        const statusToggleId = p.status.id === 1 ? 2 : 1;
        const formattedDate = p.addedDate ? p.addedDate.replace('T', ' ').substring(0, 16) : '';

        tableBody.innerHTML += `
        <tr>
            <td>${p.id}</td>
            <td><span class="fw-semibold text-dark">${p.title}</span></td>
            <td>${p.categoryName}</td>
            <td>${p.brandName}</td>
            <td>${getStatusBadge(statusText)}</td>
            <td>${formattedDate}</td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-dark" onclick="editProduct(${p.id})">Edit</button>
                    <button class="btn btn-sm ${p.status.id === 1 ? 'btn-outline-danger' : 'btn-outline-success'}" 
                        onclick="toggleProductStatus(${p.id}, ${statusToggleId})">${statusToggleActionText}</button>
                </div>
            </td>
        </tr>
        `;
    });
}

function getSelectedText(elementId) {
    const el = document.getElementById(elementId);
    if (!el || el.selectedIndex === -1) return '';
    return el.options[el.selectedIndex].text;
}

function setupEventListeners() {
    // Filter Handlers
    document.getElementById('product-search-input')?.addEventListener('input', () => renderProductsTable(productsList));
    document.getElementById('filter-category')?.addEventListener('change', () => renderProductsTable(productsList));
    document.getElementById('filter-brand')?.addEventListener('change', () => renderProductsTable(productsList));
    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
        document.getElementById('product-search-input').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-brand').value = '';
        renderProductsTable(productsList);
    });

    // Add Product Modal trigger
    document.getElementById('add-product-btn')?.addEventListener('click', () => {
        document.getElementById('productModalLabel').textContent = "Add New Product";
        document.getElementById('product-id').value = "0";
        document.getElementById('product-form').reset();
        uploadedImages = [];
        productVariations = [];
        renderImagePreviews();
        renderVariations();
        productModal.show();
    });

    // Drag and Drop Area Handlers
    const dropArea = document.getElementById('image-drop-area');
    const fileInput = document.getElementById('product-image-file');

    dropArea?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', (e) => handleFileSelect(e.target.files));

    dropArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.style.backgroundColor = '#eeeeee';
    });

    dropArea?.addEventListener('dragleave', () => {
        dropArea.style.backgroundColor = '#fafafa';
    });

    dropArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.backgroundColor = '#fafafa';
        handleFileSelect(e.dataTransfer.files);
    });

    // Add variation click handler
    document.getElementById('add-variation-btn')?.addEventListener('click', addVariation);

    // Save product handler
    document.getElementById('save-product-submit')?.addEventListener('click', saveProduct);
}

// Upload Handler
async function handleFileSelect(files) {
    if (!files || files.length === 0) return;

    const loading = getLoadingToast("Uploading image(s)...");
    loading.showToast();

    for (let f of files) {
        const formData = new FormData();
        formData.append('file', f);

        try {
            const response = await fetch('../api/admin/upload?type=products', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            if (response.ok && result.success) {
                // If it's the first image, set it as primary
                const isPrimary = uploadedImages.length === 0;
                uploadedImages.push({
                    path: result.data,
                    isPrimary: isPrimary
                });
                renderImagePreviews();
            } else {
                showToast("Upload failed: " + result.message, false);
            }
        } catch (err) {
            console.error("Upload error:", err);
            showToast("Server error during upload.", false);
        }
    }

    loading.hideToast();
    document.getElementById('product-image-file').value = ''; // Reset file input
}

function renderImagePreviews() {
    const list = document.getElementById('images-preview-list');
    list.innerHTML = '';

    uploadedImages.forEach((img, idx) => {
        list.innerHTML += `
        <div class="image-preview-card">
            <img src="../${img.path}" alt="Preview">
            <button type="button" class="delete-btn" onclick="removeImage(${idx})"><i class="bi bi-x"></i></button>
            ${img.isPrimary ? '<span class="primary-badge">Primary</span>' : `<button type="button" class="btn btn-xxs btn-light position-absolute bottom-0 w-100 py-0" style="font-size:0.6rem; border-radius:0;" onclick="makePrimary(${idx})">Set Primary</button>`}
        </div>
        `;
    });
}

function removeImage(index) {
    const removed = uploadedImages.splice(index, 1)[0];
    if (removed.isPrimary && uploadedImages.length > 0) {
        uploadedImages[0].isPrimary = true;
    }
    renderImagePreviews();
}

function makePrimary(index) {
    uploadedImages.forEach((img, idx) => {
        img.isPrimary = (idx === index);
    });
    renderImagePreviews();
}

// Variation Handler
function addVariation() {
    const colorSelect = document.getElementById('var-color');
    const sizeSelect = document.getElementById('var-size');
    const priceInput = document.getElementById('var-price');
    const qtyInput = document.getElementById('var-qty');

    const colorId = colorSelect.value;
    const sizeId = sizeSelect.value;
    const price = parseFloat(priceInput.value);
    const qty = parseInt(qtyInput.value);

    if (!colorId || !sizeId || isNaN(price) || isNaN(qty) || price <= 0 || qty < 0) {
        showToast("Please fill all variation fields with valid values.", false);
        return;
    }

    // Check duplicate color-size variation locally
    const isDuplicate = productVariations.some(v => v.colorId == colorId && v.sizeId == sizeId);
    if (isDuplicate) {
        showToast("This Color and Size variation already exists in this list.", false);
        return;
    }

    productVariations.push({
        id: 0,
        colorId: parseInt(colorId),
        colorName: colorSelect.options[colorSelect.selectedIndex].text,
        sizeId: parseInt(sizeId),
        sizeName: sizeSelect.options[sizeSelect.selectedIndex].text,
        price: price,
        qty: qty
    });

    renderVariations();

    // Reset inputs
    colorSelect.value = '';
    sizeSelect.value = '';
    priceInput.value = '';
    qtyInput.value = '';
}

function renderVariations() {
    const container = document.getElementById('added-variations-container');
    container.innerHTML = '';

    if (productVariations.length === 0) {
        container.innerHTML = `<div class="text-muted text-center py-2 border border-light">No variation configured yet.</div>`;
        return;
    }

    productVariations.forEach((v, idx) => {
        container.innerHTML += `
        <div class="variation-row d-flex flex-wrap gap-3 align-items-center">
            <div>
                <strong>Color:</strong> ${v.colorName}
            </div>
            <div>
                <strong>Size:</strong> ${v.sizeName}
            </div>
            <div>
                <strong>Price:</strong> ${formatLkr(v.price)}
            </div>
            <div>
                <strong>Qty:</strong> ${v.qty} Items
            </div>
            <button type="button" class="remove-variation-btn border-0 bg-transparent ms-auto" onclick="removeVariation(${idx})">
                <i class="bi bi-trash fs-5"></i>
            </button>
        </div>
        `;
    });
}

function removeVariation(index) {
    productVariations.splice(index, 1);
    renderVariations();
}

// Edit handler
async function editProduct(id) {
    const loading = getLoadingToast("Loading product details...");
    loading.showToast();

    try {
        const response = await fetch(`../api/admin/products/detail?id=${id}`);
        const result = await response.json();

        loading.hideToast();
        if (response.ok && result.success) {
            const data = result.data;

            document.getElementById('productModalLabel').textContent = "Edit Product Details";
            document.getElementById('product-id').value = data.id;
            document.getElementById('product-title').value = data.title;
            document.getElementById('product-desc').value = data.description;
            document.getElementById('product-category').value = data.categoryId;
            document.getElementById('product-brand').value = data.brandId;
            document.getElementById('product-status').value = data.statusId;

            // Load images
            uploadedImages = data.images.map(img => ({
                id: img.id,
                path: img.path,
                isPrimary: img.isPrimary
            }));
            renderImagePreviews();

            // Load variations
            productVariations = data.stocks.map(st => {
                const colorObj = colors.find(c => c.id === st.colorId) || {};
                const sizeObj = sizes.find(s => s.id === st.sizeId) || {};
                return {
                    id: st.id,
                    colorId: st.colorId,
                    colorName: colorObj.name || 'Unknown',
                    sizeId: st.sizeId,
                    sizeName: sizeObj.name || 'Unknown',
                    price: st.price,
                    qty: st.qty
                };
            });
            renderVariations();

            productModal.show();
        } else {
            showToast("Failed to load details: " + result.message, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Error retrieving product detail.", false);
    }
}

// Save Product Submission
async function saveProduct() {
    const title = document.getElementById('product-title').value.trim();
    const desc = document.getElementById('product-desc').value.trim();
    const catId = document.getElementById('product-category').value;
    const brandId = document.getElementById('product-brand').value;
    const statusId = document.getElementById('product-status').value;
    const id = parseInt(document.getElementById('product-id').value);

    if (!title || !catId || !brandId || !statusId) {
        showToast("Please fill all required general details.", false);
        return;
    }

    if (uploadedImages.length === 0) {
        showToast("Please upload at least one image.", false);
        return;
    }

    if (productVariations.length === 0) {
        showToast("Please add at least one Color & Size stock variation.", false);
        return;
    }

    const payload = {
        id: id,
        title: title,
        description: desc,
        categoryId: parseInt(catId),
        brandId: parseInt(brandId),
        statusId: parseInt(statusId),
        images: uploadedImages,
        stocks: productVariations
    };

    const loading = getLoadingToast("Saving product...");
    loading.showToast();

    try {
        const response = await fetch('../api/admin/products/save', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        loading.hideToast();

        if (response.ok && result.success) {
            showToast("Product saved successfully!", true);
            productModal.hide();
            loadProducts();
        } else {
            showToast("Failed to save product: " + result.message, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Server error during product save.", false);
    }
}

// Toggle status handler
async function toggleProductStatus(id, newStatusId) {
    const confirmation = await confirmToggle();
    if (!confirmation) return;

    try {
        const response = await fetch('../api/admin/products/update-status', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: id, statusId: newStatusId})
        });

        const result = await response.json();
        if (response.ok && result.success) {
            showToast("Status updated successfully!", true);
            loadProducts();
        } else {
            showToast("Status update failed: " + result.message, false);
        }
    } catch (e) {
        showToast("Server communication error.", false);
    }
}

function confirmToggle() {
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
                Are you sure you want to change this product's active status?
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
