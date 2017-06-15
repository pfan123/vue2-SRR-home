# VUE 2.0 服务端渲染

## 什么是服务端渲染

服务端渲染（SSR, Server-Side Render）是指通过服务端拉取首屏数据并渲染页面结构，快速响应到客户端，从而降低首屏加载时间、有效降低页面白屏延迟，更好的解决目前前后端分离采用 MV* 框架的 SEO 问题。

## VUE 2.0 服务端渲染

Vue.js 框架是用来构建客户端应用的，默认情况下, Vue 组件生产和操作 DOM 是在浏览器中完成。在 VUE 2.0 之后呈现相同的组件也可在服务器上拼接HTML字符串, 直接发送到浏览器, 快速渲染初始页面结构，页面交互流程在客户端完成。

## VUE 服务端渲染好处：

- 1.更好的SEO，有利于搜索引擎爬虫抓取直出页面
- 2.直出保证用户最先看到基本的内容，减少首屏加载时间
- 3.提高兼容性，vue ie9才支持，而直出兼容性更好

> ps: 如果仅仅是通过 SSR 改善页面的搜索引擎优化，那么你可能想要prerendering代替。而不是使用一个web服务器要编译动态HTML,prerendering只是为特定的路线在构建时生成静态HTML文件。优点是建立prerendering更简单,让你保持你的前端是一个完全静态的网站。如果你使用Webpack,您可以很容易地添加prerendering prerender-spa-plugin。



## Vue 2.0 如何服务端渲染

**1.首先需要安装 `vue-server-renderer`，渲染页面结构**

```
npm install vue vue-server-renderer --save
```

> 注意使用环境
> node v6.0 以上、vue & vue-server-renderer >= 2.3.0、vue-router >= 2.5.0、vue-loader >= 12.0.0 & vue-style-loader >= 3.0.0

2.官方简单上手例子，理解 Vue 直出原理

index.html 前端模版文件
```
<!DOCTYPE html>
<html>
<head>
  <title>My Vue App</title>
  <script src="/assets/vue.js"></script>
</head>
<body>
  <!-- 页面第一次打开，会看到 data-server-rendered="true" 直出标识，代表初始结构由服务端渲染，然后客户端挂载实例会进行替换，而实现的直出方式 -->
  <div id="app"></div>
  <script src="/assets/app.js"></script>
  <script>app.$mount('#app')</script>
</body>
</html>
```

app.js 入口文件（兼容写法，cmd写法提供服务端渲染，this设置全局返回方法提供客户端脚本）

```
(function () { 'use strict'
  var createApp = function () {

    // Vue.extend()组件构造器
    var MyComponent = Vue.extend({
      template: '<div>大家好，{{msg}}我来了</div>',
      data: function () {
        return {
          msg: 'Hello!'   //这里有一个很奇怪的地方，组件构造器生成的组件data数据需要return 返回，而实例new Vue()不需要（主要是处理指针问题）
        }
      },
      created: function(){
        console.log("组件开始创建")
      }
    })

    // 要使用这个组件构造器做的组件，需要用 Vue.component(tag, consturctor)注册--全局注册
    // Vue.component('my-component', MyComponent)


    //客服端渲染其原理是，服务端先把挂载实例渲染出来，记住服务端客服端绑定的元素（简单点说就是id名都是一样的），然后客户端初始实例挂载再替换同样的内容（简单点说服务端先初始实例一遍，做直出渲染，然后客服端挂载再做同样的元素进行替换挂载，由于两者其实一样所以然并软）
    
    return new Vue({
      //template是字符串模版拼接方案
      template: '<div id="app">You have been <my-component></my-component>here for {{ counter }} seconds.</div>',

	  //virtul Dom 方案
      // render: (createElement) => {
      //   return createElement('div',  Array.apply(null, { length: 20 }).map(function () {
      //    console.log(createElement('p', 'hi1'))
      //       return createElement('p', 'hi1')
      //     }))        
      // },
      data: {
        counter: 0
      },

      components: {
        "my-component": MyComponent  //实例局部注册组件
      },

      created: function () {
        var vm = this
        setInterval(function () {
          vm.counter += 1
        }, 1000)
      },
      mounted: function () {
        console.log("开始了，大家好吗")
      }
    })

  }

  if (typeof module !== 'undefined' && module.exports) {
    console.log("服务端执行")
    module.exports = createApp
  } else {
    console.log("客户端执行")
    this.app = createApp()
  }
}).call(this)  
```
server.js 服务端脚本：

```
var fs = require('fs')
var path = require('path')

global.Vue = require('vue')

// Get the HTML layout
var layout = fs.readFileSync('./index.html', 'utf8')

// Create a renderer
var renderer = require('vue-server-renderer').createRenderer()

var express = require('express')
var server = express()

// Serve files from the assets directory
server.use('/assets', express.static(
  path.resolve(__dirname, 'assets')
))

// Handle all GET requests
server.get('*', function (request, response) {
  // Render our Vue app to a string
  renderer.renderToString(
    // Create an app instance
    require('./assets/app')(),
    // Handle the rendered result
    function (error, html) {
      // If an error occurred while rendering...
      if (error) {
        // Log the error in the console
        console.error(error)
        // Tell the client something went wrong
        return response
          .status(500)
          .send('Server Error')
      }
      // Send the layout with the rendered app's HTML
      response.send(layout.replace('<div id="app"></div>', html))
    }
  )
})

// Listen on port 5000
server.listen(5000, function (error) {
  if (error) throw error
  console.log('Server is running at localhost:5000')
})

```

通过阅读，入口 app.js 以及服务端 server.js 脚本，我们发现 `Vue Server-Side Render`原理是相当于有两份入口文件，如 entry-client.js 和 entry-server.js 分别提供给客户端和服务端进行执行，而服务端渲染通过 vue-server-renderer 库进行处理将结构返回至客户端达到直出结构（服务端直出结构挂载点会data-server-rendered="true"属性 ），然后客户端执行 entry-client.js 进行实例挂载，交互处理。

3.Vue 服务端渲染架构

Vue官网的服务端渲染示意图

![Vue 服务端渲染架构](http://7xrig5.com1.z0.glb.clouddn.com/vue2-server-renderer--git.png)

从图上可以看出，ssr 有两个入口文件，client.js 和 server.js， 都包含了应用代码，webpack 通过两个入口文件分别打包成给服务端用的 server bundle 和给客户端用的 client bundle。当服务器接收到了来自客户端的请求之后，会创建一个渲染器 bundleRenderer，这个 bundleRenderer 会读取上面生成的 server bundle 文件，并且执行它的代码， 然后发送一个生成好的 html 到浏览器，等到客户端加载了 client bundle 之后，会和服务端生成的DOM 进行 Hydration(判断这个DOM 和自己即将生成的DOM 是否相同，如果相同就将客户端的vue实例挂载到这个DOM上， 否则会提示警告)。

## Vue 2.0 服务端渲染之数据预拉取存储 state

Vue 2.0 服务端渲染其中最核心的过程就是 **服务端对数据预拉取，然后将数据使用 Vuex 进行管理更新存储 state**

如果应用程序依赖于一些异步数据，这些数据之前需要预取和解决我们开始渲染过程


vue服务端渲染步骤

1.通过Express Web服务器实现简单的服务端渲染

2.流式响应模式

3.组件缓存

* vue-server-renderer 文档:更多细节在这里，和更多先进的主题一起的文档。 例如 preventing cross-request contamination 和 添加独立的服务构建
* vue-hackernews-2.0: 明确整合了 所有主要的Vue库和概念在单个应用中





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

[谷歌推新版本Firebase：移动和Web开发的完整后端解决方案](http://www.infoq.com/cn/news/2016/05/google-firebase)

[Vue2.0服务端渲染: 博客前台升级记录](https://smallpath.me/post/vue-ssr-log)  

[Vue2服务端渲染实践以及相关解读](https://juejin.im/post/5907fc6da0bb9f00650d59a1)

[简易的基于react_server服务端渲染的的实例](https://github.com/xiaomiwujiecao/react-server-example)

[无痛学会各种 2 的 Vue2+Vuex2+Webpack2 前后端同构渲染](https://segmentfault.com/a/1190000007244289)

[Vue 2 服务端渲染初探](https://segmentfault.com/a/1190000006701796)
