---
title: Github 私有仓库 + Actions 自动部署博客 
date: 2023-11-28
---
## 背景

之前个人博客都是基于 [VuePress](https://v2.vuepress.vuejs.org/zh/)，直接整个项目上传到 Github 公共仓库中，然后利用 [Github Actions](https://docs.github.com/en/actions) 直接构建到仓库中的一个分支上，再把这个分支部署到 [Github Pages](https://pages.github.com/) 上，就这样用了很久，但是一直有几个问题比较困扰：

- 源码公开可见，可以被随意复制粘贴到别的地方
- 修改记录一览无遗，没有隐私性
- 部分文档不想公开，即使删除后，仍能通过提交记录找回来

综上，网上搜索一番后，发现可以通过 GitHub 创建私有仓库，把源码提交到私有仓库后，通过 Actions 触发自动构建，并推送到一个公开仓库中，再在公开仓库中触发 Github Pages 的部署流程，完成博客更新发布的自动化流程。

![](/img/blog-action-procedure.svg)


> GitHub Actions 是 GitHub 提供的一种自动化工作流服务，用于构建、测试和部署项目。它允许你在代码仓库中配置和运行自动化的工作流程，以响应各种事件，比如代码推送、Pull 请求合并等。GitHub Actions 可以帮助团队自动化软件开发过程中的重复性任务，提高效率并确保代码的质量。 
>
> GitHub Pages 是 GitHub 提供的一项免费静态网站托管服务。它允许你使用 GitHub 仓库来托管和发布个人、项目或组织的静态网页。



## 折腾

首先我们需要在 Github 创建一个私有的仓库叫 private_repo，并将本地的 Vuepress 博客项目和 private_repo 关联起来：

```shell
git remote add origin https://github.com/<username>/private_repo
```

然后修改博客项目根目录下 `.github/workflows/deploy.yml`文件，在 workflows 目录下的文件都会被尝试解析为工作流。

```yml
# 工作流名称
name: Publish Blog

# 当推送到 main 分支时触发任务
on:
  push:
    branches:
      - main

# 工作流
jobs:
  # 名称   
  build-and-push:
    # 运行环境
    runs-on: ubuntu-latest
    # 步骤
    steps:
      - name: 检出项目
        uses: actions/checkout@v4
        with:
          # 拉取记录数，因为只需要基于最新的版本构建，所以设为1就好
          fetch-depth: 1

      # 下面三个步骤是 VuePress 的构建流程，根据不同 Static Site Generators 自定义 
      - name: 安装 pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          run_install: true


      - name: 设置 Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: pnpm


      - name: 构建文档
        env:
          NODE_OPTIONS: --max_old_space_size=8192
        run: |-
          pnpm run docs:build
          > src/.vuepress/dist/.nojekyll
     
      # 关键步骤：利用这个 action 将生成的文档 push 到指定仓库
      - name: 部署到公共仓库
        uses: peaceiris/actions-gh-pages@v3
        with:
          # Personal Access Token 下面讲 
          personal_token: ${{ secrets.PUBLISH_BLOG }}
          # 指定push的仓库  
          external_repository: <username>/public_repo
          # 指定push的分支
          publish_branch: main
          # push 的目录
          publish_dir: src/.vuepress/dist
          # 是否只保留最新的提交记录
          force_orphan: true
```

然后我们再到 Github 上创建一个公共仓库 public_repo，然后到 Settings -> developer settings -> Personal access tokens -> Fine-grained tokens 创建一个 Personal Access Token（PAT）。这里 Github 提供了两种 PAT：

- **Fine-grained tokens**：细粒度的访问令牌，可以指定适用的仓库，有效期最多一年
- **Tokens**：经典访问令牌，无法指定具体仓库，粒度较粗，有效期可以无限

![](/img/github-pat.png)

推荐使用新的 Fined-grained tokens，更加安全，有效期可以长一点，偶尔维护一下也不麻烦。给予这个 token 公共仓库 public_repo 的读写权限即可，生成后记得复制一下 token，因为关闭页面后这个 token 就看不到值了。


然后我们到 **private_repo** 的 Settings -> Secrets and variables -> Actions 页面，创建一个 Secret，名称任意，value 就填刚刚生成的 PAT 即可。

![](/img/github-secrets.png)


这一步的原因在于，Github Actions 是在一个容器里运行的，因此要推送代码到某个仓库前必须通过某种方式验证对这个仓库有读写权限。上一步创建的 PAT 正好就授予了 public_repo 的读写权限，因此 private_repo 这个仓库在执行 Github Actions 时，可以通过`${{ secrets.<secret_name> }}`这样的形式来引用这个 PAT，进而通过权限系统的校验。


最后，我们把本地的 VuePress 项目推送到 private_repo，就会自动触发构建流程推送到 public_repo 了，记得在 public_repo 中开启 Github Pages，从主分支的根目录执行部署即可。

![](/img/github-pages.png)



文末参考的几篇文章里都是使用手动执行 Shell 脚本的方式去推送，比如通过

```bash
git push "https://${{github.actor}}:${{secrets.pat}}@github.com/username/xxx.git"
```
这种基于*用户名+密码*的校验方式去验证，但 [Github 在 2021 年已经关闭这种不安全的验证方式](https://github.blog/2020-12-15-token-authentication-requirements-for-git-operations/#what-you-need-to-do-today)，全部换成基于 Token 的鉴权了。正好在网上偶然看到这么个可以执行自动推送的 action，相比 Shel 脚本使用更方便，看了下[源码](https://github.com/peaceiris/actions-gh-pages/blob/main/src/set-tokens.ts#L105)，是通过
```bash
https://x-access-token:${personalToken}@${getServerUrl().host}/${publishRepo}.git
```
利用`x-access-token`头部实现的鉴权。


## Vercel 部署

突然想到自己还有个 Dynadot 白嫖的域名没用上，这次顺便给他用起来的吧。先到 Vercel 上授权 Github 仓库，然后同样的，设置从 public_repo 的根目录直接部署即可。主要是利用 Vercel 实现自定义域名和 CDN 加速，服务器是必不可能买的。

> Vercel 提供了一种简单而强大的方式来部署和托管前端应用程序。其自动化、全球 CDN、Serverless 架构等特性使得开发者能够更专注于应用的开发而不必过多关注基础设施的维护。

![](/img/vercel-blog.png)


然后到 Dynadot 上，根据 Vercel - Domain 里面给的提示给域名设置一个 A 记录，等待10分钟让 DNS 记录扩散到全球的 DNS 服务器即可：

![](/img/vercel-dns-record.png)

![](/img/dynadot-dns.png)


------



复习一下 ***DNS(domain -> IP)*** 记录类型:
1. **A 记录**: Address Record，将域名映射到 IPv4 地址，例如：
    `example.com IN  A  192.168.1.1`

2. **AAAA 记录**：IPv6 Address Record，将域名映射到 IPv6 地址，例如：
    `example.com IN  AAAA   2001:0db8:85a3:0000:0000:8a2e:0370:7334`

3. **CNAME 记录**：Canonical Name，用于创建域名的别名，将一个域名指向另一个域名，例如将 www 别名指向 example.com：
    `www  IN  CNAME  example.com`

4. **MX 记录**： Mail Exchange，指定邮件服务器的域名和优先级，它告诉发送电子邮件的邮件服务器应该将邮件发送到哪个邮件服务器。例如表示邮件服务器 `mailserver.example.com` 具有优先级为 10：
    `example.com  IN  MX  10  mailserver.example.com`

5. **PTR 记录**: Pointer Record，用于将 IP 地址映射回域名，主要用于反向 DNS 查找。例如表示 IP 地址 `192.168.1.1` 对应的域名是 `host.example.com`：
    `1.1.168.192.in-addr.arpa  IN  PTR   host.example.com`

6. **TXT 记录**：Text Record，用于存储文本信息，它通常用于验证域名的所有权、提供 SPF 记录（用于邮件认证）等。例如：
    `example.com  IN  TXT   "v=spf1 include:_spf.example.com  ~all"`

另外可以通过
```bash
dig +short example.com A @223.5.5.5
```
命令向指定 DNS 服务器查询指定域名的指定记录。





## 参考

1. https://www.xheldon.com/tech/the-using-of-github-pages.html
2. https://juejin.cn/post/7008847699919241229
3. https://zhangferry.com/2022/07/24/github_action_for_blog_deploy/