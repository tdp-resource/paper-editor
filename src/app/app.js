const app = Vue.createApp({});

app.component('app-home', {
    data() {
        const message = `
            腾讯云技术早报 【${this.getDate()}】
            |技术文章|
            
            1．
            导语 | 
            全文链接： 
            
            2．
            导语 | 
            全文链接：
            
            3．
            导语 | 
            全文链接：
        `;
        return {
            notice: '',
            message: message.trim().replace(/\n\s+/g, '\n')
        };
    },
    watch: {
        message(newValue, oldValue) {
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
        parserPaper() {
            const links = this.message.match(/https:\/\/cloud.tencent.com\/developer\/article\/\d+/g);
        },
        checkLinks() {
            const links = this.message.match(/https:\/\/cloud.tencent.com\/developer\/article\/\d+/g);
            // 检测链接
            if (!links) {
                this.notice = '未检测到文章链接';
                return false;
            }
            // 检测重复
            const nodup = [];
            links.forEach(item => {
                nodup.includes(item) || nodup.push(item);
            })
            if (links.length !== nodup.length) {
                this.notice = '检测到重复的文章链接，请注意！'
                return false;
            }
            // 通过检测
            this.notice = '';
            return true;
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
                <div class="col-12 col-md-8">
                    <div class="mb-3">
                        <textarea class="form-control lh-lg" v-model="message"></textarea>
                    </div>
                </div>
                <div class="col-12 col-md-4">
                    <div class="card">
                        <div class="card-header">提示</div>
                        <div class="card-body text-danger" v-if="notice">
                            {{notice}}
                        </div>
                        <div class="card-body" v-else>
                            天天开心~
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="mt-3"></div>
    `
});

app.mount('app-root');
