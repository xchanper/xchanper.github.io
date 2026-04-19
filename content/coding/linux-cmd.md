---
title: Linux 命令备忘录
date: 2023-12-15
---


#### more
    
```bash
# 翻页查看文件，空格翻页，q 退出
more <path>
```


#### mkdir
    
```bash
# 自动创建不存在的父目录
mkdir -p <path>
```


#### find
    
```bash
# 指定目录查找文件，支持通配符
find <path> -name <key>
# 查找大于/小于 n kB/MB/GB 的文件
find <path> -size +|-n[kMG]
```


#### grep
    
```bash
# 从文件中过滤出关键字，-n显示行号
grep -n <key> <path>
```


#### wc
    
```bash
# 数量统计，行数 | 单词数 | 字符数 | 字节数 （缺省参数则没有字符数）
wc -l -w -m -c <path>
```


#### > & >>
    
```bash
# 覆写
echo "Hello" > test.txt
# 追加，反引号的会被当做命令处理
echo `pwd` >> test.txt
```


#### tail

```bash
# 查看文件尾部内容，-f 持续追踪，-n 指定行数
tail -f -n <num> <path>
# 没有 -f 可以简化行数
tail -<num> <path>
```

#### tr

```bash
# 文本替换
tr "xxx" "yyy"
# 例，输出：12*456789
echo "123456789" | tr "3" "*"
```

#### tar

Linux 常用的压缩格式包括 tar 归档文件（tarball，仅封装不压缩）、gz 格式压缩（gzip）等。

```bash
# -z gzip模式（默认是talball，一般放于选项开头），-v 显示解压缩过程，-f 压缩/解压的文件(放于选项末尾)
# 用于压缩的：-c 压缩
tar -zcvf test.tar 1.txt 2.txt 3.txt
# 用于解压的：-x 解压，-C 解压目的地（该选项单独使用）
tar -zxvf test.tar.gz -C /home/chanper

# 也可以用 zip 解压缩 zio 格式，-r 递归文件夹，-d 解压目的地
zip -r test.zip file1 file2
unzip test.zip -d /home/chanper
```


#### vim

三种工作模式:
- 命令模式：所敲的按键编辑器都理解为命令，以命令驱动执行不同的功能
- 输入模式：对文件内容进行自由编辑
- 底线命令模式：以`:`开始，通常用于文件的保存、退出

![](/img/vim工作模式.png)

![](/img/vim命令大全.png)



#### 终端操作

- `ctrl + d`，退出登出
- `ctrl + r`，输入内容去匹配历史命令（`history`）
- `ctrl + a`，跳到命令开头
- `ctrl + e`，跳到命令结尾
- `ctrl + ←`，向左跳一个单词
- `ctrl + →`，向右跳一个单词
- `ctrl + l`，清空终端内容，等同`clear`（cmd 里面是 cls）




#### su/sudo

切换用户，之后可以用`exit/Ctrl+d`退回上一个用户。sudo 可以临时提权，以 root 身份执行，但需要在`/etc/sudoers`文件中配置。

```bash
# - 表示是否加载环境变量
su - <user>
```



#### 用户管理

```bash
# 创建用户组
groupadd <group_name>
# 删除用户组
groupdel <group_name>

# 创建用户
# -g 指定用户组，否则创建同名组自动加入
# -d 指定用户 HOME 目录
useradd -g -d <username>
# 删除用户，-r 会同时删除用户 HOME 目录
userdel -r <username>

# 查看用户所属组
id <username>
# 将指定用户加入指定用户组
usermod -aG <group_name> <username>

# 查看所有用户，输出：用户名:密码(x):用户ID:组ID:描述信息(无用):HOME目录:执行终端(默认bash)
getent passwd
# 查看所有用户组，输出：组名称:组认证(显示为x):组ID
getent group
```


#### 权限管理

```bash
# -R 路径内所有内容应用同样的操作
chmod -R 751 <path>
chmod u=rwx,g=rx,o=x <path> 

# 修改所属用户、用户组，仅限于 root 操作
chown -R <user>:<group> <path>
chown chanper:group1 test.txt
chown :root test.txt
```




#### 软件管理

```bash
# -y 自动确认
yum -y install/remove/search <software>

# -y 自动确认
apt -y install/remove/search <software>
```


#### systemctl

```bash
# 服务管理，如 network/firewalld/ssh...
systemctl start/stop/status/enable/disable <service>
```


#### ln

ln 命令默认创建的是硬链接，即源文件、目标文件是同一个 inode 指向的文件；而软链接源、目标是两份文件，类似 Windows 下的快捷方式。

```bash
# -s 表示软链接
ln -s <src> <dst>
```


#### date

```bash
# 根据格式串输出日期，-d 可以计算日期
date -d=<date_string> +<format>
date -d "+1 day" +%Y-%m-%d

# 指定时区，实际是通过 /etc/localtime 这个软链接指定的
sudo ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
```


#### 网络通信

```bash
# -c 指定检查次数
ping -c <num> ip/hostname

# -b 后台下载，日志写入当前工作目录的 wget-log 文件，配合 tail 可以查看下载进度
wget -b <url>

# 发送 http 请求，-O 下载文件
curl -O <url>
curl cip.cc

# 查看端口占用
netstat -anp | grep <port>
```



#### 进程管理

```bash
# 查看进程，-e 全部进程，-f 全部信息
ps -ef
# 杀死进程，-9 强制，否则仅发送关闭信号，具体由进程自身处理
kill -9 pid
```


#### 系统状态

```bash
# 查看 CPU、内存使用情况
# -d 刷新时间，-n 刷新次数
top -d -n

# 查看硬盘使用，-h 人性化单位
df -h

# 查看 CPU、磁盘信息，-x 显示更多信息
iostat -x <interval> <times>

# 查看网络状况，-n 查看网络，DEV 查看网络接口
sar -n DEV <interval> <times>
```


#### 环境变量

环境变量是 KV 结构，例如`HOME=/home/chanper`，`PATH`记录执行命令的搜索路径。默认的环境变量存储在针对用户的`~/.bashrc`、针对全局的`/etc/profile`等文件中。

```bash
# 查看所有环境变量
env
# 取环境变量值 (cmd 里是 %key%)
echo $USER
echo ${PATH}abcd
# 临时设置环境变量
export key=value
# 重新加载环境变量
source <profile>
```