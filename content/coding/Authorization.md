---
title: 认证登录
date: 2023-04-15
---
## 短信验证码

- 前端通过阿里云 API 发送短信验证码，并缓存到 Redis（根据缓存时间防止接口被刷）
- 用户点击注册后校验验证码和其它信息
- 校验通过后，用 Spring Security 对密码进行 MD5 加盐加密，最后存入 DB
- 登录时同样用 Spring Security 对加盐加密的密码进行校验

```java
// 接收前端发来的发短信请求
@ResponseBody
@GetMapping("/sms/sendcode")
public R sendCode(@RequestParam("phone") String phone) {
    // 接口防刷，先获取 reids 缓存：sms:code:phone
    String redisCode = stringRedisTemplate.opsForValue().get(AuthServerConstant.SMS_CODE_CACHE_PREFIX);
    if(redisCode != null && redisCode.length() > 0) {
        long curTime = Long.parseLong(redisCode.split("_")[1]);
        if(System.currentTimeMillis() - curTime < 60 * 1000) {
            return R.error(BizCodeEnum.SMS_CODE_EXCEPTION.getCode(), BizCodeEnum.SMS_CODE_EXCEPTION.getMsg());
        }
    }

    // 生成验证码
    String code = "123456";
    String redis_code = code + "_" + System.currentTimeMillis();
    // 缓存验证码
    stringRedisTemplate.opsForValue().set(AuthServerConstant.SMS_CODE_CACHE_PREFIX + phone, redis_code, 10, TimeUnit.MINUTES);
    try {
        // 调用第三方短信服务
        return thirdPartFeignService.sendSmsCode(phone, code);
    } catch (Exception e) {
        log.warn("远程调用不知名错误 【无需解决】");
    }
    return R.ok();
}

// 阿里云短信 API
public String sendSmsCode(String phone, String code){
    com.aliyun.dysmsapi20170525.models.SendSmsRequest sendSmsRequest = new com.aliyun.dysmsapi20170525.models.SendSmsRequest()
            .setSignName("阿里云短信测试")
            .setTemplateCode("SMS_154950909")
            .setPhoneNumbers(phone)
            .setTemplateParam("{\"code\":\"" + code + "\"}");
    com.aliyun.teautil.models.RuntimeOptions runtime = new com.aliyun.teautil.models.RuntimeOptions();
    SendSmsResponse sendSmsResponse = null;
    try {
        sendSmsResponse = smsClient.sendSmsWithOptions(sendSmsRequest, runtime);
        return String.valueOf(sendSmsResponse.statusCode);
    } catch (TeaException error) {
        com.aliyun.teautil.Common.assertAsString(error.message);
        return "fail";
    } catch (Exception _error) {
        TeaException error = new TeaException(_error.getMessage(), _error);
        com.aliyun.teautil.Common.assertAsString(error.message);
    }

    return "fail_" + sendSmsResponse.getStatusCode();
}


// 验证通过后注册
@Override
public void register(UserRegisterVo userRegisterVo) throws PhoneExistException, UserNameExistException {
    MemberEntity entity = new MemberEntity();

    // 检查手机号、用户名是否唯一
    checkPhone(userRegisterVo.getPhone());
    checkUserName(userRegisterVo.getUserName());

    entity.setMobile(userRegisterVo.getPhone());
    entity.setUsername(userRegisterVo.getUserName());

    // 密码加盐加密
    BCryptPasswordEncoder bCryptPasswordEncoder = new BCryptPasswordEncoder();
    entity.setPassword(bCryptPasswordEncoder.encode(userRegisterVo.getPassword()));、

    // 其它默认信息
    entity.setCreateTime(new Date());

    baseMapper.insert(entity);
}
```

MD5 是经典的消息摘要算法，可以根据输入产生一个 128 位的信息摘要，换算十六进制得到 32 的字符串，即最终的数字指纹。
- 特点：
  - 压缩性：结果总是 128 位
  - 容易计算
  - 抗修改：原数据进行修改会导致结果变化很大
  - 弱抗碰撞：很难找到相同 MD5 的数据
  - 强抗碰撞：找到两个不同数据的 MD5 值相同是非常困难的
- 破解方法：彩虹表，搜集各种数据的 MD5 值作为字典
- 加盐：哈希前加入一些随机数（盐值），加强安全性。例如 Spring Security 提供的 BCryptPasswordEncoder 提供的加密方法


## OAuth2

OAuth2 是一个业界标准的授权协议，通过为第三方应用颁发一个 Token 令牌，使得其能够获取相关资源。常用于第三方账号登录。

![OAuth2](/img/OAuth2.webp)

- Client 请求认证服务器的授权（用户登录授权）
- Client 获得授权许可，一般是一个 Authorization Code 授权码
- Client 通过 Authorization Code 换取一个附带有效期的 Access Token 访问令牌
- Client 通过 Access Token 从 Resource Server 获取相关资源


```java
// 点击第三方登陆后，用户输入第三方的账号密码进行授权
// 然后第三方回调本应用的请求地址，并携带 Code 授权码
@GetMapping("/gitee/success")
public String giteeLogin(@RequestParam("code") String code, HttpSession session, HttpServletResponse servletResponse) throws Exception {
    Map<String, String> param = new HashMap<>();
    param.put("client_id", "<client_id>");
    param.put("redirect_uri", "http://auth.gulimall.com/oauth2/gitee/success");
    param.put("client_secret", "<client_secret>");
    param.put("code", code);
    param.put("grant_type", "authorization_code");

    // code 换取 Access Token
    HttpResponse response = HttpUtils.doPost("https://gitee.com", "/oauth/token", "post", new HashMap<>(), null, param);
    if(response.getStatusLine().getStatusCode() == 200){
        // 获取响应体： Access Token
        String giteeInfo = EntityUtils.toString(response.getEntity());
        R login = memberFeignService.giteeLogin(giteeInfo);
        if(login.getCode() == 0) {
            // 将登陆用户信息放入 session
            MemberRespVo respVo = login.getData("data" ,new TypeReference<MemberRespVo>() {});
            session.setAttribute(AuthServerConstant.LOGIN_USER, respVo);

            // 登录成功 跳回首页
            return "redirect:http://gulimall.com";
        } 
    } else { // 失败返回登录页
        return "redirect:http://auth.gulimall.com/login.html";
    }
}


// 根据 Token 识别用户并登录
@Override
public MemberEntity giteeLogin(String giteeInfo) throws Exception {
    // 拿到 accesstoken，获取用户基本信息
    JSONObject baseJson = JSON.parseObject(giteeInfo);
    String accessToken = baseJson.getString("access_token");
    String expiresIn = baseJson.getString("expires_in");
    Map<String, String> params = new HashMap<>();
    params.put("access_token", baseJson.getString("access_token"));

    // 校验用户信息
    HttpResponse response = HttpUtils.doGet("https://gitee.com", "/api/v5/user", "get", new HashMap<>(), params);
    Assert.isTrue(response.getStatusLine().getStatusCode() == 200, String.valueOf(BizCodeEnum.SOCIALUSER_LOGIN_ERROR));

    String s = EntityUtils.toString(response.getEntity());
    JSONObject jsonObject = JSON.parseObject(s);
    String id = jsonObject.getString("id");

    MemberEntity member = this.getOne(new QueryWrapper<MemberEntity>().eq("social_uid", "gitee_" + id));
    if(member != null) {
        // 已经注册过，更新令牌、过期时间
        MemberEntity newMember = new MemberEntity();
        newMember.setId(member.getId());
        newMember.setAccessToken(accessToken);
        newMember.setExpiresIn(expiresIn);
        this.updateById(member);
        return member;
    } else {
        // 第一次授权登录，需要注册
        MemberEntity newMember = new MemberEntity();
        newMember.setSocialUid("gitee_" + id);
        newMember.setNickname(jsonObject.getString("name"));
        newMember.setAccessToken(accessToken);
        newMember.setExpiresIn(expiresIn);
        this.save(newMember);
        return newMember;
    }
}
```




## 分布式会话


### Session 原理

HTTP 协议本身是无状态的，客户端和服务器都不记录彼此的历史信息，每次请求都是独立的。但很多 Web 场景下需要维护用户状态，例如是否登录、记住密码、浏览历史等。因此出现了 Cookie 和 Session 技术。

Cookie 是客户端存储 HTTP 状态的解决方案，客户端每次发送请求都会携带这些数据。Cookie 在不同浏览器之间不共享，存在有效期，且有安全隐患。

而 Session 是服务端存储 HTTP 状态的方案，服务端为每个客户端创建一个 session 对象维护该用户状态，可以存储在 内存/文件/缓存 中。在客户端用 Cookie 保存对应的 SessionId，每次请求携带 sessionId 来标识该用户。

![session原理](/img/session原理.jpg)

问题：服务器管理 Session 开销大。而且 Session 仅适用于当前域名下的用户跟踪，在分布式场景，不同服务无法共享 Session 以跟踪用户。


### 分布式 Session

#### 方案 1：Session 复制

![复制session](/img/复制session.png)

- 优点：
  - Web-Server 原生支持，只需要修改配置文件即可实现
- 缺点：
  - session 同步占用带宽，降低业务处理能力
  - 任意一台服务器需要保存所有服务器集群的 session 总和，对内存压力过大，无法水平扩展

因此只适用于小型业务场景，大型服务器集群不适用。


#### 方案 2：客户端存储

![客户端存储session](/img/客户端存储session.png)

- 优点：
  - 服务器不需要存储 Session，客户端自己保存，节省服务器资源
- 缺点：
  - 每次请求都得携带用户 Cookie 完整数据，浪费带宽
  - session 存储在 Cookie 中，有长度限制（4KB），不能保存大量信息
  - Cookie 存在泄漏、篡改、窃取等安全隐患

因此此方案基本不会使用。


#### 方案 3：哈希一致性

通过 Nginx 根据请求来源做路由配置。

![哈希一致性session](/img/哈希一致性session.png)

- 优点：
  - 只需要修改 Nginx 配置，无需修改代码
  - 支持负载均衡
  - 支持服务器水平扩展
- 缺点：
  - session 还是存储在服务器中，重启可能部分丢失，暂时影响业务
  - 水平扩展后需要 Rehash，暂时影响业务

因此本方案还可以，session 本身是有有效期的，缺点影响不大。


#### 方案 4：统一存储

![统一存储session](/img/统一存储session.png)

- 优点：
  - 安全性高
  - 支持水平扩展
  - 服务器重启/扩容都不会丢失 session
- 缺点：
  - 需要修改代码，增加了网络调用

本方案在请求时需要携带上一个服务器发送的 session 信息，因此需要在同一个域名下。为此需要放大域名的作用域。Spring Session 框架正好提供了解决方案。


### Spring Session

#### 使用

1. 引入依赖

```xml
<!-- Spring Session -->
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
    <version>2.1.1.RELEASE</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

2. 配置

```yml
spring:
  session:
    store-type: redis	# 将session保存到什么位置。支持 Redis、MongoDB、JDBC 等
    
servlet:
  servlet:
    session:
      timeout: 30m	# session的超时时间，非必选

# Redis 配置 (略)
```

3. 开启 Spring Session

```java
// 主启动类
@SpringBootApplication
@EnableRedisHttpSession
public class GulimallAuthApplication {
    public static void main(String[] args) {
        SpringApplication.run(GulimallAuthApplication.class, args);
    }
}

// 配置类
@Configuration
public class AuthSessionConfig {
    /**
     * 为Session扩大作用域
     */
    @Bean
    public CookieSerializer cookieSerializer(){
        DefaultCookieSerializer cookieSerializer = new DefaultCookieSerializer();
        cookieSerializer.setDomainName("gulimall.com");
        cookieSerializer.setCookieName("GULISESSION");
        return cookieSerializer;
    }

    /**
     * 自定义序列化机制: redis的json序列化
     */
    @Bean
    public RedisSerializer<Object> springSessionDefaultRedisSerializer(){
        return new GenericJackson2JsonRedisSerializer();
    }
}
```


#### 原理

-  @EnableRedisHttpSession 导入了 RedisHttpSessionConfiguration.class 配置
   - 导入了 RedisOperationsSessionRepository，即 Redis 操作 Session 的工具类
-  RedisHttpSessionConfiguration 继承自 SpringHttpSessionConfiguration
   - 负责构造 CookieSerializer 序列化器
   - 负责监听服务器停机、Session 序列/反序列化等过程
   - 初始化 SessionRepositoryFilter 过滤所有请求，重写了 doFilterInternal()
     - 首先将当前的 sessionRepository 放入当前请求的共享数据中
     - 封装原生的 Request、Reponse（装饰者模式）
     - 放行。后面的执行链需要使用 session 时，会调用装饰类内部获取 session 的具体策略，例如通过 RedisOperationsSessionRepository 从 Redis 中获取

Spring Session 核心原理就是装饰者模式，修改了获取 session 的具体逻辑，模拟了 session 的完整功能。只要浏览器不关，就可以为 session 自动续期，关闭后就走 redis 的过期策略。


### JWT

Json Web Token 是一种替换 Session 实现数据共享的方案。基于 Token 的身份验证方法，不需要在服务端存储用户登录记录。
- 服务端验证客户端身份，计算生成 Token 返回给客户端
- 客户端保存 Token，之后请求时携带该 Token
- 服务端收到请求后验证 Token，合法即可返回数据

优点：
- 无状态，可扩展
- 安全，能够防止 CSRF 跨站请求伪造
- 可提供接口给第三方
- 多平台跨域




## SSO

Single Sign On 单点登录，在多个应用的系统中，只需要登陆一次，就可以访问其它相互信任的应用系统。对于同域下的不同服务，只要扩大 Cookie 作用域到顶域，然后共享 session 即可（Redis 统一存储 Session）。但对于不同域下的服务，需要单独部署 SSO 系统，只要登录了这个公共的登陆服务就代表对应的服务群都登录了。

![SSO](/img/SSO.png)

**跨域 SSO**
- 用户访问 app1 系统，app1 没有登录，跳转到SSO
- SSO 也没有登录，弹出用户登录页
- 用户填写用户名、密码，SSO 进行认证后，将登录状态写入 SSO 的 session，并通知浏览器中写入 SSO 域下的 Cookie
- SSO 登录完成后会生成一个 ST (Service Ticket)，携带并跳转到 app1 系统
- app1 拿到 ST 后，向 SSO 发送请求验证 ST 是否有效
- 验证通过后，app1 将登录状态写入 Session 并设置 app1 域下的 Cookie

**访问 App2**
- 用户访问 app2 系统，app2 没有登录，跳转到SSO
- 由于 SSO 已经登录了，不需要重新登录认证
- SSO 生成 ST，携带并跳转到 app2 系统
- app2 拿到 ST 后，向 SSO 发送请求验证 ST 是否有效
- 验证成功后，app2 将登录状态写入 Session 并设置 app2 域下的 Cookie