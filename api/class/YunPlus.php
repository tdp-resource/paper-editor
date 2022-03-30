<?php
error_reporting(E_ALL);

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
            $nodeList = $this->xpath->query('//meta[@name="description"]');
            $content = $nodeList->length ? $nodeList[0]->attributes->getNamedItem('content')->textContent : '';
        } elseif (strpos($url, 'new.qq.com')) {
            [$subject, $content] = $this->getInfoFormHead();
        } else {
            $subject = $this->xpathQuery('//title');
            $nodeList = $this->xpath->query('//meta[@name="description"]');
            $content = $nodeList->length ? $nodeList[0]->attributes->getNamedItem('content')->textContent : '';
            
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

    private function getInfoFormHead()
    {
        $subject = preg_match('@title>(.*)</@', $this->html, $matches) ? $matches[1] : '';
        $description = preg_match('@name="description\S\s+content="(.*)"@', $this->html, $matches) ? $matches[1] : '';
        return [$subject, $description];
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
