---
title: Java 日志框架
date: 2023-07-29
---
## 日志框架


### 设计模式

正式进入 Java 日志之前，先了解几个日志相关的设计模式。


#### 门面模式

门面模式（Facade Pattern）是一种结构型设计模式，也称外观模式。它提供了一个统一的接口，用于访问子系统中的一群接口，隐藏了系统的复杂性，使得子系统更加易用。

在门面模式中，有三个主要角色：

1. **门面（Facade）：** 提供了一个高层次的接口，该接口使用了系统中多个接口，它简化了客户端与子系统之间的交互，充当了客户端与子系统之间的中介者。门面模式的名字就来源于这个角色，门面通常是客户端与子系统之间的入口点。

2. **子系统（Subsystems）：** 子系统是一组类或者模块，负责实际处理客户端的请求。子系统是门面模式的内部组成部分。

3. **客户端（Client）：** 客户端是使用门面模式的类或者模块，它通过门面提供的简化接口与子系统进行交互，而不需要直接与子系统的类进行交互。

![门面模式](/img/门面模式.svg)

例如小米推出的小爱同学智能音箱，我们只需要对小爱同学吼一嗓子，小爱同学再去操控对应的家电（冰箱/空调/洗衣机等），小爱同学就可以视为是一个门面模式的实例。


#### 适配模式

适配器模式（Adapter Pattern）也是一种结构型设计模式，通过非侵入的方式，允许接口不兼容的类之间进行协作，提高了系统的灵活性和可扩展性。例如各种插头、线缆的转接器。

适配器模式通常涉及三个角色：

1. **目标接口（Target）：** 客户端所期待的接口，适配器模式通过实现这个接口，使得客户端可以调用目标接口中定义的方法。

2. **适配器（Adapter）：** 适配器是一个类，它实现了目标接口并包装了一个需要被适配的类的对象。适配器接受客户端的调用，然后将请求委派给被适配的对象。

3. **被适配者（Adaptee）：** 需要被适配的类，它拥有客户端所需的功能，但是它的接口与客户端的期望接口不兼容。



#### 桥接模式

桥接模式（Bridge Pattern）也是一种结构型设计模式，它将抽象部分与实现部分分离，使得它们可以独立地变化。桥接模式通过将继承关系转化为组合关系，可以减少类的数量，降低系统的复杂度，提高系统的可维护性和可扩展性。

在桥接模式中，有两个独立的维度，一个是抽象部分（Abstraction），另一个是实现部分（Implementor）。抽象部分包含高层次的抽象接口，而实现部分则包含低层次的具体实现。桥接模式通过将抽象部分与实现部分分离，使得它们可以独立地变化，而不会相互影响。






### 发展史

接着介绍一下几种常见的 Java 日志框架的发展历史。

- **Log4j**
  
  瑞士程序员大佬 Ceki Gülcü 于 1996年开始开发 Log4j，在 JDK 1.4 之前几乎是 Java 日志组件的唯一选择，因此近乎成为了 Java 社区的日志标准。后被捐赠给 Apache 基金会，并于 2015 年宣布不再维护。

- **JUL (Java.Util.Logging)**
  
  2002年 Java 1.4 发布，Sun 推出了自己的日志库 Java.Util.Logging，基本是模仿了 Log4j 的实现（代码届的抄袭狗）。在 JUL 出来以前，Log4j 就已经成为一项成熟的技术，占据了很大优势，但从此开发者有了两种选择。

- **JCL (Jakarta Commons Logging)**
  
  两种日志的使用，导致程序编码的混乱，于是 Apache 推出了 Jakarta Commons Logging。JCL 定义了一套日志接口，内部也提供一个简单实现，支持运行时动态加载日志组件的实现，默认会优先使用 Log4j，其次是 JUL 实现，最后才会使用简单日志实现。

- **Slf4J (Simple Logging Facade for Java) 和 Logback**
  
  2006年，Log4j 之父 Ceki Gülcü 离开了 Apache，他觉得 JCL 接口设计不好，容易产生性能问题，于是先后开发了 SLF4J 日志门面，及其默认日志实现 Logback 两个项目。Slf4J 可以实现和多种日志组件无缝对接，并且功能和性能都非常优秀。

- **Log4j2**
  
  Apache 眼看有被 Logback 反超的势头，在2012年推出了了新的项目 Log4j2，Log4j2 几乎涵盖了 Logback 的所有特性，在性能上比 Logback 更好。同时 Log4j2 也搞了分离设计，包括日志接口 Log4j-api 和日志实现 Log4j-core。Log4j2 兼容 Slf4J，但并不兼容前任 Log4j。

![日志发展史](/img/日志发展史.svg)

Java主要的日志组件都已经出场了，一个组件是**门面**还是**实现**，要分清楚，这对以后项目里到底要引入哪些依赖，实际用的是哪个日志实现很重要！




### 进化史


#### 直接日志实现

在初期大家用`System.out -> STDOUT`或`System.error -> STDERR`来打印日志，也就是只有分两类，而且无法定制，无法满足业务需求。后来 Java 应用开始选择日志实现组件进行日志记录，比如 Log4j、JUL。

![早期日志实现](/img/早期日志实现.svg)


#### 接入 JCL

有了多种日志实现之后，如果一个程序的多个模块使用了不同的日志工具，那么就会产生多份日志输出。为了解决这个问题，就出现了 JCL 这样的日志门面，统一 API 接口，运行时动态加载具体的日志实现（多态思想）。

![接入门面](/img/接入门面.svg)


#### 接入 Slf4J

之后又出现了 Slf4J，解决了 JCL 的一些重要缺陷（https://articles.qos.ch/classloader.html ）。同时为了抢夺 JCL 的市场，Slf4J 还提供了各种桥接组件，将对 JCL 的 API 调用重定向到自己的 API，再由SLF4J选择具体的日志实现。这下问题就变得有趣起来了，看看这些桥接包吧...

![各种桥接包](/img/各种桥接包.png)




## 日志门面 - Slf4J


### 处理依赖

这么多年过去了，Java 日志门面最后以 Slf4J 一统天下而落幕，所以本文就讲讲 Slf4J，不管 JCL 了。先贴上一张 Slf4J 官网的绑定关系图（日志实现在 Slf4J 里称为 Provider/Binding）：

![接入slf4j](/img/接入slf4j.png)

对照这张图，可以得到常用的日志组件搭配如下：


**1. 仅依赖`slf4j-api`**，此时无有效的日志实现，无法输出日志

![仅依赖slf4j-api](/img/仅依赖slf4j-api.png)


**2. Slf4J + Logback**

通过 `logback.xml` 配置参数，基于 Logback 打印日志。

```xml
<dependency>
    <groupId>ch.qos.logback</groupId>
    <artifactId>logback-classic</artifactId>
    <version>1.4.11</version>
</dependency>
```

`logback-classic` 以及下面 Slf4J 提供的桥接包都会间接依赖 `slf4j-api`，不过也可以显式声明指定版本以避免 Maven 的依赖传递产生问题。

![logback-classic](/img/logback-classic.svg)


**3. Slf4J + Log4j**

通过 `log4j.properties` 配置参数，基于 Log4j 打印日志。

```xml
<dependency>
    <!-- 对应 Log4j 1.x 的最后一个版本 1.2.17 -->
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-log4j12</artifactId>
    <version>2.0.9</version>
</dependency>
```

Log4j 1.x 已经 EOL 了，因此会通过 Maven-relocation 到 `slf4j-reload4j`，reload4j 也是出自 Ceki Gülcü 之手，修复了 Log4j 的一些严重 bug。因此上面的依赖等同于下面：

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-reload4j</artifactId>
    <version>2.0.9</version>
</dependency>
```

![log4j](/img/log4j.svg)



**4. Slf4J +  JUL**

通过 `logging.porperties` 配置参数，基于 JDK 内置的简单日志系统打印日志。

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-jdk14</artifactId>
    <version>2.0.9</version>
</dependency>
```

![jdk-logging](/img/jdk-logging.svg)


**5. Slf4J + Simple**

通过 `simplelogger.porperties` 配置参数，基于 Slf4J 默认实现打印日志。

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-simple</artifactId>
    <version>2.0.9</version>
</dependency>
```

![slf4j-simple](/img/slf4j-simple.svg)


**6. Slf4J + NOP**

默认丢弃所有的日志记录，不会打印日志。

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-nop</artifactId>
    <version>2.0.9</version>
</dependency>
```

![slf4j-nop](/img/slf4j-nop.svg)


**7. Slf4J + Log4j2**

通过 `log4j2.xml` 配置参数，基于 Log4j2 的实现打印日志，是现今**最普遍使用**的搭配组合。本质上是 Slf4J -> Log4j-api -> Log4j-core。

```xml
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-slf4j-impl</artifactId>
    <version>2.21.0</version>
</dependency>


<!-- 支持 Slf4J 2.x+ SPI 加载机制的桥接包 -->
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-slf4j2-impl</artifactId>
    <version>2.21.0</version>
</dependency>
```

![log4j2](/img/log4j2.svg)



**8. Slf4J + JCL**

最后还有一种情况图中也没有，即将所有日志委托给 JCL 门面处理，具体依赖见上面的 [Slf4J桥接包](#接入-slf4j) 。



### 绑定原理

下面分析一下 Slf4J 门面绑定日志实现的过程，特别说明，Slf4J 1.8 版本之前基于 COC (Convention over Configuration 约定大于配置)，利用 StaticLoggerBinder 初始化。但 1.8 版本之后利用的是 Java SPI (Service Provider Interface) 机制实现，我们后面就只看新版的实现原理。

---

通常，我们会通过下面这条语句为类设置一个日志器。

```java
private static final org.slf4j.Logger LOGGER = org.slf4j.LoggerFactory.getLogger(Main.class);
```

进入 LoggerFactory，可以看到主要分为两步：
1. 通过 SLF4JServiceProvider 初始化并返回 ILoggerFacotry
2. 从工厂生产 Logger 并返回

```java
public static Logger getLogger(String name) {
    ILoggerFactory iLoggerFactory = getILoggerFactory();
    return iLoggerFactory.getLogger(name);
}
```

接着依次进入方法：`getILoggerFactory -> getProvider -> performInitialization -> bind` 完成绑定行为。而在 findServiceProviders 中，利用 JDK 的 `ServcieLoader#load` 加载类路径特定目录下（META-INF/services/org.slf4j.spi.SLF4JServiceProvider）所有实现了 `SLF4JServiceProvider` 的 SPI 配置类，反射实例化后加入 providerList 返回。

```java
// org.slf4j.LoggerFactory#bind
private final static void bind() {
    List<SLF4JServiceProvider> providersList = findServiceProviders();

    if (providersList != null && !providersList.isEmpty()) {
        PROVIDER = providersList.get(0);
        PROVIDER.initialize();
        INITIALIZATION_STATE = SUCCESSFUL_INITIALIZATION;
    } else {
        INITIALIZATION_STATE = NOP_FALLBACK_INITIALIZATION;
    }
    postBindCleanUp();
}


// org.slf4j.LoggerFactory#findServiceProviders
static List<SLF4JServiceProvider> findServiceProviders() {
    ClassLoader classLoaderOfLoggerFactory = LoggerFactory.class.getClassLoader();
    // 负责扫描 SPI 配置类
    ServiceLoader<SLF4JServiceProvider> serviceLoader = getServiceLoader(classLoaderOfLoggerFactory);
    List<SLF4JServiceProvider> providerList = new ArrayList();
    Iterator<SLF4JServiceProvider> iterator = serviceLoader.iterator();

    while(iterator.hasNext()) {
        safelyInstantiate(providerList, iterator);
    }

    return providerList;
}
```

回到 bind() 后默认取列表里第一个 `SLF4JServiceProvider` 执行 `initialize()` 得到 ILoggerFactory 实例，最后 getLogger() 获得 Logger 实例作为最终的日志器，具体怎么从日志工厂生产出 Logger 就由各个实现类去完成了。

特殊的，如果找到了多个日志实现，具体绑定的是哪个依赖于类加载的顺序；如果 SPI 没有找到任何实现类，将使用 `NOP_FallbackServiceProvider` 兜底。


::: warning

Slf4J -> Log4j 2.x 的桥接包是 Log4j 官方提供的，没有跟进 Slf4J，依然使用的是 1.8 之前的 StaticLoggerBinder 实现。

这时候如果手动引入了 Slf4J 1.8 之后的版本，将默认使用 NOP，而不是 Log4j2。


补充：经查证 Log4j 提供了新的桥接包以支持 SPI 机制的 Slf4J

```xml
<dependency>
    <groupId>org.apache.logging.log4j</groupId>
    <artifactId>log4j-slf4j2-impl</artifactId>
    <version>2.21.0</version>
</dependency>
```

:::




### API

Slf4J 的 API 十分简单：

```java
// 获取日志记录器
Logger log = LoggerFactory.getLogger(HelloWorld.class);

// 五种级别日志
log.error("error", ex);
log.warn("warn");
log.info("info");
log.debug("debug：{}", arg);
log.trace("trace");

// Fluent API
log.atError().setMessage("Msg: {}").addArgument("arg").log();
```







## 日志实现 - Log4j2

Slf4J 在日志门面中一统天下，而在日志实现方面，Logback 和 Log4j2 依然难分伯仲，不过这里就只简单聊聊 Log4j 了。

![log4j](/img/log4j.png)

建议使用最新版本，2.17 以下有重大安全漏洞！详见：https://logging.apache.org/log4j/2.x/security.html



### 配置

Log4j2 根据项目根目录下的 `log4j2.xml` 文件进行日志配置，详细的配置解析可以参考 [Log4j2配置文件详解](https://thinkwon.blog.csdn.net/article/details/101629302)


#### Configuration

```xml
<configuration status="WARN" monitorInterval="30">
    ...
</configuration>
```

配置的根节点，status 控制 Log4j2 框架本身的日志级别，monitorInterval 控制每隔多少秒重新加载配置。


#### Appenders

追加器，定义日志输出的目的地，开发者可以自定义 Appender，只需继承 AbstractAppender 并实现 append(LogEvent) 方法。Log4j2 支持多种输出源，例如：

- ConsoleAppender
- FileAppender
- AsyncAppender
- RandomAccessFileAppender
- RollingFileAppender

其中，Layout 属性用于定义日志的输出格式。

```xml
<appenders>
    <!--输出到控制台-->
    <console name="Console" target="SYSTEM_OUT">
        <!--输出日志的格式-->
        <PatternLayout pattern="[%d{HH:mm:ss:SSS}] [%p] - %l - %m%n"/>
    </console>

    <!--输出到文件-->
    <File name="log" fileName="log/test.log" append="false">
        <PatternLayout pattern="%d{HH:mm:ss.SSS} %-5level %class{36} %L %M - %msg%xEx%n"/>
    </File>

    <!-- 输出到文件，并自动归档旧日志-->
    <RollingFile name="RollingFileInfo" fileName="${sys:user.home}/logs/info.log"
                    filePattern="${sys:user.home}/logs/$${date:yyyy-MM}/info-%d{yyyy-MM-dd}-%i.log">
        <!--决定日志是否输出的过滤器-->
        <ThresholdFilter level="info" onMatch="ACCEPT" onMismatch="DENY"/>
        <PatternLayout pattern="[%d{HH:mm:ss:SSS}] [%p] - %l - %m%n"/>
        <Policies>
            <!-- 基于时间的滚动策略 -->
            <TimeBasedTriggeringPolicy/>
            <!-- 基于文件大小的滚动策略 -->
            <SizeBasedTriggeringPolicy size="100 MB"/>
        </Policies>
    </RollingFile>
</appenders>
```

#### Filters

过滤器，用于过滤特定日志级别的日志事件，过滤器会在多个阶段被调用，例如日志事件进入LoggerConfig之前；进入LoggerConfig后调用任何Appender之前；进入LoggerConfig后调用特殊的Appender之前；每个Appender内部等。过滤器的结果有三种：

- Accept：不再调用其他过滤器，执行 event
- Deny：忽略 event，将控制权交还给调用者
- Neutral：传递给其它过滤器，如果没有过滤器可以传递则执行 event


#### Loggers

日志记录器，里面关联着所用的 Appenders。常见的有两种节点：
- Logger 可以有多个，针对不同的包名或类名配置不同的日志记录器
- Root 兜底的默认日志记录器

```xml
<loggers>
    <logger name="org.springframework" level="INFO" additivity="false"></logger>
    <logger name="包名" level="级别" additivity="是否传递给父级"></logger>
    
    <root level="all">
        <appender-ref ref="Console"/>
        <appender-ref ref="RollingFileInfo"/>
    </root>
</loggers>
```





### 日志级别

日志框架会输出大于或等于指定等级的所有日志，优先级从高到低依次为：
- OFF：最具体，不记录
- FATAL：严重错误，将阻止应用继续；非常具体，数据很少
- ERROR：严重错误，可能可以恢复
- WARN：可能有害的消息
- INFO：信息性消息，突出强调应用程序的运行过程
- DEBUG：常规调试事件
- TRACE：不太具体，很多数据，通常捕获通过应用的流
- ALL：最不具体，用于打开所有日志记录

![日志级别](/img/日志级别.svg)




## 最佳实践

**SLF4J 门面 + Log4j2 实现** 已经是Java应用中最为流行的日志技术方案。一方面，使用 SLF4J 门面可以统一日志处理方式，有利于项目日志的维护；另一方面又可以享受 Log4j2 的卓越性能。阿里巴巴 Java 开发手册“日志规约”部分的第一条便是强制依赖日志框架SLF4J的API。

![日志接入最佳实践](/img/日志接入最佳实践.svg)


1. 每个类的日志实例声明为`static final`，这样每次日志打印时不用再创建日志对象，提升效率

    ```java
    private static final Logger logger= LoggerFactory.getLogger(DeliveryConfigQueryAction.class);
    ```

2. 配合 Lombok 注解，更加方便清晰

    ```java
    @Slf4j
    public class UserController { ... }
    ```

    编译后：
    ```java
    public class UserController {
        private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(UserController.class);
    }
    ```

3. 日志打印设置为非阻塞模式

    采用非阻塞模式后，底层可以发挥 Log4j2 所采用的 Disruptor 高性能框架，在不同的场景下会有几倍到几十倍的日志写入性能提升。

    ```xml
    <Async name="ScribeAsyncAppender" blocking="false">
    ```

4. 日志打印采用占位符

    推荐使用占位符`{}`打印日志，这样只在日志级别满足打印需求时，才会进行参数的拼接，降低性能损耗。注意占位符的转义。

    ```java
    logger.error("xxx error, id: {}" , userId, e);
    logger.debug("File name is C:\\\\{}.", "file.zip");
    ```

5. 避免重复打印日志，浪费磁盘空间

    ```xml
    <logger name="com.taobao.dubbo.config" additivity="false">
    ```

6. 异常信息应包括两类：案发现场信息和异常堆栈信息，并且禁止使用 Json 工具转换。如果不处理，那么通过关键字 throws 往上抛出。

    ```java
    logger.error("inputParams: {} and errorMessage: {}", 各类参数或者对象 toString(), e.getMessage(), e);
    ```




## 参考

- https://www.slf4j.org/manual.html
- https://reload4j.qos.ch/
- https://github.com/alibaba/p3c
- [Slf4J源码解析](https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzI0NDAzMzIyNQ==&action=getalbum&album_id=1611904713401155588&scene=173&from_msgid=2654069314&from_itemidx=1&count=3&nolastread=1#wechat_redirect)