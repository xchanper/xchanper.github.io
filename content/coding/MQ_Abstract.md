---
title:  消息队列概述
date: 2023-04-19
---
## 介绍

消息队列是一种进程间通信或同一进程的不同线程间的通信方式，主要解决应用耦合、异步消息、流量削锋等问题。实现高性能、高可用、可伸缩和最终一致性架构。是大型分布式系统不可缺少的中间件。消息发布者只管把消息发布到 MQ 中而不用管谁来取，消息使用者只管从 MQ 中取消息而不管是谁发布的。这样发布者和使用者都不用知道对方的存在。

![MQ](/img/MQ.svg)


## 作用和问题

### 异步处理

比如从第三方平台中接收数据，数据中包含了很多的图片，将图片保存到云上耗时比较久，后续还有计算分数等耗时比较久的操作。如果我们通过消息队列异步处理后，主流程只需要100ms，其他的都通过异步的方式进行处理，可以提高系统性能，减少响应时间

![MQ异步处理](/img/MQ异步处理.svg)


### 应用解耦

当系统A中在订单创建后，需要通知B系统和C系统，然后B系统和C系统再做出相应的处理。

![MQ应用解耦1](/img/MQ应用解耦1.svg)

此时A系统是强依赖B系统和C系统，当B系统需要下线，或者需要重新加入D系统，则需要需改代码：

![MQ应用解耦2](/img/MQ应用解耦2.svg)

如此这样反复的添加和删除依赖的系统，使得系统难以维护，此时可以通过MQ进行解耦，使得A系统与需要关心订单创建事件的系统解耦开，不再关心下游有哪些系统，也不用受下游系统可用性的影响。

![MQ应用解耦3](/img/MQ应用解耦3.svg)



### 流量削峰

有一个活动页面，平时大概就50qps，但每天有一段高峰期流量能达到1000qps，但压测发现当前系统的处理能力为100qps。整个活动大部分时间流量都不太高，扩充太多的机器利用率又太低，这个时候可以通过MQ来进行削峰，均匀处理消息任务

![MQ流量削峰](/img/MQ流量削峰.svg)


### 新的问题

虽然 MQ 能帮助解决很多服务之间的问题，但同时也带来了新的问题：
- 系统可用性降低：例如消息丢失，MQ宕机等问题
- 系统复杂性提高：需要保证无重复消费、消息丢失、消息传递顺序性等问题
- 一致性问题：消费者没有正确消费消息的情况




## MQ 协议

### JMS
Java Message Service - Java消息服务的一套 API 规范。实现有 ActiveMQ、RocketMQ
- 消息格式：StreamMessage, MapMessage, TextMessage, ObjectMessage, BytesMessage
- 消息模型：P2P 点对点、PubSub 订阅模型

### AMQP
Advanced Message Queuing Protocol 高级消息队列协议，应用层协议的一个开放标准，统一了数据交互格式，是一种具有现代特征的二进制协议（多通道的、协商的、异步的、安全便携高效的）。支持跨平台、跨语言，兼容 JMS。实现有 RabbitMQ
- 仅支持 byte[] 消息格式
- 基于 Exchange 提供的路由算法，提供多种消息模型，例如 direct, fanout, topic, headers, system 等 

##### 架构

![AMQP架构](/img/AMQP架构.svg)

- Model 模型层：定义了一套命令，按功能分类，客户端应用可以利用这些命令来实现它的业务功能
- Session 会话层：负责将命令从客户端应用传递给服务器，再将服务器的应答传递给客户端应用，会话层为这个传递过程提供可靠性、同步机制和错误处理
- Transport 传输层：提供帧处理、信道复用、错误检测和数据表示


##### 模型

消息（Message）被发布者（Publisher）发送给交换机（Exchange），交换机类似邮局/邮箱。交换机将收到的消息按照路由规则分发到绑定的队列（Queue）中，最后 AMQP 代理会将消息投递给订阅了此队列的消费者（Consumer），或者消费者（Consumer）按需获取。

![AMQP模型](/img/AMQP模型.svg)




### MQTT

Message Queuing Telemetry Transport 消息队列遥测传输，IBM 开发的一个即时通讯协议，是一种基于轻量级代理的，发布/订阅模式的消息传输协议，运行在TCP协议栈之上，为其提供有序、可靠、双向连接的网络连接保证。该协议支持所有平台，几乎可以把所有联网物品和外部连接起来，被用来当做传感器和致动器的通信协议。

特点：格式简洁、占用带宽小、移动端通信、PUSH、嵌入式系统。

![MQTT模型](/img/MQTT模型.svg)

- 使用发布/订阅消息模式，提供一对多的消息发布，解除应用程序耦合。
- 小型传输，开销很小（头部仅2Byte），协议交换最小化，以降低网络流量。
- 使用 Last Will（遗言机制）和 Testament（遗嘱机制）特性处理相关客户端异常中断。
- 支持三种消息发布方式：
  - 至多一次：消息发布完全依赖底层TCP/IP网络，可能发生消息丢失
  - 至少一次：确保消息到达，但消息重复可能会发生
  - 只有一次：确保消息到达一次，适用于计费/IM场景





### STOMP

Streaming Text Orientated Message Protocol 流文本定向消息协议，是一种为 MOM(Message Oriented Middleware，面向消息的中间件)设计的简单文本协议。STOMP提供一个可互操作的连接格式，允许客户端与任意 STOMP Broker 进行交互。

![Stomp协议](/img/Stomp协议.png)

- Topic：即消息队列 MQ 的消息主题，一级消息类型，通过 Topic 对消息进行分类以及权限管理
- Destination：STOMP 协议里面的消息目的地，形式如 “/t/t1”，其中一级字符串 “t” 即为 Topic
- Instance ID：消息队列 MQ 的实例 
- Client ID：发送端或订阅端的唯一标识，便于日志查询


### XMPP

Extensible Messaging and Presence Protocol 可扩展消息处理现场协议，基于 XML 的协议，多用于 IM即时消息以及在线现场探测，适用于服务器之间的准即时操作。核心是基于 XML 流传输，这个协议可能最终允许因特网用户向因特网上的其他任何人发送即时消息，即使其操作系统和浏览器不同。

协议特点：通用公开、兼容性强、可扩展、安全性高，但 XML 编码格式占用带宽大




### 常见 MQ

- ActiveMQ：单机吞吐量万级，时效性 ms 级，可用性高，基于主从架构实现高可用性，消息可靠性较低的概率丢失数据。但维护渐少
- Kafka：为大数据而生的消息中间件，吞吐量百万级，性能卓越，基于 Pull 模式消费消息，适合大量的数据/日志采集业务。
- RocketMQ：阿里巴巴参考 Kafka 用 Java 实现的 MQ，吞吐量十万级，消息 0 丢失，适用于可靠性要求很高的场景，例如电商、金融互联网等。但支持客户端语言不多
- RabbitMQ：在 AMQP 协议基础上基于 Erlang 开发的高并发主流 MQ，支持多种语言。适合中小型公司。





## RabbitMQ

RabbitMQ 是使用 Erlang 语言实现的，基于 AMQP 协议的消息中间件，由 RabbitMQ Technologies Ltd 开发并且提供商业支持，最初起源于金融系统。在分布式系统中存储转发消息，在易用性、扩展性、高可用性等方面表现不俗。

![rabbitmq](/img/rabbitmq.png)


### 主要特性

- 可靠性：提供了多种技术可以在性能和可靠性之间进行权衡，如持久性机制、投递确认、发布确认和高可用性机制
- 灵活的路由：消息在到达队列之前，通过Exchange进行路由。支持自定义Exchange
- 消息集群：在相同局域网中的多个 RabbitMQ 服务器聚合在一起，形成一个逻辑 Broker
- 高可用：队列可以在集群中的机器上进行镜像，以确保在硬件问题下还保证消息安全
- 多协议：支持多种消息队列协议, 如 STOMP、MQTT 等
- 多语言：使用Erlang语言编写，客户端几乎支持所有常用语言
- 管理界面： RabbitMQ有一个易用的web用户界面，使得用户可以方便的进行监控和消息的管理
- 跟踪机制：RabbitMQ提供消息跟踪机制
- 插件机制：提供了许多的插件来进行扩展，也支持自定义插件的开发



### 核心概念

- 消息：
  - 消息头：一系列可选属性，也叫标签。例如 routing-key 路由键, priority 优先权，delivery-mode 持久性存储...
  - 消息体：不透明的 payload
- Producer：产生数据发送消息的程序
- Broker：消息队列服务器实体
- Virtual Host：虚拟主机，内部划分的独立域，包含一批交换机、消息队列和相关对象。彼此之间互不影响
- Exchange：负责接收和转发消息，并将消息推送到队列中
- Queue：负责存储消息，本质上是一个大的消息缓冲区
- Binding：绑定，基于路由键将消息队列和交换机关联（多对多）的路由规则
- Consumer：等待接收消息的程序



### 路由规则

简单工作模式（一个生产者，一个消费者）和 工作队列模式（一个生产者，多个消费者）使用默认交换机。除此之外，RabbitMQ 中的消息必须先经过 Exchange，并通过 Binding 将 Exchange 和 Queue 绑定关联，然后指定一个 BindingKey 作为路由规则。Producer 发送消息时需要指定 RoutingKey，与 BindingKey 匹配时就会路由到对应的消息队列中。具体路由还依赖于交换器类型。如果路由不到，可能返回给 Producer 或直接丢弃。

**四种策略**
- `direct`：把消息路由到那些 Bindingkey 与 RoutingKey 完全匹配的 Queue 中。常用于处理有优先级的任务
- `fanout`：把发送到该 Exchange 的消息路由到所有与它绑定的 Queue 中，不判断任何键，因此速度最快
- `topic`：将消息路由到 BindingKey 和 RoutingKey 模式匹配的队列中，其中 * 匹配一个单词，# 匹配零/多个单词
- `headers`：路由规则不依赖于路由键的匹配规则，而是根据发送的消息内容中的 headers 属性进行匹配，完全匹配才会路由

![exchange](/img/exchange.png)


### Spring 整合

#### 引入依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

RabbitAutoConfiguration 生效，给容器自动配置了很多类，例如 RabbitTemplate、AmqpAdmin、CachingConnectionFactory、RabbitMessagingTemplate


#### 配置 RabbitMQ

```yml
spring:
  rabbitmq:
    host: 49.123.73.45
    port: 5672
    username: guest
    password: guest
    virtual-host: /
    publisher-returns: true # 开启发送确认
    template:
      mandatory: true       # 只要抵达队列，优先回调 return confirm
    listener:
      simple:
        acknowledge-mode: manual # 使用手动确认模式
```

```java
 @Configuration
public class MyRabbitConfig {

    private RabbitTemplate rabbitTemplate;

    //告诉 spring 使用这个自定义的 RabbitTemplate
    @Primary
    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        this.rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(messageConverter());
        initRabbitTemplate();
        return rabbitTemplate;
    }

    // 使用 json 格式的序列化器，否则使用 jdk 的序列化器
    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // 配置确认回调
    public void initRabbitTemplate() {
        // 消息到达 broker 的回调
        rabbitTemplate.setConfirmCallback(((correlationData, ack, cause)
                -> log.info("\nbroker收到消息: " + correlationData + "\tack: " + ack + "\tcause： " + cause)));
        // 消息投递队列失败的回调
        rabbitTemplate.setReturnCallback((message, replyCode, replyText, exchange, routerKey)
                -> log.error("Fail Message [" + message + "]" + "\treplyCode: " + replyCode + "\treplyText:" + replyText + "\texchange:" + exchange + "\trouterKey:" + routerKey));
    }
}
```

#### 基本使用

1. 主启动类开启 `@EnableRabbit` (发送消息可以不添加，监听消息必须添加)

2. 使用 amqpAdmin 创建 Exchange、Queue、Binding

```java
@Autowired
AmqpAdmin amqpAdmin;

@Test
public void createExchange() {
    // DirectExchange(String name, boolean durable, boolean autoDelete)
    amqpAdmin.declareExchange(new DirectExchange("hello-java-exchange", true, false));
    log.info("Exchange created");
}

@Test
public void createQueue() {
    // Queue(String name, boolean durable, boolean exclusive, boolean autoDelete)
    amqpAdmin.declareQueue(new Queue("hello-java-queue", true, false, false));
    log.info("Queue created");
}

@Test
public void createBinding() {
    // Binding(String destination, DestinationType destinationType, String exchange, String routingKey, Map<String, Object> arguments)
    Binding binding = new Binding("hello-java-queue", Binding.DestinationType.QUEUE, "hello-java-exchange", "hello.java", null);
    amqpAdmin.declareBinding(binding);
    log.info("Binding Created");
}
```

3. 使用 rabbitTemplate 发送消息

```java
@Autowired
RabbitTemplate rabbitTemplate;

@Test
public void sendMsg() {
    Order entity = new Order();
    entity.setName("orderReturnEntity-" + i);

    rabbitTemplate.convertAndSend("a-exchange", "a-routingKey", entity, new CorrelationData(UUID.randomUUID().toString()));
    
    log.info("消息发送完成");
}
```

CorrelationData 用于唯一确定一条消息。 


4. 监听消息队列

```java
@Service
@RabbitListener(queues = {"hello-java-queue"})
public class TestReceive {

    /**
     * 接收消息的方法
     * @param message   原生消息详细信息，消息头+消息体
     * @param content   消息内容
     * @param channel   传输数据的通道
     */
    @RabbitHandler
    public void receiveMessage(Message message, Order content, Channel channel) throws InterruptedException {
        System.out.println("接收到消息 => " + content);
        MessageProperties properties = message.getMessageProperties();
        byte[] body = message.getBody();
        
        Thread.sleep(3000);
        System.out.println("消息处理完成 => " + content.getClass());
    }
}
```

- 要想监听消息，主启动类必须添加`@EnableRabbit`
- 监听方法必须放在`@Component`中
- `@RabbitListener(queues={"some-queue"})`放在类上，用于指定监听的队列
- `@RabbitHandler`放在方法上，用于重载处理不同类型的消息



### 消息确认

一条消息从 Producer -> MQ Broker -> Consumer 的过程中都可能丢失。为了保证消息不丢失，可靠抵达，可以使用事务消息，但是性能会下降 250 倍，为此 RabbitMQ 引入了消息确认机制，用于保证消息的可靠到达。

#### ConfirmCallback

消息从 Producer 成功到达 Exchange 的回调

```java
// 配置：rabbitmq.publisher-confirms=true

// 定义 ConfirmCallback
rabbitTemplate.setConfirmCallback(new RabbitTemplate.ConfirmCallback() {
    /**
     * @param correlationData 当前消息的唯一关联数据（消息的唯一id）
     * @param ack   消息是否成功收到
     * @param cause 失败的原因
     */
    @Override
    public void confirm(CorrelationData correlationData, boolean ack, String cause) {
        if (ack) {
            // 接收成功
            System.out.println("接收成功消息" + cause);
        } else {  
            // 接收失败
            System.out.println("接收失败消息" + cause);
            // 做一些处理，让消息再次发送。
        }
    }
});
```

- 消息只要被 Broker 接收到就会执行 confirmCallback
- 如果是 cluster 模式，需要所有 Broker 接收到才会调用 confirmCallback
- 如果消息和队列是可持久化的，那么确认消息会在将该消息写入磁盘后发出
- 被 Broker 接收到只能表示 message 已经到达服务器，并不能保证消息一定会被投递到目标 Queue 里


#### ReturnCallback

消息从 Exchange 到 Queue 投递失败的回调。可以记录下详细的投递数据，定期的巡检或者自动纠错都需要这些数据。

```yml
spring.rabbitmq.template.mandatory=true
spring.rabbitmq.publisher-returns=true
```

```java
// 定义 ReturnCallback
rabbitTemplate.setReturnCallback(new RabbitTemplate.ReturnCallback() {
    /**
     * @param message    投递失败的消息对象
     * @param replyCode  回复的状态码
     * @param replyText  回复的文本内容
     * @param exchange   当时这个消息发给哪个交换机
     * @param routingKey 当时这个消息用哪个路由键
     */
    @Override
    public void returnedMessage(Message message, int replyCode, String replyText, String exchange, String routingKey) {
        System.out.println("Fail Message[" + message + "]==>replyCode[" + replyCode + "]==>replyText[" + replyText + "]===>exchange[" + exchange + "]===>routingKey[" + routingKey + "]");
    }
});
```



#### Consumer Ack

Consumer 收到消息后的确认方式。

```yml
# 可选值：none 不管处理成功与否；manual 手动处理确认；auto 根据消息处理逻辑是否抛出异常自动处理
spring.rabbitmq.listener.simple.acknowledge-mode=manual
```

```java
channel.basicAck(deliveryTag, false);         // 签收，并指定是否累积确认。Broker 将移除确认的消息
channel.basicNack(deliveryTag, false, true);  // 拒签，并指定是否批量、重入队
channel.basicReject(deliveryTag, false);      // 拒签，并指定是否重入队
```

- 默认自动 ack，消息被消费者收到，就会从 broker 的 queue 中移除
- 如果消息一直没有被 ack/nack，Broker 认为此消息正在被处理，不会投递给别人，此时客户端断开，消息不会被 Broker 移除，会投递给别人



### 延迟队列

消息被发送出去后，并不想让消费者立即拿到消息，而是等待指定时间后，消费者才拿到这个进行消费。RabbitMQ 中可以通过设置 TTL 和 死信路由实现延迟队列。

#### TTL

通过设置 Queue 的 x-expires 属性或 Message 的 x-message-ttl 属性控制消息的生存时间，如果超时(两者同时设置以最先到期的时间为准)，则消息变为 Dead Letter，将被发送到死信交换机中。

- 如果给队列设置 TTL，那么一旦消息过期就会被队列丢弃（到死信交换机）
- 如果给消息设置 TTL，由于消息是否过期是在投递到消费者之前判定的，因此不一定会被立即丢弃。对于严重消息积压的情况，已过期消息可能还能存活较长时间
- 不设置 TTL 则消息永不过期
- TTL 设为 0 则除非此时可以直接投递到消费者，否则该消息将被直接丢弃

#### 死信

通过设置 Queue 的 x-dead-letter-exchange 和 x-dead-letter-routing-key 两个属性，死信将被发送到指定的 DLX（Dead Letter Exchange 死信交换机）中，并重新设置关联的路由键，最终路由到对应的死信队列中（本质上和普通交换机、队列一样）。

**成为死信的情况**

- 队列消息长度达到限制
- 消费者拒签消息，且不重新入队
- 消息达到超时时间未被消费



## RocketMQ

阿里巴巴在2012年开源的分布式消息中间件，目前已经捐赠给 Apache 软件基金会，并于2017年9月25日成为 Apache 的顶级项目。作为经历过多次阿里巴巴双十一这种“超级工程”的洗礼并有稳定出色表现的国产中间件，以其高性能、低延时和高可靠等特性近年来已经也被越来越多的国内企业使用。

![RocketMQ模型](/img/RocketMQ模型.svg)

### 基本组件

- 生产者组（Producer）
负责产生消息，RocketMQ 提供 同步、异步和单向 三种消息发送方式。

- 消费者组（Consumer）
负责消费消息，消费者从消息服务器拉取信息并将其输入用户应用程序。

- 名称服务器（NameServer）
用来保存 Broker 相关元信息并给 Producer 和 Consumer 查找信息，类似 Zookeeper。几乎无状态的，支持可以横向扩展。

- 消息服务器（Broker）
消息存储中心，以及其它与消息相关的元数据，包括用户组、消费进度偏移量、队列信息等。分可读写的 Master 和只读不写的 Slave。


### 主要特性

- 灵活可扩展性：天然支持集群，其核心组件都可以在没有单点故障的情况下进行水平扩展
- 海量消息堆积：采用零拷贝原理实现超大的消息堆积能力
- 顺序消息：支持按时间顺序消费，分全局有序和局部有序
- 消息过滤：分服务器端过滤和消费端过滤。
- 事务消息：支持事务消息
- 消息回溯：支持重新消费已经被消费成功的消息，可以向前回溯，也可以向后回溯










## Kafka

Kafka是由 Apache 软件基金会开发的一个开源分布式流处理平台，由Scala和Java编写，用作消息队列和数据处理。

![Kafka模型](/img/Kafka模型.svg)


### 基本组件

- Broker
消息中间件处理节点，一个Kafka节点就是一个Broker，一个或者多个Broker可以组成一个Kafka集群

- Topic
每条发布到Kafka集群的消息都有一个类别，这个类别被称为Topic。

- Partition
用于存放消息的队列，存放的消息都是有序的，同一主题可以分多个Partition。

- Producer
消息生产者，向Broker发送消息的客户端

- Consumer
消息消费者，从Broker读取消息的客户端，通过offset标识消息被消费的位置

- Consumer Group
每个Consumer属于一个特定的 Consumer Group，一条消息可以发送到多个不同的Consumer Group，但是同一个Consumer Group中只能有一个Consumer能够消费该消息


### 主要特性

- 快速持久化：可以在 O(1) 的系统开销下进行消息持久化
- 高吞吐：在一台普通的服务器上即可以达到10W/s的吞吐速率
- 完全的分布式系统：Broker、Producer和Consumer都原生自动支持分布式，自动实现负载均衡
- 零拷贝技术(zero-copy)：减少IO操作步骤，提高系统吞吐量
- 支持同步和异步复制两种高可用机制
- 丰富的消息拉取模型，支持数据批量发送和拉取
- 数据迁移、扩容对用户透明
- 无需停机即可扩展机器
- 高效订阅者水平扩展、实时的消息订阅、亿级的消息堆积能力、定期删除机制

 

## ActiveMQ

ActiveMQ 也是由 Apache 出品，旨在为应用程序提供高效、可扩展、稳定、安全的企业级消息通信，它是一个完全支持 JMS1.1 和 J2EE 1.4 规范的 JMS Provider 实现，比如 JMX 管理、主从管理、消息组通信、消息优先级、延迟接收消息、虚拟接收者、消息持久化、消息队列监控等等。支持多种语言的客户端和协议，而且可以非常容易的嵌入到企业的应用环境中，并有许多高级功能。

![ActiveMQ模型](/img/ActiveMQ模型.svg)

### 基本组成

- Broker
- Producer
- Consumer
- Topic
- Queue
- Message

+ 连接器 Connector
ActiveMQ Broker 的主要作用是为客户端应用提供一种通信机制，为此 ActiveMQ 提供了一种连接机制，并用连接器来描述这种连接机制。连接器分两种：client-broker 之间的传输连接器（transport connector）、broker-broker 之间的网络连接器（network connector）。


### 主要特性

- 服从JMS规范：完全支持JMS 1.1和J2EE 1.4规范，包括同步或异步的消息分发，一次和仅一次的消息分发，分布式事务消息、消息接收、订阅、持久化等等
- 连接灵活性：ActiveMQ 提供了多种连接模式，例如 in-VM、TCP、SSL、NIO、UDP、多播、JGroups、JXTA等
- 多协议：OpenWire、STOMP、REST、XMPP、AMQP等
- 多语言：支持Java、C/C++、.NET、Perl、PHP、Python、Ruby等
- 代理集群：多个 ActiveMQ代理可以组成一个集群来提供服务
- 简单的管理：ActiveMQ 是以开发者思维被设计的，所以它并不需要专门的管理员，提供了简单又实用的管理特性。
- 易于整合：ActiveMQ 可以通过 Spring 配置文件的方式很容易嵌入到Spring应用中，也可以轻松地与CXF、Axis等Web Service技术整合，以提供可靠的消息传递



## MQ 对比

| 特性 |  RabbitMQ  |  RocketMQ  | Kafka | ActiveMQ |
|---|---|---|---|---|
| 开发语言   |  Erlang | Java  |  Scala&Java | Java  |
| 客户端支持 | 几乎所有常用语言 | Java、C++ | 社区支持多语言 ｜ Java、C/C++、Python、PHP、Perl、.net等 |
| 协议支持 | AMQP、XMPP、SMTP、SMTOP | 自定义协议，社区提供JMS | 自定义协议，社区提供了HTTP协议支持 | OpenWire、SMTOP、REST、XMPP、AMQP |
| 可用性 | 高，基于主从架构实现高可用 | 很高，分布式架构 | 很高，分布式，一个数据多个副本，少数机器宕机，不会丢失数据，不会导致不可用 | 高，基于主从架构实现高可用 | 
| 集群 | 支持 | 支持 | 支持 | 支持 |
| 负载均衡 | 支持 | 支持 | 支持 | 支持 |
| 单机吞吐量 | 万级 | 十万级 | 十万级 | 万级 |
| topic数量对吞吐量的影响 | - | topic达到几百/几千的级别后，吞吐量会有较小幅度的下降，在同等机器下，可以支撑大量的 topic | topic从几十到几百个时候，吞吐量会大幅度下降，因为Kafka的每个Topic、每个分区都会对应一个物理文件，若需要支撑大规模的topic，则需要增加更多的机器资源 | - |
| 消息批量操作 | 不支持 | 支持 | 支持 | 支持 |
| 消息推拉模式 | pull/push均支持 | pull/push均支持 | pull | pull/push均支持 |
| 消息可靠性 | 可以做到不丢失 | 可以做到不丢失 | 可以做到不丢失 | 有较低的概率丢失数据 |
| 消息延迟 | 微秒级 (最快) | 毫秒级 | 毫秒级 | 毫秒级 |
| 持久化能力 | 内存、文件，支持数据堆积，但影响生产速率 | 磁盘文件 | 磁盘文件，只要容量够，可以做到无限堆积 | 内存、文件、数据库 |
| 事务消息 | 不支持 | 支持 | 不支持 | 支持 |
| 管理界面 | web管理界面 | web管理界面 | web管理界面 | web管理界面 |





