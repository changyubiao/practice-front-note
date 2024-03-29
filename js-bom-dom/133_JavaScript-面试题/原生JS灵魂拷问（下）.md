# 原生JS灵魂之问(下), 冲刺🚀

<p style="color:red;">
    【隔壁王校长注解】<br>
    此文章为我的学生神三元同学首次在《掘金》小册上编写，总结了关于原生JS准备面试时需要了解的知识点。本篇文章建议学习时间1小时。
</p>

笔者最近在对原生JS的知识做系统梳理，因为我觉得JS作为前端工程师的根本技术，学再多遍都不为过。打算来做一个系列，一共分三次发，以一系列的问题为驱动，当然也会有追问和扩展，内容系统且完整，对初中级选手会有很好的提升，高级选手也会得到复习和巩固。这是本系列的第三篇。

本次分享的主题是`JS执行原理`和`深入异步`，是一块比较系统且有深度的内容，相信对进阶的小伙伴是一个很大的提升。之前说过要写`设计模式`，但笔者越来越感觉这是一块系统性的工程，算上实际的应用场景，知识体量不会亚于`JS`本身，因此我打算之后另外开一个专题`程序设计模式灵魂之问`，敬请关注。



## 第24篇: JavaScript内存机制之问——数据是如何存储的？

网上的资料基本是这样说的: 基本数据类型用`栈`存储，引用数据类型用`堆`存储。

看起来没有错误，但实际上是有问题的。可以考虑一下闭包的情况，如果变量存在栈中，那函数调用完`栈顶空间销毁`，闭包变量不就没了吗？

其实还是需要补充一句:

> 闭包变量是存在堆内存中的。

具体而言，以下数据类型存储在栈中:

- boolean
- null
- undefined
- number
- string
- symbol
- bigint

而所有的对象数据类型存放在堆中。

值得注意的是，对于`赋值`操作，原始类型的数据直接完整地复制变量值，对象数据类型的数据则是复制引用地址。

因此会有下面的情况:

```
let obj = { a: 1 };
let newObj = obj;
newObj.a = 2;
console.log(obj.a);//变成了2
复制代码
```

之所以会这样，是因为 obj 和 newObj 是同一份堆空间的地址，改变newObj，等于改变了共同的堆内存，这时候通过 obj 来获取这块内存的值当然会改变。

当然，你可能会问: 为什么不全部用栈来保存呢？

首先，对于系统栈来说，它的功能除了保存变量之外，还有创建并切换函数执行上下文的功能。举个例子:

```
function f(a) {
  console.log(a);
}

function func(a) {
  f(a);
}

func(1);
复制代码
```

假设用ESP指针来保存当前的执行状态，在系统栈中会产生如下的过程：

1. 调用func, 将 func 函数的上下文压栈，ESP指向栈顶。
2. 执行func，又调用f函数，将 f 函数的上下文压栈，ESP 指针上移。
3. 执行完 f 函数，将ESP 下移，f函数对应的栈顶空间被回收。
4. 执行完 func，ESP 下移，func对应的空间被回收。

图示如下:



![img](.\21.jpg)



因此你也看到了，如果采用栈来存储相对基本类型更加复杂的对象数据，那么切换上下文的开销将变得巨大！

不过堆内存虽然空间大，能存放大量的数据，但与此同时垃圾内存的回收会带来更大的开销，下一篇就来分析一下堆内存到底是如何进行垃圾回收并进行优化的。

<p style="color:red;">
    【隔壁王校长注解】<br>
    此处神三元的理解是有误的，这里关于栈和堆的理解，是基于C\C++的，C和C++是编译语言，编译后生成可以由操作系统直接运行的二进制可执行代码，栈和堆是操作系统在启动进程时初始化的。<br>
    然后，JS引擎其实是在浏览器中的解释器，所以内存的分配方式其实就是作用域链和闭包，所以神三元这部分的理解有误。但是，作为理解C和C++的栈和堆操作是有意义的，所以此处内容保留。
</p>



## 第25篇：V8 引擎如何进行垃圾内存的回收？

JS 语言不像 C/C++, 让程序员自己去开辟或者释放内存，而是类似Java，采用自己的一套垃圾回收算法进行自动的内存管理。作为一名资深的前端工程师，对于JS内存回收的机制是需要非常清楚, 以便于在极端的环境下能够分析出系统性能的瓶颈，另一方面，学习这其中的机制，也对我们深入理解JS的闭包特性、以及对内存的高效使用，都有很大的帮助。

### V8 内存限制

在其他的后端语言中，如Java/Go, 对于内存的使用没有什么限制，但是JS不一样，V8只能使用系统的一部分内存，具体来说，在`64`位系统下，V8最多只能分配`1.4G`, 在 32 位系统中，最多只能分配`0.7G`。你想想在前端这样的大内存需求其实并不大，但对于后端而言，nodejs如果遇到一个2G多的文件，那么将无法全部将其读入内存进行各种操作了。

我们知道对于栈内存而言，当ESP指针下移，也就是上下文切换之后，栈顶的空间会自动被回收。但对于堆内存而言就比较复杂了，我们下面着重分析堆内存的垃圾回收。

上一篇我们提到过了，所有的对象类型的数据在JS中都是通过堆进行空间分配的。当我们构造一个对象进行赋值操作的时候，其实相应的内存已经分配到了堆上。你可以不断的这样创建对象，让 V8 为它分配空间，直到堆的大小达到上限。

那么问题来了，V8 为什么要给它设置内存上限？明明我的机器大几十G的内存，只能让我用这么一点？

究其根本，是由两个因素所共同决定的，一个是JS单线程的执行机制，另一个是JS垃圾回收机制的限制。

首先JS是单线程运行的，这意味着一旦进入到垃圾回收，那么其它的各种运行逻辑都要暂停; 另一方面垃圾回收其实是非常耗时间的操作，V8 官方是这样形容的:

> 以 1.5GB 的垃圾回收堆内存为例，V8 做一次小的垃圾回收需要50ms 以上，做一次非增量式(ps:后面会解释)的垃圾回收甚至要 1s 以上。

可见其耗时之久，而且在这么长的时间内，我们的JS代码执行会一直没有响应，造成应用卡顿，导致应用性能和响应能力直线下降。因此，V8 做了一个简单粗暴的选择，那就是限制堆内存，也算是一种权衡的手段，因为大部分情况是不会遇到操作几个G内存这样的场景的。

不过，如果你想调整这个内存的限制也不是不行。配置命令如下:

```shell
// 这是调整老生代这部分的内存，单位是MB。后面会详细介绍新生代和老生代内存
node --max-old-space-size=2048 xxx.js 
```

或者

```shell
// 这是调整新生代这部分的内存，单位是 KB。
node --max-new-space-size=2048 xxx.js
```

### 新生代内存的回收

V8 把堆内存分成了两部分进行处理——新生代内存和老生代内存。顾名思义，新生代就是临时分配的内存，存活时间短， 老生代是常驻内存，存活的时间长。V8 的堆内存，也就是两个内存之和。



![img](.\22.jpg)



根据这两种不同种类的堆内存，V8 采用了不同的回收策略，来根据不同的场景做针对性的优化。

首先是新生代的内存，刚刚已经介绍了调整新生代内存的方法，那它的内存默认限制是多少？在 64 位和 32 位系统下分别为 32MB 和 16MB。够小吧，不过也很好理解，新生代中的变量存活时间短，来了马上就走，不容易产生太大的内存负担，因此可以将它设的足够小。

那好了，新生代的垃圾回收是怎么做的呢？

首先将新生代内存空间一分为二:



![img](.\23.jpg)



其中From部分表示正在使用的内存，To 是目前闲置的内存。

当进行垃圾回收时，V8 将From部分的对象检查一遍，如果是存活对象那么复制到To内存中(在To内存中按照顺序从头放置的)，如果是非存活对象直接回收即可。

当所有的From中的存活对象按照顺序进入到To内存之后，From 和 To 两者的角色`对调`，From现在被闲置，To为正在使用，如此循环。

那你很可能会问了，直接将非存活对象回收了不就万事大吉了嘛，为什么还要后面的一系列操作？

注意，我刚刚特别说明了，在To内存中按照顺序从头放置的，这是为了应对这样的场景:



![img](.\24.jpg)



深色的小方块代表存活对象，白色部分表示待分配的内存，由于堆内存是连续分配的，这样零零散散的空间可能会导致稍微大一点的对象没有办法进行空间分配，这种零散的空间也叫做**内存碎片**。刚刚介绍的新生代垃圾回收算法也叫**Scavenge算法**。

Scavenge 算法主要就是解决内存碎片的问题，在进行一顿复制之后，To空间变成了这个样子:



![img](.\25.jpg)



是不是整齐了许多？这样就大大方便了后续连续空间的分配。

不过Scavenge 算法的劣势也非常明显，就是内存只能使用新生代内存的一半，但是它只存放生命周期短的对象，这种对象`一般很少`，因此`时间`性能非常优秀。

### 老生代内存的回收

刚刚介绍了新生代的回收方式，那么新生代中的变量如果经过多次回收后依然存在，那么就会被放入到`老生代内存`中，这种现象就叫`晋升`。

发生晋升其实不只是这一种原因，我们来梳理一下会有那些情况触发晋升:

- 已经经历过一次 Scavenge 回收。
- To（闲置）空间的内存占用超过25%。

现在进入到老生代的垃圾回收机制当中，老生代中累积的变量空间一般都是很大的，当然不能用`Scavenge`算法啦，浪费一半空间不说，对庞大的内存空间进行复制岂不是劳民伤财？

那么对于老生代而言，究竟是采取怎样的策略进行垃圾回收的呢？

第一步，进行标记-清除。这个过程在《JavaScript高级程序设计(第三版)》中有过详细的介绍，主要分成两个阶段，即标记阶段和清除阶段。首先会遍历堆中的所有对象，对它们做上标记，然后对于代码环境中`使用的变量`以及被`强引用`的变量取消标记，剩下的就是要删除的变量了，在随后的`清除阶段`对其进行空间的回收。

当然这又会引发内存碎片的问题，存活对象的空间不连续对后续的空间分配造成障碍。老生代又是如何处理这个问题的呢？

第二步，整理内存碎片。V8 的解决方式非常简单粗暴，在清除阶段结束后，把存活的对象全部往一端靠拢。



![img](.\26.jpg)



由于是移动对象，它的执行速度不可能很快，事实上也是整个过程中最耗时间的部分。

### 增量标记

由于JS的单线程机制，V8 在进行垃圾回收的时候，不可避免地会阻塞业务逻辑的执行，倘若老生代的垃圾回收任务很重，那么耗时会非常可怕，严重影响应用的性能。那这个时候为了避免这样问题，V8 采取了增量标记的方案，即将一口气完成的标记任务分为很多小的部分完成，每做完一个小的部分就"歇"一下，就js应用逻辑执行一会儿，然后再执行下面的部分，如果循环，直到标记阶段完成才进入内存碎片的整理上面来。其实这个过程跟React Fiber的思路有点像，这里就不展开了。

经过增量标记之后，垃圾回收过程对JS应用的阻塞时间减少到原来了1 / 6, 可以看到，这是一个非常成功的改进。

JS垃圾回收的原理就介绍到这里了，其实理解起来是非常简单的，重要的是理解它`为什么要这么做`，而不仅仅是`如何做的`，希望这篇总结能够对你有所启发。

<p style="color:red;">
    【隔壁王校长注解】<br>
    JS的内存管理确实借鉴了很多JVM的理论，特别是如何通过“标记-清除”方法来确定什么样的对象应该被释放，这个算法Java后端工程师也经常被问到<br>
    另外，node.js和浏览器中的JS引擎其实也存在个别差异，作为前端程序员应该时刻记得这样的差别。
</p>



## 第26篇: 描述一下 V8 执行一段JS代码的过程？

前端相对来说是一个比较新兴的领域，因此各种前端框架和工具层出不穷，让人眼花缭乱，尤其是各大厂商推出`小程序`之后`各自制定标准`，让前端开发的工作更加繁琐，在此背景下为了抹平平台之间的差异，诞生的各种`编译工具/框架`也数不胜数。但无论如何，想要赶上这些框架和工具的更新速度是非常难的，即使赶上了也很难产生自己的`技术积淀`，一个更好的方式便是学习那些`本质的知识`，抓住上层应用中不变的`底层机制`，这样我们便能轻松理解上层的框架而不仅仅是被动地使用，甚至能够在适当的场景下自己造出轮子，以满足开发效率的需求。

站在 V8 的角度，理解其中的执行机制，也能够帮助我们理解很多的上层应用，包括Babel、Eslint、前端框架的底层机制。那么，一段 JavaScript 代码放在 V8 当中究竟是如何执行的呢？

首先需要明白的是，机器是读不懂 JS 代码，机器只能理解特定的机器码，那如果要让 JS 的逻辑在机器上运行起来，就必须将 JS 的代码翻译成机器码，然后让机器识别。JS属于解释型语言，对于解释型的语言说，解释器会对源代码做如下分析:

- 通过词法分析和语法分析生成 AST(抽象语法树)
- 生成字节码

然后解释器根据字节码来执行程序。但 JS 整个执行的过程其实会比这个更加复杂，接下来就来一一地拆解。

### 1.生成 AST

生成 AST 分为两步——词法分析和语法分析。

词法分析即分词，它的工作就是将一行行的代码分解成一个个token。 比如下面一行代码:

```
let name = 'sanyuan'
复制代码
```

其中会把句子分解成四个部分:



![img](.\27.jpg)



即解析成了四个token，这就是词法分析的作用。

接下来语法分析阶段，将生成的这些 token 数据，根据一定的语法规则转化为AST。举个例子:

```javascript
let name = 'sanyuan'
console.log(name)
```

最后生成的 AST 是这样的:



![img](.\28.jpg)



当生成了 AST 之后，编译器/解释器后续的工作都要依靠 AST 而不是源代码。顺便补充一句，babel 的工作原理就是将 ES6 的代码解析生成`ES6的AST`，然后将 ES6 的 AST 转换为 `ES5 的AST`,最后才将 ES5 的 AST 转化为具体的 ES5 代码。由于本文着重阐述原理，关于 babel 编译的细节就不展开了，推荐大家去读一读荒山的[babel文章](https://juejin.im/post/5d94bfbf5188256db95589be), 帮你打开新世界的大门: )

回到 V8 本身，生成 AST 后，接下来会生成执行上下文，关于执行上下文，可以参考上上篇《JavaScript内存机制之问——数据是如何存储的？》中对于上下文压栈出栈过程的讲解。

### 2. 生成字节码

开头就已经提到过了，生成 AST 之后，直接通过 V8 的解释器(也叫Ignition)来生成字节码。但是`字节码`并不能让机器直接运行，那你可能就会说了，不能执行还转成字节码干嘛，直接把 AST 转换成机器码不就得了，让机器直接执行。确实，在 V8 的早期是这么做的，但后来因为机器码的体积太大，引发了严重的内存占用问题。

给一张对比图让大家直观地感受以下三者代码量的差异:



![img](.\29.jpg)



很容易得出，字节码是比机器码轻量得多的代码。那 V8 为什么要使用字节码，字节码到底是个什么东西？

> 字节码是介于AST 和 机器码之间的一种代码，但是与特定类型的机器码无关，字节码需要通过解释器将其转换为机器码然后执行。

字节码仍然需要转换为机器码，但和原来不同的是，现在不用一次性将全部的字节码都转换成机器码，而是通过解释器来逐行执行字节码，省去了生成二进制文件的操作，这样就大大降低了内存的压力。

### 3. 执行代码

接下来，就进入到字节码解释执行的阶段啦！

在执行字节码的过程中，如果发现某一部分代码重复出现，那么 V8 将它记做`热点代码`(HotSpot)，然后将这么代码编译成`机器码`保存起来，这个用来编译的工具就是V8的`编译器`(也叫做`TurboFan`) , 因此在这样的机制下，代码执行的时间越久，那么执行效率会越来越高，因为有越来越多的字节码被标记为`热点代码`，遇到它们时直接执行相应的机器码，不用再次将转换为机器码。

其实当你听到有人说 JS 就是一门解释器语言的时候，其实这个说法是有问题的。因为字节码不仅配合了解释器，而且还和编译器打交道，所以 JS 并不是完全的解释型语言。而编译器和解释器的 根本区别在于前者会编译生成二进制文件但后者不会。

并且，这种字节码跟编译器和解释器结合的技术，我们称之为`即时编译`, 也就是我们经常听到的`JIT`。

这就是 V8 中执行一段JS代码的整个过程，梳理一下:

1. 首先通过词法分析和语法分析生成 `AST`
2. 将 AST 转换为字节码
3. 由解释器逐行执行字节码，遇到热点代码启动编译器进行编译，生成对应的机器码, 以优化执行效率

关于这个问题的拆解就到这里，希望对你有所启发。

<p style="color:red;">
    【隔壁王校长注解】<br>
    首先要说明，这个问题是严重超纲的。不会，没关系。即使你去应聘BAT或者字节，这个不会也在情理之中。我觉得不开发浏览器内核的人真的不太用了解这些内容。其实这里在为大家讲解一个真实的解释器是如何运行的。而且，V8引擎与其以前的JS引擎相比（IE的）确实做了很多改进，这也是它为什么快的原因。它看上去更像一个JVM或者.NET平台。<br>
    对于这块内容，我建议大家把基本的步骤记下来，如果真的被问到，能说出个大概已经是100分了。
</p>



## 第28篇：如何理解EventLoop——宏任务和微任务篇

### 宏任务(MacroTask)引入

在 JS 中，大部分的任务都是在主线程上执行，常见的任务有:

1. 渲染事件
2. 用户交互事件
3. js脚本执行
4. 网络请求、文件读写完成事件等等。

为了让这些事件有条不紊地进行，JS引擎需要对之执行的顺序做一定的安排，V8 其实采用的是一种`队列`的方式来存储这些任务， 即先进来的先执行。模拟如下:

```
bool keep_running = true;
void MainTherad(){
  for(;;){
    //执行队列中的任务
    Task task = task_queue.takeTask();
    ProcessTask(task);
    
    //执行延迟队列中的任务
    ProcessDelayTask()

    if(!keep_running) //如果设置了退出标志，那么直接退出线程循环
        break; 
  }
}
复制代码
```

这里用到了一个 for 循环，将队列中的任务一一取出，然后执行，这个很好理解。但是其中包含了两种任务队列，除了上述提到的任务队列， 还有一个延迟队列，它专门处理诸如setTimeout/setInterval这样的定时器回调任务。

上述提到的，普通任务队列和延迟队列中的任务，都属于**宏任务**。

### 微任务(MicroTask)引入

对于每个宏任务而言，其内部都有一个微任务队列。那为什么要引入微任务？微任务在什么时候执行呢？

其实引入微任务的初衷是为了解决异步回调的问题。想一想，对于异步回调的处理，有多少种方式？总结起来有两点:

1. 将异步回调进行宏任务队列的入队操作。
2. 将异步回调放到当前宏任务的末尾。

如果采用第一种方式，那么执行回调的时机应该是在前面`所有的宏任务`完成之后，倘若现在的任务队列非常长，那么回调迟迟得不到执行，造成`应用卡顿`。

为了规避这样的问题，V8 引入了第二种方式，这就是`微任务`的解决方式。在每一个宏任务中定义一个**微任务队列**，当该宏任务执行完成，会检查其中的微任务队列，如果为空则直接执行下一个宏任务，如果不为空，则`依次执行微任务`，执行完成才去执行下一个宏任务。

常见的微任务有MutationObserver、Promise.then(或.reject) 以及以 Promise 为基础开发的其他技术(比如fetch API), 还包括 V8 的垃圾回收过程。

Ok, 这便是`宏任务`和`微任务`的概念，接下来正式介绍JS非常重要的运行机制——EventLoop。



## 第29篇: 如何理解EventLoop——浏览器篇

干讲理论不容易理解，让我们直接以一个例子开始吧:

```javascript
console.log('start');
setTimeout(() => {
  console.log('timeout');
});
Promise.resolve().then(() => {
  console.log('resolve');
});
console.log('end');
```

我们来分析一下:

1. 刚开始整个脚本作为一个宏任务来执行，对于同步代码直接压入执行栈(关于执行栈，若不了解请移步之前的文章《JavaScript内存机制之问——数据是如何存储的？》)进行执行，因此**先打印start和end**
2. setTimeout 作为一个宏任务放入宏任务队列
3. Promise.then作为一个为微任务放入到微任务队列
4. 当本次宏任务执行完，检查微任务队列，发现一个Promise.then, **执行**
5. 接下来进入到下一个宏任务——setTimeout, **执行**

因此最后的顺序是:

```
start
end
resolve
timeout
```

这样就带大家直观地感受到了浏览器环境下 EventLoop 的执行流程。不过，这只是其中的一部分情况，接下来我们来做一个更完整的总结。

1. 一开始整段脚本作为第一个**宏任务**执行
2. 执行过程中同步代码直接执行，**宏任务**进入宏任务队列，**微任务**进入微任务队列
3. 当前宏任务执行完出队，检查微任务队列，如果有则依次执行，直到微任务队列为空
4. 执行浏览器 UI 线程的渲染工作
5. 检查是否有Web worker任务，有则执行
6. 执行队首新的宏任务，回到2，依此循环，直到宏任务和微任务队列都为空

最后给大家留一道题目练习:

```javascript
Promise.resolve().then(()=>{
  console.log('Promise1')  
  setTimeout(()=>{
    console.log('setTimeout2')
  },0)
});
setTimeout(()=>{
  console.log('setTimeout1')
  Promise.resolve().then(()=>{
    console.log('Promise2')    
  })
},0);
console.log('start');

// start
// Promise1
// setTimeout1
// Promise2
// setTimeout2
```



## 第30篇: 如何理解EventLoop——nodejs篇

nodejs 和 浏览器的 eventLoop 还是有很大差别的，值得单独拿出来说一说。

不知你是否看过关于 nodejs 中 eventLoop 的一些文章, 是否被这些流程图搞得眼花缭乱、一头雾水:



![img](https://user-gold-cdn.xitu.io/2019/11/23/16e96b8587ad911d?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)



看到这你不用紧张，这里会抛开这些晦涩的流程图，以最清晰浅显的方式来一步步拆解 nodejs 的事件循环机制。

### 1. 三大关键阶段

首先，梳理一下 nodejs 三个非常重要的执行阶段:

1. 执行 `定时器回调` 的阶段。检查定时器，如果到了时间，就执行回调。这些定时器就是setTimeout、setInterval。这个阶段暂且叫它`timer`。
2. 轮询(英文叫`poll`)阶段。因为在node代码中难免会有异步操作，比如文件I/O，网络I/O等等，那么当这些异步操作做完了，就会来通知JS主线程，怎么通知呢？就是通过'data'、 'connect'等事件使得事件循环到达 `poll` 阶段。到达了这个阶段后:

如果当前已经存在定时器，而且有定时器到时间了，拿出来执行，eventLoop 将回到timer阶段。

如果没有定时器, 会去看回调函数队列。

- 如果队列`不为空`，拿出队列中的方法依次执行

- 如果队列

  ```
  为空
  ```

  ，检查是否有

   

  ```
  setImmdiate
  ```

   

  的回调

  - 有则前往`check阶段`(下面会说)
  - `没有则继续等待`，相当于阻塞了一段时间(阻塞时间是有上限的), 等待 callback 函数加入队列，加入后会立刻执行。一段时间后`自动进入 check 阶段`。

1. check 阶段。这是一个比较简单的阶段，直接`执行 setImmdiate` 的回调。

这三个阶段为一个循环过程。不过现在的eventLoop并不完整，我们现在就来一一地完善。

### 2. 完善

首先，当第 1 阶段结束后，可能并不会立即等待到异步事件的响应，这时候 nodejs 会进入到 `I/O异常的回调阶段`。比如说 TCP 连接遇到ECONNREFUSED，就会在这个时候执行回调。

并且在 check 阶段结束后还会进入到 `关闭事件的回调阶段`。如果一个 socket 或句柄（handle）被突然关闭，例如 socket.destroy()， 'close' 事件的回调就会在这个阶段执行。

梳理一下，nodejs 的 eventLoop 分为下面的几个阶段:

1. timer 阶段
2. I/O 异常回调阶段
3. 空闲、预备状态(第2阶段结束，poll 未触发之前)
4. poll 阶段
5. check 阶段
6. 关闭事件的回调阶段

是不是清晰了许多？

### 3. 实例演示

好，我们以上次的练习题来实践一把:

```javascript
setTimeout(()=>{
    console.log('timer1')
    Promise.resolve().then(function() {
        console.log('promise1')
    })
}, 0)
setTimeout(()=>{
    console.log('timer2')
    Promise.resolve().then(function() {
        console.log('promise2')
    })
}, 0)
```

这里我要说，node版本 >= 11和在 11 以下的会有不同的表现。

首先说 node 版本 >= 11的，它会和浏览器表现一致，一个定时器运行完立即运行相应的微任务。

```
timer1
promise1
time2
promise2
```

而 node 版本小于 11 的情况下，对于定时器的处理是:

> 若第一个定时器任务出队并执行完，发现队首的任务仍然是一个定时器，那么就将微任务暂时保存，`直接去执行`新的定时器任务，当新的定时器任务执行完后，`再一一执行`中途产生的微任务。

因此会打印出这样的结果:

```
timer1
timer2
promise1
promise2
```

### 4. nodejs 和 浏览器关于eventLoop的主要区别

两者最主要的区别在于浏览器中的微任务是在`每个相应的宏任务`中执行的，而nodejs中的微任务是在`不同阶段之间`执行的。

### 5. 关于process.nextTick的一点说明

process.nextTick 是一个独立于 eventLoop 的任务队列。

在每一个 eventLoop 阶段完成后会去检查这个队列，如果里面有任务，会让这部分任务`优先于微任务`执行。



## 第31篇: nodejs中的异步、非阻塞I/O是如何实现的？

在听到 nodejs 相关的特性时，经常会对 `异步I/O`、`非阻塞I/O`有所耳闻，听起来好像是差不多的意思，但其实是两码事，下面我们就以原理的角度来剖析一下对 nodejs 来说，这两种技术底层是如何实现的？

### 什么是I/O？

首先，我想有必要把 I/O 的概念解释一下。I/O 即Input/Output, 输入和输出的意思。在浏览器端，只有一种 I/O，那就是利用 Ajax 发送网络请求，然后读取返回的内容，这属于`网络I/O`。回到 nodejs 中，其实这种的 I/O 的场景就更加广泛了，主要分为两种:

- 文件 I/O。比如用 fs 模块对文件进行读写操作。
- 网络 I/O。比如 http 模块发起网络请求。

### 阻塞和非阻塞I/O

`阻塞`和`非阻塞` I/O 其实是针对操作系统内核而言的，而不是 nodejs 本身。阻塞 I/O 的特点就是一定要**等到操作系统完成所有操作后才表示调用结束**，而非阻塞 I/O 是调用后立马返回，不用等操作系统内核完成操作。

对前者而言，在操作系统进行 I/O 的操作的过程中，我们的应用程序其实是一直处于等待状态的，什么都做不了。那如果换成`非阻塞I/O`，调用返回后我们的 nodejs 应用程序可以完成其他的事情，而操作系统同时也在进行 I/O。这样就把等待的时间充分利用了起来，提高了执行效率，但是同时又会产生一个问题，nodejs 应用程序怎么知道操作系统已经完成了 I/O 操作呢？

为了让 nodejs 知道操作系统已经做完 I/O 操作，需要重复地去操作系统那里判断一下是否完成，这种重复判断的方式就是`轮询`。对于轮询而言，有以下这么几种方案:

1. 一直轮询检查I/O状态，直到 I/O 完成。这是最原始的方式，也是性能最低的，会让 CPU 一直耗用在等待上面。其实跟阻塞 I/O 的效果是一样的。
2. 遍历文件描述符(即 文件I/O 时操作系统和 nodejs 之间的文件凭证)的方式来确定 I/O 是否完成，I/O完成则文件描述符的状态改变。但 CPU 轮询消耗还是很大。
3. epoll模式。即在进入轮询的时候如果I/O未完成CPU就休眠，完成之后唤醒CPU。

总之，CPU要么重复检查I/O，要么重复检查文件描述符，要么休眠，都得不到很好的利用，我们希望的是:

> nodejs 应用程序发起 I/O 调用后可以直接去执行别的逻辑，操作系统默默地做完 I/O 之后给 nodejs 发一个完成信号，nodejs 执行回调操作。

这是理想的情况，也是异步 I/O 的效果，那如何实现这样的效果呢？

### 异步 I/O 的本质

Linux 原生存在这样的一种方式，即(AIO), 但两个致命的缺陷:

1. 只有 Linux 下存在，在其他系统中没有异步 I/O 支持。
2. 无法利用系统缓存。

#### nodejs中的异步 I/O 方案

是不是没有办法了呢？在单线程的情况下确实是这样，但是如果把思路放开一点，利用多线程来考虑这个问题，就变得轻松多了。我们可以让一个进程进行计算操作，另外一些进行 I/O 调用，I/O 完成后把信号传给计算的线程，进而执行回调，这不就好了吗？没错，**异步 I/O 就是使用这样的线程池来实现的**。

只不过在不同的系统下面表现会有所差异，在 Linux 下可以直接使用线程池来完成，在Window系统下则采用 IOCP 这个系统API(其内部还是用线程池完成的)。

有了操作系统的支持，那 nodejs 如何来对接这些操作系统从而实现异步 I/O 呢？

以文件为 I/O 我们以一段代码为例:

```javascript
let fs = require('fs');

fs.readFile('/test.txt', function (err, data) {
    console.log(data); 
});
```

#### 执行流程

执行代码的过程中大概发生了这些事情:

1. 首先，fs.readFile调用Node的核心模块fs.js ；
2. 接下来，Node的核心模块调用内建模块node_file.cc，创建对应的文件I/O观察者对象(这个对象后面有大用！) ；
3. 最后，根据不同平台（Linux或者window），内建模块通过libuv中间层进行系统调用



![img](.\2A.jpg)



#### libuv调用过程拆解

重点来了！libuv 中是如何来进行进行系统调用的呢？也就是 uv_fs_open() 中做了些什么？

##### 1. 创建请求对象

以Windows系统为例来说，在这个函数的调用过程中，我们创建了一个文件I/O的**请求对象**，并往里面注入了回调函数。

```javascript
req_wrap->object_->Set(oncomplete_sym, callback);
```

req_wrap 便是这个请求对象，req_wrap 中 object_ 的 oncomplete_sym 属性对应的值便是我们 nodejs 应用程序代码中传入的回调函数。

##### 2. 推入线程池，调用返回

在这个对象包装完成后，QueueUserWorkItem() 方法将这个对象推进线程池中等待执行。

好，至此现在js的调用就直接返回了，我们的 js 应用程序代码可以`继续往下执行`，当然，当前的 `I/O` 操作同时也在线程池中将被执行，这不就完成了异步么：）

等等，别高兴太早，回调都还没执行呢！接下来便是执行回调通知的环节。

##### 3. 回调通知

事实上现在线程池中的 I/O 无论是阻塞还是非阻塞都已经无所谓了，因为异步的目的已经达成。重要的是 I/O 完成后会发生什么。

在介绍后续的故事之前，给大家介绍两个重要的方法: `GetQueuedCompletionStatus` 和 `PostQueuedCompletionStatus`。

1. 还记得之前讲过的 eventLoop 吗？在每一个Tick当中会调用`GetQueuedCompletionStatus`检查线程池中是否有执行完的请求，如果有则表示时机已经成熟，可以执行回调了。
2. `PostQueuedCompletionStatus`方法则是向 IOCP 提交状态，告诉它当前I/O完成了。

名字比较长，先介绍是为了让大家混个脸熟，至少后面出来不会感到太突兀：）

我们言归正传，把后面的过程串联起来。

当对应线程中的 I/O 完成后，会将获得的结果`存储`起来，保存到`相应的请求对象`中，然后调用`PostQueuedCompletionStatus()`向 IOCP 提交执行完成的状态，并且将线程还给操作系统。一旦 EventLoop 的轮询操作中，调用`GetQueuedCompletionStatus`检测到了完成的状态，就会把`请求对象`塞给I/O观察者(之前埋下伏笔，如今终于闪亮登场)。

I/O 观察者现在的行为就是取出`请求对象`的`存储结果`，同时也取出它的`oncomplete_sym`属性，即回调函数(不懂这个属性的回看第1步的操作)。将前者作为函数参数传入后者，并执行后者。 这里，回调函数就成功执行啦！

总结 :

1. `阻塞`和`非阻塞` I/O 其实是针对操作系统内核而言的。阻塞 I/O 的特点就是一定要**等到操作系统完成所有操作后才表示调用结束**，而非阻塞 I/O 是调用后立马返回，不用等操作系统内核完成操作。
2. nodejs中的异步 I/O 采用多线程的方式，由 `EventLoop`、`I/O 观察者`，`请求对象`、`线程池`四大要素相互配合，共同实现。



## 第32篇：JS异步编程有哪些方案？为什么会出现这些方案？

关于 JS `单线程`、`EventLoop` 以及`异步 I/O` 这些底层的特性，我们之前做过了详细的拆解，不在赘述。在探究了底层机制之后，我们还需要对代码的组织方式有所理解，这是离我们最日常开发最接近的部分，异步代码的组织方式直接决定了`开发`和`维护`的`效率`，其重要性也不可小觑。尽管**底层机制**没变，但异步代码的组织方式却随着 ES 标准的发展，一步步发生了巨大的`变革`。接着让我们来一探究竟吧！

### 回调函数时代

相信很多 nodejs 的初学者都或多或少踩过这样的坑，node 中很多原生的 api 就是诸如这样的:

```
fs.readFile('xxx', (err, data) => {

});
复制代码
```

典型的高阶函数，将回调函数作为函数参数传给了readFile。但久而久之，就会发现，这种传入回调的方式也存在大坑, 比如下面这样:

```
fs.readFile('1.json', (err, data) => {
    fs.readFile('2.json', (err, data) => {
        fs.readFile('3.json', (err, data) => {
            fs.readFile('4.json', (err, data) => {

            });
        });
    });
});
复制代码
```

回调当中嵌套回调，也称`回调地狱`。这种代码的可读性和可维护性都是非常差的，因为嵌套的层级太多。而且还有一个严重的问题，就是每次任务可能会失败，需要在回调里面对每个任务的失败情况进行处理，增加了代码的混乱程度。

### Promise 时代

ES6 中新增的 Promise 就很好了解决了`回调地狱`的问题，同时了合并了错误处理。写出来的代码类似于下面这样:

```
readFilePromise('1.json').then(data => {
    return readFilePromise('2.json')
}).then(data => {
    return readFilePromise('3.json')
}).then(data => {
    return readFilePromise('4.json')
});
复制代码
```

以链式调用的方式避免了大量的嵌套，也符合人的线性思维方式，大大方便了异步编程。

### co + Generator 方式

利用协程完成 Generator 函数，用 co 库让代码依次执行完，同时以同步的方式书写，也让异步操作按顺序执行。

```
co(function* () {
  const r1 = yield readFilePromise('1.json');
  const r2 = yield readFilePromise('2.json');
  const r3 = yield readFilePromise('3.json');
  const r4 = yield readFilePromise('4.json');
})
复制代码
```

### async + await方式

这是 ES7 中新增的关键字，凡是加上 async 的函数都默认返回一个 Promise 对象，而更重要的是 async + await 也能让异步代码以同步的方式来书写，而不需要借助第三方库的支持。

```
const readFileAsync = async function () {
  const f1 = await readFilePromise('1.json')
  const f2 = await readFilePromise('2.json')
  const f3 = await readFilePromise('3.json')
  const f4 = await readFilePromise('4.json')
}
复制代码
```

这四种经典的异步编程方式就简单回顾完了，由于是鸟瞰大局，我觉得`知道是什么`比`了解细节`要重要, 因此也没有展开。不过没关系，接下来，让我们针对这些具体的解决方案，一步步深入异步编程，理解其中的本质。



## 第33篇: 能不能简单实现一下 node 中回调函数的机制？

`回调函数`的方式其实内部利用了`发布-订阅`模式，在这里我们以模拟实现 node 中的 Event 模块为例来写实现回调函数的机制。

```javascript
function EventEmitter() {
  this.events = new Map();
}
```

这个 EventEmitter 一共需要实现这些方法: `addListener`, `removeListener`, `once`, `removeAllListener`, `emit`。

首先是addListener：

```javascript
// once 参数表示是否只是触发一次
const wrapCallback = (fn, once = false) => ({ callback: fn, once });

EventEmitter.prototype.addListener = function (type, fn, once = false) {
  let handler = this.events.get(type);
  if (!handler) {
    // 为 type 事件绑定回调
    this.events.set(type, wrapCallback(fn, once));
  } else if (handler && typeof handler.callback === 'function') {
    // 目前 type 事件只有一个回调
    this.events.set(type, [handler, wrapCallback(fn, once)]);
  } else {
    // 目前 type 事件回调数 >= 2
    handler.push(wrapCallback(fn, once));
  }
}
```

removeLisener 的实现如下:

```javascript
EventEmitter.prototype.removeListener = function (type, listener) {
  let handler = this.events.get(type);
  if (!handler) return;
  if (!Array.isArray(handler)) {
    if (handler.callback === listener.callback) this.events.delete(type);
    else return;
  }
  for (let i = 0; i < handler.length; i++) {
    let item = handler[i];
    if (item.callback === listener.callback) {
      // 删除该回调，注意数组塌陷的问题，即后面的元素会往前挪一位。i 要 -- 
      handler.splice(i, 1);
      i--;
      if (handler.length === 1) {
        // 长度为 1 就不用数组存了
        this.events.set(type, handler[0]);
      }
    }
  }
}
```

once 实现思路很简单，先调用 addListener 添加上了once标记的回调对象, 然后在 emit 的时候遍历回调列表，将标记了once: true的项remove掉即可。

```javascript
EventEmitter.prototype.once = function (type, fn) {
  this.addListener(type, fn, true);
}

EventEmitter.prototype.emit = function (type, ...args) {
  let handler = this.events.get(type);
  if (!handler) return;
  if (Array.isArray(handler)) {
    // 遍历列表，执行回调
    handler.map(item => {
      item.callback.apply(this, args);
      // 标记的 once: true 的项直接移除
      if (item.once) this.removeListener(type, item);
    })
  } else {
    // 只有一个回调则直接执行
    handler.callback.apply(this, args);
  }
  return true;
}

```

最后是 removeAllListener：

```javascript
EventEmitter.prototype.removeAllListener = function (type) {
  let handler = this.events.get(type);
  if (!handler) return;
  else this.events.delete(type);
}
```

现在我们测试一下:

```javascript
let e = new EventEmitter();
e.addListener('type', () => {
  console.log("type事件触发！");
})
e.addListener('type', () => {
  console.log("WOW!type事件又触发了！");
})

function f() { 
  console.log("type事件我只触发一次"); 
}
e.once('type', f)
e.emit('type');
e.emit('type');
e.removeAllListener('type');
e.emit('type');

// type事件触发！
// WOW!type事件又触发了！
// type事件我只触发一次
// type事件触发！
// WOW!type事件又触发了！
```

OK，一个简易的 Event 就这样实现完成了，为什么说它简易呢？因为还有很多细节的部分没有考虑:

1. 在`参数少`的情况下，call 的性能优于 apply，反之 apply 的性能更好。因此在执行回调时候可以根据情况调用 call 或者 apply。
2. 考虑到内存容量，应该设置`回调列表的最大值`，当超过最大值的时候，应该选择部分回调进行删除操作。
3. `鲁棒性`有待提高。对于`参数的校验`很多地方直接忽略掉了。

不过，这个案例的目的只是带大家掌握核心的原理，如果在这里洋洋洒洒写三四百行意义也不大，有兴趣的可以去看看Node中 [Event 模块](https://github.com/Gozala/events/blob/master/events.js) 的源码，里面对各种细节和边界情况做了详细的处理。



## 第34篇: Promise之问(一)——Promise 凭借什么消灭了回调地狱？

### 问题

首先，什么是回调地狱:

1. 多层嵌套的问题。
2. 每种任务的处理结果存在两种可能性（成功或失败），那么需要在每种任务执行结束后分别处理这两种可能性。

这两种问题在回调函数时代尤为突出。Promise 的诞生就是为了解决这两个问题。

### 解决方法

Promise 利用了三大技术手段来解决`回调地狱`:

- **回调函数延迟绑定**。
- **返回值穿透**。
- **错误冒泡**。

首先来举个例子:

```javascript
let readFilePromise = (filename) => {
  fs.readFile(filename, (err, data) => {
    if(err) {
      reject(err);
    }else {
      resolve(data);
    }
  })
}
readFilePromise('1.json').then(data => {
  return readFilePromise('2.json')
});
```

看到没有，回调函数不是直接声明的，而是在通过后面的 then 方法传入的，即延迟传入。这就是`回调函数延迟绑定`。

然后我们做以下微调:

```javascript
let x = readFilePromise('1.json').then(data => {
  return readFilePromise('2.json')//这是返回的Promise
});
x.then(/* 内部逻辑省略 */)
```

我们会根据 then 中回调函数的传入值创建不同类型的Promise, 然后把返回的 Promise 穿透到外层, 以供后续的调用。这里的 x 指的就是内部返回的 Promise，然后在 x 后面可以依次完成链式调用。

这便是`返回值穿透`的效果。

这两种技术一起作用便可以将深层的嵌套回调写成下面的形式:

```javascript
readFilePromise('1.json').then(data => {
    return readFilePromise('2.json');
}).then(data => {
    return readFilePromise('3.json');
}).then(data => {
    return readFilePromise('4.json');
});
```

这样就显得清爽了许多，更重要的是，它更符合人的线性思维模式，开发体验也更好。

两种技术结合产生了`链式调用`的效果。

这解决的是多层嵌套的问题，那另一个问题，即每次任务执行结束后`分别处理成功和失败`的情况怎么解决的呢？

Promise 采用了`错误冒泡`的方式。其实很简单理解，我们来看看效果:

```javascript
readFilePromise('1.json').then(data => {
    return readFilePromise('2.json');
}).then(data => {
    return readFilePromise('3.json');
}).then(data => {
    return readFilePromise('4.json');
}).catch(err => {
  // xxx
})
```

这样前面产生的错误会一直向后传递，被 catch 接收到，就不用频繁地检查错误了。

### 解决效果

- 1. 实现链式调用，解决多层嵌套问题
- 1. 实现错误冒泡后一站式处理，解决每次任务中判断错误、增加代码混乱度的问题



## 第35篇: Promise之问(二)——为什么Promise要引入微任务？

在这里，如果你还没有接触过 Promise, 务必去看看 [MDN 文档](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise)，了解使用方式，不然后面很会懵。

Promise 中的执行函数是同步进行的，但是里面存在着异步操作，在异步操作结束后会调用 resolve 方法，或者中途遇到错误调用 reject 方法，这两者都是作为微任务进入到 EventLoop 中。但是你有没有想过，Promise 为什么要引入微任务的方式来进行回调操作？

### 解决方式

回到问题本身，其实就是如何处理回调的问题。总结起来有三种方式:

1. 使用同步回调，直到异步任务进行完，再进行后面的任务。
2. 使用异步回调，将回调函数放在进行`宏任务队列`的队尾。
3. 使用异步回调，将回调函数放到`当前宏任务中`的最后面。

### 优劣对比

第一种方式显然不可取，因为同步的问题非常明显，会让整个脚本阻塞住，当前任务等待，后面的任务都无法得到执行，而这部分`等待的时间`是可以拿来完成其他事情的，导致 CPU 的利用率非常低，而且还有另外一个致命的问题，就是无法实现`延迟绑定`的效果。

如果采用第二种方式，那么执行回调(resolve/reject)的时机应该是在前面`所有的宏任务`完成之后，倘若现在的任务队列非常长，那么回调迟迟得不到执行，造成`应用卡顿`。

为了解决上述方案的问题，另外也考虑到`延迟绑定`的需求，Promise 采取第三种方式, 即`引入微任务`, 即把 resolve(reject) 回调的执行放在当前宏任务的末尾。

这样，利用`微任务`解决了两大痛点:

- 1. 采用**异步回调**替代同步回调解决了浪费 CPU 性能的问题。
- 1. 放到**当前宏任务最后**执行，解决了回调执行的实时性问题。

好，Promise 的基本实现思想已经讲清楚了，相信大家已经知道了它`为什么这么设计`，接下来就让我们一步步弄清楚它内部到底是`怎么设计的`。



## 第36篇: Promise之问(三)——Promise 如何实现链式调用？

从现在开始，我们就来动手实现一个功能完整的Promise，一步步深挖其中的细节。我们先从链式调用开始。

### 简易版实现

首先写出第一版的代码:

```javascript
//定义三种状态
const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

function MyPromise(executor) {
  let self = this; // 缓存当前promise实例
  self.value = null;
  self.error = null; 
  self.status = PENDING;
  self.onFulfilled = null; //成功的回调函数
  self.onRejected = null; //失败的回调函数

  const resolve = (value) => {
    if(self.status !== PENDING) return;
    setTimeout(() => {
      self.status = FULFILLED;
      self.value = value;
      self.onFulfilled(self.value);//resolve时执行成功回调
    });
  };

  const reject = (error) => {
    if(self.status !== PENDING) return;
    setTimeout(() => {
      self.status = REJECTED;
      self.error = error;
      self.onRejected(self.error);//resolve时执行成功回调
    });
  };
  executor(resolve, reject);
}
MyPromise.prototype.then = function(onFulfilled, onRejected) {
  if (this.status === PENDING) {
    this.onFulfilled = onFulfilled;
    this.onRejected = onRejected;
  } else if (this.status === FULFILLED) {
    //如果状态是fulfilled，直接执行成功回调，并将成功值传入
    onFulfilled(this.value)
  } else {
    //如果状态是rejected，直接执行失败回调，并将失败原因传入
    onRejected(this.error)
  }
  return this;
}
```

可以看到，Promise 的本质是一个`有限状态机`，存在三种状态:

- PENDING(等待)
- FULFILLED(成功)
- REJECTED(失败)

状态改变规则如下图:



![img](.\2B.jpg)



对于 Promise 而言，状态的改变`不可逆`，即由等待态变为其他的状态后，就无法再改变了。

不过，回到目前这一版的 Promise, 还是存在一些问题的。

### 设置回调数组

首先只能执行一个回调函数，对于多个回调的绑定就无能为力，比如下面这样:

```javascript
let promise1 = new MyPromise((resolve, reject) => {
  fs.readFile('./001.txt', (err, data) => {
    if(!err){
      resolve(data);
    }else {
      reject(err);
    }
  })
});

let x1 = promise1.then(data => {
  console.log("第一次展示", data.toString());    
});

let x2 = promise1.then(data => {
  console.log("第二次展示", data.toString());    
});

let x3 = promise1.then(data => {
  console.log("第三次展示", data.toString());    
});
```

这里我绑定了三个回调，想要在 resolve() 之后一起执行，那怎么办呢？

需要将 `onFulfilled` 和 `onRejected` 改为数组，调用 resolve 时将其中的方法拿出来一一执行即可。

```javascript
self.onFulfilledCallbacks = [];
self.onRejectedCallbacks = [];
复制代码
MyPromise.prototype.then = function(onFulfilled, onRejected) {
  if (this.status === PENDING) {
    this.onFulfilledCallbacks.push(onFulfilled);
    this.onRejectedCallbacks.push(onRejected);
  } else if (this.status === FULFILLED) {
    onFulfilled(this.value);
  } else {
    onRejected(this.error);
  }
  return this;
}
```

接下来将 resolve 和 reject 方法中执行回调的部分进行修改：

```javascript
// resolve 中
self.onFulfilledCallbacks.forEach((callback) => callback(self.value));
//reject 中
self.onRejectedCallbacks.forEach((callback) => callback(self.error));
```

### 链式调用完成

我们采用目前的代码来进行测试:

```javascript
let fs = require('fs');
let readFilePromise = (filename) => {
  return new MyPromise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if(!err){
        resolve(data);
      }else {
        reject(err);
      }
    })
  })
}
readFilePromise('./001.txt').then(data => {
  console.log(data.toString());    
  return readFilePromise('./002.txt');
}).then(data => {
  console.log(data.toString());
})
// 001.txt的内容
// 001.txt的内容
```

咦？怎么打印了两个 `001`，第二次不是读的 `002` 文件吗？

问题出在这里:

```javascript
MyPromise.prototype.then = function(onFulfilled, onRejected) {
  //...
  return this;
}
```

这么写每次返回的都是第一个 Promise。then 函数当中返回的第二个 Promise 直接被无视了！

说明 then 当中的实现还需要改进, 我们现在需要对 then 中返回值重视起来。

```javascript
MyPromise.prototype.then = function (onFulfilled, onRejected) {
  let bridgePromise;
  let self = this;
  if (self.status === PENDING) {
    return bridgePromise = new MyPromise((resolve, reject) => {
      self.onFulfilledCallbacks.push((value) => {
        try {
          // 看到了吗？要拿到 then 中回调返回的结果。
          let x = onFulfilled(value);
          resolve(x);
        } catch (e) {
          reject(e);
        }
      });
      self.onRejectedCallbacks.push((error) => {
        try {
          let x = onRejected(error);
          resolve(x);
        } catch (e) {
          reject(e);
        }
      });
    });
  }
  //...
}
```

假若当前状态为 PENDING，将回调数组中添加如上的函数，当 Promise 状态变化后，会遍历相应回调数组并执行回调。

但是这段程度还是存在一些问题:

1. 首先 then 中的两个参数不传的情况并没有处理，
2. 假如 then 中的回调执行后返回的结果(也就是上面的`x`)是一个 Promise, 直接给 resolve 了，这是我们不希望看到的。

怎么来解决这两个问题呢？

先对参数不传的情况做判断:

```javascript
// 成功回调不传给它一个默认函数
onFulfilled = typeof onFulfilled === "function" ? onFulfilled : value => value;
// 对于失败回调直接抛错
onRejected = typeof onRejected === "function" ? onRejected : error => { throw error };
```

然后对`返回Promise`的情况进行处理:

```javascript
function resolvePromise(bridgePromise, x, resolve, reject) {
  //如果x是一个promise
  if (x instanceof MyPromise) {
    // 拆解这个 promise ，直到返回值不为 promise 为止
    if (x.status === PENDING) {
      x.then(y => {
        resolvePromise(bridgePromise, y, resolve, reject);
      }, error => {
        reject(error);
      });
    } else {
      x.then(resolve, reject);
    }
  } else {
    // 非 Promise 的话直接 resolve 即可
    resolve(x);
  }
}
```

然后在 then 的方法实现中作如下修改:

```javascript
resolve(x)  ->  resolvePromise(bridgePromise, x, resolve, reject);
```

在这里大家好好体会一下拆解 Promise 的过程，其实不难理解，我要强调的是其中的递归调用始终传入的`resolve`和`reject`这两个参数是什么含义，其实他们控制的是最开始传入的`bridgePromise`的状态，这一点非常重要。

紧接着，我们实现一下当 Promise 状态不为 PENDING 时的逻辑。

成功状态下调用then：

```javascript
if (self.status === FULFILLED) {
  return bridgePromise = new MyPromise((resolve, reject) => {
    try {
      // 状态变为成功，会有相应的 self.value
      let x = onFulfilled(self.value);
      // 暂时可以理解为 resolve(x)，后面具体实现中有拆解的过程
      resolvePromise(bridgePromise, x, resolve, reject);
    } catch (e) {
      reject(e);
    }
  })
}
```

失败状态下调用then：

```javascript
if (self.status === REJECTED) {
  return bridgePromise = new MyPromise((resolve, reject) => {
    try {
      // 状态变为失败，会有相应的 self.error
      let x = onRejected(self.error);
      resolvePromise(bridgePromise, x, resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}
```

Promise A+中规定成功和失败的回调都是微任务，由于浏览器中 JS 触碰不到底层微任务的分配，可以直接拿 `setTimeout`(属于**宏任务**的范畴) 来模拟，用 `setTimeout`将需要执行的任务包裹 ，当然，上面的 resolve 实现也是同理, 大家注意一下即可，其实并不是真正的微任务。

```javascript
if (self.status === FULFILLED) {
  return bridgePromise = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      //...
    })
}
复制代码
if (self.status === REJECTED) {
  return bridgePromise = new MyPromise((resolve, reject) => {
    setTimeout(() => {
      //...
    })
}
```

好了，到这里, 我们基本实现了 then 方法，现在我们拿刚刚的测试代码做一下测试, 依次打印如下:

```javascript
001.txt的内容
002.txt的内容
```

可以看到，已经可以顺利地完成链式调用。

### 错误捕获及冒泡机制分析

现在来实现 catch 方法:

```javascript
Promise.prototype.catch = function (onRejected) {
  return this.then(null, onRejected);
}
```

对，就是这么几行，catch 原本就是 then 方法的语法糖。

相比于实现来讲，更重要的是理解其中错误冒泡的机制，即中途一旦发生错误，可以在最后用 catch 捕获错误。

我们回顾一下 Promise 的运作流程也不难理解，贴上一行关键的代码:

```javascript
// then 的实现中
onRejected = typeof onRejected === "function" ? onRejected : error => { throw error };
```

一旦其中有一个`PENDING状态`的 Promise 出现错误后状态必然会变为`失败`, 然后执行 `onRejected`函数，而这个 onRejected 执行又会抛错，把新的 Promise 状态变为`失败`，新的 Promise 状态变为失败后又会执行`onRejected`......就这样一直抛下去，直到用`catch` 捕获到这个错误，才停止往下抛。

这就是 Promise 的`错误冒泡机制`。

至此，Promise 三大法宝: `回调函数延迟绑定`、`回调返回值穿透`和`错误冒泡`。



## 第37篇: Promise 之问(四)——实现Promise的 resolve、reject 和 finally

### 实现 Promise.resolve

实现 resolve 静态方法有三个要点:

- 1. 传参为一个 Promise, 则直接返回它。
- 1. 传参为一个 thenable 对象，返回的 Promise 会跟随这个对象，`采用它的最终状态`作为`自己的状态`。
- 1. 其他情况，直接返回以该值为成功状态的promise对象。

具体实现如下:

```javascript
Promise.resolve = (param) => {
  if(param instanceof Promise) return param;
  return new Promise((resolve, reject) => {
    if(param && param.then && typeof param.then === 'function') {
      // param 状态变为成功会调用resolve，将新 Promise 的状态变为成功，反之亦然
      param.then(resolve, reject);
    }else {
      resolve(param);
    }
  })
}
```

### 实现 Promise.reject

Promise.reject 中传入的参数会作为一个 reason 原封不动地往下传, 实现如下:

```javascript
Promise.reject = function (reason) {
    return new Promise((resolve, reject) => {
        reject(reason);
    });
}
```

### 实现 Promise.prototype.finally

无论当前 Promise 是成功还是失败，调用`finally`之后都会执行 finally 中传入的函数，并且将值原封不动的往下传。

```javascript
Promise.prototype.finally = function(callback) {
  this.then(value => {
    return Promise.resolve(callback()).then(() => {
      return value;
    })
  }, error => {
    return Promise.resolve(callback()).then(() => {
      throw error;
    })
  })
}
```



## 第38篇: Promise 之问(五)——实现Promise的 all 和 race

### 实现 Promise.all

对于 all 方法而言，需要完成下面的核心功能:

1. 传入参数为一个空的可迭代对象，则`直接进行resolve`。
2. 如果参数中`有一个`promise失败，那么Promise.all返回的promise对象失败。
3. 在任何情况下，Promise.all 返回的 promise 的完成状态的结果都是一个`数组`

具体实现如下:

```javascript
Promise.all = function(promises) {
  return new Promise((resolve, reject) => {
    let result = [];
    let index = 0;
    let len = promises.length;
    if(len === 0) {
      resolve(result);
      return;
    }
   
    for(let i = 0; i < len; i++) {
      // 为什么不直接 promise[i].then, 因为promise[i]可能不是一个promise
      Promise.resolve(promise[i]).then(data => {
        result[i] = data;
        index++;
        if(index === len) resolve(result);
      }).catch(err => {
        reject(err);
      })
    }
  })
}
```

### 实现 Promise.race

race 的实现相比之下就简单一些，只要有一个 promise 执行完，直接 resolve 并停止执行。

```javascript
Promise.race = function(promises) {
  return new Promise((resolve, reject) => {
    let len = promises.length;
    if(len === 0) return;
    for(let i = 0; i < len; i++) {
      Promise.resolve(promise[i]).then(data => {
        resolve(data);
        return;
      }).catch(err => {
        reject(err);
        return;
      })
    }
  })
}
```

到此为止，一个完整的 Promise 就被我们实现完啦。从原理到细节，我们一步步拆解和实现，希望大家在知道 Promise 设计上的几大亮点之后，也能自己手动实现一个Promise，让自己的思维层次和动手能力更上一层楼！

## 第39篇: 谈谈你对生成器以及协程的理解。

生成器(Generator)是 ES6 中的新语法，相对于之前的异步语法，上手的难度还是比较大的。因此这里我们先来好好熟悉一下 Generator 语法。

### 生成器执行流程

上面是生成器函数？

生成器是一个带`星号`的"函数"(注意：它并不是真正的函数)，可以通过`yield`关键字`暂停执行`和`恢复执行`的

举个例子:

```javascript
function* gen() {
  console.log("enter");
  let a = yield 1;
  let b = yield (function () {return 2})();
  return 3;
}
var g = gen() // 阻塞住，不会执行任何语句
console.log(typeof g)  // object  看到了吗？不是"function"

console.log(g.next())  
console.log(g.next())  
console.log(g.next())  
console.log(g.next()) 


// enter
// { value: 1, done: false }

// { value: 2, done: false }
// { value: 3, done: true }
// { value: undefined, done: true }
```

由此可以看到，生成器的执行有这样几个关键点:

1. 调用 gen() 后，程序会阻塞住，不会执行任何语句。
2. 调用 g.next() 后，程序继续执行，直到遇到 yield 程序暂停。
3. next 方法返回一个对象， 有两个属性: `value` 和 `done`。value 为`当前 yield 后面的结果`，done 表示`是否执行完`，遇到了`return` 后，`done` 会由`false`变为`true`。

### yield*

当一个生成器要调用另一个生成器时，使用 yield* 就变得十分方便。比如下面的例子:

```javascript
function* gen1() {
    yield 1;
    yield 4;
}
function* gen2() {
    yield 2;
    yield 3;
}
```

我们想要按照`1234`的顺序执行，如何来做呢？

在 `gen1` 中，修改如下:

```javascript
function* gen1() {
    yield 1;
    yield* gen2();
    yield 4;
}
```

这样修改之后，之后依次调用`next`即可。

### 生成器实现机制——协程

可能你会比较好奇，生成器究竟是如何让函数暂停, 又会如何恢复的呢？接下来我们就来对其中的执行机制——`协程`一探究竟。

#### 什么是协程？

协程是一种比线程更加轻量级的存在，协程处在线程的环境中，`一个线程可以存在多个协程`，可以将协程理解为线程中的一个个任务。不像进程和线程，协程并不受操作系统的管理，而是被具体的应用程序代码所控制。

#### 协程的运作过程

那你可能要问了，JS 不是单线程执行的吗，开这么多协程难道可以一起执行吗？

答案是：并不能。一个线程一次只能执行一个协程。比如当前执行 A 协程，另外还有一个 B 协程，如果想要执行 B 的任务，就必须在 A 协程中将`JS 线程的控制权转交给 B协程`，那么现在 B 执行，A 就相当于处于暂停的状态。

举个具体的例子:

```javascript
function* A() {
  console.log("我是A");
  yield B(); // A停住，在这里转交线程执行权给B
  console.log("结束了");
}
function B() {
  console.log("我是B");
  return 100;// 返回，并且将线程执行权还给A
}
let gen = A();
gen.next();
gen.next();

// 我是A
// 我是B
// 结束了
```

在这个过程中，A 将执行权交给 B，也就是 `A 启动 B`，我们也称 A 是 B 的**父协程**。因此 B 当中最后`return 100`其实是将 100 传给了父协程。

需要强调的是，对于协程来说，它并不受操作系统的控制，完全由用户自定义切换，因此并没有进程/线程`上下文切换`的开销，这是`高性能`的重要原因。

OK, 原理就说到这里。可能你还会有疑问: 这个生成器不就暂停-恢复、暂停-恢复这样执行的吗？它和异步有什么关系？而且，每次执行都要调用next，能不能让它一次性执行完毕呢？下一节我们就来仔细拆解这些问题。



## 第40篇: 如何让 Generator 的异步代码按顺序执行完毕？

这里面其实有两个问题:

1. `Generator` 如何跟`异步`产生关系？
2. 怎么把 `Generator` 按顺序执行完毕？

### thunk 函数

要想知道 `Generator` 跟异步的关系，首先带大家搞清楚一个概念——thunk函数(即`偏函数`)，虽然这只是实现两者关系的方式之一。(另一种方式是`Promise`, 后面会讲到)

举个例子，比如我们现在要判断数据类型。可以写如下的判断逻辑:

```javascript
let isString = (obj) => {
  return Object.prototype.toString.call(obj) === '[object String]';
};
let isFunction = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Function]';
};
let isArray = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Array]';
};
let isSet = (obj) => {
  return Object.prototype.toString.call(obj) === '[object Set]';
};
// ...
```

可以看到，出现了非常多重复的逻辑。我们将它们做一下封装:

```javascript
let isType = (type) => {
  return (obj) => {
    return Object.prototype.toString.call(obj) === `[object ${type}]`;
  }
}
```

现在我们这样做即可:

```javascript
let isString = isType('String');
let isFunction = isType('Function');
//...
```

相应的 `isString`和`isFunction`是由`isType`生产出来的函数，但它们依然可以判断出参数是否为String（Function），而且代码简洁了不少。

```javascript
isString("123");
isFunction(val => val);
```

**isType**这样的函数我们称为**thunk 函数**。它的核心逻辑是接收一定的参数，生产出定制化的函数，然后使用定制化的函数去完成功能。thunk函数的实现会比单个的判断函数复杂一点点，但就是这一点点的复杂，大大方便了后续的操作。

### Generator 和 异步

#### thunk 版本

以`文件操作`为例，我们来看看 **异步操作** 如何应用于`Generator`。

```javascript
const readFileThunk = (filename) => {
  return (callback) => {
    fs.readFile(filename, callback);
  }
}
```

`readFileThunk`就是一个`thunk函数`。异步操作核心的一环就是绑定回调函数，而`thunk函数`可以帮我们做到。首先传入文件名，然后生成一个针对某个文件的定制化函数。这个函数中传入回调，这个回调就会成为异步操作的回调。这样就让 `Generator` 和`异步`关联起来了。

紧接者我们做如下的操作:

```javascript
const gen = function* () {
  const data1 = yield readFileThunk('001.txt')
  console.log(data1.toString())
  const data2 = yield readFileThunk('002.txt')
  console.log(data2.toString)
}
```

接着我们让它执行完:

```javascript
let g = gen();
// 第一步: 由于进场是暂停的，我们调用next，让它开始执行。
// next返回值中有一个value值，这个value是yield后面的结果，放在这里也就是是thunk函数生成的定制化函数，里面需要传一个回调函数作为参数
g.next().value((err, data1) => {
  // 第二步: 拿到上一次得到的结果，调用next, 将结果作为参数传入，程序继续执行。
  // 同理，value传入回调
  g.next(data1).value((err, data2) => {
    g.next(data2);
  })
})

```

打印结果如下:

```
001.txt的内容
002.txt的内容
```

上面嵌套的情况还算简单，如果任务多起来，就会产生很多层的嵌套，可操作性不强，有必要把执行的代码封装一下:

```javascript
function run(gen){
  const next = (err, data) => {
    let res = gen.next(data);
    if(res.done) return;
    res.value(next);
  }
  next();
}
run(g);
```

Ok,再次执行，依然打印正确的结果。代码虽然就这么几行，但包含了递归的过程，好好体会一下。

这是通过`thunk`完成异步操作的情况。

#### Promise 版本

还是拿上面的例子，用`Promise`来实现就轻松一些:

```javascript
const readFilePromise = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if(err) {
        reject(err);
      }else {
        resolve(data);
      }
    })
  }).then(res => res);
}
const gen = function* () {
  const data1 = yield readFilePromise('001.txt')
  console.log(data1.toString())
  const data2 = yield readFilePromise('002.txt')
  console.log(data2.toString)
}
```

执行的代码如下:

```javascript
let g = gen();
function getGenPromise(gen, data) { 
  return gen.next(data).value;
}
getGenPromise(g).then(data1 => {
  return getGenPromise(g, data1);
}).then(data2 => {
  return getGenPromise(g, data2)
})
```

打印结果如下:

```
001.txt的内容
002.txt的内容
```

同样，我们可以对执行`Generator`的代码加以封装:

```javascript
function run(g) {
  const next = (data) => {
    let res = g.next();
    if(res.done) return;
    res.value.then(data => {
      next(data);
    })
  }
  next();
}
```

同样能输出正确的结果。代码非常精炼，希望能参照刚刚链式调用的例子，仔细体会一下递归调用的过程。

### 采用 co 库

以上我们针对 `thunk 函数`和`Promise`两种`Generator异步操作`的一次性执行完毕做了封装，但实际场景中已经存在成熟的工具包了，如果大名鼎鼎的**co**库, 其实核心原理就是我们已经手写过了（就是刚刚封装的Promise情况下的执行代码），只不过源码会各种边界情况做了处理。使用起来非常简单:

```javascript
const co = require('co');
let g = gen();
co(g).then(res =>{
  console.log(res);
})
```

打印结果如下:

```
001.txt的内容
002.txt的内容
100
```

简单几行代码就完成了`Generator`所有的操作，真不愧`co`和`Generator`天生一对啊！



## 第41篇: 解释一下async/await的运行机制。

`async/await`被称为 JS 中**异步终极解决方案**。它既能够像 co + Generator 一样用同步的方式来书写异步代码，又得到底层的语法支持，无需借助任何第三方库。接下来，我们从原理的角度来重新审视这个语法糖背后究竟做了些什么。

### async

什么是 async ?

> MDN 的定义: async 是一个通过异步执行并隐式返回 Promise 作为结果的函数。

注意重点: **返回结果为Promise**。

举个例子:

```javascript
async function func() {
  return 100;
}
console.log(func());
// Promise {<resolved>: 100}
```

这就是隐式返回 Promise 的效果。

### await

我们来看看 `await`做了些什么事情。

以一段代码为例:

```javascript
async function test() {
  console.log(100)
  let x = await 200
  console.log(x)
  console.log(200)
}
console.log(0)
test()
console.log(300)
```

我们来分析一下这段程序。首先代码同步执行，打印出`0`，然后将`test`压入执行栈，打印出`100`, 下面注意了，遇到了关键角色**await**。

放个慢镜头:

```javascript
await 100;
```

被 JS 引擎转换成一个 Promise :

```javascript
let promise = new Promise((resolve,reject) => {
   resolve(100);
})
```

这里调用了 resolve，resolve的任务进入微任务队列。

然后，JS 引擎将暂停当前协程的运行，把线程的执行权交给`父协程`(父协程不懂是什么的，上上篇才讲，回去补课)。

回到父协程中，父协程的第一件事情就是对`await`返回的`Promise`调用`then`, 来监听这个 Promise 的状态改变 。

```javascript
promise.then(value => {
  // 相关逻辑，在resolve 执行之后来调用
})
```

然后往下执行，打印出`300`。

根据`EventLoop`机制，当前主线程的宏任务完成，现在检查`微任务队列`, 发现还有一个Promise的 resolve，执行，现在父协程在`then`中传入的回调执行。我们来看看这个回调具体做的是什么。

```javascript
promise.then(value => {
  // 1. 将线程的执行权交给test协程
  // 2. 把 value 值传递给 test 协程
})
```

Ok, 现在执行权到了`test协程`手上，test 接收到`父协程`传来的**200**, 赋值给 a ,然后依次执行后面的语句，打印`200`、`200`。

最后的输出为:

```
0
100
300
200
200
```

总结一下，`async/await`利用`协程`和`Promise`实现了同步方式编写异步代码的效果，其中`Generator`是对`协程`的一种实现，虽然语法简单，但引擎在背后做了大量的工作，我们也对这些工作做了一一的拆解。用`async/await`写出的代码也更加优雅、美观，相比于之前的`Promise`不断调用then的方式，语义化更加明显，相比于`co + Generator`性能更高，上手成本也更低，不愧是JS异步终极解决方案！



## 第42篇: forEach 中用 await 会产生什么问题?怎么解决这个问题？

### 问题

问题:**对于异步代码，forEach 并不能保证按顺序执行。**

举个例子:

```javascript
async function test() {
	let arr = [4, 2, 1]
	arr.forEach(async item => {
		const res = await handle(item)
		console.log(res)
	})
	console.log('结束')
}

function handle(x) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(x)
		}, 1000 * x)
	})
}

test()
```

我们期望的结果是:

```
4 
2 
1
结束
```

但是实际上会输出:

```
结束
1
2
4
```

### 问题原因

这是为什么呢？我想我们有必要看看`forEach`底层怎么实现的。

```javascript
// 核心逻辑
for (var i = 0; i < length; i++) {
  if (i in array) {
    var element = array[i];
    callback(element, i, array);
  }
}
```

可以看到，forEach 拿过来直接执行了，这就导致它无法保证异步任务的执行顺序。比如后面的任务用时短，那么就又可能抢在前面的任务之前执行。

### 解决方案

如何来解决这个问题呢？

其实也很简单, 我们利用`for...of`就能轻松解决。

```javascript
async function test() {
  let arr = [4, 2, 1]
  for(const item of arr) {
	const res = await handle(item)
	console.log(res)
  }
	console.log('结束')
}
```

### 解决原理——Iterator

好了，这个问题看起来好像很简单就能搞定，你有想过这么做为什么可以成功吗？

其实，for...of并不像forEach那么简单粗暴的方式去遍历执行，而是采用一种特别的手段——`迭代器`去遍历。

首先，对于数组来讲，它是一种`可迭代数据类型`。那什么是`可迭代数据类型`呢？

> 原生具有[Symbol.iterator]属性数据类型为可迭代数据类型。如数组、类数组（如arguments、NodeList）、Set和Map。

可迭代对象可以通过迭代器进行遍历。

```javascript
let arr = [4, 2, 1];
// 这就是迭代器
let iterator = arr[Symbol.iterator]();
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());


// {value: 4, done: false}
// {value: 2, done: false}
// {value: 1, done: false}
// {value: undefined, done: true}
```

因此，我们的代码可以这样来组织:

```javascript
async function test() {
  let arr = [4, 2, 1]
  let iterator = arr[Symbol.iterator]();
  let res = iterator.next();
  while(!res.done) {
    let value = res.value;
    console.log(value);
    await handle(value);
    res = iterater.next();
  }
	console.log('结束')
}
// 4
// 2
// 1
// 结束
```

多个任务成功地按顺序执行！其实刚刚的for...of循环代码就是这段代码的语法糖。

### 重新认识生成器

回头再看看用iterator遍历[4,2,1]这个数组的代码。

```javascript
let arr = [4, 2, 1];
// 迭代器
let iterator = arr[Symbol.iterator]();
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());
console.log(iterator.next());


// {value: 4, done: false}
// {value: 2, done: false}
// {value: 1, done: false}
// {value: undefined, done: true}
```

咦？返回值有`value`和`done`属性，生成器也可以调用 next,返回的也是这样的数据结构，这么巧?!

没错，**生成器**本身就是一个**迭代器**。

既然属于迭代器，那它就可以用for...of遍历了吧？

当然没错，不信来写一个简单的斐波那契数列(50以内)：

```javascript
function* fibonacci(){
  let [prev, cur] = [0, 1];
  console.log(cur);
  while(true) {
    [prev, cur] = [cur, prev + cur];
    yield cur;
  }
}

for(let item of fibonacci()) {
  if(item > 50) break;
  console.log(item);
}
// 1
// 1
// 2
// 3
// 5
// 8
// 13
// 21
// 34
```

是不是非常酷炫？这就是迭代器的魅力：）同时又对`生成器`有了更深入的理解，没想到我们的老熟人`Generator`还有这样的身份。

以上便是本文的全部内容，希望对你有所启发。

## 经验分享

### 读者灵魂之问

当你看到这里的时候，可能会吐槽，JS 就这么点内容吗，就这么几篇就讲完了？

首先我要说的是，看完这个系列，我并不能`保证你能掌握掉JS的所有内容`，我也相信没有哪一个系列会涵盖一门语言所有的知识点，而且学习本来就是一个不断循环和迭代的过程，倘若哪天你觉得自己精通了，全部了如指掌，没有必要继续学了，那才是真正的悲哀。

因此，如果这个系列对你能`产生某种启发`，弥补你的一部分`知识盲区`，或者对之前模糊的概念重新理解，从而有了`深刻的认识`，我觉得这些文章的价值也就真正发挥出来了。

另外就是这个系列还会不断的增添内容，将之前有所疏漏的地方一一补充上来，把这个系列打造得更加完整和系统，也欢迎大家给我提提后续内容方面的需求。

### 经验之谈

在`前端`这条路摸爬滚打也有一段时间了，接下来，给大家分享一下我这些年的心得和体会吧。

首先，对前端来讲，不像 Java，C++这些编程领域中科班出身的人那么多，一部分原因是前端领域的知识学校基本不教，另一方面科班毕业的大部分并不想做这一块的工作。

这就导致`半路出家`的前端er非常多。但是也并不用气馁，我是这么觉得的:

> 成为一个真正专业的人，不在于你是不是拿到了科班文凭，甚至不在于你掌握了多少亮眼的技术，而在于你的大脑中是否有**完整的知识体系**。

这一点非常重要，这份知识体系相当于是你大脑中的操作系统，有了这个系统，用当今比较时髦的词来形容就是有了`体系化的思考能力`，在应对复杂的问题才会站在更高的高度对各个方面采取综合性的权衡和取舍，或者在应对新技术的时候有足够的自信和能力去快速拿下，让这个系统更加坚固，总之这个系统会在很长一段时间伴随和影响自己，如果不好好建设一下，如蜻蜓点水一般随便学一堆技术栈，或者`三天打鱼两天晒网`, 没有**持续深入学习**的毅力，结果就是大脑中相当于缺少一个完整的操作系统，其实是挺可悲的一件事情。以前的我总是对各种技术趋之若鹜，恨不得掌握所有的技术栈，因此也总是因为时间不够、效果不好而焦虑。最后的结论就是：从一开始关注点就错了，**关注点不应在于眼花缭乱的技术，而在于自身系统的建设**，这样就并不会为xxx技术我不会而感到焦虑了，相反会为自己点滴的顿悟和进步感到兴奋和满足。

不知道什么时候想通了这件事情，可能是以前踩过太多的坑，另外一个原因也在于本人的危机感是比较强的，才会有一系列的挣扎和思考。

基于以上的`信念`, 我开始了这份知识体系的建设，进度每天不断地推进，进而也就让大家能够看到眼前的原生JS灵魂之问了。这个系列的由来我应该说清楚了，可能你又要问了，不是每天进度都在推进么？那完成的东西放在哪呢？

OK，这就得具体介绍一下我这份知识体系了，我把它放在了GitHub上，虽然是一个并不起眼的开源项目，但是也将是凝聚我很长一段时间心血的`系统建设工程`。

[点击查看GitHub仓库](https://github.com/sanyuan0704/frontend_daily_question/blob/master/README.md)

目前的大纲梳理如下:



![img](https://user-gold-cdn.xitu.io/2019/11/24/16e9dc5f178e89fd?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)



图中用红旗标记了已经完成的部分，即使如此，在之后也会做更多的补充，让知识结构更加完善。

如果这个项目对你有那么一丝启发或者帮助，也请帮忙给项目点一个`star`, 非常感谢！

这次的分享就到这里，如果大家有任何问题，或者想要与我取得联系，请加wx：`FESanyuan`。或者扫下面的码在公众号中获得联系+加群方式，以获得最新资讯和动态：）