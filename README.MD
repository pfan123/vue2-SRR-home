#VUE 2.0 服务端渲染

## 什么是服务端渲染

服务端渲染（SSR, Server-Side Render）是指通过服务端拉取首屏数据并渲染页面结构，快速响应到客户端，从而降低首屏加载时间、有效降低页面白屏延迟，更好的解决目前前后端分离采用 MV* 框架的 SEO 问题。

## VUE 2.0 服务端渲染

Vue.js 框架是用来构建客户端应用的，默认情况下, Vue 组件生产和操作 DOM 是在浏览器中完成。在 VUE 2.0 之后呈现相同的组件也可在服务器上拼接HTML字符串, 直接发送到浏览器, 快速渲染初始页面结构，页面交互流程在客户端完成。

## VUE 服务端渲染好处：

- 1.更好的SEO，有利于搜索引擎爬虫抓取直出页面
- 2.直出保证用户最先看到基本的内容，减少首屏加载时间
- 3.提高兼容性，vue ie9才支持，而直出兼容性更好

> 服务端渲染 对比 预渲染(Prerendering)
可以使用webpack插件 [“prerender-spa-plugin”](https://www.npmjs.com/package/prerender-spa-plugin) 添加预渲染。

vue服务端渲染步骤

1.通过Express Web服务器实现简单的服务端渲染

2.流式响应模式

3.组件缓存

* vue-server-renderer 文档:更多细节在这里，和更多先进的主题一起的文档。 例如 preventing cross-request contamination 和 添加独立的服务构建
* vue-hackernews-2.0: 明确整合了 所有主要的Vue库和概念在单个应用中


Vue2.0服务端渲染: 博客前台升级记录  https://smallpath.me/post/vue-ssr-log

Vue 2.0 服务端渲染怎么玩？https://blog.alphatr.com/how-to-use-ssr-in-vue-2.0.html

全栈开发实战：用Vue2+Koa1开发完整的前后端项目（更新Koa2）https://molunerfinn.com/Vue+Koa/

Vue2服务端渲染实践以及相关解读  https://juejin.im/post/5907fc6da0bb9f00650d59a1

https://github.com/xiaomiwujiecao/react-server-example

 VUE + VUEX + FIREBASE + BULMA … 实现的 SPA SSR项目 
https://github.com/beauty-enjoy/beauty

vue服务端渲染文档
vue2.0 ssr服务端指南  https://ssr.vuejs.org/en/
官方demo https://github.com/vuejs/vue-hackernews-2.0

谷歌推新版本Firebase：移动和Web开发的完整后端解决方案
http://www.infoq.com/cn/news/2016/05/google-firebase

https://ssr.vuejs.org/en/
渲染 API
createRenderer([rendererOptions]) 
* renderer.renderToString(vm, cb) 
* renderer.renderToStream(vm) 

createBundleRenderer(code, [rendererOptions]) 
* bundleRenderer.renderToString([context], cb) 
* bundleRenderer.renderToStream([context]) 
Happypack、 DLLPlugin 优化webpack速度



参考资料：
[Vue2.0 SSR 完全指南](https://ssr.vuejs.org/)
[Vue2.0 SSR 官方示例](https://github.com/vuejs/vue-hackernews-2.0)
[实测 Vue SSR 的渲染性能：避开 20 倍耗时](https://juejin.im/entry/59020c1744d90400690f6cfd)
