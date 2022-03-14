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
            pulling: false,
            ids: ['', ''],
            items: [],
            notice: [],
            paper: paper,
            message: paper.replace(/\{.+\}/g, '')
        };
    },
    watch: {
        message(newValue, oldValue) {
            this.pulling || this.pagerParser();
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
        yunPlusArticle() {
            this.notice = [];
            this.pulling = true;
            const api = 'api/article.php?';
            const params = this.ids.map(id => {
                return 'id[]=' + id;
            });
            fetch(api + params.join('&'))
                .then(response => response.json())
                .then(data => {
                    this.items[0] || (this.items[0] = {});
                    this.items[1] || (this.items[1] = {});
                    data[0] && (this.items[2] = data[0]);
                    data[1] && (this.items[3] = data[1]);
                    this.pagerRender();
                })
                .catch(err => {
                    this.notice.push('文章拉取失败。');
                    console.log('文章拉取失败。', err);
                })
                .finally(() => {
                    this.pulling = false;
                });
        },
        checkLinks() {
            this.notice = [];
            // 检测重复
            const duplicates = [];
            this.items.forEach(item => {
                item.NoDuplicate = !duplicates.includes(item.url);
                duplicates.push(item.url);
            });
            // 检测数量
            if (this.items.length != 4) {
                this.notice.push('文章数量不正确，或格式错误；请检查换行、空格是否有冗余。');
            }
        },
        pagerParser() {
            this.items = [];
            let item, message = this.message;
            const findExp = /\d．(.+)\n全文链接：(http.+\d+)[\s\n]*/;
            while (item = message.match(findExp)) {
                this.items.push({ subject: item[1], url: item[2] });
                message = message.replace(findExp, '');
            }
            this.checkLinks();
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
            this.checkLinks();
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
                            从 <a href="https://cloud.tencent.com/developer" target="_blank">云+社区</a> 拉取
                        </div>
                        <div class="d-flex flex-row m-3">
                            <input type="number" class="form-control" placeholder="文章Id 1" v-model="ids[0]" />
                            <input type="number" class="form-control ms-3" placeholder="文章Id 2" v-model="ids[1]" />
                            <button class="form-control btn btn-secondary ms-3" v-if="pulling">Pulling</button>
                            <button class="form-control btn btn-primary ms-3" @click="yunPlusArticle()" v-else>确定</button>
                        </div>
                    </div>
                    <div class="alert alert-danger mt-3" v-if="notice.length > 0">
                        <div v-for="n in notice">{{n}}</div>
                    </div>
                    <div class="card mt-3" v-for="item in items">
                        <div class="card-body">
                            <h5 class="card-title">{{item.subject}}</h5>
                            <a class="card-link" target="_blank" :href="item.url" >{{item.url}}</a>
                        </div>
                        <div class="card-footer text-muted">
                            <span class="badge bg-success me-3" v-if="item.subject && item.url && item.NoDuplicate && !item.StarRequired">PASS</span>
                            <span class="badge bg-danger me-3" v-if="!item.subject">标题异常</span>
                            <span class="badge bg-danger me-3" v-if="!item.url">链接异常</span>
                            <span class="badge bg-warning me-3" v-if="!item.NoDuplicate">重复</span>
                            <span class="badge bg-primary me-3" v-if="item.StarRequired">需关注</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3"></div>
    `
});

app.mount('app-root');
