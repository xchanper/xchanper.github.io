---
title: 大数据 - Hadoop 概述
date: 2023-12-14
---
## 大数据

人类的行为及产生的事件的一种记录称之为数据，对数据的内容进行深入分析，可以更好的帮助了解事和物在现实世界的运行规律。**大数据**就是对超大规模的数据进行处理并挖掘出数据背后价值的技术体系，是信息化时代的基础支撑，以数据为生活赋能。

随着科技的发展，大数据技术已经成为从事数据分析、机器学习、人工智能等领域的重要工具。大数据技术涵盖了数据的采集、存储、处理、分析和可视化等方面，包括分布式存储系统（如Hadoop、Spark）、分布式计算框架、机器学习算法、数据挖掘工具等。大数据分析可以帮助企业和组织在海量数据中发现有价值的信息，做出更明智的决策。


### 5V 特性

大数据通常具有五个主要特点，即 5V：

1. **Volume 体积大：** 大数据集合通常包含海量的数据，这可能涉及到数十TB、PB、甚至EB级别的数据量，传统的数据库和数据处理工具难以有效地处理如此庞大的数据。

2. **Variety 种类多：** 大数据不仅包括结构化数据（如关系数据库中的表格数据），还包括非结构化数据（例如文本、图像、音频、视频等）和半结构化数据，这些不同类型的数据需要采用不同的处理方式。

3. **Value 价值密度低：** 大数据虽然信息海量，但是价值密度低，深度复杂的挖掘分析需要机器学习参与。

4. **Velocity 速度快：** 大数据集合的数据产生速度通常很快，需要实时或近实时地进行处理和分析。例如，社交媒体、传感器、日志文件等数据源都能够以很高的速度产生数据。

5. **Veracity 质量要求高：** 大数据需要确保数据的准确性、可依赖性。

总结下来，大数据就是**从海量的高增长、多类别、低信息密度的数据中挖掘出高质量的结果**。



### 生态体系

从大数据的特性出发，我们可以得到大数据的核心工作有三个：

1. **数据存储：** 妥善存储海量待处理数据
   - HDFS：大数据体系中使用最为广泛的分布式存储技术
   - HBase：基于 HDFS 之上，使用非常广泛的 NoSQL KV 型数据库技术
   - KUDU：使用较多的分布式存储引擎
   - 云平台存储引擎，如阿里云OSS、AWS-S3...

2. **数据计算：** 从海量数据中计算出背后的价值
   - MapReduce：最早一代的大数据分布式计算引擎，对大数据的发展做出了卓越的贡献
   - Hive：基于 MapReduce，以 SQL 为主要开发语言的分布式计算框架
   - Spark：目前全球范围内最火热的分布式内存计算引擎
   - Flink：也是广泛使用的分布式内存计算引擎，特别是在实时流计算领域占据了大多数的国内市场

3. **数据传输：** 协助在各个环节中完成海量数据的传输
   - Kafka：分布式的消息系统，可以完成海量规模的数据传输工作
   - Pulsar：同样是一款使用广泛的分布式消息系统
   - Flume：一款流式数据采集工具，可以从非常多的数据源中完成数据采集传输的任务
   - Sqoop：一款ETL（Extract, Transform, Load）工具，可以协助大数据体系和关系型数据库之间进行数据传输

![](/img/HADOOP-ECOSYSTEM-Edureka.png)




### Hadoop

[Hadoop](https://hadoop.apache.org/) 是 Apache 软件基金会在 2008 年开源的分布式数据存储、计算、资源调度为一体的大数据框架，提供了一种处理大规模数据集，并且可靠、可扩展的分布式计算解决方案，可以借助Hadoop构建大规模服务器集群，完成海量数据的存储和计算。Hadoop 已经成为大数据处理领域的事实标准之一，被广泛应用于企业和科研机构。

Hadoop 主要包括三个核心模块：

- **HDFS**：Hadoop Distributed File System 分布式文件系统，设计用于存储大规模数据集，具有高可靠性、高可用性、高容错性的特点。

- **MapReduce**：Hadoop 分布式计算框架，一种基于*分而治之*的思想，用于处理和生成大规模数据集的分布式计算框架。

- **YARN**：Yet Another Resource Negotiator 分布式内存资源调度组件，用于资源管理和作业调度，可供用户整体调度大规模集群的资源使用。


> Hadoop 的创始人是雅虎的 Doug Cutting，起源于 *Nutch* 这个全网搜索引擎项目，并借鉴了 Google 的三篇 paper：
> - [The Google file system](https://dl.acm.org/doi/pdf/10.1145/945445.945450)
> - [MapReduce: Simpliﬁed Data Processing on Large Clusters](https://dl.acm.org/doi/abs/10.1145/1327452.1327492)
> - [Bigtable: A Distributed Storage System for Structured Data](https://dl.acm.org/doi/abs/10.1145/1365815.1365816)
> ![](/img/Doug-Cutting.jpg)





## HDFS

在大数据时代，数据量是非常大的，传统的单机存储、单机计算无法满足性能需求，因此就需要分布式存储技术，通过增加机器数量来满足大规模数据存储和处理的需求，具有高可靠性、高扩展性、数据一致性、高性能的优点。

既然涉及了分布式，自然就有去中心化、中心化两种模式，在大数据框架中，大多数都是采用的中心化模式（主从模式），即有一个中心节点来统筹其它服务器的工作。HDFS（Hadoop Distributed File System）就是 Hadoop 技术栈内提供的基于主从的分布式数据存储解决方案，可以在多台服务器上构建存储集群，存储海量数据。


### 基础架构

HDFS 集群节点主要分为三个角色，分别都是一个独立的进程：
- NameNode：主角色，负责管理整个文件系统
- SecondaryNameNode：辅助角色，帮助 NameNode 完成元数据整理工作
- DataNode：从角色，负责数据的存取

![](/img/hdfs架构.png)


### 安装配置

安装过程略，hadoop 目录包括 bin 二进制程序，etc 配置文件，sbin 管理员程序等常规目录结构，主要配置文件包括：

- workers：配置从节点（DataNode）有哪些
- hadoop-env.sh：配置Hadoop的相关环境变量
- core-site.xml：Hadoop核心配置文件
- hdfs-site.xml：HDFS核心配置文件


安装完成后，可以通过`sbin/start-dfs.sh`和`sbin/stop-dfs.sh`统一启动/停止 HDFS 服务，脚本执行以下步骤：
1. 在执行此脚本的机器上，启动/停止 SecondaryNameNode
2. 读取core-site.xml内容（fs.defaultFS项），确认NameNode所在机器，启动/停止 NameNode
3. 读取workers内容，确认DataNode所在机器，启动/停止全部 DataNode

除了统一启停之外，也可以通过脚本单独控制所在机器的 HDFS 进程启停：

```bash
sbin/hadoop-daemon.sh start|status|stop namenode|secondarynamenode|datanode

bin/hdfs --daemon start|status|stop namenode|secondarynamenode|datanode
```


### 文件操作

![](/img/hdfs目录结构.png)

HDFS 里的文件路径和 Linux 系统一样，也是以 `/` 作为根目录，可以通过协议头进行区分。但是通常协议头是可以省略的，HDFS 会根据命令类型自动识别路径所指的文件系统，除非不写会有bug或者要强调所在文件系统才需要写明。

```bash
# Linux
file:///usr/local/hello.txt
# HDFS
hdfs://127.0.0.1:8020/usr/local/hello.txt
```


关于 HDFS 的操作命令，Hadoop 提供了两套命令系统，除了命令不同，选项参数完全一致。常用操作和 Linux 命令行也很像：

```bash
# 老版
hadoop fs [generic options]
# 新版
hdfs dfs [generic options]

#  创建目录，-p 自动创建父目录
hdfs dfs -mkdir [-p] <path>

# 查看目录内容，-h 人性化文件size，-R 递归查看子目录
hdfs dfs -ls [-h] [-R] <path>

# 查看文件内容。大文件可以用管道配合 more
hdfs dfs -cat <src> | more

# 从本地上传文件到 hdfs，-f 强制覆盖，-p 保留访问和修改时间、所有权和权限
hdfs dfs -put [-f] [-p] <localsrc> <dst>

# 从 hdfs 下载文件到本地，-f 强制覆盖，-p 保留访问和修改时间、所有权和权限
hdfs dfs -get [-f] [-p] <src> <localdst>

# 拷贝文件 (hdfs -> hdfs)，-f 强制覆盖
hdfs dfs -cp [-f] <src> <dst>

# 追加本地数据到 hdfs，如果 localsrc 为 - 则从标准输入读取
hdfs dfs --apendToFile <localsrc> <dst>

# 移动/重命名文件
hdfs dfs -mv <src> <dst>

# 删除文件，-r 递归删除，-skipTrash 跳过回收站
# 回收站功能默认是关闭的，需要针对每个节点单独配置
hdfs dfs -rm -r [-skipTrash] <path>

# 修改所属用户和组，-R 递归
hdfs dfs -chown -R root:root <path>
# 修改权限
hdfs dfs -chmod -R 777 <path>
```


> 1. HDFS 通过命令只能新增文件、追加数据，不能修改已有数据。想要修改已有数据只能强制覆盖已有的文件。
> 2. 除了通过 Shell 命令行方式和 HDFS 交互之外，还可以通过 HDFS 自带的 Web UI 操作文件内容，Jetbrains 系列产品中也有 Big Date Tools 插件可以更方便的操作，HDFS 也支持 NFS (Network File System) 实现本地挂载。
> 3. 关于 HDFS 文件的权限，不同于 Linux 系统的超级用户是 root，HDFS 的超级用户是启动 namenode 的用户，root 用户在 HDFS 上并没有特权。



### 存储原理

为了统一方便管理，HDFS 设定了统一的管理单元 block 作为最小存储单位，每个占 256MB（可配），并且通过多副本的方式提升了安全性，副本个数可以通过`dfs.replication`配置。

![](/img/hdfs文件存储.svg)

```bash
# file system check 查看文件信息，包括副本数
# -files 列出路径内的文件状态
# -blocks  输出文件块报告（block 数量，副本数）
# -locations 输出每个 block 详情
hdfs fsck [-files [-blocks [-locations]]]
```


在 HDFS 中，文件被划分成一个个 block 块，这些块由集群内的唯一 NameNode 基于`edits`和`fsimage`统一管理整个文件系统的。

![](/img/hdfs-namenode.svg)

edits 文件记录了 HDFS 中的每一次操作，以及本次操作影响的文件及其对应的 block，因此随着操作增多 edits 文件会逐渐变大，达到上限后会自动开启新的 edits 记录，保证索引性能。


![](/img/hdfs-edits.svg)


但是就跟 Redis 中的 AOF 文件一样，记录所有操作会导致文件检索变慢，因此需要定期（默认3600s/100w次事务）合并所有 edits 生成一个快照，即 fsimage 文件，如果已经存在 fsimage 文件了，那么会自动将所有 edits 和已有的 fsimage 进行合并形成新的 fsimage。

![](/img/hdfs-fsimage.svg)

而合并元数据这一操作是由辅助角色 SecondaryNameNode 完成的，它会通过 http 从 NameNode 拉取 edits 和 fsimage 进行合并，然后返回给 NameNode 来替换旧的 fsimage。

![](/img/hdfs-fsimage-roll.png)



### 读写过程

**数据写入**

1. 客户端向 NameNode 发起请求
2. NameNode 经过各种校验后允许写入，并告知客户端最近的 DataNode 地址
3. 客户端向指定的 DataNode 发送数据包
4. 该 DataNode 同时完成数据副本的复制工作，将其接收的数据分发给其它 DataNode
5. 写入完成后客户端通知 NameNode，NameNode做元数据记录工作

![](/img/hdfs-数据写入.png)



客户端直接向1台DataNode写数据，这个DataNode一般是离客户端最近（网络距离）的那一个
数据块副本的复制工作，由DataNode之间自行完成（构建一个PipLine，按顺序复制分发，如图1给2, 2给3和4）



**数据读取**

1. 客户端向 NameNode 申请读取某文件
2. NameNode 经过各种校验后允许读取，并返回此文件的 block 列表
3. 客户端拿到 block 列表后自行寻找 DataNode读取

![](/img/hdfs-数据读取.png)


**注意细节**

- NameNode 不负责实际的数据写入/读取，只负责元数据记录和权限校验，由客户端直连 DataNode 读写数据
- NameNode 会基于 IP 地址、路由表等提供网络距离最近的 DataNode 节点






## MapReduce

MapReduce 是 Hadoop 内提供的进行分布式计算的框架，可供开发人员开发相关程序进行分布式数据计算。所谓分布式计算，就是利用多台机器协同工作，完成对超大数据的计算处理，从计算模式上分为：
- **分散->汇总**: 每台机器各自负责一部分数据分片的处理，然后将各自结果汇总得到结果（MapReduce）
- **中心调度->步骤执行**: 由一个节点作为中心调度者，将任务划分为若干步骤分配给每台机器，最终得到结果（Spark、Flink）

MapReduce 是**分散->汇总**模式的分布式计算框架，其提供了两个主要的编程接口：
- **Map**：提供了分散功能，由服务器分布式对数据进行处理
- **Reduce**：提供了汇总功能，将分布式的处理结果汇总统计

原理类似 Java 的 Fork-Join 框架，只不过不是交给多线程执行，而是将需求分解为多个 MapTask 和 ReduceTask 并分配到不同的服务器去执行。用户只需要通过某种编程语言实现 Map/Reduce 功能接口即可完成自定义需求的开发，不过由于架构老，性能差，现在很少直接使用了，基本都用更高级的计算框架了，例如 Hive 等。





## YARN

YARN 是 Hadoop 内提供的进行分布式资源调度的组件，即管控整个分布式服务器集群的全部资源（内存、CPU等），整合进行统一调度，目的是提高资源的利用率。在集群模式下，MapReduce 需要配合 YARN 进行使用。

![](/img/hadoop-yarn调度.svg)

YARN 也是一种主从架构的设计：
- ResourceManager：整个集群的资源调度者，负责协调调度各个程序所需的资源
- NodeManager：单个服务器的资源调度者，基于容器调度资源，提供给应用程序使用

![](/img/hadoop-yarn架构.svg)


除了核心的主从管理者之外，YARN 还有 2 个辅助角色：
- ProxyServer：Web 应用程序代理，目的是减少通过 YARN 进行网络攻击的可能性
- JobHistoryServer：历史信息记录服务，统一收集各个节点的日志保存到 HDFS
  

配置安装过程省略，主要是配置四类角色，然后可以通过脚本启动集群：
```bash
# 根据配置文件一键启停 ResourceManager -> NodeManager -> ProxyServer
sbin/start-yarn.sh
sbin/stop-yarn.sh

# 当前机器单独启停服务
bin/yarn --daemon start|stop resourcemanager|nodemanager|proxyserver
bin/mapred --daemon start|stop historyserver
```





## Hive

大数据体系中充斥着非常多的统计分析场景，MapReduce 支持 Java、Python 这类编程语言去处理，但更方便的是用 SQL 进行数据统计，Hive 就是一款可以将 SQL 语句翻译成 MapReduce 程序运行的分布式计算工具。

![](/img/hadoop-hive介绍.png)

使用 Hive 的好处：
1. 操作接口采用类SQL语法，简单、容易上手，可以快速开发
2. 底层执行 MapReduce，可以完成分布式海量数据的 SQL 处理


### 基础架构

从原理上可以分析出，用 Hive 构建分布式 SQL 计算需要两大功能：
- 元数据管理：记录数据位置、数据结构、数据描述等信息
- SQL 解析器：执行 SQL 分析，转化为 MapReduce 程序，提交执行并收集结果

下面这张图是 Hive 的基础架构，主要的就是在实现这两大功能，具体的组件从左到右包括：

1. **用户接口**：向用户提供的操作接口
  - CLI
  - ThriftServer，例如用内置的 beeline 或 DataGrip、Navicat 等工具通过 JDBC/ODBC 协议进行通信
2. **Driver**：驱动程序，包括语法解析器、计划编译器、优化器、执行器
  - 完成对 HQL 语句的词法分析、语法分析、编译、优化，以及查询计划的生成（存储在 HDFS 中等待执行）
  - 没有具体的服务进程，封装在 Hive 所依赖的 Jar 中
3. **MetaStore**：元数据存储
  - 通常存储在关系数据库（如 mysql、derby）中
  - 元数据包括表名、字段、分区、属性，以及表的数据所在目录等
  - 由单独的服务进程维护

![](/img/hadoop-hive-architectrue.png)



### 安装配置

Hive 是单机程序，只需部署在一台机器上，但可以提交分布式 MapReduce 任务。同时 Hive 依赖一个关系型数据库系统存储元数据，而 HDFS 数据默认存储在`/user/hive/warehouse`内。

```bash
# 启动元数据管理服务
bin/hive --service metastore
nohup bin/hive --service metastore >> logs/metastore.log 2>&1 &

# 可选：启动 ThriftServer
bin/hive --service hiveserver2
nohup bin/hive --service hiveserver2 >> logs/hiveserver2.log 2>&1 &

# 启动客户端
bin/hive
```

安装过程略...




### 基本操作

执行`bin/hive`进入 HiveShell 后就可以执行输入 SQL 语句（语法不完全相同）执行。

```sql
-- 数据库
create database if not exists myhive;
use myhive;
desc myhive;
drop database myhive [cascade];

-- 数据表
create table test(id INT, name STRING, gender STRING) [location '/myhive2/'];
insert into test values(1, '王力红', '男'), (2, '周杰轮', '男');
alter table test set TBLPROPERTIES("EXTERNAL"="TRUE");  
select gender, COUNT(*) as cnt from test group by gender;
desc FORMATTED tb1;
drop table tablename;
truncate table tablename;


-- 从本地/HDFS导入数据
load data [local] inpath '<path>' [overwrite] into table myhive.test_load;
-- 导出数据到本地/HDFS
insert overwrite [local] directory '<path>' select * from test_load ;
-- hive 执行 SQL 导出
bin/hive (-e <sql> | -f <sql_file>) > '<path>'


-- 查询语句
SELECT [ALL | DISTINCT] col_xxx, ...
FROM tb_xxx
WHERE condition
-- 支持正则
RLIKE reg_pattern
GROUP BY col
HAVING condition
ORDER BY col
-- 分桶查询
CLUSTER BY col
-- 执行 MapReduce 时分配到不同 Reducer
DISTRIBUTE BY col
-- 排序
SORT BY col
LIMIT n;


-- 随机桶抽样
SELECT ... FROM tbl TABLESAMPLE(BUCKET x OUT OF y ON(colname | rand()))
-- 从前往后采样指定行数/百分比/大小
SELECT ... FROM tbl TABLESAMPLE(num ROWS | num PERCENT | num(K|M|G));
```


#### 复合字段

```sql
-- array 类型，item 间 , 分割
create table myhive.test_array(
    name string, 
    work_locations array<string>
)
row format delimited fields terminated by '\t'
collection items terminated by ',';

-- map 类型，entry 间 # 分割，KV 间 : 分割
create table myhive.test_map(
    id int, 
    members map<string,string>, age int
)
row format delimited fields terminated by ','
collection items terminated by '#' 
map keys terminated by ':';

-- struct 类型，一列中可以插入多个子列。字段间 # 分割，子列间 : 分割
create table myhive.test_struct(
    id string, 
    info struct<name:string, age:int>
)
row format delimited
fields terminated by '#'
collection items terminated by ':';
```


#### 表类型

**内部表**

- 即管理表/普通表，删除内部表会直接删除元数据，因此不适合与其它工具共享数据
- 存储位置由`hive.metastore.warehouse.dir`参数决定，默认`/user/hive/warehouse`
- 可以通过`alter table tb1 set tblproperties('EXTERNAL'='TRUE')`转为外部表


**外部表**

- 即关联表，通过`external`指定，删除表时仅删除元数据，不删除数据本身
- 外部表和数据是相互独立的，用于临时关联外部数据
- 存储位置随意，由`LOCATION`指定



**分区表**

基于分治的思想，根据**分区列**分区，分区列作为字段存储在 DB 里，但本质上是 HDFS 上的不同文件夹。分区表可以极大的提高特定场景下 Hive 的操作性能。

```sql
-- 创建分区表
create table tb1(...) partitioned by (分区列 列类型, ...) 
row format delimited fields terminated by '';

-- 导入数据
load data local inpath <path> into table tb1 partition(分区列=xxx, ...);
```

![](/img/hadoop-hive分区分桶.svg)


**分桶表**

将表拆分到固定数量的不同文件中进行存储，实际上是基于**分桶列**计算 Hash 取模决定分配到哪个桶。分桶表在过滤、JOIN、分组等特定操作下可以带来显著的性能提升。

```sql
-- 需要先开启分桶的自动优化
set hive.enforce.bucketing=true;

-- 创建分桶表
create table tb2(cid string, cname string) clustered by(c_id) into 3 buckets 
row format delimited fields terminated by '\t';

-- 导入数据，由于需要调用 MapReduce 执行哈希计算，所以只能通过 insert select 方式
insert overwrite table tb2 select * from tb_common cluster by(cid);
```


#### 虚拟列

Hive 内置三个特殊标记，用于查询数据本身的详细信息，称为虚拟列，可以像普通列一样被使用：

- `INPUT__FILE__NAME` 显示数据行所在的具体文件
- `BLOCK__OFFSET__INSIDE__FILE` 显示数据行所在文件的偏移量
- `ROW__OFFSET__INSIDE__BLOCK` 显示数据所在HDFS块的偏移量（需设置 hive.exec.rowoffset=true）



更多语句详情见 [Hive-SQL](Hive-SQL.md)