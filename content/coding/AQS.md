---
title: AQS 源码解析
date: 2023-11-25
---
JDK 14 的 AQS 相比 JDK 8 有了较大的改进，之后一直到 JDK 17 都没有改动，本文以 JDK 17 的源码为例，学习 AQS 的设计。前置知识：[CLH 锁](https://coderbee.net/index.php/concurrent/20131115/577)、[LockSupport](https://www.lilinchao.com/archives/2511.html)、常用的锁工具如`ReentrantLock`基本用法。


## 概述

`AbstractQueuedSynchronizer`（AQS）是 Java 并发包中提供的一个用于构建锁和其他同步器的框架。AQS 采用了基于 CLH 锁的 FIFO 等待队列，通过队列中的节点来管理等待线程。当一个线程尝试获取锁但失败时，它会被包装成一个节点并加入等待队列，然后进入自旋等待状态。当持有锁的线程释放锁时，它会唤醒等待队列中的第一个节点，使其有机会获取锁。

AQS 的主要目标是提供一种灵活的、可重用的框架，使得开发人员能够相对容易地构建各种形式的同步器，例如 `ReentrantLock`、`Semaphore`、`CountDownLatch` 等，不同类型的同步器只需要实现获取锁和释放锁的逻辑即可，而其它部分则由 AQS 提供了通用的框架。



## 类结构

顶层的`AbstractOwnableSynchronizer`很简单，里面定义了一个`exclusiveOwnerThread` 排他性的拥有者线程，表示当前拥有锁的线程实例，但是在 AQS 中并没有使用，子类实现的具体的同步器可能会用到。

```java
public abstract class AbstractOwnableSynchronizer implements java.io.Serializable {
    private transient Thread exclusiveOwnerThread;
}
```

![](/img/AQS-DS.svg)

子类`AbstractQueuedSynchronizer`内部定义了队列的节点 Node，通过 prev/next 串联起来构成等待队列，并扩展出三个子类:
- `ExclusiveNode` 排他节点
- `SharedNode` 共享节点
- `ConditionNode` 条件节点

AQS 队列本身主要有 head, tail, state 三个重要属性：

```java
public abstract class AbstractQueuedSynchronizer extends AbstractOwnableSynchronizer {

    private transient volatile Node head;    // 等待队列的对头
    private transient volatile Node tail;    // 等待队列的队尾
    private volatile int state;              // 队列的同步状态


    // 队列节点所关联线程的几个状态常量（注意和队列的状态区别开）
    static final int WAITING   = 1;          // must be 1 线程等待
    static final int CANCELLED = 0x80000000; // must be negative 取消等待
    static final int COND      = 2;          // in a condition wait 条件等待

    // 抽象队列节点
    abstract static class Node {
        volatile Node prev;
        volatile Node next;
        
        // 节点关联的请求线程
        Thread waiter;
        
        // 节点状态，非负值表示正常
        volatile int status;      // written by owner, atomic bit ops by others

        // 配套工具方法
    }


    // Condition 实现
    public class ConditionObject implements Condition {
        private transient ConditionNode firstWaiter;
        private transient ConditionNode lastWaiter;
        // Condition 配套方法
    }
}
```



## 队列构造

当第一次有线程获取不到锁，关联的节点需要暂时入队时，会初始化同步器，也就是 AQS 等待队列，对应`tryInitializeHead()`方法，初始化之后队列的头尾节点指向同一个 ExclusiveNode，这个头节点只是作为占位的虚拟节点，并不实际代表某个线程。

![](/img/AQS1.svg)

然后再次尝试获取锁，如果还是拿不到就真的要把当前线程封装成 Node 入队了，后续如果有更多线程竞争资源，也是一样的放到队尾，只不过源码中入队的操作很克制，只有多次自旋拿不到资源才会真的入队。

![](/img/AQS2.svg)





## 核心方法

以 ReentrantLock 可重入锁为例，当执行 lock 加锁时，就会间接调用 AQS 的核心`acquire/acquireInterruptibly/tryAcquireNanos` 这些获取方式去尝试竞争资源，内部会通过具体的子类定义的`tryAcquire`去尝试修改 state 表示获取资源。

而执行 unlock 解锁时，就会通过 AQS 的`release -> tryRelease`方法修改 state 变量以释放资源，然后通过`signalNext`唤醒下一个等待队列中的线程，完成共享资源的竞争和释放。因此说，AQS 提供的一种模板方法。


![](/img/aqs-template.svg)


通常，同步器需要重写的模板调用方法有五个：

| 方法名  | 描述  |
|---|---|
| boolean  tryAcquire(int) | 独占式获取同步状态，实现此方法需要查询当前状态并判断同步状是否符合预期，然后再进行CAS设置同步状态 |
| boolean tryRelease(int) | 独占式释放同步状态，等待获取同步状态的线程将有机会获取同步状态 |
| boolean isHeldExclusively() | 当前同步器是否在独占模式下被线程占用，一般此方法表示是否被当前线程所独占 |
| int tryAcquireShared(int) | 共享式获取同步状态，反加大于等于0(等于0表示下个等待节点可能获取锁失败，大于0表示后面的等待节点获取锁很可能成功)，表示获取成功，反之，获取失败。|
| boolean tryReleaseShared(int) | 共享式释放同步状态 |




### acquire


```java
final int acquire(Node node,                // 一般是 null，除非是 ConditionNode
                  int arg,                  // 请求参数，例如重入次数
                  boolean shared,           // 排他/共享
                  boolean interruptible,    // 是否可中断
                  boolean timed,            // 是否超时
                  long time) {              // 超时事件，单位纳秒
    
    Thread current = Thread.currentThread();
    byte spins = 0, postSpins = 0;   // retries upon unpark of first thread
    boolean interrupted = false, first = false;
    
    // 入队之后当前线程关联节点的前继
    Node pred = null;

    for (;;) {        
        if (!first 
            && (pred = (node == null) ? null : node.prev) != null // 入队前 node = null 跳过这里
            && !(first = (head == pred)))                         // 入队后如果当前线程不是 head 的直接后继，即队列里还有其它线程在等待走这段逻辑
        
        {
            // 前继已经取消，需要清理已经取消的节点，然后重新循环
            if (pred.status < 0) {
                cleanQueue();
                continue;
            } else if (pred.prev == null) { // 前继已经是 head 队头了
                Thread.onSpinWait();
                continue;
            }
        }

        // 没入队，或者入队后是 head 的直接后继
        if (first || pred == null) {
            // 尝试获取资源
            // 例如 ReentrantLock 校验 state 修改 exclusiveOwnerThread 为本线程来获取锁
            boolean acquired;
            try {
                if (shared)
                    acquired = (tryAcquireShared(arg) >= 0);
                else
                    acquired = tryAcquire(arg);
            } catch (Throwable ex) {
                cancelAcquire(node, interrupted, false);
                throw ex;
            }

            // 拿到锁了就返回，整个方法唯一的正常结束点
            // 其它分支都会继续循环，除非超时/中断/异常
            if (acquired) {
                // 如果当前是头节点的直接后继，head 出队，node 成为新的 head（head 出队，而不是 node 出队，应该是可以简化指针的切换）
                if (first) {
                    node.prev = null;
                    head = node;
                    pred.next = null;
                    node.waiter = null;
                    if (shared)
                        signalNextIfShared(node);
                    if (interrupted)
                        current.interrupt();
                }
                return 1;
            }
        }

        // 资源正被其它线程占有，当前线程需要关联一个节点入队
        if (node == null) {  
            if (shared)
                node = new SharedNode();
            else
                node = new ExclusiveNode();
        } else if (pred == null) {          
            // 这里是 else，也就是说，真正入队之前会再自旋一次，因为入队的开销是比较大的
            // 如果只有一个等待的线程，那么 pred 一直为 null，一直在这里循环
            node.waiter = current;
            Node t = tail;
            node.setPrevRelaxed(t);  
            
            if (t == null)                  // 第一次有节点入队才初始化 AQS 队列，初始化完了之后再自旋一次
                tryInitializeHead();
            else if (!casTail(t, node))     // 将 tail 指向 node，如果失败设置 pred = node.prev = null 后重试
                node.setPrevRelaxed(null);
            else                            // 原来队尾的 next 指向 node 完成入队
                t.next = node;
        } else if (first && spins != 0) {   // 被 unpark 唤醒后又没抢到资源，尝试多次自旋
            --spins; 
            Thread.onSpinWait();            // CPU 指令，高效自旋
        } else if (node.status == 0) {      // 自旋完了还是没抢到，修改 state 状态后再自旋一次；如果还是抢不到，就又要被 park 了.../(ㄒoㄒ)/~~
            node.status = WAITING;
        } else {                            // 拿锁失败，park
            long nanos;
            // 自旋次数 = 2^n + 1 随着被 park 次数增加而增加，使得长期未拿到资源的线程有更多自旋机会，更容易拿到
            spins = postSpins = (byte)((postSpins << 1) | 1);
            // 一直到这里都还没拿到资源，就会 park 暂停线程，等待其它线程 unpark
            if (!timed)
                LockSupport.park(this);
            else if ((nanos = time - System.nanoTime()) > 0L)
                LockSupport.parkNanos(this, nanos);
            else
                break;
            // 到这里说明其它某个线程执行了 unpark，当前线程清除 state 状态开始竞争资源
            node.clearStatus();
            if ((interrupted |= Thread.interrupted()) && interruptible)
                break;
        }
    }
    // 异常/超时/中断，取消竞争
    return cancelAcquire(node, interrupted, interruptible);
}
```
  
关于`cleanQueue`方法，在多线程下麻烦死的指针变换可以看这里：[Jdk17 AQS cleanQueue方法源码分析](https://blog.csdn.net/yxl626571494/article/details/129959583)


### release

```java
// AQS#release
public final boolean release(int arg) {
    if (tryRelease(arg)) {      // 由实现类定义
        signalNext(head);
        return true;
    }
    return false;
}

// AQS#signalNext
// h 一般就是对头 head，除了在 cleanQueue 里是要清除的已取消节点
private static void signalNext(Node h) {
    Node s;
    if (h != null && (s = h.next) != null && s.status != 0) {
        // 修改后继节点的 state = ~WAITING
        s.getAndUnsetStatus(WAITING);
        // 唤醒等待的线程
        LockSupport.unpark(s.waiter);
    }
}
```









## 条件队列

AQS 里面还定义了一个 ConditionObject 条件对象，JDK 里面唯一的 Condition 接口实现类，和 ConditionNode 一起构建条件队列，应用于各种 BlockingQueue、CyclicBarrier 等工具。

![](/img/ConditionObject.svg)


条件队列入对的对外接口是各种`await`方法，将线程关联的节点移出 AQS 的等待队列，移入某个条件对象的条件队列：

```java
public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    ConditionNode node = new ConditionNode();
    
    // 进入条件队列，并释放所持有的资源
    int savedState = enableWait(node);
    // 设置当前对象为阻塞资源
    LockSupport.setCurrentBlocker(this);
    
    boolean interrupted = false, cancelled = false, rejected = false;
    // 必须不在 AQS 的等待队列里
    while (!canReacquire(node)) {
        if (interrupted |= Thread.interrupted()) {
            if (cancelled = (node.getAndUnsetStatus(COND) & COND) != 0)
                break; 
        } else if ((node.status & COND) != 0) {
            try {
                // 阻塞关联线程
                if (rejected)
                    node.block();
                else
                    ForkJoinPool.managedBlock(node);
            } catch (RejectedExecutionException ex) {
                rejected = true;
            } catch (InterruptedException ie) {
                interrupted = true;
            }
        } else
            Thread.onSpinWait();    // awoke while enqueuing
    }

    // 到这里说明其它线程 unpark 了，撤销阻塞对象，清除状态后竞争资源
    LockSupport.setCurrentBlocker(null);
    node.clearStatus();
    acquire(node, savedState, false, false, false, 0L);
    if (interrupted) {
        if (cancelled) {
            unlinkCancelledWaiters(node);
            throw new InterruptedException();
        }
        Thread.currentThread().interrupt();
    }
}
```


反之，唤醒则对应`signal->doSignal`方法，从条件队列中移出，进入 AQS 等待队列中，之后便拥有竞争锁的权利：

```java
// ConditionObject#doSignal
private void doSignal(ConditionNode first, boolean all) {
    while (first != null) {
        ConditionNode next = first.nextWaiter;
        if ((firstWaiter = next) == null)
            lastWaiter = null;
        if ((first.getAndUnsetStatus(COND) & COND) != 0) {
            enqueue(first);
            if (!all)
                break;
        }
        first = next;
    }
}

// AQS#enqueue
final void enqueue(Node node) {
    if (node != null) {
        for (;;) {
            Node t = tail;
            node.setPrevRelaxed(t);        // avoid unnecessary fence
            if (t == null)                 // initialize
                tryInitializeHead();
            else if (casTail(t, node)) {
                t.next = node;
                if (t.status < 0)          // wake up to clean link
                    LockSupport.unpark(node.waiter);
                break;
            }
        }
    }
}
```










## 同步器实现

JUC 包里的很多同步器都是基于 AQS 暴露的 API 实现的，通过在内部定义一个继承自 AQS 的 Sync 实例，重写 acquire/release 等方法。不同的同步器主要的区别就在于对队列同步状态的不同定义：

| Synchronizer | State Definition  |
|---|---|
| ReentrantLock  | 资源表示独占锁。state 为 0 表示锁可用；为 1 表示被占用；为 N 表示重入次数 |
| CountDownLatch | 资源表示倒数计数器。state 为 0 表示计数器归零；所有线程都可以访问资源；为 N 表示计数器未归零，所有线程都需要阻塞 |
| Semaphore | 资源表示信号量/令牌。state ≤ 0 表示没有令牌可用，所有线程都需要阻塞；大于 0 表示由令牌可用，线程每获取一个令牌 state减 1，线程没释放一个令牌，state 加 1 |
| ReentrantReadWriteLock | 资源表示共享的读锁和独占的写锁。state 逻辑上被分成两个 16 位的 unsigned short，分别记录读锁被多少线程使用和写锁被重入的次数 |


以 ReentrantLock 为例，里面定义了 Sync 同步器继承自 AQS，实现了`tryLock`快速尝试加锁方法，以及`initialTryLock`抽象方法用于校验可重入性，以及支持是否公平，在任何 lock 方法执行前，都要前执行该方法尝试是否能加锁。其他的还有一些用于提供支持，以及超时、中断相关的方法。

```java
abstract static class Sync extends AbstractQueuedSynchronizer {
    final boolean tryLock() {
        Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {    // 尝试直接加锁
            if (compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        } else if (getExclusiveOwnerThread() == current) {  // 重入
            if (++c < 0) // state 是 int 型，因此支持最多重入 Integer.MAX_VALUE 次
                throw new Error("Maximum lock count exceeded");
            setState(c);
            return true;
        }
        return false;
    }

    abstract boolean initialTryLock();

    // .......
}
```

非公平锁实现 NonfairSync 很简单，initialTryLock 就是简单的校验 state 数值然后直接去加锁：

```java
static final class NonfairSync extends Sync {
    final boolean initialTryLock() {
        Thread current = Thread.currentThread();
        if (compareAndSetState(0, 1)) {
            setExclusiveOwnerThread(current);
            return true;
        } else if (getExclusiveOwnerThread() == current) {
            int c = getState() + 1;
            if (c < 0) // overflow
                throw new Error("Maximum lock count exceeded");
            setState(c);
            return true;
        } else
            return false;
    }

    protected final boolean tryAcquire(int acquires) {
        if (getState() == 0 && compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(Thread.currentThread());
            return true;
        }
        return false;
    }
}
```


而在公平锁 FairSync 实现的 `initialTryLock` 和 `tryAcquire` 里，如果当前线程没有持有锁，那么必须等 AQS 的等待队列为空才可以去加锁，保证了先来后到：

```java
static final class FairSync extends Sync {

    final boolean initialTryLock() {
        Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) {
            // 等待队列为空，且没有被其它线程持有
            if (!hasQueuedThreads() && compareAndSetState(0, 1)) {
                setExclusiveOwnerThread(current);
                return true;
            }
        } else if (getExclusiveOwnerThread() == current) {
            if (++c < 0) // overflow
                throw new Error("Maximum lock count exceeded");
            setState(c);
            return true;
        }
        return false;
    }

    protected final boolean tryAcquire(int acquires) {
        // 等待队列为空，且没有被其它线程持有
        if (getState() == 0 && !hasQueuedPredecessors() &&
            compareAndSetState(0, acquires)) {
            setExclusiveOwnerThread(Thread.currentThread());
            return true;
        }
        return false;
    }
}
```


另外可以发现，JUC 中基于 AQS 的所有工具类都并非直接继承自 AQS，而是将具体的功能以委托的形式交给内部的子类，这样的设计可以保证工具类对外接口的简洁性，并且可以防止开发人员误用 AQS 的公有方法而破坏同步器的状态。读完 AQS 的源码，再去看这些工具类的源码，不过是洒洒水了~





## 参考

[1]. [自旋锁、排队自旋锁、MCS锁、CLH锁](https://coderbee.net/index.php/concurrent/20131115/577)  
[2]. https://www.lilinchao.com/archives/2511.html  
[3]. https://blog.csdn.net/weixin_49561445/article/details/120598020  
[4]. https://www.iotxing.com/AQS%E6%BA%90%E7%A0%81%E5%88%86%E6%9E%90/  
[5]. https://blog.csdn.net/yxl626571494/article/details/129959583  


> PS：花了一天时间把这一通代码读下来，神清气爽，跟之前看 Spring 事务源码一样，没看之前感觉好可怕，但只要静下心慢慢看，其实也还好。其实一开始想看看美团的动态线程池设计的，然后就回过去看了一下线程池源码，然后就来到 AQS 了... 欠下的债总有一天是要还的
> 读这种复杂源码才发现，不可变的定义有多好，不怕它莫名其妙冒出个子类或者中途在某个地方改了。