import{_ as i}from"./plugin-vue_export-helper-DlAUqK2U.js";import{r as l,o as c,c as o,d as s,e as n,f as t,b as a}from"./app-CsTghYmx.js";const r="/assets/deltas-Cx7i55sG.png",p="/assets/snapshots-ih9gfJIm.png",d="/assets/areas-G59PXmtE.png",m="/assets/commit-and-tree-DrHTYX3m.png",v="/assets/commits-and-parents-AHUfU6wV.png",u="/assets/branch-and-history-Dk7rUZDp.png",g="/assets/basic-branching-4-kOpZ7UIj.png",b="/assets/basic-branching-5-DSf7_-yp.png",h="/assets/basic-merging-1-ME8k0lPA.png",k="/assets/basic-merging-2-Cu3WfBbv.png",f="/assets/basic-rebase-3-DK7ttXZE.png",x="/assets/remote-branches-5-Cg2Q-s_3.png",_="/assets/reset-ex3-8IfVEJu_.png",G="/assets/reset-ex4-BzIqWpt-.png",A="/assets/reset-ex5-CKtKVW27.png",E="/assets/reset-ex6-CA5t8gG7.png",D="/assets/reset-soft-4R7nZNUV.png",y="/assets/reset-mixed-sPNcCz1r.png",H="/assets/reset-hard-D8o2XE8Z.png",w="/assets/reset-checkout-DTzmlYgl.png",C="/assets/data-model-1-CSULVs2j.png",z={},q=a('<p>闲来无事，读一读 Git Pro —— Git 圣经，记录一些以前没有注意过的问题和底层实现的原理。</p><h2 id="起步" tabindex="-1"><a class="header-anchor" href="#起步"><span>起步</span></a></h2><h3 id="特点" tabindex="-1"><a class="header-anchor" href="#特点"><span>特点</span></a></h3><p>Git 和其它版本控制系统在对待数据的方式上有很大的区别，大部分 VCS 系统（如 CVS、Subversion、Perforce等）以文件变更列表的方式存储系统，也就是基于文件的差异进行版本控制。</p><p><img src="'+r+'" alt="deltas" loading="lazy"></p><p>但是 Git 把数据看作是对小型文件系统的一系列快照，每次提交就会对当前的全部文件创建一个快照并保存这个快照的索引，如果文件没有修改就创建一个指向先前存储的链接。</p><p><img src="'+p+'" alt="" loading="lazy"></p><p>Git 中所有的数据在存储前都计算 SHA-1 校验和，然后以校验和来引用保存的信息。Git 数据库中保存的信息都是以文件内容的哈希值作为索引，而不是文件名。</p><h3 id="三种状态" tabindex="-1"><a class="header-anchor" href="#三种状态"><span>三种状态</span></a></h3><p>Git 管理的文件，即已跟踪的文件有三种状态，要牢记：</p><ul><li><strong>commited 已提交</strong>：数据已经安全地保存在本地数据库中</li><li><strong>modified 已修改</strong>：修改了文件，但还没保存到数据库中</li><li><strong>staged 已暂存</strong>：对一个已修改文件的当前版本做了标记，使之包含在下次提交的快照中</li></ul><p>这会让我们的 Git 项目拥有三个阶段：</p><ul><li><strong>工作区</strong>：对项目的某个版本，从 Git 压缩数据库中独立提取出来的内容，可以使用和修改，对应<code>已修改</code>状态</li><li><strong>暂存区</strong>：是一个文件，保存了下次将要提交的文件列表信息，对应<code>已暂存</code>状态</li><li><strong>Git 目录</strong>：保存项目的元数据和对象数据库的地方，对应<code>已提交</code>状态</li></ul><p><img src="'+d+`" alt="" loading="lazy"></p><p>基于上面的三种状态和三个阶段，Git 的基本工作流程是这样的：</p><ol><li>在工作区修改文件</li><li>将下次想要提交的修改选择性添加到暂存区</li><li>提交更新，即找到暂存区的文件，将快照永久性存储到 Git 目录</li></ol><h3 id="配置文件" tabindex="-1"><a class="header-anchor" href="#配置文件"><span>配置文件</span></a></h3><p>Git 的配置分为三级，每一级会覆盖上一级的配置：</p><ol><li>系统级：<code>/etc/gitconfig</code>，针对系统中每一个用户以及他们仓库的通用配置，通过<code>--system</code>选项读写（Windows 在对应安装目录下）</li><li>用户级：<code>~/.gitconfig 或 ~/.config/git/config</code>，针对当前用户，通过<code>--global</code>选项读写（Windows 在C盘Users目录下）</li><li>仓库级：<code>.git/config</code>，针对特定仓库，通过<code>--local</code>选项读写</li></ol><p>可以使用<code>git config --list --show-origin --show-scope</code>命令查看当前环境所有的配置、所在文件位置，以及对应的作用域。<code>git config --show-origin user.email</code>查看最终生效的某个配置和来源。</p><h2 id="基础" tabindex="-1"><a class="header-anchor" href="#基础"><span>基础</span></a></h2><h3 id="本地命令" tabindex="-1"><a class="header-anchor" href="#本地命令"><span>本地命令</span></a></h3><h4 id="clone" tabindex="-1"><a class="header-anchor" href="#clone"><span>clone</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># HTTP/HTTPS 协议，可以指定文件夹名</span>
<span class="token function">git</span> clone https://github.com/libgit2/libgit2 mylibgit
<span class="token comment"># Git 协议</span>
<span class="token function">git</span> clone git://github.com/username/repository.git
<span class="token comment"># SSH 协议</span>
<span class="token function">git</span> clone git@github.com:<span class="token operator">&lt;</span>username<span class="token operator">&gt;</span>/<span class="token operator">&lt;</span>repo<span class="token operator">&gt;</span>.git
<span class="token comment"># 本地协议</span>
<span class="token function">git</span> clone /mnt/d/ProgramData/GitDemo GitDemo2
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="add" tabindex="-1"><a class="header-anchor" href="#add"><span>add</span></a></h4><p>add 命令有多个功能，比如跟踪新文件、放入暂存区、合并冲突时标记已解决等，通常可以把它理解为：精确地将内容添加到下一次提交中。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token function">git</span> <span class="token function">add</span> <span class="token function">file</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h4 id="status" tabindex="-1"><a class="header-anchor" href="#status"><span>status</span></a></h4><p><code>-s</code>参数可以简览状态，输出在文件名前有两列，第一列是暂存区状态，第二列是工作区状态，&quot;??&quot;表示尚未跟踪。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token function">git</span> status <span class="token parameter variable">-s</span>
// 输出：
 M README
MM Rakefile
A  lib/git.rb
?? LICENSE.txt
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="diff" tabindex="-1"><a class="header-anchor" href="#diff"><span>diff</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 比较当前工作区和暂存区文件差异</span>
<span class="token function">git</span> <span class="token function">diff</span>
<span class="token comment"># 比较暂存区和数据库里最新版本的差异</span>
<span class="token function">git</span> <span class="token function">diff</span> <span class="token parameter variable">--staged</span>
<span class="token function">git</span> <span class="token function">diff</span> <span class="token parameter variable">--cached</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="commit" tabindex="-1"><a class="header-anchor" href="#commit"><span>commit</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 提交所有已跟踪文件的修改，包括工作区和暂存区</span>
<span class="token function">git</span> commit <span class="token parameter variable">-a</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="rm" tabindex="-1"><a class="header-anchor" href="#rm"><span>rm</span></a></h4><p>rm 命令操作的是暂存区和工作目录，不会影响已提交的 Git 数据库</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 取消跟踪某个文件，即删除暂存区和工作目录下的该文件（需要当前暂存区和工作目录一致）</span>
<span class="token function">git</span> <span class="token function">rm</span> xxx.txt
<span class="token comment"># 强制取消跟踪（强制删除，暂存区和工作目录可以不一致）</span>
<span class="token function">git</span> <span class="token function">rm</span> <span class="token parameter variable">-f</span> xxx.txt
<span class="token comment"># 从暂存区中删除指定文件，常用于取消跟踪已经 add 的文件</span>
<span class="token function">git</span> <span class="token function">rm</span> <span class="token parameter variable">--cached</span> xxx.txt
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="restore" tabindex="-1"><a class="header-anchor" href="#restore"><span>restore</span></a></h4><p>注意 rm 和 restore 语义上的区别，虽然在某些场景下效果可能一样</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 取消已暂存但尚未提交的文件修改，还原到最近依次提交时的状态</span>
<span class="token function">git</span> restore <span class="token parameter variable">--staged</span> xxx.txt
<span class="token comment"># 还原工作目录某文件到最近一次提交的状态</span>
<span class="token function">git</span> restore xxx.txt
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="mv" tabindex="-1"><a class="header-anchor" href="#mv"><span>mv</span></a></h4><p>Git 并不显式跟踪文件移动，但可以通过 mv 命令推断更名操作。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token function">git</span> <span class="token function">mv</span> a.txt b.txt
<span class="token comment"># 等价于下面三个命令的组合</span>
<span class="token function">mv</span> a.txt b.txt
<span class="token function">git</span> <span class="token function">rm</span> a.txt
<span class="token function">git</span> <span class="token function">add</span> a.txt
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="log" tabindex="-1"><a class="header-anchor" href="#log"><span>log</span></a></h4>`,44),P={href:"https://git-scm.com/book/zh/v2/Git-%E5%9F%BA%E7%A1%80-%E6%9F%A5%E7%9C%8B%E6%8F%90%E4%BA%A4%E5%8E%86%E5%8F%B2#pretty_format",target:"_blank",rel:"noopener noreferrer"},S=a(`<div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 打印提交日志和差异信息，并限制条目数为 2</span>
<span class="token function">git</span> log <span class="token parameter variable">--patch</span> <span class="token parameter variable">-2</span>
<span class="token function">git</span> log <span class="token parameter variable">-p</span> <span class="token parameter variable">-2</span>

<span class="token comment"># 打印统计信息，设置展示信息详略</span>
<span class="token function">git</span> log <span class="token parameter variable">--stat</span> <span class="token parameter variable">--pretty</span><span class="token operator">=</span><span class="token punctuation">[</span>oneline<span class="token operator">|</span>full<span class="token operator">|</span>fuller<span class="token punctuation">]</span> 

<span class="token comment"># 格式化输出，并图形化分支合并</span>
<span class="token function">git</span> log <span class="token parameter variable">--pretty</span><span class="token operator">=</span>format:<span class="token string">&quot;%h - %an, %ar : %s&quot;</span> <span class="token parameter variable">--graph</span>

<span class="token comment"># 查看 Junio Hamano 在 2008 年 10 月其间， 除了合并提交之外的哪些提交修改了测试文件</span>
<span class="token function">git</span> log <span class="token parameter variable">--pretty</span><span class="token operator">=</span><span class="token string">&quot;%h - %s&quot;</span> <span class="token parameter variable">--author</span><span class="token operator">=</span><span class="token string">&#39;Junio C Hamano&#39;</span> <span class="token punctuation">\\</span>
  			<span class="token parameter variable">--since</span><span class="token operator">=</span><span class="token string">&quot;2008-10-01&quot;</span> <span class="token parameter variable">--before</span><span class="token operator">=</span><span class="token string">&quot;2008-11-01&quot;</span> --no-merges -- t/
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="amend" tabindex="-1"><a class="header-anchor" href="#amend"><span>amend</span></a></h4><p>修正上次提交（提交暂存区中的文件，并修改 commit 信息），不会影响其它信息。实际上是用一个新的提交替换旧的提交，旧的提交就像从未存在过一样。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token function">git</span> commit <span class="token parameter variable">--amend</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div></div></div><h4 id="reset" tabindex="-1"><a class="header-anchor" href="#reset"><span>reset</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 取消暂存 b.txt</span>
<span class="token function">git</span> reset HEAD b.txt

<span class="token comment"># 【危险】将当前分支的 HEAD 移动到指定提交上，并重置工作区和暂存区到该提交状态 </span>
<span class="token function">git</span> reset <span class="token parameter variable">--hard</span> <span class="token operator">&lt;</span>commit<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="远程仓库" tabindex="-1"><a class="header-anchor" href="#远程仓库"><span>远程仓库</span></a></h3><h4 id="remote" tabindex="-1"><a class="header-anchor" href="#remote"><span>remote</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 展示所有远程分支简称和URL。clone 时的源地址默认名称为 origin</span>
<span class="token function">git</span> remote <span class="token parameter variable">-v</span>
<span class="token comment"># 新增一个远程仓库</span>
<span class="token function">git</span> remote <span class="token function">add</span> <span class="token operator">&lt;</span>shortname<span class="token operator">&gt;</span> <span class="token operator">&lt;</span>url<span class="token operator">&gt;</span>
<span class="token comment"># 重命名远程仓库，会同步修改跟踪的分支名</span>
<span class="token function">git</span> remote <span class="token function">rename</span> <span class="token operator">&lt;</span>shortname<span class="token operator">&gt;</span> <span class="token operator">&lt;</span>new_name<span class="token operator">&gt;</span>
<span class="token comment"># 移除某个远程仓库，会同步删除跟踪分支和配置信息</span>
<span class="token function">git</span> remote remove <span class="token operator">&lt;</span>remote<span class="token operator">&gt;</span>

<span class="token comment"># 查看远程仓库信息</span>
<span class="token function">git</span> remote show <span class="token operator">&lt;</span>remote<span class="token operator">&gt;</span>
<span class="token comment"># * remote origin</span>
<span class="token comment">#   Fetch URL: https://github.com/&lt;username&gt;/guide-rpc-framework.git</span>
<span class="token comment">#   Push  URL: https://github.com/&lt;username&gt;/guide-rpc-framework.git</span>
<span class="token comment">#   HEAD branch: master	[当前所处分支]</span>
<span class="token comment">#   Remote branch:				               [远程仓库所有分支的状态，如已跟踪、未跟踪、已移除等]</span>
<span class="token comment">#     master tracked</span>
<span class="token comment">#   Local branch configured for &#39;git pull&#39;:</span>
<span class="token comment">#     master rebases onto remote master           [pull 时将远程 master 合到本地的 master]</span>
<span class="token comment">#   Local ref configured for &#39;git push&#39;:</span>
<span class="token comment">#     master pushes to master (fast-forwardable)  [push 时将本地 master 推到远程的 master]</span>

<span class="token comment"># 修改远程url</span>
<span class="token function">git</span> remote set-url <span class="token operator">&lt;</span>remote_name<span class="token operator">&gt;</span> <span class="token operator">&lt;</span>new_url<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="fetch" tabindex="-1"><a class="header-anchor" href="#fetch"><span>fetch</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 拉取最新的远程仓库数据到本地，但不会自动合并或修改</span>
<span class="token function">git</span> fetch <span class="token operator">&lt;</span>remote<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="push" tabindex="-1"><a class="header-anchor" href="#push"><span>push</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 将本地的 master 推送到 origin，有冲突时需要先拉取合并</span>
<span class="token function">git</span> push origin master
<span class="token comment"># 推送本地所有分支到 origin</span>
<span class="token function">git</span> push <span class="token parameter variable">-all</span> origin
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="标签" tabindex="-1"><a class="header-anchor" href="#标签"><span>标签</span></a></h3><p>Git 里可以给特定的提交打上一个标签，可以通过 checkout 检出。标签分两种类型：</p><ul><li><strong>轻量标签 lightweight</strong>：没有多余信息</li><li><strong>附注标签 annotated</strong>：包含标签信息等冗余信息，可以用 GPG 签名并验证</li></ul><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 检索标签</span>
<span class="token function">git</span> tag
<span class="token function">git</span> tag <span class="token parameter variable">-l</span> <span class="token operator">&lt;</span>pattern<span class="token operator">&gt;</span>
<span class="token function">git</span> tag <span class="token parameter variable">--list</span> <span class="token operator">&lt;</span>pattern<span class="token operator">&gt;</span>

<span class="token comment"># 创建轻量标签</span>
<span class="token function">git</span> tag v1.0_lw
<span class="token comment"># 创建附注标签</span>
<span class="token function">git</span> tag <span class="token parameter variable">-a</span> v1.0 <span class="token parameter variable">-m</span> <span class="token string">&quot;my version 1.4&quot;</span>
<span class="token comment"># 指定提交打标签</span>
<span class="token function">git</span> tag <span class="token operator">&lt;</span>tagname<span class="token operator">&gt;</span> 9fceb02

<span class="token comment"># 查看标签信息</span>
<span class="token function">git</span> show <span class="token operator">&lt;</span>tagname<span class="token operator">&gt;</span>

<span class="token comment"># 推送单个标签到远程仓库</span>
<span class="token function">git</span> push <span class="token operator">&lt;</span>remote<span class="token operator">&gt;</span> <span class="token operator">&lt;</span>tagname<span class="token operator">&gt;</span>
<span class="token comment"># 推送所有标签到远程仓库，包括轻量、附注</span>
<span class="token function">git</span> push <span class="token operator">&lt;</span>remote<span class="token operator">&gt;</span> <span class="token parameter variable">--tags</span>

<span class="token comment"># 删除本地标签</span>
<span class="token function">git</span> tag <span class="token parameter variable">-d</span> <span class="token operator">&lt;</span>tagname<span class="token operator">&gt;</span>
<span class="token comment"># 删除远程仓库标签</span>
<span class="token function">git</span> push origin :refs/tags/v1.4			 <span class="token comment"># 将冒号前面的空值推送到远程标签名</span>
<span class="token function">git</span> push origin <span class="token parameter variable">--delete</span> <span class="token operator">&lt;</span>tagname<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="gitignore-规则" tabindex="-1"><a class="header-anchor" href="#gitignore-规则"><span>.gitignore 规则</span></a></h3><ul><li>所有空行或者以<code>#</code>开头的行都会被 Git 忽略</li><li>可以使用标准的 glob 模式（简化正则）匹配，它会递归地应用在整个工作区中 <ul><li><code>*</code>匹配零个或多个任意字符</li><li><code>[abc]</code>匹配方括号中的单个字符</li><li><code>?</code>匹配一个任意字符</li><li><code>[0-9]</code>匹配范围区间</li><li><code>a/**/z</code>匹配任意中间目录，如<code>a/z, a/b/z, a/b/c/z</code></li></ul></li><li>匹配模式可以以<code>/</code>开头防止递归</li><li>匹配模式可以以<code>/</code>结尾指定目录</li><li>要忽略指定模式以外的文件或目录，可以在模式前加上叹号<code>!</code>取反</li><li>根目录下的<code>.gitignore</code>递归作用到整个仓库，子目录下的<code>.gitignore</code>仅作用于所在目录</li></ul>`,19),B={href:"https://github.com/github/gitignore",target:"_blank",rel:"noopener noreferrer"},T=a('<h2 id="分支" tabindex="-1"><a class="header-anchor" href="#分支"><span>分支</span></a></h2><p>几乎所有的版本控制系统都以某种形式支持分支，使用分支意味着可以把正在进行的工作从开发主线上分离开来，以免影响开发主线。下面看看 Git 实现分支的逻辑，需要牢记 Git 保存的不是文件的变化或者差异，而是不同时刻的快照。</p><h3 id="分支结构" tabindex="-1"><a class="header-anchor" href="#分支结构"><span>分支结构</span></a></h3><p>假设我们现在的 Git 项目里有三个文件已经暂存，当初次执行提交时，Git 会先计算每一个子目录的校验和， 然后在 Git 仓库中将这些校验和（黄色）保存为一个树对象（蓝色），记录着目录结构和 blob 文件索引，这个树就可以看作是仓库的一个快照。随后 Git 会创建一个提交对象（白色），除了包含提交本身相关的信息，比如作者、日期等等之外，还包含一个指向这个树对象的指针。</p><p><img src="'+m+'" alt="" loading="lazy"></p><p>当我们对仓库里的文件做一些修改，再次提交时，就会再次创建若干 blob 和一个树对象，以及一个提交对象，并且这个提交对象里包含一个指向上次提交对象（父对象）的指针，这样若干次的提交就形成了一个链表结构。</p><p><img src="'+v+'" alt="" loading="lazy"></p><p>至于分支，实质上就是指向一个提交记录的可变指针，比如默认的 master 就指向了主干上最新的提交记录，而创建一个新分支/标签实际上就是创建一个指向 HEAD 所在提交记录的指针，实现上也就是往一个文件里写入 40 个字节的 SHA-1 值和 1 个换行符，因此效率非常高。HEAD 是一个特殊指针，指向当前所在的本地分支，随着 checkout 检出而移动。</p><p><img src="'+u+`" alt="" loading="lazy"></p><h3 id="分支管理" tabindex="-1"><a class="header-anchor" href="#分支管理"><span>分支管理</span></a></h3><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 创建分支</span>
<span class="token function">git</span> branch testing
<span class="token comment"># 创建并切换到该分支</span>
<span class="token function">git</span> checkout <span class="token parameter variable">-b</span> issu47

<span class="token comment"># 分支重命名，缺省是当前分支</span>
<span class="token function">git</span> branch <span class="token parameter variable">-m</span> <span class="token operator">&lt;</span>oldBranch<span class="token operator">&gt;</span> newBranch

<span class="token comment"># 显示所有分支，以及他们的最新提交记录/过滤已提交/未提交</span>
<span class="token function">git</span> branch <span class="token parameter variable">-v</span> <span class="token parameter variable">--merged</span> --no-merged
<span class="token comment"># 展示分支和对应的跟踪分支，以及提交差异</span>
<span class="token function">git</span> branch <span class="token parameter variable">-vv</span>

<span class="token comment"># 列出所有分支</span>
<span class="token function">git</span> branch <span class="token parameter variable">-a</span>
<span class="token comment"># * 是当前所在分支，remotes 表示远程分支，origin 是某个远程仓库引用，最后是远程分支名</span>
* master
  remotes/origin/HEAD -<span class="token operator">&gt;</span> origin/master
  remotes/origin/branch1
  remotes/origin/master

<span class="token comment"># 删除分支</span>
<span class="token function">git</span> branch <span class="token parameter variable">-d</span> hotfix
<span class="token comment"># 强制删除还未合并的分支</span>
<span class="token function">git</span> branch <span class="token parameter variable">-D</span> unmerged
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,11),R={href:"https://www.cnblogs.com/xueweihan/p/13524162.html",target:"_blank",rel:"noopener noreferrer"},V=a('<h3 id="分支合并" tabindex="-1"><a class="header-anchor" href="#分支合并"><span>分支合并</span></a></h3><h4 id="fast-forward" tabindex="-1"><a class="header-anchor" href="#fast-forward"><span>Fast-forward</span></a></h4><p>如果一个分支的任务完成，需要将它合并入主分支。对于下面这个分支结构，当前处在 master 分支。</p><p><img src="'+g+'" alt="" loading="lazy"></p><p>如果执行<code>git merge hotfix</code>，由于 hotfix 指向的 C4 提交是 merge 指向的 C2 提交的直接后继，因此 Git 将执行<code>fast-forward</code>以<strong>快进</strong>方式合并，即让 master 指针直接后移。之后可以执行 <code>git branch -d hotfix</code>删除已合并的分支。</p><p><img src="'+b+'" alt="" loading="lazy"></p><h4 id="recursive" tabindex="-1"><a class="header-anchor" href="#recursive"><span>Recursive</span></a></h4><p>但实际中更多的是下面这种无法快进的分支合并结构，即两个分支有共同祖先，但不是直接后继。</p><p><img src="'+h+'" alt="" loading="lazy"></p><p>此时如果执行<code>git merge iss53</code>，那么 Git 将针对<strong>两个分支的末端提交和它们的公共祖先</strong>执行<strong>三方合并</strong>（C4、C5、C2），创建一个新的快照和提交 C6 作为最新版本，并且 C6 会有两个父提交 C4 和 C5。</p><p><img src="'+k+`" alt="" loading="lazy"></p><p>如果在三方合并的过程中，遇到合并冲突，即不同分支同时修改了同一块数据，那么 Git 会将冲突的内容用下面的格式展示在文件中，然后暂停下来，由用户自己处理完冲突后手动暂存和提交。</p><div class="language-xml line-numbers-mode" data-ext="xml" data-title="xml"><pre class="language-xml"><code>&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD:index.html								<span class="token comment">&lt;!-- HEAD 指示版本 --&gt;</span>							
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>footer<span class="token punctuation">&quot;</span></span><span class="token punctuation">&gt;</span></span>
	contact : email.support@github.com
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">&gt;</span></span>												<span class="token comment">&lt;!-- 当前分支所在的版本在上面 --&gt;</span>		
=======																	
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;</span>div</span> <span class="token attr-name">id</span><span class="token attr-value"><span class="token punctuation attr-equals">=</span><span class="token punctuation">&quot;</span>footer<span class="token punctuation">&quot;</span></span><span class="token punctuation">&gt;</span></span>
	please contact us at support@github.com
<span class="token tag"><span class="token tag"><span class="token punctuation">&lt;/</span>div</span><span class="token punctuation">&gt;</span></span>
&gt;&gt;&gt;&gt;&gt;&gt;&gt; iss53:index.html							<span class="token comment">&lt;!-- 要合并的分支版本在下面 --&gt;</span>		
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="变基" tabindex="-1"><a class="header-anchor" href="#变基"><span>变基</span></a></h3><p>不同于 merge 的三方合并或快进，rebase 变基操作可以将修改的补丁（C4）迁移到另一个分支（master）上。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 将某个分支变基到 master上，默认是当前分支</span>
<span class="token function">git</span> rebase master <span class="token operator">&lt;</span>branch<span class="token operator">&gt;</span>
<span class="token comment"># 选中在 client 分支但不在 server 分支的修改。变基到 master 上</span>
<span class="token function">git</span> rebase <span class="token parameter variable">--onto</span> master server client
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>假设我们有如下的分支结构，当前在 experiment 分支上，想要变基到 master 上，整个流程是这样的：</p><ol><li>Git 首先会找到两个分支的共同祖先 C2</li><li>然后对比当前分支（experiment）相对于该祖先的历次提交，提取相应的修改暂存</li><li>接着将当前分支指向目标（master）基底 C3，依次应用暂存的修改 C4&#39;</li><li>最后 experiment 会指向最后一次修改的补丁 C4&#39;</li></ol><p>至此变基完成，然后手动检出到 master 执行快进合并即可。</p><p><img src="`+f+`" alt="" loading="lazy"></p><p>变基与合并的结果没有任何区别，但变基使得提交历史更加整洁，原本并行的开发过程就像是串行的一样。但是变基存在一定风险，切记不要对已推送至别处的提交执行变基操作。</p><p>从合作的开发者的角度看，提交记录就是开发的历史，理论上不应该&quot;篡改&quot;，而从读者或者是新加入的开发者角度看可能只需要关注最终的结果，过程方便易读最好，所以变基与合并各有不同。</p><h3 id="远程分支" tabindex="-1"><a class="header-anchor" href="#远程分支"><span>远程分支</span></a></h3><p>远程引用是对远程仓库的引用（指针），包括分支、标签等以 <code>&lt;remote&gt;/&lt;branch/tag&gt;</code> 的形式命名，origin 是默认的远程仓库引用。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 克隆远程仓库并指定一个引用名，默认是 origin</span>
<span class="token function">git</span> clone <span class="token parameter variable">-o</span> booyah <span class="token operator">&lt;</span>url<span class="token operator">&gt;</span>

<span class="token comment"># 展示远程引用的完整列表</span>
<span class="token function">git</span> ls-remote origin

<span class="token comment"># 缓存单个/所有远程仓库的最新数据到本地，但并不修改本地工作目录</span>
<span class="token function">git</span> fetch <span class="token operator">&lt;</span>remote<span class="token operator">&gt;</span>
<span class="token function">git</span> fetch <span class="token parameter variable">--all</span>

<span class="token comment"># 拉取并尝试合并远程分支 = fetch + merge</span>
<span class="token function">git</span> pull

<span class="token comment"># 添加新的远程引用</span>
<span class="token function">git</span> remote <span class="token function">add</span> <span class="token operator">&lt;</span>shortname<span class="token operator">&gt;</span> <span class="token operator">&lt;</span>url<span class="token operator">&gt;</span>

<span class="token comment"># 将本地的 serverfix 分支推送到 origin 远程仓库</span>
<span class="token comment"># 实际上 serverfix 是 refs/heads/serverfix:refs/heads/serverfix 的简化</span>
<span class="token function">git</span> push origin serverfix
<span class="token comment"># 将本地的 serverfix 分支推送到 origin 远程仓库的 awesome 分支</span>
<span class="token function">git</span> push origin serverfix:awesome

<span class="token comment"># 删除远程分支</span>
<span class="token function">git</span> push origin <span class="token parameter variable">--delete</span> serverfix
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p><img src="`+x+`" alt="" loading="lazy"></p><p>从一个远程跟踪分支检出一个本地分支会自动创建<strong>跟踪分支</strong>，跟踪的远程分支叫做<strong>上游分支</strong>。也就是说本地的某个分支关联到远程仓库的某个分支，在拉取和推送时能自动关联到对应的上游分支。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 检出远程 origin 仓库的 serverfix 分支，命名为 local_branch，并自动跟踪</span>
<span class="token function">git</span> checkout <span class="token parameter variable">-b</span> local_branch origin/serverfix
<span class="token comment"># 简化版，本地分支默认同名</span>
<span class="token function">git</span> checkout <span class="token parameter variable">--track</span> origin/serverfix
<span class="token function">git</span> checkout serverfix

<span class="token comment"># 修改正在跟踪的上游分支</span>
<span class="token function">git</span> branch <span class="token parameter variable">-u</span> origin/awesome
<span class="token function">git</span> branch --set-upstream-to origin/awesome
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h2 id="高级工具" tabindex="-1"><a class="header-anchor" href="#高级工具"><span>高级工具</span></a></h2><p>众所周知，高级工具，就是很麻烦，通常也用不太到的奇技淫巧...</p><h3 id="提交引用" tabindex="-1"><a class="header-anchor" href="#提交引用"><span>提交引用</span></a></h3><h4 id="单提交" tabindex="-1"><a class="header-anchor" href="#单提交"><span>单提交</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 通过 SHA-1 引用，支持简写（只要没有冲突）</span>
<span class="token function">git</span> show 1c002dd4b536e7479fe34593e72e6c6c1819e53b
<span class="token function">git</span> show 1c002dd4b536e7479f
<span class="token function">git</span> show 1c002d

<span class="token comment"># 查看分支指向的特定提交</span>
<span class="token function">git</span> rev-parse topic1

<span class="token comment"># 查看引用日志，记录本地仓库最近几个月 HEAD/分支 引用变更的历史</span>
<span class="token function">git</span> reflog

<span class="token comment"># HEAD 五次提交前的记录</span>
<span class="token function">git</span> show HEAD@<span class="token punctuation">{</span><span class="token number">5</span><span class="token punctuation">}</span>
<span class="token comment"># HEAD 两个月前的提交记录</span>
<span class="token function">git</span> show HEAD@<span class="token punctuation">{</span><span class="token number">2</span>.months.ago<span class="token punctuation">}</span>

<span class="token comment"># HEAD 上一次提交</span>
<span class="token function">git</span> show HEAD^
<span class="token comment"># HEAD 上一次提交的第二个父提交（三方合并时所在分支为第一父提交，另一个分支为第二父提交）</span>
<span class="token function">git</span> show HEAD^2

<span class="token comment"># HEAD 父提交的父提交</span>
<span class="token function">git</span> show HEAD~2
<span class="token function">git</span> show HEAD~~
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h4 id="多提交" tabindex="-1"><a class="header-anchor" href="#多提交"><span>多提交</span></a></h4><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 双点区间，输出在 refA 中但不在 refB 中的提交</span>
<span class="token function">git</span> log refA<span class="token punctuation">..</span>refB
<span class="token function">git</span> log origin/master<span class="token punctuation">..</span>HEAD

<span class="token comment"># 在 refA，不在 refB 和 refC 中的提交</span>
<span class="token function">git</span> log refA ^refB <span class="token parameter variable">--not</span> refC

<span class="token comment"># 三点区间，输出被 refA 和 refB 其中一个包含，但不同时包含的提交，并显示处于哪一侧</span>
<span class="token function">git</span> log --left-right refA<span class="token punctuation">..</span>.refB
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="贮藏清理" tabindex="-1"><a class="header-anchor" href="#贮藏清理"><span>贮藏清理</span></a></h3><p><strong>stash</strong> 还是一个很有用，也很常用的功能，可以跟踪文件的修改与暂存的改动，将未完成的修改保存到一个<strong>栈</strong>上，留待以后重新应用这些改动。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 贮藏当前的修改，-u/--include-untracked 包括未跟踪的</span>
<span class="token function">git</span> stash <span class="token parameter variable">-u</span>
<span class="token function">git</span> stash push <span class="token parameter variable">-m</span> <span class="token string">&quot;stash info&quot;</span>

<span class="token comment"># 展示贮藏列表</span>
<span class="token function">git</span> stash list

<span class="token comment"># 应用栈顶贮藏</span>
<span class="token function">git</span> stash apply
<span class="token comment"># 指定应用某个贮藏记录</span>
<span class="token function">git</span> stash apply stash@<span class="token punctuation">{</span><span class="token number">1</span><span class="token punctuation">}</span>
<span class="token comment"># 应用贮藏并抛弃</span>
<span class="token function">git</span> stash pop
<span class="token comment"># 创建新分支并应用栈顶贮藏</span>
<span class="token function">git</span> stash branch new_branch

<span class="token comment"># 抛弃某个贮藏</span>
<span class="token function">git</span> drop stash@<span class="token punctuation">{</span><span class="token number">0</span><span class="token punctuation">}</span>

<span class="token comment"># -----------------------------------------------------------</span>

<span class="token comment"># 清理工作目录，移除未被跟踪文件。</span>
<span class="token comment"># -f 强制</span>
<span class="token comment"># -d 删除空的子目录</span>
<span class="token comment"># -n 展示将执行的具体操作</span>
<span class="token comment"># -i 进入交互模式</span>
<span class="token function">git</span> clean <span class="token parameter variable">-f</span> <span class="token parameter variable">-d</span> <span class="token parameter variable">-n</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="重写历史" tabindex="-1"><a class="header-anchor" href="#重写历史"><span>重写历史</span></a></h3><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 将当前分支指针移动到三个提交之前的父提交，开始变基</span>
<span class="token comment"># 可以保留、修改、抛弃、压缩提交</span>
<span class="token function">git</span> rebase <span class="token parameter variable">-i</span> HEAD~3

<span class="token comment"># 通过脚本一次性改写大量提交</span>
<span class="token function">git</span> filter-branch --tree-filter <span class="token string">&#39;rm -f passwords.txt&#39;</span> HEAD

<span class="token comment"># 移动 HEAD 和当前分支到指定提交，根据参数修改空间内的文件</span>
<span class="token function">git</span> reset <span class="token parameter variable">--soft</span> <span class="token operator">&lt;</span>commit<span class="token operator">&gt;</span>
<span class="token function">git</span> reset <span class="token parameter variable">--mixed</span> <span class="token operator">&lt;</span>commit<span class="token operator">&gt;</span>
<span class="token function">git</span> reset <span class="token parameter variable">--hard</span> <span class="token operator">&lt;</span>commit<span class="token operator">&gt;</span>

<span class="token comment"># 撤销某个提交，但并不改变提交历史，而是创建一个新的提交记录</span>
<span class="token function">git</span> revert <span class="token operator">&lt;</span>commit<span class="token operator">&gt;</span>
<span class="token function">git</span> revert <span class="token operator">&lt;</span>start_commit<span class="token operator">&gt;</span><span class="token punctuation">..</span>.<span class="token operator">&lt;</span>end_commit<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>下面谈谈 <strong>reset</strong> 和 <strong>checkout</strong> 两个命令的原理。首先要知道 Git 管理了三颗不同的树：</p><ol><li><strong>HEAD</strong> 上一次提交的快照，下一次提交的父结点。也就是当前分支引用的指针，总是指向该分支上的最后一次提交。</li><li><strong>Index</strong> 预期的下一次提交的快照。，理解成暂存区。</li><li><strong>Working Directory</strong> 沙盒，也就是当前的工作目录。</li></ol><p>假设我们当前仓库里有一个文件的v1版本，状态如下： <img src="`+_+'" alt="" loading="lazy"></p><p>当我们修改了文件为 v2 版本后，状态如下： <img src="'+G+'" alt="" loading="lazy"></p><p>当执行完 <code>git add</code> 命令后： <img src="'+A+'" alt="" loading="lazy"></p><p>当执行完 <code>git commit</code> 命令后： <img src="'+E+'" alt="" loading="lazy"></p><p>现在如果执行 git status 将没有输出，因此三棵树是完全一样的。这时候如果我们执行 <code>git reset --soft HEAD~</code>来回到上一个提交，实际上是移动了当前分支（是一个指针）已到了上一次提交，HEAD 也跟着移动过去了，reset 执行就到此为止了，没有修改暂存区/工作区数据。</p><p><img src="'+D+'" alt="" loading="lazy"></p><p>而如果执行的是<code>git reset --mixed HEAD~</code>，那么会进一步的，用 HEAD 指向的快照来更新暂存区内的数据，这也是 reset 无参的缺省行为。</p><p><img src="'+y+'" alt="" loading="lazy"></p><p>而如果执行的是<code>git reset --hard HEAD~</code>，那么会再进一步的，用 HEAD 指向的快照来更新暂存区，以及工作区内的数据，并且是强制的没有任何提示的，所以是一个危险的操作！</p><p><img src="'+H+'" alt="" loading="lazy"></p><p>最后如果执行的是<code>git reset file.txt</code>带有文件路径的形式，那么本质上只是将某个文件从快照中复制到暂存区。</p><p><img src="'+w+`" alt="" loading="lazy"></p><p>搞懂了 reset 之后，再看 checkout 就容易多了，checkout 实际上只是移动了 HEAD 指针指向另一个分支指向的提交，并没有改变任何分支的指针。</p><h3 id="hooks" tabindex="-1"><a class="header-anchor" href="#hooks"><span>Hooks</span></a></h3><p>Git 支持在特定的重要动作发生时触发自定义脚本，即钩子，存放在<code>.git/hooks</code>目录下。分类如下：</p><ul><li>客户端钩子：clone 时不随同复制 <ul><li>提交工作流： <ul><li><code>pre-commit</code>键入提交信息前运行，如果以非0值退出将放弃提交。用于检查即将提交的快照</li><li><code>prepare-commit-msg</code>启动提交信息编辑器之前，默认信息被创建之后运行。可以编辑默认的提交信息</li><li><code>commit-msg</code>提交信息编辑后运行，非0值退出将放弃提交。可以校验项目状态和提交信息</li><li><code>post-commit</code>整个提交过程完成后运行，可用于通知事件</li></ul></li><li>电子邮件：由<code>git am</code>命令调用 <ul><li><code>applypatch-msg</code>、<code>pre-applypatch</code>、<code>post-applypatch</code></li></ul></li><li>其它： <ul><li><code>pre-rebase</code>运行于变基之前，非0值退出将中止变基</li><li><code>post-rewrite</code>被那些会替换提交记录的命令调用，如 <code>git rebase</code></li><li><code>post-checkout</code> checkout 执行成功后运行，可以调整工作目录</li><li><code>post-merge</code> merge 执行成功后运行，可以恢复 Git 无法跟踪的工作区数据</li><li><code>pre-push</code>在<code>git push</code>运行期间， 更新了远程引用但尚未传送对象时被调用</li><li><code>pre-auto-gc</code>垃圾回收开始之前被调用</li></ul></li></ul></li><li>服务端钩子： <ul><li><code>pre-receive</code>处理来自客户端的推送操作时运行，非0值退出将拒绝推送更新</li><li><code>update</code>也是处理客户端推送，但会为每个分支各执行一次，哪个运行结果非0就拒绝更新哪个分支</li><li><code>post-receive</code>整个过程完结以后运行，可以用来更新其他系统服务或者通知用户</li></ul></li></ul><h3 id="数据恢复" tabindex="-1"><a class="header-anchor" href="#数据恢复"><span>数据恢复</span></a></h3><p>如果因为意外丢失了一些有用的提交，Git 有一些方式可以恢复丢失的提交数据：</p><ul><li>Reflog 日志：提交或改变分支时，Git 会在该日志中记录 HEAD 修改的值</li><li>fsck：该工具可以检查数据库的完整性，显示出所有悬空的对象（没有被其它对象指向）</li></ul><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 查看 HEAD 引用的变更记录</span>
<span class="token function">git</span> reflog
<span class="token function">git</span> log <span class="token parameter variable">-g</span>
<span class="token comment"># 找到需要的提交记录，创建一个新分支指向它</span>
<span class="token function">git</span> branch recover_branch 118cccf
<span class="token comment"># 切换到所需的提交即可</span>
<span class="token function">git</span> checkout recover_branch

<span class="token comment"># 校验数据库完整性，找出所需的提交</span>
<span class="token function">git</span> <span class="token function">fsck</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="其它" tabindex="-1"><a class="header-anchor" href="#其它"><span>其它</span></a></h3><ol><li><strong>Rerere</strong> = <strong>Reuse Recorded Resolution</strong>，可以实现重用冲突解决的方案，通过<code>git config rerere.enabled true</code>开启这个功能后，会自动记录合并冲突的解决方案，后续遇到相同的冲突（很罕见的场景吧...）会自动应用解决方案。</li></ol><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 重用记录状态</span>
<span class="token function">git</span> rerere status

<span class="token comment"># 显式解决方案的当前状态</span>
<span class="token function">git</span> rerere <span class="token function">diff</span>

<span class="token comment"># 应用解决方案</span>
<span class="token function">git</span> rerere
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ol start="2"><li>Git 提供了一些辅助调试的命令：</li></ol><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 显式文件的 70-80 行，每行最后一次修改对应的提交记录; -C 自动追踪复制源</span>
<span class="token function">git</span> blame <span class="token parameter variable">-L</span> <span class="token number">70,80</span> <span class="token parameter variable">-C</span> file.txt

<span class="token comment"># 在提交之间以二分的方式检出，标记 good/bad 从而快速找出出问题的首次提交</span>
<span class="token function">git</span> bisect start
<span class="token function">git</span> bisect run test-error.sh
<span class="token function">git</span> bisect good/bad
<span class="token function">git</span> bisect reset
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ol start="3"><li>Git 支持子模块功能，允许将一个 Git 仓库作为另一个仓库的子目录，同时保持提交的独立。</li></ol><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token function">git</span> submodule <span class="token function">add</span> https://github.com/<span class="token operator">&lt;</span>username<span class="token operator">&gt;</span>/<span class="token operator">&lt;</span>repo<span class="token operator">&gt;</span>
<span class="token function">git</span> submodule init
<span class="token function">git</span> submodule update
<span class="token function">git</span> submodule <span class="token function">sync</span> <span class="token parameter variable">--recursive</span>
<span class="token function">git</span> submodule foreach <span class="token string">&#39;git stash&#39;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ol start="4"><li>Bundle 打包功能可以将更新打包成一个二进制文件，用于传输。</li></ol><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 创建一个 repo.bundle 包含所有用于重建 master 分支所需的数据</span>
<span class="token function">git</span> bundle create repo.bundle HEAD master
<span class="token comment"># 指定打包区间</span>
<span class="token function">git</span> bundle create commits.bundle master ^9a466c5
<span class="token comment"># 验证打包</span>
<span class="token function">git</span> bundle verify commits.bundle
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ol start="5"><li>Git 拥有一个凭证系统处理身份认证，有以下几种选项：</li></ol><ul><li>默认所有都不缓存。 每一次连接都会询问你的用户名和密码</li><li><strong>cache</strong> 模式会将凭证存放在内存中一段时间，例如 15 分钟后从内存中清除</li><li>**store **凭证用明文的形式存放在磁盘中，并且永不过期</li><li>Mac 的 osxkeychain 模式会将凭证存入提供的钥匙串中</li><li>Windows 下有类似的 Git Credential Manager for Windows 辅助工具</li></ul><h2 id="内部原理" tabindex="-1"><a class="header-anchor" href="#内部原理"><span>内部原理</span></a></h2><p>从根本上来讲，Git 是一个内容寻址文件系统，核心部分是一个简单的键值对数据库，在此之上提供了一个版本控制系统的用户界面。</p><h3 id="目录结构" tabindex="-1"><a class="header-anchor" href="#目录结构"><span>目录结构</span></a></h3><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code>$ <span class="token function">ls</span> <span class="token parameter variable">-F1</span>
hooks/				<span class="token comment"># 客户端/服务端的钩子脚本</span>
info/				<span class="token comment"># 全局性排除文件，放置不希望记录到 .gitignore 文件的忽略模式</span>
objects/			<span class="token comment"># 存储所有数据内容</span>
refs/				<span class="token comment"># 存储指向数据的提交对象的指针</span>
config				<span class="token comment"># 本仓库特定的配置文件</span>
description		        <span class="token comment"># 供 GitWeb 程序使用，无需关心</span>
HEAD				<span class="token comment"># HEAD 指针当前的引用</span>
index				<span class="token comment"># 保存暂存区信息</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="git-对象" tabindex="-1"><a class="header-anchor" href="#git-对象"><span>Git 对象</span></a></h3><p>每次运行 git add 、git commit 命令时，Git 所做的实质上就是：</p><ol><li>将被改写的文件保存为<strong>数据对象 blob</strong></li><li>更新暂存区，记录<strong>树对象 tree</strong></li><li>最后创建一个指明顶层树对象和父提交的<strong>提交对象 commit</strong></li></ol><p>数据对象、树对象、提交对象 三种主要的 Git 对象均以单独文件的形式保存在<code>.git/objects</code>目录下。</p><p><img src="`+C+`" alt="" loading="lazy"></p><p>操纵 Git 对象的命令有以下的一些底层命令，也是 Git 上层命令实际调用的方法。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 返回对象的 hash 键，-w 写入数据库</span>
<span class="token function">git</span> hash-object <span class="token parameter variable">-w</span> xxx.txt

<span class="token comment"># 查阅对象</span>
<span class="token comment"># -p 判断对象内容类型，显式大致内容</span>
<span class="token comment"># -t 打印对象类型，如 blob/tree/commit</span>
<span class="token comment"># -s 查看大小</span>
<span class="token function">git</span> cat-file <span class="token parameter variable">-p</span> d670460b4b4aece5915caf5c68d12f560a9fe3e4

<span class="token comment"># 手动加入暂存区，100644 普通文件，100755 可执行文件，120000 符号链接</span>
<span class="token function">git</span> update-index <span class="token parameter variable">--add</span> <span class="token parameter variable">--cacheinfo</span> <span class="token number">100644</span> 83baae618040<span class="token punctuation">..</span>. file.txt
<span class="token comment"># 将暂存区内容写入一个树对象</span>
<span class="token function">git</span> write-tree
<span class="token comment"># 将一个已有的树读入暂存区</span>
<span class="token function">git</span> read-tree <span class="token parameter variable">--prefix</span><span class="token operator">=</span>bak d8329f<span class="token punctuation">..</span>.

<span class="token comment"># 创建提交对象，-p 指定父提交</span>
<span class="token function">git</span> commmit-tree <span class="token operator">&lt;</span>tree<span class="token operator">&gt;</span> <span class="token parameter variable">-p</span> <span class="token operator">&lt;</span>parent<span class="token operator">&gt;</span>
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="git-引用" tabindex="-1"><a class="header-anchor" href="#git-引用"><span>Git 引用</span></a></h3><p>GIt 中通过引用 refs (references) 来替代原始的 SHA-1 值，更加简便。引用都保存在<code>.git/refs</code>目录下，包括<code>heads</code>保存分支引用、<code>tags</code>标签引用、<code>refs/remotes</code>远程引用等。HEAD 文件是一个特殊的引用，通常是一个符号引用（指向其它引用），指向目前所在的分支，除非是处在<code>detached HEAD</code>分离头指针状态。</p><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># 更新某个引用，所以说分支的本质就是指向某个提交的指针</span>
<span class="token comment"># git branch &lt;branch&gt; 或 checkout 实际就是执行 update-ref</span>
<span class="token function">git</span> update-ref refs/heads/master 1a410efbd<span class="token punctuation">..</span>.
<span class="token comment"># 创建标签引用</span>
<span class="token function">git</span> update-ref refs/tags/v1.0 cac0cab

<span class="token comment"># 查看 HEAD 指向的引用</span>
<span class="token function">git</span> symbolic-ref HEAD
<span class="token comment"># 指定 HEAD 引用</span>
<span class="token function">git</span> symbolic-ref HEAD refs/heads/test
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>不同于数据对象、树对象、提交对象，标签引用是一个永远指向某个提交对象的对象。而远程引用是一种只读的，只有在跟服务器通信时才会更新的对象，在执行完<code>git remote add</code>后，<code>.git/config</code>中会自动添加一个小节，指定远程版本库名称、URL，以及对应的引用规范 <code>+&lt;src&gt;:&lt;dst&gt;</code>：</p><ul><li><code>+</code>表示即使在不能快进的情况下也要强制更新引用</li><li><code>&lt;src&gt;</code>是一个代表远程版本库引用的模式，只能全部通配，不能部分通配</li><li><code>&lt;dst&gt;</code>是本地跟踪的远程引用的位置</li></ul><div class="language-bash line-numbers-mode" data-ext="sh" data-title="sh"><pre class="language-bash"><code><span class="token comment"># fetch 时获取远程服务器的 refs/heads 下的所有引用，写入本地的 refs/remotes/origin 中</span>
<span class="token comment"># push 时推送本地的 master 到远程服务器上的 qa/master 分支</span>
<span class="token punctuation">[</span>remote <span class="token string">&quot;origin&quot;</span><span class="token punctuation">]</span>
	url <span class="token operator">=</span> https://github.com/schacon/simplegit-progit
	fetch <span class="token operator">=</span> +refs/heads/*:refs/remotes/origin/*
  push <span class="token operator">=</span> refs/heads/master:refs/heads/qa/master

<span class="token comment"># 一下三个命令等价</span>
<span class="token function">git</span> log origin/master
<span class="token function">git</span> log remotes/origin/master
<span class="token function">git</span> log refs/remotes/origin/master

<span class="token comment"># 本地的 空 推送到远程的 topic，可以实现删除远程服务器上的 topic 引用</span>
<span class="token function">git</span> push origin :topic
<span class="token function">git</span> push origin <span class="token parameter variable">--delete</span> topic
</code></pre><div class="line-numbers" aria-hidden="true"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div>`,90);function L(U,Z){const e=l("ExternalLinkIcon");return c(),o("div",null,[q,s("p",null,[n("log 命令打印提交历史记录，支持很多种格式化工具，调整输出样式，并且支持多种过滤器限定事件、作者、关键字等等，详细参数参考 "),s("a",P,[n("Git - 查看提交历史"),t(e)]),n("。")]),S,s("p",null,[s("a",B,[n("https://github.com/github/gitignore"),t(e)]),n(" 给出了针对各种项目和语言的忽略跟踪文件，或者直接问 ChatGPT 吧更方便。")]),T,s("p",null,[n("另外，团队可以根据不同的需求和常见，选择合适的分支开发流，如集中式、集成管理者、主管与副主管等等，可以参考："),s("a",R,[n("5 个 Git 工作流，改善你的开发流程 - 削微寒 - 博客园"),t(e)]),n("。")]),V])}const W=i(z,[["render",L],["__file","git-pro.html.vue"]]),M=JSON.parse('{"path":"/coding/git-pro.html","title":"Pro Git 阅读笔记","lang":"zh-CN","frontmatter":{"title":"Pro Git 阅读笔记","date":"2023-11-09T00:00:00.000Z","category":["工具"],"tag":["Git"],"description":"闲来无事，读一读 Git Pro —— Git 圣经，记录一些以前没有注意过的问题和底层实现的原理。 起步 特点 Git 和其它版本控制系统在对待数据的方式上有很大的区别，大部分 VCS 系统（如 CVS、Subversion、Perforce等）以文件变更列表的方式存储系统，也就是基于文件的差异进行版本控制。 deltas 但是 Git 把数据看作是...","head":[["meta",{"property":"og:url","content":"https://xchanper.github.io/coding/git-pro.html"}],["meta",{"property":"og:site_name","content":"chanper"}],["meta",{"property":"og:title","content":"Pro Git 阅读笔记"}],["meta",{"property":"og:description","content":"闲来无事，读一读 Git Pro —— Git 圣经，记录一些以前没有注意过的问题和底层实现的原理。 起步 特点 Git 和其它版本控制系统在对待数据的方式上有很大的区别，大部分 VCS 系统（如 CVS、Subversion、Perforce等）以文件变更列表的方式存储系统，也就是基于文件的差异进行版本控制。 deltas 但是 Git 把数据看作是..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2024-06-20T04:55:20.000Z"}],["meta",{"property":"article:tag","content":"Git"}],["meta",{"property":"article:published_time","content":"2023-11-09T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2024-06-20T04:55:20.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Pro Git 阅读笔记\\",\\"image\\":[\\"\\"],\\"datePublished\\":\\"2023-11-09T00:00:00.000Z\\",\\"dateModified\\":\\"2024-06-20T04:55:20.000Z\\",\\"author\\":[]}"]]},"headers":[{"level":2,"title":"起步","slug":"起步","link":"#起步","children":[{"level":3,"title":"特点","slug":"特点","link":"#特点","children":[]},{"level":3,"title":"三种状态","slug":"三种状态","link":"#三种状态","children":[]},{"level":3,"title":"配置文件","slug":"配置文件","link":"#配置文件","children":[]}]},{"level":2,"title":"基础","slug":"基础","link":"#基础","children":[{"level":3,"title":"本地命令","slug":"本地命令","link":"#本地命令","children":[]},{"level":3,"title":"远程仓库","slug":"远程仓库","link":"#远程仓库","children":[]},{"level":3,"title":"标签","slug":"标签","link":"#标签","children":[]},{"level":3,"title":".gitignore 规则","slug":"gitignore-规则","link":"#gitignore-规则","children":[]}]},{"level":2,"title":"分支","slug":"分支","link":"#分支","children":[{"level":3,"title":"分支结构","slug":"分支结构","link":"#分支结构","children":[]},{"level":3,"title":"分支管理","slug":"分支管理","link":"#分支管理","children":[]},{"level":3,"title":"分支合并","slug":"分支合并","link":"#分支合并","children":[]},{"level":3,"title":"变基","slug":"变基","link":"#变基","children":[]},{"level":3,"title":"远程分支","slug":"远程分支","link":"#远程分支","children":[]}]},{"level":2,"title":"高级工具","slug":"高级工具","link":"#高级工具","children":[{"level":3,"title":"提交引用","slug":"提交引用","link":"#提交引用","children":[]},{"level":3,"title":"贮藏清理","slug":"贮藏清理","link":"#贮藏清理","children":[]},{"level":3,"title":"重写历史","slug":"重写历史","link":"#重写历史","children":[]},{"level":3,"title":"Hooks","slug":"hooks","link":"#hooks","children":[]},{"level":3,"title":"数据恢复","slug":"数据恢复","link":"#数据恢复","children":[]},{"level":3,"title":"其它","slug":"其它","link":"#其它","children":[]}]},{"level":2,"title":"内部原理","slug":"内部原理","link":"#内部原理","children":[{"level":3,"title":"目录结构","slug":"目录结构","link":"#目录结构","children":[]},{"level":3,"title":"Git 对象","slug":"git-对象","link":"#git-对象","children":[]},{"level":3,"title":"Git 引用","slug":"git-引用","link":"#git-引用","children":[]}]}],"git":{"createdTime":1718859320000,"updatedTime":1718859320000,"contributors":[{"name":"chanper","email":"qianchaosolo@gmail.com","commits":1}]},"filePathRelative":"coding/git-pro.md","localizedDate":"2023年11月9日","autoDesc":true}');export{W as comp,M as data};
