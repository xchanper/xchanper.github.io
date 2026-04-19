---
title: Mock 测试
date: 2024-07-14
---
## 前言

**错误率恒定定律**：程序员的错误产出比是个常数

**规模代价平方定律**：定位并修复一个BUG所需的代价正比于目标代码规模的平方

错误率恒定定律告诉我们错误是不可避免的，而规模代价平方定律告诉我们要尽早发现错误。单元测试作为一个行之有效的工程实践，目的就是**尽早在尽量小的范围内暴露错误**。单元测试除了是一种测试手段外，更是一种改善代码设计的工具。

持续集成要求在提交代码前后都要执行自动化测试用例，且强调自动化测试要对被测软件提供快速且高质量的验证反馈，持续集成实践对自动化测试有四个基本要求：
- 快速，自动化测试用例的执行速度要快
- 便捷，每名工程师都能随时很方便地执行自动化测试用例，不需他人帮助也不会影响到他人
- 及时，一旦功能发生了改变，就能够通过自动化测试用例的运行，告知本次代码变更对软件质量的影响
- 可信，运行结果可信赖，不存在随机失败或成功

要切记：单元测试是最小粒度的测试，一般应该止步于类，不应存在读写数据库、远程调用、三方组件调用等。



## Mock测试

Mock通常针对设定好的调用方法与需要响应的参数封装模拟出合适的对象实例，或者模拟对象的使用，当对象提供非确定的结果、难以创建或重现、对象方法执行太慢等情况，都适合使用Mock测试。

### 引入依赖

Java常用的Mock测试包是Mockito。不过Mockito对于final、static、protected、private等方法的支持不够完善，可以使用增强版的PowerMock库。

```xml
<dependency>
      <groupId>org.mockito</groupId>
      <artifactId>mockito-core</artifactId>
      <version>${your version}</version>
      <scope>test</scope>
</dependency>
```

### 常用注解

- **@Mock**：基于Class创建一个模拟对象，并可以控制该对象的行为，以便在测试中替代真实的依赖。和Mockito.mock(class) 功能一样
  - Mock对象所有行为都不会执行实际代码
  - 没有指定模拟行为的方法，会返回返回类型的默认值，例如int返回0，String返回null
- **@Spy**：基于Class/Object创建间谍对象，默认执行所有真实逻辑，也可以指定模拟部分行为。和Mockito.spy(class)适合需要部分模拟，部分真实行为的测试对象。
  - Spy对象默认会执行所有方法的实际代码
- **@InjectMock**：加在实现类上，用于创建类的实例，并自动将@Mock/@Spy注解创建的模拟对象注入相应的字段

### 初始化

Java的Mock测试一般配合@RunWith(MockitoJUnitRunner.class)或者 MockitoAnnotations.initMocks()，自动初始化@Mock、@Spy、@Captor和@InjectMocks注解的字段。

```java
@RunWith(MockitoJUnitRunner.class)
public class SomeTest {

    @Mock
    private SomeDependency someDependency;
  
    // 手动初始化方式
    // @Before
    // public void setUp() {
    // 		MockitoAnnotations.initMocks(this);
    // }
}
```

### 打桩

#### 模拟返回

Junit的测试有自动隔离，所以Mock对象在一个测试方法中的打桩，并不会继承到另一个测试方法。

```java
@Mock
TestClass testClassMock;
// 等价于mock方法
// TestClass testClassMock = mock(TestClass.class);

@Test
public void testReturn() {
    when(testClassMock.getDataSize()).thenReturn(2); 							// 打桩 = 控制对象行为，模拟返回
    int size = testClassMock.getDataSize();
    Assert.assertEquals(2, size);

    when(testClassMock.getDataSize()).thenReturn(10, 20).thenReturn(20, 100); 				// 模拟多次调用返回
    Assert.assertEquals(10, testClassMock.getDataSize());
    Assert.assertEquals(20, testClassMock.getDataSize());

    when(testClassMock.getContent(0)).thenReturn("hello"); 		// 根据输入返回
    when(testClassMock.getContent(1)).thenReturn("world");
    String result = testClassMock.getContent(0) + " " + testClassMock.getContent(1);
    Assert.assertEquals("hello world", result);

    when(testClassMock.getContent(anyInt())).thenReturn("haha"); 	// 不依赖输入返回
    Assert.assertEquals("haha", testClassMock.getContent(2));
    Assert.assertEquals("haha", testClassMock.getContent(20));
}
```

#### 参数匹配

如果参数匹配既申明了精确匹配，也声明了模糊匹配；又或者同一个值的精确匹配出现了两次，使用时会匹配符合匹配条件的最新声明的匹配。

```java
// 精确匹配 0
when(testList.get(0)).thenReturn("a");
Assert.assertEquals("a", testList.get(0));

// 精确匹配 0
when(testList.get(0)).thenReturn("b");
Assert.assertEquals("b", testList.get(0));

// 模糊匹配
when(testList.get(anyInt())).thenReturn("c");
Assert.assertEquals("c", testList.get(0));
Assert.assertEquals("c", testList.get(1));
```

**匹配函数列表**

|    函数名           |   匹配类型 |
| -----------        | --------- |
| any()              | 所有对象类型 |
| anyInt()           | 基本类型 int、非 null 的 Integer 类型     |
| anyChar()          | 基本类型 char、非 null 的 Character 类型  |
| anyShort()         | 基本类型 short、非 null 的 Short 类型     |
| anyBoolean()       | 基本类型 boolean、非 null 的 Boolean 类型 |
| anyDouble()        | 基本类型 double、非 null 的 Double 类型   |
| anyFloat()         | 基本类型 float、非 null 的 Float 类型     |
| anyLong()          | 基本类型 long、非 null 的 Long 类型       |
| anyByte()          | 基本类型 byte、非 null 的 Byte 类型       |
| anyString()        | String 类型(不能是 null)                 |
| anyList()          | List 类型(不能是 null)                   |
| anyMap()           | Map 类型(不能是 null)                    |
| anyCollection()    | Collection 类型(不能是 null)             |
| anySet()           | Set 类型(不能是 null)                    |
| any(Class)         | type类型的对象(不能是 null)               |
| isNull()           | null                                   |
| notNull()          | 非 null                                 |
| isNotNull()        | 非 null                                 |


#### 模拟异常

```java
Random mockRandom = mock(Random.class);
// 可以指定多次抛出的异常，依次抛出。超出次数后，自动抛出最后一个异常
when(mockRandom.nextInt()).thenThrow(new RuntimeException("异常1"), new RuntimeException("异常2"));

try {
  	mockRandom.nextInt();
  	Assert.fail();
} catch (Exception ex) {
  	Assert.assertTrue(ex instanceof RuntimeException);
  	Assert.assertEquals("异常1", ex.getMessage());
}

try {
    mockRandom.nextInt();
    Assert.fail();
} catch (Exception ex) {
    Assert.assertTrue(ex instanceof RuntimeException);
    Assert.assertEquals("异常2", ex.getMessage());
}

// 如果方法返回值为空，使用 doThrow
doThrow(new RuntimeException("异常")).when(exampleService).hello();
```

#### 调用验证

```java
// 验证调用次数
@Test
public void verifyTimes() {
    TestClass mock = mock(TestClass.class);
    when(mock.getDataSize()).thenReturn(100);
    mock.getDataSize();
    mock.getDataSize();
    // 方法是否被调用2次
    verify(mock, times(2)).getDataSize();
    // 方法是否从未被使用
    verify(mock, never()).getContent(anyInt());
  	//会报错：never wanted but invoked
    verify(mock, never()).getDataSize(); 
    // 被调用至少1次
    verify(mock, atLeast(1)).getDataSize();
    // 被调用至多3次
    verify(mock, atMost(3)).getDataSize();

    mock.getContent(100);
    mock.getContent(200);
    mock.getContent(100);
    verify(mock, times(2)).getContent(100);
    verify(mock, atLeast(1)).getContent(200);
    verify(mock, times(3)).getContent(anyInt());
}

// 验证调用顺序
@Test
public void verifyOrder() {
    TestClass mock = mock(TestClass.class);
    mock.getContent(39);
    mock.getContent(80);
    InOrder inOrder = inOrder(mock);
  	// 如果取消注释，会报错verification in order failure
    // inOrder.verify(mock).getContent(80); 
    inOrder.verify(mock).getContent(39);
    inOrder.verify(mock).getContent(80);

    TestClass secondMock = mock(TestClass.class);
    mock.getContent(100);
    secondMock.getContent(200);
    InOrder inOrderOfMock = inOrder(mock, secondMock);
    inOrderOfMock.verify(mock).getContent(100);
    inOrderOfMock.verify(secondMock).getContent(200);
}
```

#### 参数捕获

```java
// 验证调用次数
@Test
public void verifyTimes() {
    TestClass mock = mock(TestClass.class);
    when(mock.getDataSize()).thenReturn(100);
    mock.getDataSize();
    mock.getDataSize();
    // 方法是否被调用2次
    verify(mock, times(2)).getDataSize();
    // 方法是否从未被使用
    verify(mock, never()).getContent(anyInt());
  	//会报错：never wanted but invoked
    verify(mock, never()).getDataSize(); 
    // 被调用至少1次
    verify(mock, atLeast(1)).getDataSize();
    // 被调用至多3次
    verify(mock, atMost(3)).getDataSize();

    mock.getContent(100);
    mock.getContent(200);
    mock.getContent(100);
    verify(mock, times(2)).getContent(100);
    verify(mock, atLeast(1)).getContent(200);
    verify(mock, times(3)).getContent(anyInt());
}

// 验证调用顺序
@Test
public void verifyOrder() {
    TestClass mock = mock(TestClass.class);
    mock.getContent(39);
    mock.getContent(80);
    InOrder inOrder = inOrder(mock);
    // 如果取消注释，会报错verification in order failure
    // inOrder.verify(mock).getContent(80); 
    inOrder.verify(mock).getContent(39);
    inOrder.verify(mock).getContent(80);

    TestClass secondMock = mock(TestClass.class);
    mock.getContent(100);
    secondMock.getContent(200);
    InOrder inOrderOfMock = inOrder(mock, secondMock);
    inOrderOfMock.verify(mock).getContent(100);
    inOrderOfMock.verify(secondMock).getContent(200);
}
```


## SpringBoot测试

Spring Test与JUnit等其他测试框架结合起来，提供了便捷高效的测试手段。而Spring Boot Test 是在Spring Test之上的再次封装，增加了切片测试，增强了mock能力。整体上，Spring Boot Test支持的测试种类，大致可以分为如下三类：
- 单元测试：一般面向方法，编写一般业务代码时，测试成本较大。涉及到的注解有@Test。
- 切片测试：一般面向难于测试的边界功能，介于单元测试和功能测试之间。涉及到的注解有@RunWith，@WebMvcTest等。
- 功能测试：一般面向某个完整的业务功能，同时也可以使用切面测试中的mock能力，推荐使用。涉及到的注解有@RunWith，@SpringBootTest等。

功能测试过程中的几个关键要素及支撑方式如下：
- 测试运行环境：通过@RunWith 和 @SpringBootTest启动spring容器。
- mock能力：Mockito提供了强大mock功能。例如@MockBean注解可以使得这个注解的 bean 替换掉 SpringBoot 管理的原生 bean
- 断言能力：AssertJ、Hamcrest、JsonPath提供了强大的断言能力。

### 引入依赖

增加spring-boot-starter-test依赖，使用@RunWith和@SpringBootTest注解，即可开始测试。

```java
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

一旦依赖了spring-boot-starter-test，以下类库将被一同依赖进去，包括JUnit、Spring Test & Spring Boot Test、AssertJ、Hamcrest、Mockito、JSONassert、JsonPath。

### 编写用例

SpringBoot测试可以在测试时启动Spring容器，更全面的测试功能集成。

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class SpringBootApplicationTests {

    @Autowired
    private UserService userService;

    @Test
    public void testAddUser() {
        User user = new User();
        user.setName("john");
        user.setAddress("earth");
        userService.add(user);
    }

}
```

> @RunWith是Junit4提供的注解，将Spring和Junit链接了起来。
> @SpringBootTest替代了spring-test中的@ContextConfiguration注解，目的是加载ApplicationContext，启动spring容器。