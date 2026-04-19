---
title: 分布式缓存
date: 2023-04-14
---
## 缓存分类

缓存之所以能够加快系统速度，本质原因在于：
- 减小了 CPU 消耗：将原来需要实时计算的内容提前准备好，复用公用的数据，减少 CPU 消耗，从而提升响应性能
- 减小了 I/O 消耗：将原来对网络、磁盘等慢速介质的读写访问变为对内存等快速介质的访问，从而提升响应性能


### 客户端缓存

也即浏览器的 HTTP 缓存，通过 HTTP 的缓存机制实现，有两种方式：

1. 强制缓存：根据响应中的 Cache-Control (相对时间) 和 Expires (绝对时间) 判断请求是否过期，没过期直接从缓存中取响应结果
2. 协商缓存：强制缓存没有命中时，可以与服务端协商之后，通过协商结果来判断是否使用本地缓存，一般响应 304 告知使用缓存。两种头部实现
   - Last-Modified 和 If-Modified-Since 根据时间判断是否有更新
   - Etag 和 If-None-Match 根据唯一标识判断 （类似CAS）

### CDN 缓存

CDN服务一般是由第三方提供的内容分发网络服务，主要是用于缓存静态的数据，比如：图片、音频、视频，这些数据基本都是不变的，那么命中率就很高。CDN厂商花费大价钱在全国各地建立CDN的服务站点，用于用户的就近访问，减少响应时间。


### 服务端缓存

#### 本地缓存

指的是在应用中的缓存组件，其最大的优点是应用和 cache 在同一个进程内部，请求缓存非常快速，没有过多的网络开销等，在单应用不需要集群支持或者集群情况下各节点无需互相通知的场景下使用本地缓存较合适；同时，它的缺点也是应为缓存跟应用程序耦合，多个应用程序无法直接的共享缓存，各应用或集群的各节点都需要维护自己的单独缓存，对内存是一种浪费。常用实现如 HashMap、Ehcache、Caffeine Cache 以及通过 Spring Cache 进行整合等等，可以通过定时任务将数据库中的数据刷新到缓存中。

#### 分布式缓存

与应用分离的缓存组件或服务，其最大的优点是自身就是一个独立的应用，与本地应用隔离，可以实现多个应用的共享访问。常用实现如 Memcached、Redis 等。相比于本地缓存，分布式缓存的优点包括 容量和性能可扩展、高可用性，缺点是存在网络延迟和复杂性的提升。



## 缓存问题

### 缓存穿透

大量请求的 key 不合理，既不存在于缓存，也不存在于数据库 。导致这些请求直接到达数据库服务器，根本不经过缓存这一层，从而对数据库造成了巨大的压力。

**解决方法：**
- 接口层进行校验，如用户鉴权，id 做基础校验，id 不合法的直接拦截
- 缓存中设置无效的 key，例如 `set <key> nullObject`
- 布隆过滤器（多个 hash 函数，key 对应的 hashCode 都存在，该元素才可能存在）


### 缓存击穿

请求的 key 对应的是热点数据 ，该数据存在于数据库中，但可能由于缓存过期，不存在于缓存中。进而导致瞬时大量的请求直接打到了数据库上，对数据库造成了巨大的压力。

**解决方法：**
- 针对热点数据提前预热，设置热点数据永不过期
- 通过分布式锁，保证只有第一个请求会落到数据库上，并将数据存入缓存。后续的请求可以直接从缓存中取数据，减少数据库的压力
- 接口限流、熔断、降级


### 缓存雪崩

缓存在同一时间大面积的失效，或缓存服务器宕机，导致大量的请求都直接落到了数据库上，对数据库造成了巨大的压力。

**解决方法：**
- 搭建高可用的 Redis 集群，避免单点故障（主从、哨兵、集群）
- 设置不同的失效时间，防止同一时间大量 key 失效。例如随机设置过期时间。


### 缓存污染

缓存中一些只会被访问一次或者几次的的数据，被访问完后，再也不会被访问到，但这部分数据依然留存在缓存中，消耗缓存空间。

**解决方法：**
- 合理设计缓存容量，建议设为总数据量 15%-30%
- 调整缓存淘汰策略，如 volatile-lru, volatile-random, allkeys-lru 等
- 像 Linux 内存页 / MySQL 数据页 将缓存分活跃/非活跃区，提高数据进入活跃区的门槛，来缓解缓存污染。




## 锁机制

### 本地锁

对于单体应用，可以直接使用 synchronized / JUC.Lock 这些本地锁解决缓存击穿，但要注意双重检查，以及查询缓存、查数据库、放入缓存都要在临界区里保证原子性。样例：

```java
/**
 * redis没有数据 -> 查询DB -> 放入缓存 -> 返回结果
 */
public Data getDataWithLocalLock() {
    // 本地锁解决方案
    synchronized (this) {
        // 双重检查 - 是否有缓存
        String dataJson = stringRedisTemplate.opsForValue().get("dataJson");
        if (!StringUtils.isEmpty(dataJson))
            return JSON.parseObject(dataJson, new TypeReference<Data>(){});
        
        Object data = getDataFromDB();
        stringRedisTemplate.opsForValue().set("dataJson", JSON.toJSONString(data), 1, TimeUnit.DAYS);
    }
}
```

### 分布式锁

随着业务发展的需要，单体系统演化成分布式集群系统后，由于分布式系统多线程的特点，且分布在不同机器上，使得本地锁策略失效。为了解决这个问题就需要一种**跨机器的互斥机制来控制共享资源的访问**，这就是分布式锁要解决的问题。通常可以基于 数据库、Redis、Zookeeper 等方式实现。

#### Redis + Lua

原理：基于 Redis（单线程）的原子操作 `set <key> <random_value> NX EX 30`，仅当 key 不存在时才会设置成功，否则返回 nil，并且设置过期时间。

**重难点：**
1. 防止解锁失败（掉线/宕机）造成程序死锁，key 必须设置过期时间，并且和加锁操作是原子的
2. 为了防止解锁操作误删了其它线程加的锁，需要把 value 设为该线程唯一的特殊值(如 UUID)，解锁时先获取锁的值，和自己的特殊值相等时才进行删除。
3. 为了防止网络请求的延迟，造成误删其它线程加的锁，获取 value 进行对比和 删除 key 两个操作必须是原子的（Lua 脚本）。
4. 为了防止业务还未完成锁已经过期释放了，需要对锁进行自动续期，或直接设置一个很长的过期时间，例如业务中可以设 300s

```java
public Data getDataWithRedisLock() {
    // 1. 设置分布式锁以及过期时间 [set lock uuid nx ex]
    String uuid = UUID.randomUUID().toString();
    Boolean lock = stringRedisTemplate.opsForValue().setIfAbsent("lock", uuid, 30, TimeUnit.SECONDS);

    // 2. 加锁成功 -> 查询 DB
    if(lock) {
        Data data;
        try {
            data = getDataFromDB();
        } finally {
            // 3. Lua 脚本执行原子查询和删除
            String lockValue = stringRedisTemplate.opsForValue().get("lock");
            String script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
            stringRedisTemplate.execute(new DefaultRedisScript<>(script, Long.class), Arrays.asList("lock"), uuid);
        }
        return data;
    } else {
        // 加锁失败 -> 自旋
        try{
            Thread.sleep(50);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        return getDataWithRedisLock();
    }
}
```

#### Redisson

Redisson 是一个在 Redis 的基础上实现的 Java 驻内存数据网格，提供了一系列分布式的Java常用对象和许多分布式服务，包括 BitSet, BlokingQueue, Lock, Bloom Filter 等，同时还提供了异步 Async、反射式 Reactive、RxJava2标准接口。

**使用：**
- 导入 Redisson 坐标
- 配置 RedissonClient 对象
- 获取锁对象 
  - RLock 可重入锁 
  - RReadWriteLock 读写锁
  - RSemaphore 信号量，配合 acquire()/release()，可以实现限流
  - RCountDownLatch 闭锁，执行指定次数后继续

```java
// 注入 RedissonClient 对象
@Bean(destroyMethod = "shutdown")
public RedissonClient redisson(){
    Config config = new Config();
    // 创建单例模式的配置
    config.useSingleServer().setAddress("redis://" + ipAddr + ":6379");
    return Redisson.create(config);
}

public Data getDataWithRedissonLock() {
    RLock lock = redissonClient.getLock("lock");
    lock.lock();

    Data data;
    try {
        data = getDataFromDB();
    } finally {
        lock.unlock();
    }
    return data;
}
```

**加锁方式：**
- lock() 阻塞式加锁，如果没有指定时间，由看门狗定期在`1/3 * 锁时间`（默认 30s）时自动续期，本质上是定时任务。
- tryLock() 可以获得加锁结果
- lock()/tryLock() 如果传递了加锁时间和单位，则到期自动释放锁，看门狗不续命


## 缓存一致性

指缓存与数据库的一致性问题，一般不要求强一致性，都是追求最终一致性。

### 更新数据库 -> 删除缓存

- 并发时可能有暂时的脏数据
- 解决方法：
  - 重试机制，例如配合 MQ/Canal
  - 加分布式锁，原子地更新数据库和缓存。但是存在缓存资源浪费、性能降低的问题

### 删除缓存 -> 更新数据库

- 并发时依然有不一致的问题（A删除缓存，B查缓存不存在取数据库，然后又把旧数据存入缓存）
- 解决方法：延迟双删，即删除缓存后更新数据库，然后等一段时间再删除缓存。但延迟时间很难评估


### 设计思路
- 缓存数据不应该是实时性、一致性要求超高的，所以缓存 + 过期时间，足够解决大部分业务对于缓存的要求
- 性能和一致性不能同时满足，为了性能考虑，通常会采用「最终一致性」的方案
- 遇到实时性、一致性要求高的数据，即使速度慢点，也应该查数据库
- 我们不应该过度设计，增加系统的复杂性



## Spring Cache

Spring 支持多种本地缓存的实现方式，例如 SimpleCache(ConcurrentMap实现), RedisCache, EhCache, CaffeineCache... 两个核心接口：
- `org.springframework.cache.Cache` 定义缓存的各种操作
- `org.springframework.cache.CacheManager` 管理各个cache缓存组件

**使用**
- 导入 spring-boot-starter-cache 依赖
- 配置缓存类型，主启动类添加`@EnableCaching`
- 需要缓存的方法上添加相应的注解

**原理**
- 缓存的自动配置类 CacheAutoConfiguration 向容器中导入了 CacheConfigurationImportSelector
- CacheConfigurationImportSelector 的 selectImports() 导入所有缓存类型的配置类，默认启用 SimpleCacheConfiguration
- SimpleCacheConfiguration 配置类向容器中注入了一个 ConcurrentMapCacheManager 实例
- ConcurrentMapCacheManager 底层创建一个 ConcurrentMapCache 管理缓存

**缓存注解**
- `@EnableCaching`：用于 SpringBoot 的启动类开启注解功能
- `@CacheConfig`：用于对类进行配置，对整个类的缓存进行配置，可用 @Cacheable 取代
- `@Cacheable`：通常用于配置方法，将方法的返回结果注入到缓存对象中
  - value/cacheNames: 指定缓存名（跟在 key-prefix 后面）
  - key/keyGenerator：指定缓存对应的 key 值，默认使用方法参数生成，可以使用 spel 指定
  - condition/unless: 条件缓存
  - sync：默认 false，为 true 时开启同步锁
- `@CacheEvict`：可用于类或方法，用于清空缓存
  - allEntries: true 表示删除域名下所有缓存
- `@CachePut`：强制执行方法并将返回结果放入缓存，常用于更新 DB 的方法
  - 属性同 @Cacheable
- `@Caching`: @Cacheable + @CachePut + @CacheEvict

**实际问题**
- 读缓存：
  - 缓存穿透：spring.cache.redis.cache-null-values 指定是否缓存空数据
  - 缓存击穿：默认是无加锁的，可以置 Cacheable 的 sync 为 true
  - 缓存雪崩：可以设置随机时间
- 写缓存：
  - 读写加锁
  - 引入 Canal
  - 读多写多的场景，可以直接查 DB

常规数据（读多写少，即时性，一致性要求不高的数据）完全可以使用 Spring-Cache。特殊数据进行特殊设计。
