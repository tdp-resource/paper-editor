<?php
header('Content-Type: application/json; charset=utf-8');

$config = parse_ini_file(__DIR__ . '/../.env', true)['short_url'];

if (isset($config['password'])) {
    if (empty($_GET['password'])) {
        exit(json_encode(['code' => 403, 'msg' => '密码不能为空'], JSON_UNESCAPED_UNICODE));
    } elseif ($config['password'] != $_GET['password']) {
        exit(json_encode(['code' => 403, 'msg' => '密码错误'], JSON_UNESCAPED_UNICODE));
    }
}

if (empty($_GET['title'])) {
    exit(json_encode(['code' => 1, 'msg' => '标题不能为空'], JSON_UNESCAPED_UNICODE));
}

if (empty($_GET['url'])) {
    exit(json_encode(['code' => 1, 'msg' => '链接不能为空'], JSON_UNESCAPED_UNICODE));
}

$query = http_build_query([
    'dwz_title'    => $_GET['title'],
    'dwz_url'      => $_GET['url'],
    'dwz_reditype' => $config['reditype'],
    'dwz_yxq'      => $config['expire'],
    'dwz_type'     => $config['type'],
    'dwz_keynum'   => $config['length'],
    'api_key'      => $config['key'],
]);
$url = $config['server'] . '/api/creat.php?' . $query;

$ch = curl_init($url);

curl_setopt($ch, CURLOPT_HEADER, 0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

list($response, $errno, $error) = [curl_exec($ch), curl_errno($ch), curl_error($ch), curl_close($ch)];
if (0 !== $errno) {
    exit(json_encode(['code' => 1, 'msg' => '服务端错误[' . $errno . ']:' . $error], JSON_UNESCAPED_UNICODE));
}

$json = json_decode($response, true);
if (JSON_ERROR_NONE !== json_last_error()) {
    exit(json_encode(['code' => 1, 'msg' => '解码服务端内容失败', 'response' => $response], JSON_UNESCAPED_UNICODE));
}

if (100 == $json['code']) {
    exit(json_encode(['code' => 0, 'msg' => '创建成功', 'url' => $json['url']], JSON_UNESCAPED_UNICODE));
} else {
    exit(json_encode(['code' => 1, 'msg' => $json['msg']], JSON_UNESCAPED_UNICODE));
}