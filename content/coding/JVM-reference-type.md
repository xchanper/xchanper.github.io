---
title: Java 引用类型
date: 2024-03-06
---
## 引用概述

Java中有四种引用类型，它们分别是强引用（Strong Reference）、软引用（Soft Reference）、弱引用（Weak Reference）和虚引用（Phantom Reference）。每种引用类型都有其特定的使用场景和行为，提供了对对象生命周期的不同管理方式，它们对垃圾回收器的行为有不同的影响。

| 引用类型  | 被垃圾回收的时机 | 主要用途 | 生存周期 |
|---|---|---|---|
|  强引用 |  直到内存溢出也不会回收 | 普遍对象的状态 | 从创建到JVM实例终止运行 |
|  软引用 |  垃圾回收并且内存不足时 | 有用但非必须的对象缓存 | 从创建到垃圾回收并且内存不足时 |
|  弱引用 |  垃圾回收时 | 非必须的对象缓存 | 上一次垃圾回收结束到下一次垃圾回收开始 |
|  虚引用 |  - | 关联的对象被垃圾收集器回收时候得到一个系统通知 | - |



![](/img/Java-Reference.png)

**案例：**
```java
public static void main(String[] args) {
    // 强引用
    Object strongRef = new Object();
    
    // 软引用
    SoftReference<Object> softRef = new SoftReference<>(new Object());
    
    // 弱引用
    WeakReference<Object> weakRef = new WeakReference<>(new Object());
    
    // 虚引用
    ReferenceQueue<Object> queue = new ReferenceQueue<>();
    PhantomReference<Object> phantomRef = new PhantomReference<>(new Object(), queue);
    
    // 打印各引用的状态
    System.out.println("Strong reference: " + strongRef);
    System.out.println("Soft reference: " + softRef.get());
    System.out.println("Weak reference: " + weakRef.get());
    System.out.println("Phantom reference: " + phantomRef.get());
    
    // 使强引用失效
    strongRef = null;
    
    // 手动触发GC，以便查看软引用和弱引用的回收情况
    System.gc();
    
    // 等待一段时间，确保垃圾回收线程完成回收操作
    try {
        Thread.sleep(1000);
    } catch (InterruptedException e) {
        e.printStackTrace();
    }
    
    // 打印各引用的状态
    System.out.println("Strong reference after nullification: " + strongRef);
    System.out.println("Soft reference after GC: " + softRef.get());
    System.out.println("Weak reference after GC: " + weakRef.get());
    System.out.println("Phantom reference after GC: " + phantomRef.get());
    
    // 检查虚引用是否已经进入引用队列
    Reference<?> refFromQueue = queue.poll();
    System.out.println("Phantom reference from queue: " + refFromQueue);
}
```


## ReferenceQueue

在看几个 Reference 源码之前，需要先了解 ReferenceQueue，引用队列是Java中用于配合软引用、弱引用、虚引用等引用类型的一个辅助类。它主要用于在对象被垃圾回收前，提供一种机制来通知程序，从而执行一些必要的清理或其他操作。

```java
public class ReferenceQueue<T> {

    // 构造器
    public ReferenceQueue() { }

    // 表示特殊含义的引用队列类型
    private static class Null extends ReferenceQueue<Object> {
        boolean enqueue(Reference<?> r) {
            return false;
        }
    }

    // 特殊含义值，表示引用实例不用注册，或已经从某个引用队列中移除
    static final ReferenceQueue<Object> NULL = new Null();
    // 特殊含义值，表示引用实例已经添加到某个引用队列
    static final ReferenceQueue<Object> ENQUEUED = new Null();

    private static class Lock { };
    private final Lock lock = new Lock();
    // 队头引用实例
    private volatile Reference<? extends T> head;
    // 队列长度
    private long queueLength = 0;

    // 把引用实例 r 入队，即关联到本引用队列
    boolean enqueue(Reference<? extends T> r) {
        synchronized (lock) {
            // 校验是否已经关联，或不需要关联，或已被移除
            ReferenceQueue<?> queue = r.queue;
            if ((queue == NULL) || (queue == ENQUEUED)) {
                return false;
            }
            // 判断注册目标是否是本引用队列
            assert queue == this;
            // 头插法
            r.next = (head == null) ? r : head;
            head = r;
            // 队列长度 +1
            queueLength++;
            // 用特殊队列标记已入队
            r.queue = ENQUEUED;
            // 终结器计数
            if (r instanceof FinalReference) {
                VM.addFinalRefCount(1);
            }
            // 通知等待的线程
            lock.notifyAll();
            return true;
        }
    }

    // 将队头的引用移除，队空则返回 null，后面的 poll/remove 最终都是执行本方法
    private Reference<? extends T> reallyPoll() {
        Reference<? extends T> r = head;
        // 队列非空
        if (r != null) {
            // 用特殊队列标记该引用已出队
            r.queue = NULL;
            Reference<? extends T> rn = r.next;
            // 处理自循环 r.next = r，即队列中只有一个元素
            head = (rn == r) ? null : rn;
            // 对移除的引用设置自循环，主要是确保 FinalReference inactive 状态
            r.next = r;
            // 队列长度 -1
            queueLength--;
            // 终结器计数
            if (r instanceof FinalReference) {
                VM.addFinalRefCount(-1);
            }
            return r;
        }
        return null;
    }

    // 移除一个元素，为空时直接返回
    public Reference<? extends T> poll();

    // 移除队列中的一个元素，可以指定阻塞式/超时
    public Reference<? extends T> remove(long timeout);

    // 遍历队列元素
    void forEach(Consumer<? super Reference<? extends T>> action);
}
```

引用在创建时可以指定需要注册的 ReferenceQueue，如果不指定，那么清理工作完全交给 GC，无法收到通知进行其它工作。一个引用只能唯一注册到某个 ReferenceQueue，且出队后不可再次进入。需要注意的是，ReferenceQueue 实际只是某个引用队列的队头，即 head 成员和某个引用关联，而队列中的所有引用则是通过各自的 next 指针串成了一个链表，ReferenceQueue 提供了对链表的入队、移出、移除等操作。

![](/img/referencequeue-reference.png)



## Reference

Reference 是除强引用外，其余三种引用类型的抽象基类，定义了引用实例的通用操作。

### 引用状态

根据引用实例是否在队列中以及引用实例所引用的对象是否被回收，可以将Reference对象的状态分为以下几种：

- **Active**：表示引用实例已经被创建，但是它所引用的对象尚未被回收，并且未被加入引用队列
  - GC 检测到关联对象的可达性发生特定变化后，会通知引用实例改变状态

- **Pending**：表示引用实例所引用的对象已经被回收，但是引用实例尚未加入引用队列中
  - pending 元素通过`reference#discovered`串成队列，等待 ReferenceHandler 线程处理

- **Inactive**：引用实例处于非Active和非Pending状态

+ **Registered**：引用实例创建的时候关联到一个引用队列实例，但尚未入队

+ **Enqueued**：表示引用实例已经被加入引用队列中

+ **Dequeued**：引用实例曾经添加到和它关联的引用队列中，并且已经被移除

+ **Unregistered**：引用实例不存在关联的引用队列

创建引用时如果使用了 ReferenceQueue，则状态转换如下：
![](/img/reference状态1.png)

创建引用时没有使用 ReferenceQueue 的状态转换关系如下：
![](/img/reference状态2.png)



### 成员和构造

从 Reference 类结构看，除了标记位`processPendingActive`、锁对象`processPendingLock`外，有四个成员变量：
1. `referent` 泛型，表示该引用实例关联的实际对象（以下简称关联对象）
2. `queue` 引用实例注册的引用队列，如果实际对象将被 GC，那么引用将被放入该引用队列，可以从中得到或监控相应的引用实例
3. `next` 引用类型的指针，可以构成引用实例链
4. `discovered` 基于状态表示不同链表中的下一个待处理的对象，主要是pending-reference列表的下一个元素，通过JVM直接调用赋值


```java
public abstract class Reference<T> {
    private T referent; 
    volatile ReferenceQueue<? super T> queue;
    volatile Reference next;
    private transient Reference<?> discovered;

    private static final Object processPendingLock = new Object();
    private static boolean processPendingActive = false;

    Reference(T referent) {
        this(referent, null);
    }

    // 如果没有注册，则赋值特殊的 NULL 队列
    Reference(T referent, ReferenceQueue<? super T> queue) {
        this.referent = referent;
        this.queue = (queue == null) ? ReferenceQueue.NULL : queue;
    }
}
```


### ReferenceHandler

ReferenceHandler 是 Reference 静态代码块中初始化的一个线程，该线程拥有最高优先级，并且是一个守护线程，是 Java 程序运行时默认启动的几个线程之一。Reference Handler线程负责处理软引用、弱引用、虚引用等引用类型的引用实例。当这些引用实例所引用的对象被垃圾回收器回收时，Reference Handler线程会将其放入对应的引用队列中。

```java
static {
    // 获取当前线程的顶层线程组
    ThreadGroup tg = Thread.currentThread().getThreadGroup();
    for (ThreadGroup tgn = tg; tgn != null; tg = tgn, tgn = tg.getParent());
    // 创建引用处理线程
    Thread handler = new ReferenceHandler(tg, "Reference Handler");
    handler.setPriority(Thread.MAX_PRIORITY);
    handler.setDaemon(true);
    handler.start();

    // 安全策略处理
    SharedSecrets.setJavaLangRefAccess(new JavaLangRefAccess() {
        @Override
        public boolean waitForReferenceProcessing()
            throws InterruptedException
        {
            return Reference.waitForReferenceProcessing();
        }

        @Override
        public void runFinalization() {
            Finalizer.runFinalization();
        }
    });
}


// 确保 pending 的引用实例能够入队的高优先级线程
private static class ReferenceHandler extends Thread {
    // 确保类已加载
    private static void ensureClassInitialized(Class<?> clazz) {
        try {
            Class.forName(clazz.getName(), true, clazz.getClassLoader());
        } catch (ClassNotFoundException e) {
            throw (Error) new NoClassDefFoundError(e.getMessage()).initCause(e);
        }
    }

    static {
        ensureClassInitialized(Cleaner.class);
    }

    ReferenceHandler(ThreadGroup g, String name) {
        super(g, null, name, 0, false);
    }

    public void run() {
        // 不断循环处理 pending 引用实例
        while (true) {
            processPendingReferences();
        }
    }
}
```

可以看到，ReferenceHandler 本身是一个守护线程，在一个无限循环里处理 pending 等待入队的引用实例，核心就是 processPendingReferences() 方法。

```java
private static void processPendingReferences() {
    // native，阻塞等待直到 pending 状态的引用实例链不为 null（discovered域）
    waitForReferencePendingList();
    Reference<?> pendingList;
    // 加锁获取 pending 链，执行清理，并标记清理中状态
    synchronized (processPendingLock) {
        pendingList = getAndClearReferencePendingList();
        processPendingActive = true;
    }
    while (pendingList != null) {
        // 虽然是个链，但实际上是拿到的队头，元素间通过 discovered 串联起来
        Reference<?> ref = pendingList;
        // 后继 pending 引用
        pendingList = ref.discovered;
        ref.discovered = null;

        // Cleaner 类型要执行 clean 方法
        if (ref instanceof Cleaner) {
            ((Cleaner)ref).clean();
            synchronized (processPendingLock) {
                processPendingLock.notifyAll();
            }
        } else {
            // 非 Cleaner 的引用，如果注册的 referenceQueue 不为 NULL 则入队
            ref.enqueueFromPending();
        }
    }
    // 当此循环结束前唤醒阻塞的其它线程
    synchronized (processPendingLock) {
        processPendingActive = false;
        processPendingLock.notifyAll();
    }
}
```




### 其它方法

```java
// 获取关联对象
public T get() { return this.referent; }

// refersTo -> refersToImpl -> refersTo0 由子类实现
public final boolean refersTo(T obj) { return refersToImpl(obj); }
boolean refersToImpl(T obj) { return refersTo0(obj); }
private native boolean refersTo0(Object o);

// clear -> clear0 由子类实现
public void clear() { clear0(); }
private native void clear0();

// 判断是否入队，入队后 queue 域应该是特殊的 ENQUEUED 队列
public boolean isEnqueued() { return (this.queue == ReferenceQueue.ENQUEUED); }
// 入队操作
public boolean enqueue() {
    clear0();
    return this.queue.enqueue(this);
}

// 确保给定的引用实例是强可达的
public static void reachabilityFence(Object ref) { }
```



## 引用实现

### 强引用

强引用是最常见的引用类型，如果一个对象具有强引用，垃圾回收器就不会回收该对象。当内存空间不足时，JVM 宁愿抛出 OOM 也不会回收强引用实例。通常用于确保对象不会被意外地回收，需要长时间持有对象的场景。

```java
// 一般情况下 new 创建的对象都是强引用
Object obj = new Object();
```


### 软引用

软引用用于描述一些还有用但不是必需的对象，当内存不足时，垃圾回收器**可能**会回收这些对象，回收后内存仍不足将抛出 OOM。通常用于对内存敏感的缓存场景，允许系统根据内存情况自动释放缓存对象。

实现上，软引用增加了一个时间戳标记，用于帮助 GC 选择回收的对象。

```java
public class SoftReference<T> extends Reference<T> {

    // 所有实例共享的时间戳，由 GC 更新
    private static long clock;

    // 本引用实例的时间戳，调用 get() 时自动更新
    private long timestamp;

    
    public SoftReference(T referent) {
        super(referent);
        this.timestamp = clock;
    }

    public SoftReference(T referent, ReferenceQueue<? super T> q) {
        super(referent, q);
        this.timestamp = clock;
    }

    public T get() {
        T o = super.get();
        // 更新时间戳
        if (o != null && this.timestamp != clock)
            this.timestamp = clock;
        return o;
    }

}
```


### 弱引用

弱引用用于描述非必需对象，它的强度比软引用更弱。如果一个对象只被弱引用指向，那么在下一次垃圾回收时，该对象就会被回收。弱引用通常用于避免内存泄漏，例如，缓存某个对象，但不希望该对象因为被缓存而阻止它被垃圾回收。

Java 层面的实现上，弱引用并没有特殊设计。

```java
public class WeakReference<T> extends Reference<T> {

    public WeakReference(T referent) {
        super(referent);
    }

    public WeakReference(T referent, ReferenceQueue<? super T> q) {
        super(referent, q);
    }

}
```

### 虚引用

虚引用是最弱的一种引用类型，无法通过虚引用来获取对象实例。虚引用在对象被 GC 之前会被放入一个引用队列中，可以通过检查这个引用队列，来了解对象的回收状态。通常用于执行某些清理工作或其他操作，例如，NIO中的DirectByteBuffer对象使用虚引用来跟踪对象的回收情况，以便在内存被回收时释放相关资源。

实现上，虚引用也没什么特殊的，但注意无法通过虚引用来获取对象实例。

```java
public class PhantomReference<T> extends Reference<T> {
    // 永远返回 null
    public T get() {
        return null;
    }

    @Override
    boolean refersToImpl(T obj) {
        return refersTo0(obj);
    }

    @IntrinsicCandidate
    private native boolean refersTo0(Object o);

    public PhantomReference(T referent, ReferenceQueue<? super T> q) {
        super(referent, q);
    }

}
```


### Cleaner

Cleaner 是 PhantomReference 的子类，在 ReferenceHandler 线程中提供了一种更加灵活地执行对象清理操作的机制，相比于 Finalizer 线程中已被标记废弃的 finalize() 机制更加安全可靠，不依赖于对象生命周期，但仍是不可预知的。

所有的 Cleaner 对象通过 next, prev 构成一个双向链表，在 java.lang.ref.Reference#processPendingReferences 方法中将执行 Cleaner#clean 执行清理工作。

```java
public class Cleaner
    extends PhantomReference<Object>
{
    // 无用，仅是为了执行 PhantomReference 的构造器
    private static final ReferenceQueue<Object> dummyQueue = new ReferenceQueue<>();

    // 头节点
    private static Cleaner first = null;
    // 双向链表结构
    private Cleaner next = null, prev = null;

    // 头插法
    private static synchronized Cleaner add(Cleaner cl) {
        if (first != null) {
            cl.next = first;
            first.prev = cl;
        }
        first = cl;
        return cl;
    }

    private static synchronized boolean remove(Cleaner cl) {
        if (cl.next == cl)
            return false;

        if (first == cl) {
            if (cl.next != null)
                first = cl.next;
            else
                first = cl.prev;
        }
        if (cl.next != null)
            cl.next.prev = cl.prev;
        if (cl.prev != null)
            cl.prev.next = cl.next;

        // 自循环说明已被移除
        cl.next = cl;
        cl.prev = cl;
        return true;

    }

    // 清理工作
    private final Runnable thunk;
    // 私有，外部只能通过 create 静态方法创建 Cleaner 实例
    private Cleaner(Object referent, Runnable thunk) {
        super(referent, dummyQueue);
        this.thunk = thunk;
    }

    // 创建时需要指定清理的工作，并自动加入 Cleaner 链表
    public static Cleaner create(Object ob, Runnable thunk) {
        if (thunk == null)
            return null;
        return add(new Cleaner(ob, thunk));
    }
}
```



### Finalizer

在Java中，Finalizer是一个特殊的方法，用于对象被垃圾回收器回收之前的清理工作。该过程分为两步，首先第一步是判断是否有必要执行 finalize()，JVM 把以下两种情况认为没有必要：

- 对象没有覆盖继承自Object类的finalize()方法
- 对象的finalize()方法已经被JVM调用过

如果被判定为有必要执行 finalize()，那么该对象会被封装成 Finalizer 放入一个 ReferenceQueue，稍后由一个叫 Finalizer 的线程取出并执行它的 finalize() 方法。如果在 finalize() 方法中，对象将自身重新与引用链建立了关联，那么将逃逸成功，避免稍后被回收。

Finalization 机制性能一般而且存在不确定性，因此已经被标记废弃，更推荐使用 Cleaner。

在Java的代码实现上，Finalizer 继承自 FinalReference，它的 get()/clear() 都是调用父类 Reference 里面两个专门留给 FinalReference 的特殊方法，用于获取和移除 inactive 引用的关联对象。

```java
class FinalReference<T> extends Reference<T> {

    public FinalReference(T referent, ReferenceQueue<? super T> q) {
        super(referent, q);
    }

    // 仅引用是 inactive 状态时可以获取
    @Override
    public T get() {
        return getFromInactiveFinalReference();
    }

    // 仅引用是 inactive 状态时可以获取
    @Override
    public void clear() {
        clearInactiveFinalReference();
    }

    // 已经是 final 的引用不应再入队了
    @Override
    public boolean enqueue() {
        throw new InternalError("should never reach here");
    }
}
```

Finalizer 是 Finalization 机制的核心，它会在加载时创建一个 Finalizer 终结器线程，不断地从 unfinalized 链表中获取引用实例，执行它们实际关联对象的 finalize() 方法。

```java
final class Finalizer extends FinalReference<Object> {
    // 关联的 ReferenceQueue
    private static ReferenceQueue<Object> queue = new ReferenceQueue<>();
    static ReferenceQueue<Object> getQueue() {
        return queue;
    }

    // unfinalized 双向链表的表头，以及前后引用
    private static Finalizer unfinalized = null;
    private Finalizer next, prev;

    private static final Object lock = new Object();

    // 私有构造器，只能通过 register 方法创建 Finalizer
    private Finalizer(Object finalizee) {
        super(finalizee, queue);
        // 创建完成后，头插法加入 unfinalized 链表等待处理
        synchronized (lock) {
            if (unfinalized != null) {
                this.next = unfinalized;
                unfinalized.prev = this;
            }
            unfinalized = this;
        }
    }

    // 由 JVM 直接调用
    static void register(Object finalizee) {
        new Finalizer(finalizee);
    }

    private void runFinalizer(JavaLangAccess jla) {
        synchronized (lock) {
            // 循环引用表示已经终结了
            if (this.next == this)
                return;
            
            // 修改链表指针
            if (unfinalized == this)        // 当前是链表表头
                unfinalized = this.next;
            else                            // 不是表头
                this.prev.next = this.next;
            if (this.next != null)
                this.next.prev = this.prev;
            
            // 设置循环引用，标记已被终结
            this.prev = null;
            this.next = this;
        }

        // 获取关联对象，执行其 finalize 方法
        try {
            Object finalizee = this.get();
            assert finalizee != null;
            if (!(finalizee instanceof java.lang.Enum)) {
                // 调用对象的 finalize 方法
                jla.invokeFinalize(finalizee);

                // 手动置 null 帮助清理
                finalizee = null;
            }
        } catch (Throwable x) { }
        // 执行完毕做一次清理，即 Reference#clearInactiveFinalReference()
        super.clear();
    }

    static {
        ThreadGroup tg = Thread.currentThread().getThreadGroup();
        // 获取顶级线程组，创建并开启 Fianlizer 线程
        for (ThreadGroup tgn = tg; tgn != null; tg = tgn, tgn = tg.getParent());
        Thread finalizer = new FinalizerThread(tg);
        finalizer.setPriority(Thread.MAX_PRIORITY - 2);
        finalizer.setDaemon(true);
        finalizer.start();
    }

    // Finalizer 守护线程
    private static class FinalizerThread extends Thread {
        private volatile boolean running;
        FinalizerThread(ThreadGroup g) {
            super(g, null, "Finalizer", 0, false);
        }
        public void run() {
            if (running)
                return;

            while (VM.initLevel() == 0) {
                try {
                    VM.awaitInitLevel(1);
                } catch (InterruptedException x) {
                    // ignore and continue
                }
            }
            final JavaLangAccess jla = SharedSecrets.getJavaLangAccess();
            running = true;
            // 不断地从 ReferenceQueue 里面获取 Finalizer 对象执行它们的 finalize 方法
            for (;;) {
                try {
                    // 阻塞式移除获取（ReferenceHandler 负责放入）
                    Finalizer f = (Finalizer)queue.remove();
                    f.runFinalizer(jla);
                } catch (InterruptedException x) {
                    // ignore and continue
                }
            }
        }
    }
}
```




## 参考

1. [深入理解JDK中的Reference原理和源码实现](https://www.cnblogs.com/yungyu16/p/13200842.html) 写的很棒👍
2. [Java 类 Reference 的源码分析](https://www.moralok.com/2023/12/27/source-code-analysis-of-Java-class-Reference/)
3. [JAVA几种引用及源码简析](https://juejin.cn/post/6844904200015446023)
4. [一文读懂java中的Reference和引用类型](https://cloud.tencent.com/developer/article/1657759)
5. [深入理解JDK中的Reference原理和源码实现](https://www.cnblogs.com/throwable/p/12271653.html)