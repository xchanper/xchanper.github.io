---
title: Pro Git 阅读笔记
date: 2023-11-09
---
闲来无事，读一读 Git Pro —— Git 圣经，记录一些以前没有注意过的问题和底层实现的原理。


## 起步

### 特点

Git 和其它版本控制系统在对待数据的方式上有很大的区别，大部分 VCS 系统（如 CVS、Subversion、Perforce等）以文件变更列表的方式存储系统，也就是基于文件的差异进行版本控制。  

![deltas](/img/deltas.png)

但是 Git 把数据看作是对小型文件系统的一系列快照，每次提交就会对当前的全部文件创建一个快照并保存这个快照的索引，如果文件没有修改就创建一个指向先前存储的链接。


![](/img/snapshots.png)

Git 中所有的数据在存储前都计算 SHA-1 校验和，然后以校验和来引用保存的信息。Git 数据库中保存的信息都是以文件内容的哈希值作为索引，而不是文件名。


### 三种状态
Git 管理的文件，即已跟踪的文件有三种状态，要牢记：

- **commited 已提交**：数据已经安全地保存在本地数据库中
- **modified 已修改**：修改了文件，但还没保存到数据库中
- **staged 已暂存**：对一个已修改文件的当前版本做了标记，使之包含在下次提交的快照中

这会让我们的 Git 项目拥有三个阶段：

- **工作区**：对项目的某个版本，从 Git 压缩数据库中独立提取出来的内容，可以使用和修改，对应`已修改`状态
- **暂存区**：是一个文件，保存了下次将要提交的文件列表信息，对应`已暂存`状态
- **Git 目录**：保存项目的元数据和对象数据库的地方，对应`已提交`状态


![](/img/areas.png)

基于上面的三种状态和三个阶段，Git 的基本工作流程是这样的：

1. 在工作区修改文件
2. 将下次想要提交的修改选择性添加到暂存区
3. 提交更新，即找到暂存区的文件，将快照永久性存储到 Git 目录


### 配置文件
Git 的配置分为三级，每一级会覆盖上一级的配置：

1. 系统级：`/etc/gitconfig`，针对系统中每一个用户以及他们仓库的通用配置，通过`--system`选项读写（Windows 在对应安装目录下）
2. 用户级：`~/.gitconfig 或 ~/.config/git/config`，针对当前用户，通过`--global`选项读写（Windows 在C盘Users目录下）
3. 仓库级：`.git/config`，针对特定仓库，通过`--local`选项读写

可以使用`git config --list --show-origin --show-scope`命令查看当前环境所有的配置、所在文件位置，以及对应的作用域。`git config --show-origin user.email`查看最终生效的某个配置和来源。

## 基础

### 本地命令

#### clone

```bash
# HTTP/HTTPS 协议，可以指定文件夹名
git clone https://github.com/libgit2/libgit2 mylibgit
# Git 协议
git clone git://github.com/username/repository.git
# SSH 协议
git clone git@github.com:<username>/<repo>.git
# 本地协议
git clone /mnt/d/ProgramData/GitDemo GitDemo2
```

#### add

add 命令有多个功能，比如跟踪新文件、放入暂存区、合并冲突时标记已解决等，通常可以把它理解为：精确地将内容添加到下一次提交中。
```bash
git add file
```

#### status

`-s`参数可以简览状态，输出在文件名前有两列，第一列是暂存区状态，第二列是工作区状态，"??"表示尚未跟踪。
```bash
git status -s
// 输出：
 M README
MM Rakefile
A  lib/git.rb
?? LICENSE.txt
```

#### diff

```bash
# 比较当前工作区和暂存区文件差异
git diff
# 比较暂存区和数据库里最新版本的差异
git diff --staged
git diff --cached
```

#### commit

```bash
# 提交所有已跟踪文件的修改，包括工作区和暂存区
git commit -a
```

#### rm
rm 命令操作的是暂存区和工作目录，不会影响已提交的 Git 数据库
```bash
# 取消跟踪某个文件，即删除暂存区和工作目录下的该文件（需要当前暂存区和工作目录一致）
git rm xxx.txt
# 强制取消跟踪（强制删除，暂存区和工作目录可以不一致）
git rm -f xxx.txt
# 从暂存区中删除指定文件，常用于取消跟踪已经 add 的文件
git rm --cached xxx.txt
```

#### restore

注意 rm 和 restore 语义上的区别，虽然在某些场景下效果可能一样
```shell
# 取消已暂存但尚未提交的文件修改，还原到最近依次提交时的状态
git restore --staged xxx.txt
# 还原工作目录某文件到最近一次提交的状态
git restore xxx.txt
```

#### mv

Git 并不显式跟踪文件移动，但可以通过 mv 命令推断更名操作。
```bash
git mv a.txt b.txt
# 等价于下面三个命令的组合
mv a.txt b.txt
git rm a.txt
git add a.txt
```

#### log

log 命令打印提交历史记录，支持很多种格式化工具，调整输出样式，并且支持多种过滤器限定事件、作者、关键字等等，详细参数参考 [Git - 查看提交历史](https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E6%9F%A5%E7%9C%8B%E6%8F%90%E4%BA%A4%E5%8E%86%E5%8F%B2#pretty_format)。

```bash
# 打印提交日志和差异信息，并限制条目数为 2
git log --patch -2
git log -p -2

# 打印统计信息，设置展示信息详略
git log --stat --pretty=[oneline|full|fuller] 

# 格式化输出，并图形化分支合并
git log --pretty=format:"%h - %an, %ar : %s" --graph

# 查看 Junio Hamano 在 2008 年 10 月其间， 除了合并提交之外的哪些提交修改了测试文件
git log --pretty="%h - %s" --author='Junio C Hamano' \
  			--since="2008-10-01" --before="2008-11-01" --no-merges -- t/
```

#### amend

修正上次提交（提交暂存区中的文件，并修改 commit 信息），不会影响其它信息。实际上是用一个新的提交替换旧的提交，旧的提交就像从未存在过一样。
```bash
git commit --amend
```

#### reset

```bash
# 取消暂存 b.txt
git reset HEAD b.txt

# 【危险】将当前分支的 HEAD 移动到指定提交上，并重置工作区和暂存区到该提交状态 
git reset --hard <commit>
```

### 远程仓库

#### remote

```bash
# 展示所有远程分支简称和URL。clone 时的源地址默认名称为 origin
git remote -v
# 新增一个远程仓库
git remote add <shortname> <url>
# 重命名远程仓库，会同步修改跟踪的分支名
git remote rename <shortname> <new_name>
# 移除某个远程仓库，会同步删除跟踪分支和配置信息
git remote remove <remote>

# 查看远程仓库信息
git remote show <remote>
# * remote origin
#   Fetch URL: https://github.com/<username>/guide-rpc-framework.git
#   Push  URL: https://github.com/<username>/guide-rpc-framework.git
#   HEAD branch: master	[当前所处分支]
#   Remote branch:				               [远程仓库所有分支的状态，如已跟踪、未跟踪、已移除等]
#     master tracked
#   Local branch configured for 'git pull':
#     master rebases onto remote master           [pull 时将远程 master 合到本地的 master]
#   Local ref configured for 'git push':
#     master pushes to master (fast-forwardable)  [push 时将本地 master 推到远程的 master]

# 修改远程url
git remote set-url <remote_name> <new_url>
```


#### fetch

```bash
# 拉取最新的远程仓库数据到本地，但不会自动合并或修改
git fetch <remote>
```

#### push

```bash
# 将本地的 master 推送到 origin，有冲突时需要先拉取合并
git push origin master
# 推送本地所有分支到 origin
git push -all origin
```

### 标签

Git 里可以给特定的提交打上一个标签，可以通过 checkout 检出。标签分两种类型：

- **轻量标签 lightweight**：没有多余信息
- **附注标签 annotated**：包含标签信息等冗余信息，可以用 GPG 签名并验证

```bash
# 检索标签
git tag
git tag -l <pattern>
git tag --list <pattern>

# 创建轻量标签
git tag v1.0_lw
# 创建附注标签
git tag -a v1.0 -m "my version 1.4"
# 指定提交打标签
git tag <tagname> 9fceb02

# 查看标签信息
git show <tagname>

# 推送单个标签到远程仓库
git push <remote> <tagname>
# 推送所有标签到远程仓库，包括轻量、附注
git push <remote> --tags

# 删除本地标签
git tag -d <tagname>
# 删除远程仓库标签
git push origin :refs/tags/v1.4			 # 将冒号前面的空值推送到远程标签名
git push origin --delete <tagname>
```


### .gitignore 规则

- 所有空行或者以`#`开头的行都会被 Git 忽略
- 可以使用标准的 glob 模式（简化正则）匹配，它会递归地应用在整个工作区中
   - `*`匹配零个或多个任意字符
   - `[abc]`匹配方括号中的单个字符 
   - `?`匹配一个任意字符
   - `[0-9]`匹配范围区间
   - `a/**/z`匹配任意中间目录，如`a/z, a/b/z, a/b/c/z`
- 匹配模式可以以`/`开头防止递归
- 匹配模式可以以`/`结尾指定目录
- 要忽略指定模式以外的文件或目录，可以在模式前加上叹号`!`取反
- 根目录下的`.gitignore`递归作用到整个仓库，子目录下的`.gitignore`仅作用于所在目录

https://github.com/github/gitignore 给出了针对各种项目和语言的忽略跟踪文件，或者直接问 ChatGPT 吧更方便。

## 分支

几乎所有的版本控制系统都以某种形式支持分支，使用分支意味着可以把正在进行的工作从开发主线上分离开来，以免影响开发主线。下面看看 Git 实现分支的逻辑，需要牢记 Git 保存的不是文件的变化或者差异，而是不同时刻的快照。

### 分支结构

假设我们现在的 Git 项目里有三个文件已经暂存，当初次执行提交时，Git 会先计算每一个子目录的校验和， 然后在 Git 仓库中将这些校验和（黄色）保存为一个树对象（蓝色），记录着目录结构和 blob 文件索引，这个树就可以看作是仓库的一个快照。随后 Git 会创建一个提交对象（白色），除了包含提交本身相关的信息，比如作者、日期等等之外，还包含一个指向这个树对象的指针。 

![](/img/commit-and-tree.png)

当我们对仓库里的文件做一些修改，再次提交时，就会再次创建若干 blob 和一个树对象，以及一个提交对象，并且这个提交对象里包含一个指向上次提交对象（父对象）的指针，这样若干次的提交就形成了一个链表结构。

![](/img/commits-and-parents.png)

至于分支，实质上就是指向一个提交记录的可变指针，比如默认的 master 就指向了主干上最新的提交记录，而创建一个新分支/标签实际上就是创建一个指向 HEAD 所在提交记录的指针，实现上也就是往一个文件里写入 40 个字节的 SHA-1 值和 1 个换行符，因此效率非常高。HEAD 是一个特殊指针，指向当前所在的本地分支，随着 checkout 检出而移动。

![](/img/branch-and-history.png)



### 分支管理

```bash
# 创建分支
git branch testing
# 创建并切换到该分支
git checkout -b issu47

# 分支重命名，缺省是当前分支
git branch -m <oldBranch> newBranch

# 显示所有分支，以及他们的最新提交记录/过滤已提交/未提交
git branch -v --merged --no-merged
# 展示分支和对应的跟踪分支，以及提交差异
git branch -vv

# 列出所有分支
git branch -a
# * 是当前所在分支，remotes 表示远程分支，origin 是某个远程仓库引用，最后是远程分支名
* master
  remotes/origin/HEAD -> origin/master
  remotes/origin/branch1
  remotes/origin/master

# 删除分支
git branch -d hotfix
# 强制删除还未合并的分支
git branch -D unmerged
```

另外，团队可以根据不同的需求和常见，选择合适的分支开发流，如集中式、集成管理者、主管与副主管等等，可以参考：[5 个 Git 工作流，改善你的开发流程 - 削微寒 - 博客园](https://www.cnblogs.com/xueweihan/p/13524162.html)。




### 分支合并

#### Fast-forward

如果一个分支的任务完成，需要将它合并入主分支。对于下面这个分支结构，当前处在 master 分支。

![](/img/basic-branching-4.png)

如果执行`git merge hotfix`，由于 hotfix 指向的 C4 提交是 merge 指向的 C2 提交的直接后继，因此 Git 将执行`fast-forward`以**快进**方式合并，即让 master 指针直接后移。之后可以执行 `git branch -d hotfix`删除已合并的分支。

![](/img/basic-branching-5.png)


#### Recursive
但实际中更多的是下面这种无法快进的分支合并结构，即两个分支有共同祖先，但不是直接后继。

![](/img/basic-merging-1.png)

此时如果执行`git merge iss53`，那么 Git 将针对**两个分支的末端提交和它们的公共祖先**执行**三方合并**（C4、C5、C2），创建一个新的快照和提交 C6 作为最新版本，并且 C6 会有两个父提交 C4 和 C5。

![](/img/basic-merging-2.png)

如果在三方合并的过程中，遇到合并冲突，即不同分支同时修改了同一块数据，那么 Git 会将冲突的内容用下面的格式展示在文件中，然后暂停下来，由用户自己处理完冲突后手动暂存和提交。

```xml
<<<<<<< HEAD:index.html								<!-- HEAD 指示版本 -->							
<div id="footer">
	contact : email.support@github.com
</div>												<!-- 当前分支所在的版本在上面 -->		
=======																	
<div id="footer">
	please contact us at support@github.com
</div>
>>>>>>> iss53:index.html							<!-- 要合并的分支版本在下面 -->		
```



### 变基

不同于 merge 的三方合并或快进，rebase 变基操作可以将修改的补丁（C4）迁移到另一个分支（master）上。

```bash
# 将某个分支变基到 master上，默认是当前分支
git rebase master <branch>
# 选中在 client 分支但不在 server 分支的修改。变基到 master 上
git rebase --onto master server client
```

假设我们有如下的分支结构，当前在 experiment 分支上，想要变基到 master 上，整个流程是这样的：

1. Git 首先会找到两个分支的共同祖先 C2
2. 然后对比当前分支（experiment）相对于该祖先的历次提交，提取相应的修改暂存
3. 接着将当前分支指向目标（master）基底 C3，依次应用暂存的修改 C4'
4. 最后 experiment 会指向最后一次修改的补丁 C4'

至此变基完成，然后手动检出到 master 执行快进合并即可。

![](/img/basic-rebase-3.png)

变基与合并的结果没有任何区别，但变基使得提交历史更加整洁，原本并行的开发过程就像是串行的一样。但是变基存在一定风险，切记不要对已推送至别处的提交执行变基操作。

从合作的开发者的角度看，提交记录就是开发的历史，理论上不应该"篡改"，而从读者或者是新加入的开发者角度看可能只需要关注最终的结果，过程方便易读最好，所以变基与合并各有不同。





### 远程分支

远程引用是对远程仓库的引用（指针），包括分支、标签等以 `<remote>/<branch/tag>` 的形式命名，origin 是默认的远程仓库引用。

```bash
# 克隆远程仓库并指定一个引用名，默认是 origin
git clone -o booyah <url>

# 展示远程引用的完整列表
git ls-remote origin

# 缓存单个/所有远程仓库的最新数据到本地，但并不修改本地工作目录
git fetch <remote>
git fetch --all

# 拉取并尝试合并远程分支 = fetch + merge
git pull

# 添加新的远程引用
git remote add <shortname> <url>

# 将本地的 serverfix 分支推送到 origin 远程仓库
# 实际上 serverfix 是 refs/heads/serverfix:refs/heads/serverfix 的简化
git push origin serverfix
# 将本地的 serverfix 分支推送到 origin 远程仓库的 awesome 分支
git push origin serverfix:awesome

# 删除远程分支
git push origin --delete serverfix
```

![](/img/remote-branches-5.png)

从一个远程跟踪分支检出一个本地分支会自动创建**跟踪分支**，跟踪的远程分支叫做**上游分支**。也就是说本地的某个分支关联到远程仓库的某个分支，在拉取和推送时能自动关联到对应的上游分支。


```bash
# 检出远程 origin 仓库的 serverfix 分支，命名为 local_branch，并自动跟踪
git checkout -b local_branch origin/serverfix
# 简化版，本地分支默认同名
git checkout --track origin/serverfix
git checkout serverfix

# 修改正在跟踪的上游分支
git branch -u origin/awesome
git branch --set-upstream-to origin/awesome
```







## 高级工具

众所周知，高级工具，就是很麻烦，通常也用不太到的奇技淫巧...

### 提交引用

#### 单提交

```bash
# 通过 SHA-1 引用，支持简写（只要没有冲突）
git show 1c002dd4b536e7479fe34593e72e6c6c1819e53b
git show 1c002dd4b536e7479f
git show 1c002d

# 查看分支指向的特定提交
git rev-parse topic1

# 查看引用日志，记录本地仓库最近几个月 HEAD/分支 引用变更的历史
git reflog

# HEAD 五次提交前的记录
git show HEAD@{5}
# HEAD 两个月前的提交记录
git show HEAD@{2.months.ago}

# HEAD 上一次提交
git show HEAD^
# HEAD 上一次提交的第二个父提交（三方合并时所在分支为第一父提交，另一个分支为第二父提交）
git show HEAD^2

# HEAD 父提交的父提交
git show HEAD~2
git show HEAD~~
```


#### 多提交

```bash
# 双点区间，输出在 refA 中但不在 refB 中的提交
git log refA..refB
git log origin/master..HEAD

# 在 refA，不在 refB 和 refC 中的提交
git log refA ^refB --not refC

# 三点区间，输出被 refA 和 refB 其中一个包含，但不同时包含的提交，并显示处于哪一侧
git log --left-right refA...refB
```


### 贮藏清理

**stash** 还是一个很有用，也很常用的功能，可以跟踪文件的修改与暂存的改动，将未完成的修改保存到一个**栈**上，留待以后重新应用这些改动。

```bash
# 贮藏当前的修改，-u/--include-untracked 包括未跟踪的
git stash -u
git stash push -m "stash info"

# 展示贮藏列表
git stash list

# 应用栈顶贮藏
git stash apply
# 指定应用某个贮藏记录
git stash apply stash@{1}
# 应用贮藏并抛弃
git stash pop
# 创建新分支并应用栈顶贮藏
git stash branch new_branch

# 抛弃某个贮藏
git stash drop stash@{0}

# -----------------------------------------------------------

# 清理工作目录，移除未被跟踪文件。
# -f 强制
# -d 删除空的子目录
# -n 展示将执行的具体操作
# -i 进入交互模式
git clean -f -d -n
```


### 重写历史

```bash
# 将当前分支指针移动到三个提交之前的父提交，开始变基
# 可以保留、修改、抛弃、压缩提交
git rebase -i HEAD~3

# 通过脚本一次性改写大量提交
git filter-branch --tree-filter 'rm -f passwords.txt' HEAD

# 移动 HEAD 和当前分支到指定提交，根据参数修改空间内的文件
git reset --soft <commit>
git reset --mixed <commit>
git reset --hard <commit>

# 撤销某个提交，但并不改变提交历史，而是创建一个新的提交记录
git revert <commit>
git revert <start_commit>...<end_commit>
```

下面谈谈 **reset** 和 **checkout** 两个命令的原理。首先要知道 Git 管理了三颗不同的树：

1. **HEAD** 上一次提交的快照，下一次提交的父结点。也就是当前分支引用的指针，总是指向该分支上的最后一次提交。
2. **Index** 预期的下一次提交的快照。，理解成暂存区。
3. **Working Directory** 沙盒，也就是当前的工作目录。

假设我们当前仓库里有一个文件的v1版本，状态如下：
![](/img/reset-ex3.png)

当我们修改了文件为 v2 版本后，状态如下：
![](/img/reset-ex4.png)

当执行完 `git add` 命令后：
![](/img/reset-ex5.png)

当执行完 `git commit` 命令后：
![](/img/reset-ex6.png)

现在如果执行 git status 将没有输出，因此三棵树是完全一样的。这时候如果我们执行 `git reset --soft HEAD~`来回到上一个提交，实际上是移动了当前分支（是一个指针）已到了上一次提交，HEAD 也跟着移动过去了，reset 执行就到此为止了，没有修改暂存区/工作区数据。

![](/img/reset-soft.png)

而如果执行的是`git reset --mixed HEAD~`，那么会进一步的，用 HEAD 指向的快照来更新暂存区内的数据，这也是 reset 无参的缺省行为。

![](/img/reset-mixed.png)

而如果执行的是`git reset --hard HEAD~`，那么会再进一步的，用 HEAD 指向的快照来更新暂存区，以及工作区内的数据，并且是强制的没有任何提示的，所以是一个危险的操作！

![](/img/reset-hard.png)

最后如果执行的是`git reset file.txt`带有文件路径的形式，那么本质上只是将某个文件从快照中复制到暂存区。

![](/img/reset-checkout.png)

搞懂了 reset 之后，再看 checkout 就容易多了，checkout 实际上只是移动了 HEAD 指针指向另一个分支指向的提交，并没有改变任何分支的指针。





### Hooks

Git 支持在特定的重要动作发生时触发自定义脚本，即钩子，存放在`.git/hooks`目录下。分类如下：

- 客户端钩子：clone 时不随同复制
   - 提交工作流：
      - `pre-commit`键入提交信息前运行，如果以非0值退出将放弃提交。用于检查即将提交的快照
      - `prepare-commit-msg`启动提交信息编辑器之前，默认信息被创建之后运行。可以编辑默认的提交信息
      - `commit-msg`提交信息编辑后运行，非0值退出将放弃提交。可以校验项目状态和提交信息
      - `post-commit`整个提交过程完成后运行，可用于通知事件
   - 电子邮件：由`git am`命令调用
      - `applypatch-msg`、`pre-applypatch`、`post-applypatch`
   - 其它：
      - `pre-rebase`运行于变基之前，非0值退出将中止变基
      - `post-rewrite`被那些会替换提交记录的命令调用，如 `git rebase`
      - `post-checkout` checkout 执行成功后运行，可以调整工作目录
      - `post-merge` merge 执行成功后运行，可以恢复 Git 无法跟踪的工作区数据
      - `pre-push`在`git push`运行期间， 更新了远程引用但尚未传送对象时被调用
      - `pre-auto-gc`垃圾回收开始之前被调用
- 服务端钩子：
   - `pre-receive`处理来自客户端的推送操作时运行，非0值退出将拒绝推送更新
   - `update`也是处理客户端推送，但会为每个分支各执行一次，哪个运行结果非0就拒绝更新哪个分支
   - `post-receive`整个过程完结以后运行，可以用来更新其他系统服务或者通知用户


### 数据恢复
如果因为意外丢失了一些有用的提交，Git 有一些方式可以恢复丢失的提交数据：

- Reflog 日志：提交或改变分支时，Git 会在该日志中记录 HEAD 修改的值
- fsck：该工具可以检查数据库的完整性，显示出所有悬空的对象（没有被其它对象指向）

```bash
# 查看 HEAD 引用的变更记录
git reflog
git log -g
# 找到需要的提交记录，创建一个新分支指向它
git branch recover_branch 118cccf
# 切换到所需的提交即可
git checkout recover_branch

# 校验数据库完整性，找出所需的提交
git fsck
```


### 其它

1. **Rerere** = **Reuse Recorded Resolution**，可以实现重用冲突解决的方案，通过`git config rerere.enabled true`开启这个功能后，会自动记录合并冲突的解决方案，后续遇到相同的冲突（很罕见的场景吧...）会自动应用解决方案。

```bash
# 重用记录状态
git rerere status

# 显式解决方案的当前状态
git rerere diff

# 应用解决方案
git rerere
```


2. Git 提供了一些辅助调试的命令：

```bash
# 显式文件的 70-80 行，每行最后一次修改对应的提交记录; -C 自动追踪复制源
git blame -L 70,80 -C file.txt

# 在提交之间以二分的方式检出，标记 good/bad 从而快速找出出问题的首次提交
git bisect start
git bisect run test-error.sh
git bisect good/bad
git bisect reset
```


3. Git 支持子模块功能，允许将一个 Git 仓库作为另一个仓库的子目录，同时保持提交的独立。

```bash
git submodule add https://github.com/<username>/<repo>
git submodule init
git submodule update
git submodule sync --recursive
git submodule foreach 'git stash'
```


4. Bundle 打包功能可以将更新打包成一个二进制文件，用于传输。

```bash
# 创建一个 repo.bundle 包含所有用于重建 master 分支所需的数据
git bundle create repo.bundle HEAD master
# 指定打包区间
git bundle create commits.bundle master ^9a466c5
# 验证打包
git bundle verify commits.bundle
```


5. Git 拥有一个凭证系统处理身份认证，有以下几种选项：

- 默认所有都不缓存。 每一次连接都会询问你的用户名和密码
- **cache** 模式会将凭证存放在内存中一段时间，例如 15 分钟后从内存中清除
- **store **凭证用明文的形式存放在磁盘中，并且永不过期
- Mac 的 osxkeychain 模式会将凭证存入提供的钥匙串中
- Windows 下有类似的 Git Credential Manager for Windows 辅助工具




## 内部原理

从根本上来讲，Git 是一个内容寻址文件系统，核心部分是一个简单的键值对数据库，在此之上提供了一个版本控制系统的用户界面。

### 目录结构
```bash
$ ls -F1
hooks/				# 客户端/服务端的钩子脚本
info/				# 全局性排除文件，放置不希望记录到 .gitignore 文件的忽略模式
objects/			# 存储所有数据内容
refs/				# 存储指向数据的提交对象的指针
config				# 本仓库特定的配置文件
description		        # 供 GitWeb 程序使用，无需关心
HEAD				# HEAD 指针当前的引用
index				# 保存暂存区信息
```


### Git 对象

每次运行 git add 、git commit 命令时，Git 所做的实质上就是：

1. 将被改写的文件保存为**数据对象 blob**
2. 更新暂存区，记录**树对象 tree**
3. 最后创建一个指明顶层树对象和父提交的**提交对象 commit**

数据对象、树对象、提交对象 三种主要的 Git 对象均以单独文件的形式保存在`.git/objects`目录下。

![](/img/data-model-1.png)

操纵 Git 对象的命令有以下的一些底层命令，也是 Git 上层命令实际调用的方法。

```bash
# 返回对象的 hash 键，-w 写入数据库
git hash-object -w xxx.txt

# 查阅对象
# -p 判断对象内容类型，显式大致内容
# -t 打印对象类型，如 blob/tree/commit
# -s 查看大小
git cat-file -p d670460b4b4aece5915caf5c68d12f560a9fe3e4

# 手动加入暂存区，100644 普通文件，100755 可执行文件，120000 符号链接
git update-index --add --cacheinfo 100644 83baae618040... file.txt
# 将暂存区内容写入一个树对象
git write-tree
# 将一个已有的树读入暂存区
git read-tree --prefix=bak d8329f...

# 创建提交对象，-p 指定父提交
git commmit-tree <tree> -p <parent>
```


### Git 引用

GIt 中通过引用 refs (references) 来替代原始的 SHA-1 值，更加简便。引用都保存在`.git/refs`目录下，包括`heads`保存分支引用、`tags`标签引用、`refs/remotes`远程引用等。HEAD 文件是一个特殊的引用，通常是一个符号引用（指向其它引用），指向目前所在的分支，除非是处在`detached HEAD`分离头指针状态。

```bash
# 更新某个引用，所以说分支的本质就是指向某个提交的指针
# git branch <branch> 或 checkout 实际就是执行 update-ref
git update-ref refs/heads/master 1a410efbd...
# 创建标签引用
git update-ref refs/tags/v1.0 cac0cab

# 查看 HEAD 指向的引用
git symbolic-ref HEAD
# 指定 HEAD 引用
git symbolic-ref HEAD refs/heads/test
```

不同于数据对象、树对象、提交对象，标签引用是一个永远指向某个提交对象的对象。而远程引用是一种只读的，只有在跟服务器通信时才会更新的对象，在执行完`git remote add`后，`.git/config`中会自动添加一个小节，指定远程版本库名称、URL，以及对应的引用规范 `+<src>:<dst>`：

- `+`表示即使在不能快进的情况下也要强制更新引用
- `<src>`是一个代表远程版本库引用的模式，只能全部通配，不能部分通配
- `<dst>`是本地跟踪的远程引用的位置


```bash
# fetch 时获取远程服务器的 refs/heads 下的所有引用，写入本地的 refs/remotes/origin 中
# push 时推送本地的 master 到远程服务器上的 qa/master 分支
[remote "origin"]
	url = https://github.com/schacon/simplegit-progit
	fetch = +refs/heads/*:refs/remotes/origin/*
  push = refs/heads/master:refs/heads/qa/master

# 一下三个命令等价
git log origin/master
git log remotes/origin/master
git log refs/remotes/origin/master

# 本地的 空 推送到远程的 topic，可以实现删除远程服务器上的 topic 引用
git push origin :topic
git push origin --delete topic
```
