const app = Vue.createApp({});

app.component('app-home', {
    data() {
        let paper = `
            腾讯云技术早报 【${this.getDate()}】

            * 科技热点
            1．{SUBJECT-1}
            全文链接：{URL-1}
            2．{SUBJECT-2}
            全文链接：{URL-2}

            * 腾讯云技术文章
            1．{SUBJECT-3}
            全文链接：{URL-3}
            2．{SUBJECT-4}
            全文链接：{URL-4}
        `;
        paper = paper.trim().replace(/\n +/g, '\n');
        return {
            doing: false,
            ids: ['', ''],
            items: [],
            notice: [],
            paper: paper,
            message: paper.replace(/\{.+\}/g, '')
        };
    },
    watch: {
        message(newValue, oldValue) {
            this.notice = [];
            this.parserPaper();
            this.checkLinks();
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
            this.doing = true;
            const api = '/api/article.php?';
            const params = this.ids.map(id => {
                return 'id[]=' + id;
            });
            fetch(api + params.join('&'))
                .then(response => response.json())
                .then(data => {
                    let idx = 3;
                    let paper = this.paper;
                    data.forEach(item => {
                        paper = paper.replace(`{SUBJECT-${idx}}`, item.subject);
                        paper = paper.replace(`{URL-${idx}}`, item.url);
                        idx++;
                    });
                    this.message = paper.replace(/\{.+\}/g, '');
                })
                .catch(err => {
                    this.notice.push('文章拉取失败。');
                    console.log('文章拉取失败。', err);
                })
                .finally(() => {
                    this.doing = false;
                });
        },
        checkLinks() {
            // 检测重复
            const duplicates = [];
            this.items.forEach(item => {
                item.NoDuplicate = duplicates.includes(item.link);
                duplicates.push(item.link);
            });
            // 检测数量
            if (this.items.length != 4) {
                this.notice.push('文章数量不正确，或格式错误；请检查换行、空格是否有冗余。');
            }
        },
        parserPaper() {
            let item;
            let message = this.message;
            const findExp = /\d．(.+)\n全文链接：(http.+\d+)[\s\n]*/;
            this.items = [];
            while (item = message.match(findExp)) {
                this.items.push({ subject: item[1], link: item[2] });
                message = message.replace(findExp, '');
            }
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
                            <button class="form-control btn btn-secondary ms-3" v-if="doing">Loading</button>
                            <button class="form-control btn btn-primary ms-3" @click="yunPlusArticle()" v-else>确定</button>
                        </div>
                    </div>
                    <div class="alert alert-danger mt-3" v-if="notice.length > 0">
                        <div v-for="n in notice">{{n}}</div>
                    </div>
                    <div class="card mt-3" v-for="item in items">
                        <div class="card-body">
                            <h5 class="card-title">{{item.subject}}</h5>
                            <a class="card-link" target="_blank" :href="item.link" >{{item.link}}</a>
                        </div>
                        <div class="card-footer text-muted">
                            <span class="badge bg-success me-3" v-if="!item.StarRequired && !item.NoDuplicate">Success</span>
                            <span class="badge bg-warning me-3" v-if="item.StarRequired">需要关注后才能阅读</span>
                            <span class="badge bg-danger me-3" v-if="item.NoDuplicate">检测到重复的文章链接</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3"></div>
    `
});

app.mount('app-root');
