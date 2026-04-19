---
title: Thread 源码阅读
date: 2023-12-23
---
线程是操作系统进行调度的最小单位，Java 中的 Thread 是对操作系统线程的封装，很多实际的控制是靠底层 Native 方法实现的，因此 Java 的 Thread 类还是比较简单的。


## 成员

Thread 内部的成员变量还是比较多的，主要分为线程标识、状态标记、局部变量、同步相关等等：

```java
public class Thread implements Runnable {
    // 线程ID
    private final long tid;
    // 线程ID计数器
    private static long threadSeqNumber;
    // 线程名
    private volatile String name;
    // 线程取名的计数器
    private static int threadInitNumber;

    // 线程状态，0 表示 NEW
    private volatile int threadStatus;
    // 中断标记，注意仅仅用作标记
    private volatile boolean interrupted;

    // 守护线程标志，所有普通线程执行完毕后自动终止，常用于执行后台任务，例如 GC 线程、JIT线程
    private boolean daemon = false;
    // 线程优先级，1-10，默认 5
    private int priority;
    public static final int MIN_PRIORITY = 1;
    public static final int NORM_PRIORITY = 5;
    public static final int MAX_PRIORITY = 10;
    // 所属线程组
    private ThreadGroup group;
    // 执行目标
    private Runnable target;
    
    
    // 线程私有的局部变量
    ThreadLocal.ThreadLocalMap threadLocals = null;
    // 可继承的线程局部变量，线程创建时会继承自父线程
    ThreadLocal.ThreadLocalMap inheritableThreadLocals = null;

    // 支持 LockSupport
    volatile Object parkBlocker;
    // 可中断IO中用于阻塞线程的对象及对应的访问锁
    private volatile Interruptible blocker;
    private final Object blockerLock = new Object();


    
    // 线程栈大小
    private final long stackSize;
    // 上下文类加载器，默认是父线程的类加载器
    private ClassLoader contextClassLoader;
    // 标识线程是否是死胎
    private boolean stillborn = false;
    // 存储线程在底层平台的线程 ID
    private long eetop;
    // 继承的访问控制上下文
    private AccessControlContext inheritedAccessControlContext;
    // 未捕获异常的处理器
    private volatile UncaughtExceptionHandler uncaughtExceptionHandler;
    private static volatile UncaughtExceptionHandler defaultUncaughtExceptionHandler;
    // 用于生成高性能的伪随机数（PRNGs：Pseudo Random Number Generators）
    long threadLocalRandomSeed;
    int threadLocalRandomProbe;
    int threadLocalRandomSecondarySeed;
}
```


## 构造器

Thread 提供了多种构造器的重载，主要调用的是下面这个：

```java
private Thread(ThreadGroup g,               // 线程组，默认 null
               Runnable target,             // 执行目标，默认 null
               String name,                 // 线程名，默认 ["Thread-" + threadInitNumber++]
               long stackSize,              // 线程栈大小，默认 0 表示不指定，由 VM 决定如何使用
               AccessControlContext acc,    // 访问控制，默认 null，已废弃
               boolean inheritThreadLocals) // 是否继承父线程私有变量，默认 false
{
    if (name == null)
        throw new NullPointerException("name cannot be null");
    this.name = name;

    // 如果没有指定线程组，依次从 SecurityManager->父线程 获取
    Thread parent = currentThread();
    SecurityManager security = System.getSecurityManager();
    if (g == null) {
        if (security != null) g = security.getThreadGroup();
        if (g == null) g = parent.getThreadGroup();
    }

    // 访问校验
    g.checkAccess();
    if (security != null) {
        if (isCCLOverridden(getClass())) {
            security.checkPermission(SecurityConstants.SUBCLASS_IMPLEMENTATION_PERMISSION);
        }
    }

    // 线程组记录新线程
    g.addUnstarted();
    // 注入成员
    this.group = g;
    // 默认根据父线程
    this.daemon = parent.isDaemon();
    // 默认根据父线程
    this.priority = parent.getPriority();
    if (security == null || isCCLOverridden(parent.getClass()))
        this.contextClassLoader = parent.getContextClassLoader();
    else
        this.contextClassLoader = parent.contextClassLoader;
    this.inheritedAccessControlContext = acc != null ? acc : AccessController.getContext();
    this.target = target;
    setPriority(priority);
    // 继承父线程的私有变量
    if (inheritThreadLocals && parent.inheritableThreadLocals != null)
        this.inheritableThreadLocals = ThreadLocal.createInheritedMap(parent.inheritableThreadLocals);
    this.stackSize = stackSize;

    // 设置线程ID = ++threadSeqNumber
    this.tid = nextThreadID();
}
```





## 线程状态

Thread 共定义了 6 种状态，对应于 Thread.State 枚举，某一时刻某一线程只会处于其中一种状态，但和操作系统中的线程状态并没有对应关系。

```java
// java.lang.Thread.State
public enum State {
    // 创建完但尚未启动的状态
    NEW,
    // 启动后的就绪/运行中（可运行）的状态
    RUNNABLE,
    // 阻塞在某个 monitor 上所处的状态
    BLOCKED,
    // 等待另一线程执行操作的状态
    WAITING,
    // 指定超时时间的等待状态
    TIMED_WAITING,
    // 执行完毕的终止状态
    TERMINATED;
}
```

状态转换以及触发条件如下：

![](/img/thread-state.svg)




## start

Thread 里面有两种执行 target，也就是 Runnable 对象的方法：
- start()：调用 native 方法创建实际的操作系统线程
- run()：在当前线程里执行 target#run()，并不会创建新线程

所以要想真的利用多线程执行任务，要调用 Thread#start，而不是执行 Thread#run。注意 start() 不能重复调用，否则会抛出非法线程状态的异常。执行完 start() 后线程就进入了 Runnable 状态。

```java
// java.lang.Thread#start
public synchronized void start() {
    // 状态校验
    if (threadStatus != 0)
        throw new IllegalThreadStateException();
    
    // 添加到线程组的【可运行线程】数组中，并修改相关的统计
    group.add(this);

    boolean started = false;
    try {
        // 本地方法创建新线程执行 target
        start0();
        started = true;
    } finally {
        try {
            if (!started)
                group.threadStartFailed(this);
        } catch (Throwable ignore) {}
    }
}

private native void start0();

// java.lang.Thread#run
public void run() {
    if (target != null) {
        target.run();
    }
}
```


## join

join() 可以在一个线程中等待另一个线程执行完毕（在当前这个线程等待另一个线程*加入*进来），例如在 a 线程中执行 b.join，那么线程 a 就会进入 Thread#join 方法循环等待，直到 b 线程执行结束 a 才会继续。join() 底层是利用 isAlive() 和 Object#wait() 实现有限阻塞，调用的线程执行完毕后会执行 notifyAll() 唤醒所有等待队列的线程进入同步队列。

```java
public final void join() throws InterruptedException { join(0); }

public final synchronized void join(final long millis) {
    if (millis > 0) {
        if (isAlive()) {
            // 不断循环，校验是否超时
            final long startTime = System.nanoTime();
            long delay = millis;
            do {
                wait(delay);
            } while (isAlive() && (delay = millis - TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startTime)) > 0);
        }
    } else if (millis == 0) {
        while (isAlive()) {
            wait(0);
        }
    } else {
        throw new IllegalArgumentException("timeout value is negative");
    }
}
```





## interrupt

interrupt() 可以对一个已经启动的线程进行中断操作，中断操作会根据线程所处的不同状态有不同结果：

- 若线程阻塞在 wait/join/sleep 上：中断标记置 false，同时线程收到 InterruptedException
- 若线程阻塞在 NIO#InterruptibleChannel 上：关闭 channel，中断标记置 true，同时线程收到 ClosedByInterruptException
- 若线程阻塞在 NIO#Selector 上：阻塞方法立即返回，中断标记置 true
- 其他情况：中断标记置 true

```java
public void interrupt() {
    // 其它线程中断本线程
    if (this != Thread.currentThread()) {
        checkAccess();
        // 先获取 blocker 的锁
        synchronized (blockerLock) {
            Interruptible b = blocker;
            if (b != null) {
                // 标记当前线程被中断，注意仅仅是做标记
                interrupted = true;
                interrupt0();
                b.interrupt(this);
                return;
            }
        }
    }

    // 如果是自己调用的，直接设置标记即可
    interrupted = true;
    // 通知 JVM 中断事件
    interrupt0();
}

private native void interrupt0();
```

Thread 里有两种方法获取中断状态，但有不同的副作用：

```java
// 1. 获取中断状态，不清除中断标记
public boolean isInterrupted() { return interrupted; }

// 2. 静态方法，判断是否被中断，如果已经被中断会清除中断标记
public static boolean interrupted() {
    Thread t = currentThread();
    boolean interrupted = t.interrupted;
    if (interrupted) {
        t.interrupted = false;
        clearInterruptEvent();
    }
    return interrupted;
}

```



## exit

exit 会在线程退出前被调用，来做一些清理工作，这是 JVM 自动执行的退出。JDK 建议用一个自定义的变量用于标识线程是否需要退出，然后线程不断地去检查该变量从而决定要不要从 run 方法退出；或者调用线程对象的 interrupt 方法，通过中断异常来退出执行。

```java
// java.lang.Thread#exit
private void exit() {
    // 清理局部变量
    if (threadLocals != null && TerminatingThreadLocal.REGISTRY.isPresent()) {
        TerminatingThreadLocal.threadTerminated();
    }
    // 移除出线程组
    if (group != null) {
        group.threadTerminated(this);
        group = null;
    }
    // 手动置 null 帮助 GC
    target = null;
    threadLocals = null;
    inheritableThreadLocals = null;
    inheritedAccessControlContext = null;
    blocker = null;
    uncaughtExceptionHandler = null;
}
```




## 其它

### 工具方法

```java
// 获取当前所在线程
public static native Thread currentThread();

// 进入 Timed_Waiting，不会释放任何 monitor，可以被其它线程 interrupt
public static native void sleep(long millis);
// 提示调度器当前线程愿意让出　CPU，依赖于具体实现
public static native void yield();

// 设置当前所在线程的阻塞对象
static void blockedOn(Interruptible b);
// 当前线程是否持有该对象的 monitor 锁
public static native boolean holdsLock(Object obj);

// 告诉 JVM 当前线程正在忙等，用于优化
public static void onSpinWait() {}
// 是否存活
public final native boolean isAlive();



// 获取所属线程组内活跃线程数（包括子线程组）
public static int activeCount() {
    return currentThread().getThreadGroup().activeCount();
}
// 获取所属线程组内所有线程，拷贝到 tarray 里（包括子线程组）
public static int enumerate(Thread tarray[]) {
    return currentThread().getThreadGroup().enumerate(tarray);
}


// 获取当前线程的调用栈
private static final StackTraceElement[] EMPTY_STACK_TRACE = new StackTraceElement[0];
public StackTraceElement[] getStackTrace() {
    // 其它线程调用
    if (this != Thread.currentThread()) {
        // 安全校验
        SecurityManager security = System.getSecurityManager();
        if (security != null) {
            security.checkPermission(SecurityConstants.GET_STACK_TRACE_PERMISSION);
        }
        if (!isAlive()) {
            return EMPTY_STACK_TRACE;
        }

        // 拿到当前线程的调用栈
        StackTraceElement[][] stackTraceArray = dumpThreads(new Thread[] {this});
        StackTraceElement[] stackTrace = stackTraceArray[0];
        if (stackTrace == null) {
            stackTrace = EMPTY_STACK_TRACE;
        }
        return stackTrace;
    } else {
        // 当前线程自己调用，直接打印调用栈
        return (new Exception()).getStackTrace();
    }
}
// 拿到所有线程和对应的调用栈封装成 Map，原理同上
public static Map<Thread, StackTraceElement[]> getAllStackTraces();
// 获取所有线程对象
private static native Thread[] getThreads();
// 拿到参数线程组对应的所有调用栈
private static native StackTraceElement[][] dumpThreads(Thread[] threads);
// 打印调用栈
public static void dumpStack() {
    new Exception("Stack trace").printStackTrace();
}
```


### 异常

单线程的程序发生一个未捕获的异常时我们可以采用 try-catch 进行异常捕获；但在多线程环境中，线程抛出的异常不能在调用的地方直接用 try-catch 捕获，进而导致一些资源问题。不过 Thread 提供了未捕获异常的处理器接口，能检测出某个由于未捕获的异常而终结的情况。

```java
// 两个异常处理器类成员
private volatile UncaughtExceptionHandler uncaughtExceptionHandler;
private static volatile UncaughtExceptionHandler defaultUncaughtExceptionHandler;


// 未捕获异常处理器接口
public interface UncaughtExceptionHandler {
    void uncaughtException(Thread t, Throwable e);
}
private void dispatchUncaughtException(Throwable e);
// getter/setter 略
```


### 安全审计

```java
private static boolean isCCLOverridden(Class<?> cl);
static void processQueue(ReferenceQueue<Class<?>> queue, ConcurrentMap<? extends, WeakReference<Class<?>>, ?> map);
private static boolean auditSubclass(final Class<?> subcl);

private static class Caches {...}
static class WeakClassKey extends WeakReference<Class<?>> {...}
```


### 已废弃

下面是一些由于安全问题，不推荐使用的控制方法:

```java
public final void stop() -> private native void stop0(Object o);
public final void suspend() -> private native void suspend0();
public final void resume() -> private native void resume0();
```



## ThreadGroup

线程组 ThreadGroup 就是一个线程集合，用于更方便地管理线程。线程组是一种父子层级结构，一个线程组包括多个线程，同时还可以拥有多个子线程组。在 JVM 中线程组层级关系如下：

- **system**：用来处理 JVM 系统任务的线程组，例如对象的销毁等
- **main**：system 的直接子线程组，该组至少包含一个 main 线程
- **其它**：应用程序创建的线程组

![](/img/thread-线程组.png)


ThreadGroup 主要提供了对所管理线程/线程组的 CRUD、状态控制、统计、遍历等功能，但其中很多由于安全问题都是已废弃的，使用时要注意。

```java
public class ThreadGroup implements Thread.UncaughtExceptionHandler {
    // 父线程组
    private final ThreadGroup parent;
    // 线程组名称
    String name;
    // 线程组最大优先级
    int maxPriority;
    // 销毁标记
    boolean destroyed;
    // 守护标记
    boolean daemon;
    
    // 已加入，尚未启动的线程数
    int nUnstartedThreads = 0;
    // 已启动线程数
    int nthreads;
    
    // 管理的线程集合
    Thread threads[];
    // 管理的子线程组数
    int ngroups;
    // 管理的子线程组集合
    ThreadGroup groups[];
}
```




## 参考

1. [详解Java线程状态及状态转换](https://blog.csdn.net/limenghua9112/article/details/106975105)
2. [Java并发编程：Thread类的使用](https://www.cnblogs.com/dolphin0520/p/3920357.html)
3. [Java线程Thread类详解](https://www.jianshu.com/p/9aa8c0f82ffc)
4. [JAVA多线程之UncaughtExceptionHandler——处理非正常的线程中止](https://blog.csdn.net/u013256816/article/details/50417822)
5. [Java并发编程之Thread类详解](https://developer.aliyun.com/article/906718)
6. [Java并发 之 线程组 ThreadGroup 介绍](https://juejin.cn/post/6844903811899719694)