const app = Vue.createApp({});

app.component('app-home', {
    data() {
        let paper = `
            腾讯云技术早报 【${this.getDate()}】

            * 科技热点

            1．{SUBJECT-1}
            导语 | {SUMMARY-1}
            全文链接：{URL-1}
            
            2．{SUBJECT-2}
            导语 | {SUMMARY-2}
            全文链接：{URL-2}

            * 腾讯云技术文章

            1．{SUBJECT-3}
            导语 | {SUMMARY-3}
            全文链接：{URL-3}
            
            2．{SUBJECT-4}
            导语 | {SUMMARY-4}
            全文链接：{URL-4}
        `;
        paper = paper.trim().replace(/\n +/g, '\n');
        return {
            doing: false,
            ids: ['', '', ''],
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
        getArticle() {
            this.doing = true;
            const api = '/api/article.php?';
            const params = this.ids.map(id => {
                return 'id[]=' + id;
            });
            fetch(api + params.join('&'))
                .then(response => response.json())
                .then(data => {
                    let paper = this.paper;
                    data.forEach((item, idx) => {
                        idx = idx + 3;
                        paper = paper.replace(`{SUBJECT-${idx}}`, item.subject);
                        paper = paper.replace(`{SUMMARY-${idx}}`, item.summary);
                        paper = paper.replace(`{URL-${idx}}`, item.url);
                    });
                    this.message = paper.replace(/\{.+\}/g, '');
                    this.doing = false;
                });
        },
        checkLinks() {
            // 文章数量
            if (this.items.length != 4) {
                this.notice.push('文章数量不正确，或格式错误。请检查换行、空格是否有冗余。');
            }
            // 检测链接
            const links = [];
            this.items.forEach(item => {
                if (links.includes(item.link)) {
                    this.notice.push('检测到重复的文章链接，请注意！');
                } else {
                    links.push(item.link);
                }
            });
        },
        parserPaper() {
            let item;
            let message = this.message;
            const findExp = /\d．(.+)\n导语\s\|\s(.+)\n全文链接：(.+\d+)[\s\n]*/;
            this.items = [];
            while (item = message.match(findExp)) {
                message = message.replace(findExp, '');
                this.items.push({
                    subject: item[1], summary: item[2], link: item[3],
                });
            }
        }
    },
    template: `
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <div class="container-fluid justify-content-start">
                <a class="navbar-brand">
                   <img src="assets/images/logo.png" style="height: 50px" />
                </a>
                <div class="text-secondary">技术早报编辑器</div>
            </div>
        </nav>
        <div class="container-xxl mt-3">
            <div class="row align-items-start">
                <div class="col-12 col-md-6">
                    <div class="mt-3">
                        <textarea class="form-control lh-lg" v-model="message"></textarea>
                    </div>
                </div>
                <div class="col-12 col-md-6">
                    <div class="d-flex flex-row mt-3">
                        <input type="number" class="form-control" placeholder="文章Id 1" v-model="ids[0]" />
                        <input type="number" class="form-control ms-3" placeholder="文章Id 2" v-model="ids[1]" />
                        <button class="form-control btn btn-secondary ms-3" v-if="doing">Loading</button>
                        <button class="form-control btn btn-primary ms-3" @click="getArticle()" v-else>拉取</button>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header">提示</div>
                        <div class="card-body text-danger" v-if="notice.length > 0">
                            <div v-for="n in notice">{{n}}</div>
                        </div>
                        <div class="card-body" v-else>
                            天天开心~
                        </div>
                    </div>
                    <div class="card mt-3" v-for="item in items">
                        <div class="card-body">
                            <h5 class="card-title">{{item.subject}}</h5>
                            <p class="card-text">{{item.summary}}</p>
                            <a class="card-link" target="_blank" :href="item.link" >{{item.link}}</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3"></div>
    `
});

app.mount('app-root');
