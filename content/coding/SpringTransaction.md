---
title: Spring 事务
date: 2023-07-16
---
## 事务基础

事务是逻辑上的一组操作，要么都执行，要么都不执行。典型场景是一个方法中包含多个insert，update，delete操作通过添加事务保证原子性，要么全部成功，要么全部失败。比如在往数据库里添加数据时，需要级联得添加若干数据，或者删除的时候级联得删除若干数据，都需要用事务的方式实现原子性操作；再比如针对多个表的查询统计，可以通过添加事务控制将统计时间拉奇到同一时间节点，保证数据的一致性。


### 四大特性 - ACID

- 原子性（Atomicity）：一个事务中的所有操作，或者全部完成，或者全部不完成，不会结束在中间某个环节。
- 一致性（Consistency）：在事务开始之前和结束以后，数据库的完整性没有被破坏，符合所有的预设约束、触发器、级联回滚等。
- 隔离性（Isolation）：数据库允许多个并发事务同时对数据进行读写，并且彼此之间互不干扰。
- 持久性（Durability）：一个事务被提交后，对数据库的修改就是永久的，即便系统故障也不会丢失。


### SQL 事务语句

```sql
-- 开启事务
begin
start transaction
set autocommit = 0

-- 回滚
rollback

-- 提交
commit
```

注：Spring 的事务归根到底还是执行了底层数据库的事务相关语句，因此使用Spring管理事务的前提是底层数据库支持事务。另外 MySQL 默认对每条单独的 SQL 语句都开启了事务。

### MySQL 实现事务

果想要保证事务的原子性，就需要在异常发生时，对已经执行的操作进行回滚，在 MySQL 中，事务回滚机制是通过**回滚日志（undo log）**实现的，所有事务进行的修改都会先记录到这个回滚日志中，然后再执行相关的操作。如果执行过程中遇到异常的话，直接利用回滚日志中的信息将数据回滚到修改之前的状态，并且回滚日志会先于数据持久化到磁盘上。这样就保证了即使遇到数据库突然宕机等情况，当用户再次启动数据库的时候，数据库还能够通过查询回滚日志来恢复之前未完成的事务。

### 隔离级别

- `Read_Uncommited`: 读未提交，允许读取并发事务尚未提交的数据。可能产生脏读、不可重复读、幻读等问题
- `Read_Commited`: 读已提交，允许读取并发事务已经提交的数据。可以阻止脏读
- `Repeatable_Read`: 可重复读（默认），对同一字段的多次读取结果都一致。可以阻止脏读、不可重复读问题
- `Serializable`: 可串行化，所有事务依次执行。可以阻止所有并发问题。

MySQL 默认采用的 REPEATABLE_READ 隔离级别，Oracle 默认采用的 READ_COMMITTED 隔离级别.



## Spring 事务使用方法

Spring 事务依赖集中在 spring-tx 这个jar包，通常的 ORM 框架都会直接引用 spring-tx，例如 mybatis-spring-boot-starter

### 编程式

即手动开启、提交、回滚事务

#### TransactionManager

- 注入一个 TransactionManger 事务管理器
- 调用 getTransaction() 方法，传入一个 TransactionDefinition（事务配置），就可以得到一个 TransactionStatus，里面封装了一个具体的事务对象（数据源+数据库连接+状态信息）。
- 然后借助 TransactionManger 就可以对这个具体的事务进行回滚、提交等等操作。

```java
@Autowired
private PlatformTransactionManager transactionManager;

@Test
public void testTransactionManager() {
    // 事务配置
    DefaultTransactionDefinition transactionDefinition = new DefaultTransactionDefinition();
    transactionDefinition.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
    transactionDefinition.setIsolationLevel(TransactionDefinition.ISOLATION_REPEATABLE_READ);
    
    // 创建事务
    TransactionStatus status = transactionManager.getTransaction(transactionDefinition);
    try {
        // 执行业务方法
    } catch (Exception e) {
        // 手动回滚
        transactionManager.rollback(status);
        throw e;
    }
    // 提交事务
    transactionManager.commit(status);
}
```

#### TransactionTemplate

spring-tx 还提供了一个更高级的封装 —— TransactionTemplate，提供了 execute 模版方法，开发人员只需要关注具体的业务逻辑和需要回滚的情况即可。

```java
@Autowired
TransactionTemplate transactionTemplate;

@Test
public void testTransactionTemplate() {
    // 手动设置事务配置
    transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
    transactionTemplate.setIsolationLevel(TransactionDefinition.ISOLATION_DEFAULT);

    transactionTemplate.execute(new TransactionCallbackWithoutResult() {
        @Override
        protected void doInTransactionWithoutResult(TransactionStatus status) {
            // 业务代码 ...
        }
    });
}

// 有返回值
public interface TransactionCallback<T> {
    @Nullable
    T doInTransaction(TransactionStatus status);
}

// 没有返回值
public abstract class TransactionCallbackWithoutResult implements TransactionCallback<Object> {
    public TransactionCallbackWithoutResult() {
    }

    @Nullable
    public final Object doInTransaction(TransactionStatus status) {
        this.doInTransactionWithoutResult(status);
        return null;
    }

    protected abstract void doInTransactionWithoutResult(TransactionStatus status);
}
```


### 声明式

编程式事务使用起来会比较麻烦，需要自动控制事务的不同阶段。而声明式事务管理只需要在代码中添加 @Transactional 注解，即可交由 Spring 自动进行事务管理，使用方便，代码简洁，是实际开发中的首选。
- 主启动类上 `@EnableTransactionManagement` 开启事务管理
- 需要开启事务的方法上加上 `@Transactional` 注解和需要的配置

```java
@Transactional(
    propagation = Propagation.REQUIRED, //传播模式
    isolation = Isolation.DEFAULT,      //隔离级别
    timeout = -1,                       //超时时间
    readOnly = false,                   //是否仅只读
    rollbackFor = BizException.class    //回滚规则
)
public void bizFunction() {
    // ....  业务代码
}
```

#### 传播行为

事务传播类型，指的是事务与事务之间的交互策略。比如在事务方法 A 中调用事务方法 B，方法B的事务策略如何处理？Spring 事务管理中定义了 7 种事务传播行为：

| Propagtion    | 外部有事务                     | 外部无事务       |
| ------------- | ------------------------------ | ---------------- |
| REQUIRED      | 加入该事务                     | 创建新事务       |
| REQUIRES_NEW  | 挂起当前事务，然后创建新事务   | 创建新事务       |
| NESTED        | 子方法加入到嵌套事务中执行     | 创建新事务       |
| MANDATORY     | 加入该事务                     | 抛出异常         |
| SUPPORTS      | 加入该事务                     | 以非事务方式运行 |
| NOT_SUPPORTED | 挂起当前事务，然后以非事务运行 | 以非事务方式运行 |
| NEVER         | 抛出异常                       | 以非事务方式运行 |

注：Required 和 Nested 区别在于，Required 加入外部事务是同层级的同一个事务，只要发生异常整个事务回滚；而 Nested 是在内部设置一个 savepoint 后开启一个子事务，和外部事务是父子关系，因此可以基于 savepoint 实现部分回滚的功能，即内部业务回滚，外部业务不回滚。。



## Spring 事务管理接口

- TransactionDefinition：事务定义信息(事务隔离级别、传播行为、超时、只读、回滚规则)。
- TransactionStatus：事务运行状态，还封装了一个实际的事务对象。
- TransactionManager：事务管理器，Spring 事务策略的核心管理器。


我们可以把 PlatformTransactionManager 接口可以被看作是事务上层的管理者，而 TransactionDefinition 和 TransactionStatus 这两个接口可以看作是事务的描述。PlatformTransactionManager 会根据 TransactionDefinition 的定义，比如事务超时时间、隔离级别、传播行为等来进行事务管理 ，而 TransactionStatus 接口则提供了一些方法来获取事务相应的状态，比如是否新事务、是否可以回滚等等。


### TransactionDefinition

TransactionDefinition 定义了事务的配置，包括传播行为、隔离级别、事务超时等等。我们通常用的是它的一个实现类 DefaultTransactionDefinition，里面新增了是否只读的属性，以及一些默认值的设置。

![TransactionDefinition](/img/TransactionDefinition.png)



### TransactionStatus

TransactionStatus 接口用来记录事务的状态，Spring事务管理器可以通过 TransactionStatus 对象来判断事务的状态，用来决定是否进行提交事务、回滚事务或者其他操作。需要注意的是，TransactionStatus表示的是逻辑事务的状态，即使它的 isNewTransaction() 返回值是true，但实际上数据库可能还没有创建物理事务。

```java
public interface TransactionStatus{
    boolean isNewTransaction(); // 是否是新的事务（Java层面的逻辑抽象）
    boolean hasSavepoint();     // 是否有保存点（嵌套事务）
    boolean isRollbackOnly();   // 是否为需要回滚
    boolean isCompleted;        // 是否已完成
}
```

通常我们使用的也是它的实现类 DefaultTransactionStatus，跟上面 DefaultTransactionDefinition 类似，新增了只读状态的判断。除此之外，还有两个新增的成员：
- suspendedResource：保存暂停的事务资源（Requires_New、Not_Supported）
- transaction：数据库事务的抽象对象，里面封装了实际的数据库连接
所以事务状态虽然名字叫 Status，但其实就可以把这个状态理解成一个具体的事务对象，同时对外暴露了一些事务的状态信息。

![TransactionStatus](/img/TransactionStatus.png)


### TransactionSynchronizationManager

TransactionSynchronizationManager 贯穿了事务管理的整个流程，它有两个功能：
- 绑定线程事务
  由于 JDBC 的 Connection 不是线程安全的，而事务操作必须使用同一个 Connection 对象进行操作，因此 Spring 通过 TransactionSynchronizationManager 这个事务同步管理器，基于 ThreadLocal 将 Connection 对象和线程绑定，保存当前线程的事务资源、事务名称、事务隔离级别等信息，来为不同的事务线程提供独立的资源副本（开启事务绑定，挂起/关闭事务解绑）
- 事务回调
  TransactionSynchronizationManager可以对当前线程的事务添加TransactionSynchronization回调，可以对事务管理的一些时间节点进行增强，如 beforeCommit/afterCommit/beforeCompletion/afterCompletion

```java
public abstract class TransactionSynchronizationManager {
    
    // 当前线程开启状态的所有数据库连接 Map
    // key是DataSource数据源对象
    // value是数据库连接ConnectionHolder
    private static final ThreadLocal<Map<Object, Object>> resources = new NamedThreadLocal<>("Transactional resources");

    // 事务同步器集合，可扩展的接口，定义了若干不同事物阶段的回调
    private static final ThreadLocal<Set<TransactionSynchronization>> synchronizations = new NamedThreadLocal<>("Transaction synchronizations");
}
```


### TransactionManager

#### PlatformTransactionManager

Spring 并不直接管理事务，而是提供了多种事务管理器。Spring 事务管理器的接口是：PlatformTransactionManager，继承自 TransactionManager 这个空的标记接口，其中定义了获取事务、提交事务、回滚事务3个基础方法。

```java
public interface PlatformTransactionManager extends TransactionManager {

    //获得事务
	TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException;
    //提交事务
	void commit(TransactionStatus status) throws TransactionException;
    //回滚事务
	void rollback(TransactionStatus status) throws TransactionException;

}
```

![TransactionManager](/img/TransactionManager.png)


#### AbstractPlatformTransactionManager

下面有一层抽象类 AbstractPlatformTransactionManager 实现了上述的3个基础方法，定义了Spring事务管理的工作流，但是具体功能实际上仍然是交给针对不同数据库的事务管理器的实现类去完成（模板方法）。

##### 开启事务

根据事务传播行为进行对应处理，开启事务，获得一个封装事务对象的事务状态。

```java
@Override
public final TransactionStatus getTransaction(@Nullable TransactionDefinition definition) throws TransactionException {

    // 是否使用默认事务配置
    TransactionDefinition def = (definition != null ? definition : TransactionDefinition.withDefaults());

    // 1. 获取当前线程绑定的事务，具体实现交给实现类
    Object transaction = doGetTransaction();
    boolean debugEnabled = logger.isDebugEnabled();

    // 2. 当前线程已存在事务，处理已有事务
    if (isExistingTransaction(transaction)) {
        return handleExistingTransaction(def, transaction, debugEnabled);
    }

    // 3. 当前不存在事务，根据事物传播行为分别处理
    // 3.1 Mandatory 抛异常
    if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_MANDATORY) {
        throw new IllegalTransactionStateException(
                "No existing transaction found for transaction marked with propagation 'mandatory'");
    }
    // 3.2 Required/Requires_New/Nested 新建事务
    else if (def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRED ||
            def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_REQUIRES_NEW ||
            def.getPropagationBehavior() == TransactionDefinition.PROPAGATION_NESTED) {
        // 暂停外层事物
        SuspendedResourcesHolder suspendedResources = suspend(null);
        if (debugEnabled) {
            logger.debug("Creating new transaction with name [" + def.getName() + "]: " + def);
        }
        try {
            // 开启新事务
            return startTransaction(def, transaction, debugEnabled, suspendedResources);
        }
        catch (RuntimeException | Error ex) {
            resume(null, suspendedResources);
            throw ex;
        }
    }
    // 3.3. 其它事务模式：创建携带空事务的事务状态
    else {
        if (def.getIsolationLevel() != TransactionDefinition.ISOLATION_DEFAULT && logger.isWarnEnabled()) {
            logger.warn("Custom isolation level specified but no actual transaction initiated; " +
                    "isolation level will effectively be ignored: " + def);
        }
        boolean newSynchronization = (getTransactionSynchronization() == SYNCHRONIZATION_ALWAYS);
        return prepareTransactionStatus(def, null, true, newSynchronization, debugEnabled, null);
    }
}
```

如果当前线程不存在事务，那么继续在 getTransaction() 方法里根据不同的事务传播模式进行处理：
- Mandatory：会抛出异常
- Required/Requires_New/Nested：会创建一个新事务
- Supports/Not_Supported/Never：返回一个携带空事务的事务状态，实际上不会创建新事务

如果当前线程已经存在事务了，那么进入 handleExistingTransaction() 方法根据不同的事务传播行为进行不同的处理流程：
- 内层事务-Never：会抛出异常。
- 内层事务-Not_Supported：会暂停外层事务（status-suspendedResource），开启新的空事物并返回（以非事务方式运行）
- 内层事务-Requires_New：会暂停外层事务（status-suspendedResource），开启新事物并返回
- 如果内层-Nested：
  - 判断数据库是否支持嵌套事务，如果不支持，抛出异常；
  - 如果支持，再判断是否支持保存点方式的嵌套事务，
    - 如果支持（数据源），创建保存点，然后开启嵌套事务并返回
    - 如果不支持（JTA），通过嵌套begin/commit/rollback语句的方式创建嵌套事务并返回
- 如果内层-Supports/Required/Mandatory：如果内层方法的事务隔离级别是ISOLATION_DEFAULT，并且外层方法的事务隔离级别与内层方法不一致，会抛出异常。如果内层方法不是只读，但外层方法是只读，会抛出异常。由于当前已存在事务，所以不用其他特殊处理。


##### 事务提交

commit()方法定义了提交事务/回滚事务的工作流：
```java
@Override
public final void commit(TransactionStatus status) throws TransactionException {
    // 1. 校验事务当前状态
    if (status.isCompleted()) {
        throw new IllegalTransactionStateException(
                "Transaction is already completed - do not call commit or rollback more than once per transaction");
    }

    DefaultTransactionStatus defStatus = (DefaultTransactionStatus) status;
    // 2. 根据rollbackOnly状态决定是否回滚
    if (defStatus.isLocalRollbackOnly()) {
        if (defStatus.isDebug()) {
            logger.debug("Transactional code has requested rollback");
        }
        processRollback(defStatus, false);
        return;
    }

    // 根据内部事务是否有异常决定是否回滚
    if (!shouldCommitOnGlobalRollbackOnly() && defStatus.isGlobalRollbackOnly()) {
        if (defStatus.isDebug()) {
            logger.debug("Global transaction is marked as rollback-only but transactional code requested commit");
        }
        processRollback(defStatus, true);
        return;
    }

    // 3. 提交事务
    processCommit(defStatus);
}
```

在 processCommit 里面：
- 如果是Nested嵌套事务，释放保存点
- 如果是独立的新事务，执行commit
- 否则的话，说明是外部事务的一部分，暂不执行提交，只是执行一些 TransactionSynchronization 回调工作

最后，执行一些状态修改和资源释放，而如果当前事务的外部还存在挂起的事务，那么会恢复挂起的事务。


##### 事务回滚

```java
@Override
public final void rollback(TransactionStatus status) throws TransactionException {
    if (status.isCompleted()) {
        throw new IllegalTransactionStateException(
                "Transaction is already completed - do not call commit or rollback more than once per transaction");
    }

    DefaultTransactionStatus defStatus = (DefaultTransactionStatus) status;
    processRollback(defStatus, false);
}
```

在 processRollback 里面：
- 如果是Nested嵌套事务，回滚到保存点
- 如果是独立的新事务，执行rollback
- 否则的话，说明外部还有事务，并且这时内部出现异常需要回滚了，所以这时会将数据库连接对象的 rollbackOnly 设为 true，然后执行一些 TransactionSynchronization 回调工作

同样最后，执行一些状态修改和资源释放，而如果当前事务的外部已经存在挂起的事务，那么会恢复挂起的事务。

#### DataSourceTransactionManager

DataSourceTransactionManager 是日常开发中使用的事务管理器，内部有一个 DataSource 对象，基于某个数据源定义具体的数据库事务操作。它的子类 JDBCTransactionManager 在它的基础上加了一些JDBC相关的异常处理。


## SpringTemplate 原理

SpringTemplate 的使用基于 SpringBoot 的自动配置机制。

### 容器注入

spring-boot-autoconfigure 是 SpringBoot 的核心，引入了很多基础的自动配置类，在 DataSourceTransactionManagerAutoConfiguration 里会注入 transactionManager 的 Bean 对象。

```java
@Bean  
@ConditionalOnMissingBean(TransactionManager.class)  
DataSourceTransactionManager transactionManager(Environment environment, DataSource dataSource,  
      ObjectProvider<TransactionManagerCustomizers> transactionManagerCustomizers) {  
   DataSourceTransactionManager transactionManager = createTransactionManager(environment, dataSource);  
   transactionManagerCustomizers.ifAvailable((customizers) -> customizers.customize(transactionManager));  
   return transactionManager;  
}

private DataSourceTransactionManager createTransactionManager(Environment environment, DataSource dataSource) {
    return (DataSourceTransactionManager)((Boolean)environment.getProperty("spring.dao.exceptiontranslation.enabled", Boolean.class, Boolean.TRUE) ? new JdbcTransactionManager(dataSource) : new DataSourceTransactionManager(dataSource));
}
```

在 TransactionAutoConfiguration 里会注入 transactionTemplate 的 bean 对象：
```java
@Bean  
@ConditionalOnMissingBean(TransactionOperations.class)  
public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {  
   return new TransactionTemplate(transactionManager);  
}
```

### 事务管理流程

从类的层级结构上，发现 TransactionTemplate 不仅封装了一个 TransactionManager，还继承了 TransactionDefinition，也就是说 TransactionTemplate 组合了事务管理器和事务配置的功能。

![TransactionTemplate](/img/TransactionTemplate.png)

TransactionTemplate 进行自动事务管理的核心在于 execute()，其内部会调用 transactionManager 进行获取事务、提交事务和回滚事务，获取事务的时候是把自己传进 TransactionManager。后续的流程就是基于上面介绍的 TransactionManager 的那一套机制了。

```java
public <T> T execute(TransactionCallback<T> action) throws TransactionException {  
   Assert.state(this.transactionManager != null, "No PlatformTransactionManager set");  
  
   if (this.transactionManager instanceof CallbackPreferringPlatformTransactionManager) {  
      // WebSphereUowTransactionManager事务管理流程
      return ((CallbackPreferringPlatformTransactionManager) this.transactionManager).execute(this, action);  
   }  
   else {  
      // 获取事务
      TransactionStatus status = this.transactionManager.getTransaction(this);  
      T result;  
      try {  
         // 执行业务方法
         result = action.doInTransaction(status);  
      }  
      // 回滚事务
      catch (RuntimeException | Error ex) {  
         rollbackOnException(status, ex);  
         throw ex;  
      }  
      catch (Throwable ex) {  
         // Transactional code threw unexpected exception -> rollback  
         rollbackOnException(status, ex);  
         throw new UndeclaredThrowableException(ex, "TransactionCallback threw undeclared checked exception");  
      }  
      // 提交事务
      this.transactionManager.commit(status);  
      return result;  
   }  
}
```

## @Transactional 原理

编程式事务的使用主要就是两步：开启 @EnableTransactionManagement 事务管理和 添加 @Transactional 注解，@Transactional 注解只是标记某个方法需要被事务管理以及管理的方式，关键还是在开启事务管理的注解上。


### TransactionalManagement

@EnableTransactionManagement 这个注解的作用就是引入 TransactionManagementConfigurationSelector 这个注入选择器。除此之外，有三个属性：
- 增强的模式（Proxy/AspectJ）
- 在 Proxy 通知模式下，代理的方式（JDK/CGLIB）
- 通知的优先级

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(TransactionManagementConfigurationSelector.class)
public @interface EnableTransactionManagement {

	boolean proxyTargetClass() default false;       // JDK/CGLIB，默认 JDK

	AdviceMode mode() default AdviceMode.PROXY;     // Proxy/AspectJ，默认 Proxy

	int order() default Ordered.LOWEST_PRECEDENCE;  // 通知的优先级，默认最低

}
```

SpringBoot 2.x 版本里 @EnableTransactionManagement 里面的 proxyTargetClass 属性配置无效，实际 AOP 方式取决于`spring.aop.proxy-target-class`配置 (见 AopAutoConfiguration)。

### ProxyCreator

而 TransactionManagementConfigurationSelector 这个 ImportSelector 的作用就是向容器中导入两个配置类，一个是 AutoProxyRegistrar 会导入负责自动代理的 InfrastructureAdvisorAutoProxyCreator，本身通过一层层的继承关系实现了 BeanPostProcessor，会在 Bean 创建完成后根据已有的 Advisor 对这个 Bean 做匹配，然后决定是否为这个 Bean 创建代理对象。

```java
public class TransactionManagementConfigurationSelector extends AdviceModeImportSelector<EnableTransactionManagement> {
	@Override
	protected String[] selectImports(AdviceMode adviceMode) {
		switch (adviceMode) {
			case PROXY:
				return new String[] {AutoProxyRegistrar.class.getName(),
						ProxyTransactionManagementConfiguration.class.getName()};
			case ASPECTJ:
				return new String[] {determineTransactionAspectClass()};
			default:
				return null;
		}
	}

	private String determineTransactionAspectClass() {
		return (ClassUtils.isPresent("javax.transaction.Transactional", getClass().getClassLoader()) ?
				TransactionManagementConfigUtils.JTA_TRANSACTION_ASPECT_CONFIGURATION_CLASS_NAME :
				TransactionManagementConfigUtils.TRANSACTION_ASPECT_CONFIGURATION_CLASS_NAME);
	}

}
```

### TransactionAdvisor

上面的 ImportSelector 还导入了一个配置类 ProxyTransactionManagementConfiguration，它的作用就是创建匹配 @Transactional 注解的 Advisor。
```java
@Configuration(proxyBeanMethods = false)  
@Role(BeanDefinition.ROLE_INFRASTRUCTURE)  
public class ProxyTransactionManagementConfiguration extends AbstractTransactionManagementConfiguration {

    // 注册Advisor
    @Bean(name = TransactionManagementConfigUtils.TRANSACTION_ADVISOR_BEAN_NAME)  
    public BeanFactoryTransactionAttributeSourceAdvisor transactionAdvisor(  
            TransactionAttributeSource transactionAttributeSource, TransactionInterceptor transactionInterceptor) {  
        BeanFactoryTransactionAttributeSourceAdvisor advisor = new BeanFactoryTransactionAttributeSourceAdvisor();  
        advisor.setTransactionAttributeSource(transactionAttributeSource);  
        advisor.setAdvice(transactionInterceptor);  
        if (this.enableTx != null) {  
            advisor.setOrder(this.enableTx.<Integer>getNumber("order"));  
        }  
        return advisor;  
    }
  
    // 切入点，引入 SpringTransactionAnnotationParser 事务注解的解析器
    @Bean   
    public TransactionAttributeSource transactionAttributeSource() {  
        return new AnnotationTransactionAttributeSource();  
    }  
  
    // 通知，事务拦截器
    @Bean  
    public TransactionInterceptor transactionInterceptor(TransactionAttributeSource transactionAttributeSource) {  
        TransactionInterceptor interceptor = new TransactionInterceptor();  
        interceptor.setTransactionAttributeSource(transactionAttributeSource);  
        if (this.txManager != null) {  
            interceptor.setTransactionManager(this.txManager);  
        }  
        return interceptor;  
    }  
}
```

在 AOP 里面，Advisor 就是切入点和通知的结合，在源码里也是这样设计的：
- 切入点 - TransactionAttributeSource
  
  引入 SpringTransactionAnnotationParser 负责解析 @Transantional。在 Bean 创建完成后，就会进行事务注解的解析，然后放入一个 Map 缓存中，key 是方法名，value 就是对应的事务属性，不需要事务管理就是 null。在判断是否需要创建代理类来管理事务，以及实际执行事务的时候都会从这个 Map 里面取出事务的属性做进一步的处理。

![TransactionAttributeSource](/img/TransactionAttributeSource.png)

- 通知 - TransactionInterceptor：事务拦截器，实现了 MethodInterceptor 接口，执行事务方法的时候就会走这里面的 invoke 方法，实际的事务管理都在这个invoke方法里

    事务拦截器的 invoke 方法就一条语句，调用 invokeWithinTransaction，这个方法是事务管理的具体实现，里面会尝试获取事务管理器，然后根据事务配置，开启事务，执行业务流程，然后提交、回滚等等一整套操作。内部类 TransactionInfo 类组合了 TransactionManager、TransactionDefinition、TransactionStatus 三个事务管理的关键类，所以最终还是回到了 TransactionManager 的那一套流程上去，只不过用代理拦截的方式在外面包了一层，实现了一行注解完成事务的自动化管理。

```java
// TransactionalInterceptor::invoke
public Object invoke(MethodInvocation invocation) throws Throwable {
   
   return invokeWithinTransaction(invocation.getMethod(), targetClass, new CoroutinesInvocationCallback() {     
      public Object proceedWithInvocation() throws Throwable {  return invocation.proceed();  }  
   });
}


// TransactionAspectSupport::invokeWithinTransaction
protected Object invokeWithinTransaction(Method method, @Nullable Class<?> targetClass,  
      final InvocationCallback invocation) throws Throwable {  
  
    // 获取事务属性源，就是 Advisor 里面 SpringTransactionAnnotationParser 解析的结果
    TransactionAttributeSource tas = getTransactionAttributeSource();  
    final TransactionAttribute txAttr = (tas != null ? tas.getTransactionAttribute(method, targetClass) : null);  
    
    // 获取事务管理器
    final TransactionManager tm = determineTransactionManager(txAttr);  
    
    // ReactiveTransactionManager
    if (this.reactiveAdapterRegistry != null && tm instanceof ReactiveTransactionManager) {  
        // 省略……
    }  
    
    // PlatformTransactionManager事务管理器执行流程
    PlatformTransactionManager ptm = asPlatformTransactionManager(tm);  
    final String joinpointIdentification = methodIdentification(method, targetClass, txAttr);  
    
    // DataSourceTransactionManager或JtaTransactionManager等事务管理器执行流程
    if (txAttr == null || !(ptm instanceof CallbackPreferringPlatformTransactionManager)) {  
        // 执行 TransactionManager::getTransaction 创建/加入事务
        // txInfo 封装了 TransactionManager、TransactionDefinition、TransactionStatus
        TransactionInfo txInfo = createTransactionIfNecessary(ptm, txAttr, joinpointIdentification);  
    
        Object retVal;  
        try {  
            // 反射执行业务方法
            retVal = invocation.proceedWithInvocation();  
        }  
        catch (Throwable ex) {  
            // 业务方法抛异常，执行回滚。TransactionManger::rollback
            completeTransactionAfterThrowing(txInfo, ex);  
            throw ex;  
        }  
        finally {  
            // 清理工作
            cleanupTransactionInfo(txInfo);  
        }  
    
        if (retVal != null && vavrPresent && VavrDelegate.isVavrTry(retVal)) {  
            // 函数式异常处理，省略……
        }  
    
        // 提交事务。TransactionManger::commit
        commitTransactionAfterReturning(txInfo);  
        return retVal;  
    }  
    
    // CallbackPreferringPlatformTransactionManager（WebSphereUowTransactionManager）事务管理器执行流程
    else {  
        // 省略……
    }  
}
```



### 总结

声明式事务是基于 Spring 的 AOP 机制实现的，Spring 容器初始化 Bean 的过程中，有一个 BeanPostProcessor 负责解析 @Transactional 注解和其中的事务属性，如果解析成功，将为这个 Bean 创建一个代理对象放入容器。在执行事务方法时，实际调用的是代理对象的方法，TransactionInterceptor 这个拦截器的 invoke()方法会对事务方法做增强，在目标方法前后增加开启事务、事务回滚、提交的逻辑。

无论是两种编程式事务，还是声明式事务，最后都归结于 TransactionManager、TransactionDefinition、TransactionStatus 三种核心类的配合使用。



## 事务失效

- 底层的数据库引擎必须支持事务机制
- 正确的设置 @Transactional 的 rollbackFor 和 propagation 属性
- 事务由Spring管理起来
  - 事务所在类要要被加载成 Bean 由 Spring 容器管理
  - @Transactional 注解的方法必须是public的，且非final，非static（AOP要重写方法）
- 声明式事务中不要用 try-catch 吞掉异常，要么处理完后继续向上抛出
- 抛出的异常必须是Unchecked Exception（RuntimeException/Error），Spring 事务默认不会对 Exception 回滚，如有需要用 rollbackFor 额外声明
- 避免同一个类中没有事务注解的方法调用有事务注解的方法（不走TransactionInterceptor）