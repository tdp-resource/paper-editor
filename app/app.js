const app = Vue.createApp({});

app.component('app-home', {
    data() {
        let paper = `
            腾讯云技术早报 【${this.getDate()}】

            * 科技热点
            1．{SUBJECT-0}
            全文链接：{URL-0}
            2．{SUBJECT-1}
            全文链接：{URL-1}

            * 腾讯云技术文章
            1．{SUBJECT-2}
            全文链接：{URL-2}
            2．{SUBJECT-3}
            全文链接：{URL-3}
        `;
        paper = paper.trim().replace(/\n +/g, '\n');
        return {
            items: null,
            paper: paper,
            message: paper.replace(/\{.+\}/g, ''),
            pulling: false,
            pullURL: ['', '', '', ''],
            pullMsg: null
        };
    },
    watch: {
        message(newValue, oldValue) {
            this.pulling || this.pagerParser();
            this.checkArticles();
        }
    },
    methods: {
        getDate() {
            const now = new Date();
            const day = now.getDay();
            let date = now.getDate();
            let month = now.getMonth() + 1;
            date = date < 10 ? '0' + date : date;
            month = month < 10 ? '0' + month : month;
            return month + date + '周' + ['日', '一', '二', '三', '四', '五', '六'][day];
        },
        pagerParser() {
            const items = [];
            let item, message = this.message;
            while (item = message.match(/\d．(.+)\n全文链接：(.+)[\s\n]*/)) {
                message = message.replace(item[0], '');
                items.push({
                    url: item[2].trim(),
                    subject: item[1].trim()
                });
            }
            this.items = items;
        },
        pagerRender() {
            let paper = this.paper;
            this.items.forEach((item, idx) => {
                if (item.subject && item.url) {
                    paper = paper.replace(`{SUBJECT-${idx}}`, item.subject);
                    paper = paper.replace(`{URL-${idx}}`, item.url);
                }
            });
            this.message = paper.replace(/\{.+\}/g, '');
        },
        checkArticles() {
            const allLinks = [];
            this.items.forEach(item => {
                item.urlDuplicate = allLinks.includes(item.url);
                allLinks.push(item.url);
            });
        },
        getArticles() {
            this.pulling = true;
            this.pullMsg = null;
            const params = this.pullURL.map(url => 'url[]=' + encodeURI(url));
            fetch('api/article.php?' + params.join('&'))
                .then(response => response.json())
                .then(data => {
                    const items = [0, 1, 2, 3].map(i => {
                        return data[i] || this.items[i];
                    });
                    this.items = items.filter(v => v);
                    this.pagerRender();
                })
                .catch(err => {
                    this.pullMsg = 2;
                })
                .finally(() => {
                    this.pulling = false;
                });
        },
        getShortURL() {
            if (!localStorage.shortURLPassword) {
                localStorage.shortURLPassword = prompt('请输入密码');
            }
            let passwordNotice = true;
            let count = this.items.length;
            this.items.forEach((v, k) => {
                fetch(`api/shortURL.php?title=${encodeURI(v.subject)}&url=${encodeURI(v.url)}&password=${localStorage.shortURLPassword}`)
                    .then(response => response.json())
                    .then(data => {
                        if (403 === data.code) {
                            localStorage.removeItem('shortURLPassword');
                            passwordNotice && alert(data.msg);
                            passwordNotice = false;
                            return false;
                        } else if (1 === data.code) {
                            alert(data.msg);
                        } else {
                            this.items[k].url = data.url;

                        }
                    })
                    .catch(err => {
                        console.log(err);
                    })
                    .finally(() => {
                        count--;
                        if (0 === count) this.pagerRender();
                    });
            })
        }
    },
    template: `
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <div class="container-xxl justify-content-start">
                <a class="navbar-brand">
                   <img src="assets/images/logo.png" style="height: 50px" />
                </a>
                <div class="text-secondary">技术早报编辑器</div>
            </div>
        </nav>
        <div class="container-xxl mt-3">
            <div class="row flex-md-row flex-column-reverse align-items-start">
                <div class="col-12 col-md-6">
                    <div class="mt-3">
                        <textarea class="form-control lh-lg" v-model="message"></textarea>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="card mt-3">
                        <div class="card-header">
                            从网络获取
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <input type="text" class="form-control" placeholder="科技热点文章 URL1" v-model="pullURL[0]">
                            </div>
                            <div class="mb-3">
                                <input type="text" class="form-control" placeholder="科技热点文章 URL2" v-model="pullURL[1]">
                            </div>
                            <div class="mb-3">
                                <input type="text" class="form-control" placeholder="云+社区文章 URL1" v-model="pullURL[2]">
                            </div>
                            <div class="mb-3">
                                <input type="text" class="form-control" placeholder="云+社区文章 URL2" v-model="pullURL[3]">
                            </div>
                            <div class="text-end">
                                <button class="btn btn-primary ms-3" disabled v-if="pulling">
                                    <span class="spinner-border spinner-border-sm"></span>
                                    正在获取
                                </button>
                                <button class="btn btn-primary ms-3" @click="getArticles()" v-else>生成早报</button>
                                <button class="btn btn-primary ms-3" @click="getShortURL()">转换短链</button>
                            </div>
                        </div>
                    </div>
                    <div class="alert alert-warning mt-3" v-if="pullMsg == 1">
                        文章拉取参数错误
                    </div>
                    <div class="alert alert-warning mt-3" v-if="pullMsg == 2">
                        文章拉取失败，请稍后重试
                    </div>
                    <div class="alert alert-danger mt-3" v-if="items && items.length != 4">
                        文章数量或格式错误；请检查换行、空格是否有冗余。
                    </div>
                    <div class="card mt-3" v-for="item in items">
                        <div class="card-body">
                            <h5 class="card-title">{{item.subject}}</h5>
                            <a class="card-link" target="_blank" :href="item.url" >{{item.url}}</a>
                        </div>
                        <div class="card-footer text-muted">
                            <span class="badge bg-success me-3" v-if="item.subject && item.url && !item.urlDuplicate && !item.starRequired">PASS</span>
                            <span class="badge bg-danger me-3" v-if="!item.subject">标题异常</span>
                            <span class="badge bg-danger me-3" v-if="!item.url">链接异常</span>
                            <span class="badge bg-warning me-3" v-if="item.urlDuplicate">重复</span>
                            <span class="badge bg-primary me-3" v-if="item.starRequired">需关注</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3"></div>
    `
});

app.mount('app-root');
