import{_ as s}from"./plugin-vue_export-helper-DlAUqK2U.js";import{c as a,a as n,o as e}from"./app-B07DzZWU.js";const l="/img/blog-action-procedure.svg",t="/img/github-pat.png",h="/img/github-secrets.png",p="/img/github-pages.png",r="/img/vercel-blog.png",k="/img/vercel-dns-record.png",d="/img/dynadot-dns.png",c={};function o(g,i){return e(),a("div",null,i[0]||(i[0]=[n('<h2 id="背景" tabindex="-1"><a class="header-anchor" href="#背景"><span>背景</span></a></h2><p>之前个人博客都是基于 <a href="https://v2.vuepress.vuejs.org/zh/" target="_blank" rel="noopener noreferrer">VuePress</a>，直接整个项目上传到 Github 公共仓库中，然后利用 <a href="https://docs.github.com/en/actions" target="_blank" rel="noopener noreferrer">Github Actions</a> 直接构建到仓库中的一个分支上，再把这个分支部署到 <a href="https://pages.github.com/" target="_blank" rel="noopener noreferrer">Github Pages</a> 上，就这样用了很久，但是一直有几个问题比较困扰：</p><ul><li>源码公开可见，可以被随意复制粘贴到别的地方</li><li>修改记录一览无遗，没有隐私性</li><li>部分文档不想公开，即使删除后，仍能通过提交记录找回来</li></ul><p>综上，网上搜索一番后，发现可以通过 GitHub 创建私有仓库，把源码提交到私有仓库后，通过 Actions 触发自动构建，并推送到一个公开仓库中，再在公开仓库中触发 Github Pages 的部署流程，完成博客更新发布的自动化流程。</p><figure><img src="'+l+`" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><blockquote><p>GitHub Actions 是 GitHub 提供的一种自动化工作流服务，用于构建、测试和部署项目。它允许你在代码仓库中配置和运行自动化的工作流程，以响应各种事件，比如代码推送、Pull 请求合并等。GitHub Actions 可以帮助团队自动化软件开发过程中的重复性任务，提高效率并确保代码的质量。</p><p>GitHub Pages 是 GitHub 提供的一项免费静态网站托管服务。它允许你使用 GitHub 仓库来托管和发布个人、项目或组织的静态网页。</p></blockquote><h2 id="折腾" tabindex="-1"><a class="header-anchor" href="#折腾"><span>折腾</span></a></h2><p>首先我们需要在 Github 创建一个私有的仓库叫 private_repo，并将本地的 Vuepress 博客项目和 private_repo 关联起来：</p><div class="language-shell line-numbers-mode" data-highlighter="shiki" data-ext="shell" data-title="shell" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">git</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> remote</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> add</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> origin</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> https://github.com/</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">&lt;</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">usernam</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">e&gt;</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">/private_repo</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>然后修改博客项目根目录下 <code>.github/workflows/deploy.yml</code>文件，在 workflows 目录下的文件都会被尝试解析为工作流。</p><div class="language-yml line-numbers-mode" data-highlighter="shiki" data-ext="yml" data-title="yml" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 工作流名称</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">Publish Blog</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 当推送到 main 分支时触发任务</span></span>
<span class="line"><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">on</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  push</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    branches</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">main</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;"># 工作流</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">jobs</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">  # 名称   </span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">  build-and-push</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    # 运行环境</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    runs-on</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">ubuntu-latest</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">    # 步骤</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">    steps</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">检出项目</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        uses</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">actions/checkout@v4</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        with</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">          # 拉取记录数，因为只需要基于最新的版本构建，所以设为1就好</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          fetch-depth</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">1</span></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">      # 下面三个步骤是 VuePress 的构建流程，根据不同 Static Site Generators 自定义 </span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">安装 pnpm</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        uses</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">pnpm/action-setup@v2</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        with</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          version</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">8</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          run_install</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">true</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">设置 Node.js</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        uses</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">actions/setup-node@v4</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        with</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          node-version</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">18</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          cache</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">pnpm</span></span>
<span class="line"></span>
<span class="line"></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">构建文档</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        env</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          NODE_OPTIONS</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">--max_old_space_size=8192</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        run</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#A626A4;--shiki-dark:#C678DD;">|-</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">          pnpm run docs:build</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">          &gt; src/.vuepress/dist/.nojekyll</span></span>
<span class="line"><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">     </span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">      # 关键步骤：利用这个 action 将生成的文档 push 到指定仓库</span></span>
<span class="line"><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">      - </span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">name</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">部署到公共仓库</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        uses</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">peaceiris/actions-gh-pages@v3</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">        with</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">:</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">          # Personal Access Token 下面讲 </span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          personal_token</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">\${{ secrets.PUBLISH_BLOG }}</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">          # 指定push的仓库  </span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          external_repository</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">&lt;username&gt;/public_repo</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">          # 指定push的分支</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          publish_branch</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">main</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">          # push 的目录</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          publish_dir</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">src/.vuepress/dist</span></span>
<span class="line"><span style="--shiki-light:#A0A1A7;--shiki-light-font-style:italic;--shiki-dark:#7F848E;--shiki-dark-font-style:italic;">          # 是否只保留最新的提交记录</span></span>
<span class="line"><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">          force_orphan</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">: </span><span style="--shiki-light:#986801;--shiki-dark:#D19A66;">true</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div><div class="line-number"></div></div></div><p>然后我们再到 Github 上创建一个公共仓库 public_repo，然后到 Settings -&gt; developer settings -&gt; Personal access tokens -&gt; Fine-grained tokens 创建一个 Personal Access Token（PAT）。这里 Github 提供了两种 PAT：</p><ul><li><strong>Fine-grained tokens</strong>：细粒度的访问令牌，可以指定适用的仓库，有效期最多一年</li><li><strong>Tokens</strong>：经典访问令牌，无法指定具体仓库，粒度较粗，有效期可以无限</li></ul><figure><img src="`+t+'" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>推荐使用新的 Fined-grained tokens，更加安全，有效期可以长一点，偶尔维护一下也不麻烦。给予这个 token 公共仓库 public_repo 的读写权限即可，生成后记得复制一下 token，因为关闭页面后这个 token 就看不到值了。</p><p>然后我们到 <strong>private_repo</strong> 的 Settings -&gt; Secrets and variables -&gt; Actions 页面，创建一个 Secret，名称任意，value 就填刚刚生成的 PAT 即可。</p><figure><img src="'+h+'" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>这一步的原因在于，Github Actions 是在一个容器里运行的，因此要推送代码到某个仓库前必须通过某种方式验证对这个仓库有读写权限。上一步创建的 PAT 正好就授予了 public_repo 的读写权限，因此 private_repo 这个仓库在执行 Github Actions 时，可以通过<code>${{ secrets.&lt;secret_name&gt; }}</code>这样的形式来引用这个 PAT，进而通过权限系统的校验。</p><p>最后，我们把本地的 VuePress 项目推送到 private_repo，就会自动触发构建流程推送到 public_repo 了，记得在 public_repo 中开启 Github Pages，从主分支的根目录执行部署即可。</p><figure><img src="'+p+'" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>文末参考的几篇文章里都是使用手动执行 Shell 脚本的方式去推送，比如通过</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">git</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> push</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> &quot;https://</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">${{github.actor}}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">:</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">${{secrets.pat}}</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;">@github.com/username/xxx.git&quot;</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>这种基于<em>用户名+密码</em>的校验方式去验证，但 <a href="https://github.blog/2020-12-15-token-authentication-requirements-for-git-operations/#what-you-need-to-do-today" target="_blank" rel="noopener noreferrer">Github 在 2021 年已经关闭这种不安全的验证方式</a>，全部换成基于 Token 的鉴权了。正好在网上偶然看到这么个可以执行自动推送的 action，相比 Shel 脚本使用更方便，看了下<a href="https://github.com/peaceiris/actions-gh-pages/blob/main/src/set-tokens.ts#L105" target="_blank" rel="noopener noreferrer">源码</a>，是通过</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">https://x-access-token:${personalToken}@${getServerUrl</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">().host}/</span><span style="--shiki-light:#E45649;--shiki-dark:#ABB2BF;">${</span><span style="--shiki-light:#E45649;--shiki-dark:#E06C75;">publishRepo</span><span style="--shiki-light:#E45649;--shiki-dark:#ABB2BF;">}</span><span style="--shiki-light:#383A42;--shiki-dark:#ABB2BF;">.git</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>利用<code>x-access-token</code>头部实现的鉴权。</p><h2 id="vercel-部署" tabindex="-1"><a class="header-anchor" href="#vercel-部署"><span>Vercel 部署</span></a></h2><p>突然想到自己还有个 Dynadot 白嫖的域名没用上，这次顺便给他用起来的吧。先到 Vercel 上授权 Github 仓库，然后同样的，设置从 public_repo 的根目录直接部署即可。主要是利用 Vercel 实现自定义域名和 CDN 加速，服务器是必不可能买的。</p><blockquote><p>Vercel 提供了一种简单而强大的方式来部署和托管前端应用程序。其自动化、全球 CDN、Serverless 架构等特性使得开发者能够更专注于应用的开发而不必过多关注基础设施的维护。</p></blockquote><figure><img src="'+r+'" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><p>然后到 Dynadot 上，根据 Vercel - Domain 里面给的提示给域名设置一个 A 记录，等待10分钟让 DNS 记录扩散到全球的 DNS 服务器即可：</p><figure><img src="'+k+'" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><figure><img src="'+d+'" alt="" tabindex="0" loading="lazy"><figcaption></figcaption></figure><hr><p>复习一下 <em><strong>DNS(domain -&gt; IP)</strong></em> 记录类型:</p><ol><li><p><strong>A 记录</strong>: Address Record，将域名映射到 IPv4 地址，例如： <code>example.com IN A 192.168.1.1</code></p></li><li><p><strong>AAAA 记录</strong>：IPv6 Address Record，将域名映射到 IPv6 地址，例如： <code>example.com IN AAAA 2001:0db8:85a3:0000:0000:8a2e:0370:7334</code></p></li><li><p><strong>CNAME 记录</strong>：Canonical Name，用于创建域名的别名，将一个域名指向另一个域名，例如将 www 别名指向 <a href="http://example.com" target="_blank" rel="noopener noreferrer">example.com</a>： <code>www IN CNAME example.com</code></p></li><li><p><strong>MX 记录</strong>： Mail Exchange，指定邮件服务器的域名和优先级，它告诉发送电子邮件的邮件服务器应该将邮件发送到哪个邮件服务器。例如表示邮件服务器 <code>mailserver.example.com</code> 具有优先级为 10： <code>example.com IN MX 10 mailserver.example.com</code></p></li><li><p><strong>PTR 记录</strong>: Pointer Record，用于将 IP 地址映射回域名，主要用于反向 DNS 查找。例如表示 IP 地址 <code>192.168.1.1</code> 对应的域名是 <code>host.example.com</code>： <code>1.1.168.192.in-addr.arpa IN PTR host.example.com</code></p></li><li><p><strong>TXT 记录</strong>：Text Record，用于存储文本信息，它通常用于验证域名的所有权、提供 SPF 记录（用于邮件认证）等。例如： <code>example.com IN TXT &quot;v=spf1 include:_spf.example.com ~all&quot;</code></p></li></ol><p>另外可以通过</p><div class="language-bash line-numbers-mode" data-highlighter="shiki" data-ext="bash" data-title="bash" style="--shiki-light:#383A42;--shiki-dark:#abb2bf;--shiki-light-bg:#FAFAFA;--shiki-dark-bg:#282c34;"><pre class="shiki shiki-themes one-light one-dark-pro vp-code"><code><span class="line"><span style="--shiki-light:#4078F2;--shiki-dark:#61AFEF;">dig</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> +short</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> example.com</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> A</span><span style="--shiki-light:#50A14F;--shiki-dark:#98C379;"> @223.5.5.5</span></span></code></pre><div class="line-numbers" aria-hidden="true" style="counter-reset:line-number 0;"><div class="line-number"></div></div></div><p>命令向指定 DNS 服务器查询指定域名的指定记录。</p><h2 id="参考" tabindex="-1"><a class="header-anchor" href="#参考"><span>参考</span></a></h2><ol><li><a href="https://www.xheldon.com/tech/the-using-of-github-pages.html" target="_blank" rel="noopener noreferrer">https://www.xheldon.com/tech/the-using-of-github-pages.html</a></li><li><a href="https://juejin.cn/post/7008847699919241229" target="_blank" rel="noopener noreferrer">https://juejin.cn/post/7008847699919241229</a></li><li><a href="https://zhangferry.com/2022/07/24/github_action_for_blog_deploy/" target="_blank" rel="noopener noreferrer">https://zhangferry.com/2022/07/24/github_action_for_blog_deploy/</a></li></ol>',40)]))}const b=s(c,[["render",o],["__file","blog-actions.html.vue"]]),m=JSON.parse('{"path":"/life/blog-actions.html","title":"Github 私有仓库 + Actions 自动部署博客","lang":"zh-CN","frontmatter":{"title":"Github 私有仓库 + Actions 自动部署博客","date":"2023-11-28T00:00:00.000Z","category":["博客"],"tag":["折腾"],"description":"背景 之前个人博客都是基于 VuePress，直接整个项目上传到 Github 公共仓库中，然后利用 Github Actions 直接构建到仓库中的一个分支上，再把这个分支部署到 Github Pages 上，就这样用了很久，但是一直有几个问题比较困扰： 源码公开可见，可以被随意复制粘贴到别的地方 修改记录一览无遗，没有隐私性 部分文档不想公开，即使...","head":[["meta",{"property":"og:url","content":"https://xchanper.github.io/life/blog-actions.html"}],["meta",{"property":"og:site_name","content":"chanper"}],["meta",{"property":"og:title","content":"Github 私有仓库 + Actions 自动部署博客"}],["meta",{"property":"og:description","content":"背景 之前个人博客都是基于 VuePress，直接整个项目上传到 Github 公共仓库中，然后利用 Github Actions 直接构建到仓库中的一个分支上，再把这个分支部署到 Github Pages 上，就这样用了很久，但是一直有几个问题比较困扰： 源码公开可见，可以被随意复制粘贴到别的地方 修改记录一览无遗，没有隐私性 部分文档不想公开，即使..."}],["meta",{"property":"og:type","content":"article"}],["meta",{"property":"og:image","content":"https://xchanper.github.io/img/blog-action-procedure.svg"}],["meta",{"property":"og:locale","content":"zh-CN"}],["meta",{"property":"og:updated_time","content":"2025-01-01T14:37:57.000Z"}],["meta",{"property":"article:tag","content":"折腾"}],["meta",{"property":"article:published_time","content":"2023-11-28T00:00:00.000Z"}],["meta",{"property":"article:modified_time","content":"2025-01-01T14:37:57.000Z"}],["script",{"type":"application/ld+json"},"{\\"@context\\":\\"https://schema.org\\",\\"@type\\":\\"Article\\",\\"headline\\":\\"Github 私有仓库 + Actions 自动部署博客\\",\\"image\\":[\\"https://xchanper.github.io/img/blog-action-procedure.svg\\",\\"https://xchanper.github.io/img/github-pat.png\\",\\"https://xchanper.github.io/img/github-secrets.png\\",\\"https://xchanper.github.io/img/github-pages.png\\",\\"https://xchanper.github.io/img/vercel-blog.png\\",\\"https://xchanper.github.io/img/vercel-dns-record.png\\",\\"https://xchanper.github.io/img/dynadot-dns.png\\"],\\"datePublished\\":\\"2023-11-28T00:00:00.000Z\\",\\"dateModified\\":\\"2025-01-01T14:37:57.000Z\\",\\"author\\":[]}"]]},"headers":[{"level":2,"title":"背景","slug":"背景","link":"#背景","children":[]},{"level":2,"title":"折腾","slug":"折腾","link":"#折腾","children":[]},{"level":2,"title":"Vercel 部署","slug":"vercel-部署","link":"#vercel-部署","children":[]},{"level":2,"title":"参考","slug":"参考","link":"#参考","children":[]}],"git":{"createdTime":1735742277000,"updatedTime":1735742277000,"contributors":[{"name":"chanper","email":"qianchaosolo@gmail.com","commits":1}]},"filePathRelative":"life/blog-actions.md","localizedDate":"2023年11月28日","autoDesc":true}');export{b as comp,m as data};