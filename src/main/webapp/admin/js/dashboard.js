// Dashboard Script

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
});

async function loadDashboardStats() {
    try {
        const response = await fetch('../api/admin/dashboard/stats');
        const result = await response.json();

        if (response.ok && result.success) {
            const data = result.data;

            // Set stats values
            document.getElementById('stats-total-sales').textContent = formatLkr(data.totalSales);
            document.getElementById('stats-total-orders').textContent = data.totalOrders;
            document.getElementById('stats-total-customers').textContent = data.totalCustomers;
            document.getElementById('stats-low-stock').textContent = data.lowStockAlerts;

            // Render Chart
            renderSalesChart(data.chartLabels, data.chartData);

            // Render Recent Orders
            renderRecentOrders(data.recentOrders);
        } else {
            showToast("Failed to load stats: " + result.message, false);
        }
    } catch (e) {
        console.error("Error loading dashboard stats:", e);
        showToast("Server connection error while loading dashboard", false);
    }
}

function renderSalesChart(labels, data) {
    const ctx = document.getElementById('salesChart').getContext('2d');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (LKR)',
                data: data,
                backgroundColor: 'rgba(17, 17, 17, 0.05)',
                borderColor: '#111111',
                borderWidth: 2,
                pointBackgroundColor: '#111111',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        font: {
                            family: 'Jost'
                        },
                        callback: function (value) {
                            return 'LKR ' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Jost'
                        }
                    }
                }
            }
        }
    });
}

function renderRecentOrders(orders) {
    const container = document.getElementById('recent-orders-container');
    if (!orders || orders.length === 0) {
        container.innerHTML = `<tr><td colspan="3" class="text-center text-muted py-4">No recent orders found.</td></tr>`;
        return;
    }

    container.innerHTML = '';
    orders.forEach(o => {
        container.innerHTML += `
        <tr>
            <td>
                <span class="fw-semibold text-dark">${o.orderCode}</span><br>
                <small class="text-muted">${o.orderDate}</small>
            </td>
            <td>${formatLkr(o.totalAmount)}</td>
            <td>${getStatusBadge(o.status)}</td>
        </tr>
        `;
    });
}
