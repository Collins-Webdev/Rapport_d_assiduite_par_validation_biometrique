<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$connexion = new mysqli("localhost", "root", "", "badge_scan_db");

if ($connexion->connect_error) {
    die(json_encode(['success' => false, 'error' => 'Erreur de connexion à la BDD']));
}

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['qr_code'])) {
    echo json_encode(['success' => false, 'error' => 'QR code manquant']);
    exit;
}

$qrCode = $connexion->real_escape_string($data['qr_code']);
$typeScan = isset($data['type_scan']) && in_array($data['type_scan'], ['entrée', 'sortie']) 
    ? $connexion->real_escape_string($data['type_scan'])
    : 'entrée';

// Trouver l'ouvrier
$result = $connexion->query("SELECT id, nom FROM ouvriers WHERE qr_code = '$qrCode'");

if ($result->num_rows === 0) {
    echo json_encode(['success' => false]);
    exit;
}

$ouvrier = $result->fetch_assoc();

// Enregistrer le scan
$insert = $connexion->query("
    INSERT INTO scans (ouvrier_id, type_scan) 
    VALUES ({$ouvrier['id']}, '$typeScan')
");

if ($insert) {
    echo json_encode(['success' => true, 'nom' => $ouvrier['nom']]);
} else {
    echo json_encode(['success' => false, 'error' => $connexion->error]);
}

$connexion->close();
?>