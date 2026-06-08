// Attributes Management Script

document.addEventListener('DOMContentLoaded', () => {
    loadAttributes();
    setupEventListeners();
});

async function loadAttributes() {
    try {
        const response = await fetch('../api/admin/attributes/list');
        const result = await response.json();

        if (response.ok && result.success) {
            const data = result.data;
            renderCategories(data.categories || []);
            renderBrands(data.brands || []);
            renderColors(data.colors || []);
            renderSizes(data.sizes || []);
        } else {
            showToast("Failed to load attributes: " + result.message, false);
        }
    } catch (e) {
        console.error("Error loading attributes:", e);
        showToast("Error retrieving store attributes.", false);
    }
}

function renderCategories(categories) {
    const tbody = document.getElementById('categories-table-body');
    if (categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-3">No categories found.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    categories.forEach(c => {
        tbody.innerHTML += `
        <tr>
            <td>${c.id}</td>
            <td><span class="fw-semibold text-dark">${c.name}</span></td>
        </tr>
        `;
    });
}

function renderBrands(brands) {
    const tbody = document.getElementById('brands-table-body');
    if (brands.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-3">No brands found.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    brands.forEach(b => {
        const logoImg = b.path && b.path !== ''
            ? `<img src="../${b.path}" class="object-fit-contain border" style="height: 30px; width: 60px;" alt="Logo">`
            : '<span class="text-muted small">No Logo</span>';

        tbody.innerHTML += `
        <tr>
            <td>${b.id}</td>
            <td>${logoImg}</td>
            <td><span class="fw-semibold text-dark">${b.name}</span></td>
        </tr>
        `;
    });
}

function renderColors(colors) {
    const tbody = document.getElementById('colors-table-body');
    if (colors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No colors found.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    colors.forEach(c => {
        tbody.innerHTML += `
        <tr>
            <td>${c.id}</td>
            <td>
                <div class="border shadow-xxs" style="height: 22px; width: 44px; background-color: ${c.code};"></div>
            </td>
            <td><span class="fw-semibold text-dark">${c.name}</span></td>
            <td><code class="small">${c.code}</code></td>
        </tr>
        `;
    });
}

function renderSizes(sizes) {
    const tbody = document.getElementById('sizes-table-body');
    if (sizes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center text-muted py-3">No sizes found.</td></tr>`;
        return;
    }

    tbody.innerHTML = '';
    sizes.forEach(s => {
        tbody.innerHTML += `
        <tr>
            <td>${s.id}</td>
            <td><span class="fw-semibold text-dark">${s.name}</span></td>
        </tr>
        `;
    });
}

function setupEventListeners() {
    // 1. Save Category
    document.getElementById('add-category-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('new-category-name');
        const name = input.value.trim();

        if (name === '') return;
        await saveAttribute('category', {name: name}, input);
    });

    // 2. Logo Upload setup
    const uploadBtn = document.getElementById('upload-brand-logo-btn');
    const fileInput = document.getElementById('brand-logo-file');
    const pathInput = document.getElementById('new-brand-logo-path');

    uploadBtn?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const loading = getLoadingToast("Uploading logo...");
        loading.showToast();

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('../api/admin/upload?type=brand', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            loading.hideToast();

            if (response.ok && result.success) {
                pathInput.value = result.data;
                showToast("Logo uploaded successfully!", true);
            } else {
                showToast("Logo upload failed: " + result.message, false);
            }
        } catch (err) {
            loading.hideToast();
            showToast("Error uploading file.", false);
        }
    });

    // Save Brand
    document.getElementById('add-brand-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-brand-name');
        const name = nameInput.value.trim();
        const path = pathInput.value;

        if (name === '') return;
        await saveAttribute('brand', {name: name, path: path}, nameInput);
        pathInput.value = '';
    });

    // 3. Save Color
    document.getElementById('add-color-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-color-name');
        const codeInput = document.getElementById('new-color-code');
        const name = nameInput.value.trim();
        const code = codeInput.value;

        if (name === '') return;
        await saveAttribute('color', {name: name, code: code}, nameInput);
    });

    // 4. Save Size
    document.getElementById('add-size-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('new-size-name');
        const name = input.value.trim();

        if (name === '') return;
        await saveAttribute('size', {name: name}, input);
    });
}

async function saveAttribute(type, payload, clearInputEl) {
    const loading = getLoadingToast(`Saving ${type}...`);
    loading.showToast();

    try {
        const response = await fetch(`../api/admin/attributes/${type}/save`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        loading.hideToast();

        if (response.ok && result.success) {
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} saved successfully!`, true);
            if (clearInputEl) clearInputEl.value = '';
            loadAttributes();
        } else {
            showToast(`Failed to save: ${result.message}`, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Server error during save.", false);
    }
}
