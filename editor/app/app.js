const app = Vue.createApp({});

app.component('app-home', {
    data() {
        let paper = `
            腾讯云技术早报 【${this.getDate()}】
            |技术文章|
            
            1．{SUBJECT}
            导语 | {SUMMARY}
            全文链接：{URL}
            
            2．{SUBJECT}
            导语 | {SUMMARY}
            全文链接：{URL}
            
            3．{SUBJECT}
            导语 | {SUMMARY}
            全文链接：{URL}
        `;
        paper = paper.trim().replace(/\n\s+/g, '\n');
        return {
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
            const api = 'https://tdp.rehiy.com/api/article.php?';
            const params = this.ids.map(id => {
                return 'id[]=' + id;
            });
            fetch(api + params.join('&'))
                .then(response => response.json())
                .then(data => {
                    let paper = this.paper;
                    data.forEach(item => {
                        paper = paper.replace('{SUBJECT}', item.subject);
                        paper = paper.replace('{SUMMARY}', item.summary);
                        paper = paper.replace('{URL}', item.url);
                    });
                    this.message = paper;
                });
        },
        checkLinks() {
            // 文章数量
            if (this.items.length != 3) {
                this.notice.push('格式错误，或文章数量不等于3');
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
            this.items = [];
            // 文章-1
            const item1 = this.message.match(/\n1．(.+)\n导语\s\|\s(.+)\n全文链接：(.+\d+)\s*\n+/);
            item1 && this.items.push({
                subject: item1[1], summary: item1[2], link: item1[3],
            });
            // 文章-2
            const item2 = this.message.match(/\n2．(.+)\n导语\s\|\s(.+)\n全文链接：(.+\d+)\s*\n+/);
            item2 && this.items.push({
                subject: item2[1], summary: item2[2], link: item2[3],
            });
            // 文章-3
            const item3 = this.message.match(/\n3．(.+)\n导语\s\|\s(.+)\n全文链接：(.+\d+)\s*\n*/);
            item3 && this.items.push({
                subject: item3[1], summary: item3[2], link: item3[3],
            });
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
                        <input type="number" class="form-control" v-model="ids[0]" />
                        <input type="number" class="form-control ms-3" v-model="ids[1]" />
                        <input type="number" class="form-control ms-3" v-model="ids[2]" />
                        <button class="form-control btn btn-primary ms-3" @click="getArticle()">一键生成</button>
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
