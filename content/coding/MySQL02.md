---
title: MySQL 深入原理
date: 2023-01-28
---
## 配置文件与变量
一般是安装目录或用户home目录下的`ini/cnf`文件，不同目录下的配置文件有优先级顺序，命令行中的参数优先级最高，多个组重复选项则后出现的优先级高。选项只能使用长形式。
```properties
# 配置文件分多个组，用于特定的命令程序。还可以指定用于特定版本
[mysqld]
option1
option2 = val

# 但server组用于所有服务器程序，client组用于所有客户端程序
[server]
...
[client]
...
```

配置文件中大多数选项对应了MySQL中的某个系统变量，系统变量分为`Global`和`Session`两个作用域。
```sql
- 查看系统变量, 默认session
show global|session variable like "defualt%";

- 设置系统变量，默认session
set [@@]global|session default_storage_engine = xxx;
```

此外，运行时MySQL还包括上百个状态变量，也分`Global`和`Session`两个作用域。
```sql
- 查看状态变量，默认session
show global|session status like "thread%";
```


## 通信流程
MySQL客户端向服务器进程发送请求并得到回复的过程本质上是一个进程间通信的过程，MySQL支持三种客户端进程和服务器进程的通信方式：
- **TCP/IP**: 通过网络协议进行通讯，客户端启动时用`-h 指定主机 -P 指定端口`
- **命名管道和共享内存**: 对于Windows用户，可以使用`--enabled-named-pipe/--protocol=pipe 或 --shared-memory/--protocol=memory`参数开启
- **Unix域套接字**: 对于类Unix系统，如果指定主机为`localhost`或者使用`--protocol=socket`参数，可以利用套接字通信


MySQL服务器处理客户端请求的流程：

![MySQL服务器处理客户端请求](/img/MySQL服务器处理客户端请求.jpg)

- 连接管理：客户端进程采用上述的三种通信方式来与服务器进程建立连接。每个连接分配一个单独的线程处理，因此会用到连接池、线程复用等技术。
- 解析与优化：
  - 查询缓存：完全一样的语句才会缓存，但需要额外的缓存维护开销。MySQL 8中已废弃。
  - 语法解析：词法解析、语法分析、语义分析等等
  - 查询优化：优化生成执行计划，可以用`explain 语句`查看某个语句的执行计划
- [存储引擎](#-存储引擎)：提供真实存取数据的功能，各种不同的存储引擎向上面的MySQL Server层提供统一的调用接口，包含十几个底层函数。


## 数据目录
InnoDB, MyISAM等存储引擎本质上把表数据存储在OS的文件系统上，读写时需要与文件系统进行交互。
- MySQL的数据目录通过变量`datadir`定义
- 每创建一个数据库，数据目录下就会新建一个同名的子目录
- InnoDB引擎中，每创建一个表，该db的子目录下就会新建一个`表名.idb`文件（默认独立表空间`innodb_file_per_table`）
- MyISAM引擎中，每创建一个表，生成`表名.frm`格式文件，`表名.MYD`数据文件，`表名.MYI`索引文件。
- 其它文件包括服务器进程文件、服务器日志文件、证书密钥等
- OS的文件系统影响库名/表名的长度、文件大小、特殊字符处理等等

系统数据库：
| 数据库 | 含义 |
|---|---|
| mysql  | 核心数据库，存储MySQL服务器正常运行所需要的各种信息，包括时区、主从、用户、权限等|
| information_schema | 提供了访问数据库元数据的各种表和视图，包含数据库、表、字段类型及访问权限等 |
| performance_schema | 为MySQL服务器运行时状态提供了一个底层监控功能，主要用于收集数据库服务器性能参数 |
| sys | 包含了一系列方便 DBA 和开发人员利用 performance_schema性能数据库进行性能调优和诊断的视图 |


## 字符集和比较规则
MySQL共支持40多种字符集，查看支持的字符集的命令：
`show [character set | charset];`
其中：
- utf8: 在MySQL中指阉割过的`utf8mb3`字符集，长度1~3个字节
- utf8mb4: 正宗UTF8字符集，长度1~4个字节

每个字符集有若干种比较规则，且有一个默认的规则，查看比较规则的命令：
`show collation;`
例如，utf8mb3默认比较规则是`utf8mb3_general_ci`，表示针对通用语言且不区分大小写的规则。

MySQL中有四个等级的字符集和比较规则：
- 服务器级别：`character_set_server, collation_server`
- 数据库级别：`character_set_database, collation_database`
- 表级别：`create ... character set utf8mb4 collate utf8_general_ci;`
- 列级别：`column type character set utf8mb4 collate utf8_general_ci`
如果没有指定，则会自底向上确定默认的字符集和比较规则。

服务器处理请求时可能发生多次字符集转换：
- 解码请求时使用`character_set_client`字符集
- 处理请求时将转码为`character_set_connection`字符集
- 处理过程中如果与字段的字符集不一致也会进行额外的转码
- 返回结果时转换为`character_set_results`字符集

## 系统工具
- mysql
  mysql客户端工具
  ```bash
  语法 ：
    mysql [options] [database]
  选项 ：
    -u, --user=name       #指定用户名
    -p, --password[=name] #指定密码
    -h, --host=name       #指定服务器IP或域名
    -P, --port=port       #指定连接端口
    -e, --execute=name    #执行SQL语句并退出。方便执行批处理脚本
  示例：
    mysql -uroot –p123456 study -e "select * from tb_sku";
  ```

- mysqladmin
  执行管理操作的客户端程序。可以用它来检查服务器的配置和当前状态、创建并删除数据库等。
  ```bash
  语法:
    mysqladmin [options] command ...
  选项:
    -u, --user=name       #指定用户名
    -p, --password[=name] #指定密码
    -h, --host=name       #指定服务器IP或域名
    -P, --port=port       #指定连接端口
  示例：
    mysqladmin -uroot –p1234 drop 'test01';
  ```

- mysqlbinlog
  服务器生成的日志文件以二进制格式保存，需用mysqlbinlog查看这些文本
  ```bash
  语法 ：
    mysqlbinlog [options] log-files1 log-files2 ...
  选项 ：
    -d, --database=name   #指定数据库名称，只列出指定的数据库相关操作。
    -o, --offset=n        #忽略掉日志中的前n行命令。
    -r,--result-file=name #将输出的文本格式日志输出到指定文件。
    -s, --short-form      #显示简单格式， 省略掉一些信息。
    --start-datatime=date1 --stop-datetime=date2  #指定日期间隔内的所有日志。
    --start-position=pos1 --stop-position=pos2    #指定位置间隔内的所有日志。
  示例：
    mysqlbinlog -s binlog.00008
  ```

- mysqlshow
  客户端对象查找工具，用来很快地查找存在哪些数据库、数据库中的表、表中的列或者索引。
  ```bash
  语法 ：
    mysqlshow [options] [db_name [table_name [col_name]]]
  选项 ：
    --count   #显示数据库及表的统计信息（数据库，表 均可以不指定）
    -i        #显示指定数据库或者指定表的状态信息
  示例：
    #查询test库中book表的详细情况
    mysqlshow -uroot -p2143 test book --count
  ```

- mysqldump
  用来备份数据库或在不同数据库之间进行数据迁移。备份内容包含创建表，及插入表的SQL语句。
  ```bash
  语法 ：
    mysqldump [options] db_name [tables]
    mysqldump [options] --database/-B db1 [db2 db3...]
    mysqldump [options] --all-databases/-A
  连接选项 ：
    -u, --user=name         #指定用户名
    -p, --password[=name]   #指定密码
    -h, --host=name         #指定服务器ip或域名
    -P, --port=p            #指定连接端口
  输出选项：
    --add-drop-database     #在每个数据库创建语句前加上 drop database 语句
    --add-drop-table        #在每个表创建语句前加上 drop table 语句 , 默认开启 ; 不开启 (--skip-add-drop-table)
    -n, --no-create-db      #不包含数据库的创建语句
    -t, --no-create-info    #不包含数据表的创建语句
    -d, --no-data           #不包含数据
    -T, --tab=name          #自动生成两个文件：一个.sql文件，创建表结构的语句；一个.txt文件，数据文件
  示例：
    mysqldump -uroot -p1234 -T D:/ db01 tb_score
  ```

- mysqlimport / source
  客户端数据导入工具，用来导入mysqldump 加 -T 参数后导出的文本文件。如果需要导入sql文件,可以使用mysql中的source 指令
  ```bash
  语法：
    mysqlimport [options] db_name textfile1 [textfile2...]
    source /root/xxxxx.sql
  示例：
    mysqlimport -uroot -p2143 test /tmp/city.txt
  ```


## 存储引擎

### MySQL三大存储引擎

存储引擎就是存储数据、建立索引、更新/查询数据等技术的实现方式。存储引擎基于表而非基于库，因此也被称为表引擎。

相关语法：
```sql
-- 查询建表语句
show create table account;
-- 建表时指定存储引擎
CREATE TABLE 表名(
	...
) ENGINE=INNODB;
-- 查看当前数据库支持的存储引擎
show engines;
```

![MySQL引擎列表](/img/MySQL引擎列表.png)


#### InnoDB
> InnoDB是一种兼顾高可靠性和高性能的通用存储引擎，在MySQL 5.5之后，InnoDB是默认的MySQL引擎。  

特点:
- DML 操作遵循 ACID 模型，支持**事务**
- **行级锁**，提高并发访问性能
- 支持**外键**约束，保证数据的完整性和正确性

文件：
- 表名.ibd: InnoDB引擎的每张表都会对应这样一个独立表空间文件，存储该表的表结构、数据和索引
- innodb_file_per_table 参数决定多张表共用一个系统表空间还是每张表独立表空间
  `show variables like 'innodb_file_per_table';`
  从idb文件提取表结构数据的工具：
  `ibd2sdi xxx.ibd`

#### MyISAM
> MyISAM 是 MySQL 早期的默认存储引擎。

特点：
- 不支持事务，不支持外键
- 支持表锁，不支持行锁
- 访问速度快

文件：
- xxx.frm: 存储表结构信息
- xxx.MYD: 存储数据
- xxx.MYI: 存储索引

#### Memory
> Memory 引擎的表数据存储在内存中，受硬件、断电等问题的影响，因此只能将这些表作为临时表或缓存使用。缓存场景更多使用Redis。

特点：
- 存放在内存中，速度快
- 默认hash索引

文件：
- xxx.frm: 存储表结构信息


### 存储引擎特点

| 特点  | InnoDB  | MyISAM  | Memory  |
| :---------: | :----------: | :-----------: | :----------: |
| 存储限制     | 64TB  | 有  | 有  |
| 事务安全     | 支持  | -  | -  |
| 锁机制       | 行锁  | 表锁  | 表锁  |
| B+tree索引   | 支持  | 支持  | 支持  |
| Hash索引     | -     | -  | 支持  |
| 全文索引     | 支持（5.6版本之后）  | 支持  | -  |
| 空间使用     | 高    | 低  | N/A  |
| 内存使用     | 高    | 低  | 中等  |
| 批量插入速度 | 低    | 高  | 高  |
| 支持外键     | 支持  | -   | -  |
  
总结InnoDB和MyISAM的区别：
- InnoDB支持事务, 而MyISAM不支持
- InnoDB支持行锁和表锁, 而MyISAM仅支持表锁, 不支持行锁
- InnoDB支持外键, 而MyISAM不支持


### 存储引擎选择
- InnoDB
  如果应用对事物的完整性有比较高的要求，在并发条件下要求数据的一致性，数据操作除了插入和查询之外，还包含很多的更新、删除操作，则 InnoDB 是比较合适的选择
- MyISAM
  如果应用是以读操作和插入操作为主，只有很少的更新和删除操作，并且对事务的完整性、并发性要求不高，那这个存储引擎是非常合适的
- Memory
  将所有数据保存在内存中，访问速度快，通常用于临时表及缓存。Memory 的缺陷是对表的大小有限制，太大的表无法缓存在内存中，而且无法保障数据的安全性

>在选择存储引擎时，应该根据应用系统的特点选择合适的存储引擎。对于复杂的应用系统，还可以根据实际情况选择多种存储引擎进行组合。


## InnoDB-记录格式
实际的数据库数据在不同存储引擎中存放的格式一般是不同的，相同存储引擎也有不同的记录格式(行格式)。InnoDB将数据划分为若干页，以页作为磁盘和内存之间交互的基本单位，页大小为16KB。

InnoDB设计了四种行格式：`Compact, Redundant, Dynamic, Compressed`，可以在创建或修改的表语句中指定`ROW_FORMAT`，默认Dynamic行格式。

### Compact 行格式

![Compact行格式](/img/Compact行格式.jpg)

一条完整的记录分为`记录的额外信息`和`记录的真实数据`两部分组成。
- 记录的额外信息
  - **变长字段长度列表**：非NULL的变长字段/可变字符集字段的实际长度，按列逆序存放，每列占1~2个字节
  - **NULL值列表**：允许NULL的列的标志位，1为NULL，0非NULL，按列逆序，高位用0补齐至整字节。
  - **记录头信息**：固定的5个字节组成
  ![Compact行格式_记录头信息](/img/Compact行格式_记录头信息.jpg)

- 记录的真实数据：真实列数据，以及三个隐藏字段
  - **row_id**: 可选，没有主键/Unique字段的记录，引擎默认生成该隐藏列作为主键
  - **transaction_id**: 最后一次插入或更新该行的事务 id
  - **roll_pointer**: 回滚指针，指向该行的 undo log


### Redundant 行格式
MySQL 5.0 之前使用的行格式

![Redundant行格式](/img/Redundant行格式.jpg)

### 行溢出
- 对于定长字段，无论真实数据大小，都会占用固定大小的空间，用0/空格补齐
- VARCHAR类型最多占用65535字节，但还依赖于字符集、列的限制等
- 对于Compact和Redundant，如果某一列数据过大，只会存储该列前768个字节，然后用20个字节指向存储溢出数据的另一个页
- MySQL规定一个页中至少存放两行记录，以及列的数量，都会影响行溢出的临界点

### Dynamic 和 Compressed 行格式
MySQL 8.0 默认行格式就是`Dynamic`，与Compact类似，区别在于行溢出时，真实数据处仅有一个指针，指针存储所有数据字节的其它页。而`Compressed`会采用压缩算法对页面进行压缩，以节省空间


## InnoDB-数据页

InnoDB设计了多种类型的页，存放不同的信息，其中存放表中记录的是数据页，也称索引页（InnoDB中索引即数据）。

![数据页结构](/img/数据页结构.jpg)

| 名称  | 中文名 | 占用空间大小 | 描述 |
|---|---|---|---|
| File Header | 文件头部 | 38字节 | 页的一些通用信息 |
| Page Header | 页面头部 | 56字节 | 数据页专有的一些信息 |
| Infimum + Supremum | 最小记录和最大记录 | 26不确定 | 两个虚拟行记录 |
| User Records | 用户记录 | 不确定 | 实际存储的行记录内容 |
| Free Space | 空闲空间 | 不确定 | 页中尚未使用的空间 |
| Page Directory | 页面目录 | 不确定 | 页中某些记录的相对位置 |
| File Trailer | 文件尾部 | 8字节 | 校验页是否完整 | 

### User Records
每插入一条记录，都会从`Free Space`分配一条记录的空间给`User Records`，Free Space分配完毕则该页使用完毕。**若干个记录以及两个伪记录按主键大小串成一个单链表。**

![数据页单链表](/img/数据页单链表.jpg)

其中每条记录的记录头部分：
- **delete_mask**: 
  - 标记当前记录是否被删除
  - 删除后仅修改标志位和链表指针，记录空间成为可重用空间
  - 插入新纪录时会复用可重用空间
- **min_rec_mask**: B+树每层非叶子结点的最小记录
- **n_owned**: 该记录组所含的记录数，见页目录部分
- **heap_no**: 
  - 当前记录在本页中的位置
  - 其中0、1对应最小(`Infimum`)和最大(`Supremum`)的伪记录
  - 完整记录之间根据主键大小排序。
- **record_type**: 当前记录类型
  - 0 普通记录
  - 1 为B+树非叶节点记录
  - 2 最小记录(即`Infimum`伪记录)
  - 3 最大记录(即`Supremum`伪记录)。
- **next_record**: 当前记录真实数据到下一条记录真实数据的地址偏移量 (按列逆序放置正是为了提高缓冲命中率)

### Page Directory

对整个单链表查找记录性能低，因此采取分组索引策略：
- 所有正常记录 (包括最小、最大记录，排除已删除记录) 划分为若干组
- 每组最后一条记录（即最大记录）的头记录中的`n_owned`标记该组内记录数
- 每组最后一条记录的地址偏移量抽取成索引，存放在`Page Directory`中构成页目录，其中每个偏移量称为槽

槽的更新：
- 初始时仅`Infimum`和`Supremum`两个组
- 每插入一条记录，从页目录中找到主键值大于本记录的最小槽，然后把该槽的`n_owned`加一，直到该组内记录达到8条
- 一个组内的记录达到8条后，再次插入新记录时，将该组拆分为一个4条记录的组和一个5条记录的组，并新增对应的槽

![数据页页目录](/img/数据页页目录.jpg)

因此，查找时:
- 通过二分法确定该记录所在的槽，并借助前一个槽找到所在槽中主键值最小的记录
- 通过记录的`next_record`遍历该槽查找记录

### 其它部分
- **Page Header**: 针对数据页，存储本页记录的状态信息，占56字节
- **File Header**: 针对所有页，存储页的通用信息，如前后页指针构成双链表，占38字节
- **File Trailer**: 针对所有页，用于同步正确性检验，占8字节，前4字节校验和，后四字节日志序列位置LSN

![通用页结构](/img/通用页结构.png)

## InnoDB-表空间

![InnoDB逻辑存储结构](/img/InnoDB逻辑存储结构.png)

### 区 - Extent
- **[行 - Row](#-innodb-记录格式)**：InnoDB 是面向行的，即数据是按行进行存放的
- **[页 - Page](#-innodb-数据页)**：页是组成区的最小单元，页也是InnoDB磁盘管理的最小单元

+ 区是表空间的单元结构，每个区的大小固定1M，每256个页划为一组
+ 一个区包含64个大小为16K的Page页，其中每个区的前几页是固定存储属性信息的页类型
+ 每个区对应了一个`XDES_Entry`，记录属性的结构
+ 区的类型有四种
  + `Free`: 空闲的区
  + `Free_Frag`: 有剩余空间的碎片区
  + `Full_Frag`: 没有剩余空间的碎片区
  + `FSEG`: 附属于某个段的区，用于特殊作用段的区
+ 其中前三种区是独立直属于表空间的，各自构成一个双链表；而从属于段的`FSEG`通过维护`FREE、NOT_FULL、FULL`三个链表进行查询使用。因此，对于一个只有聚簇索引的表，共有2*3+3=9个链表需要维护。
+ 上述的每个链表对应一个`List Base Node`结构，存储链表头、尾以及包含节点数

### 段 - Segment
表空间是由各个段组成的， 常见的段有数据段、索引段、回滚段等。一个段是一些零散的页面以及一些完整的Extent区的集合，属于逻辑概念。InnoDB中对于段的管理，都是引擎自身完成，不需要人为对其控制。

- 段以区为单位申请空间，为了节省空间还包含一些零散的页
- 一个索引对应生成两个段：
  - 叶子节点有自己独有的区，这些区的集合为叶子节点段
  - 非叶子节点也有独有的区，这些区的集合为非叶子节点段
- 每个段对应一个`INODE_Entry`结构记录段中的属性


### 表空间 - Tablespace
上面讲述的都是独立表空间，除此之外，整个MySQL进程还有一个系统表空间。

- InnoDB 存储引擎逻辑结构的最高层，ibd文件即表空间文件。
- 系统表空间和独立表空间类似，额外记录了一些关于系统信息的页面
- 数据字典：存储引擎启动时会读写一些内部系统表来记录数据库元信息，例如所有表的字段、类型、对应外键等等，重点包括：`SYS_TABLES, SYS_COLUMNS, SYS_INDEXES, SYS_FIELDS`四张基本系统表，可以通过`information_schema`系统数据库查询


表空间全局图：
![表空间全局图](/img/表空间全局图.svg)


## 索引原理⭐

### 索引概述

> 如果没有索引，只能依次遍历所有记录，效率十分低下。除了实际存储的数据，DBS 还维护着满足特定查找算法的数据结构，这些数据结构以某种方式引用（指向）数据，可以借此实现高效的查找算法。这种数据结构就是索引。

优点：
- 提高数据检索效率，降低数据库的IO成本  
- 通过索引列对数据进行排序，降低数据排序的成本，降低CPU的消耗

缺点：
- 索引列需要占用额外空间
- 索引大大提高了查询效率，但降低了增删改的速度


MySQL的索引是在存储引擎层实现的，不同的存储引擎支持不同的索引结构，主要包含以下几种：
| 索引结构  | 描述  | InnoDB  | MyISAM  | Memory  |
| ------------ | ------------ | :-----------: | :-----------: | :-----------: |
| B+Tree  | 最常见的索引类型，大部分引擎都支持B+树索引  | 支持  | 支持  | 支持  |
| Hash  | 底层数据结构是用哈希表实现，只有精确匹配索引列的查询才有效，不支持范围查询  | 不支持  | 不支持  | 支持  |
| R-Tree(空间索引)  | 空间索引是 MyISAM 引擎的一个特殊索引类型，主要用于地理空间数据类型，通常使用较少  | 不支持  | 支持  | 不支持  |
| Full-Text(全文索引)  | 是一种通过建立倒排索引，快速匹配文档的方式，类似于 Lucene, Solr, ES  | 5.6版本后支持  | 支持  | 不支持  |

注：如果没有特别指明，一般指`B+树`结构组织的索引。

### 索引结构
- 二叉树
  - 根据值构造二叉排序树，树的形状依赖于插入顺序
  - 顺序插入时会形成一个链表，大大降低查询性能
  - 大数据量情况下，层级较深，检索速度慢

- 红黑树
  - 自平衡二叉树
  - 仍然存在大数据量情况下，层级较深，检索速度慢的问题

- B-Tree
  - B树是一种**多叉平衡查找树**，相对于二叉树，B树每个节点可以有多个分支，即多叉。
  - 如果一棵B树的最大度数为n (n阶)，则这棵B树每个节点最多存储 n-1 个key，以及 n 个指针
  - 一旦节点存储的key数量到达n，就会裂变，中间元素向上分裂形成新的节点
  - B树中，非叶子节点和叶子节点都会存放实际数据
  - 树的度数：一个节点的子节点个数，实现上即指针个数

  ![B-Tree](/img/B-Tree.png)


- **B+Tree**
  - B+Tree是B-Tree的变种
  - 非叶子节点仅作为索引，存储所指向的数据页中的最小键，不存储数据
  - 叶子节点存储实际数据，且所有叶子节点形成一个单向链表

  ![B+Tree](/img/B+Tree.png)

  - MySQL索引数据结构对经典的B+Tree进行了优化。每层节点按照索引值从小到大的顺序排序而组成了双向链表，每个页内的记录按索引列排序形成单链表。
  - 所有结点本质上都是一个数据页，一页至少2条记录。目录项记录只存储主键值和对应的页号。
  - 非叶子结点中的记录头`record_type`存1标识记录项记录，叶子结点中的记录头`record_type`存0标识数据记录
  - 实际新增数据时，从根节点开始，存满后页分裂，向下生长树枝。因此根节点始终保持不动，并存储在数据字典中。
  - 这种B+Tree提高了区间访问的性能，利于排序
  - 另外，MyISAM中索引和数据分离，叶子节点存储的都是数据记录的地址，因此MyISAM的索引都是二级索引

  ![MySQL_B+Tree](/img/MySQL_B+Tree.png)


- Hash索引
  - 哈希索引就是采用一定的hash算法，将键值换算成新的Hash值，映射到对应的槽位上，然后存储在Hash表中。
  - 如果两个(或多个)键值，映射到一个相同的槽位上，他们就产生了Hash冲突（也称为Hash碰撞），可以通过链表来解决。
  - 特点：
    - Hash索引只能用于对等比较`(=，in)`，不支持范围查询`(between，>，< ，...)`
    - 无法利用索引完成排序操作
    - 查询效率高，通常 (不存在hash冲突的情况下) 只需要一次检索，效率通常高于B+Tree索引
  - 存储引擎支持：
    - Memory存储引擎支持Hash索引
    - InnoDB具有自适应Hash功能，其索引根据B+Tree索引在指定条件下自动构建

  ![Hash索引](/img/Hash索引.png)


> 综上，InnoDB选择B+Tree索引结构的原因有：
> - 相对于二叉树，层级更少，搜索效率高
> - 相对于 B-Tree，无论是叶子节点还是非叶子节点，都会保存数据，导致一页中存储的键值减少，指针也跟着减少，需要保存大量数据时，只能增加树的高度，导致性能降低
> - 相对于 Hash 索引，B+Tree 支持范围匹配及排序操作

### 索引分类
- MySQL中，索引的具体类型主要分为以下几类：
  | 分类  | 含义  | 特点  | 关键字  |
  | ------------ | ------------ | ------------ | :----------: |
  | 主键索引  | 针对于表中主键创建的索引  | 默认自动创建，只能有一个  | PRIMARY  |
  | 唯一索引  | 避免同一个表中某数据列中的值重复  | 可以有多个  | UNIQUE  |
  | 常规索引  | 快速定位特定数据  | 可以有多个  |   |
  | 全文索引  | 全文索引查找的是文本中的关键词，而不是比较索引中的值  | 可以有多个  | FULLTEXT  |

- InnoDB存储引擎中，根据索引的存储形式，又可以分为以下两种：
  | 分类  | 含义  | 特点  |
  | ------------ | ------------ | ------------ |
  | 聚集索引 (Clustered Index)  | 将数据存储与索引放一块，索引结构的叶子节点直接保存了行数据  | 必须有且只有一个；索引即数据，数据即索引。  |
  | 二级索引 (Secondary Index)  | 非主键生成的索引，索引结构的叶子节点关联的是对应的主键  | 可以存在多个；需要回表查询 |

  聚集索引选取规则：
  - 如果存在主键，主键索引就是聚集索引
  - 如果不存在主键，将使用第一个唯一(UNIQUE)索引作为聚集索引
  - 如果表没有主键或没有合适的唯一索引，则使用 InnoDB 自动生成的`rowid`作为隐藏的聚集索引

  <br>

  ![聚集索引和二级索引](/img/聚集索引和二级索引.png)
  

  - 聚集索引的叶子节点下挂的是这一行的数据
  - 二级索引的叶子节点下挂的是该字段值对应的主键值（实际非叶子节点为了保证目录项唯一，也要保存主键值）
  - **回表查询过程： 二级索引 -> 主键值 -> 聚集索引**

<br>

![二级索引查找过程](/img/二级索引查找过程.png)

- 单列索引与联合索引
  - 单列索引：即一个索引只包含单个列
  - 联合索引：即一个索引关联多个列

  > 在业务场景中，如果存在多个查询条件，考虑针对查询字段建立索引时，建议建立联合索引，而非单列索引。多条件联合查询时，MySQL优化器会评估哪个字段的索引效率更高，选择该索引完成本次查询。

  联合索引结构图：
  ![联合索引结构](/img/联合索引结构.png)


## 索引用法

### 索引语法
- 创建索引：  
  `CREATE [ UNIQUE | FULLTEXT ] INDEX index_name ON table_name (index_col_name, ...);`  
  如果 CREATE 后面不加索引类型参数，则创建的是常规索引  

- 查看索引：  
  `SHOW INDEX FROM table_name;`  

- 删除索引：  
  `DROP INDEX index_name ON table_name;`

示例：
```sql
-- name字段为姓名字段，该字段的值可能会重复，为该字段创建索引
create index idx_user_name on tb_user(name);
-- phone手机号字段的值非空，且唯一，为该字段创建唯一索引
create unique index idx_user_phone on tb_user (phone);
-- 为profession, age, status创建联合索引
create index idx_user_pro_age_stat on tb_user(profession, age, status);

-- 删除索引
drop index idx_user_name on tb_user;
```

### 最左匹配原则

- 联合索引遵守最左匹配原则，即查询从索引的最左列开始，并且不跳过索引中的列。  
- 如果跳跃某一列，后面字段的排序就无法保证，因此后面字段的索引将失效。
- 最左匹配原则在select的时候，和字段书写的位置没有关系。
- 联合索引中，如果出现范围查询（<, >），其后的列索引将失效。可以用 >= 或者 <= 来规避索引失效问题。  

例如，一个联合索引的顺序是 profession -> age -> status (创建索引时定义的顺序), 只要select没有选中某一列，那么其后的索引都将失效，即查询时不会使用该列之后的字段索引。


### 索引失效情况

1. 在索引列上进行运算操作，索引将失效
   如：`explain select * from tb_user where substring(phone, 10, 2) = '15';`

2. 字符串类型不加引号，索引将失效
   如：`explain select * from tb_user where phone = 17799990015;` 

3. 模糊查询中对头部模糊匹配，索引将失效
   如：`explain select * from tb_user where profession like '%工程';`，
   对前后都模糊匹配也会失效：`explain select * from tb_user where profession like '%工%';`
   仅对尾部模糊匹配不会失效：`explain select * from tb_user where profession like '软件%';`

4. 用 or 连接的条件，左右两侧字段都有索引时，索引才会生效
   因为只要有一个没有索引，另一个用不用索引没有意义，仍要进行全表扫描，所以无需用索引。

5. 数据分布的影响
   如果 MySQL 评估使用索引比全表更慢，则不使用索引。因为索引是用来索引少量数据的，如果通过索引查询返回大批量的数据，则还不如走全表扫描来的快，此时索引就会失效。

### 优化方案

#### 指定索引
优化数据库的一个重要手段，在SQL语句中加入一些手动提示，优化MySQL的索引使用策略，以提升性能

- 建议使用索引 - use index
 `explain select * from tb_user use index(idx_user_pro) where profession="软件工程";`
- 忽略索引 - ignore index
 `explain select * from tb_user ignore index(idx_user_pro) where profession="软件工程";`
- 强制使用索引 - force index
 `explain select * from tb_user force index(idx_user_pro) where profession="软件工程";`


#### 覆盖索引
应尽量使用覆盖索引，减少 `select *`。即需要查询的数据在单个索引结构中能够全部获取到，避免回表查询

explain 执行计划中 extra 字段含义：
- `using index condition`：查找使用了索引，但是需要回表查询数据
- `using where; using index;`：查找使用了索引，但是需要的数据都在索引列中能找到，不需要回表查询。因此性能更高

非覆盖索引查询示意：
![非覆盖索引查询](/img/非覆盖索引查询.png)


#### 前缀索引
当字段类型为字符串（varchar, text等）时，有时候需要索引很长的字符串，这会让索引变得很大，查询时，浪费大量的磁盘IO，影响查询效率。此时可以只对字符串的一部分前缀，建立索引，这样可以大大节约索引空间，从而提高索引效率。

**语法：**
`create index idx_xxxx on table_name(columnn(n));`

**前缀长度：**
可以根据索引的选择性来决定。选择性指不重复的索引值（基数）和数据表的记录总数的比值，索引选择性越高则查询效率越高。唯一索引的选择性是1，这是最好的索引选择性，性能也是最好的。

求选择性公式： 
```sql
-- 全长度索引选择性
select count(distinct email) / count(*) from tb_user;
-- 前缀索引选择性
select count(distinct substring(email, 1, 5)) / count(*) from tb_user;
```

**前缀索引查询示意：**

![前缀索引查询](/img/前缀索引查询.png)

- 索引具体结构和索引创建时的字段声明顺序有关
- 前缀索引中有可能碰到相同索引的情况，因此拿到一个叶子节点(lvbu6)获取id后，需要回表查询row是否与where条件一致
- 回表查询结束后，还要对该叶子节点的后续节点(xiaoy)查询是否符合where条件，不符合则结束查询


### 设计原则
1. 针对数据量较大，且查询比较频繁的表建立索引
2. 针对常作为查询条件（where）、排序（order by）、分组（group by）操作的字段建立索引
3. 考虑列的基数(区分度)，最好为基数大的列建立索引
4. 索引列的类型尽量小
5. 如果是字符串类型的字段，字段长度较长，可以针对字段的特点，建立前缀索引
6. 尽量使用联合索引，减少单列索引。查询时，联合索引很多时候可以覆盖索引，节省存储空间，避免回表，提高查询效率
7. 避免冗余和重复索引，索引并不是多多益善，索引越多，维护索引结构的代价就越大，会影响增删改的效率
8. 如果索引列不能存储NULL值，请在创建表时使用NOT NULL约束它。当优化器知道每列是否包含NULL值时，它可以更好地确定哪个索引最有效地用于查询
9. 主键按序插入能够提高性能，最好定义auto_increment


## 单表查询

### 访问方法
MySQL执行查询语句的方式称为访问方法/访问类型

- `const`：
  - 通过主键/唯一二级索引列来定位一条记录的访问方式，表示常数级别
  - 仅用于等值比较
  - NULL值不保证仅有一条记录，因此也不是const
- `ref`：
  - 采用二级索引进行等值查询的访问方式
  - 索引结果可能匹配多条记录，效率略低于const
  - 可NULL的列最多使用ref方式
  - 对于联合二级索引，必须最左边的连续索引列都是等值比较才生效
- `ref_or_null`：
  - 采用二级索引进行等值查询或匹配NULL的访问方式
- `range`：
  - 利用索引进行范围匹配的访问方式
  - 等值匹配称单点区间
  - 否则称连续范围区间
- `index`：
  - 遍历二级索引记录的执行方式
  - 二级索引叶子节点包含全部所需的查询条件
- `all`：
  - 使用全表扫描执行查询的方式

### 注意事项
- 一般情况下，只能利用单个二级索引执行查询
  - 且只会用到索引相关的列，其它条件在回表时才会进行过滤
- 所有条件都可以使用某个索引时，进行条件的范围合并
- 一个使用索引的条件和一个没有使用索引的条件用OR连接后无法使用该索引
- `index merge`：使用多个索引来完成一次查询的执行方法
  - `intersection合并`：从多个二级索引中取交集（除主键外必须等值匹配）
  - `union合并`：从多个二级索引中取并集（除主键外必须等值匹配，或intersection索引合并的搜索条件）
  - `sort-union合并`：先按照二级索引记录的主键值进行排序，之后按照union合并执行
  - 另外，可以新建联合索引替代intersection合并

## 多表查询

### 多表连接
涉及多表的查询大致执行过程为：
1. 首先确定第一个需要查询的表，称为驱动表，选取代价最低的单表访问方法执行查询语句，得到一个结果集。驱动表只需访问一次。
2. 针对结果集中的每一条记录，分别到另一张表，即被驱动表中查找匹配的记录。被驱动表可能被访问多次。

![多表查询过程](/img/多表查询过程.png)

具体连接类型可分为：
- 内连接：驱动表中的记录如果在被驱动表中找不到匹配的记录，则不会加入最后的结果集。对于内连接，驱动表和被驱动表可互换，不影响结果。
- 外连接：驱动表中的记录即使在被驱动表中找不到匹配的记录，也会加入最后的结果集
  - 左外连接：选取左侧表为驱动表
  - 右外连接：选取右侧表为驱动表

不同的条件子句：
- `WHERE`子句：不论内连接还是外连接，不符合where条件的都不会加入结果集
- `ON`子句：对于内连接和where子句等价。对于外连接，也称过滤条件，无法匹配的字段将置NULL并加入结果集

### 连接原理
- **嵌套循环连接**
  驱动表只访问一次，被驱动表可能被多次访问。访问次数决定于驱动表执行单表查询后的结果集中的记录条数。
- **使用索引加快连接速度**
  连接查询中对被驱动表使用主键或唯一二级索引列进行等值查询称为`eq_ref`
- **基于块的嵌套循环连接**
  如果表的数据过大，需要多次磁盘IO，因此为了尽量减少访问被驱动表的次数，把多条驱动表的结果集装入`join buffer`中，每次对载入内存中的被驱动表记录和`join buffer`中的多条驱动记录进行匹配。可通过`join_buffer_size`配置缓冲区大小。


## 基于成本的优化

### 成本常数
MySQL中定义了一些成本估算使用的常量，按使用位置存储在`engine_cost`和`server_cost`两张表中。其中关键的常量有：
- **I/O成本**：从磁盘加载数据到内存的开销。MySQL中记读取一个页面的成本为1.0
- **CPU成本**：读取以及检测记录是否满足条件的开销。MySQL中每条记录成本为0.1

### 单表查询的成本
MySQL在执行单表查询前，会先找出所有可能的方案，对比找出成本最低的方案，即执行计划，然后才真正执行查询。具体步骤：
1. 根据搜索条件，找出所有可能使用的索引
2. 计算全表扫描的代价
3. 计算使用不同索引执行查询的代价
4. 对比各种执行方案的代价，找出成本最低的那一个

注：
- 实际计算时，需要用到一些估算值，例如记录数，页面数等，可以通过`show table status like '表名'`查询
- MySQL优先计算唯一二级索引，然后再计算普通二级索引
- 查询优化器假定读取索引的一个范围和读取一个页面相同
- 需要回表的记录数通过区间最左记录和区间最右记录进行估算
- 这种通过直接访问索引对应的B+树来计算范围区间对应的索引记录条数的方式称为index dive
- MySQL会把index dive和索引的基数Cardinality进行比较，判断是否使用索引统计数据进行估算。基数通过`show index from 表名`查询

### 多表查询的成本
MySQL连接查询采用嵌套循环连接算法，因此对于两表表连接查询：
`查询成本 = 单次查询驱动表的成本 + 驱动表扇出数 * 单次查询被驱动表的成本`
其中扇出数即驱动表查询结果集的记录条数。在全表扫描或索引执行的单表查询，扇出数需要估算，称为`condition filtering`。

- 对于外连接，只需要分别为驱动表和被驱动表选择成本最低的访问方法
- 而对于内连接，还需要考虑表连接顺序，即谁作为驱动表，谁作为被驱动表
- 成本的重点在减少扇出数对被驱动表的访问成本


## InnoDB-统计数据

InnoDB会定期以表为单位，收集并存储数据库的统计数据（估计值）。按存储方式分两种，通过`innodb_stats_persistent`变量（默认ON）配置：
- 永久性统计数据：存储在磁盘上
- 非永久性统计数据：存储在内存中

### 永久性数据
统计数据实际存放在两张表中，并定期进行更新，`innodb_stats_auto_recalc`变量控制是否异步自动更新，也可以用`analyze table 表名`语句手动同步更新。
- **innodb_table_stats**: 存储关于表的统计数据，每条记录对应一张表
  - `n_rows`统计项是表中记录行数，根据`innodb_stats_persistent_sample_pages`变量采样一定数量的页面，计算平均记录数再乘以全部叶子节点数，得到估算的总记录数
  - `clustered_index_size` 表的聚簇索引占用的页面数量
  - `sum_of_other_index_sizes` 表的其它索引占用的页面数量

- **innodb_index_stats**: 存储关于索引的统计数据，每条记录对应一个索引的某一个统计项
  - n_leaf_pages: 该索引的叶子节点占用页面数
  - size: 索引共占用页面数
  - n_diff_pfxNN: 对应索引列不重复的值个数
  - sample_size: 采样页面数

### 非永久性数据
`innodb_stats_auto_recalc`变量为OFF时，数据会存储在内存中，因此会产生经常变化的执行计划。新版MySQL很少使用。

### 重复值的说明
- 索引重复值常用于单表查询中但点区间太多，以及连接查询中被驱动表拥有索引的情况
- 对NULL值的处理由innodb_stats_method控制，取值有三个：
  - nulls_equal: 默认值，认为所有NULL值都相等。倾向于不适用索引
  - nulls_unequal: 认为所有NULL值不相等，倾向于使用索引
  - nulls_ignored: 忽略NULL值


## 基于规则的优化

### 条件化简
- 移除不必要的括号
- 常量传递
- 等值传递
- 移除没用的条件
- 表达式计算（列必须单独出现）
- HAVING子句和WHERE子句合并
- 常量表检测（表记录为0/1、主键/唯一二级索引等值匹配）

### 外连接消除
相对于外连接，内连接可能通过优化表的连接顺序来降低整体的查询成本。

- 优化器首先把右外连接查询转换成左外连接查询
- 在外连接查询中，where子句如果（显式/隐式）包含被驱动表中的列不为NULL的条件称为`空值拒绝`。满足`空值拒绝`的外连接查询可以和内连接相互转换
- 继而查询优化器可以评估表的不同连接顺序，选择成本最低的执行方案

### 子查询优化
- 对于包含不相关的标量子查询或者行子查询，MySQL会分别独立执行外层查询和子查询
- `IN子查询`如果符合`semi-join`半连接条件，则优化器会先转换，再评估以下五种半连接策略，选择成本最低的执行方案：
  - Table pullout 表上拉
  - DuplicateWeedout 重复值消除
  - LooseScan 松散索引扫描
  - Materialization 物化
  - FirstMatch 首次匹配
- `IN子查询`如果不符合`semi-join`条件，则评估以下两种策略：
  - 子查询物化（结果集写入临时表，用于不相关子查询）
  - 执行`IN -> EXISTS`转换
- ANY/ALL子查询可以转换，例如`<ANY 转换成 <(SELECT MAX(...) ...)`
- 派生表（FROM后面的子查询）优化：
  - 首先派生表和外层表合并，转换为没有派生表的形式
  - 合并失败，则尝试派生表物化（延迟物化）



## Explain 执行计划
一条查询语句经过MySQL查询优化器的各种基于成本、规则的优化后会生成一个执行计划，描述具体执行查询的方式，例如多表连接的顺序、每个表的访问方式等。通过`Explain`命令查看。

```sql
-- 直接在select语句之前加上关键字 explain / desc
EXPLAIN SELECT 字段列表 FROM 表名 WHERE 条件;
```
### 字段含义

- **id**
  - （经优化后的）语句中每个SELECT对应一个id
  - 如果FROM后跟有多个表，每个表都会有一条记录，且这些记录的id值都是相同的。记录在前的是驱动表，记录在后的是被驱动表。
- **select_type**
  - 每个SELECT对应的类型
  - SIMPLE：不包含UNION/子查询的简单查询
  - PRIMARY：最左边的SELECT小查询
  - UNION, UNION RESULT, SUBQUERY, DEPENDENT SUBQUERY, DEPENDENT UNION, DERIVED, MATERIALIZED...
- **table**
  - explain的每条记录都对应着某个单表的访问方法
- **partitions**
- **type**
  - 该表的访问方法
  - system: 用于仅包含一条记录，且存储引擎的统计数据是精确的表，例如MyISAM、Memory
  - const：根据主键/唯一二级索引进行等值匹配
  - eq_ref：被驱动表根据主键/唯一二级索引进行等值匹配
  - ref：通过普通二级索引进行等值匹配可能采用ref方式
  - ref_or_full：通过普通二级索引进行等值匹配，且该列可为NULL，则可能是ref_or_full
  - index_merge：使用Intersection, Union, Sort_Union三种索引合并的方式来执行查询
  - ALL：全表扫描
  - range：使用索引获取某些范围区间可能用到
  - index: 使用索引覆盖，但需要扫描全部索引记录
  - fulltext, unique_subquery, index_subquery
- **possible_keys**
  - 可能用到的索引
- **key**
  - 估算成本后，实际用到的索引
- **key_len**
  - 使用的索引记录的最大长度，由三部分相加而得：
    - 对于定长类型索引列，实际占用的存储空间就是该固定值
    - 如果该索引列可以为NULL，则key_len加1
    - 对于变长字段，额外有2字节存储该列的实际长度
- **ref**
  - 索引列等值匹配的值/列的类型，如const表示常量、某个列名、func表示函数
  - 即访问方法是const, eq_ref, ref, ref_or_null, unique_subquery, index_subquery其中之一
- **rows**
  - 对于全表扫描，即预计需要扫描的行数
  - 对于索引查询，即预计需要扫描的索引记录行数
- **filtered**
  - 对于全表扫描，即估算的满足搜索条件的记录总数占rows之比
  - 对于索引查询，即除索引条件外满足其它搜索条件的记录数占rows之比
- **Extra**
  - 额外信息
  - No tables used, Using join buffer, Using index ...

### 查询成本
语法：`explain format=JSON select ...;`

输出JSON的`cost_info`字段包含了执行计划的成本，包括：
- **read_cost** 包括两部分：
  - IO成本
  - 检测`rows * (1 - filter)`条记录的CPU成本
- **eval_cost**
  - 检测`rows * filter`条记录的成本
- prefix_cost
  - 整个查询的成本，即`read_cost + eval_cost`
- `data_read_per_join` 此次查询中需要读取的数据量

最后，explain结束结束后，可以通过`show warnings;`查看与该执行计划相关的扩展信息，包括Level 等级，Code 代码，Message 消息三部分，其中Message字段类似于查询优化器重写后的执行语句。

另外，`OPTIMIZER_TRACE`表记录了内部具体的优化策略过程，使用步骤：
    1. set optimizer_trace="enabled=on";
    2. 执行语句
    3. select * from information_schema.OPTIMIZER_TRACE;
    4. set optimizer_trace="enabled=off";
输出结果中QUERY为查询语句，TRACE即优化过程，分为`prepare、optimize、execute`三个阶段。


## InnoDB-缓冲池
缓存数据页、锁信息、自适应哈希索引等信息的内存空间。其中包含若干个16K的缓存页和对应的控制块，控制块存储页面对应的表空间编号、页号、缓冲池中的地址等等信息。 语句`show engine innodb status\G;`查看当前缓冲池状态。

### Buffer Pool结构

![BufferPool](/img/BufferPool.png)

- MySQL以`表空间号+页号`作为Key，缓存页作为value，构建哈希表来判断缓存是否命中
- 可以通过`innodb_buffer_pool_instances`控制缓冲池实例个数，所有实例均分总空间innodb_buffer_pool_size，以此提高并发处理能力
- MySQL以chunk为单位申请内存，每个chunk都是一块连续的空间，大小由`innodb_buffer_pool_chunk_size`（默认128M，不含控制块空间）控制
- 缓冲池中所有空闲页对应的控制块组成一个`Free空闲链表`
- 缓冲池中的页被修改后就和磁盘上的数据不一致了，称为脏页，所有脏页对应的控制块构成`Flush待刷新链表`。刷新时间有以下几种：
  - `BUF_FLUSH_LRU`: 从LRU链表的冷数据中刷新一部分页面到磁盘。数量由innodb_lru_scan_depth控制
  - `BUF_FLUSH_LIST`: 从flush链表中刷新一部分页面到磁盘
  - `BUF_FLUSH_SINGLE_PAGE`: 强制需要腾出缓存空间时必须进行的单页刷新
- 其它结构还有例如：unzip LRU链表管理解压页，zip clean链表管理未解压页，zip free数组构成伙伴系统为压缩页提供内存空间

### LRU 链表
控制块按照`LRU 最近最少使用原则`构建链表，使用到某个缓存页时将它调整到链表头部，缓冲池存满时从链表尾淘汰页面。

**存在的两个问题：**
- 预读：
  - 预先加载部分可能访问的页面到缓冲池中，分以下两类：
    - 线性预读：如果顺序访问了某个区的一些页面，会异步预读下一个区的全部页面。阈值由`innodb_read_ahead_threshold`（默认56）控制。
    - 随机预读：如果已经缓存了某个区的一些连续页面，不论是否顺序读取，都会异步预读该区中的所有其它页面。阈值由`innodb_random_read_ahead`（默认13）控制。
  - 但如果预读的页面没用到，就会大大降低缓存命中率
- 全表扫描：
  - 全表扫描时会大量更新LRU的节点，严重影响其它查询对Buffer Pool的使用，大大降低缓存命中率。

**优化方案：**
- LRU链表分为两部分：
  - 高频访问缓存页，称`热数据/Young区域`
  - 低频访问缓存页，称`冷数据/Old区域`
  - 划分比例由`innodb_old_blocks_pct`控制（默认37%）
- 针对预读产生的问题，每次加载新页面时，对应的控制块放到Old区域的头部
- 针对全表扫描问题，则
  - 对处在Old区域的页面进行第一次访问（新缓存）时，在控制块中记录访问时间
  - 后续再次访问时，如果时间间隔在某个阈值内，就不移动到Young区域头部，超过阈值就移动到Young区域头部
  - 阈值由`innodb_old_blocks_time`控制（默认1000ms）
- 除此之外，还有很多其它优化手段，例如对Young区域继续划分等。最终目的都是提高Buffer Pool的缓存命中率。


## 事务⭐

事务是一组操作的集合，事务会把所有操作作为一个整体一起向系统提交或撤销操作请求，即这些操作要么同时成功，要么同时失败。事务大致上可以分为五种状态：**活动的、部分提交的、失败的、中止的、提交的**。MySQL中仅InnoDB和NDB存储引擎支持事务。

![事务状态](/img/事务状态.png)

### 事务语法
- **控制事务方式一**：
  ```sql
  -- 查看事务提交方式
  SELECT @@AUTOCOMMIT;
  -- 设置事务提交方式，1为自动提交，0为手动提交，该设置只对当前会话有效
  SET @@AUTOCOMMIT = 0;
  -- 提交事务
  COMMIT;
  -- 回滚事务
  ROLLBACK;
  ```

- **控制事务方式二**：
  ```sql
  -- 手动开启事务：（暂时关闭autocommit）
  START TRANSACTION [read only|read write, with consistent snapshot] 或 BEGIN;
  -- DML
  select * from account where name = '张三';
  update account set money = money - 1000 where name = '张三';
  update account set money = money + 1000 where name = '李四';
  -- 提交事务
  COMMIT;
  -- 或回滚事务
  ROLLBACK;
  ```

- **隐式提交语句**：
  - 数据定义语言DDL
  - 隐式使用/修改系统数据库mysql库中的表
  - 事务控制或关于锁的语句，如`lock tables`...
  - 加载数据的语句，如`load data`
  - 关于MySQL复制的语句，如`start slave, stop slave...`
  - 其他语句，如`analyze, repair, reset...`

- **保存点 savepoint**:
  ```sql
  -- 定义保存点
  SAVEPOINT sp_name;
  -- 回滚到某个保存点
  ROLLBACK TO [SAVEPOINT] sp_name;
  -- 删除保存点
  RELEASE SAVEPOINT sp_name;
  ```

### 四大特性 ACID

- **原子性 Atomicity**：事务是不可分割的最小操作单元，要么全部成功，要么全部失败
- **一致性 Consistency**：事务完成时，必须使所有数据都保持一致状态
- **隔离性 Isolation**：数据库系统提供的隔离机制，保证事务在不受外部并发操作影响的独立环境下运行
- **持久性 Durability**：事务一旦提交或回滚，它对数据库中的数据的改变就是永久的

其中，原子性、一致性、持久性这三大特性由 Redo Log 和 Undo Log 两份日志来保证，而隔离性由锁机制和MVCC保证。

### 并发问题

并发问题指的是单个事务中，前后读取数据不一致的问题，一般是由多个并发事务操作多个记录引起的，需要通过事务的隔离性来解决。

|    问题   |    描述  |
| :------- | ------------ |
| 脏写      | A事务修改了另一个事务未提交的数据 |
| 脏读      | A事务读到了另一个事务未提交的数据，即读取了中间状态的数据 |
| 不可重复读 | A事务先后读取同一条记录，期间B事务修改了数据，导致A事务两次读取的数据不同  |
| 幻读      | A事务按照某些条件查询，期间B事务修改了特定数据，导致A事务的查询结果不准确  |

### 隔离级别

为了解决事务并发所带来的问题，数据库系统引入了事务隔离级别，包括 读未提交、读已提交、可重复读、串行。隔离级别有一些基本准则：

- 隔离级别越低，越严重的问题越可能发生
- 隔离级别越高，数据越安全，但是性能一般越低
- 脏写问题十分严重，任何隔离级别都不允许

  | 隔离级别 | 脏读  | 不可重复读  | 幻读 | 常见的实现方式 |
  | ------- | ---- | --------- | ---- | ----------- |
  | Read Uncommitted | ×  | × | × | / |
  | Read Committed   | √  | × | × | 行级锁、新旧值 |
  | Repeatable Read  | √  | √ | × | 快照隔离 + 临键锁 |
  | Serializable     | √  | √ | √ | 串行执行、两阶段加锁、可串行化快照隔离|

  √ 表示在当前隔离级别下解决了对应的并发问题。

MySQL 的 InnoDB 引擎默认隔离级别为`Repeatable Read`，通过 MVCC 多版本并发控制解决了脏读和不可重复读，另外还通过间隙锁解决了幻读的问题。这里讨论的都是单机的并发事务，对于分布式场景，有更为复杂的事务问题 [分布式事务](./distributed-transaction.md)。


+ 查看事务隔离级别：  
`SELECT @@TRANSACTION_ISOLATION;`  
+ 设置事务隔离级别：  
`SET [SESSION|GLOBAL] TRANSACTION ISOLATION LEVEL xxx;`  
  - 如果指定GLOBAL，则对语句执行完后的**新会话**有效，当前已存在的会话无效
  - 如果指定SESSION，则对当前会话的所有**后续事务**有效
  - 如果不指定，则仅对当前会话的**下一个事务**有效，且执行完后恢复原级别


## Redo Log

为了实现事务的持久性，必须在事务提交之前将所有修改的页面刷新到磁盘，这种方式存在一些问题：
- 刷新整个页面过于浪费
- 随机IO速度慢

因此，MySQL在事务执行过程中利用`Redo Log`重做日志，记录修改的具体信息，这样即使系统崩溃也能快速恢复数据，而且：
- 占用空间小
- 顺序IO速度快

### Redo日志格式

**日志记录**

![redo_log格式](/img/redo_log格式.png)

- 通用格式中：
  - type: redo日志类型
  - space ID：表空间ID
  - page number：页号
  - data：日志具体内容
- 对于简单日志类型，一般直接把修改的偏移量和内容写入data区域中。如MLOG_1|2|3|4BYTE
- 对于复杂日志类型，修改的内容会非常多，一般data区存储修改所需的参数，然后调用相应的函数进行更改。如MLOG_COMP_REC_INSERT

**Mini-Transaction**
语句执行可能修改多个页面，且这些语句不可分割。例如对于插入语句，分乐观插入（修改少量数据）和悲观插入（页分裂，修改大量内部数据结构），这些日志记录必须保持一致，否则B+树结构将不完整。

![mtr类型](/img/mtr类型.png)

- `MLOG_MULTI_REC_END`日志类型标识一个需要保证原子性的redo日志组结束
- 对于需要保证原子性的操作如果只产生一条redo日志，则类型type字段首位置1

整体上，一个事务可以包含若干条语句，每条语句由若干Mini-Transaction(mtr)组成，每个mtr又包含若干条redo日志。

**Redo Log Block**

![redo_log_block](/img/redo_log_block.png)

- mtr生成的Redo日志以及一些控制信息放在512Byte的页中，称Block
- Block Header部分12Byte
  - LOG_BLOCK_HDR_NO: 唯一标号
  - LOG_BLOCK_HDR_DATA_LEN: 已使用字节数
  - LOG_BLOCK_FIRST_REC_GROUP: 首个mtr日志组的偏移量
  - LOG_BLOCK_CHECKPOINT_NO: checkpoint序号
- Block Trailer部分4Byte
  - LOG_BLOCK_CHECKSUM: 正确性校验值

**Redo日志缓冲区**
与Buffer Pool同理，内存中开辟一块连续的空间用于解决磁盘速度过慢的问题，默认16MB，划分为若干Redo Log Block，从前往后顺序写入。

![redo_log_buffer](/img/redo_log_buffer.png)

- 全局变量`buf_free`记录当前空闲区域的头部
- 全局变量`buf_next_to_write`记录已经刷新到磁盘的位置末尾

**日志文件组**
MySQL数据目录下的`ib_logfile/ib_redo`文件即redo日志，通常有多个文件构成一个日志文件组，从前往后循环覆写。文件数由innodb_log_files_in_group控制。

![redo日志文件组](/img/redo日志文件组.png)

- 日志文件组中每个文件大小一样，默认48M，存储Block镜像
- 文件由两部分组成，前4个Block(2048Bytes)存储管理信息，后面是log buffer中的block镜像
- 头部的管理信息包括`log file header`和checkpoints

![redo_log_header](/img/redo_log_header.png)


**刷盘时机**
- Log Buffer使用一半左右空间时
- 事务提交时
- 后台线程自动刷新
- 正常关闭服务器时
- 创建checkpoint时
- 其它情况...

另外，innodb_flush_log_at_trx_commit变量控制事务提交时的redo日志行为：
- 0：事务提交时不立即向磁盘同步redo日志，交给后台线程
- 1：默认值，事务提交时立即同步
- 2：事务提交时将redo日志写入OS缓冲区，不保证立即刷新到磁盘。这种方式除非DB和OS都挂了，否则是能够保证持久性的

### Log Sequence Number
- lsn初始值为8704，每写入一个mtr生成的redo日志就增加lsn，增量包括日志量、block header以及block trailer
- 每组mtr生成的redo日志都有一个唯一的LSN值与其对应，LSN值越小说明日志产生的越早
- `flushed_to_disk_lsn`表示已经刷新到磁盘的日志序列号，初始值和LSN一致（涉及OS的读写缓存）
- 另外，mtr执行过程中可能修改页面。Buffer Pool中的Flush链表中的脏页按照修改发生的时间顺序排序，即oldest_modification代表的LSN值，被多次更新的页面不会重复插入Flush链表，但会更新newest_modification属性值，即最近一次mtr对应的LSN。

![LSN_flush链表](/img/LSN_flush链表.png)


### Checkpoint
redo日志文件组是有限的，不得不循环使用，可能导致日志追尾。因此，需要即时把已经刷写回磁盘的脏页对应的redo日志释放，即checkpoint。

![checkpoint_lsn](/img/checkpoint_lsn.png)

- 全局变量`checkpoint_lsn`表示当前系统可以被覆盖的redo日志总量，初始值也是8704
- 全局变量`checkpoint_no`表示当前执行checkpoint的次数
- 当脏页刷新到磁盘后，可以进行增加checkpoint_lsn操作，称为做一次checkpoint。具体分为两步：
  - 计算当前可被覆盖的redo日志对应的最大LSN
  - 将checkpoint_lsn、对应的redo日志组偏移量，以及此次checkpoint编号写入文件组第一个日志文件的管理信息中。编号为偶写入checkpoint1，否则写入checkpoint2
- `show engine innodb status;`可以查看各个LSN值

### 崩溃恢复

**恢复起点**
checkpoint_lsn之后的redo日志。具体的，从redo日志文件组的第一个文件的管理信息checkpoint1、checkpoint2中选择较大的checkpoint_no，即最近一次的checkpoint信息，拿到对应的checkpoint_lsn和checkpoint_offset。

**恢复终点**
Log Block Header中LOG_BLOCK_HDR_DATA_LEN记录当前块已使用的字节数，对于填满的块，该值为512，否则即为最后一个需要恢复的Block。

**恢复步骤**
- 根据日志的space ID和page number作为key，构建有序的redo日志哈希表，以此减少随机IO，加快恢复速度
- 顺序扫描哈希表，逐条记录恢复

对于部分已经刷新到磁盘的页面，可以从页的File Header中取FIL_PAGE_LSN值，即最近一次修改页面对应的LSN值（newest_modification），如果该值大于checkpoint_lsn说明该页已经刷新回磁盘，该页小于FIL_PAGE_LSN的redo日志就不需要恢复了。


## Undo Log

### 事务Id
InnoDB中聚簇索引行记录除了用户数据外，还有几个隐藏列，其中trx_id即事务id，roll_pointer指向该行记录对应的undo日志。系统会维护一个全局变量，保证事务id按时间先后递增。
- 对于只读事务，仅能增删改临时表。当它第一次对**用户创建的**临时表执行增删改时会自动分配一个事务id
- 对于读写事务，当它第一次对某个表执行增删改时会自动分配一个事务id

### Undo日志格式
InnoDB每次执行增删改某个记录时，都会先记下对应的Undo日志，每条日志对应一个唯一的编号undo_no，从0开始每条记录自增1。Undo日志记录在FIL_PAGE_UNDO_LOG类型的页面中，从系统表空间/Undo表空间中分配。

#### INSERT Undo日志

![insert_undo_log](/img/insert_undo_log.png)

- 类型为TRX_UNDO_INSERT_REC
- 主键可能包含多个列，对应的长度和值都会记录下来
- 增删改对聚簇索引、二级索引都需要修改，此处仅以聚簇索引为例


#### DELETE Undo日志
页面中的记录根据`delete_mask`标志位分正常记录链表和垃圾链表，Page Header中Page Free属性指向垃圾链表的头节点。DELETE语句删除正常记录分两个阶段：
- 阶段一 **delete mark**：将记录的delete_mask置1。此时记录处于中间状态
- 阶段二 **purge**：当删除事务提交后，后台线程执行真正的删除，即将该记录从正常记录链表移到垃圾链表头部，并修改相应的其它信息

![undo_log_delete_中间状态](/img/undo_log_delete_中间状态.png)

删除语句提交前，只会经历阶段一，所以只有delete_mask对应TRX_UNDO_DEL_REC类型Undo日志，提交后就不用回滚了，因此purge阶段不需要Undo日志。Delete Undo日志中：
- old_roll_pointer指向旧的roll_pointer，构成该记录的版本链
- 如果某列包含在某个索引中，则相关信息需要保存至**索引列信息**中，包括位置、长度、实际值三部分，用于purge阶段执行真正的删除

![undo_log_delete_mask](/img/undo_log_delete_mask.png)


#### UPDATE Undo日志

**不更新主键的情况**
- 如果更新记录时，记录的每列更新前后所占空间一样，就可以**原地更新**
- 如果任何一列更新前后大小不一致，则先删除旧记录，再插入新记录。
  - 这里的删除是完整的删除，由用户线程同步执行
  - 如果新记录空间不超过旧空间，可以重用旧记录的空间

两种情况都对应TRX_UNDO_UPD_EXIST_REC类型的Undo日志:

![undo_log_update1](/img/undo_log_update1.png)

**更新主键的情况**
InnoDB在聚簇索引中分两步处理，会产生TRX_UNDO_DEL_MARK_REC、TRX_UNDO_INSERT_REC两条Undo日志
- 将旧记录进行delete_mark
  - 事务提交后再交由专门线程执行purge
  - 原因在于实现MVCC
- 根据更新后各列的值创建一条新记录，重新定位并插入聚簇索引


### 日志存储

**Undo 页面**
Undo日志专门存放于FIL_PAGE_UNDO_LOG类型的页面中，除了通用的页面头和页面尾，Undo页面特有Undo Page Header:

![undo_page_header](/img/undo_page_header.png)

- TRX_UNDO_PAGE_TYPE: 本页面存储的Undo日志类型，为服务MVVC分两大类，不可混存
  - TRX_UNDO_INSERT: 涉及插入的Undo日志，例如TRX_UNDO_INSERT_REC
  - TRX_UNDO_UPDATE: 涉及删除、修改的Undo日志
- TRX_UNDO_PAGE_START: 第一天Undo日志起始位置
- TRX_UNDO_PAGE_FREE: 新的Undo日志存储（空闲区域）位置
- TRX_UNDO_PAGE_NODE: 链表普通结点


**Undo 页面链表**

![Undo页面链表](/img/Undo页面链表.png)

- 不同事务对应不同的页面链表
- 每个事务对普通表、临时表分别使用不同的链表
- 对不同表又按存储的日志类型分insert undo链表、update undo链表
- 链表中第一个页面称为first_undo_page，记录段相关信息。其它称normal_undo_page
- 一个事务最多对应4条Undo页面链表，每个链表都是按需分配，实际用到时才会创建


**Undo 日志段头部**

![undo_log_segment_header](/img/undo_log_segment_header.png)

- 每个Undo页面链表对应一个段，称Undo Log Segment
- first_undo_page中存有Undo Log Segment Header，包含对应段的信息
  - TRX_UNDO_STATE: 本Undo页面链表所处状态
    - TRX_UNDO_ACTIVE: 活跃状态，一个活跃的事务正往此段内写入Undo日志
    - TRX_UNDO_CACHED: 被缓存状态，等待被其它事务重用
    - TRX_UNDO_TO_FREE: 事务提交后不能被重用的insert undo链表
    - TRX_UNDO_TO_PURGE: 事务提交后不能被重用的update undo链表
    - TRX_UNDO_PREPARED: 包含处于PREPARE阶段的事务产生的undo日志
  - TRX_UNDO_LAST_LOG:本Undo页面链表最后一个Undo Log Header位置
  - TRX_UNDO_FSEG_HEADER: 本Undo页面链表对应段头信息(找到段对应INODE Entry)
  - TRX_UNDO_PAGE_LIST: Undo页面链表的基结点

**Undo 日志头**

![undo_log_header](/img/undo_log_header.png)

- 同一个事务向一个Undo页面链表写入的Undo日志记为一个组
- 每写入一组Undo日志都会在这组日志前先记录关于这个组的属性，即Undo Log Header
  - TRX_UNDO_TRX_ID: 生成本组日志的事务id
  - TRX_UNDO_TRX_NO:标记事务的提交顺序
  - TRX_UNDO_DEL_MARKS: 标记本组是否含delete mark产生的日志
  - TRX_UNDO_LOG_START: 本组第一条日志在页面中的偏移量
  - TRX_UNDO_XID_EXISTS: 本组是否含XID信息
  - TRX_UNDO_DICT_TRANS: 标记本组日志是否由DDL语句产生
  - TRX_UNDO_TABLE_ID: 如果DICT_TRANS为真，表示DDL操作的表Id
  - TRX_UNDO_NEXT_LOG: 下一组日志在页面中开始的偏移量
  - TRX_UNDO_PREV_LOG: 上一组日志在页面中开始的偏移量

因此，整体上，Undo页面链表的first undo page会填充Undo Page Header, Undo Log Segment Header, Undo Log Header三部分，而普通页面仅填充Undo Page Header。

![undo页面链表总结](/img/undo页面链表总结.png)



### 页面重用
大部分事务仅修改若干条记录，产生少量的Undo日志，但需要创建完整的Undo页面链表，造成空间浪费。为此，MySQL在事务提交后可以判断是否重用该事务的Undo页面链表。

**是否重用的条件**
- 该链表仅包含一个Undo页面
- 该Undo页面已经使用的空间小于整个页面空间的3/4

**处理逻辑**
- 对于insert undo链表，仅存储TRX_UNDO_INSERT_REC的undo日志，提交后就可以被删除，因此新事务的日志可以直接覆盖原有的空间
  ![重用insert_undo](/img/重用insert_undo.png)

- 对于update undo链表，为了MVVC，事务提交后不能立即删除，因此重用会直接在空闲区域写入日志，即同一个Undo页面中写入了多组日志
  ![重用update_undo](/img/重用update_undo.png)


### 回滚段
为了更好的管理Undo页面链表，MySQL设计了Rollback Segment Header类型的页面，存放各个Undo页面链表的first undo page页号（称为undo slot）。

![rollback_segment_header](/img/rollback_segment_header.png)

- 每个Rollback Segment Header对应一个Rollback Segment，其中仅含一个页面
- TRX_RSEG_MAX_SIZE: 本回滚段管理的所有Undo页面链表中页面数量之和的上限
- TRX_RSEG_HISTORY_SIZE: History链表占用的页面数量
- TRX_RSEG_HISTORY: History链表的基结点
- TRX_RSEG_FSEG_HEADER: 本回滚段对应的10Byte 段头部信息，对应此段的INODE Entry
- TRX_RSEG_UNDO_SLOTS: 各个Undo页面链表的first undo page页号集合，即undo slot集合，共1024个

**策略**
- 如果某个undo slot指向的链表可重用，则处于被缓存状态，并根据类型加入insert/update undo cached两个缓存链表
- 分配重用Undo链表时，先从对应的缓存链表中找，没有空闲的再到回滚段头页面中找
- 为了提高事务并发效率，MySQL定义了128个回滚段，对应128个回滚段头，段头地址存放在系统表空间第5号页面中。其中
  - 第0号、第33~127号属于一类，用于对普通表的分配
  - 第1~32号属于一类，用于对临时表的分配
  - 区别处理的原因在于修改普通表回滚段中的Undo页面需要记录对应的Redo日志，而临时表不需要
  - 段的数量由innodb_rollback_segments控制

![多个回滚段](/img/多个回滚段.png)



## MVVC

MVCC 全称 Multi-Version Concurrency Control 多版本并发控制。指维护一个数据的多个版本，使得读写操作没有冲突。MVCC的具体实现依赖于**记录中的隐式字段、Undo Log、ReadView**三部分。  

### 版本链
前面提到过，对记录的删改操作对应的Undo日志里有old roll pointer字段指向旧的Undo日志，从而构成一个记录的版本链。链表的头部就是当前记录的最新值。

![undo_log_版本链](/img/undo_log_版本链.png)


### ReadView
- 对于READ_UNCOMMITTED隔离级别，不禁止不可重复读，读取记录时直接查看最新版本

- 对于Serializable隔离级别，MySQL使用锁机制避免不可重复读问题

- 而对于READ_COMMITTED和REPEATABLE_READ，需要判断版本链中哪个版本是当前事务可见的，为此提出了ReadView。ReadView含四个部分，其中： 
  | 字段 | 含义 |
  |---|---|
  | m_ids  | 生成ReadView时系统中活跃的读写事务的id列表 |
  | min_trx_id | 生成ReadView时系统中活跃的读写事务最小id |
  | max_trx_id | 生成ReadView时系统应分配给下一个事务的id值（最大活跃事务id+1） |
  | creator_trx_id | 生成该ReadView的事务id（仅实际增删改时才分配，只读事务id默认0） |


**访问规则**
有了ReadView后，查询过程会顺着版本链遍历，根据ReadView的访问规则，直到找到一条可访问的版本，或不含该记录。其中，trx_id为被访问版本的trx_id属性值：
| 条件 | 是否可以访问 | 说明 |
  |---|---|---|
  | trx_id == creator_trx_id  | 可以访问该版本 | 成立，说明数据是当前事务自己更改的 |
  | trx_id < min_trx_id | 可以访问该版本 | 成立，说明该版本在当前事务生成ReadView前已经提交 |
  | trx_id > max_trx_id | 不可以访问该版本 | 成立，说明该版本在当前事务生成ReadView后才开启 |
  | min_trx_id <= trx_id <= max_trx_id | 如果trx_id在m_ids中，不可以访问；否则可以访问 | m_ids存在trx_id则说明该事务还是活跃的，不存在则说明该事务已提交 |


**生成时机**
对于READ_COMMITTED和REPEATABLE_READ，最大的区别在于它们生成ReadView的时机不同。也正因此，READ_COMMITTED无法禁止不可重复读问题。
- READ_COMMITTED事务每次SELECT查询前都会生成独立的ReadView
- REPEATABLE_READ事务只在第一次SELECT查询前生成一个共享的ReadView

 
另外，为了支持MVCC，insert undo日志在事务提交后即可释放，而update undo日志不能立即删除；删除时需要分两阶段，第一阶段仅做delete mark。



## 锁机制⭐

See: [MySQL 锁机制](MySQL-Lock.md)