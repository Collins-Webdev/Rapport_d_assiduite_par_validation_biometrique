<?php
function connectDB() {
    $conn = new mysqli("localhost", "root", "", "badge_scan_db");
    if ($conn->connect_error) die("Échec de connexion: " . $conn->connect_error);
    return $conn;
}

function getOuvriers() {
    $conn = connectDB();
    $result = $conn->query("SELECT id, nom FROM ouvriers");
    return $result->fetch_all(MYSQLI_ASSOC);
}
?>