# vuex-ts

## 说明
此仓库为个人实现的vuex@3.6.2-typescript版本   
如果您想要在您的项目中接入vuex, 请选择官方版本[vuex](https://github.com/vuejs/vuex)  

## 作用
vuex源码是JavaScript编写的, 且没有采用`flow`或`typescript`。在开发vuex相关项目或者调试vuex源码时，
不得不一边开着API文档一边调试，更稳妥的做法应该是从源码反推文档，毕竟源码是100%, 转换成文档时中间有"熵增"。  
此仓库提供了一个vuex的简易`typescript`版本，覆盖了官方文档提及的所有API的实现源码，尽管在`state`,`getters`以及
部分API的实现上类型约束较为宽泛(any), 但优势在于，调试`vuex`源码时，可以大大降低对文档的依赖程度，单独从源码出发
更好的理解vuex的实现以及vuex中涉及概念的定义。  

## 阅读须知
1. 在实现过程大部分参照了vuex/types下的声明文件，但约束程度大大降低，更好理解的同时，也导致此项目并不能支持在正式的开发中采用，
因此，无论你是开发JavaScript或TypeScript的`Vue`项目，请采用vuex官方库, 如果您更青睐compositionAPI, 请选用Pinia。  

2. 具体`vuex`实现参照此仓库**vuex**目录, 您可以拷贝此仓库，然后像一个普通的Vue项目一样进行调试。  

3. 项目中counter.vue, store目录是为了测试API所携带的代码，您可以参考，或者是书写您自己的功能实例。  

## 依赖项
- Vue@2.6.14  
- Vue-cli@5  

