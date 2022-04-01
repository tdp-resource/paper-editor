<?php

class YunPlus
{
    private $url;
    private $html;

    private $document;
    private $xpath;

    public function getArticle($url, $full = 0)
    {
        if (empty($url)) {
            return [
                'url' => '',
                'subject' => '',
                'summary' => '',
                'content' => '',
                'starRequired' => false,
            ];
        }

        if (is_numeric($url)) {
            $url = 'https://cloud.tencent.com/developer/article/' . $url;
        }
        $this->xpathInit($url);

        if (0 === strpos($url, 'https://cloud.tencent.com/developer/article')) {
            // 腾讯云+社区
            $subject = $this->xpathQuery('//h1[@class="article-title J-articleTitle"]');
            $content = $this->xpathQuery('//div[@class="rno-markdown J-articleContent"]');
            $starRequired = false !== strpos($this->html, '关注作者，阅读全部精彩内容');
        } elseif (strpos($url, 'sina.com.cn')) {
            // 新浪新闻
            $subject = $this->xpathQuery('//h1[@class="main-title"]');
            $content = $this->getDescription();
        } elseif (strpos($url, 'new.qq.com')) {
            [$subject, $content] = array_map(function($v) {return $this->convertEncoding($v);}, $this->getInfoFormHead());
        } else {
            $subject = $this->getTitle();
            $content = $this->getDescription();
        }

        $summary = mb_substr(trim(str_replace("\n", "", strip_tags($content))), 0, 100);

        return [
            'url' => $this->url,
            'subject' => trim(strip_tags($subject)),
            'summary' => $summary,
            'content' => $full ? $content : '',
            'starRequired' => $starRequired ?? false,
        ];
    }

    public function convertEncoding($str) {
        if (mb_check_encoding($str, 'UTF-8')) return $str;
        $str = mb_convert_encoding($str, 'UTF-8', 'GB18030');
        return false === $str ? '' : $str;
    }

    /**
     * 从head里获取文章信息（DOMDocument对utf-8之外的网页处理不大行）
     */
    private function getInfoFormHead($convertEncoding = true)
    {
        $subject = preg_match('@title>(.*)</@', $this->html, $matches) ? $matches[1] : '';
        $description = preg_match('@name="description\S\s+content="(.*)"@', $this->html, $matches) ? $matches[1] : '';
        $data = [$subject, $description];
        if ($convertEncoding) {
            $data = array_map(function($v) {
                return $this->convertEncoding($v);
            }, $data);
        }

        return $data;
    }

    /**
     * 获取标题
     */
    private function getTitle()
    {
        $find = $this->xpath->query('//meta[@property="og:title"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        $find = $this->xpath->query('//meta[@property="twitter:title"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        $find = $this->xpath->query('//title');
        if ($find && $find->count() > 0) {
            return $find->item(0)->textContent;
        }

        return '获取失败';
    }

    /**
     * 获取简介
     */
    private function getDescription()
    {
        $find = $this->xpath->query('//meta[@property="og:description"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        $find = $this->xpath->query('//meta[@property="twitter:description"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        $find = $this->xpath->query('//meta[@name="description"]');
        if ($find && $find->count() > 0) {
            return $find->item(0)->attributes->getNamedItem('content')->textContent;
        }

        return '获取失败';
    }

    private function xpathInit($url)
    {
        $this->url = $url;
        $this->html = $this->httpRequest($url);

        $this->document = new DOMDocument();
        $this->document->loadHTML('<?xml version="1.0" encoding="UTF-8"?>' . $this->html, LIBXML_NOERROR);
        $this->document->normalize();

        $this->xpath = new DOMXPath($this->document);
    }

    private function xpathQuery($rule, $i = 0)
    {
        $nodeList = $this->xpath->query($rule);
        if (isset($nodeList[$i])) {
            return $this->document->saveHTML($nodeList[$i]);
        }
    }

    private function httpRequest($url)
    {
        if (isset($_ENV['PROXY_URL'])) {
            $url = $_ENV['PROXY_URL'] . urlencode($url);
        }

        $ch = curl_init($url);

        $header = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.74 Safari/537.36 Edg/99.0.1150.46'
        ];

        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $header);

        list($res, $err) = [curl_exec($ch), curl_errno($ch), curl_close($ch)];

        return $err ? '' : $res;
    }
}
