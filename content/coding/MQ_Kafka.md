---
title: MQ-Kafka
date: 2023-08-01
---
## 简介

Kafka是一个分布式的基于发布/订阅模式的消息队列，主要应用于大数据实时处理领域。同时也是一个开源的分布式事件流平台（Event Streaming Platform），用于高性能数据管道、流分析、数据集成和关键任务应用。

更多关于消息队列的介绍见：[消息队列概述](https://xchanper.github.io/coding/MQ_Abstract.html)

### 应用场景

除了传统 MQ 的功能：流量削峰、应用解耦、异步通信之外，Kafka 还可以用于日志同步和实时计算等场景。

#### 日志同步

大规模分布式系统中的机器非常多而且分散在不同机房中，分布式系统带来的一个明显问题就是业务日志的查看、追踪和分析等行为变得十分困难，对于集群规模在百台以上的系统，查询线上日志很恐怖。为了应对这种场景统一日志系统应运而生，日志数据都是海量数据，通常为了不给系统带来额外负担一般会采用异步上报，这里Kafka以其高吞吐量在日志处理中得到了很好的应用。

![kafka日志同步](/img/kafka日志同步.svg)


#### 实时计算

随着据量的增加，离线的计算会越来越慢，难以满足用户在某些场景下的实时性要求，因此很多解决方案中引入了实时计算。很多时候，即使是海量数据，我们也希望即时去查看一些数据指标，实时流计算应运而生。实时流计算有两个特点，一个是实时，随时可以看数据；另一个是流。下面是Kafka在某个典型实时计算系统中的应用。

![kafka实时计算](/img/kafka实时计算.svg)





### 基础架构

![基本架构](/img/基本架构.jpg)

- **Producer**：消息生产者，向 Kafka Broker 发消息的客户端。
- **Consumer**：消息消费者，向 Kafka Broker 取消息的客户端。
- **Consumer Group**：消费者组，由多个 Consumer 组成。消费者组内每个消费者负责消费不同分区的数据，一个分区只能由一个组内消费者消费；消费者组之间互不影响。任何消费者都属于某个消费者组，因此消费者组是逻辑上的一个订阅者。
- **Broker**：单个 Kafka 实例就是一个 Broker。一个 Kafka 集群由多个 Broker 组成，一个 Broker 里可以容纳多个 Topic。
- **Topic**：主题，可以理解为一个队列，生产者和消费者面向的都是一个 Topic
- **Partition**：分区。为了提高吞吐量，一个 Topic 可以分为多个 Partition 并分布在多个 Broker 上，每个 Partition 都是一个有序的队列。
- **Replica**：副本。为了提高可用性，每个 Partition 都有若干个副本，包括 Leader 和若干个 Follower
- **Leader**：Partition 的主节点，发送/消费数据都只针对 Leader
- **Follower**：Partition 的从节点，实时同步 Leader 数据，Leader 发生故障时进行选举。


## 安装使用

### 配置

kafka_2.13-3.5.1/config/server.properties

```properties
#broker 的全局唯一编号，不能重复，只能是数字。
broker.id=0
#处理网络请求的线程数量 
num.network.threads=3
#用来处理磁盘 IO 的线程数量 
num.io.threads=8 
#发送套接字的缓冲区大小 
socket.send.buffer.bytes=102400
#接收套接字的缓冲区大小 
socket.receive.buffer.bytes=102400
#请求套接字的缓冲区大小
socket.request.max.bytes=104857600
#kafka 运行日志(数据)存放的路径，可以配置多个，用","分隔 
log.dirs=/opt/module/kafka/datas
#topic 在当前 broker 上的分区个数
num.partitions=1
#用来恢复和清理 data 下数据的线程数量 
num.recovery.threads.per.data.dir=1
# 每个topic创建时的副本数，默认时1个副本 
offsets.topic.replication.factor=1
#segment 文件保留的最长时间，超时将被删除
log.retention.hours=168
#每个 segment 文件的大小，默认最大 1G 
log.segment.bytes=1073741824
```

### 命令

```shell
# 启动 zk
./zkServer.sh start

# 启动kafka服务器
./kafka-server-start.sh server.properties

# 创建一个名为 firstTopic 的主题，需要指定broker、分区数、副本数
./kafka-topics.sh --bootstrap-server localhost:9092 --create --partitions 1 --replication-factor 1 --topic firstTopic

# 查看某个 broker 下的所有主题
./kafka-topics.sh --bootstrap-server localhost:9092 --list

# 生产者连接到broker，然后可以发送消息
./kafka-console-producer.sh --bootstrap-server localhost:9092 --topic firstTopic

# 消费者连接到broker，然后可以（从头）接收消息
./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic --from-beginning firstTopic
```

停止 Kafka 集群时，一定要等 Kafka 所有节点进程全部停止后再停止 Zookeeper 集群。因为 Zookeeper 集群当中记录着 Kafka 集群相关信息，Zookeeper 集群一旦先停止， Kafka 集群就没有办法再获取停止进程的信息，只能手动杀死 Kafka 进程了。


### 监控工具

EFAK 提供了管理查看 Kafka 数据的 Web 页面

![EFAK](/img/EFAK.png)


### Kraft

Kafka 现有架构的元数据存储在 zookeeper 中，运行时动态选举 controller 进行 Kafka 集群管理。而新版的 kraft 模式架构不再依赖 zookeeper 集群， 而是用三台 controller 节点代替 zookeeper，元数据保存在 controller 中，由 controller 直接进行 Kafka 集群管理。

![Kraft](/img/Kraft.png)

**优点：**
- Kafka不再依赖外部框架，而是能够独立运行
- controller 管理集群时，不再需要从 zookeeper 中先读取数据，集群性能上升
- 由于不依赖zookeeper，集群扩展时不再受到zookeeper读写能力限制
- controller 不再动态选举，而是由配置文件规定






## Producer


### 发送流程

Kafka的消息是一个一个的键值对，键可以设置为默认的null。键有两个用途，可以作为消息的附加信息，也可以用来决定该消息被写入到哪个Partition。Topic的数据被分成一个或多个Partition，Partition是消息的集合，Partition是Consumer消费的最小粒度。

Kafka通过将Topic划分成多个Partition，Producer将消息分发到多个本地Partition的消息队列中，每个Partition消息队列中的消息会写入到不同的Leader节点。

![kafka消息发送](/img/kafka消息发送.svg)


Producer生成消息发送到Broker，涉及到大量的网络传输，如果一次网络传输只发送一条消息，会带来严重的网络消耗。为了解决这个问题，Kafka采用批量发送的方式。在消息发送的过程中，涉及到了两个线程：main 线程和 sender 线程。

![生产者发送流程](/img/生产者发送流程.png)

- main 线程将外部数据发送至 RecordAccumulator 记录收集器(RA)，过程如下：
  - 拦截器做增加处理
  - 序列化器
  - 分区器将数据切片发送至 RA
    - RA 是多个双端队列的本地缓冲区，队列的每个元素是一个批记录ProducerBatch
      - createdMs：批记录的创建时间
      - topicPartion：对应的Partition元数据
      - recordsBuilder：暂存的实际数据
    - RA 默认 32MB，每个队列默认 16KB
    ![RecordAccumulator](/img/RecordAccumulator.svg)

- sender 线程从 RA 中拉取消息发送到 Broker：
  - 当 RA 中的 ProducerBatch 满足数据累积到`batch.size`，或等待`linger.ms`后，将拉取数据组成 request
    - `batch.size`默认16KB，适当增加可以提高吞吐量，但延迟加大
    - `linger.ms`默认0ms，即无延迟立即发送
  - 经 Selector 发送至 Broker，并根据返回的 ack 做出应答：
    - 0: 生产的消息不需要等 broker 应答，传输效率高，但可靠性差
    - 1: 生产的消息要等 Leader 收到数据并确认，如果 Leader 宕机数据可能丢失
    - -1/all: 默认值，生产的消息要等 Leader 和 ISR 所有节点的确认，可靠性最高，但不完全保证数据不丢失（如仅一台 Leader）
  - 消息发送异常将自动重试，次数为 Integer.MAX_VALUE;


**核心源码**
```java
//Sender读取记录收集器，按照节点分组，创建客户端请求，发送请求
public void run(long now) {
  Cluster cluster = metadata.fetch();
  //获取准备发送的所有分区
  ReadCheckResult result = accumulator.ready(cluster, now);
  //建立到Leader节点的网络连接，移除还没有准备好的节点
  Iterator<Node> iter = result.readyNodes.iterator();
  while(iter.hasNext()) {
    Node node = iter.next();
    if (!this.client.read(node, now)) {
      iter.remove();
    }
    //读取记录收集器，返回的每个Leader节点对应的批记录列表，每个批记录对应一个分区
    Map<Integer, List<RecordBatch>> batches = accumulator.drain(cluster, result.readyNodes, this.maxRequestSize, now);
    //以节点为级别的生产请求列表，即每个节点只有一个客户端请求
    List<ClientRequest> requests = createProduceRequests(batches, now);
    for (ClientRequest request : requests) {
      client.send(request, now);
    }
    //这里才会执行真正的网络读写，比如将上面的客户端请求发送出去
    this.client.poll(pollTimeout, now);
  }
}
```


### 分区策略

Producer发送消息到Broker时，会根据Paritition机制选择将消息存储到哪一个Partition。如果Partition机制设置合理，所有消息可以均匀分布到不同的Partition里，这样就实现了负载均衡。如果一个Topic对应一个文件，那这个文件所在的机器I/O将会成为这个Topic的性能瓶颈，而有了Partition后，不同的消息可以并行写入不同的Partition中，极大的提高了吞吐率。所谓的Partition机制也就是Poducer消息partitioning策略

#### DefaultPartitioner

分三种情况：
- 指定 partition 的情况下，直接取指定的partition值
`public ProducerRecord(String topic, Integer partition, K key, V value)`

- 没有指定 partition 但有 key 的情况下，将 key 的 hash 值模上分区数取余得到partition值
`public ProducerRecord(String topic, K key, V value)`

- 既没有指定 partition 也没有 key 的情况下，第一次调用时随机生成一个整数（后面每次调用在这个整数上自增），模上分区数取余得到 partition 值，也即 round-robin 轮询
`public ProducerRecord(String topic, V value)`


#### 自定义分区器

可以根据实际的业务需要，实现Partitioner接口，重写partition方法来自定义分区器。

```java
public class MyPartitioner implements Partitioner {

    /**
     * Compute the partition for the given record.
     *
     * @param topic The topic name
     * @param key The key to partition on (or null if no key)
     * @param keyBytes The serialized key to partition on( or null if no key)
     * @param value The value to partition on or null
     * @param valueBytes The serialized value to partition on or null
     * @param cluster The current cluster metadata
     */
    @Override
    public int partition(String topic, Object key, byte[] keyBytes, Object value, byte[] valueBytes, Cluster cluster) {
        // 具体规则
        return 0;
    }
}

// 指定分区器
properties.put(ProducerConfig.PARTITIONER_CLASS_CONFIG, "com.example.kafka.producer.MyPartitioner");
```





### Java客户端

#### 引入依赖

```xml
<!-- 原生客户端 -->
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>3.5.1</version>
</dependency>

<!-- SpringBoot 整合 -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

#### 原生客户端
```java
// 1. 配置参数
Properties properties = new Properties();
properties.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
properties.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");
properties.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, "org.apache.kafka.common.serialization.StringSerializer");

// 2. 创建生产者
KafkaProducer<String, String> producer = new KafkaProducer<>(properties);
for (int i = 0; i < 5; i++) {
    // 3. 发送消息（至 RecordAccumulator 缓冲区）
    // 3.1 默认异步
    // 3.2 如果需要同步发送，对send()返回的Future调用get()
    ProducerRecord<String, String> producerRecord = new ProducerRecord<>("firstTopic", "hello-" + i);
    producer.send(producerRecord, new Callback() {
        
        // 4. 处理响应
        @Override
        public void onCompletion(RecordMetadata recordMetadata, Exception e) {
            if (e == null) {
                System.out.println("消息发送成功：topic: " + recordMetadata.topic()
                        + ", partition: " + recordMetadata.partition());
            } else {
                e.printStackTrace();
            }
        }
    });
}

// 5. 关闭生产者
producer.close();
```


#### SpringBoot 客户端

**配置**
```xml
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.apache.kafka.common.serialization.StringSerializer
```

**KafkaTemplate**
```java
@Resource
KafkaTemplate<String, String> kafkaTemplate;

@RequestMapping("produce")
public String produce(String msg) {
    kafkaTemplate.send("firstTopic", msg);
    return "Success";
}
```



### 生产经验

#### 提高吞吐量

```java
// batch.size: 批次大小，默认16K
properties.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
// linger.ms: 等待时间，默认0。建议 5-100ms
properties.put(ProducerConfig.LINGER_MS_CONFIG, 1);
// buffer.memory: RecordAccumulator 缓冲区大小，默认32M:
properties.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432);
// compression.type: 压缩，默认 none，可配置 gzip/snappy/lz4/zstd
properties.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, "snappy");
```


#### 数据可靠

Kafka 的数据可靠性是依赖 ACK 机制实现的。

- **ack = 0**，生产者发送过来的数据，不需要等数据落盘应答

    ![ack0](/img/ack0.png)
    
    发送完消息之后如果 Leader 挂了，那么数据就直接丢了。可靠性差，但效率最高。

    <br>

- **ack = 1**，生产者发送过来的数据，Leader收到数据后应答。

    ![ack1](/img/ack1.png)

    Leader 收到消息后返回 ack，然后准备同步 Follower，此时 Leader 挂了，那么新 Leader 就丢失了该消息。可靠性中等，效率一般。一般用于传输普通日志，允许丢个别数据。

    <br>

- **ack = -1/all**，生产者发送过来的数据，Leader 和 ISR 集合里面的所有节点收齐数据后应答。
    
    ![ack-1](/img/ack-1.png)

    Leader 和所有 Follower 都接收到消息后才返回 ack，因此能够确保数据的可靠性。但无疑会增加响应的延迟，响应时间取决于最慢的机器。适合可靠性要求高的场景。
    
    <br>

    进一步的，我们考虑一种特殊情况：Kafka同步时，某个Follower由于某种故障一直无法同步，那么此时消息响应就会一直停滞❓

    <br>

    为了解决这一问题，Kafka 引入了 **ISR：In-Sync Replica Set**，即和 Leader 保持同步的 Leader+Follower 集合。如果某个Follower长时间未向Leader发送通信请求或同步数据，则该Follower将被踢出ISR，该时间阈值由`replica.lag.time.max.ms`参数设定，默认30s。这样就不用等长期联系不上或者已经故障的节点，因此在 ack = -1 的定义里是 Leader+ISR 全部收到数据后即返回响应。

Broker的配置项`min.insync.replicas`(默认值为1)代表了正常写入生产者数据所需要的最少ISR个数，当ISR中的副本数量小于`min.insync.replicas`时，Leader停止写入生产者生产的消息，并向生产者抛出NotEnoughReplicas异常，阻塞等待更多的Follower赶上并重新进入ISR。被Leader应答的消息都至少有`min.insync.replicas`个副本，因此能够容忍`min.insync.replicas - 1`个副本同时宕机。

根据上面的分析，我们可以得出：

::: tip 结论
数据完全可靠条件 = ACK设为-1 + 分区副本大于等于2 + 应答最小副本数大于等于2
:::

后文如无特殊说明，统一 ack = -1
```java
// 设置acks 
properties.put(ProducerConfig.ACKS_CONFIG, "all");
// 重试次数retries，默认是int最大值，2147483647 
properties.put(ProducerConfig.RETRIES_CONFIG, 3);
```

#### 数据重复

考虑一种情况，原先的 Leader 响应 ack 后挂了，而且该 ack 中途丢失了，那么 Producer 会再次发送这条消息。进而，新选举出的 Leader 将有两条同样的消息，导致消息重复的问题。

![数据重复](/img/数据重复.png)


**数据传递语义**

- 至少一次 (AtLeastOnce) = ACK设为-1 + 分区副本大于等于2 + ISR里应答的最小副本数量大于等于2
- 最多一次 (AtMostOnce) = ACK设为0

其中，At Least Once 可以保证数据不丢失，但是不能保证数据不重复; At Most Once 可以保证数据不重复，但是不能保证数据不丢失。

但是实际生产中，存在一些重要数据，要求既不能重复也不能丢失，这两者并不能解决我们的问题。Kafka 0.11版本以后，引入了一项重大特性: 幂等性和事务来实现“精确一次”的传递语义。


**幂等性**

在 Kafka 中指Producer不论向Broker发送多少次重复数据，Broker端都只会持久化一条，保证了不重复。

- 精确一次 (Exactly Once): 幂等性 + 至少一次

![幂等性原理](/img/幂等性原理.png)

实现原理上，Kafka 把`<PID, Partition, SeqNumber>`作为判断重复数据的主键。相同主键的消息提交时，Broker只会持久化一条。其中 PID 是生产者ID，Kafka 每次重启都会重新分配；Partition 表示分区号；Sequence Number是单调自增的序列号。也因此，幂等性只能保证在单分区单会话内消息不重复。

```java
// 开启幂等性，默认即true开启
properties.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
```


**事务**

幂等性只能保证在单分区单会话内消息不重复，而为了保证多会话、多分区内的消息不重复，需要使用 Kafka事务。

![kafka事务](/img/kafka事务.png)

- 开启事务，必须开启幂等性。且 Producer 必须先自定义一个全局唯一的 `transactional.id`
- 由事务协调器负责接收 Producer 的 commit 消息，并持久化到一个特殊的事务Topic（记录事务状态）
- 然后开始落盘实际的消息数据，完成后更新事务Topic

```java
Properties properties = new Properties();
// broker、序列化器等省略
// 开启幂等性
properties.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
// 设置事务id
properties.put(ProducerConfig.TRANSACTIONAL_ID_CONFIG, "transaction_id_0");

KafkaProducer<String, String> producer = new KafkaProducer<>(properties);
// 1. 初始化事务
producer.initTransactions();
// 2. 开启事务
producer.beginTransaction();

try {
    ProducerRecord<String, String> producerRecord = new ProducerRecord<>("firstTopic", "message");
    producer.send(producerRecord);
    // 3. 提交事务
    producer.commitTransaction();
} catch (Exception e) {
    // 3. 出现异常回滚事务
    producer.abortTransaction();
} finally {
    producer.close();
}
```


#### 数据有序

消费者在消费消息时，希望能够有序消费，而Kafka能够保证单分区内有序，至于多分区有序消费可以由具体的消费者去实现。

Kafka保证单分区内的有序性类似 TCP 的滑动窗口，即控制发送窗口的大小，在窗口内通过排序保证消息的有序：
- Kafka在1.x版本之前保证数据单分区有序，需满足：
  `max.in.flight.requests.per.connection=1`
  即限制发送窗口为1，只有上一个 request 收到 ack 后才能继续发送，尽管能保证有序，但效率低下
- Kafka在1.x及以后版本保证数据单分区有序，需满足:
  - 未开启幂等性（同上）
    `max.in.flight.requests.per.connection=1`
  - 开启幂等性
    `max.in.flight.requests.per.connection<=5`
    因为在新版 Kafka 启用幂等后，Broker 会缓存 Producer 发来的最近5个 request 的元数据，因此可以保证最近5个request的数据都是有序的。

![数据有序](/img/数据有序.png)

```java
properties.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, "5");
```


## Broker

### 工作流程

#### ZK 存储数据

Kafka 基于 Zookeeper 存储相关数据，结构如图：

![kafka-zk-data-structure](/img/kafka-zk-data-structure.png)


- `/kafka/brokers/topics` 记录所有主题信息
  - 如 `/firstTopic/partitions/0/state` 存储`{"controller_epoch":21,"leader":1,"version":1," leader_epoch":17,"isr":[1,0,2]}`
- `/kafka/brokers/ids` 记录所有服务器
  - 如`{0,1,2}`
- `/kafka/controller` 记录用于辅助选举 Leader 的 Broker
  - 例如`{"version":1 ,"brokerid":0, "timestamp":"1635907476"}`

#### 整理流程

![Broker工作流程](/img/Broker工作流程.png)

1. Broker 启动后自动注册到 ZK
2. 集群中的某个 Broker 成为 Controller，负责监听 brokers 节点变化，辅助 Leader 选举
3. Controller 将节点的具体信息上传至 ZK
4. 其它 Controller 从 ZK 同步相关信息
5. 然后就可以开始接收/应答消息了
6. 当某个 Broker 宕机，Controller 会监听到节点变化。然后从 ZK 获取 ISR 按上述规则选举新 Leader，最后更新 Leader 及 ISR


#### 重要参数

| 参数                          | 描述                 |
| ----------------------------- | ------------------- |
| replica.lag.time.max.ms       | Follower 向 Leader 发送请求的超时时间，超时将被踢出 ISR，默认30s                       |
| auto.leader.rebalance.enable  | 自动 Leader Partition 平衡，默认是 true                                             |
| log.segment.bytes             | Kafka 日志分块存储的大小，默认1G。                                                   |
| log.index.interval.bytes      | kafka 每当写入了固定大小的日志，然后就往 index 文件里面记录一个索引，默认 4kb            |
| og.retention.hours/minutes/ms | Kafka 中数据保存的时间，默认 7 天                                                    |
| log.flush.interval.ms         | 刷盘间隔，默认是 null，立刻刷盘                                                       |


### 副本

#### 基本信息

- Kafka 的副本作用是提高数据的可靠性
- 默认 1 个，增加副本可以提高可靠性，但也会增加存储空间、网络传输等
- 副本分 Leader 和 Follower，仅 Leader 负责收发消息，Follower 负责同步
- 分区中的所有副本统称 AR(Assigned Replicas)，AR = ISR (正常同步的) + OSR (延迟过多的)

![kafka主从同步](/img/kafka主从同步.svg)

同一Partition的Replica不应存储在同一个Broker上，因为一旦该Broker宕机，对应Partition的所有Replica都无法工作，这就达不到高可用的效果。为了做好负载均衡并提高容错能力，Kafka会尽量将所有的Partition以及各Partition的副本均匀地分配到整个集群上。


#### 选举

Kafka 集群中的第一个注册的 Broker 会成为 Controller，负责管理集群 Broker 的上下线、分区副本分配、Leader选举等工作。当 Leader 发生宕机后：
- Controller 会监测到节点变化
- 选举规则：按 AR 列表的顺序，遍历到的第一个在 ISR 中存活的 Broker 将成为新 Leader
- Controller 负责更新 Leader 及 ISR
- 其它 Controller 从 zk 同步数据

各 Partition 的 Leader 负责维护 ISR 列表并将 ISR 的变更同步至ZooKeeper，被移出 ISR 的 Follower 会继续向 Leader 发 FetchRequest 请求，试图再次跟上 Leader 重新进入 ISR。通常只有 ISR 里的成员才可能被选为Leader。当Kafka中`unclean.leader.election.enable`配置为 true(默认false) 且 ISR 中所有副本均宕机的情况下，才允许ISR外的副本被选为Leader，但此时会丢失部分已应答的数据。

#### 故障恢复

每个Kafka副本对象都有两个重要属性：
- LEO (Log End Offset): 日志末端偏移，指向了副本日志中下一条消息的偏移量，即下一条消息的写入位置
- HW (High Watermark): 已同步消息标识，也叫高水位线（因其类似于木桶效应中短板决定水位高度，故取名高水位线）
  - 高水位线以下消息都是备份过的，消费者仅可消费各分区 Leader 高水位线以下的消息
  - 对于任何一个副本对象而言其 HW 值不会大于 LEO 值
  - Leader 的 HW 值由 ISR 中的所有备份的 LEO 最小值决定
  - Follower 在发送 FetchRequest 时会在 PartitionFetchInfo 中携带 Follower 的 LEO

![副本LEO](/img/副本LEO.svg)


 Kafka 原本使用 HW 来记录副本的备份进度，HW 值的更新通常需要额外一轮 FetchRequest 才能完成，存在一些边缘案例导致备份数据丢失或导致多个备份间的数据不一致。Kafka 新引入了 Leader epoch 解决 HW 截断产生的问题，可参考：[KIP-279: Fix log divergence between leader and follower after fast leader fail over](https://cwiki.apache.org/confluence/display/KAFKA/KIP-279%3A+Fix+log+divergence+between+leader+and+follower+after+fast+leader+fail+over)

**如果 Follower 发生故障：**
1. Follower 会被临时踢出 ISR
2. 期间 Leader/Follower 继续接收数据
3. 等该 Folloewr 恢复后，会读取本地磁盘记录的 HW，将 log 文件中高于 HW 的部分截断，然后从 HW 开始重新从 Leader 那同步过来
4. 直到该 Follower 的 LEO >= 该分区的 HW 后就可以重新加入 ISR 了

![故障处理](/img/故障处理.png)


**如果 Leader 发生故障：**
1. Controller 从 AR 中选出一个新 Leader
2. 其余 Follower 会先将各自的 log 文件高于HW的部分截断，然后从新的 Leader 那同步数据。这样可以保证多个副本之间的数据一致性，但并不保证数据不丢失/不重复

![kafka崩溃恢复](/img/kafka崩溃恢复.svg)


#### 副本分配

- Kafka 默认会把分区的 Leader 均匀分散在各个机器上，实现负载均衡，不同分区的 AR 排列错开来提高可靠性
- kafka-reassign-partitions.sh 可以执行手动分配副本/增加副本因子


### 持久化


#### 消息结构


![record结构](/img/record结构.svg)


Kafka 中存储磁盘、网络传输、压缩的基本单元是消息集，其中包含若干条消息。一条完整的消息包含：
- offset：标识在 Partition 中的偏移量(逻辑值)
- message size：消息的大小
- RECORD：
  - crc32：4B，crc32校验值，校验范围为magic至value之间
  - magic：1B，消息格式版本号，0.9.X版本的magic值为0
  - attributes：1B，消息的属性，总共占1个字节，低3位表示压缩类型：0为NONE、1为GZIP、2为SNAPPY、3为LZ4，其余位保留。
  - key length：4B，表示消息的key的长度。-1表示key为空
  - key：消息键，可选
  - value length（4B）：4B，实际消息体的长度。-1表示value为空
  - value：消息体，可选



#### 日志结构

在 Kafka 中，Topic 是逻辑上的概念，而 Partition 是物理上的概念，每个 Partition 对应一组日志文件，Producer 生产的数据会追加到日志文件末尾。

![持久化存储](/img/持久化存储.png)

为防止日志文件过大导致数据定位效率低下，Kafka采取了分片和索引机制， 将每个 Partition 分为多个 Segment。每个 Segment 包括:
- `.log`: 日志文件
- `.index`: 偏移量索引，是保存相对 offset 的稀疏索引，log每写入4kb会新增一条索引项
- `.timeindex`: 时间戳索引文件

这些文件位于同一个文件夹下，该文件夹的命名规则为 `topic名称+分区序号`，例如`firstTopic-0`。分片日志名为当前 Segment 第一条消息的 offset。日志里存储的是序列化后的数据，可以通过：
`kafka-run-class.sh kafka.tools.DumpLogSegments --files ./00000000000000004096.index`
查看日志具体信息。



#### 索引定位

Broker将每个Partition的消息追加到日志中，是以日志分段(Segment)为单位的。当Segment的大小达到阈值(默认是1G)时，会新创建一个Segment保存新的消息，每个Segment都有一个基准偏移量(baseOffset，每个Segment保存的第一个消息的绝对偏移量)，通过这个基准偏移量，就可以计算出每条消息在Partition中的绝对偏移量。 每个日志分段由数据文件和索引文件组，数据文件(文件名以log结尾)保存了消息集的具体内容，索引文件(文件名以index结尾)保存了消息偏移量到物理位置的索引。

在查找某个 offset 的消息时（类似OS虚拟内存）：
1. 首先根据目标 offset 定位 Segment 分片日志文件
2. 从 index 索引文件中找到小于等于目标 offset 的最大 offset 对应的索引项
3. 根据索引项定位到 log 文件
4. 向后遍历找到目标记录

![日志索引](/img/日志索引.png)



**核心代码**
```scala
@volatile var nextOffsetMetadata = new LogOffsetMetadata(activeSegment.nextOffset(), 
                                                        activeSegment.baseOffset, activeSegment.size.toInt);
def append(messages:ByteBufferMessageSet, assignOffsets:Boolean) = {
    //LogAppendInfo对象，代表这批消息的概要信息，然后对消息进行验证
    var appendInfo = analyzeAndValidateMessageSet(messages)
    var validMessages = trimInvalidBytes(messages, appendInfo)
    //获取最新的”下一个偏移量“作为第一条消息的绝对偏移量
    appendInfo.firstOffset = nextOffsetMetadata.messageOffset
    if (assignOffsets) { //如果每条消息的偏移量都是递增的
      //消息的起始偏移量来自于最新的”下一个偏移量“，而不是消息自带的顺序值
      var offset = new AtomicLong(nextOffsetMetadata.messageOffset);
      //基于起始偏移量，为有效的消息集的每条消息重新分配绝对偏移量
      validMessages = validMessages.validateMessagesAndAssignOffsets(offset);
      appendInfo.lastOffset = offset.get - 1 //最后一条消息的绝对偏移量
    }
    var segment = maybeRoll(validMessages.sizeInBytes) //如果达到Segment大小的阈值，需要创建新的Segment
    segment.append(appendInfo.firstOffset,validMessages) //追加消息到当前分段
    updateLogEndOffset(appendInfo.lastOffset + 1) //修改最新的”下一个偏移量“
    if (unflushedMessages >= config.flushInterval) {
      flush() //如果没有刷新的消息数大于配置的，那么将消息刷入到磁盘
    }
}
//更新日志的”最近的偏移量“，传入的参数一般是最后一条消息的偏移量加上1
//使用发需要获取日志的”最近的量“时，就不需要再做加一的操作了
private def updateLogEndOffset(messageOffset:Long) {
    nextOffsetMetadata = new LogOffsetMetadata(messageOffset, activeSegment.baseOffset,activeSegment.size.toInt)
}
```


#### 日志清理

Kafka 中默认的日志保存时间为 7 天，可以通过调整参数 `log.retention.hours/minutes/ms` 修改保存时间。日志过期后有两种处理策略，由参数`log.cleanup.policy`的取值控制：
- delete: 删除日志，又分两个模式：
  - 默认基于时间，以 Segment 中所有记录的最大时间戳作为该文件的时间戳
  - 基于大小，默认删除最早的 Segment
-  compact：压缩日志
   -  对于相同 key 的不同 value 值，只保留最后一个版本。
   -  压缩后的offset可能是不连续的，导致按 key 取值错位。因此这种策略只适合特殊场景，比如消息的key是用户ID，value是用户的资料，通过这种压缩策略，整个消息集里就保存了所有用户最新的资料。


### 高效读写

- Kafka 本身是分布式集群，可以采用分区技术，并行度高
- 读数据采用稀疏索引，可以快速定位要消费的数据
- 索引条目的偏移量存储的是相对于“基准偏移量”的“相对偏移量” ，不是消息的“绝对偏移量”
- 顺序写磁盘
- PageCache + 零拷贝技术，Broker应用层不关心存储的数据，发送不用走应用层，传输效率高


## Consumer

### 消费方式

通常在消息系统中，消息的发送方式有两种，一种是**Push**，比如 Facebook 的 Scribe 和 Cloudera 的 Flume，由 Broker 主动发送消息，目标是尽可能以最快速度传递消息，但无法适应消费速率不同的消费者，可能导致拒绝服务以及网络拥塞。

![消费方式](/img/消费方式.png)

Kafka Consumer 采用的是另一种方式**Pull**，由 Consumer 主动从 Broker 拉取数据，可以适应不同速率的消费者，简化了 Broker 的设计，既可批量消费也可逐条消费，还能选择不同的提交方式从而实现不同的传输语义。缺点是可能会在没有数据时一直拉取空数据。



### 消费规则

- 一个消费者可以消费多个分区数据
- 消费者组（Consumer Group, CG），由多个具有相同 groupId 的 Consumer组成
- 消费者组内每个消费者负责消费不同分区的数据，一个分区只能由一个组内消费者消费
- 如果组内消费者超过主题分区数量，那么会有一部分消费者处于空闲状态，不会接收任何消息。
- 消费者组之间互不影响，任何消费者都属于某个消费者组，因此消费者组是逻辑上的一个订阅者

![ConsumerGroup](/img/ConsumerGroup.png)



### 工作流程

#### 初始化

首先得先介绍 Coordinator，每个消费者组对应的实现消费者组初始化和分区分配的协调器。每个 Kafka Broker 内部都有一个 Coordinator，消费者组选择的方式是：

    Coordinator节点号 = hash(groupId) % _consumer_offsets分区数

其中，_consumer_offsets 分区数默认是50。计算结果对应的 Broker 就是 Coordinator 所在节点。组内所有消费者提交 offset 时就往这个分区去提交offset。


![Consumer工作流程](/img/Consumer工作流程.png)


**初始化流程：**
1. 选出 Coordinator
2. Coordinator 在组内选择一个消费者 Leader，并发送 Topic 信息
3. Consumer Leader 指定消费方案，即消费的分区分配，并发回 Coordinator
4. Coordinator 同步方案给所有 Consumer，就可以开始消费消息了

每个消费者都会和 Coordinator 保持心跳（默认3s），一旦超过 session.timeout.ms (默认45s)，或者处理消息超过 max.poll.interval.ms (默认5min)，该消费者会被移除，并触发再平衡。


#### 拉取消息

1. Consumer::sendFetches 发送消费请求（拉取消息）
2. ConsumerNetworkClient::send 从 Broker 请求消息
3. 成功拉取到消息存入 completedFetches 缓存队列中
4. 经反序列化、拦截器后交付消费者，做具体处理

![消费流程](/img/消费流程.png)




### 消费参数

| 参数名称  | 描述  |
|---|---|
| group.id  | 标记消费者所属的消费者组  |
| enable.auto.commit | 默认为 true，消费者自动周期性地向服务器提交偏移量。 |
| auto.commit.interval.ms | 默认5s，消费者向 Kafka 提交 offset 的频率
| offsets.topic.num.partitions | 默认50个，__consumer_offsets 的分区数 |
| heartbeat.interval.ms | 默认 3s，Kafka 消费者和 coordinator 之间的心跳时间。 |
| session.timeout.ms | 默认 45s，Kafka 消费者和 coordinator 之间连接超时时间。|
| max.poll.interval.ms | 默认5min，消费者处理消息的最大时长。|
| fetch.min.bytes | 默认 1Byte，消费者获取服务器端一批消息最小的字节数。|
| fetch.max.wait.ms | 默认 500ms，获取一批数据的最大时间 |
| fetch.max.bytes | 默认50MB，消费者获取服务器端一批消息最大的字节数 |
| max.poll.records | 默认 500条，一次 poll 拉取数据返回消息的最大条数 |




### Java客户端

#### 引入依赖

```xml
<!-- 原生客户端 -->
<dependency>
    <groupId>org.apache.kafka</groupId>
    <artifactId>kafka-clients</artifactId>
    <version>3.5.1</version>
</dependency>

<!-- SpringBoot 整合 -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

#### 原生客户端

```java
// 1. Kafka 属性配置
Properties properties = new Properties();
properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
// 配置消费者组，必须的
properties.put(ConsumerConfig.GROUP_ID_CONFIG, "test");

// 2. 创建消费者
KafkaConsumer<String, String> consumer = new KafkaConsumer<>(properties);

// 可以指定消费的主题分区
// List<TopicPartition> topicPartitions = new ArrayList<>();
// topicPartitions.add(new TopicPartition("firstTopic", 0));
// consumer.assign(topicPartitions);

// 3. 注册要消费的主题
List<String> topics = new ArrayList<>();
topics.add("firstTopic");
consumer.subscribe(topics);

// 4. 拉取数据
while(true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofSeconds(1));
    for (ConsumerRecord<String, String> record : records) {
        System.out.println(record);
    }
}
```


#### SpringBoot 客户端

**配置**
```xml
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.consumer.group-id=test
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
```

**KafkaListener**
```java
@Configuration
public class ConsumerListener {

   @KafkaListener(topics = "firstTopic")
    public void consume(String msg) {
       System.out.println("Kafka message: " + msg);
   }
}
```


### Offset

offset 表示分区中每条消息的位置信息，是一个单调递增且不变的值。Kafka 0.9 之前会把消费完的 offset 存入 ZK，容易导致网络传输开销大。

而在 Kafka 0.9 中，offset 存入了 Broker 中的一个特殊主题 _consumer_offsets，该主题默认有 50个分区，里面采用 KV 方式存储数据，其中 key 是 `group.id+topic+分区号`，value 是当前 offset 的值。每隔一段时间，Kafka 内部会对这个 topic 进行 compact，也就是每个 group.id+topic+分区号仅保留最新数据。

![consumer-offset](/img/consumer-offset.svg)

offset 由 Consumer 控制，Consumer会在消费完一条消息后递增该offset，也可以指定 offset 来重新消费一些消息。因为 offet 由 Consumer 控制，所以 Kafka Broker 是无状态的，不需要标记消息是否被消费过，也不需要通过Broker去保证同一个Consumer Group只有一个Consumer能消费某一条消息，因此也就不需要锁机制，从而保证了Kafka的高吞吐率。


#### 自动提交

两个参数：
- enable.auto.commit：是否自动周期性地向服务器提交偏移量，默认是 true
- auto.commit.interval.ms：自动提交 offset 的时间间隔，默认是 5s


#### 手动提交

自动提交虽然简单方便，但由于是基于时间提交的，开发者难以把握offset提交的时机。因此 Kafka 也提供了手动提交 offset 的API，分两种:
- commitSync(同步提交)：阻塞当前线程，直到提交成功，并且会自动失败重试
- commitAsync(异步提交)：提交 offset 更新请求后就开始消费下一批数据，没有失败重试


#### 指定 offset

当 Kafka 中偏移量不存在时（消费者组第一次消费/该数据已被删除），由配置`auto.offset.reset`决定消费策略：
- earliest：自动将偏移量重置为最早的偏移量，即CLI中的 --from-beginning
- latest：默认值，自动将偏移量重置为最新偏移量
- none：向消费者抛出异常。

此外，Kafka 还支持指定时间设置 offset 来消费。




### 分区分配

一个  Consumer Group 中有多个 Consumer，一个 topic 有多个 Partition组成，现在的问题是，到底由哪个consumer来消费哪个 partition的数据，即消费分区分配的问题。以下三种情况会触发分区分配：
- 同一个 Consumer Group 内新增消费者
- 消费者离开当前所属的 Group，包括 Shuts Down 或 Crashes
- 订阅的主题新增Partition

Kafka有四种主流的分区分配策略：Range、RoundRobin、Sticky、CooperativeSticky。通过配置参数`partition.assignment.strategy`指定，默认策略是 Range+ CooperativeSticky，可以同时使用多个分区分配策略。

#### Range

Range 针对的是每个 topic：
- 首先对同一个 topic 里面的分区按序号排序，并对消费者按字典序排序。例如7个分区，3个消费者，排序后的分区即 0,1,2,3,4,5,6；消费者即 C0,C1,C2
- 通过**分区数/消费者数**来决定每个消费者应消费几个分区，余下的由前面几个消费者负责。

存在的问题：如果只是针对 1 个 topic 而言，头部消费者多消费 1 个分区影响不大。但如果有 N 个 topic，那么头部消费者将多消费 N 个分区，容易产生数据倾斜。

![Range策略](/img/Range策略.png)


#### RoundRobin

RoundRobin 针对的是集群中所有Topic：
- 把所有的 partition（TopicAndPartition） 和所有的 consumer 都列出来，按 hashcode 排序
- 通过轮询算法来分配 partition 给各个消费者

![RoundRobin策略](/img/RoundRobin策略.png)

轮询策略如果同一消费组内，所有的消费者订阅的消息都是相同的，那么 RoundRobin 策略的分区分配会是均匀的。否则分区分配就不是完全的轮询分配，有可能会导致分区分配的不均匀。



#### Sticky

粘性分配，尽量均衡的放置分区到消费者上面，在出现同一消费者组内消费者出现问题的时候，会尽量保持原有分配的分区不变化。

而 CooperativeStickey 类似 Sticky，并支持渐进重平衡过程，这个过程可以允许消费者继续保留当前的分区不变化，然后等待协调者重新分配增量的分区。



### 生产经验

#### 消费者事务

生产中的问题：
- 重复消费: 已经消费了数据，但 offset 没提交
- 漏消费: 先提交 offset 后消费，可能会造成数据的漏消费

如果想完成 Consumer 端的精准一次性消费，那么需要 Kafka 消费端将消费过程和提交 offset 过程做原子绑定。此时我们需要将Kafka的offset保存到支持事务的自定义介质(比如 MySQL)。TODO


#### 数据积压

主要目的是要提高消费者的吞吐量，例如：
- 增加 Topic 的分区数，并且同时提升消费组的消费者数量，而这缺一不可
- 如果是下游的数据处理不及时，可以提高每批次拉取的数量，减少网络浪费