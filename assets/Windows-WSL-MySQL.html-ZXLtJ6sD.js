import{_ as s}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,d as e,b as l,a as t,o as n}from"./app-B07DzZWU.js";const h="/img/show_password_policy.jpg",p="/img/%E6%B3%A8%E9%87%8Abind.jpg",r="/img/wsl_ip.jpg",d="/img/windows%E8%BF%9C%E7%A8%8B%E8%BF%9E%E6%8E%A5mysql.jpg",k="/img/master_status.jpg",o="/img/slave_status.jpg",g="/img/master_test.jpg",c="/img/slave_test.jpg",A={};function y(m,i){return n(),a("div",null,[i[0]||(i[0]=e("p",null,"本文介绍 Windows 连接 WSL 中的 MySQL 服务，并配置主从同步。",-1)),l(" more "),i[1]||(i[1]=t('<h2 id="step0-调整wsl下mysql的密码安全策略-可选" tabindex="-1"><a class="header-anchor" href="#step0-调整wsl下mysql的密码安全策略-可选"><span>Step0. 调整WSL下MySQL的密码安全策略 - 可选</span></a></h2><p>Linux下，MySQL默认的强密码策略比较麻烦，如果只在自己机器上实验可以先修改一下密码校验策略。查看当前的密码设置策略： <code>SHOW variables LIKE &#39;validate_password%&#39;;</code></p><figure><img src="'+h+`" alt="show_password_policy" tabindex="0" loading="lazy"><figcaption>show_password_policy</figcaption></figure><p>其中，</p><ul><li>validate_password.check_user_name: 是否可以将用户名用作密码</li><li>validate_password.dictionary_file: 密码策略文件，文件中存在的密码不得使用。仅<code>STRONG</code>策略下才生效</li><li>validate_password.length: 密码长度限制</li><li>validate_password.mixed_case_count: 大小写字母个数限制</li><li>validate_password.number_count: 数字个数限制</li><li>validate_password.policy: <ul><li>#<code>0 or LOW</code>: 限制 Length</li><li>#<code>1 or MEDIUM</code>: 限制 Length; numeric, lowercase/uppercase, and special characters</li><li>#<code>2 or STRONG</code>: 限制 Length; numeric, lowercase/uppercase, and special characters; dictionary file</li></ul></li><li>validate_password.special_char_count: 特殊字符个数限制</li></ul><p>这是MySQL 8.0之后validate_password组件提供的功能，如果查询得到<code>validate_password__policy</code>这样下划线拼接的变量则是validate_password的插件实现，存在于老版本的MySQL中。修改策略的话直接使用set命令：</p><div class="language-sql line-numbers-mode" data-highlighter="shiki" data-ext="sql" data-title="sql" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">SET</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> GLOBAL</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> validate_password</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">policy</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">LOW;</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">SET</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> global</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> validate_password</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">length</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;"> =</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;"> 1</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">...</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>然后就可以修改用户密码了</p><div class="language-sql line-numbers-mode" data-highlighter="shiki" data-ext="sql" data-title="sql" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">alter</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> user</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &#39;root&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">@</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;localhost&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> identified </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">by</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &#39;******&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">flush privileges;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>MySQL服务重启后，部分字段可能会恢复默认值，需要重新设置。</p><h2 id="step1-windows-连接-wsl2-中的mysql服务" tabindex="-1"><a class="header-anchor" href="#step1-windows-连接-wsl2-中的mysql服务"><span>Step1. Windows 连接 WSL2 中的MySQL服务</span></a></h2><h3 id="取消地址绑定" tabindex="-1"><a class="header-anchor" href="#取消地址绑定"><span>取消地址绑定</span></a></h3><p>首先修改WSL下MySQL的配置 <code>vim /etc/mysql/mysql.conf.d/mysqld.cnf</code> 将 bind-address 和 mysqlx-bind-address 两行注释掉，取消只能从本机连接的限制</p><figure><img src="`+p+`" alt="注释bind" tabindex="0" loading="lazy"><figcaption>注释bind</figcaption></figure><h3 id="创建远程连接用户" tabindex="-1"><a class="header-anchor" href="#创建远程连接用户"><span>创建远程连接用户</span></a></h3><p>Windows下默认root用户是无法连接WSL下的MySQL，因此需要在WSL下用root新建一个用于远程连接的用户。</p><div class="language-sql line-numbers-mode" data-highlighter="shiki" data-ext="sql" data-title="sql" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">mysql -u </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">root</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> -p</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> </span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">-- root用户没有SYSTEM_USER权限，需要先赋权</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">grant</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> system_user </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">on</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> *.* </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">to</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &#39;root&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> </span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">-- 新建 test/123456 的用户</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">CREATE</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> USER</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> &#39;</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">test</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">&#39;@</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;%&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> IDENTIFIED </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">BY</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &#39;123456&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">GRANT</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> ALL </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">ON</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> *.* </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">TO</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &#39;test&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">@</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;%&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">; </span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">FLUSH PRIVILEGES;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><h3 id="通过wsl地址连接服务" tabindex="-1"><a class="header-anchor" href="#通过wsl地址连接服务"><span>通过WSL地址连接服务</span></a></h3><p>然后我们在WSL中用<code>ifconfig</code>查询得到 WSL 的 IP 地址： <img src="`+r+'" alt="wsl_ip" loading="lazy"></p><p>这样就可以在 Windows 下连接 WSL 中的 MySQL 服务了: <img src="'+d+`" alt="windows远程连接mysql" loading="lazy"></p><h2 id="step2-配置主从同步" tabindex="-1"><a class="header-anchor" href="#step2-配置主从同步"><span>Step2. 配置主从同步</span></a></h2><p>这里我们让 Windows 上的 MySQL 作为 Master，WSL 上的 MySQL 作为 Slave。</p><h3 id="主库-master-配置" tabindex="-1"><a class="header-anchor" href="#主库-master-配置"><span>主库 Master 配置</span></a></h3><ol><li>设置同步的数据库 Windows 系统的 MySQL 配置文件是安装目录下的 my.ini 文件，如果没有的话可以自己新建一个。然后打开输入以下内容：</li></ol><div class="language-properties line-numbers-mode" data-highlighter="shiki" data-ext="properties" data-title="properties" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">[mysqld]</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#C678DD;">server-id</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#98C379;">1                 </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 服务的id，每台机器必须都不一样</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#C678DD;">log-bin</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#98C379;">mysql-bin           </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 二进制日志</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#C678DD;">binlog-ignore-db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#98C379;">mysql      </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 指定不需要复制的数据库</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#C678DD;">binlog-do-db</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#98C379;">reggie         </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 指定需要复制的数据库，可以分多行指定。优先级大于 binlog-ignore-db</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ol start="2"><li>创建新用户用于Slave来连接主库</li></ol><div class="language-sql line-numbers-mode" data-highlighter="shiki" data-ext="sql" data-title="sql" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">CREATE</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> USER</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> &#39;</span><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">chanper</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">&#39;@</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;%&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> IDENTIFIED </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">WITH</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> mysql_native_password </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">by</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &#39;******&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">-- 赋予从库复制权限</span></span>
<span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">grant</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> replication slave </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">on</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> *.* </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">to</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &#39;chanper&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">@</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;%&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">FLUSH PRIVILEGES;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><ol start="3"><li><p>复制主库数据 如果主库先前已经有数据了，需要先把数据复制到从库中，可以通过<code>mysqldump</code>实现，idea中也有现成的导出导入操作。</p></li><li><p>查看 Master 状态 执行 <code>show master status;</code> 命令：</p></li></ol><figure><img src="`+k+`" alt="master_status" tabindex="0" loading="lazy"><figcaption>master_status</figcaption></figure><p>关注 <code>File, Position</code> 两个值，后面配置从库时要用到。</p><h3 id="从库-slave-配置" tabindex="-1"><a class="header-anchor" href="#从库-slave-配置"><span>从库 Slave 配置</span></a></h3><ol><li><p>修改 WSL 的 MySQL 配置 还是 <code>vim /etc/mysql/mysql.conf.d/mysqld.cnf</code> 这个文件，加入：</p><div class="language-properties line-numbers-mode" data-highlighter="shiki" data-ext="properties" data-title="properties" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">[mysqld]</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#C678DD;">server-id</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">=</span><span style="--shiki-light:#383A42;--shiki-dark:#98C379;">2</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><p>然后保存，并重启MySQL服务</p></li><li><p>连接主库 登录WSL的MySQL，并执行：</p><div class="language-sql line-numbers-mode" data-highlighter="shiki" data-ext="sql" data-title="sql" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">change </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">master</span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;"> to</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> </span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">master_host</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;172.29.96.1&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">master_port</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">3306</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">master_user</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;chanper&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">master_password</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;******&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">master_log_file</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&#39;mysql-bin.000002&#39;</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">, </span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">master_log_pos</span><span style="--shiki-light:#383A42;--shiki-dark:#56B6C2;">=</span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">547</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>各字段的含义都一眼便知，都是主库 Master 的配置信息</p></li><li><p>启动并查看 Slave 状态</p><div class="language-sql line-numbers-mode" data-highlighter="shiki" data-ext="sql" data-title="sql" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">start</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;"> slave;             </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">-- 相应的停止同步就是 stop slave</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">show slave </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">status</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">\\G;     </span><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">-- \\G-格式化输出</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div></div></div><figure><img src="`+o+'" alt="slave_status" tabindex="0" loading="lazy"><figcaption>slave_status</figcaption></figure><p>如果 <code>Slave_IO_Running</code> 和 <code>Slave_SQL_Running</code> 都为 <code>Yes</code> 说明配置成功，其它的状态如<code>No</code>或者<code>Connecting</code>都说明配置有误或者网络无法连通。</p></li><li><p>测试 先在 Slave 中执行查询语句，然后在 Master 中执行删除语句：</p><figure><img src="'+g+'" alt="master_test" tabindex="0" loading="lazy"><figcaption>master_test</figcaption></figure><p>再在 Slave 中查询测试结果：</p><figure><img src="'+c+'" alt="slave_test" tabindex="0" loading="lazy"><figcaption>slave_test</figcaption></figure></li></ol><p>至此，完成了 Windows 和 WSL 上 MySQL服务的主从同步配置。</p><h2 id="参考" tabindex="-1"><a class="header-anchor" href="#参考"><span>参考</span></a></h2><p>[1] <a href="https://blog.csdn.net/stklway/article/details/122360248" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/stklway/article/details/122360248</a> [2] <a href="https://blog.csdn.net/weixin_42580217/article/details/122583888" target="_blank" rel="noopener noreferrer">https://blog.csdn.net/weixin_42580217/article/details/122583888</a> [3] <a href="https://www.chengxulvtu.com/set-up-mysql-8-master-slave-replication/" target="_blank" rel="noopener noreferrer">https://www.chengxulvtu.com/set-up-mysql-8-master-slave-replication/</a></p>',35))])}const u=s(A,[["render",y],["__file","Windows-WSL-MySQL.html.vue"]]),b=JSON.parse(`{"path":"/coding/Windows-WSL-MySQL.html","title":"Windows-WSL 实现MySQL主从同步","lang":"zh-CN","frontmatter":{"title":"Windows-WSL 实现MySQL主从同步","date":"2023-01-20T00:00:00.000Z","category":["数据库"],"tag":["MySQL"],"description":"本文介绍 Windows 连接 WSL 中的 MySQL 服务，并配置主从同步。 Step0. 调整WSL下MySQL的密码安全策略 - 可选 Linux下，MySQL默认的强密码策略比较麻烦，如果只在自己机器上实验可以先修改一下密码校验策略。查看当前的密码设置策略： SHOW variables LIKE 'validate_password%'; ...","head":[["meta",{"property":"og:url","content":"https://xchanper.github.io/coding/Windows-WSL-MySQL.html"}],["meta",{"property":"og:site_name","content":"chanper"}],["meta",{"property":"og:title","content":"Windows-WSL 实现MySQL主从同步"}],["meta",{"property":"og:description","content":"本文介绍 Windows 连接 WSL 中的 MySQL 服务，并配置主从同步。 Step0. 调整WSL下MySQL的密码安全策略 - 可选 Linux下，MySQL默认的强密码策略比较麻烦，如果只在自己机器上实验可以先修改一下密码校验策略。查看当前的密码设置策略： SHOW variables LIKE 'validate_password%'; ..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://xchanper.github.io/img/show_password_policy.jpg"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-01-01T14:37:57.000Z"}],["meta",{"property":"article:tag","content":"MySQL"}],["meta",{"property":"article:published_time","content":"2023-01-20T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2025-01-01T14:37:57.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Windows-WSL 实现MySQL主从同步\\",\\"image\\":[\\"https://xchanper.github.io/img/show_password_policy.jpg\\",\\"https://xchanper.github.io/img/%E6%B3%A8%E9%87%8Abind.jpg\\",\\"https://xchanper.github.io/img/wsl_ip.jpg\\",\\"https://xchanper.github.io/img/windows%E8%BF%9C%E7%A8%8B%E8%BF%9E%E6%8E%A5mysql.jpg\\",\\"https://xchanper.github.io/img/master_status.jpg\\",\\"https://xchanper.github.io/img/slave_status.jpg\\",\\"https://xchanper.github.io/img/master_test.jpg\\",\\"https://xchanper.github.io/img/slave_test.jpg\\"],\\"datePublished\\":\\"2023-01-20T00:00:00.000Z\\",\\"dateModified\\":\\"2025-01-01T14:37:57.000Z\\",\\"author\\":[]}"]]},"headers":[{"level":2,"title":"Step0. 调整WSL下MySQL的密码安全策略 - 可选","slug":"step0-调整wsl下mysql的密码安全策略-可选","link":"#step0-调整wsl下mysql的密码安全策略-可选","children":[]},{"level":2,"title":"Step1. Windows 连接 WSL2 中的MySQL服务","slug":"step1-windows-连接-wsl2-中的mysql服务","link":"#step1-windows-连接-wsl2-中的mysql服务","children":[{"level":3,"title":"取消地址绑定","slug":"取消地址绑定","link":"#取消地址绑定","children":[]},{"level":3,"title":"创建远程连接用户","slug":"创建远程连接用户","link":"#创建远程连接用户","children":[]},{"level":3,"title":"通过WSL地址连接服务","slug":"通过wsl地址连接服务","link":"#通过wsl地址连接服务","children":[]}]},{"level":2,"title":"Step2. 配置主从同步","slug":"step2-配置主从同步","link":"#step2-配置主从同步","children":[{"level":3,"title":"主库 Master 配置","slug":"主库-master-配置","link":"#主库-master-配置","children":[]},{"level":3,"title":"从库 Slave 配置","slug":"从库-slave-配置","link":"#从库-slave-配置","children":[]}]},{"level":2,"title":"参考","slug":"参考","link":"#参考","children":[]}],"git":{"createdTime":1735742277000,"updatedTime":1735742277000,"contributors":[{"name":"chanper","email":"qianchaosolo@gmail.com","commits":1}]},"filePathRelative":"coding/Windows-WSL-MySQL.md","localizedDate":"2023年1月20日","autoDesc":true}`);export{u as comp,b as data};