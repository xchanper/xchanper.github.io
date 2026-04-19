---
title: JVM 运行时数据区
date: 2024-03-02
---
## 总览

java 源文件经过编译后变成静态的 class 字节码文件，JVM 在启动时经过加载、链接、初始化，把字节码数据加载进内存，称为 JVM 运行时数据区，最后，执行引擎（解释器 + JIT）不断和内存数据进行交互从而执行程序。

运行时数据区分两大块：
- 所有线程共享：方法区、堆
- 线程私有：虚拟机栈、本地方法栈、程序计数器

![概览](/img/jvm-memory-overview.jpg)



## 程序计数器

Program Counter Register，是当前线程所执行的字节码指令的地址，字节码解释器通过改变该寄存器的值，来定位下一条将要执行的字节码指令。

+ 线程私有，各线程之间的计数器互不影响，独立存储
+ JVM 规范唯一不会产生 `OutOfMemoryError` 的区域
+ 如果执行的是 native 方法，那么计数器为空

```java
// 源代码
public void test() {                // 第1行
    int x = 10;                     // 第2行
    if (x > 5) {                    // 第3行
        System.out.println("yes");  // 第4行
    }
}

偏移量    字节码指令              对应源码
──────────────────────────────────────────────────
  0:     bipush 10              // int x = 10
  2:     istore_1               // 将 10 存入局部变量表 slot 1
  3:     iload_1                // 把 x 加载到操作数栈
  4:     iconst_5               // 把常量 5 压栈
  5:     if_icmple 14           // if (x <= 5) 跳转到偏移量 14
  8:     getstatic ...          // 获取 System.out
 11:     ldc "yes"              // 把 "yes" 压栈
 13:     invokevirtual println  // 调用 println("yes")
 16:     return                 // 方法返回



执行步骤    PC 的值    正在执行的指令            发生了什么
─────────────────────────────────────────────────────────────
  1          0        bipush 10              把常量 10 压入操作数栈
  2          2        istore_1               弹出栈顶的 10，存到局部变量 x
  3          3        iload_1                把 x（值为 10）压入操作数栈
  4          4        iconst_5               把常量 5 压入操作数栈
  5          5        if_icmple 14           比较：10 > 5，条件不成立，不跳转
  6          8        getstatic              获取 System.out 对象引用
  7         11        ldc "yes"              把字符串 "yes" 压栈
  8         13        invokevirtual println  调用 println 方法，输出 "yes"
  9         16        return                 方法结束，栈帧弹出
```


## 虚拟机栈

虚拟机栈维护 Java 程序的运行，每执行一个方法，虚拟机栈会同步创建一个栈帧入栈，每个方法的退出都对应一个栈帧的出栈，遵循先进后出的原则。

- 线程私有，每个线程的栈顶是当前正在执行的方法
- 如果虚拟机栈大小固定，那么当线程请求分配的栈容量超出虚拟机栈上限，会抛出 StackOverflowError
- 如果虚拟机栈大小动态扩展，那么当无法申请到足够内存时，会抛出 OutOfMemoryError


栈里面的每个栈帧包括 局部变量表、操作数栈、动态链接、方法返回地址，以及一些附加信息。

![栈帧](/img/jvm-memory-stack-frame.jpg)



### 局部变量表

以字节数组形式，存储方法参数和定义在方法体内的局部变量，包括基本数据类型和对象的引用。 局部变量表的大小是在编译器就确定下来的，运行期间不会变化。

- 容量以变量槽`Slot`为最小单位
  - 除了`long double`需要2个Slot外，其余数据类型都需要1个Slot
  - slot 基于变量作用范围可复用，从而节省资源
- 当一个方法被调用时，它的方法参数和方法体内部定义的局部变量将会按照顺序被复制到局部变量表中的每一个 slot 上（因此深层次的调用和庞大的参数传递会占据栈内存）
- 如果当前帧是由构造方法或实例方法创建的，那么该对象引用 this 将会存放在 index 为 0 的 slot 处，其余的参数按照参数表顺序继续排列

![局部变量表-槽复用](/img/jvm-memory-stack-slot.jpg)



### 动态链接

每个栈帧都包含一个指向当前方法所属类的运行时常量池引用，以便支持调用过程中的动态连接。

Java 编译得到的 class 文件存储的都是符号引用（比如方法的全限定名），它在方法调用时首先需要确定被调用方法在内存中的具体入口地址（直接地址），这里分两种方式：

- 静态链接：当一个字节码文件被装载进 JVM 内部时，如果被调用的目标方法在编译期可知，且运行期保持不变时，这种情况下会在第一次调用时将目标方法的符号引用转换为直接引用，例如静态方法、私有方法、final 方法这些不存在多态、不可被重写的方法（非虚方法）
- 动态链接：如果被调用的方法在编译期无法被确定下来，只能在每次方法调用时将目标方法的符号引用转换为直接引用（虚方法 --> invokevirtual）

![动态链接](/img/jvm-memory-stack-dynamic-link.jpg)



### 操作数栈

每个独立的栈帧中除了包含局部变量表之外，还包含一个后进先出（Last-In-First-Out）的操作数栈，用作执行表达式计算的临时数据栈。在方法执行过程中，根据字节码指令，往操作数栈中写入数据或提取数据，即入栈（push）、出栈（pop）。

```java
// Java：
int r = (a + b) * c;

// 字节码逻辑：
iload a
iload b
iadd
iload c
imul
istore r

// 执行过程操作数栈的变化：
// 1. 初始为空
┌───────┐
│       │
└───────┘
// 2. push a, push b
操作数栈
┌───────┐
│   b   │  ← 栈顶
├───────┤
│   a   │
└───────┘
// 3. iadd == pop, pop, add, push
操作数栈
┌─────────┐
│  a + b  │  ← 栈顶
└─────────┘
// 4. push c
操作数栈
┌───────┐
│   c   │  ← 栈顶
├───────┤
│ a + b │
└───────┘
// 5. imul == pop, pop, mul, push
操作数栈
┌─────────────┐
│ (a+b) * c   │ ← 栈顶
└─────────────┘
// 6. pop，结果存入局部变量表，操作数栈清空
┌───────┐
│       │
└───────┘
```

### 方法返回地址

方法退出后都返回到该方法被调用的位置，让主调方法继续执行下去。因此，每个栈帧有一个方法返回地址用来存放主调方法的 PC 寄存器的值。

方法有两种退出方法执行的方式：
- 正常调用完成，正常向主调方法提供返回值
- 方法执行遇到异常，且在本方法的异常表中没有搜索到匹配的异常处理器，此时会导致方法异常退出且不提供任何返回值，需要交由主调方法继续处理异常


### 附加信息

栈帧中还允许携带与 Java 虚拟机实现相关的一些附加信息。例如，对程序调试提供支持的信息，但这些信息取决于具体的虚拟机实现。


## 本地方法栈

类似虚拟机栈，不过是为虚拟机使用到的 Native 方法服务，以支持 JNI 调用，方便低层次的代码实现。

同样的，栈帧过多可能导致`StackOverflowError`，栈空间不足导致可能导致`OutOfMemoryError`。在 Hotspot JVM 中，直接将本地方法栈和虚拟机栈合二为一，通过帧类型来区分 Java 栈帧和 native 栈帧。




------
> 栈解决程序的运行问题，即程序如何执行，或者说如何处理数据。而下面的堆，解决的是数据存储的问题，即数据怎么放、放在哪。
------



## 堆

JVM 中最大的一块内存区，是垃圾回收器管理的主要区域，用于存放几乎所有对象实例以及数据，包括对象实例、字符串常量池、静态变量。

另外由于线程共享可能产生内存冲突，为了提升内存的分配效率，堆中还开辟了一块各线程私有的线程分配缓冲区 TLAB（Thread Local Allocation Buffer）。

![JDK 8内存结构](/img/JVM-Java8内存结构图.png)


### 内存分配

为了进行高效的 GC，逻辑上 JVM 把堆划分为三块区域：
1. 新生代：存储新对象和没达到一定年龄的对象，包括一个 Eden 和两个 Survivor 区，JDK8 开始会基于 GC 统计数据自适应划分区域大小
   - minor gc 流程：Eden 区满后，开始标记 Eden 和 S0 存活对象并复制到 S1，清空 Eden 和 S0，交换 S0 和 S1
   - 每次 minor gc 后的存活对象年龄 +1，达到阈值后晋升到老年代
   - 如果分配空间不足，大对象会直接晋升（空间担保）
2. 老年代：被长时间使用的对象，老年代的内存空间应该要比年轻代更大，major gc 区域
   - 老年代如果发生 major gc 后仍然无法分配对象空间会产生 OOM
3. 元空间（永久代）：方法中的临时操作对象，JDK 8 后直接使用物理内存

![堆内存划分](/img/hotspot-heap-structure.jpg)


### 对象访问

![对象的访问定位](/img/jvm-memory-object-visit.svg)

线程栈包含正在执行的每个方法的所有局部变量，包括基本类型和对象引用，线程只能访问它自己的栈，因此，每个线程都有每个局部变量的副本。而堆包含了程序创建的所有对象。

如图中的示例，两个线程方法 1对应的栈帧里，变量 1 是基本类型变量，直接存储在线程各自私有的栈帧中，因此不会有共享并发的问题。变量 2 是两个线程栈各自对同一对象的不同引用，共同指向堆上的对象 3，对象 3 内部又引用堆上的对象 2 和对象 4，因此对象 2、3、4 是共享的，需要考虑并发问题。

而在方法 2 的栈帧里，两个线程又各自存有一份堆上不同对象的引用，说明两个线程操作的是不同对象，因此也不用考虑并发问题。

```java
public class MyRunnable implements Runnable() {

    public void run() {
        methodOne();
    }

    public void methodOne() {
        int localVariable1 = 45;

        MySharedObject localVariable2 =
            MySharedObject.sharedInstance;

        //... do more with local variables.

        methodTwo();
    }

    public void methodTwo() {
        Integer localVariable1 = new Integer(99);

        //... do more with local variable.
    }
}

public class MySharedObject {

    //static variable pointing to instance of MySharedObject

    public static final MySharedObject sharedInstance =
        new MySharedObject();


    //member variables pointing to two objects on the heap

    public Integer object2 = new Integer(22);
    public Integer object4 = new Integer(44);

    public long member1 = 12345;
    public long member1 = 67890;
}
```


### 逃逸分析

为什么说是“几乎所有“对象都在堆？因为基于逃逸分析，衍生出多种优化手段：

1. 栈上分配
   如果逃逸分析发现一个对象不会被外部访问，那么会直接在栈上分配对象。

2. 锁消除
   如果同步块所使用的锁对象不会被发布到其他线程，那么 JIT 编译器在编译这个同步块的时候就会取消对这个代码的同步，从而提高并发性能
  
    ```java
    public void keep() {
      Object keeper = new Object();
      synchronized(keeper) {
      System.out.println(keeper);
      }
    }
    // 优化后
    public void keep() {
      Object keeper = new Object();
      System.out.println(keeper);
    }
    ```

3. 标量替换
   通过逃逸分析确定该对象不会被外部访问，并且对象可以被进一步分解时，JVM 不会创建该对象，而会将该对象成员变量分解若干个被这个方法使用的成员变量所代替。这些代替的成员变量在栈帧或寄存器上分配空间。
   
    ```java
    public static void main(String[] args) {
      alloc();
    }

    // 栈上分配 int x 和 int y，而不会在堆中创建对象 Point
    private static void alloc() {
      Point point = new Point（1,2）;
      System.out.println("point.x="+point.x+"; point.y="+point.y);
    }
    class Point{
        private int x;
        private int y;
    }
    ```
   
不过，目前逃逸分析的技术并不是十分成熟，其本身的算法相当复杂，无法保证逃逸分析的性能消耗一定能高于它的收益。


## 方法区

按照 JVM 的规范，方法区需要存储已被虚拟机加载的类信息、常量、静态变量、代码缓存等数据。

而在实现上，JDK8 以前位于 JVM 内存的永久代实现，但是为了能够加载更多的类同时改善 GC，现在改用位于本地内存的元空间作为方法区的实现，并将静态变量和字符串常量池放入了堆中。类加载过多或常量过多，超出本地内存，可能产生`OutOfMemoryError`。

![](/img/java内存演进.png)

> 移除永久代原因：http://openjdk.java.net/jeps/122


**方法区的元空间实现**
![](/img/JDK8-methodarea.jpg)


**几个常量池：**

1. 类常量池：位于字节码文件中，存储了编译期间生成的字面量（基本数据类型、字符串类型常量、声明为 final 的常量值等）和符号引用（类、字段、方法、常量符号引用）
2. 运行时常量池：在类加载阶段，JVM 会把每个类的常量池数据转存到运行时常量池，随后在类解析阶段，将池中的符号引用替换为直接引用。
3. 字符串常量池：每个类的常量池里存有该类使用到的字符串符号引用，指向堆中的字符串常量池，以此实现字符串共享


> 除了在编译期生成的常量，运行时常量池还可以动态添加数据，例如 String 类的 intern() 方法可以主动将串池中的字符串对象引用放入运行时常量池。
> 
> 关于静态变量：从 JVM 规范来说，静态变量属于方法区的一部分；但在 HotSpot 实现中，静态变量存放在堆中的 Class 对象里。
>
> 方法区满足特定条件的无用类和废弃常量也可能会被回收，具体取决于 JVM 实现和参数。



  
## 直接内存

Direct Memory，不属于 JVM 运行时数据区，也不受 GC 管理，其分配回收成本较高，但读写性能很高，受物理内存的约束，超出物理内存将产生`OutOfMemoryError`。

直接内存由 Native 方法分配，例如 NIO 使用直接内存作为数据缓冲区，底层使用了 Unsafe 对象完成直接内存的分配与回收（内部使用 Cleaner 配合虚引用，自动调用 freeMemory 方法回收），大大提高了 IO 性能。


## 控制参数

- -Xms 堆的初始空间
- -Xmx 堆的最大空间
- -Xmn 新生代大小
- -XX:NewSize 新生代最小空间
- -XX:MaxNewSize 新生代最大空间
- -XX:NewRatio 老年代:新生代比例
- -XX:SurvivorRatio Eden:Survivor 比例
- -XX:MaxTenuringThreshold 对象晋升年龄
- -XX:MetaspaceSize 方法区初始大小
- -XX:MaxMetaspaceSize	最大大小
- -XX:MinMetaspaceFreeRatio	最小空闲比例
- -XX:MaxMetaspaceFreeRatio	最大空闲比例
- -Xss 线程栈大小
- -XX:MaxDirectMemorySize 最大直接内存


![JVM 内存控制参数](/img/jvm-memory-param.jpg)
