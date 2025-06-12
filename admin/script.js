document.addEventListener('DOMContentLoaded', function() {
    // Configuration initiale
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date-start').value = today;
    document.getElementById('date-end').value = today;
    
    // Gestion des onglets
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add('active');
            
            if(btn.dataset.tab === 'individual') {
                loadIndividualReport();
            } else {
                loadGlobalReport();
            }
        });
    });
    
    // Chargement initial des données
    loadGlobalReport();
    initChart();
    
    // Événements
    document.getElementById('filter-btn').addEventListener('click', function() {
        if(document.querySelector('.tab-btn.active').dataset.tab === 'individual') {
            loadIndividualReport();
        } else {
            loadGlobalReport();
        }
    });
    
    document.getElementById('ouvrier-select').addEventListener('change', loadIndividualReport);
    document.getElementById('export-btn').addEventListener('click', exportToExcel);
});

function loadGlobalReport() {
    const startDate = document.getElementById('date-start').value;
    const endDate = document.getElementById('date-end').value;
    
    fetch(`../api/get-report.php?type=global&start=${startDate}&end=${endDate}`)
        .then(response => response.json())
        .then(data => {
            // Mise à jour des cartes stats
            document.getElementById('presence-rate').textContent = 
                data.presence_rate ? `${data.presence_rate}%` : 'N/A';
            document.getElementById('late-count').textContent = 
                data.total_lates || '0';
            
            // Remplissage du tableau
            const tbody = document.querySelector('#global-report tbody');
            tbody.innerHTML = '';
            
            data.daily_report.forEach(day => {
                const row = `
                    <tr>
                        <td>${day.date}</td>
                        <td>${day.presents}</td>
                        <td>${day.absents}</td>
                        <td>${day.lates}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
            
            // Mise à jour du graphique
            updateChart(data);
        });
}

function loadIndividualReport() {
    const ouvrierId = document.getElementById('ouvrier-select').value;
    const startDate = document.getElementById('date-start').value;
    const endDate = document.getElementById('date-end').value;
    
    fetch(`../api/get-report.php?type=individual&id=${ouvrierId}&start=${startDate}&end=${endDate}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.querySelector('#individual-report tbody');
            tbody.innerHTML = '';
            
            data.report.forEach(entry => {
                const statusClass = entry.status === 'Présent' ? 'status-present' : 
                                  entry.status === 'Absent' ? 'status-absent' : 'status-late';
                
                const row = `
                    <tr>
                        <td>${entry.date}</td>
                        <td>${entry.arrival || 'N/A'}</td>
                        <td>${entry.departure || 'N/A'}</td>
                        <td class="${statusClass}">${entry.status}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
}

let presenceChart;
function initChart() {
    const ctx = document.getElementById('presenceChart').getContext('2d');
    presenceChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Présents',
                    backgroundColor: '#4cc9f0',
                    data: []
                },
                {
                    label: 'Absents',
                    backgroundColor: '#f72585',
                    data: []
                },
                {
                    label: 'Retards',
                    backgroundColor: 'orange',
                    data: []
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true }
            }
        }
    });
}

function updateChart(data) {
    presenceChart.data.labels = data.daily_report.map(day => day.date);
    presenceChart.data.datasets[0].data = data.daily_report.map(day => day.presents);
    presenceChart.data.datasets[1].data = data.daily_report.map(day => day.absents);
    presenceChart.data.datasets[2].data = data.daily_report.map(day => day.lates);
    presenceChart.update();
}

function exportToExcel() {
    const startDate = document.getElementById('date-start').value;
    const endDate = document.getElementById('date-end').value;
    const type = document.querySelector('.tab-btn.active').dataset.tab;
    const ouvrierId = type === 'individual' ? 
        document.getElementById('ouvrier-select').value : 0;
    
    window.open(
        `../api/export-excel.php?type=${type}&start=${startDate}&end=${endDate}&id=${ouvrierId}`,
        '_blank'
    );
}