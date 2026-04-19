---
title: Java ThreadLocal
date: 2025-11-15
---
共享变量在多线程环境下容易出现并发问题，ThreadLocal为每个线程创建独立的存储空间，用以存储线程本地变量，多个线程之间互不干扰，从而避免了线程安全问题。

![ThreadLocal结构](/img/ThreadLocal结构.png)

每个 Thread 内部都有一个 ThreadLocalMap 对象 threadLocals，本质上是一个键值对的映射，其中 key 是共享的 ThreadLocal 实例对象本身的弱引用，value 是该线程内部的变量值。因此，在不同线77程中访问同一个 ThreadLocal 对象时，实际上是访问了各个 Thread->ThreadLocalMap 对象中的不同 value，从而避免了多线程之间对变量的共享和访问冲突。

```java
// java.lang.Thread
ThreadLocal.ThreadLocalMap threadLocals = null;

// java.lang.ThreadLocal.ThreadLocalMap
static class ThreadLocalMap {
  
    // 注意 key 是弱引用
    static class Entry extends WeakReference<ThreadLocal<?>> {
        Object value;
        Entry(ThreadLocal<?> k, Object v) {
            super(k);
            value = v;
        }
    }

    ...
}

// java.lang.ThreadLocal#get
public T get() {
    Thread t = Thread.currentThread();
    // 获取线程 t 的 threadLocals
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}
```

**为什么是弱引用**

假如使用强引用，当ThreadLocal不再使用需要回收时，发现某个线程中ThreadLocalMap存在该ThreadLocal的强引用，无法回收，从而造成内存泄漏。

使用弱引用可以防止长期存在的线程（通常使用了线程池）导致ThreadLocal无法回收造成内存泄漏。


**内存泄露问题**

主要由两个强引用关系造成：
- ThreadLocal 强引用：由声明位置决定（全局变量或局部变量）
- ThreadLocalMap 强引用：由线程对象决定（线程何时执行完成）

为了使 ThreadLocal 对象在线程间重复使用，通常会将其声明为全局变量。此时，ThreadLocal 强引用关系永远不会断开，那么存储的对象永远不会被回收。在使用线程池情况下，工作线程会重复使用，此时 ThreadLocalMap 不会被回收，造成内存泄漏。

因此，在使用完 ThreadLocal 后应手动调用 remove() 进行回收，避免内存泄漏。



**使用场景**

1. 例如 SimpleDateFormat/Random 这样的工具类，每个线程都要用到，如果每个线程都 new 一个很麻烦，因此可以改成static共用。但是可能会线程不安全，因此可以使用 threadLocal 每个线程分配一个，保证线程安全

2. 对于同一个线程内所有方法需要共享的资源，比如用户信息，为了避免参数一层层显式传递，同时保证线程的安全，可以使用 threadLocal 保存。这样每个线程内访问的都是相同的资源，不同线程访问的是不同资源。



**Set() 实现**

1. 计算 key 的哈希，内部的 nextHashCode() 每次添加时自增一个斐波那契数，来和数组/槽容量相与（使得哈希分布更均匀）
2. 如果哈希对应的槽为空，直接新建 Entry 放入
3. 槽非空的情况下
   - 如果 key 相同，那么直接覆盖更新
   - 如果 key 为 null，说明被 GC 了，替换过期的本地变量，
   - 否则使用线性探测法，直到找到合适的位置
4. 执行 cleanSomeSlots() 清理 key 为 null 的 Entry，如果没有需要清理的，且 size 超过阈值（容量的2/3），进行 rehash
    
    
**过期 key 的清理**

replaceStaleEntry()
- 从 staleSlot 向前迭代找过期槽，更新 slotToExpunge，直到空槽
- 从 staleSlot 向后迭代找 key 相同的，执行更新，直到空槽
- 最后从 slotToExpunge 开始执行启发式过期数据清理

启发式清理 - cleanSomeSlots()
- 当容量/2的位置开始探测式清理

探测式清理 - expungeStaleEntry()
- 以当前 Entry 往后清理，遇到值为 null 则结束清理，属于线性探测清理


**get() 实现**

1. 根据当前线程拿到 ThreadLocalMap 对象
2. 计算 ThreadLocal 这个 key 的哈希定位 Slot
3. 从 ThreadLocalMap 拿到 value，如果不匹配则线性探测，同时清理无效本地变量


**InheritableThreadLocal**

ThreadLocal 无法在异步场景下给子线程共享父线程中创建的线程副本，可以使用 InheritableThreadLocal，在 Thread 构造方法中传递数据。
但一般异步处理都使用线程池复用，存在数据不一致问题，可以用阿里开源的 TransmittableThreadLocal 组件。
