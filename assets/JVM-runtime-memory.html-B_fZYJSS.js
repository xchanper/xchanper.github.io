import{_ as o}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as r,a as t,d as l,f as i,e as n,g as s,r as p,o as d}from"./app-B07DzZWU.js";const c="/img/java%E5%86%85%E5%AD%98%E6%BC%94%E8%BF%9B.png",h="/img/JVM-Java8%E5%86%85%E5%AD%98%E7%BB%93%E6%9E%84%E5%9B%BE.png",g="/img/jdk6-methodarea.png",u="/img/JDK8-methodarea.jpg",m="/img/%E5%AF%B9%E8%B1%A1%E7%9A%84%E8%AE%BF%E9%97%AE%E5%AE%9A%E4%BD%8D_%E5%8F%A5%E6%9F%84%E8%AE%BF%E9%97%AE.png",E="/img/%E5%AF%B9%E8%B1%A1%E7%9A%84%E8%AE%BF%E9%97%AE%E5%AE%9A%E4%BD%8D_%E7%9B%B4%E6%8E%A5%E6%8C%87%E9%92%88%E8%AE%BF%E9%97%AE.png",f={};function A(J,e){const a=p("RouteLink");return d(),r("div",null,[e[5]||(e[5]=t('<h2 id="jvm内存演进" tabindex="-1"><a class="header-anchor" href="#jvm内存演进"><span>JVM内存演进</span></a></h2><figure><img src="'+c+'" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>下图是JDK8的内存分布图，我们后续以JDK8的内存分布进行学习，更新的JDK也并没有太大的变化。</p><figure><img src="'+h+'" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><h2 id="程序计数器" tabindex="-1"><a class="header-anchor" href="#程序计数器"><span>程序计数器</span></a></h2><p>Program Counter Register，是当前线程所执行的字节码的行号指示器，字节码解释器通过改变该寄存器的值，来定位下一条将要执行的字节码指令。</p><p><strong>特点：</strong></p><ul><li>线程私有，各线程之间的计数器互不影响，独立存储</li><li>不会产生<code>OutOfMemoryError</code></li></ul><h2 id="虚拟机栈" tabindex="-1"><a class="header-anchor" href="#虚拟机栈"><span>虚拟机栈</span></a></h2><p>Java Virtual Machine Stacks，虚拟机栈描述的是线程中方法的内存模型，每执行一个方法，虚拟机栈中会同步创建一个栈帧，其中包括<code>局部变量表</code>、<code>操作数栈</code>、<code>动态连接</code>、<code>方法返回地址</code>和一些额外的<code>附加信息</code>。</p><p>一个方法的执行到结束，对应着一个栈帧在虚拟机中从入栈到出栈的过程，而栈顶即活动栈帧，对应着当前正在执行的方法。</p><p><strong>特点：</strong></p><ul><li>线程私有，随线程生灭</li><li>栈帧过多可能导致<code>StackOverflowError</code>，栈空间不足可能导致<code>OutOfMemoryError</code></li><li><code>-Xss size</code> 指定线程的最大栈空间</li></ul><h3 id="局部变量表" tabindex="-1"><a class="header-anchor" href="#局部变量表"><span>局部变量表</span></a></h3><p>存储方法里的基本数据类型以及对象的引用。</p><ul><li>容量以变量槽<code>Slot</code>为最小单位 <ul><li>除了<code>long double</code>需要2个Slot外，其余数据类型都需要1个Slot</li><li>Slot根据变量作用范围可复用</li></ul></li><li>JVM通过索引定位的方法使用局部变量表，范围从0开始至局部变量表最大的变量槽数量</li><li>JVM实现通过引用应完成两件事： <ul><li>根据引用直接或间接找到对象在Java堆种数据存放的起始地址或索引</li><li>根据引用直接或间接找到对象所属数据类型在方法区中存储的类型信息</li></ul></li><li>类字段有两次赋初始值的过程，一次是准备阶段赋系统初始值，另一次是初始化阶段赋程序定义初始值。但局部变量没有初始化就不能使用</li></ul><h3 id="动态链接" tabindex="-1"><a class="header-anchor" href="#动态链接"><span>动态链接</span></a></h3><p>指向运行时常量池的方法引用，每个栈帧都包含一个指向运行时常量池中该栈帧所属方法的引用，以便支持调用过程中的动态连接。</p><h3 id="方法返回地址" tabindex="-1"><a class="header-anchor" href="#方法返回地址"><span>方法返回地址</span></a></h3><p>方法正常退出或异常退出的地址，有两种退出方法执行的方式：</p><ul><li>正常调用完成，正常向主调函数提供返回值</li><li>异常调用完成，不会提供任何返回值</li></ul><h3 id="操作数栈" tabindex="-1"><a class="header-anchor" href="#操作数栈"><span>操作数栈</span></a></h3><ul><li>32位数据栈容量为1，64位栈容量为2</li><li>优化处理：两个不同的栈帧会出现一部分重叠，节约空间，且可以共享一部分数据</li></ul><h3 id="附加信息" tabindex="-1"><a class="header-anchor" href="#附加信息"><span>附加信息</span></a></h3><ul><li>JVM规范没有描述的信息，如调试、性能收集相关信息</li><li>一般把动态连接、方法返回地址以及其它附加信息全部归为栈帧信息</li></ul><h2 id="本地方法栈" tabindex="-1"><a class="header-anchor" href="#本地方法栈"><span>本地方法栈</span></a></h2><p>类似虚拟机栈，不过是为虚拟机使用到的 Native 方法服务 (如C, Cpp)，以支持 JNI 调用。同样的，栈帧过多可能导致<code>StackOverflowError</code>，栈空间不足导致可能导致<code>OutOfMemoryError</code>。在 Hotspot JVM 中，直接将本地方法栈和虚拟机栈合二为一。</p><h2 id="堆" tabindex="-1"><a class="header-anchor" href="#堆"><span>堆</span></a></h2><p>JVM 中最大的一块内存区，是垃圾回收器管理的主要区域，主要存放：</p><ul><li>对象实例：通过 new 关键字创建的对象</li><li>字符串常量池：存储 String 对象的直接引用</li><li>static 静态变量</li><li>线程分配缓冲区 TLAB（Thread Local Allocation Buffer）：为了提升内存分配效率，堆中线程私有的一块区域</li></ul><p><strong>特点：</strong></p><ul><li>线程共享，需要考虑线程安全问题</li><li>分配对象过大或过多可能产生<code>OutOfMemoryError</code></li><li>由垃圾收集器 GC 管理</li><li><code>-Xms size</code>指定堆初始内存，<code>-Xmx size</code>指定堆最大内存</li></ul><blockquote><p>栈是运行时的单位，解决程序的运行问题，即程序如何执行，如何处理数据。 堆是存储的单位，解决数据怎么放，放在哪的问题。</p></blockquote><h2 id="方法区" tabindex="-1"><a class="header-anchor" href="#方法区"><span>方法区</span></a></h2><p>按照 JVM 的规范，Method Area 方法区需要存储已被虚拟机加载的类信息、常量、静态变量、代码缓存等数据。而在实现上，JDK8 以前用永久代实现，但是为了能够加载更多的类同时改善 GC，现在改用位于本地内存的元空间作为方法区的实现，并且将<strong>静态变量和字符串常量池放入了堆</strong>中。</p><p><strong>方法区的永久代实现</strong><img src="'+g+'" alt="" loading="lazy"></p><p><strong>方法区的元空间实现</strong><img src="'+u+'" alt="" loading="lazy"></p><p>在类编译期间，会把类元信息放入方法区（元空间），包括类的方法、参数、接口，以及常量池表 Constant Pool Table。其中常量池表存储了编译期间生成的字面量（基本数据类型、字符串类型常量、声明为 final 的常量值等）、符号引用（类、字段、方法、接口等的符号引用），JVM 会为每个已加载的类维护一个常量池。</p><p>方法区中还有一个区域叫运行时常量池，在类加载-加载阶段，JVM 会把类的常量池数据放入运行时常量池；在类加载-解析阶段，会将池中的符号引用替换为直接引用。</p>',39)),l("blockquote",null,[l("p",null,[e[1]||(e[1]=i("除了在编译期生成的常量，运行时常量池还可以动态添加数据，例如 String 类的 intern() 方法可以主动将串池中的字符串对象引用放入运行时常量池。（字符串拼接见：")),n(a,{to:"/coding/Java_base.html#%E5%AD%97%E7%AC%A6%E4%B8%B2"},{default:s(()=>e[0]||(e[0]=[i("Java基础#字符串")])),_:1}),e[2]||(e[2]=i("）"))]),e[3]||(e[3]=l("ul",null,[l("li",null,"字符串变量拼接的原理是 StringBuilder"),l("li",null,"字符串常量拼接的原理是编译期优化")],-1)),e[4]||(e[4]=l("p",null,"类常量池和运行时常量池都在方法区中，而字符串常量池在堆中，且存储的是字符串对象的引用。",-1))]),e[6]||(e[6]=t('<p><strong>特点：</strong></p><ul><li>线程共享</li><li>类加载过多或常量过多可能产生<code>OutOfMemoryError</code></li><li>JDK8 后用<code>-XX:MetaspaceSize</code>和<code>-XX:MaxMetaspaceSize=sz</code>设置元空间大小</li></ul><h2 id="直接内存" tabindex="-1"><a class="header-anchor" href="#直接内存"><span>直接内存</span></a></h2><p>Direct Memory，不属于 JVM 运行时数据区，也不受 GC 管理，其分配回收成本较高，但读写性能很高，受物理内存的约束，超出物理内存将产生<code>OutOfMemoryError</code>。</p><p>直接内存由 Native 方法分配，例如 NIO 使用直接内存作为数据缓冲区，底层使用了 Unsafe 对象完成直接内存的分配与回收（内部使用 Cleaner 配合虚引用，自动调用 freeMemory 方法回收），大大提高了 IO 性能。</p><h2 id="虚拟机对象" tabindex="-1"><a class="header-anchor" href="#虚拟机对象"><span>虚拟机对象</span></a></h2><h3 id="对象创建" tabindex="-1"><a class="header-anchor" href="#对象创建"><span>对象创建</span></a></h3><p><strong>步骤：</strong></p><ol><li>遇到new指令时，首先检查该指令的参数是否能在常量池中定位到一个类的符号引用，并检查该符号引用代表的类是否已被加载、加载、解析和初始化，如果没有必须先执行相应类的加载过程</li><li>加载检查通过后，为新生对象分配内存</li><li>内存分配完成后，JVM将该内存空间初始化为0</li><li>JVM对对象进行必要设置，例如元类型信息、HashCode、GC分代年龄等(存储在对象头中)</li><li>JVM对象已产生，接着开始执行对象的构造方法 &lt;init&gt;()</li><li>这样一个真正可用的对象被完全构造出来</li></ol><p><strong>分配内存方法：</strong></p><ul><li>碰撞指针: 使用过的内存放一边，空闲的放另一边，中间用指针分隔。分配内存**就是移动指针。内存分配规整</li><li>空闲列表：维护可用内存块的记录表，分配内存时修改记录。内存分配不规整</li></ul><p><strong>解决并发：</strong></p><ul><li><code>CAS</code> 同步：Compare And Swap 保证更新的原子性</li><li><code>TLAB</code> 本地线程分配缓冲：线程私有的分配缓冲区</li></ul><h3 id="对象内存布局" tabindex="-1"><a class="header-anchor" href="#对象内存布局"><span>对象内存布局</span></a></h3><ul><li>对象头 <ul><li><code>Mark Word</code>: 存储对象自身的运行时数据，如HashCode、GC分代年龄、锁状态、偏向信息等</li><li><code>kClass Pointer</code>: 类型指针，对象指向它的类型元数据的指针</li></ul></li><li>实例数据：对象真正存储的有效信息 <ul><li>默认分配顺序：longs/doubles、ints、shorts/chars、bytes/booleans、oops(Ordinary Object Pointers)</li><li>相同宽度的字段会被分配在一起，除了oops，其他的长度由长到短</li><li>满足上述条件下，父类定义变量在子类变量之前</li><li><code>--XX:FieldsAllocationStyle</code> 控制变量分配策略</li><li><code>--XX:CompactFields</code> 控制是否允许较窄变量插入父类变量的间隙</li></ul></li><li>对齐填充：8Byte整数倍</li></ul><h3 id="对象访问定位" tabindex="-1"><a class="header-anchor" href="#对象访问定位"><span>对象访问定位</span></a></h3><ul><li><p>Java通过栈上的reference来操作堆上的具体对象，实现方式主要以下两种</p></li><li><p>句柄访问</p><ul><li>Java堆中划分一块内存作为句柄池，reference存储对象的句柄地址，句柄中包含对象实例数据和类型数据的具体地址</li><li>好处：reference存储的是稳定句柄，移动对象时不需要改变reference <img src="'+m+'" alt="对象的访问定位_句柄访问" loading="lazy"></li></ul></li><li><p>直接指针</p><ul><li>reference直接存储对象地址，但需要考虑如何存放类型数据的相关信息</li><li>好处：速度快，减少一次指针定位的时间开销 <img src="'+E+'" alt="对象的访问定位_直接指针访问" loading="lazy"></li></ul></li></ul>',17))])}const v=o(f,[["render",A],["__file","JVM-runtime-memory.html.vue"]]),b=JSON.parse('{"path":"/coding/JVM-runtime-memory.html","title":"JVM 运行时数据区","lang":"zh-CN","frontmatter":{"title":"JVM 运行时数据区","date":"2024-03-02T00:00:00.000Z","category":["Java"],"tag":["JVM"],"description":"JVM内存演进 下图是JDK8的内存分布图，我们后续以JDK8的内存分布进行学习，更新的JDK也并没有太大的变化。 程序计数器 Program Counter Register，是当前线程所执行的字节码的行号指示器，字节码解释器通过改变该寄存器的值，来定位下一条将要执行的字节码指令。 特点： 线程私有，各线程之间的计数器互不影响，独立存储 不会产生Ou...","head":[["meta",{"property":"og:url","content":"https://xchanper.github.io/coding/JVM-runtime-memory.html"}],["meta",{"property":"og:site_name","content":"chanper"}],["meta",{"property":"og:title","content":"JVM 运行时数据区"}],["meta",{"property":"og:description","content":"JVM内存演进 下图是JDK8的内存分布图，我们后续以JDK8的内存分布进行学习，更新的JDK也并没有太大的变化。 程序计数器 Program Counter Register，是当前线程所执行的字节码的行号指示器，字节码解释器通过改变该寄存器的值，来定位下一条将要执行的字节码指令。 特点： 线程私有，各线程之间的计数器互不影响，独立存储 不会产生Ou..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://xchanper.github.io/img/java内存演进.png"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-01-01T14:37:57.000Z"}],["meta",{"property":"article:tag","content":"JVM"}],["meta",{"property":"article:published_time","content":"2024-03-02T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2025-01-01T14:37:57.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"JVM 运行时数据区\\",\\"image\\":[\\"https://xchanper.github.io/img/java内存演进.png\\",\\"https://xchanper.github.io/img/JVM-Java8内存结构图.png\\",\\"https://xchanper.github.io/img/jdk6-methodarea.png\\",\\"https://xchanper.github.io/img/JDK8-methodarea.jpg\\",\\"https://xchanper.github.io/img/%E5%AF%B9%E8%B1%A1%E7%9A%84%E8%AE%BF%E9%97%AE%E5%AE%9A%E4%BD%8D_%E5%8F%A5%E6%9F%84%E8%AE%BF%E9%97%AE.png\\",\\"https://xchanper.github.io/img/%E5%AF%B9%E8%B1%A1%E7%9A%84%E8%AE%BF%E9%97%AE%E5%AE%9A%E4%BD%8D_%E7%9B%B4%E6%8E%A5%E6%8C%87%E9%92%88%E8%AE%BF%E9%97%AE.png\\"],\\"datePublished\\":\\"2024-03-02T00:00:00.000Z\\",\\"dateModified\\":\\"2025-01-01T14:37:57.000Z\\",\\"author\\":[]}"]]},"headers":[{"level":2,"title":"JVM内存演进","slug":"jvm内存演进","link":"#jvm内存演进","children":[]},{"level":2,"title":"程序计数器","slug":"程序计数器","link":"#程序计数器","children":[]},{"level":2,"title":"虚拟机栈","slug":"虚拟机栈","link":"#虚拟机栈","children":[{"level":3,"title":"局部变量表","slug":"局部变量表","link":"#局部变量表","children":[]},{"level":3,"title":"动态链接","slug":"动态链接","link":"#动态链接","children":[]},{"level":3,"title":"方法返回地址","slug":"方法返回地址","link":"#方法返回地址","children":[]},{"level":3,"title":"操作数栈","slug":"操作数栈","link":"#操作数栈","children":[]},{"level":3,"title":"附加信息","slug":"附加信息","link":"#附加信息","children":[]}]},{"level":2,"title":"本地方法栈","slug":"本地方法栈","link":"#本地方法栈","children":[]},{"level":2,"title":"堆","slug":"堆","link":"#堆","children":[]},{"level":2,"title":"方法区","slug":"方法区","link":"#方法区","children":[]},{"level":2,"title":"直接内存","slug":"直接内存","link":"#直接内存","children":[]},{"level":2,"title":"虚拟机对象","slug":"虚拟机对象","link":"#虚拟机对象","children":[{"level":3,"title":"对象创建","slug":"对象创建","link":"#对象创建","children":[]},{"level":3,"title":"对象内存布局","slug":"对象内存布局","link":"#对象内存布局","children":[]},{"level":3,"title":"对象访问定位","slug":"对象访问定位","link":"#对象访问定位","children":[]}]}],"git":{"createdTime":1735742277000,"updatedTime":1735742277000,"contributors":[{"name":"chanper","email":"qianchaosolo@gmail.com","commits":1}]},"filePathRelative":"coding/JVM-runtime-memory.md","localizedDate":"2024年3月2日","autoDesc":true}');export{v as comp,b as data};