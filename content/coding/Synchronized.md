---
title: Synchronized 锁机制
date: 2024-01-05
---
为了避免临界区的竞态条件发生，可以用非阻塞式的原子变量，也可以用阻塞式的锁。Java 多线程的锁都是**对象锁**，采用互斥的方式让同一时刻只有一个线程能够持有对象锁，从而进入临界区，而其它线程只能阻塞等待，因此不用担心线程上下文切换造成共享资源错乱。


## 使用方式

```java
// 形式1：关键字在实例方法上，锁为当前实例
public synchronized void instanceLock() {
    // code
}

// 形式2：关键字在静态方法上，锁为当前 Class 对象
public static synchronized void classLock() {
    // code
}

// 形式3：关键字在代码块上，锁为括号里面的对象
public void blockLock() {
    Object o = new Object();
    synchronized (o) {
        // code
    }
}

// 等价于形式1，锁为当前实例
public void blockLock() {
    synchronized (this) {
        // code
    }
}

// 等价于形式2，锁为当前Class对象
public void blockLock() {
    synchronized (this.getClass()) {
        // code
    }
}
```


## 原理 - Monitor

了解 Monitor 之前首先要知道对象在 JVM 中的内存布局，主要包括：
- 对象头：存储对象的基础信息，GC状态、元数据等
  - Mark Word：对象标记字段，存储一些标记位，如哈希码、锁状态，分代年龄等
  - Klass Pointer：指向对象对应的 Class 对象
- 实例数据：存储对象实例数据
- 对齐填充：填充至 8Byte 整数倍

其中跟锁相关的数据在对象头的 Mark Word 中。

![](/img/JVM对象内存布局.png)



JVM 中的每个对象都会关联一个 Monitor 监视器，或者叫管程，一旦某个线程使用 synchronized 给对象上锁（重量级锁），该对象的 Mark Word 中就会记录下对应的 Monitor 指针，同时 Monitor 对象内部的 Owner 字段也会设置为该线程，就像图中的 Thead-2。

![](/img/Monitor结构.png)

如果后续有其它线程试图对同一个对象进行上锁，首先会进行自旋重试上锁，如果一直失败就会被封装成 ObjectWaiter 附在 Monitor 的 EntryList 列表中，然后调用 park 挂起进入阻塞状态，等待被唤醒。而当 Thread-2 退出临界区之后，就会根据某种策略通过 unpark 主动唤醒 EntryList 中的某个线程。

从字节码角度看，JVM 是通过 monitorenter/monitorexit 两个指令实现上锁和解锁的，底层依赖于 OS 的 Mutex Lock，需要额外的用户态到内核态切换的开销，因此称这种上锁为重量级锁，也是 JDK 1.6 之前 synchronized 关键字基本的上锁原理。



## 锁优化

在 JDK 1.6 之前，synchronized 只有上述基于 Monitor 的锁机制，但是经调研发现，实际的程序在运行过程中，锁资源的竞争并没有那么激烈，如果每次都关联 Monitor 修改 Mark Word 操作会很浪费性能，因此 JVM 后续做了很多优化措施，来提高没有多线程竞争或基本没有竞争的场景下的并发性能。


### 轻量级锁

我们先退一步，假设一个锁资源被多个线程共享，但它们加锁的事件是错开的，即不存在竞争，那么可以用轻量级锁来优化，在轻量级锁中不涉及 Monitor 对象。在此之前，需要知道每个线程的栈帧里都会包含一个 Lock Record 锁记录，其中主要有两部分：

- 地址：该 Lock Record 的地址
- Object Reference：对象引用



**进入临界区**

![](/img/轻量级锁1.png)


当一个线程执行 synchronized 对某个 object 上锁时，首先会尝试 CAS 交换 Lock Record 地址和该 object 的 Mark Word，如果替换成功，表示由该线程给 object 上了锁。

![](/img/轻量级锁2.png)

而如果替换失败，那么会对应两种情况：
1. 其它线程已经持有该 object 的轻量级锁，表示有竞争，那么会进入**锁膨胀**
   - 为 object 申请 Monitor 对象，并让 Mark Word 指向该 Monitor
   - 然后自己进入 Monitor 的 EntryList 转为阻塞状态

![](/img/轻量级锁4.png)


2. 如果是自己已经持有 该 object 的轻量级锁，表示重入，那么会再创建一条 Lock Record 作为重入的计数器，并且该锁记录的地址字段为 null

![](/img/轻量级锁3.png)




**退出临界区**

当退出临界区解锁时，也有两种情况：
1. 如果锁记录取值为 null，表示有重入，重入计数 -1
2. 如果锁记录不为 null，那么 CAS 交换回 Mark Word 和 Lock Record 地址，此时有两种结果
   - CAS 成功，解锁完成
   - CAS 失败，说明轻量级锁进行了锁膨胀，升级为了重量级锁，之后进入重量级锁解锁流程


轻量级锁适用于两个线程交替执行的场景，如果有竞争，直接膨胀为重量级锁，没有自旋操作。







### 偏向锁

我们再退一步，如果一个共享资源竞争很少，一直由某个线程上锁，那么轻量级锁就没有必要每次都 CAS 交换 Lock Record 地址和 object 的 Mark Word 了，因此可以进一步优化：第一次上锁时使用 CAS 交换 Thread ID 和 Mark Word，后续只要校验 object 的  Mark Word 里存储的 Thread ID 仍是自己，判断没有发生竞争，这个对象就归该线程所持有，这样就仅需要一次 CAS 操作了。从机制上也能发现，偏向锁解锁后对象头里依然存储着线程 ID，并且这里的 ID 是 OS 分配的，和 Java 层面的线程ID 并不一致。。

![](/img/偏向锁.png)


需要注意的是：
- 偏向锁开启时，即对象创建后，Mark Word 后三位为 101，thread/epoch/age 都为 0
- 如果用`-XX:-UseBiasedLocking`禁用偏向锁，那么对象创建后，Mark Word 后三位为 001，hashcode/age 都为 0，直到第一次用到 hashcode 时才会赋值
- 偏向锁的对象头里存储了线程 ID，没有空间存储 hashcode 了，所以如果调用 hashCode 会撤销偏向锁，恢复为无锁状态
  - 轻量级锁在锁记录存储 hashcode
  - 重量级锁在 Monitor 中存储 hashcode
- 如果校验时发现线程不一致，说明有竞争，偏向锁将会被撤销，升级为轻量级锁
  - 撤销超过 20 次，JVM 会重偏向至加锁的 Thread ID
  - 撤销超过 40 次，JVM 会将该类的所有对象设为不可偏向，包括新建对象
- 如果调用 wait/notify，会撤销偏向锁升级为重量级锁
- 偏向锁有延迟机制，默认4s，防止初始阶段大量初始化工作产生大量锁撤销和锁升级，影响启动效率，可以通过`-XX:BiasedLockingStartupDelay=0`禁用延迟


如果业务存在大量线程竞争，由于偏向锁撤销存在一定开销，并不能提高性能，反而会影响并发性能，因此偏向锁适用于单个线程重入的场景，在 JDK 15 之后已经默认关闭了偏向锁。



## 其它


### 自旋锁

在竞争重量级锁时，如果一个线程尝试获取一个被其他线程持有的锁时，它不会立即进入阻塞状态，而是会在原地进行自旋等待，如果自旋期间持锁线程正好退出同步块释放了锁，那么该线程就可以拿到锁资源而不用进入阻塞再恢复，进行上下文切换了。

- 自旋会占用 CPU 时间，因此适合多 CPU 环境
- 自旋锁是自适应的，自旋成功次数多，自旋的机会也会越多


### 锁消除

锁消除是一种编译器优化技术，用于消除不必要的锁竞争。编译器通过分析代码的语义和数据流来确定哪些锁是不必要的，并消除这些锁。例如，如果一个线程在获取一个锁后执行了一个不可能产生并发异常的代码段，那么这个锁就是不必要的，在这种情况下，编译器可能会消除这个锁，从而提高并发性能。



### 锁粗化

当一个线程在一段时间内多次重复获得同一个锁，JVM可能会将这个锁的粒度从对象级别提升到更高的级别，例如一个方法或一个类。这种技术被称为锁粗化，可以减少线程对锁的请求频率，从而减少线程上下文切换的开销，提高并发性能。例如，如果一个线程在循环中多次访问同一个对象并获取该对象的锁，JVM可能会将这个锁扩展到包含整个循环的代码块，而不是每次迭代都获取和释放锁。




## 完整流程

![](/img/synchronized锁优化机制.png)




## 参考

1. [Java对象内存布局(JOL)](https://wilson-he.gitee.io/jvm/jol/)
2. https://www.cnblogs.com/xiaofuge/p/13895226.html
3. [黑马程序员 JUC](https://www.bilibili.com/video/BV16J411h7Rd/?spm_id_from=333.1007.top_right_bar_window_custom_collection.content.click) （PS：满老师YYDS）
4. https://tech.youzan.com/javasuo-yu-xian-cheng-de-na-xie-shi/