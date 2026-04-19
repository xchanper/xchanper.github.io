---
title: Windows-WSL 实现MySQL主从同步
date: 2023-01-20
---
本文介绍 Windows 连接 WSL 中的 MySQL 服务，并配置主从同步。

<!-- more -->

## Step0. 调整WSL下MySQL的密码安全策略 - 可选
Linux下，MySQL默认的强密码策略比较麻烦，如果只在自己机器上实验可以先修改一下密码校验策略。查看当前的密码设置策略：
    `SHOW variables LIKE 'validate_password%';`
    
![show_password_policy](/img/show_password_policy.jpg)

其中，
- validate_password.check_user_name: 是否可以将用户名用作密码
- validate_password.dictionary_file: 密码策略文件，文件中存在的密码不得使用。仅`STRONG`策略下才生效
- validate_password.length: 密码长度限制
- validate_password.mixed_case_count: 大小写字母个数限制
- validate_password.number_count: 数字个数限制
- validate_password.policy:
  - #`0 or LOW`:      限制 Length
  - #`1 or MEDIUM`:   限制 Length; numeric, lowercase/uppercase, and special characters
  - #`2 or STRONG`:   限制 Length; numeric, lowercase/uppercase, and special characters; dictionary file
- validate_password.special_char_count: 特殊字符个数限制

这是MySQL 8.0之后validate_password组件提供的功能，如果查询得到`validate_password__policy`这样下划线拼接的变量则是validate_password的插件实现，存在于老版本的MySQL中。修改策略的话直接使用set命令：

```sql
SET GLOBAL validate_password.policy=LOW;
SET global validate_password.length = 1;
...
```

然后就可以修改用户密码了
```sql
alter user 'root'@'localhost' identified by '******';
flush privileges;
```
MySQL服务重启后，部分字段可能会恢复默认值，需要重新设置。


## Step1. Windows 连接 WSL2 中的MySQL服务

### 取消地址绑定
首先修改WSL下MySQL的配置
`vim /etc/mysql/mysql.conf.d/mysqld.cnf`
将 bind-address 和 mysqlx-bind-address 两行注释掉，取消只能从本机连接的限制

![注释bind](/img/注释bind.jpg)


### 创建远程连接用户
Windows下默认root用户是无法连接WSL下的MySQL，因此需要在WSL下用root新建一个用于远程连接的用户。
```sql
mysql -u root -p
 
-- root用户没有SYSTEM_USER权限，需要先赋权
grant system_user on *.* to 'root';
 
-- 新建 test/123456 的用户
CREATE USER 'test'@'%' IDENTIFIED BY '123456';
GRANT ALL ON *.* TO 'test'@'%'; 

FLUSH PRIVILEGES;
```

### 通过WSL地址连接服务
然后我们在WSL中用`ifconfig`查询得到 WSL 的 IP 地址：
![wsl_ip](/img/wsl_ip.jpg)

这样就可以在 Windows 下连接 WSL 中的 MySQL 服务了:
![windows远程连接mysql](/img/windows远程连接mysql.jpg)


## Step2. 配置主从同步
这里我们让 Windows 上的 MySQL 作为 Master，WSL 上的 MySQL 作为 Slave。

### 主库 Master 配置
1. 设置同步的数据库
Windows 系统的 MySQL 配置文件是安装目录下的 my.ini 文件，如果没有的话可以自己新建一个。然后打开输入以下内容：
```properties
[mysqld]
server-id=1                 # 服务的id，每台机器必须都不一样
log-bin=mysql-bin           # 二进制日志
binlog-ignore-db=mysql      # 指定不需要复制的数据库
binlog-do-db=reggie         # 指定需要复制的数据库，可以分多行指定。优先级大于 binlog-ignore-db
```

2. 创建新用户用于Slave来连接主库
```sql
CREATE USER 'chanper'@'%' IDENTIFIED WITH mysql_native_password by '******';
-- 赋予从库复制权限
grant replication slave on *.* to 'chanper'@'%';
FLUSH PRIVILEGES;
```

3. 复制主库数据
如果主库先前已经有数据了，需要先把数据复制到从库中，可以通过`mysqldump`实现，idea中也有现成的导出导入操作。

4. 查看 Master 状态
执行 `show master status;` 命令：

![master_status](/img/master_status.jpg)

关注 `File, Position` 两个值，后面配置从库时要用到。

### 从库 Slave 配置
1. 修改 WSL 的 MySQL 配置
    还是 `vim /etc/mysql/mysql.conf.d/mysqld.cnf` 这个文件，加入：
    ```properties
    [mysqld]
    server-id=2
    ```
    然后保存，并重启MySQL服务

2. 连接主库
   登录WSL的MySQL，并执行：
    ```sql
    change master to 
    master_host='172.29.96.1', 
    master_port=3306, 
    master_user='chanper', 
    master_password='******', 
    master_log_file='mysql-bin.000002', 
    master_log_pos=547;
    ```
    各字段的含义都一眼便知，都是主库 Master 的配置信息

3. 启动并查看 Slave 状态
   ```sql
   start slave;             -- 相应的停止同步就是 stop slave
   show slave status\G;     -- \G-格式化输出
   ```
   
   ![slave_status](/img/slave_status.jpg)

   如果 `Slave_IO_Running` 和 `Slave_SQL_Running` 都为 `Yes` 说明配置成功，其它的状态如`No`或者`Connecting`都说明配置有误或者网络无法连通。

4. 测试
    先在 Slave 中执行查询语句，然后在 Master 中执行删除语句：
    
    ![master_test](/img/master_test.jpg)


    再在 Slave 中查询测试结果：

    ![slave_test](/img/slave_test.jpg)

    
至此，完成了 Windows 和 WSL 上 MySQL服务的主从同步配置。

## 参考
[1] https://blog.csdn.net/stklway/article/details/122360248
[2] https://blog.csdn.net/weixin_42580217/article/details/122583888
[3] https://www.chengxulvtu.com/set-up-mysql-8-master-slave-replication/
