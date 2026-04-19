---
title: Unsafe 源码阅读
date: 2023-12-03
---

Unsafe 是 JDK 提供了一个工具类，主要提供一些用于执行低级别、不安全操作的方法，如直接访问系统内存资源、自主管理内存资源等，这些方法在提升 Java 运行效率、增强 Java 语言底层资源操作能力方面起到了很大的作用。但由于 Unsafe 类使 Java 语言拥有了类似C语言指针一样操作内存空间的能力，这无疑也增加了程序发生相关指针问题的风险。在程序中过度、不正确使用Unsafe类会使得程序出错的概率变大，使得Java这种安全的语言变得不再“安全”，因此对Unsafe的使用一定要慎重。

![](/img/unsafe-func.png)


## 获取对象

JDK 里面有两个 Unsafe，`jdk.internal.misc.Unsafe` 和 `sun.misc.Unsafe`，其中 internal 包仅用于 JDK 内部，自己的程序里面无法导入，sun 包里的 Unsafe 则是组合了一个 internal 的 Unsafe，所有操作都委派给 `theInternalUnsafe` 完成，因此我们可以通过 sun 包的 Unsafe 实现不安全操作。

```java
// sun.misc.Unsafe
public final class Unsafe {

    static { Reflection.registerMethodsToFilter(Unsafe.class, Set.of("getUnsafe")); }

    private Unsafe() {}

    private static final Unsafe theUnsafe = new Unsafe();
    // 委派模式
    private static final jdk.internal.misc.Unsafe theInternalUnsafe = jdk.internal.misc.Unsafe.getUnsafe();

    @CallerSensitive
    public static Unsafe getUnsafe() {
        Class<?> caller = Reflection.getCallerClass();
        if (!VM.isSystemDomainLoader(caller.getClassLoader()))
            throw new SecurityException("Unsafe");
        return theUnsafe;
    }
}

// jdk.internal.misc.VM#isSystemDomainLoader
public static boolean isSystemDomainLoader(ClassLoader loader) {
    // 一些实现用 null 指代 Bootstrap 类加载器
    return loader == null || loader == ClassLoader.getPlatformClassLoader();
}
```

Unsafe 构造方法是私有的，只通过静态方法 `getUnsafe` 对外提供单例接口，并且内部校验必须是 Bootstrap/Platform 类加载器加载的类才可以获取。因此我们通常用反射来拿到 Unsafe 实例：

```java
public static Unsafe getUnsafe() {
    try {
        Field f = Unsafe.class.getDeclaredField("theUnsafe");
        f.setAccessible(true);
        return (Unsafe) f.get(null);
    } catch (IllegalAccessException | NoSuchFieldException e) {
        log.error(e.getMessage(), e);
        return null;
    }
}
```

一些文章里用`-Xbootclasspath/a`参数指定包的类加载器，但在 JDK 9 之后已经废弃了，无法使用。



## 内存操作

不同于**堆内存**由 JVM 管理，Unsafe 可以实现**堆外内存**的管理，包括给定地址值操作、分配、拷贝、释放等等。

```java
// 分配内存
public long allocateMemory(long bytes);
// 扩充内存
public long reallocateMemory(long address, long bytes);
// 指定内存地址设值
public void setMemory(Object o, long offset, long bytes, byte value);
public void setMemory(long address, long bytes, byte value);
// 拷贝内存
public void copyMemory(Object srcBase, long srcOffset,Object destBase, long destOffset, blong bytes);
public void copyMemory(long srcAddress, long destAddress, long bytes);
// 释放内存
public void freeMemory(long address);
```

Java 使用堆外内存（Off-Heap Memory）主要有以下一些好处：

1. **直接内存访问：** 堆外内存是直接在操作系统的本地内存中分配的，而不是在 Java 虚拟机的堆内存中。这使得可以通过本地指针直接对内存进行读写，而无需经过 Java 堆的垃圾回收机制。

2. **减少堆内存压力：** 将一些大型数据结构或缓存放在堆外内存中可以减轻 Java 堆的压力。堆外内存的分配和释放不受 Java 垃圾回收机制的管理，因此可以更灵活地控制内存的使用。

3. **避免垃圾回收影响：** 在某些应用中，特别是需要处理大量数据的高性能应用，使用堆外内存可以避免频繁的垃圾回收对性能的影响。因为堆外内存的管理不依赖于 Java 虚拟机的垃圾回收机制，不会产生不可预测的暂停。

4. **共享内存：** 堆外内存可以在多个 Java 进程之间共享。这对于需要在不同的 JVM 实例之间传递数据或共享缓存等场景非常有用。

5. **减小堆内存占用：** 对于一些不受 Java 垃圾回收管理的大型数据结构，将其放在堆外内存中可以减小 Java 堆的占用，使得堆内存可以更好地服务于其他 Java 对象。

6. **提高内存分配速度：** 堆外内存的分配速度相对较快，因为它避免了 Java 堆内存中对象的初始化和垃圾回收处理。

尽管堆外内存有这些优势，但也需要注意一些潜在的问题，比如内存泄漏、难以调试等。在使用堆外内存时，需要仔细考虑内存管理和释放的责任，确保不会引入不稳定性或安全性问题。



**应用场景**

`DirectByteBuffer`是 Java 中创建堆外内存的重要方式，其内部就是通过 Unsafe 实现堆外内存操作的：

```java
DirectByteBuffer(int cap) {  
    super(-1, 0, cap, cap, null);
    ...

    long base = 0;
    try {
        // 分配内存
        base = UNSAFE.allocateMemory(size);
    } catch (OutOfMemoryError x) {
        Bits.unreserveMemory(size, cap);
        throw x;
    }
    // 内存初始化
    UNSAFE.setMemory(base, size, (byte) 0);
    if (pa && (base % ps != 0)) {
        address = base + ps - (base & (ps - 1));
    } else {
        address = base;
    }
    // 跟踪 DirectByteBuffer 对象的垃圾回收，实现堆外内存的释放
    cleaner = Cleaner.create(this, new Deallocator(base, size, cap));
    att = null;
}
```

其中 Cleaner 继承自 PhantomReference 虚引用，Unsafe 里提供了 `public void invokeCleaner(java.nio.ByteBuffer directBuffer)` 方法调用 Cleaner。关于 Cleaner 又是一大块内容了，以后看...



## CAS 相关

借助底层的 CPU 指令`CMPXCHG`，实现 CAS 操作，在 [AQS](AQS.md)、JUC 里面都广泛应用。sun 包下只提供了这三个方法：


```java
public final boolean compareAndSwapInt(Object o, long offset, int expected, int x) {
    return theInternalUnsafe.compareAndSetInt(o, offset, expected, x);
}

public final boolean compareAndSwapLong(Object o, long offset, long expected, long x) {
    return theInternalUnsafe.compareAndSetLong(o, offset, expected, x);
}

public final boolean compareAndSwapLong(Object o, long offset, long expected, long x) {
    return theInternalUnsafe.compareAndSetLong(o, offset, expected, x);
}
```

internal 包里的 Unsafe 有更多的 CAS 操作，例如带 exchange 的交换值后返回原有值，Acquire/Release/weak 等关于 CPU 指令具体实现优化的等等，虽然好像源码里调用的是同一个，估计编译器会根据方法名做优化，可以参考 [StackOverflow上的回答](https://stackoverflow.com/questions/36428044/whats-the-difference-between-compareandset-and-weakcompareandset-in-atomicrefer)。



## 线程调度

LockSupport 的 park/unpark 底层就是执行 Unsafe 的 park/unpark。

```java
// 挂起一个线程
public void park(boolean isAbsolute, long time)
// 恢复一个线程
public void unpark(Object thread)
```


## Class 相关

```java
// 获取给定静态字段的内存地址偏移量
public long staticFieldOffset(Field f);
// 获取给定静态字段的对象指针
ublic Object staticFieldBase(Field f);\
// 是否需要初始化
public boolean shouldBeInitialized(Class<?> c);
// 是否已经初始化
public void ensureClassInitialized(Class<?> c);

// internal#Unsafe，定义一个类，会跳过所有安全检查
public Class<?> defineClass(String name, byte[] b, int off, 
                            int len, ClassLoader loader, 
                            ProtectionDomain protectionDomain);
```


## 对象操作


```java
// 获取指定字段偏移
public long objectFieldOffset(Field f);
// 获取指定偏移的对象，类似还有 int/long/char... 等版本
public Object getObject(Object o, long offset)；
// 设置指定偏移的对象，类似还有 int/long/char... 等版本
public void putObject(Object o, long offset, Object x);

// 带 Volatile 语义的
public Object getObjectVolatile(Object o, long offset);
// 有序、延迟版本的putObjectVolatile方法，不保证值的改变被其他线程立即看到
public void putOrderedObject(Object o, long offset, Object x);

// 绕过构造方法创建对象
public Object allocateInstance(Class<?> cls);
```


## 数组相关

```java
// 返回数组中第一个元素的偏移地址
public native int arrayBaseOffset(Class<?> arrayClass);
// 返回数组中一个元素占用的大小
public native int arrayIndexScale(Class<?> arrayClass);
```

## 内存屏障

在Java 8中引入，用于定义内存屏障，避免代码重排序。内存屏障也称内存栅栏，内存栅障，屏障指令等，是一类同步屏障指令，是CPU或编译器在对内存随机访问的操作中的一个同步点，使得此点之前的所有读写操作都执行后才可以开始执行此点之后的操作。

```java
// 内存屏障，禁止load操作重排序。屏障前的load操作不能被重排序到屏障后，屏障后的load操作不能被重排序到屏障前
public native void loadFence();
// 内存屏障，禁止store操作重排序。屏障前的store操作不能被重排序到屏障后，屏障后的store操作不能被重排序到屏障前
public native void storeFence();
// 内存屏障，禁止load、store操作重排序
public native void fullFence();
```


## 系统相关

```java
// 返回系统指针的大小。返回值为4（32位系统）或 8（64位系统）。
public native int addressSize();  
// 内存页的大小，此值为2的幂次方。
public native int pageSize();
```





## 参考

1. https://tech.meituan.com/2019/02/14/talk-about-java-magic-class-unsafe.html
2. https://juejin.cn/post/6933078830336704520