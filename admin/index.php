<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Suivi Présence</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard">
        <header>
            <h1>Tableau de Bord des Présences</h1>
            <div class="header-actions">
                <div class="date-filter">
                    <input type="date" id="date-start">
                    <input type="date" id="date-end">
                    <button id="filter-btn">Filtrer</button>
                </div>
                <button id="export-btn">Exporter Excel</button>
                
                    <p class="help"> <a href="https://wa.me/22953043748" class="help-link"> Obtenir une assistance </a> </p>
            </div>
        </header>

        <div class="main-content">
            <div class="stats-cards">
                <div class="card">
                    <h3>Taux de Présence</h3>
                    <div class="value" id="presence-rate">0%</div>
                </div>
                <div class="card">
                    <h3>Retards</h3>
                    <div class="value" id="late-count">0</div>
                </div>
            </div>

            <div class="chart-container">
                <canvas id="presenceChart"></canvas>
            </div>

            <div class="tabs">
                <button class="tab-btn active" data-tab="global">Rapport Global</button>
                <button class="tab-btn" data-tab="individual">Par Ouvrier</button>
            </div>

            <div class="tab-content active" id="global-tab">
                <table id="global-report">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Présents</th>
                            <th>Absents</th>
                            <th>Retards</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>

            <div class="tab-content" id="individual-tab">
                <select id="ouvrier-select">
                    <?php
                    require_once 'functions.php';
                    $ouvriers = getOuvriers();
                    foreach ($ouvriers as $ouvrier) {
                        echo "<option value='{$ouvrier['id']}'>{$ouvrier['nom']}</option>";
                    }
                    ?>
                </select>
                <table id="individual-report">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Arrivée</th>
                            <th>Départ</th>
                            <th>Statut</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>