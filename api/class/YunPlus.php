<?php

class YunPlus
{
    private $url;
    private $html;

    private $document;
    private $xpath;

    public function getArticle($url, $full = 0)
    {
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
            $nodeList = $this->xpath->query('//meta[@name="description"]');
            $content = $nodeList->length ? $nodeList[0]->attributes->getNamedItem('content')->textContent : '';
        } else {
            $subject = $content = '';
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

    private function xpathInit($url)
    {
        $this->url = $url;
        $this->html = $this->httpRequest($url);

        $this->document = new DOMDocument();
        $this->document->loadHTML($this->html, LIBXML_NOERROR);
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

        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 6);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);

        list($res, $err) = [curl_exec($ch), curl_errno($ch), curl_close($ch)];

        return $err ? '' : $res;
    }
}
