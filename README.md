# vuex-ts

## 说明
此仓库为个人实现的vuex@3.6.2-typescript版本   
如果您想要在您的项目中接入vuex, 请选择官方版本[vuex](https://github.com/vuejs/vuex)  

## 仓库作用
1. [vuex](https://github.com/vuejs/vuex)源码本身没有采用`Flow`或`TypeScript`进行约束。脱离官方文档/测试用例去学习源码时，会有不扎实的感觉。(如果您很熟悉Vuex的使用，当我没说)。
2. 此仓库提供了一个vuex的简易`typescript`版本，覆盖了官方文档提及的, 除了日志插件外的所有API的实现源码。且单元测试通过率100%。
3. 缺陷：对于`state`,`getters`并没有采用严格的类型约束，而是简单的使用了**any**, 此仓库能够帮助您更好地理解vuex源码中各个API的定义及使用方式。但不应该在正式项目中采用。除非您的项目并不需要vuex本身对`state`,`getters`给出类型约束及推断。 

## 目录说明
+ src/vuex：vuex@3.6.2 Typescript实现-个人版
+ src/*：通过vue-cli创建的vue+typescipt开发项目，方便借助vue-dev-tool在实际工程中使用vuex。
+ test/unit：跟vue@3.6.2单元测试相同的Typescipt实现，修改处均添加了有效注释。此项目采用vuex单元测试结果通过率100%

