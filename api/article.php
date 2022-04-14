<?php

header('HTTP/1.1 200 OK');
header('Content-Type: application/json; charset=utf-8');

$url = $_GET['url'] ?? '';

if (empty($url)) {
    exit(json_encode(['error' => '参数错误'], 320));
}

$enf = dirname(__DIR__) . '/.env';
if (is_file($enf)) {
    $_ENV += parse_ini_file($enf);
}

require_once __DIR__ . '/class/YunPlus.php';

$plus = new YunPlus();

$data = [];

foreach ((array)$url as $u) {
    $data[] = $plus->getArticle($u);
}

echo json_encode($data, 320);
