---
title: MyBatis 深入学习
date: 2023-10-26
---
MyBatis 是一款优秀的持久层框架，它支持自定义 SQL、存储过程以及高级映射。MyBatis 免除了几乎所有的 JDBC 代码以及设置参数和获取结果集的工作。MyBatis 可以通过简单的 XML 或注解来配置和映射原始类型、接口和 Java POJO（Plain Old Java Objects，普通老式 Java 对象）为数据库中的记录。


## API 使用

### 依赖

```xml
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.13</version>
</dependency>

<!-- 整合 SpringBoot -->
<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>3.0.2</version>
</dependency>
```



### 配置

**1. mybatis-config.xml**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "https://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="com.mysql.cj.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://192.168.137.1:3306/mybatis"/>
        <property name="username" value="${username}"/>
        <property name="password" value="${password}"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="org/mybatis/example/BlogMapper.xml"/>
  </mappers>
</configuration>
```

如果整合 SpringBoot，也可以在 application.yml 中配置

```yml
spring:
    datasource:
        url: jdbc:mysql://192.168.137.1:3306/mybatis
        username: ${username}
        password: ${password}
        driver-class-name: com.mysql.cj.jdbc.Driver
mybatis:
    mapper-locations: classpath:com.chanper.mapper/*Mapper.xml
```


**2. UserMapper**

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
		PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
		"https://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.chanper.mapper.UserMapper">
    <select id="selectUserById" resultType="com.chanper.pojo.User">
      select * from tb_user where id = #{id}
    </select>
</mapper>
```

```java
// 添加 Mapper 注解自动注入 SpringBoot 容器
@Mapper
public interface UserMapper {
    User selectUserById(Integer id);
}
```


### 使用

```java
@Slf4j
public class Main {
    // 建议设为静态/单例，应用运行期间应一直存在
    private static SqlSessionFactory sqlSessionFactory;
    
    static {
        try {
            // 也可以用 Java API 构建 SqlSessionFactory，但并不推荐
            String resource = "com/chanper/mybatis-config.xml";
            InputStream inputStream = Resources.getResourceAsStream(resource);
            sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
        } catch (IOException e) {
            log.debug("MyBatis Resource Error...");
        }
    }
    
    public static void main(String[] args) throws IOException {
        // 从 SqlSessionFactory 获取 SqlSession，使用完应及时关闭（非线程安全）
        try (SqlSession session = sqlSessionFactory.openSession()){
            UserMapper mapper = session.getMapper(UserMapper.class);
            User user = mapper.selectUserById(1);
            log.debug("{}", user);
        }
    }
}
```


如果是 SpringBoot 方式：

```java
@SpringBootApplication
@Slf4j
public class MyBatisSpringApplication {
    
    public static void main(String[] args) {
        ConfigurableApplicationContext context = SpringApplication.run(MyBatisSpringApplication.class, args);
        UserMapper mapper = (UserMapper) context.getBean("userMapper");
        User user = mapper.selectUserById(2);
        log.debug("{}", user);
    }
}
```



### SqlSession

相比 JDBC，MyBatis 大幅简化了代码并保持简洁、易理解和易维护。SqlSession 是使用 MyBatis 的主要接口，包含了所有执行语句、提交或回滚事务以及获取映射器实例的方法。
- SqlSessionFactoryBuilder 基于 XML/注解/Java配置代码 => SqlSessionFacotry
- SqlSessionFactory 基于各种方法 => SqlSession
  - 支持事务/自动提交
  - 隔离级别
  - 连接配置
  - 执行器类型

---


SqlSession 提供的 API 方法可以分为以下六类。

#### 语句执行

用于执行定义在 SQL 映射 XML 文件中的 CRUD 语句，接受语句的 ID 和参数对象(可选)。

```java
<T> T selectOne(String statement, Object parameter)
<E> List<E> selectList(String statement, Object parameter)
<T> Cursor<T> selectCursor(String statement, Object parameter)
<K,V> Map<K,V> selectMap(String statement, Object parameter, String mapKey)
int insert(String statement, Object parameter)
int update(String statement, Object parameter)
int delete(String statement, Object parameter)
```

#### 映射器

`<T> T getMapper(Class<T> type)` 可以用于获取指定的 mapper，mapper 可以自动将接口方法名匹配到对应的语句 ID，相比上面的传递语句 ID 和参数来执行 SQL 的方式更加简洁高效，且符合类型安全。

另外高版本的 MyBatis 提供了一系列映射器的注解，例如 `@One`、`@Many`、`@Insert`等等，但并不实用，功能也不完善，就不学了吧...



#### 事务控制

四个用于控制事务作用域的方法，不过如果设置了 autocommit 或者使用外部事务管理器，比如 Spring-transaction，那么以下方法无效。

```java
void commit()
void commit(boolean force)
void rollback()
void rollback(boolean force)
```


#### 本地缓存

MyBatis 使用两种缓存：
- local cache：本地缓存，每个 session 对应一个，修改/提交/回滚/关闭时自动清空
- second level cache：二级缓存，每个 mapper 对应一个，多个 session 共享，默认是关闭的，见 [配置cache](#cache)

`void clearCache()` 可以用于清空本地缓存。


#### 刷写批量更新

当 Session 配置为 Executor.BATCH 时，执行器会批量执行所有更新语句。`List<BatchResult> flushStatements()` 方法可以刷新缓存立即执行。


#### 确保关闭

`void close()` 关闭 session，为了确保 Session 妥善关闭，建议使用 try-with-resource 语句。





### 动态 SQL

在 Java 代码中动态生成 SQL 代码确实是一场噩梦，MyBatis 提供了 SQL 类用于生成动态 SQL 语句，但这玩意是给人用的吗，代码和数据库耦合有点重吧，我为什么不用参数传递呢...

给个例子大家自己看看吧

```java
public String selectPersonSql() {
  return new SQL()
    .SELECT("P.ID", "A.USERNAME", "A.PASSWORD", "P.FULL_NAME", "D.DEPARTMENT_NAME", "C.COMPANY_NAME")
    .FROM("PERSON P", "ACCOUNT A")
    .INNER_JOIN("DEPARTMENT D on D.ID = P.DEPARTMENT_ID", "COMPANY C on D.COMPANY_ID = C.ID")
    .WHERE("P.ID = A.ID", "P.FULL_NAME like #{name}")
    .ORDER_BY("P.ID", "P.FULL_NAME")
    .toString();
}

public String insertPersonSql() {
  return new SQL()
    .INSERT_INTO("PERSON")
    .INTO_COLUMNS("ID", "FULL_NAME")
    .INTO_VALUES("#{id}", "#{fullName}")
    .toString();
}

public String updatePersonSql() {
  return new SQL()
    .UPDATE("PERSON")
    .SET("FULL_NAME = #{fullName}", "DATE_OF_BIRTH = #{dateOfBirth}")
    .WHERE("ID = #{id}")
    .toString();
}
```





## 配置文件


### 结构

![配置文件](/img/配置文件.svg)


### Properties

属性配置，可以实现 Mybatis 配置和数据库配置分离，提高实际生产中的安全性。

```xml
<properties resource="org/mybatis/example/config.properties" url="...">
	<property name="password" value="123456"/>
</properties>

<dataSource type="POOLED">
	...
	<property name="password" value="${password}"/>
</dataSource>
```

**属性优先级:**

1. 首先读取在 properties 元素体内指定的属性。
2. 然后根据 properties 元素中的 resource 属性读取类路径下属性文件，或根据 url 属性指定的路径读取属性文件，并覆盖之前读取过的同名属性。
3. 最后读取作为方法参数传递的属性，并覆盖之前读取过的同名属性。

```java
SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(reader, props);
```


### Settings

MyBatis 运行时行为的设置项，具体的设置名、含义、有效值、默认值见 [官方文档](https://mybatis.org/mybatis-3/zh/configuration.html#%E8%AE%BE%E7%BD%AE%EF%BC%88settings%EF%BC%89)

```xml
<settings>
	<!-- 允许 JDBC 支持自动生成主键 -->
	<setting name="useGeneratedKeys" value="false"/>
	<!-- 是否开启驼峰命名自动映射 -->
	<setting name="mapUnderscoreToCamelCase" value="false"/>
	...
</settings>
```



### typeAliases

```xml
<typeAliases>
	<typeAlias alias="Author" type="domain.blog.Author"/>
	<package name="domain.blog"/>
</typeAliases>
```

类型别名，可以为 Java 类型设置别名，避免书写冗余的全限定名。也可以指定包名，自动将 Java Bean 首字母小写的非限定类目作为它的别名，除非使用了 `@Alias` 注解指定了别名。

```java
@Alias("author")
public class Author {
    ...
}
```




### typeHandlers

MyBatis 在设置预处理语句（PreparedStatement）中的参数或从结果集中取出一个值时， 都会用类型处理器将获取到的值以某种方式转换成 Java 类型。例如：

- DateTypeHandler：JDBC 的 TIMESTAMP -> `java.util.Date`
- EnumOrdinalTypeHandler: JDBC 的 NUMERIC/DOUBLE -> Java 的枚举序号

也可以自己实现 `TypeHandler` 接口，或继承 `BaseTypeHandler` 来自定义类型处理器，以支持非标准类型的转换。

```xml
<typeHandlers>
	<!-- 指定处理的 Java 类型和关联的 JDBC 类型 -->
	<typeHandler handler="com.chanper.xxx" javaType="String" jdbcType="VARCHAR"/>
	<!-- 指定包查找类型处理器 -->
	<package name="com.chanper"/>
</typeHandlers>
```



### objectFactory


```xml
<objectFactory type="org.mybatis.example.ExampleObjectFactory">
  <property name="someProperty" value="100"/>
</objectFactory>
```

MyBatis 每次创建结果对象的新实例时，都会使用一个对象工厂（ObjectFactory）来完成实例化工作。对象工厂默认只是调用无参/有参构造方法来实例化目标类，当然也可以通过继承 `DefaultObjectFactory` 自定义实例化方式。

```java
public interface ObjectFactory {
    default void setProperties(Properties properties) {
    }

    <T> T create(Class<T> type);

    <T> T create(Class<T> type, List<Class<?>> constructorArgTypes, List<Object> constructorArgs);

    <T> boolean isCollection(Class<T> type);
}
```


### plugins

```xml
<plugins>
  <plugin interceptor="org.mybatis.example.ExamplePlugin">
    <property name="someProperty" value="100"/>
  </plugin>
</plugins>
```

MyBatis 允许拦截方法调用，执行额外的逻辑，可以实现 `Interceptor` 接口来创建插件。允许拦截的方法调用包括：
- Executor # update, query, flushStatements, commit, rollback, getTransaction, close, isClosed
- ParameterHandler # getParameterObject, setParameters
- ResultSetHandler # handleResultSets, handleOutputParameters
- StatementHandler # prepare, parameterize, batch, update, query

```java
@Intercepts({@Signature(
  type= Executor.class,
  method = "update",
  args = {MappedStatement.class,Object.class})})
public class ExamplePlugin implements Interceptor {
  private Properties properties = new Properties();

  @Override
  public Object intercept(Invocation invocation) throws Throwable {
    Object returnObject = invocation.proceed();
    return returnObject;
  }

  @Override
  public void setProperties(Properties properties) {
    this.properties = properties;
  }
}
```


### environments

MyBatis 支持创建多个运行环境，用于不同生产环境的配置。不过每个 SqlSessionFactory 只能选择一种环境，也就是说，想要连接多个数据库需要创建多个 SqlSessionFactory。

```xml
<!-- 配置环境，并指定默认环境 -->
<environments default="development">
	<!-- 指定环境 id -->
	<environment id="development">
		<transactionManager type="JDBC">
			<property name="..." value="..."/>
		</transactionManager>
		<dataSource type="POOLED">
			<property name="driver" value="${driver}"/>
			<property name="url" value="${url}"/>
			<property name="username" value="${username}"/>
			<property name="password" value="${password}"/>
		</dataSource>
	</environment>
</environments>
```

#### transactionManager

MyBatis 支持两种事务管理器：
- JDBC：直接使用了 JDBC 的提交和回滚功能，依赖于从数据源获得的连接来管理事务作用域。
- MANAGED：不对连接执行提交和回滚，而是交由容器来管理事务的生命周期。

如果应用使用 Spring 框架，那么不需要配置，Spring 会使用自带的事务管理器覆盖此配置。Spring 事务管理详解：https://xchanper.github.io/coding/SpringTransaction.html

#### dataSource

MyBatis 使用标准的 JDBC 数据源接口来配置连接对象的资源。有三种数据源类型：
- UNPOOLED：非池化，每次请求都打开、关闭一个新连接
- POOLED：使用数据库连接池，提高并发 Web 应用的响应速度
- JNDI：为了支持 EJB、应用服务器这类容器的外置数据源

通常只需要配置 driver 驱动器、url 链接、username DB用户名、password DB密码，以及一些连接池的参数就够用了。


### databaseIdProvider

MyBatis 可以根据不同的数据库厂商执行不同的语句，这种多厂商的支持是基于映射语句中的 databaseId 属性。


### mappers

告诉 MyBatis 去查找定义 SQL 映射语句的 mapper 文件，可以使用相对类路径的资源引用、完全限定资源定位符、类名、包名等。

```xml
<mappers>
	<!-- 资源引用  -->
	<mapper resource="com/chanper/mapper/UserMapper.xml"/>
	<!-- url -->
	<mapper url="file:///var/mappers/AuthorMapper.xml"/>
	<!-- 类名 -->
	<mapper class="org.mybatis.builder.AuthorMapper"/>
	<!-- 包名 -->
	<package name="org.mybatis.builder"/>
</mappers>
```


## Mapper

MyBatis 的 Mapper 映射器十分强大并且简洁，只有以下 8 个顶级元素：
1. insert 映射插入语句
2. update 映射更新语句
3. delete 映射删除语句
4. select 映射查询语句
5. sql 可被其它语句引用的可重用语句块
6. resultMap 描述如何从数据库结果集中加载对象
7. cache 该命名空间的缓存配置
8. cache-ref 引用其它命名空间的缓存配置

其实一般开发时也很少需要用到复杂的类型转换器，MyBatis 会自动获取结果中返回的列名，并在 Java 类中查找相同名字的属性(忽略大小写)做映射。


### CRUD

```xml
<!-- select -->
<select
	id="selectPerson"
	parameterType="int"
	parameterMap="deprecated"
	resultType="hashmap"
	resultMap="personResultMap"
	flushCache="false"
	useCache="true"
	timeout="10"
	fetchSize="256"
	statementType="PREPARED"
	resultSetType="FORWARD_ONLY">
	SELECT * FROM PERSON WHERE ID = #{id}
</select>


<!-- insert -->
<insert
	id="insertAuthor"
	parameterType="domain.blog.Author"
	flushCache="true"
	statementType="PREPARED"
	keyProperty="id"
	keyColumn=""
	useGeneratedKeys="true"
	timeout="20">
	insert into Author (id,username,password,email,bio)
	values (#{id},#{username},#{password},#{email},#{bio})
</insert>

<!-- update -->
<update
	id="updateAuthor"
	parameterType="domain.blog.Author"
	flushCache="true"
	statementType="PREPARED"
	timeout="20">
	update Author set
		username = #{username},
		password = #{password},
		email = #{email},
		bio = #{bio}
	where id = #{id}
</update>

<!-- delete -->
<delete
	id="deleteAuthor"
	parameterType="domain.blog.Author"
	flushCache="true"
	statementType="PREPARED"
	timeout="20">
	delete from Author where id = #{id}
</delete>
```

- userGeneratedKeys: 用于 insert/update，使用 DB 内部生成的主键，配合 keyProperty 指定主键字段。MyBatis 也支持用 selectKey 自定义生成主键策略。
- 语句的参数支持自动推断，支持自动查找对象的属性做映射
  `#{department, mode=OUT, jdbcType=CURSOR, javaType=ResultSet, resultMap=departmentResultMap}`
- `#{}`会在 PreparedStatement 中创建占位符，`${}`可以把参数作为字符串插入语句(存在SQL注入的风险)
  `@Select("select * from user where ${column} = #{value}")
User findByColumn(@Param("column") String column, @Param("value") String value);`
- StatementType 支持三种：STATEMENT 普通执行语句，PREPARED 可变参数SQL，CALLABLE 支持存储过程



### sql

定义可重用的 SQL 代码片段，支持动态变量，例如：

```xml
<sql id="userColumns"> ${alias}.id,${alias}.username,${alias}.password </sql>

<select id="selectUsers" resultType="map">
	select
		<include refid="userColumns"><property name="alias" value="t1"/></include>,
		<include refid="userColumns"><property name="alias" value="t2"/></include>
	from some_table t1
	cross join some_table t2
</select>
```


### resultMap

显式指定数据表列名的映射关系，是 Mapper 中最复杂也是最强大的元素。可以有如下的标签：
- id: 标记作为 id 的字段，有助于提高性能
- result: 字段注入到属性的映射
- constructor：结果实例化时注入到构造方法中的参数
- association：关联一个复杂类型的映射，可以是嵌套的select/resultMap
- collection：复杂类型映射的集合，可以是嵌套的select/resultMap
- discriminator+case：类似于 switch-case 语句的分支映射

```xml
<!-- 指定别名 -->
<typeAlias type="com.someapp.model.User" alias="User"/>

<!-- 显式指定列名映射 -->
<resultMap id="userResultMap" type="User">
    <id property="id" column="user_id" />
    <result property="username" column="user_name"/>
    <result property="password" column="hashed_password"/>
</resultMap>

<!-- 引用列名映射 -->
<select id="selectUsers" resultMap="userResultMap">
  select user_id, user_name, hashed_password
  from some_table
  where id = #{id}
</select>
```



### cache

MyBatis 默认情况下只启用本地的会话缓存，加入 `cache` 标签将启用全局的二级缓存，且只作用于标签所在的映射文件中的语句。另外，可以实现 `Cache` 自定义缓存实现，`cache-ref` 标签可以实现多个命名空间共享相同的缓存配置和实例。

```xml
<!-- 每隔 60s 刷新，大小为 512 个引用的 FIFO 只读缓存 -->
<cache
    eviction="FIFO"
    flushInterval="60000"
    size="512"
    readOnly="true"/>
```

- eviction：清除策略，可选 LRU 默认值、FIFO、SOFT 软引用、WEAK 弱引用
- flushInterval: 单位ms，默认不刷新，调用 insert/update/delete 时刷新




### 动态 SQL

根据条件动态拼接 SQL 语句是 MyBatis 的强大功能之一。


#### if

根据 if 标签里的 test 条件附加语句。

```xml
<select id="findActiveBlogLike" resultType="Blog">
    SELECT * FROM BLOG 
    WHERE state = 'ACTIVE'
    <if test="title != null">
        AND title like #{title}
    </if>
    <if test="author != null and author.name != null">
        AND author_name like #{author.name}
    </if>
</select>
```



#### choose

配合 when、otherwise 从多个条件中选择一个使用，类似 Java-switch 语句。

```xml
<select id="findActiveBlogLike" resultType="Blog">
    SELECT * FROM BLOG WHERE state = ‘ACTIVE’
    <choose>
    <when test="title != null">
        AND title like #{title}
    </when>
    <when test="author != null and author.name != null">
        AND author_name like #{author.name}
    </when>
    <otherwise>
        AND featured = 1
    </otherwise>
    </choose>
</select>
```


#### trim

上面的 if 语句如果第一个条件未命中，将产生一条无法执行的 SQL 语句，例如：

```sql
SELECT * FROM BLOG
WHERE
AND title like 'someTitle'
```

此时，我们可以在外层加入 where/trim/set 去除无效的关键字。

```xml
<!-- where -->
<select id="findActiveBlogLike" resultType="Blog">
    SELECT * FROM BLOG
    <where>
    <if test="state != null">
        state = #{state}
    </if>
    <if test="title != null">
        AND title like #{title}
    </if>
    </where>
</select>


<!-- where 等价于下面的 trim -->
<!-- 取出多余的 prefixOverrides 用 prefix 替换 -->
<trim prefix="WHERE" prefixOverrides="AND |OR ">
    ...
</trim>

<!-- set 等价于下面的 trim -->
<trim prefix="SET" suffixOverrides=",">
    ...
</trim>
```



#### foreach

foreach 能够很好的支持集合遍历，允许指定开头、结尾、分隔符等。其基本属性包括：
- item 迭代项
- index 索引变量，如果是 map 则为 key 值
- collection 集合对象

```xml
<select id="selectPostIn" resultType="domain.blog.Post">
    SELECT *
    FROM POST P
    <where>
    <foreach item="item" index="index" collection="list"
        open="ID in (" separator="," close=")", nullable="true">
            #{item}
    </foreach>
    </where>
</select>
```




## 源码分析


### 重要组件

![MyBatis层级结构](/img/MyBatis层级结构.png)

1. **Configuration**: MyBatis 的所有配置信息都维护在 Configuration 对象中
2. **SqlSource**：表示从 XML 文件或注释读取的映射语句，负责接收用户输入创建动态 SQL 语句封装到 BoundSql
3. **MappedStatement 和 BoundSql**：动态 SQL 的封装，以及相应的参数信息
4. **SqlSession**：MyBatis 核心接口，表示和数据库交互时的会话，完成必要的增删改查功能
5. **Executor**：执行器是 MyBatis 调度的核心，负责SQL语句的生成和查询缓存的维护
6. **StatementHandler**：封装了 JDBC Statement 操作
7. **ParameterHandler**: 负责把用户传递的参数转换成 JDBC Statement 所需要的参数
8. **ResultSetHandler**: 负责将 JDBC 返回的 ResultSet 结果集转换成 List 集合
9. **TypeHandler**: 用于 Java 类型和 JDBC 类型之间的转换



### 初始化

初始化的主要工作是解析![，关键逻辑包括：
1. 加载自定义的参数
2. 将 SQL 语句映射成 MappedStatement 对象，并关联接口方法和 SQL 语句
3. 构建成 Configuration 对象生成 SqlSessionFactory 实例


下面三行代码是通常的初始化执行语句，我们进入 build() 看看具体的加载逻辑。

```java
String resource = "com/chanper/mybatis-config.xml";
InputStream inputStream = Resources.getResourceAsStream(resource);
sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
```

build() 其实主要就执行了两步，加载 XMLConfigBuilder 并解析，具体的解析逻辑在 parse() 里：
```java
// SqlSessionFactoryBuilder#build
public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties) {
    XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
    return build(parser.parse());
}
```

在 parse() 解析逻辑里，MyBatis 逐个解析了配置文件里的标签，和前面的 [配置文件](#配置文件) 介绍的标签结构是一致的，最终目的是生成一个 Configuration 对象传入上面的 build() 用于创建 SqlSessionFactory。

```java
// XMLConfigBuilder#parse -> XMLConfigBuilder#parseConfiguration
private void parseConfiguration(XNode root) {
    propertiesElement(root.evalNode("properties"));
    Properties settings = settingsAsProperties(root.evalNode("settings"));
    loadCustomVfs(settings);
    loadCustomLogImpl(settings);
    typeAliasesElement(root.evalNode("typeAliases"));
    pluginElement(root.evalNode("plugins"));
    objectFactoryElement(root.evalNode("objectFactory"));
    objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
    reflectorFactoryElement(root.evalNode("reflectorFactory"));
    settingsElement(settings);
    environmentsElement(root.evalNode("environments"));
    databaseIdProviderElement(root.evalNode("databaseIdProvider"));
    typeHandlerElement(root.evalNode("typeHandlers"));
    mapperElement(root.evalNode("mappers"));
}
```


重点关注 mapperElement() 解析映射器的逻辑，多 mapper 和单 mapper 解析本质上一样：

- 如果指定了 resource/url 属性，则是进入`mapperParse.parse()`解析 mapper 对应的 xml 文件
  - 先对 xml 文件中的的每条 SQL 语句进行解析，得到若干个 MappedStatement 对象，存入 Configuration.mappedStatements 这个 Map 集合里，key 是全限定接口名+方法名构成的 id，value 是 MappedStatement 对象
  - xml 文件解析完成后，通过指定的 namespace 加载对应的 Mapper 接口，加入到 `Configuration.mapperRegistry.knownMappers` 这个 Map 集合中，key 是对应的 Mapper 接口对象，value 是生成的 MapperProxyFactory 代理工厂
- 如果指定的是 class 属性，那么和上面的顺序相反，先加载 Mapper 接口对象，再解析对应的 xml 文件

```java
private void mapperElement(XNode parent) throws Exception {
    if (parent != null) {
        for (XNode child : parent.getChildren()) {
            // 多 mapper 解析
            if ("package".equals(child.getName())) {
                String mapperPackage = child.getStringAttribute("name");
                configuration.addMappers(mapperPackage);
            } else {
                // 单 mapper 解析
                String resource = child.getStringAttribute("resource");
                String url = child.getStringAttribute("url");
                String mapperClass = child.getStringAttribute("class");
                // 根据 resource 属性加载 mapper
                if (resource != null && url == null && mapperClass == null) {
                    ErrorContext.instance().resource(resource);
                    try (InputStream inputStream = Resources.getResourceAsStream(resource)) {
                        XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, resource,
                            configuration.getSqlFragments());
                        mapperParser.parse();
                    }
                } else if (resource == null && url != null && mapperClass == null) {
                    // 根据 url 属性加载 mapper
                    ErrorContext.instance().resource(url);
                    try (InputStream inputStream = Resources.getUrlAsStream(url)) {
                        XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, url,
                            configuration.getSqlFragments());
                        mapperParser.parse();
                    }
                } else if (resource == null && url == null && mapperClass != null) {
                    // 根据 class 属性加载 mapper
                    Class<?> mapperInterface = Resources.classForName(mapperClass);
                    configuration.addMapper(mapperInterface);
                } else {
                    throw(...)
                }
            }
        }
    }
}
```

这样，就完成了 SQL 语句和 Mapper 接口地绑定关系。至此也完成了配置文件的解析工作，初始化完成得到一个 SqlSessionFactory 对象。




### 创建会话

创建完 SqlSessionFactory 之后，我们就可以创建 SqlSession 对象了，在 openSession() 方法里，从 Configuration 里拿到 Environment, TransactionFactory，然后根据配置的执行器类型创建 Executor，最后封装成 DefaultSqlSession 返回。

```java
SqlSession session = sqlSessionFactory.openSession();

// DefaultSqlSessionFactory#openSessionFromDataSource
private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
    Transaction tx = null;
    final Environment environment = configuration.getEnvironment();
    final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
    tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
    // 创建 Executor
    final Executor executor = configuration.newExecutor(tx, execType);
    return new DefaultSqlSession(configuration, executor, autoCommit);
}


// Configuration#newExecutor
public Executor newExecutor(Transaction transaction, ExecutorType executorType) {
    executorType = executorType == null ? defaultExecutorType : executorType;
    Executor executor;
    if (ExecutorType.BATCH == executorType) {
        executor = new BatchExecutor(this, transaction);
    } else if (ExecutorType.REUSE == executorType) {
        executor = new ReuseExecutor(this, transaction);
    } else {
        executor = new SimpleExecutor(this, transaction);
    }
    if (cacheEnabled) {
      executor = new CachingExecutor(executor);
    }
    return (Executor) interceptorChain.pluginAll(executor);
}
```


**三类 Executor：**
- **SimpleExecutor**：默认的简单执行器，每次执行 update/select 就开启一个 Statement，用完直接关闭
- **ReuseExecutor**：可重用执行器，内部 statementMap 缓存 SQL 语句对应的 Statement（Session作用域）
- **BatchExecutor**：批处理执行器，缓存了多个 Statement，批量输出到数据库

此外，还有个 CachingExecutor 可以根据可选配置，用装饰器模式包装原始 Executor 增加缓存功能。




### 获取 Mapper


接着就是从 `Configuration.mapperRegistry.knownMappers` 取出 Mapper 代理工厂，通过反射创建 Mapper 的代理对象 MapperProxy，也就是说，执行 Mapper 接口的任意方法，都是执行 MapperProxy 的 invoke 方法。

```java
UserMapper mapper = session.getMapper(UserMapper.class);

// DefaultSqlSession#getMapper
public <T> T getMapper(Class<T> type) {
    return configuration.getMapper(type, this);
}

// Configuration#getMapper
public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    return mapperRegistry.getMapper(type, sqlSession);
}

// MapperRegistry#getMapper
public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    final MapperProxyFactory<T> mapperProxyFactory = (MapperProxyFactory<T>) knownMappers.get(type);
    
    return mapperProxyFactory.newInstance(sqlSession);
}

```





### 执行 SQL

调用 MapperProxy#invoke 后，在 MapperProxy 里封装 MapperMethod 并执行 execute，根据 SQL 类型执行 SqlSession 的 select/selectList/selectCursor 方法，经过各种分支层层调用，然后根据 id 从 Configuration 中取出对应的 MappedStatement，查询缓存不存在后，最终来到 BaseExecutor#query -> queryFromDatabase -> doQuery。

在 doQuery() 里封装 StatementHandler，并调用 ParameterHandler 对参数进行映射，最终调用 JDBC Statement 的接口去真正地执行 SQL 语句。StatementHandler 有四个实现类：

- **RoutingStatementHandler**: 仅作为中间路由，根据 StatementType 创建下面三种实现的代理
- **SimpleStatementHandler**: 管理 Statement 对象并向数据库中推送不需要预编译的SQL语句
- **PreparedStatementHandler**: 管理 Statement 对象并向数据中推送需要预编译的SQL语句。
- **CallableStatementHandler**：管理 Statement 对象并调用数据库中的存储过程。


```java
UserMapper mapper = session.getMapper(UserMapper.class);
User user1 = mapper.selectUserById(1);


// SimpleExecutor#doQuery
public <E> List<E> doQuery(MappedStatement ms, Object parameter, RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) throws SQLException {
    Statement stmt = null;
    Configuration configuration = ms.getConfiguration();
    // 创建 StatementHandler
    StatementHandler handler = configuration.newStatementHandler(wrapper, ms, parameter, rowBounds, resultHandler, boundSql);
    // ParameterHandler 负责完成 SQL 语句的实参绑定
    stmt = prepareStatement(handler, ms.getStatementLog());
    // 调用 JDBC 执行 SQL
    return handler.query(stmt, resultHandler);
}

// PreparedStatementHandler#query
@Override
public <E> List<E> query(Statement statement, ResultHandler resultHandler) throws SQLException {
    PreparedStatement ps = (PreparedStatement) statement;
    ps.execute();
    // 结果集处理
    return resultSetHandler.handleResultSets(ps);
}
```

最后执行结果由 ResultSetHandler 封装成 List 集合返回，并放入缓存中，至此完成了查询 SQL 的执行。至于新增、删除、更新操作都是调用执行器的 doUpdate 方法，逻辑和查询很类似，可以自行分析源码。




## 其它模块

- Relection 反射模块
- TypeHandler 类型转换模块，负责 JDBC - Java 的类型转换
- TypeAliasRegistry 为Java类型注册别名
- LogFactory 日志适配接口
- Resources/ClassLoaderWrapper 资源加载模块
- PooledDataSource/PooledConnection 数据源、数据库连接实现
- Transaction 事务管理模块
- Cache 缓存模块
- Binding SQL 和 Mapper 的绑定模块





## 参考资料

1. https://mybatis.org/mybatis-3/zh/index.html 官网可以当作使用手册
2. https://zhuanlan.zhihu.com/p/97879019
3. https://cloud.tencent.com/developer/article/1598555
4. https://cloud.tencent.com/developer/article/1430026
5. https://juejin.cn/post/6983853041686577189
6. https://wch853.github.io/posts/  很详细的源码分析
