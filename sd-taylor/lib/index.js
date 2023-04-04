"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.name = void 0;
const koishi_1 = require("koishi");
exports.name = 'sd-taylor';
const headers = {
    "headers": { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64); AppleWebKit/537.36 (KHTML, like Gecko); Chrome/54.0.2840.99 Safari/537.36" }
};
const logger = new koishi_1.Logger(exports.name);
class Taylor {
    constructor(ctx, config) {
        this.ctx = ctx;
        this.config = config;
        this.task = 0;
        this.output = config.output;
        ctx.command('tl <prompt:text>', '文字绘图', { authority: config.min_auth })
            .option('step', '--st <step:number>', { fallback: config.step })
            .option('denoising_strength', '-d <denoising_strength:number>', { fallback: config.denoising_strength })
            .option('seed', '--sd <seed:number>', { fallback: config.seed })
            .option('negative_prompt', '-n <negative_prompt:string>', { fallback: config.negative_prompt })
            .option('resolution', '-r <resolution:string>', { fallback: config.resolution })
            .option('cfg_scale', '-c <cfg_scale:number>', { fallback: config.cfg_scale })
            .option('output', '-o <output:string>', { fallback: config.output })
            .action(async ({ session, options }, prompt) => {
            if (this.isChinese(prompt) && ctx.dvc && config.gpt_translate) {
                prompt = await this.ctx.dvc.translate('英语', prompt);
            }
            else if (this.isChinese(prompt) && !ctx.dvc && config.gpt_translate) {
                session.send(session.text('commands.tl.messages.no-dvc'));
                return session.text('commands.tl.messages.latin-only');
            }
            const [width, height] = (options.resolution ? options.resolution : this.config.resolution).split('x').map(x => { return parseInt(x); });
            const payload = {
                "steps": options.step ? options.step : config.step,
                "width": width,
                "height": height,
                "seed": options.seed ? options.seed : config.seed,
                "cfg_scale": options.cfg_scale ? options.cfg_scale : config.cfg_scale,
                "negative_prompt": options.negative_prompt ? options.negative_prompt : config.negative_prompt,
                "denoising_strength": options.denoising_strength ? options.denoising_strength : config.denoising_strength,
                "prompt": prompt + ', ' + config.defaut_prompt
            };
            if (['minimal', 'default', 'verbose'].includes(options.output)) {
                this.output = options.output ? options.output : this.output;
            }
            return await this.txt2img(session, payload);
        });
        ctx.command('tl.txt <prompt:text>', 'sd识图', { authority: config.min_auth })
            .option('model', '-m <model:string>', { fallback: config.model })
            .option('output', '-o <output:string>', { type: ['minimal', 'default', 'verbose'], fallback: config.output })
            .action(async ({ session, options }, prompt) => {
            this.output = options.output;
            return (0, koishi_1.h)('quote', { id: session.messageId }) + await this.interrogate(session);
        });
        ctx.command('tl.img <prompt:text>', '以图绘图', { authority: config.min_auth })
            .option('step', '--st <step:number>', { fallback: config.step })
            .option('denoising_strength', '-d <denoising_strength:number>', { fallback: config.denoising_strength })
            .option('seed', '--sd <seed:number>', { fallback: config.seed })
            .option('negative_prompt', '-n <negative_prompt:string>', { fallback: config.negative_prompt })
            .option('resolution', '-r <resolution:string>', { fallback: config.resolution })
            .option('cfg_scale', '-c <cfg_scale:number>', { fallback: config.cfg_scale })
            .option('crop', '-C, --no-crop', { value: false, fallback: true })
            .option('upscaler', '-1 <upscaler>', { fallback: 'None' })
            .option('upscaler2', '-2 <upscaler2>', { fallback: 'None' })
            .option('visibility', '-v <visibility:number>', { fallback: 1 })
            .option('upscaleFirst', '-f', { fallback: false })
            .option('output', '-o <output:string>', { fallback: config.output })
            .action(async ({ session, options }, prompt) => {
            if (this.isChinese(prompt) && ctx.dvc && config.gpt_translate) {
                prompt = await this.ctx.dvc.translate('英语', prompt);
            }
            else if (this.isChinese(prompt) && !ctx.dvc && config.gpt_translate) {
                session.send(session.text('commands.tl.messages.no-dvc'));
                return session.text('commands.tl.messages.latin-only');
            }
            const [width, height] = (options.resolution ? options.resolution : this.config.resolution).split('x').map(x => { return parseInt(x); });
            const payload = {
                "steps": options.step,
                "width": width,
                "height": height,
                "seed": options.seed,
                "cfg_scale": options.cfg_scale,
                "negative_prompt": options.negative_prompt,
                "denoising_strength": options.denoising_strength,
                "prompt": prompt + ', ' + config.defaut_prompt
            };
            if (['minimal', 'default', 'verbose'].includes(options.output)) {
                this.output = options.output ? options.output : this.output;
            }
            return await this.img2img(session, payload);
        });
        ctx.command('tl.ext <prompt:text>', '图片超分辨率', { authority: config.min_auth })
            .option('step', '--st <step:number>', { fallback: config.step })
            .option('denoising_strength', '-d <denoising_strength:number>', { fallback: config.denoising_strength })
            .option('seed', '--sd <seed:number>', { fallback: config.seed })
            .option('negative_prompt', '-n <negative_prompt:string>', { fallback: config.negative_prompt })
            .option('resolution', '-r <resolution:string>', { fallback: config.resolution })
            .option('cfg_scale', '-c <cfg_scale:number>', { fallback: config.cfg_scale })
            .option('crop', '-C, --no-crop', { value: false, fallback: true })
            .option('upscaler', '-1 <upscaler>', { fallback: 'None' })
            .option('upscaler2', '-2 <upscaler2>', { fallback: 'None' })
            .option('visibility', '-v <visibility:number>', { fallback: 1 })
            .option('upscaleFirst', '-f', { fallback: false })
            .action(async ({ session, options }, prompt) => {
            if (this.isChinese(session.content)) {
                return session.text('commands.tl.messages.latin-only');
            }
            const [width, height] = (options.resolution ? options.resolution : this.config.resolution).split('x').map(x => { return parseInt(x); });
            const payload = {
                "steps": options.step,
                "width": width,
                "height": height,
                "seed": options.seed,
                "cfg_scale": options.cfg_scale,
                "negative_prompt": options.negative_prompt,
                "denoising_strength": options.denoising_strength,
                "prompt": prompt + ', ' + config.defaut_prompt
            };
            return await this.extras(session, payload, options);
        });
        ctx.command('tl.dvc <prompt:text>', 'gpt识图').action(async ({ session }, prompt) => {
            if (!ctx.dvc)
                return session.text('commands.tl.messages.no-dvc');
            const img_info = await this.interrogate(session);
            return await ctx.dvc.chat_with_gpt([{ role: 'user', content: img_info + prompt }]);
        });
    }
    async txt2img(session, payload) {
        this.task += 1;
        const path = '/sdapi/v1/txt2img';
        session.send(session.text('commands.tl.messages.waiting'));
        const api = `${this.config.api_path}${path}`;
        console.log(api);
        try {
            const resp = await this.ctx.http.post(api, payload, headers);
            const res_img = "data:image/png;base64," + resp.images[0];
            this.cleanUp();
            const parms = resp['parameters'];
            return this.getContent(session, parms, res_img);
        }
        catch (err) {
            logger.warn(err);
            this.cleanUp();
            return String(err);
        }
    }
    async img2img(session, payload) {
        this.task += 1;
        const path = '/sdapi/v1/img2img';
        const api = `${this.config.api_path}${path}`;
        console.log(api);
        const image = koishi_1.segment.select(session.content, "image")[0];
        const img_url = image?.attrs?.url;
        session.send(session.text('commands.tl.messages.waiting'));
        const base64 = await this.img2base64(this.ctx, img_url);
        // 设置payload
        payload["init_images"] = ["data:image/png;base64," + base64];
        try {
            const resp = await this.ctx.http.post(api, payload, headers);
            const info = resp.info;
            const init_img = "data:image/png;base64," + base64;
            const res_img = 'data:image/png;base64,' + resp.images[0];
            this.cleanUp();
            const parms = resp['parameters'];
            return this.getContent(session, parms, res_img);
        }
        catch (err) {
            logger.warn(err);
            this.cleanUp();
            return String(err);
        }
    }
    async interrogate(session) {
        this.task += 1;
        session.send(session.text('.interrogate'));
        const path = '/sdapi/v1/interrogate';
        const image = koishi_1.segment.select(session.content, "image")[0];
        const img_url = image?.attrs?.url;
        const base64 = await this.img2base64(this.ctx, img_url);
        try {
            const resp = (await this.ctx.http.post(`${this.config.api_path}${path}`, { "image": "data:image/png;base64," + base64 })).caption;
            this.cleanUp();
            console.log(resp);
            return resp;
        }
        catch (err) {
            logger.warn(err);
            this.cleanUp();
            return String(err);
        }
    }
    async extras(session, payload, options) {
        this.task += 1;
        session.send(session.text('commands.tl.messages.waiting'));
        const path = '/sdapi/v1/extra-single-image';
        const image = koishi_1.segment.select(session.content, "image")[0];
        const img_url = image?.attrs?.url;
        const base64 = await this.img2base64(this.ctx, img_url);
        const payload_extras = {
            "image": "data:image/png;base64," + base64,
            "resize_mode": 1,
            "show_extras_results": true,
            "upscaling_resize": 2,
            "upscaling_resize_w": 1080,
            "upscaling_resize_h": 780,
            "upscaling_crop": options.crop,
            "upscaler_1": options.upscaler,
            "upscaler_2": options.upscaler2,
            "extras_upscaler_2_visibility": options.visibility,
            "upscale_first": options.upscaleFirst,
        };
        try {
            const resp = await this.ctx.http.post(`${this.config.api_path}${path}`, payload_extras);
            const res_img = 'data:image/png;base64,' + resp.image;
            console.log(resp);
            return koishi_1.segment.image(res_img);
        }
        catch (err) {
            logger.warn(err);
            this.cleanUp();
            return String(err);
        }
    }
    isChinese(s) {
        return /[\u4e00-\u9fa5]/.test(s);
    }
    findInfo(s, ss) {
        const id1 = s.indexOf(ss + ': ');
        const sss = s.slice(id1, -1);
        const id3 = sss.indexOf(',');
        const id2 = sss.indexOf(' ');
        const res = sss.slice(id2 + 1, id3);
        return res;
    }
    getContent(session, parms, image) {
        if (this.output === 'minimal' && image) {
            return koishi_1.segment.image(image);
        }
        const attrs = {
            userId: session.userId,
            nickname: session.author?.nickname || session.username,
        };
        const parms_default = `描述词: ${parms.prompt}\n去噪强度:${parms.denoising_strength}\n种子:   ${parms.seed}\n描述词服从度:${parms.cfg_scale}\步数:   ${parms.steps}`;
        const result = (0, koishi_1.segment)('figure');
        result.children.push((0, koishi_1.segment)('message', attrs, parms_default));
        if (this.output === 'verbose') {
            result.children.push((0, koishi_1.segment)('message', attrs, `info = ${JSON.stringify(parms)}`));
        }
        result.children.push(koishi_1.segment.image(image, attrs));
        return result;
    }
    cleanUp() {
        this.task -= 1;
    }
    async img2base64(ctx, img_url) {
        const buffer = await ctx.http.get(img_url, { responseType: 'arraybuffer', headers });
        const base64 = Buffer.from(buffer).toString('base64');
        return base64;
    }
}
(function (Taylor) {
    Taylor.usage = `
## 注意事项
> 
如需使用gpt识图或gpt翻译，请启用更新davinci-003插件至v1.6.0,并启用
对于部署者行为及所产生的任何纠纷， Koishi 及 koishi-plugin-sd-taylor 概不负责。<br>
如果有更多文本内容想要修改，可以在<a style="color:blue" href="/locales">本地化</a>中修改 zh 内容</br>
## 使用方法
gpt识图: tl.dvc 问题+图片
问题反馈群:399899914
`;
    Taylor.Config = koishi_1.Schema.object({
        api_path: koishi_1.Schema.string().description('服务器地址').required(),
        gpt_translate: koishi_1.Schema.boolean().description('是否启用gpt翻译').default(true),
        min_auth: koishi_1.Schema.number().description('最低使用权限').default(1),
        step: koishi_1.Schema.number().default(20).description('采样步数0-100'),
        denoising_strength: koishi_1.Schema.number().default(0.5).description('改变强度0-1'),
        seed: koishi_1.Schema.number().default(-1).description('种子'),
        maxConcurrency: koishi_1.Schema.number().default(3).description('最大排队数'),
        negative_prompt: koishi_1.Schema.string().description('反向提示词').default('nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry'),
        defaut_prompt: koishi_1.Schema.string().default('masterpiece, best quality').description('默认提示词'),
        resolution: koishi_1.Schema.string().default('720x512').description('默认比例'),
        cfg_scale: koishi_1.Schema.number().default(15).description('相关性0-20'),
        model: koishi_1.Schema.string().default('clip').description('识图的模型'),
        output: koishi_1.Schema.union([
            koishi_1.Schema.const('minimal').description('只发送图片'),
            koishi_1.Schema.const('default').description('发送图片和关键信息'),
            koishi_1.Schema.const('verbose').description('发送全部信息'),
        ]).description('输出方式。').default('default'),
    });
})(Taylor || (Taylor = {}));
exports.default = Taylor;
