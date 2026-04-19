---
title: LockSupport 源码阅读
date: 2023-12-04
---
## 概述

`LockSupport` 是 Java 并发包中提供的一个工具类，用于支持线程的阻塞和唤醒操作，通常与其他同步工具一起使用，例如 `ReentrantLock`、`Condition` 等，以实现更复杂的线程协作。

```java
public class LockSupport {
    private LockSupport() {}

    private static final Unsafe U = Unsafe.getUnsafe();
    private static final long PARKBLOCKER = U.objectFieldOffset(Thread.class, "parkBlocker");
    private static final long TID = U.objectFieldOffset(Thread.class, "tid");


    private static void setBlocker(Thread t, Object arg) {
        U.putReferenceOpaque(t, PARKBLOCKER, arg);
    }

    public static Object getBlocker(Thread t) {
        if (t == null)
            throw new NullPointerException();
        return U.getReferenceOpaque(t, PARKBLOCKER);
    }

    static final long getThreadId(Thread thread) {
        return U.getLong(thread, TID);
    }

    ......
}
```

LockSupport 提供了一种基于许可（permit）的机制，可以让线程在需要时阻塞等待许可，以及在其他线程发出信号时唤醒，它的无参构造器是私有的，只对外提供了一些公共静态方法。从源码中，可以看到 LockSupport 底层是基于 (Unsafe)[./Unsafe.md] 实现的，还需要借助 Unsafe 操作 Thread 对象的两个属性：`parkBlocker`阻塞对象和`tid`线程ID，其中线程的阻塞对象用于记录调用 park 方法而被阻塞的线程在哪个对象上进行了阻塞，主要是监测和调试目的。

```java
public class Thread implements Runnable {
    
    ...

    private final long tid;

    volatile Object parkBlocker;

    ...
}
```


## park

当在一个线程里调用 park 后，线程就会阻塞住，直到以下三种情况任意一个发生，获得许可后才可继续运行：
- 其他某个线程将当前线程作为目标调用 unpark
- 其他某个线程中断当前线程
- 该调用不合逻辑地(即毫无理由地)返回

```java
// 无限阻塞
public static void park() {
    U.park(false, 0L);
}

// 带阻塞对象的
public static void park(Object blocker) {
    Thread t = Thread.currentThread();
    // 设置阻塞对象
    setBlocker(t, blocker);
    // 线程阻塞在这里
    U.park(false, 0L);
    // 恢复后清空线程的阻塞对象
    setBlocker(t, null);
}

// 设定阻塞的最长等待时间（以及不带阻塞对象的重载）
public static void parkNanos(Object blocker, long nanos) {
    if (nanos > 0) {
        Thread t = Thread.currentThread();
        setBlocker(t, blocker);
        U.park(false, nanos);
        setBlocker(t, null);
    }
}

// 设定阻塞的最长绝对时间（以及不带阻塞对象的重载）
public static void parkUntil(Object blocker, long deadline) {
    Thread t = Thread.currentThread();
    setBlocker(t, blocker);
    U.park(true, deadline);
    setBlocker(t, null);
}
```



## unpark

unpark 可以解除某个线程的阻塞状态，或者保证该线程下次 park 时不会阻塞直接放行。如果线程还没有启动则无法保证能正确放行。

```java
public static void unpark(Thread thread) {
    if (thread != null)
        U.unpark(thread);
}
```



## 对比

LockSupport 可以作为线程间通信的基础工具，用于实现等待/通知模式，相比最简单的 `Thread.sleep()`，park 阻塞线程可以由外部唤醒。而相比于依赖对象监视器的 wait/notify 通知机制，LockSupport 功能更加强大，更加灵活。

| 特点 | park/unpark | wait/notify |
|------|-------------|-------------|
| 锁资源 | 和 sleep() 一样，不会释放锁资源 | 会释放 |
| 上下文 | 任意上下文执行，不依赖于锁 | 基于 Object、Monitor，需要在 synchronized 块中执行 |
| 中断 | 不抛出异常，但可以通过线程中断状态检查 | 如果被中断会抛出异常，需要手动处理 |
| 顺序 | 许可机制，不需要考虑执行先后 | notify() 必须在 wait() 之后执行，否则线程可能一直阻塞 |



## 原理

实现上，每个线程都由一个自己的 Parker 对象（C语言层面），包括：
- `_counter`: 计数器
- `_cond`: 条件变量
- `_mutex`: 互斥锁

当执行 park 时，当前线程先检查 _counter 的值：
 - 如果为 0，线程进入 _cond 条件变量的队列阻塞，并重设 _counter = 0
 - 如果为 1，线程无序阻塞，继续运行

![](/img/LockSupport-park原理.png)


当执行 unpark 时，当前线程先检查 _counter 的值：
- 如果为 1，唤醒 _cond 条件变量中的线程，恢复其运行，重置 _counter = 0
- 如果不为 1，设置 _counter = 1

![](/img/LockSupport-unpark.png)


总结一下，park/unpark 底层类似一个**二元信号量**，可以把它想象成只有一个许可证的Semaphore，只不过这个信号量在重复执行 unpark() 的时候也不会再增加许可证，最多只有一个许可证。





## 参考

1. https://pdai.tech/md/java/thread/java-thread-x-lock-LockSupport.html