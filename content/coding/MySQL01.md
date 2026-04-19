---
title: MySQL 基础
date: 2022-12-03
---
## 概述
| 名称 | 简介 |
| :----: | :---- |
| DB   | 存储数据的仓库，对数据进行有组织的存储 |
| DBMS | 操纵和管理数据库的大型软件 |
| SQL  | 操作关系型数据库的编程语言，定义了一套操作关系型数据库的统一标准 | 

**关系型数据库**：建立在关系模型基础上，由多张相互连接的二维表，即由行和列组成的表，构成的数据库

![数据模型](/img/数据模型.png)

启动MySQL：
```SQL 
# mysql.server -> mysqld_safe -> mysqld (服务端程序)
# 启动MySQL服务器进程
mysqld 
参数：
--skip-networking 禁止网络连接
--default-storage-engine=MyISAM 指定默认存储引擎
--defaults-extra-file=xxx.ini 指定外部配置文件
--defaults-file=xxx.cnf 指定配置文件，且不搜索默认配置文件
# Windows 启停 MySQL 系统服务
net start mysql
net stop mysql

# 连接MySQL
mysql [-h 127.0.0.1] [-P 3306] -u root -p
参数：
-h 主机IP
-P 端口号，默认3306
-u 用户名
-p 密码
```

## 体系结构

![MySQL架构图](/img/MySQL架构图.png)

- 连接层：
  最上层是一些客户端和链接服务，包含本地 sock 通信和大多数基于客户端/服务端工具实现的类似于TCP/IP的通信。主要完成一些类似于连接处理、授权认证、及相关的安全方案。在该层上引入了线程池的概念，为通过认证安全接入的客户端提供线程。同样在该层上可以实现基于SSL的安全链接。服务器也会为安全接入的每个客户端验证它所具有的操作权限。
- 服务层：
  第二层架构主要完成大多数的核心服务功能，如SQL接口，并完成缓存的查询，SQL的分析和优化，部分内置函数的执行。所有跨存储引擎的功能也在这一层实现，如 过程、函数等。在该层，服务器会解析查询并创建相应的内部解析树，并对其完成相应的优化如确定表的查询的顺序，是否利用索引等，最后生成相应的执行操作。如果是select语句，服务器还会查询内部的缓存，如果缓存空间足够大，这样在解决大量读操作的环境中能够很好的提升系统的性能。
- 引擎层：
  存储引擎层， 存储引擎真正的负责了MySQL中数据的存储和提取，服务器通过API和存储引擎进行通信。不同的存储引擎具有不同的功能，这样我们可以根据自己的需要，来选取合适的存储引擎。数据库中的索引是在存储引擎层实现的。
- 存储层：
  数据存储层， 主要是将数据(如: redolog、undolog、数据、索引、二进制日志、错误日志、查询日志、慢查询日志等)存储在文件系统之上，并完成与存储引擎的交互。

> MySQL插件式的存储引擎架构，将查询处理和其它的系统任务以及数据的存储提取分离。这种架构可以根据业务的需求和实际需要选择合适的存储引擎，可以在多种不同场景中应用并发挥良好作用。


**语句执行流程**

![MySQL简化架构](/img/MySQL简化架构.webp)

- 连接器：负责跟客户端建立连接、获取权限、维持和管理连接
  - 用户名密码验证通过后，连接器会到权限表中查出所拥有的权限（因此修改权限不会立即生效）
  `mysql -uroot -p`
- 查询缓存(仅适用于不常修改的数据，且 MySQL 8 中已经删除缓存模块)
- 分析器：词法分析、语法分析，例如识别表名、列名等
- 优化器：存在多个索引时决定使用哪个索引，或多表关联时决定表的连接顺序，以确定语句的执行计划
- 执行器：校验权限后，真正执行语句，将执行结果存入结果集，最后返回


## SQL

### 分类
| 名称|             全称           |                      简介                          |
| :--:| :------------------------- | :------------------------------------------------ |
| DDL | Data Definition Language   | 数据定义语言，用来定义数据库对象，如数据库、表、字段   |
| DML | Data Manipulation Language | 数据操作语言，用来对数据库表中的数据进行增删改         |
| DQL | Data Query Language        | 数据查询语言，用来查询数据库中表的记录                |
| DCL | Data Control Language      | 数据控制语言，用来创建数据库用户、控制数据库的控制权限  |


### DDL - 数据定义语言

#### 数据库操作
- 查询所有数据库:
`show databases;`
- 查询当前数据库：
`select database();`  
- 创建数据库：
`create database [if not exists] 数据库名 [default charset 字符集] [collate 排序规则]` 
- 删除数据库:
`drop database [if exists] 数据库名;`  
- 切换数据库：
`use 数据库名;`

注：UTF8字符集长度为3字节，有些符号占4字节，所以推荐用utf8mb4字符集


#### 表操作
- 查询当前数据库所有表：
`show tables;`  
- 查询表结构：
`desc 表名;`  
- 查询指定表的建表语句：
`show create table 表名;`  
- 创建表：
    ```SQL
    CREATE TABLE 表名(
        字段1 字段1类型 [COMMENT 字段1注释],
        字段2 字段2类型 [COMMENT 字段2注释],
        字段3 字段3类型 [COMMENT 字段3注释],
        ...
        字段n 字段n类型 [COMMENT 字段n注释]
    )[ COMMENT 表注释 ];
    ``` 
- 修改表名：
`ALTER TABLE 表名 RENAME TO 新表名`
- 删除表：
`DROP TABLE [IF EXISTS] 表名;`
- 删除表，并重新创建该表，相当于删除表中所有数据：
`TRUNCATE TABLE 表名;`

#### 字段操作
- 添加字段： 
`ALTER TABLE 表名 ADD 字段名 类型(长度) [COMMENT 注释] [约束];`  
例：`ALTER TABLE emp ADD nickname varchar(20) COMMENT '昵称';`

- 修改数据类型： 
`ALTER TABLE 表名 MODIFY 字段名 新数据类型(长度);`
 
- 修改字段名和字段类型： 
`ALTER TABLE 表名 CHANGE 旧字段名 新字段名 类型(长度) [COMMENT 注释] [约束];` 
例：将emp表的nickname字段修改为username，类型为varchar(30)  
`ALTER TABLE emp CHANGE nickname username varchar(30) COMMENT '昵称';`  

- 删除字段：
`ALTER TABLE 表名 DROP 字段名;`


### DML - 数据操作语言

#### 添加数据
- 指定字段： 
`INSERT INTO 表名 (字段名1, 字段名2, ...) VALUES (值1, 值2, ...);`  
- 全部字段： 
`INSERT INTO 表名 VALUES (值1, 值2, ...);`  

- 批量添加数据：   
`INSERT INTO 表名 (字段名1, 字段名2, ...) VALUES (值1, 值2, ...), (值1, 值2, ...), (值1, 值2, ...);`  
`INSERT INTO 表名 VALUES (值1, 值2, ...), (值1, 值2, ...), (值1, 值2, ...);`  

注：
+ 插入数据时，指定的字段顺序需要与值的顺序是一一对应的
+ 字符串和日期类型数据应该包含在引号中
+ 插入的数据大小应该在字段的规定范围内


#### 更新数据
`UPDATE 表名 SET 字段名1 = 值1, 字段名2 = 值2, ... [ WHERE 条件 ];`  
例：
`UPDATE employee SET name = '小昭', gender = '女' where id = 1;`

注: 没有条件语句则会修改整张表的所有数据

#### 删除数据
`DELETE FROM 表名 [ WHERE 条件 ];`
例：
`delete from employee where gender = '女';`

注：
- 没有条件语句则会删除整张表的所有数据
- DELETE语句不能删除某一个字段的值(可以使用UPDATE，将该字段值置为NULL即可)


### DQL - 数据查询语言
语法：
```sql
SELECT
	字段列表
FROM
	表名字段
WHERE
	条件列表
GROUP BY
	分组字段列表
HAVING
	分组后的条件列表
ORDER BY
	排序字段列表
LIMIT
	分页参数
```

#### 基础查询
- 查询多个字段：  
`SELECT 字段1, 字段2, 字段3, ... FROM 表名;`  
`SELECT * FROM 表名;`
注：* 表示查询所有字段，不直观且影响效率

- 设置别名：  
`SELECT 字段1 [ AS 别名1 ], 字段2 [ AS 别名2 ], ... FROM 表名;`  
`SELECT 字段1 [ 别名1 ], 字段2 [ 别名2 ], ... FROM 表名;`  

- 去除重复记录：  
`SELECT DISTINCT 字段列表 FROM 表名;`  


#### 条件查询
语法：  
`SELECT 字段列表 FROM 表名 WHERE 条件列表;`  

条件:
| 比较运算符          | 功能                                        |
| ------------------- | ------------------------------------------ |
| >                   | 大于                                        |
| >=                  | 大于等于                                    |
| <                   | 小于                                        |
| <=                  | 小于等于                                    |
| =                   | 等于                                        |
| <> 或 !=            | 不等于                                      |
| BETWEEN ... AND ... | 在某个范围内（含最小、最大值）                |
| IN(...)             | 在in之后的列表中的值，多选一                  |
| LIKE 占位符         | 模糊匹配（_匹配单个字符，%匹配任意个字符）     |
| IS NULL             | 是NULL                                      |

| 逻辑运算符          | 功能                         |
| ------------------ | --------------------------- |
| AND 或 &&          | 并且（多个条件同时成立）      |
| OR 或 &#124;&#124; | 或者（多个条件任意一个成立）  |
| NOT 或 !           | 非，不是                    |

例：  
```sql
-- 没有身份证
select * from employee where idcard is null or idcard = '';
-- 有身份证
select * from employee where idcard;
select * from employee where idcard is not null;
-- 年龄在20到30之间
select * from employee where age between 20 and 30;
select * from employee where age >= 20 and age <= 30;
-- 下面语句不报错，但查不到任何信息
select * from employee where age between 30 and 20;
-- 性别为女且年龄小于30
select * from employee where age < 30 and gender = '女';
-- 年龄等于25或30或35
select * from employee where age = 25 or age = 30 or age = 35;
select * from employee where age in (25, 30, 35);
-- 姓名为两个字
select * from employee where name like '__';
-- 身份证最后为X
select * from employee where idcard like '%X';
```


#### 聚合查询（聚合函数）
将一列数据作为一个整体，进行纵向计算。常见聚合函数有：

| 函数  | 功能     |
| ----- | ------- |
| count | 统计数量 |
| max   | 最大值   |
| min   | 最小值   |
| avg   | 平均值   |
| sum   | 求和     |

语法：
`SELECT 聚合函数(字段列表) FROM 表名;`
例：
`SELECT count(id) from employee where workaddress = "广东省";`
注：
- 如果指定列，那么该列的NULL值不参与所有的聚合函数运算
- 对于count聚合函数，统计符合条件的总记录数，还可以通过 count(数字/字符串)的形式进行统计查询


#### 分组查询
语法：  
`SELECT 字段列表 FROM 表名 [ WHERE 条件 ] GROUP BY 分组字段名 [ HAVING 分组后的过滤条件 ];`  

注：
- where 和 having 的区别：
  - 执行时机不同：where是分组之前进行过滤，不满足where条件不参与分组；having是分组后对结果进行过滤。
  - 判断条件不同：where不能对聚合函数进行判断，而having可以
- 分组之后，查询的字段一般为聚合函数和分组字段，查询其他字段无任何意义
- 执行顺序: where -> 聚合函数 -> having
- 支持多字段分组, 具体语法为 : group by columnA, columnB

例：
```sql
-- 根据性别分组，统计男性和女性数量
select gender, count(*) from employee group by gender;
-- 年龄小于45，并根据工作地址分组
select workaddress, count(*) from employee where age < 45 group by workaddress;
-- 年龄小于45，并根据工作地址分组，获取员工数量大于等于3的工作地址
select workaddress, count(*) address_count from employee where age < 45 group by workaddress having address_count >= 3;
```


#### 排序查询
语法：  
`SELECT 字段列表 FROM 表名 ORDER BY 字段1 排序方式1, 字段2 排序方式2;`

注：
- 排序方式：
  - ASC: 升序（默认）
  - DESC: 降序
- 如果是多字段排序，当第一个字段值相同时，才会根据第二个字段进行排序

例：
```sql
-- 两字段排序，根据年龄升序排序，入职时间降序排序(如果年龄相同那么就按这个)
SELECT * FROM employee ORDER BY age ASC, entrydate DESC;
```

#### 分页查询
语法：  
`SELECT 字段列表 FROM 表名 LIMIT 起始索引, 查询记录数;`  

注：
- 起始索引从0开始，起始索引 = （查询页码 - 1） * 每页显示记录数
- 分页查询是数据库的方言，不同数据库有不同实现，MySQL是LIMIT
- 如果查询的是第一页数据，起始索引可以省略，直接简写 LIMIT 10

例：
```sql
-- 查询第一页数据，展示10条
SELECT * FROM employee LIMIT 10;
-- 查询第二页
SELECT * FROM employee LIMIT 10, 10;
```


#### DQL执行顺序
**FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT**

![DQL执行顺序](/img/DQL执行顺序.png)



### DCL - 数据控制语言

#### 用户管理
- 查询用户：
`SELECT * FROM mysql.user;`

- 创建用户:  
`CREATE USER '用户名'@'主机名' IDENTIFIED BY '密码';`

- 修改用户密码：  
`ALTER USER '用户名'@'主机名' IDENTIFIED WITH mysql_native_password BY '新密码';`

- 删除用户：  
`DROP USER '用户名'@'主机名';`

注：
- 在MySQL中需要通过`用户名@主机名`的方式，来唯一标识一个用户
- 主机名可以使用 % 通配

例：
```sql
-- 创建用户test，只能在当前主机localhost访问
create user 'test'@'localhost' identified by '123456';
-- 创建用户test，能在任意主机访问
create user 'test'@'%' identified by '123456';
create user 'test' identified by '123456';
```

#### 权限控制

常用权限：
| 权限                | 说明               |
| ------------------- | ------------------ |
| ALL, ALL PRIVILEGES | 所有权限           |
| SELECT              | 查询数据           |
| INSERT              | 插入数据           |
| UPDATE              | 修改数据           |
| DELETE              | 删除数据           |
| ALTER               | 修改表             |
| DROP                | 删除数据库/表/视图 |
| CREATE              | 创建数据库/表      |

- 查询权限：  
`SHOW GRANTS FOR '用户名'@'主机名';`

- 授予权限：  
`GRANT 权限列表 ON 数据库名.表名 TO '用户名'@'主机名';`

- 撤销权限：  
`REVOKE 权限列表 ON 数据库名.表名 FROM '用户名'@'主机名';`

注：
- 多个权限用逗号分隔
- 授权时，数据库名和表名可以用 * 进行通配，代表所有




## 函数

函数是指一段可以直接被另外一段程序调用的程序或代码，主要分字符串函数、数值函数、日期函数、流程函数四类。

### 字符串函数
常用函数：
|             函数            |                          功能                         |
| --------------------------- | ----------------------------------------------------- |
| CONCAT(s1, s2, ..., sn)     | 字符串拼接，将s1, s2, ..., sn拼接成一个字符串            |
| LOWER(str)                  | 将字符串全部转为小写                                    |
| UPPER(str)                  | 将字符串全部转为大写                                    |
| LPAD(str, n, pad)           | 左填充，用字符串pad对str的左边进行填充，达到n个字符串长度  |
| RPAD(str, n, pad)           | 右填充，用字符串pad对str的右边进行填充，达到n个字符串长度  |
| TRIM(str)                   | 去掉字符串头部和尾部的空格                               |
| SUBSTRING(str, start, len)  | 返回从字符串str从start位置起的len个长度的字符串           |

使用示例：
```sql
-- 拼接
SELECT CONCAT('Hello', 'World');
-- 小写
SELECT LOWER('Hello');
-- 大写
SELECT UPPER('Hello');
-- 左填充
SELECT LPAD('01', 5, '-');
-- 右填充
SELECT RPAD('01', 5, '-');
-- 去除空格
SELECT TRIM(' Hello World ');
-- 切片（起始索引为1）
SELECT SUBSTRING('Hello World', 1, 5);
```

### 数值函数
常用函数：
|     函数    |              功能             |
| ----------- | ----------------------------- |
| CEIL(x)     | 向上取整                       |
| FLOOR(x)    | 向下取整                       |
| MOD(x, y)   | 返回x/y的模                    |
| RAND()      | 返回0~1内的随机数               |
| ROUND(x, y) | 求参数x的四舍五入值，保留y位小数 |

使用示例：
```sql
-- 向上取整
select ceil(1.1);
-- 向下取整
select floor(1.9);
-- 取模
select mod(7, 4);
-- rand
select rand();
-- round
select round(2.344, 2);

-- 生成6位随机验证码
select lpad(round(rand() * 1000000, 0), 6, '0);
```

### 日期函数
常用函数：
|                  函数              |                         功能                  |
| ---------------------------------- | --------------------------------------------- |
| CURDATE()                          | 返回当前日期                                   |
| CURTIME()                          | 返回当前时间                                   |
| NOW()                              | 返回当前日期和时间                              |
| YEAR(date)                         | 获取指定date的年份                              |
| MONTH(date)                        | 获取指定date的月份                              |
| DAY(date)                          | 获取指定date的日期                              |
| DATE_ADD(date, INTERVAL expr type) | 返回一个日期/时间值加上一个时间间隔expr后的时间值  |
| DATEDIFF(date1, date2)             | 返回起始时间date1和结束时间date2之间的天数        |

使用示例：
```sql
-- DATE_ADD
SELECT DATE_ADD(NOW(), INTERVAL 70 YEAR);
-- 获取日期差
select datediff('2022-10-01', '2022-12-01');
```

### 流程函数
常用函数：
|       函数    |      功能    |
| ------------ | ------------ |
| IF(value, t, f)         | 如果value为true，则返回t，否则返回f           |
| IFNULL(value1, value2)  | 如果value1不为空，返回value1，否则返回value2  |
| CASE WHEN [ val1 ] THEN [ res1 ] ... ELSE [ default ] END           | 如果val1为true，返回res1，... 否则返回default默认值       |
| CASE [ expr ] WHEN [ val1 ] THEN [ res1 ] ... ELSE [ default ] END  | 如果expr的值等于val1，返回res1，... 否则返回default默认值  |

使用示例：
```sql
-- if
select if(false, 'Ok', 'Error');
-- ifnull
select ifnull('Ok', 'Default');
select ifnull('', 'Default');
select ifnull(null, 'Default');
-- case when then else end
select 
    name, { case wordaddress when '北京' then '一线城市' when '上海' then '一线城市' else '二线城市' end } as '工作地址'
from 
    emp;
```


## 约束

### 概述
约束是用来作用于表中字段上的规则，用于限制存储在表中的数据。目的是为了保证数据库中的数据的正确性、有效性和完整性

分类：
| 约束  | 描述  | 关键字  |
| ------------ | ------------ | ------------ |
| 非空约束  | 限制该字段的数据不能为null  | NOT NULL  |
| 唯一约束  | 保证该字段的所有数据都是唯一、不重复的  | UNIQUE  |
| 主键约束  | 主键是一行数据的唯一标识，要求非空且唯一  | PRIMARY KEY  |
| 默认约束  | 保存数据时，如果未指定该字段的值，则采用默认值  | DEFAULT  |
| 检查约束（8.0.16版本后）  | 保证字段值满足某一个条件  | CHECK  |
| 外键约束  | 让两张图的数据之间建立连接，保证数据的一致性和完整性  | FOREIGN KEY  |


示例:
```sql
CREATE TABLE tb_user(
  id int AUTO_INCREMENT PRIMARY KEY COMMENT 'ID唯一标识',
  name varchar(10) NOT NULL UNIQUE COMMENT '姓名' ,
  age int check(age > 0 && age <= 120) COMMENT '年龄' ,
  status char(1) default '1' COMMENT '状态',
  gender char(1) COMMENT '性别'
);
```

### 外键
让两张表的数据之间建立连接，从而保证数据的一致性和完整性。
- 添加外键
  ```sql
  -- 创建表时设置外键
  CREATE TABLE 表名(
    字段名 字段类型,
    ...
    [CONSTRAINT] [外键名称] FOREIGN KEY(外键字段名) REFERENCES 主表(主表列名)
  );

  -- 对已有的表添加外键
  ALTER TABLE 表名 ADD CONSTRAINT 外键名称 FOREIGN KEY (外键字段名) REFERENCES 主表(主表列名);
  -- 示例
  alter table emp add constraint fk_emp_dept_id foreign key(dept_id) references dept(id);  
  ```

- 删除外键
  ```sql  
  ALTER TABLE 表名 DROP FOREIGN KEY 外键名;
  -- 示例
  alter table emp drop foreign key fk_emp_dept_id;
  ```

- 删除/更新行为
  语法：  
  `ALTER TABLE 表名 ADD CONSTRAINT 外键名称 FOREIGN KEY (外键字段) REFERENCES 主表名(主表字段名) ON UPDATE 行为 ON DELETE 行为;`

  其中，行为包括以下5种：
  |    行为   |      说明    |
  | --------- | ------------ |
  | NO ACTION | 当在父表中删除/更新对应记录时，首先检查该记录是否有对应外键，如果有则不允许删除/更新（与RESTRICT一致）  |
  | RESTRICT  | 当在父表中删除/更新对应记录时，首先检查该记录是否有对应外键，如果有则不允许删除/更新（与NO ACTION一致）  |
  | CASCADE   | 当在父表中删除/更新对应记录时，首先检查该记录是否有对应外键，如果有则也删除/更新外键在子表中的记录  |
  | SET NULL  | 当在父表中删除/更新对应记录时，首先检查该记录是否有对应外键，如果有则设置子表中该外键值为null（要求该外键允许为null） |
  | SET DEFAULT  | 父表有变更时，子表将外键设为一个默认值（Innodb不支持）  |

  默认值是 **No Action**

 

## 多表

### 多表关系
- 一对多
  - 例如：一个部门对应多个员工
  - 实现：在多的一方建立外键，指向一的一方的主键
- 多对多
  - 例如：一个学生可以选多门课程，一门课程也可以被多个学生选修  
  - 实现：建立第三张中间表，中间表至少包含两个外键，分别关联两方主键  
- 一对一
  - 例如：一个用户仅对应一个用户详情。常用于单表拆分，以提升操作效率
  - 实现：在任意一方加入外键，关联另外一方的主键，并且设置外键为唯一的（UNIQUE）


### 合并查询
笛卡尔积：两个集合A集合和B集合的所有组合情况。在多表查询时，需要消除无效的笛卡尔积 
`select * from employee, dept where employee.dept = dept.id;`


### 内连接查询
- 内连接查询的是两张表交集的部分
- 隐式内连接：  
  `SELECT 字段列表 FROM 表1, 表2 WHERE 条件 ...;`   
- 显式内连接：  
  `SELECT 字段列表 FROM 表1 [ INNER ] JOIN 表2 ON 连接条件 ...;`  
- 通常显式性能比隐式高

例子：
```sql
-- 查询员工姓名，及关联的部门的名称
-- 隐式
select e.name, d.name from employee as e, dept as d where e.dept = d.id;
-- 显式
select e.name, d.name from employee as e inner join dept as d on e.dept = d.id;
```


### 外连接查询
- 左外连接：  
  - 查询左表所有数据，以及两张表交集部分数据。相当于查询表1的所有数据，并包含表1和表2交集部分的数据  
  `SELECT 字段列表 FROM 表1 LEFT [ OUTER ] JOIN 表2 ON 条件 ...;`  

- 右外连接：  
  - 查询右表所有数据，以及两张表交集部分数据。相当于查询表2的所有数据，并包含表1和表2交集部分的数据。
  `SELECT 字段列表 FROM 表1 RIGHT [ OUTER ] JOIN 表2 ON 条件 ...;`  

例子：
```sql
-- 两条语句效果一样。左外和右外可以互相转换
-- 左外 
select d.name, e.* from dept d left outer join emp e on e.dept = d.id;
-- 右外
select d.name, e.* from employee e right outer join dept d on e.dept = d.id;  
```


### 自连接查询
- 当前表与自身的连接查询，必须使用表别名
- 自连接查询，可以是内连接查询，也可以是外连接查询
  `SELECT 字段列表 FROM 表A 别名A JOIN 表A 别名B ON 条件 ...;`  

例子：
```sql  
-- 查询员工及其所属领导的名字  
select a.name, b.name from employee a, employee b where a.manager = b.id;  
-- 没有领导的也查询出来  
select a.name, b.name from employee a left join employee b on a.manager = b.id;  
```


### 联合查询 union, union all
- 把多次查询的结果合并，形成一个新的查询结果
- 联合的多个查询结果的列数、字段类型必须保持一致
- union all直接将结果合并，而union会自动去重
- 联合查询比使用or效率高，不会使索引失效
```sql
SELECT 字段列表 FROM 表A ...
UNION [ALL]
SELECT 字段列表 FROM 表B ...
```


### 子查询
- SQL语句中嵌套SELECT语句，称谓嵌套查询，又称子查询。
- 子查询外部的语句可以是 INSERT / UPDATE / DELETE / SELECT 的任何一个 

+ 根据子查询结果可以分为：
  - 标量子查询（子查询结果为单个值）
  - 列子查询（子查询结果为一列）
  - 行子查询（子查询结果为一行）
  - 表子查询（子查询结果为多行多列）

- 根据子查询位置可分为：
  - WHERE 之后
  - FROM 之后
  - SELECT 之后

- 根据与外层查询关系可分为：
  - 不相关子查询：子查询可以单独运行出结果，不依赖于外层查询
  - 相关子查询：子查询的执行依赖于外层查询的值

#### 标量子查询
- 子查询返回的结果是单个值，如数字、字符串、日期等。  
- 常用操作符：`= <> > >= < <=`

例子：
```sql
-- 查询销售部所有员工
select id from dept where name = '销售部';
-- 根据销售部部门ID，查询员工信息
select * from employee where dept = 4;
-- 合并（子查询）
select * from employee where dept = (select id from dept where name = '销售部');
```

#### 列子查询
- 返回的结果是一列（可以是多行）。  
- 常用操作符：  
  | 操作符  | 描述  |
  | ------- | ------------------------------------ |
  | IN      | 在指定的集合范围内，多选一             |
  | NOT IN  | 不在指定的集合范围内                   |
  | ANY     | 子查询返回列表中，有任意一个满足即可     |
  | SOME    | 与ANY等同，使用SOME的地方都可以使用ANY  |
  | ALL     | 子查询返回列表的所有值都必须满足        |

例子：
```sql  
-- 查询比财务部所有人工资都高的员工信息
select * from employee where salary > all(select salary from employee where dept = (select id from dept where name = '财务部'));
-- 查询比研发部任意一人工资高的员工信息
select * from employee where salary > any(select salary from employee where dept = (select id from dept where name = '研发部'));
```

#### 行子查询
- 返回的结果是一行（可以是多列）
- 常用操作符：`=, <, >, IN, NOT IN`

例子：
```sql
-- 查询与xxx的薪资及直属领导相同的员工信息  
select * from employee where (salary, manager) = (12500, 1);  
select * from employee where (salary, manager) = (select salary, manager from employee where name = 'xxx');
```

#### 表子查询
- 返回的结果是多行多列  
- 常用操作符：IN  

例子：
```sql
-- 查询与xxx1，xxx2的职位和薪资相同的员工
select * from employee where (job, salary) in (select job, salary from employee where name = 'xxx1' or name = 'xxx2');
-- 查询入职日期是2006-01-01之后的员工，及其部门信息
select e.*, d.* from (select * from employee where entrydate > '2006-01-01') as e left join dept as d on e.dept = d.id;
```


## SQL性能分析

- **执行频率**
  ```sql
  SHOW GLOBAL STATUS LIKE 'Com_______';
  ```

- **慢查询日志**
  指定SQL语句执行时间超过某个时间，就被视为慢查询，并记录下日志

  ```sql
  -- 开启MySQL慢日志查询开关
  slow_query_log=1
  -- 设置超时时间为2秒
  long_query_time=2
  ```

- **profile**
  在SQL优化时分析具体的时间开销
  
  ```sql
  -- have_profiling参数查看当前MySQL是否支持profile操作
  SELECT @@have_profiling;
  -- 开启profiling
  SET profiling = 1;

  -- 查看每一条SQL的耗时基本情况
  show profiles;
  -- 查看指定query_id的SQL语句各个阶段的耗时情况
  show profile for query query_id;
  -- 查看指定query_id的SQL语句的CPU使用情况
  show profile cpu for query query_id;
  ```

  


## SQL 优化

### insert 优化
- 批量插入数据，一次插入的数据不建议超过1000条，500 - 1000 为宜
- 手动控制事务
- 主键顺序插入，性能要高于乱序插入
- 大批量插入数据，如几百万条记录，使用insert性能较低。建议使用load指令将数据文件加载到数据表中
  ```sql
  -- 客户端连接服务端时，加上参数 -–local-infile
  mysql –-local-infile -u root -p
  -- 设置全局参数local_infile为1，开启从本地加载文件导入数据的开关
  set global local_infile = 1;
  select @@local_infile;

  -- 执行load指令将准备好的数据，加载到表结构中。字段间用逗号分割，行末添加换行
  load data local infile '/root/sql.dat' into table tb_user fields terminated by ',' lines terminated by '\n' ;
  ```


### 主键优化

在InnoDB存储引擎中，表数据都是根据主键按序组织存放的，这种存储方式的表称为索引组织表（Index Organized Table - IOT）。

行数据存储在聚集索引的叶子节点上，记录在逻辑结构Page页中，每个页的大小是有限的，因此如果插入的数据行row在该页存储不下，将会存储到下一页中，页与页之间通过指针连接。

![索引组织表](/img/索引组织表.png)

但是如果主键是乱序插入的话，就会导致需要插入的位置为一页中间的位置，可能需要进行页分裂。

- 页分裂：相邻页的空间都写满后，如果需要在中间插入一个新的数据行，必须对页进行分裂操作。
  
  ![页分裂1](/img/页分裂1.png)

  ![页分裂2](/img/页分裂2.png)

- 页合并：当删除一行记录时，实际上记录并没有被物理删除，只是被标记为删除，并且它的空间允许被其他记录使用。当页中删除的记录达到 MERGE_THRESHOLD（默认50%，可指定），InnoDB会开始寻找邻近页，看是否可以将多个页合并以优化空间使用。

  ![页合并1](/img/页合并1.png)
  
  ![页合并2](/img/页合并2.png)

**主键设计原则：**
- 满足业务需求的情况下，尽量降低主键的长度。二级索引的叶子节点保存的就是主键，所以主键小占用的空间也就会少。
- 插入数据时，尽量选择顺序插入，尽量使用 AUTO_INCREMENT 自增主键
- 尽量不要使用 UUID 做主键或者是其他的自然主键，如身份证号，占用空间大。
- 业务操作时，避免对主键的修改


### order by 优化

- Using filesort：通过表的索引或全表扫描，读取满足条件的数据行，然后在排序缓冲区 sort buffer 中完成排序操作。所有不是通过索引直接返回排序结果的排序都叫 FileSort 排序，性能较低。
- Using index：通过有序索引顺序扫描直接返回有序数据。借助已经有序的索引，不需要额外排序，因此性能高。

> 如果order by的字段存在索引，符合索引的排序顺序，且遵守最左前缀法则，则会直接using index，否则using filesort。

**准则：**
- 根据排序字段建立合适的索引，多字段排序时，也遵循最左前缀法则
- 尽量使用覆盖索引
- 多字段排序需要注意联合索引在创建时的规则（ASC/DESC）
- 如果不可避免出现filesort，大数据量排序时，可以适当增大排序缓冲区大小 sort_buffer_size（默认256k）


### group by 优化
- 在分组操作时，可以通过索引来提高效率，尽量规避 using temporary 的分组
- 分组操作时，索引的使用也满足最左前缀法则


### limit 优化
在数据量比较大时，如果进行limit分页查询，在查询时，越往后，分页查询效率越低。如`limit 2000000, 10`，此时需要 MySQL 排序前2000000条记录，但仅仅返回2000000 - 2000010的记录，其他记录丢弃，查询排序的代价非常大。

优化方案：一般分页查询时，通过创建覆盖索引能够提高性能，可以通过覆盖索引加子查询的形式进行优化

例如：
```sql
-- 此语句耗时很长
select * from tb_sku limit 9000000, 10;
-- 通过覆盖索引加快速度，直接通过主键索引进行排序及查询
select id from tb_sku order by id limit 9000000, 10;
-- 下面的语句会报错，因为 MySQL 不支持 in 子句里面使用 limit
-- select * from tb_sku where id in (select id from tb_sku order by id limit 9000000, 10);
-- 通过连表查询即可实现第一句的效果，并且能达到第二句的速度
select * from tb_sku as s, (select id from tb_sku order by id limit 9000000, 10) as a where s.id = a.id;
```


### count 优化
如果数据量很大，执行count操作是非常耗时的。不同存储引擎的 count 实现机制不同：
- MyISAM 引擎把一个表的总行数存在了磁盘上，因此执行 count(*) 的时候会直接返回这个数，效率很高（不使用带条件的count）
- InnoDB 在执行 count(*) 时，需要把数据一行一行地从引擎里面读出来，然后累积计数。  

优化方案：自己计数，如创建key-value表存储在内存或硬盘，或者用redis  

**count的用法：**
对于一个row，如果count函数的参数对应的字段不是NULL，累计值就加一，最后返回累计值。

| 用法  | 含义 |
|---|---|
| count(主键) | InnoDB引擎会遍历整张表，把每行的主键id值都取出来，返回给服务层，服务层拿到主键后，直接按行进行累加（主键自然不可能为null） |
| count(字段) | 没有not null约束的话，InnoDB引擎会遍历整张表把每一行的字段值都取出来，返回给服务层，服务层判断是否为null，不为null，计数累加；有not null约束的话，InnoDB引擎会遍历整张表把每一行的字段值都取出来，返回给服务层，直接按行进行累加 |
| count(1) | InnoDB 引擎遍历整张表，但不取值。服务层对于返回的每一层，放一个数字 1 进去，直接按行进行累加 |
| count(\*) | InnoDB 引擎并不会把全部字段取出来，而是专门做了优化，不取值，服务层直接按行进行累加 |

由于主键必然非空，因此count(主键) = count(\*) = count(1)，而 count(null) 返回0
性能排序：count(字段) < count(主键) < count(1) < count(\*)，所以尽量使用 count(\*)


### update 优化
执行删、改操作会对数据进行加锁，且行锁的性能高于表锁。InnoDB 的行锁是针对索引加锁，并且该索引不能失效，否则会从行锁升级为表锁。因此建议尽量使用覆盖索引。

如以下两条语句：
`update student set no = '123' where id = 1;` 此SQL由于id有主键索引，所以只会锁这一行；  
`update student set no = '123' where name = 'test';` 此SQL由于name没有索引，所以会把整张表都锁住进行数据更新。


## 视图

视图（View）是一种虚拟存在的表。视图中的数据并不实际存储在数据库中，数据来自定义视图的查询中使用的表(称为基表)，并且在使用视图时动态生成。通俗的讲，视图只保存了查询的SQL逻辑，不保存查询结果。所以在创建视图时，主要工作落在创建SQL查询语句上。  

### 语法
- 创建视图
  `CREATE [ OR REPLACE ] VIEW 视图名称[(列名列表)] AS SELECT语句 [ WITH [ CASCADED | LOCAL ] CHECK OPTION ]`  
  如：`create or replace view stu_wll as select id, name from student where id <= 10;`

- 查看所有视图
  `show table status where comment='view';`
- 查看创建视图语句
  `SHOW CREATE VIEW 视图名称;`

- 查看视图数据
  `SELECT * FROM 视图名称;`

- 修改视图
  - `CREATE[OR REPLACE] VIEW 视图名称[(列名列表)] AS SELECT 语句[ WITH[ CASCADED | LOCAL ] CHECK OPTION ]`
  - `ALTER VIEW 视图名称 [(列名列表)] AS SELECT语句 [WITH [CASCADED | LOCAL] CHECK OPTION]`
  如：`alter view stu_v_1 as select id, name from student where id <= 10;`

- 删除视图
  `DROP VIEW [IF EXISTS] 视图名称 [, 视图名称 ... ]`


### 检查选项

MySQL允许一个视图依赖另一个视图，无论是否使用`WITH CHECK OPTION`，都会向下查询所依赖视图中的规则以保持一致性。
如果使用`WITH CHECK OPTION`创建视图，MySQL会通过视图检查正在更改的每个行，例如插入，更新，删除，以使其符合视图的定义。CASCADED (默认) 和 LOCAL 限定了检查的范围。

- CASCADED - 级联
  自该视图起，向下所依赖视图的规则都将进行检查。
  ```sql
  -- 比如下面的例子：创建stu_V_l 视图，id是小于等于 20的。  
  create or replace view stu_V_l as select id,name from student where id <=20;
  -- 再创建 stu_v_2 视图，20 >= id >=10。  
  create or replace view stu_v_2 as select id,name from stu_v_1 where id >=10 with cascaded check option;
  -- 再创建 stu_v_3 视图。     
  create or replace view stu_v_3 as select id,name from stu_v_2 where id<=15; 
  -- 这条数据能够成功，stu_v_3 没有开检查选项所以不会判断 id 是否小于等于15。但是stu_v_2的check option是级联的，因此会检查 stu_v_2 以及 stu_v_1 的条件。  
  insert into stu_v_3 values(17,'Tom');
  ```
  ![cascade_cp](/img/cascade_cp.png)

- LOCAL - 本地
  仍会向下查询依赖视图的规则，但具体是否检查看各自视图的定义。
  ![local_cp](/img/local_cp.png)


### 更新条件

要使视图可更新，视图中的行与基表中的行之间必须存在一对一的关系。如果视图包含以下任何一项，则该视图不可更新：
- 聚合函数或窗口函数 (SUM()、MIN()、MAX()、COUNT() 等)
- DISTINCT
- GROUP BY
- HAVING
- UNION 或者 UNION ALL

### 作用
- 简单
  视图不仅可以简化用户对数据的理解，也可以简化他们的操作。那些被经常使用的查询可以被定义为视图，从而使得用户不必为以后的操作每次指定全部的条件。 
- 安全
  数据库可以授权，但不能授权到数据库特定行和特定的列上。通过视图可以让用户只能查询和修改他们所能见到的数据  
- 数据独立
  视图可帮助用户屏蔽真实表结构变化带来的影响。

> 总而言之，视图类似于给表加上一个外壳，用户通过这个外壳访问表的时候，只能按照所设计的方式进行访问与更新。



## 存储过程

### 概念

存储过程是事先经过编译并存储在数据库中的一段SQL语句的集合，即语言层面的代码封装与重用。调用存储过程可以简化应用开发人员的很多工作，减少数据在数据库和应用服务器之间的传输，提高数据处理的效率。

**特点:**
- 封装
- 复用
- 可以接收参数，也可以返回数据
- 减少网络交互，提升效率

### 基本语法
- 创建
  ```sql
	CREATE PROCEDURE 存储过程名称( [参数列表] ) 
	BEGIN
		SQL 语句 
	END;
  ```
  注: 在命令行中，执行创建存储过程的SQL时，需要通过关键字delimiter更换SQL语句的结束符。默认是分号作为结束符。

- 调用
  `CALL 名称 ([参数]);`

- 查看
  ```sql
  -- 查询指定数据库的存储过程及状态信息
  SELECT * FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = 'xxx';
  -- 查询某个存储过程的定义
  SHOW CREATE PROCEDURE 存储过程名称;
  ```

- 删除
  `DROP PROCEDURE [ IF EXISTS ] 存储过程名称;`



### 控制语句
#### if
  ```sql
  IF 条件1 THEN
    .....
  ELSEIF 条件2 THEN   -- 可选
    .....
  ELSE -- 可选
    .....
  END IF;
  ```

#### 参数
  | 类型  | 含义 | 备注 |
  |---|---|---|
  | IN  | 该类参数作为输入，调用时需要传入值     | 默认 |
  | OUT | 该类参数作为输出，作为调用的返回值 |      |
  | INOUT | 既可以作为输入参数，也可以作为输出参数     |     |

  示例：
  ```sql
  create procedure p4(in score int, out result varchar(10))
  begin
    if score >= 85 then
      set result := '优秀';
    elseif score >= 60 then
      set result := '及格';
    else
      set result := '不及格';
    end if;
  end;

  call p4(18, @result);
  select @result;

  create procedure p5(inout score double)
  begin
    set score := score * 0.5;
  end;

  set @score = 198;
  call p5(@score);
  select @score;
  ```

#### case
  ```sql
  -- 语法1 - 值判断
  CASE case_value
    WHEN when_value1 THEN statement_list1
    [ WHEN when_value2 THEN statement_list2] ...
    [ ELSE statement_list ]
  END CASE;

  -- 语法2 - 逻辑判断
  CASE
    WHEN search_condition1 THEN statement_list1
    [WHEN search_condition2 THEN statement_list2] ...
    [ELSE statement_list]
  END CASE;

  -- 注：如果判定条件有多个，多个条件之间可以使用 and 或 or 进行连接。
  ```

#### 循环
  ```sql
  -- while - 先判定条件，如果条件为true，则执行逻辑，否则，不执行逻辑
  WHILE 条件 DO
    SQL逻辑...
  END WHILE;

  -- repeat - 先执行一次逻辑，然后判定UNTIL条件是否满足，如果满足，则退出。如果不满足，则继续下一次循环
  REPEAT
    SQL逻辑...
    UNTIL 条件
  END REPEAT;

  -- loop - 配合leave, iterate使用
  [label:] LOOP
    SQL逻辑...

    -- 退出指定标记的循环体
    leave lable;
    -- 直接进入下一次循环
    iterate lable;
  END LOOP [label];
  ```

### 游标
游标（CURSOR）是用来存储查询结果集的数据类型，在存储过程和函数中可以使用游标对结果集进行循环的处理。

- 声明游标：
  `DECLARE 游标名称 CURSOR FOR 查询语句`

- 打开游标：
  `OPEN 游标名称`

- 获取游标记录：
  `FETCH 游标名称 INTO 变量 [ ,变量 ]`

- 关闭游标
  ` CLOSE 游标名称`

**条件处理程序：**
条件处理程序（Handler）可以用来定义在流程控制结构执行过程中遇到问题时相应的处理步骤。
具体语法为：  
`DECLARE handler_action HANDLER FOR condition_value [, condition value] ... statement`
其中，handler_action 的取值有：
- CONTINUE：继续执行当前程序
- EXIT：终止执行当前程序

condition_value 的取值有:
- `SQLSTATE sqlstate_value`：指定状态码，如02000
- `SQLWARNING`：所有以01开头的SQLSTATE代码的简写
- `NOT FOUND`：所有以02开头的SQLSTATE代码的简写
- `SQLEXCEPTION`：所有没被 SQLWARNING 或 NOT FOUND 捕获的SQLSTATE代码的简写

示例：
根据传入的参数uage，来查询用户表tb_user中，所有的用户年龄小于等于uage的用户姓名（name）和专业（profession），并将用户的姓名和专业插入到所创建的一张新表（id，name，profession）中。
```sql
create procedure p1l(in uage int)
  begin
    -- 注：必须先声明普通变量，再声明游标
    declare uname varchar(100); 
    decLare upro varchar(100);
    -- 声明游标
    declare u_cursor cursor for select name,profession from tb_user where age <= uage; 

    -- 当条件处理程序的处理的状态码为02000的时候，就会退出。
    declare exit handler for SQLSTATE '02000' close u_cursor;

    drop table if exists tb_user_pro; 
    create table if not exists tb_user_pro(
      id int primary key auto_increment, 
      name varchar(100), 
      profession varchar(100)
    );
    -- 开启游标
    open u_cursor;
    
    while true do
      -- 获取游标中的记录
      fetch u_cursor into uname,Upro;
      insert into tb_user_pro values(null, uname, upro); 
    end while;

    close u_cursor;
  end;
```


## 存储函数
存储函数是有返回值的存储过程，存储函数的参数只能是 IN 类型。但一般都可以用存储过程替换。

**语法：**
```sql
CREATE FUNCTION 存储函数名称 ([ 参数列表 ])
RETURNS type [characteristic ...]
BEGIN
  -- SQL语句
  RETURN ...;
END ;
```

其中，characteristic可选值有：
- DETERMINISTIC：相同的输入参数总是产生相同的结果
- NO SQL ：不包含 SQL 语句。
- READS SQL DATA：包含读取数据的语句，但不包含写入数据的语句。


## 触发器

触发器是与表有关的数据库对象，指在insert/update/delete之前或之后，触发并执行触发器中定义的SQL语句集合。触发器的这种特性可以协助应用在数据库端确保数据的完整性，日志记录，数据校验等操作。   

触发器使用别名OLD和NEW来引用触发器中发生变化的记录内容。目前MySQL触发器只支持行级触发，不支持语句级触发，即变化的行数就是触发器执行的次数。

| 触发器类型      |                     NEW 和 OLD               			      | 
| -------------  | ------------------------------------------------------- |
| INSERT         | NEW 表示将要或者已经新增的数据              		       		 | 
| UPDATE         | OLD表示修改之前的数据，NEW表示将要或已经修改后的数据        |
| DELETE         | OLD表示将要或者已经删除的数据                             |

示例：
```sql
-- 创建
CREATE TRIGGER trigger_name
BEFORE/AFTER INSERT/UPDATE/DELETE
ON tbl_name FOR EACH ROW -- 行级触发器
BEGIN
  trigger_stmt;
END;

-- 查看
SHOW TRIGGERS;

-- 删除
DROP TRIGGER [schema_name.]trigger_name;
```



## InnoDB 引擎架构

**InnoDB整体业务逻辑：**
  当业务操作的时候直接操作的是内存缓冲区，如果缓冲区当中没有数据，则会从磁盘中加载到缓冲区，增删改查都是在缓冲区的，后台线程以一定的速率刷新到磁盘。

![InnoDB存储架构](/img/InnoDB存储架构.png)

### 内存结构

![InnoDB内存结构](/img/InnoDB内存结构.png)

- **Buffer Pool**
  缓冲池是主内存中的一个区域，可以缓存磁盘上经常操作的数据。在执行增删改查操作时，先操作缓冲池中的数据（若缓冲池没有数据，则从磁盘加载并缓存），然后再以一定频率刷新到磁盘，从而减少磁盘I0，加快处理速度。
    
  缓冲池以Page页为单位，底层采用链表数据结构管理Page。根据状态将Page分为三种类型：
  - free page：空闲page，未被使用
  - clean page：被使用的page，数据没有被修改过
  - dirty page：脏页，被使用过，且数据被修改过，即内存数据和磁盘数据不一致

- **Change Buffer**
  更改缓冲区，针对非唯一二级索引页。在执行DML语句时，如果这些数据Page没有在Buffer Pool中，不会直接操作磁盘，而会将数据变更记录在 Change Buffer 中，在未来数据被读取时，再将数据合并恢复到Buffer Pool中，再将合并后的数据刷新到磁盘中。

  与聚集索引不同，二级索引通常是非唯一的，并且以相对随机的顺序插入二级索引。同样，删除和更新可能会影响索引树中不相邻的二级索引页，如果每一次都操作磁盘，会造成大量的磁盘IO。有了 ChangeBuffer 之后，我们可以在缓冲池中进行合并处理，减少磁盘IO。

- **Adaptive Hash Index**
  自适应hash索引，用于优化对Buffer Pool数据的查询。MySQL的innoDB引擎中虽然没有直接支持hash索引，但是给我们提供了自适应hash索引。hash索引在进行等值匹配时，一般性能是要高于B+树的，但是hash索引不适合做范围查询、模糊匹配等。InnoDB存储引擎会监控对表上各索引页的查询，如果观察到在特定的条件下hash索引可以提升速度，则建立hash索引，称之为自适应hash索引。

  InnoDB的自适应哈希索引，无需人工干预，由系统根据情况自动完成。

- **Log Buffer**
  日志缓冲区，用于保存要写入到磁盘中的log日志数据（redo log 、undo log）。默认大小为16MB，日志缓冲区的日志会定期刷新到磁盘中。如果需要更新、插入或删除多行的事务，增加日志缓冲区的大小可以节省磁盘 I/O。

  涉及参数：
  - innodb_log_buffer_size 缓冲区大小
  - innodb_flush_log_at_trx_commit 日志刷新到磁盘时机，取值有三个：
    - 0：每秒将日志写入并刷新到磁盘一次
    - 1：默认值，日志在每次事务提交时写入并刷新到磁盘
    - 2：日志在每次事务提交后写入，并每秒刷新到磁盘一次


### 磁盘结构

![InnoDB磁盘结构](/img/InnoDB磁盘结构.png)

- System Tablespace
  系统表空间是更改缓冲区的存储区域。如果表是在系统表空间而不是每个表文件或通用表空间中创建的，它也可能包含表和索引数据。参数 innodb_data_file_path，默认文件为ibdata1。

- File-Per-Table Tablespaces
  如果开启了innodb_file_per_table开关，则每个表的文件表空间包含单个InnoDB表的数据和索引 ，并存储在文件系统上的单个数据文件中。

- General Tablespaces
  通用表空间，需要通过 CREATE TABLESPACE 语法创建通用表空间，在创建表时，可以指定该表空间。
  ```sql
  -- 创建表空间
  CREATE TABLESPACE ts_name ADD DATAFILE 'file_name' ENGINE = engine_name;
  -- 创建表时指定表空间
  CREATE TABLE xxx ... TABLESPACE ts_name;
  ```

- Undo Tablespaces
  撤销表空间，MySQL实例在初始化时会自动创建两个默认的undo表空间（初始大小16M），用于存储undo log日志。

- Temporary Tablespaces
  InnoDB 使用会话临时表空间和全局临时表空间，存储用户创建的临时表等数据。

- Doublewrite Buffer Files
  双写缓冲区，InnoDB引擎将数据页从Buffer Pool刷新到磁盘前，先将数据页写入双写缓冲区文件中，便于系统异常时恢复数据。

- Redo Log
  重做日志，是用来实现事务的持久性。该日志文件由两部分组成：重做日志缓冲（redo log buffer）以及重做日志文件（redo log），前者是在内存中，后者在磁盘中。当事务提交之后会把所有修改信息存到该日志中, 用于在刷新脏页到磁盘发生错误时, 进行数据恢复。


### 后台线程
在InnoDB的后台线程中，分为4类，分别是：Master Thread 、IO Thread、Purge Thread、Page Cleaner Thread。

- Master Thread
  核心后台线程，负责调度其他线程，还负责将缓冲池中的数据异步刷新到磁盘中, 保持数据的一致性，还包括脏页的刷新、合并插入缓存、undo页的回收。

- IO Thread
  在InnoDB存储引擎中大量使用了AIO(异步IO)来处理IO请求, 这样可以极大地提高数据库的性能，而IO Thread主要负责这些IO请求的回调。可以通过`show engine innodb status;` 查询当前后台线程的状态。

  | 线程类型 | 默认个数 | 职责 |
  |---|---|---|
  | Read Thread | 4 | 负责读操作 |
  | Write Thread | 4 | 负责写操作 |
  | Log Thread | 1 | 负责将日志缓冲区刷新到磁盘 |
  | Insert Buffer Thread | 1 | 负责将写缓冲区内容刷新到磁盘 |

- Purge Thread
  主要用于回收事务已经提交了的undo log，在事务提交之后，undo log可能不用了，就用它来回收。

- Page Cleaner Thread
  协助 Master Thread 刷新脏页到磁盘的线程，它可以减轻 Master Thread 的工作压力，减少阻塞。


## 日志

### 错误日志
错误日志是 MySQL 中最重要的日志之一，它记录了当 mysqld 启动和停止时，以及服务器在运行过程中发生任何严重错误时的相关信息。当数据库出现任何故障导致无法正常使用时，建议首先查看此日志。

查看错误日志位置：
`show variables like '%log_error%';`

### 二进制日志

二进制日志（BINLOG）记录了所有的DDL（数据定义语言）语句和DML（数据操纵语言）语句，但不包括数据查询（SELECT、SHOW）语句，以二进制的形式保存在磁盘中。binlog 是 MySql 的逻辑日志，由 Server 层进行记录，使用任何存储引擎的 mysql 数据库都会记录 binlog，默认开启。

**作用：**

- 灾难时的数据恢复
- MySQL的主从复制

**查看参数：**
  `show variables like '%log_bin%';`
查询结果中：
- log_bin_basename：当前数据库服务器的binlog日志的前缀，具体文件名需要再加上编号(从000001开始)
- log_bin_index：binlog的索引文件，记录了当前服务器关联的binlog文件有哪些

**日志格式：**
|  格式 | 含义  |
|---|---|
| STATEMENT  | 基于SQL语句的日志记录，记录的是SQL语句，对数据进行修改的SQL都会记录在日志文件中。 |
| ROW | 基于行的日志记录，记录的是每一行的数据变更。（默认） |
| MIXED | 混合了STATEMENT和ROW两种格式，默认采用STATEMENT，在某些特殊情况下会自动切换为ROW进行记录。 |

通过`show variables like '%binlog_format%;`查看

**日志查看：**
```bash
mysqlbinlog [ 参数选项 ] logfilename

参数选项：
  -d    #指定数据库名称，只列出指定的数据库相关操作。
  -o    #忽略掉日志中的前n行命令。
  -v    #将行事件(数据变更)重构为SQL语句
  -vv   #将行事件(数据变更)重构为SQL语句，并输出注释信息
```

**清理日志：**
- `reset master` 
  删除全部 binlog 日志。删除之后，日志编号将从000001重新开始
- `purge master logs to 'binlog.*'` 
  删除 * 编号之前的所有日志
- `purge master logs before 'yyyy-mm-dd hh24:mi:ss'` 
  删除"yyyy-mm-dd hh24:mi:ss" 之前产生的所有日志

也可以在mysql的配置文件中配置二进制日志的过期时间，日志过期会自动删除:
  `show variables like '%binlog_expire_logs_seconds%';`


### 查询日志
查询日志中记录了客户端的所有操作语句，而二进制日志不包含查询数据的SQL语句。
查询日志默认未开启，如需开启修改配置文件。开启查询日志后，所有客户端的增删改查操作都会记录在该日志文件中，长时间运行该日志文件将会非常大。

查看参数：
  `show variables like '%general%';`


### 慢查询日志
慢查询日志记录了所有执行时间超过参数`long_query_time`设置值并且扫描记录数不小于`min_examined_row_limit`的所有的SQL语句的日志，`long_query_time`默认为10秒，最小为0，精度可以到微秒。且默认情况下不会记录管理语句，也不会记录不使用索引进行查找的查询。
慢查询日志默认未开启，如需开启修改配置文件。


## 主从复制

### 概念
主从复制是指将主数据库 Master 的 DDL 和 DML 操作通过二进制日志传到从库服务器 Slave 中，然后在从库上对这些日志重新执行（重做），从而使得从库和主库的数据保持同步。

MySQL支持一台主库同时向多台从库进行复制，从库同时也可以作为其他从服务器的主库，实现链状复制。

**作用：**
- 主库出现问题，可以快速切换到从库提供服务
- 实现读写分离，降低主库的访问压力
- 可以在从库中执行备份，以避免备份期间影响主库服务

### 原理
MySQL主从复制的核心是二进制日志，过程如图：

![主从复制](/img/主从复制.png)

具体分成三步：
1. Master 主库在事务提交时，会把数据变更记录在二进制日志文件 binlog 中。
2. 从库读取主库的二进制日志文件 binlog ，写入到从库的中继日志 Relay Log 。
3. slave重做中继日志中的事件，将改变反映它自己的数据。

### 搭建
1. 准备两个MySQL服务
2. 配置主库 
   `show master status` 查看二进制坐标
3. 配置从库 
   `change master to master_host=*, master_user=*,master_password=*, master_log_file=*, master_log_pos=*;`
   | 参数名 | 含义 | 8.0.23之前 |
   | ----- | ---- | ---------- |
   | SOURCE_HOST | 主库IP地址 |  MASTER_HOST |
   | SOURCE_USER | 连接主库的用户名 | MASTER_USER |
   | SOURCE_PASSWORD  | 连接主库的密码 | MASTER_PASSWORD |
   | SOURCE_LOG_FILE  | binlog 日志文件名 | MASTER_LOG_FILE |
   | SOURCE_LOG_POS   | binlog 日志文件位置 | MASTER_LOG_POS |
4. 开启同步
   ```sql
   -- 8.0.22之后：
   start replica;
   -- 8.0.22之前：
   start slave;
   ```
5. 查看主从同步状态
   ```sql
   -- 8.0.22之后：
   start replica status;
   -- 8.0.22之前：
   start slave status;
   ```


## 分库分表

### 问题分析

随着互联网及移动互联网的发展，应用系统的数据量也是成指数式增长，若采用单数据库进行数据存储，存在以下性能瓶颈：
- IO瓶颈
  热点数据太多，数据库缓存不足，产生大量磁盘IO，效率较低。请求数据太多，带宽不够，网络IO瓶颈。
- CPU瓶颈
  排序、分组、连接查询、聚合统计等SQL会耗费大量的CPU资源，请求数太多，CPU出现瓶颈。

![分库分表示意图](/img/分库分表示意图.png)

为了解决上述问题，需要对数据库进行分库分表处理。其中心思想是将数据分散存储，使得单一数据库/表的数据量变小来缓解单一数据库的性能瓶颈问题，从而达到提升数据库性能的效果。


### 拆分策略

按形式分为垂直拆分、水平拆分。按粒度分为分库和分表，因此共四种拆分策略。
在业务系统中，为了缓解磁盘IO及CPU的性能瓶颈，到底是垂直拆分，还是水平拆分；具体是分库，还是分表，都需要根据具体的业务需求具体分析。

![拆分策略](/img/拆分策略.png)

- 垂直分库：以表为依据，根据业务将不同表拆分到不同库中。特点：
  - 每个库的表结构都不一样
  - 每个库的数据也不一样
  - 所有库的并集是全量数据

- 水平分库：以字段为依据，按照一定策略，将一个库的数据拆分到多个库中。特点：
  - 每个库的表结构都一样
  - 每个库的数据都不一样
  - 所有库的并集是全量数据

- 垂直分表：以字段为依据，根据字段属性将不同字段拆分到不同表中。特点：
  - 每个表的结构都不一样
  - 每个表的数据也不一样，一般通过主键/外键关联
  - 所有表的并集是全量数据

- 水平分表：以字段为依据，按照一定策略，将一个表的数据拆分到多个表中。特点：
  - 每个库的表结构都一样
  - 每个库的数据都不一样
  - 所有库的并集是全量数据



### 面临挑战

#### 分布式id

在分库分表后，因为插入记录的时候不同的库生成的自增id会出现冲突，所以我们不能再使用mysql的自增主键，需要有一个全局的id生成器。例如使用美团的 Leaf 分布式 id 服务。


#### 一致性保证

原来的单机数据库只需要本地事务即可保证一致性，但是分库分表后，需要分布式事务来保证跨库的数据一致性，以及双写阶段新老库的一致性。通常的方案有 MQ 保证最终一致、2PC、TCC 分布式事务、监听 binlog 数据对比并修正等。


#### 分表键索引

分库分表依赖一个分片键，因此需要有索引库来根据分片键路由 SQL 请求，不同的业务场景可能有不同的查询需求，因此可能需要很多冗余数据来做索引。

#### 跨库查询

分库分表后，可能一次查询所需要的信息分布在不同库、不同表中，可能影响查询性能，一般也可以基于 ES、Blade 等做数据和查询的备份。


### 实践经验
1. 建议单张表容量 < 1000 万行，单个库容量 < 300G 以内。以未来 3～5 年的数据量 S 估算，分库数 = S / 单库容量，分表数 = S / 单库容量 / 单表容量
2. 分表数建议 2 的幂次个数
3. 数据库空间使用量不超过 80%
4. 单机器可部署 8 个数据库分库


### 实现技术 - MyCat

- shardingJDBC：基于AOP原理，在应用程序中对本地执行的SQL进行拦截，解析、改写、路由处理。需要自行编码配置实现，只支持java语言，性能较高。
- MyCat：数据库分库分表中间件，不用调整代码即可实现分库分表，支持多种语言，性能不及前者。

以下介绍以MyCat为例。

#### 概述
Mycat是开源的、活跃的、基于Java语言编写的MySQL数据库中间件。可以像使用mysql一样来使用mycat，对于开发人员来说根本感觉不到mycat的存在，开发人员只需要连接MyCat即可，而具体底层用到几台数据库，每一台数据库服务器里面存储了什么数据，都无需关心。 具体的分库分表的策略，只需要在MyCat中配置即可。

优势：
- 性能可靠稳定
- 强大的技术团队
- 体系完善
- 社区活跃

#### 结构

![MyCat概念图](/img/MyCat概念图.png)

MyCat的逻辑结构主要包括逻辑库、逻辑表、分片规则、分片节点。而具体的数据存储还是在物理结构，也就是数据库服务器中存储的。

#### 分片规则
- 范围分片：根据指定的字段及其配置的范围与数据节点的对应情况来决定数据属于哪一个分片
- 取模分片：根据指定的字段值与节点数量进行求模运算，根据运算结果决定该数据属于哪一个分片
- 一致性Hash分片：相同的哈希因子计算值总是被划分到相同的分区表中
- 枚举分片：通过在配置文件中配置可能的枚举值, 指定数据分布到不同数据节点上。适用于按照省份、性别、状态拆分数据等业务
- 应用指定算法：运行阶段由应用自主决定路由到哪个分片，直接根据字符子串（必须是数字）计算分片号
- 固定分片Hash算法：指定二进制位进行与运算
- 字符串Hash解析算法：截取字符串中的指定位置的子字符串，进行hash算法，算出分片
- 按天分片算法：按照日期及对应的时间周期分片
- 自然月分片：按照月份来分片，每个自然月为一个分片

#### 管理与监控
- 执行原理：
  ![MyCat执行原理](/img/MyCat执行原理.png)
- Mycat-web（Mycat-eye）是 Mycat 可视化运维的管理和监控平台，引入ZooKeeper作为配置中心，可以管理多个节点
- Mycat-web 管理和监控 Mycat 的流量、连接、活动线程和内存等，具备 IP 白名单、邮件告警等模块，还可以统计 SQL 并分析慢 SQL 和高频 SQL 等，为优化 SQL 提供依据



## 读写分离

读写分离是把对数据库的读和写操作分开,以对应不同的数据库服务器。主数据库提供写操作，从数据库提供读操作，这样能有效地减轻单台数据库的压力。

例如用MyCat实现的一主一从读写分离示意图：

![主从分离示意图](/img/主从分离示意图.png)

将写操作分配到 Master 上，读操作分配到 Slave 上，实现负载均衡。但这种方案如果 Master 宕机，那么业务系统就只能读不能写了，因此可以引入双主双从：

![双主双从示意图](/img/双主双从示意图.png)

一个主机 Master1 用于处理所有写请求，它的从机 Slave1 和另一台主机 Master2 还有它的从机 Slave2 负责所有读请求。当 Master1 主机宕机后，Master2 主机负责写请求，Master1、Master2 互为备机。



---------------------------------------------------------------------------------------

## 附录

### 数据类型

#### 整型

| 类型名称      | 取值范围                                  | 大小    |
| ------------- | ----------------------------------------- | ------- |
| TINYINT       | -128〜127                                 | 1个字节 |
| SMALLINT      | -32768〜32767                             | 2个宇节 |
| MEDIUMINT     | -8388608〜8388607                         | 3个字节 |
| INT (INTEGHR) | -2147483648〜2147483647                   | 4个字节 |
| BIGINT        | -9223372036854775808〜9223372036854775807 | 8个字节 |

无符号在数据类型后加 unsigned 关键字。

#### 浮点型

| 类型名称            | 说明               | 存储需求   |
| ------------------- | ------------------ | ---------- |
| FLOAT               | 单精度浮点数       | 4 个字节   |
| DOUBLE              | 双精度浮点数       | 8 个字节   |
| DECIMAL (M, D)，DEC | 压缩的“严格”定点数 | M+2 个字节 |

#### 字符串

| 类型名称   | 说明                                         | 存储需求                                                   |
| ---------- | -------------------------------------------- | -------------------------------------------------------- |
| CHAR(M)    | 固定长度字符串                       | M 字节，1<=M<=255                                          |
| VARCHAR(M) | 变长字符串                           | L+1字节，在此，L< = M和 1<=M<=255                          |
| TINYTEXT   | 短文本字符串                       | L+1字节，在此，L<2^8                                       |
| TEXT       | 长文本字符串                           | L+2字节，在此，L<2^16                                      |
| MEDIUMTEXT | 中等长度文本数据                     | L+3字节，在此，L<2^24                                      |
| LONGTEXT   | 极大文本数据                           | L+4字节，在此，L<2^32                                      |
| ENUM       | 枚举类型，只能有一个枚举字符串值             | 1或2个字节，取决于枚举值的数目 (最大值为65535)             |
| SET        | 一个设置，字符串对象可以有零个或 多个SET成员 | 1、2、3、4或8个字节，取决于集合 成员的数量（最多64个成员） |

一般定长的效率要高于变长字符串

#### 二进制类型

| 类型名称       | 说明                 | 存储需求               |
| -------------- | -------------------- | ---------------------- |
| BIT(M)         | 位字段类型           | 大约 (M+7)/8 字节      |
| BINARY(M)      | 固定长度二进制字符串 | M 字节                 |
| VARBINARY (M)  | 可变长度二进制字符串 | M+1 字节               |
| TINYBLOB (M)   | 非常小的BLOB         | L+1 字节，在此，L<2^8  |
| BLOB (M)       | 小 BLOB              | L+2 字节，在此，L<2^16 |
| MEDIUMBLOB (M) | 中等大小的BLOB       | L+3 字节，在此，L<2^24 |
| LONGBLOB (M)   | 非常大的BLOB         | L+4 字节，在此，L<2^32 |

#### 日期和时间

| 类型名称  | 日期格式            | 日期范围                                          | 存储需求 |
| --------- | ------------------- | ----------------------------------------------- | -------- |
| YEAR      | YYYY                | 1901 ~ 2155                                     | 1 个字节 |
| TIME      | HH:MM:SS            | -838:59:59 ~ 838:59:59                          | 3 个字节 |
| DATE      | YYYY-MM-DD          | 1000-01-01 ~ 9999-12-3                          | 3 个字节 |
| DATETIME  | YYYY-MM-DD HH:MM:SS | 1000-01-01 00:00:00 ~ 9999-12-31 23:59:59       | 8 个字节 |
| TIMESTAMP | YYYY-MM-DD HH:MM:SS | 1970-01-01 00:00:01 ~ 2038-01-19 03:14:07       | 4 个字节 |



### 图形化界面工具
- Workbench(免费): http://dev.mysql.com/downloads/workbench/
- navicat(收费，试用版30天): https://www.navicat.com/en/download/navicat-for-mysql
- Sequel Pro(开源免费，仅支持Mac OS): http://www.sequelpro.com/
- HeidiSQL(免费): http://www.heidisql.com/
- phpMyAdmin(免费): https://www.phpmyadmin.net/
- SQLyog: https://sqlyog.en.softonic.com/

### 参考

1. https://dhc.pythonanywhere.com/entry/share/?key=3ad29aad765a2b98b2b2a745d71bef715507ee9db8adbec98257bac0ad84cbe4#h1-u6743u9650u4E00u89C8u8868
2. https://github.com/Buildings-Lei/mysql_note/blob/main/README.md
3. https://www.bilibili.com/video/BV1Kr4y1i7ru?share_source=copy_web
4. [MySQL是怎样运行的: 从根儿上理解MySQL](https://book.douban.com/subject/35231266/)
