// Banner Management Script

let bannersList = [];
let bannerModal;

document.addEventListener('DOMContentLoaded', () => {
    bannerModal = new bootstrap.Modal(document.getElementById('bannerModal'));

    loadBanners();
    setupEventListeners();
});

async function loadBanners() {
    const tableBody = document.getElementById('banners-table-body');
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm text-dark" role="status"></div></td></tr>`;

    try {
        const response = await fetch('../api/admin/banners/list');
        const result = await response.json();

        if (response.ok && result.success) {
            bannersList = result.data || [];
            renderBannersTable(bannersList);
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Failed to load banners: ${result.message}</td></tr>`;
        }
    } catch (e) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">Error connecting to server.</td></tr>`;
    }
}

function renderBannersTable(banners) {
    const tableBody = document.getElementById('banners-table-body');
    if (!banners || banners.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">No banners found.</td></tr>`;
        return;
    }

    tableBody.innerHTML = '';
    banners.forEach(b => {
        const statusText = b.statusId === 1 ? 'Active' : 'Inactive';
        tableBody.innerHTML += `
        <tr>
            <td>${b.id}</td>
            <td>
                <img src="../${b.imagePath}" class="object-fit-cover border" style="height: 50px; width: 100px;" alt="Banner">
            </td>
            <td><span class="fw-semibold text-dark">${b.title}</span></td>
            <td><small class="text-muted">${b.description || '-'}</small></td>
            <td><code class="small">${b.url || '-'}</code></td>
            <td>${getStatusBadge(statusText)}</td>
            <td>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-dark" onclick="editBanner(${b.id})">Edit</button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteBanner(${b.id})">Delete</button>
                </div>
            </td>
        </tr>
        `;
    });
}

function setupEventListeners() {
    // Add Banner trigger
    document.getElementById('add-banner-btn')?.addEventListener('click', () => {
        document.getElementById('bannerModalLabel').textContent = "Add Promo Slide";
        document.getElementById('banner-id').value = "0";
        document.getElementById('banner-form').reset();
        document.getElementById('banner-image-path').value = '';
        hidePreview();
        bannerModal.show();
    });

    // File Upload Setup
    const dropArea = document.getElementById('banner-drop-area');
    const fileInput = document.getElementById('banner-image-file');

    dropArea?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', (e) => handleBannerUpload(e.target.files[0]));

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
        handleBannerUpload(e.dataTransfer.files[0]);
    });

    // Remove Image button inside modal
    document.getElementById('remove-banner-img-btn')?.addEventListener('click', hidePreview);

    // Save Banner Trigger
    document.getElementById('save-banner-submit')?.addEventListener('click', saveBanner);
}

async function handleBannerUpload(file) {
    if (!file) return;

    const loading = getLoadingToast("Uploading banner image...");
    loading.showToast();

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('../api/admin/upload?type=banners', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        loading.hideToast();

        if (response.ok && result.success) {
            showPreview(result.data);
        } else {
            showToast("Upload failed: " + result.message, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Error uploading file.", false);
    }
}

function showPreview(path) {
    document.getElementById('banner-image-path').value = path;
    document.getElementById('banner-preview-img').src = '../' + path;
    document.getElementById('banner-preview-box').classList.remove('d-none');
    document.getElementById('banner-drop-area').classList.add('d-none');
}

function hidePreview() {
    document.getElementById('banner-image-path').value = '';
    document.getElementById('banner-preview-img').src = '';
    document.getElementById('banner-preview-box').classList.add('d-none');
    document.getElementById('banner-drop-area').classList.remove('d-none');
    document.getElementById('banner-image-file').value = '';
}

function editBanner(id) {
    const banner = bannersList.find(b => b.id === id);
    if (!banner) return;

    document.getElementById('bannerModalLabel').textContent = "Edit Promo Slide";
    document.getElementById('banner-id').value = banner.id;
    document.getElementById('banner-title').value = banner.title;
    document.getElementById('banner-desc').value = banner.description || '';
    document.getElementById('banner-url').value = banner.url || '';
    document.getElementById('banner-status').value = banner.statusId;

    if (banner.imagePath && banner.imagePath !== '') {
        showPreview(banner.imagePath);
    } else {
        hidePreview();
    }

    bannerModal.show();
}

async function saveBanner() {
    const id = parseInt(document.getElementById('banner-id').value);
    const title = document.getElementById('banner-title').value.trim();
    const desc = document.getElementById('banner-desc').value.trim();
    const url = document.getElementById('banner-url').value.trim();
    const statusId = parseInt(document.getElementById('banner-status').value);
    const imagePath = document.getElementById('banner-image-path').value;

    if (!title || !imagePath) {
        showToast("Please provide a title and upload a banner background image.", false);
        return;
    }

    const payload = {
        id: id,
        title: title,
        description: desc,
        url: url,
        statusId: statusId,
        imagePath: imagePath
    };

    const loading = getLoadingToast("Saving banner...");
    loading.showToast();

    try {
        const response = await fetch('../api/admin/banners/save', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        loading.hideToast();

        if (response.ok && result.success) {
            showToast("Banner saved successfully!", true);
            bannerModal.hide();
            loadBanners();
        } else {
            showToast("Failed to save banner: " + result.message, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Server error during save.", false);
    }
}

async function deleteBanner(id) {
    const confirmation = await confirmDelete();
    if (!confirmation) return;

    const loading = getLoadingToast("Deleting banner...");
    loading.showToast();

    try {
        const response = await fetch(`../api/admin/banners/delete?id=${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        loading.hideToast();

        if (response.ok && result.success) {
            showToast("Banner slide deleted!", true);
            loadBanners();
        } else {
            showToast("Failed to delete banner: " + result.message, false);
        }
    } catch (e) {
        loading.hideToast();
        showToast("Server communication error.", false);
    }
}

function confirmDelete() {
    return new Promise(resolve => {
        const modal = document.createElement("div");
        modal.classList.add("modal", "fade");
        modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content rounded-0">
              <div class="modal-header py-2 px-3">
                <span class="modal-title text-dark fs-5 mt-2">Confirm Deletion</span>
              </div>
              <div class="modal-body text-muted py-4 px-3">
                Are you sure you want to permanently delete this banner slide?
              </div>
              <div class="modal-footer py-2 px-3">
                <button id="noBtn" class="btn btn-light px-4">Cancel</button>
                <button id="yesBtn" class="btn btn-danger px-4">Delete</button>
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
