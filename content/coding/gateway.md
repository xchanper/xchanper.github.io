---
title: 关于网关
date: 2024-12-08
---
## 网关概述

### 四层网关

也被称为传输层网关，主要工作在OSI模型的传输层，处理TCP/UDP等传输层协议，典型的有阿里SLB、腾讯VGW等。

它基于IP地址和端口号进行请求的转发，不关心应用层协议的具体内容。四层网关通过监听特定的IP地址和端口号，接收来自客户端的请求，并根据配置的路由规则，将请求转发到内部网络中的目标服务器。在转发过程中，四层网关会维护客户端与服务器之间的连接，确保数据的完整性和可靠性。适用场景：

- 需要高性能和低资源消耗的TCP/UDP服务转发场景，如数据库代理、邮件代理等。
- 无需解析应用层协议，只需要根据IP地址和端口号进行请求转发的场景。
- 需要支持大规模并发连接和流量转发的场景，如CDN、负载均衡等。

四层网关由于只处理传输层协议，不涉及应用层协议的解析和处理，因此相比七层协议，具有更高的性能和更低的资源消耗。

### 七层网关

主要工作在OSI模型的应用层，处理HTTP、HTTPS等应用层协议，典型的有百度BFE、阿里Higress。

它基于URL、请求头等信息进行请求的转发，并可以对应用层协议进行深度解析和处理。七层网关通过解析请求中的URL、请求头等信息，根据配置的路由规则，将请求转发到内部网络中的目标服务器。在转发过程中，七层网关可以对请求和响应进行更细粒度的控制，如缓存、压缩、加密等。适用场景：

- 需要基于URL、请求头等信息进行复杂路由和负载均衡的HTTP/HTTPS服务场景，如Web应用、API接口等。
- 需要对请求和响应进行更细粒度的控制，如缓存、压缩、加密等处理的场景。
- 需要支持HTTPS协议的场景，七层网关可以提供SSL卸载、证书管理等功能。

七层网关由于能够解析和处理应用层协议，因此具有更多的功能和更高的灵活性，以及更高的安全性。

### API 网关

API 网关是一个处于应用程序或服务（提供 REST API 接口服务）之前的系统，用来管理授权、访问控制和流量限制等，这样 REST API 接口服务就被 API 网关保护起来，对所有的调用者透明。因此，隐藏在 API 网关后面的业务系统就可以专注于创建和管理服务，而不用去处理这些策略性的基础设施。典型的有Spring Cloud Gateway、Zuul等。

### 负载均衡

负载均衡器分为四层交换机、七层交换机。L4 switch工作在OSI的传输层，主要分析IP层及TCP/UDP层，实现四层流量负载均衡，不关心应用协议，例如LVS，F5等。L7 switch工作在OSI的应用层，除了支持四层负载均衡以外，还能分析应用层的信息，如HAProxy，MySQL Proxy等。

Nginx、LVS、HAProxy是目前使用最广泛的三种负载均衡软件。

![](/img/load-balancer-4-7.png)

### 业务实践

在具体架构设计时Nginx做负载均衡时，考虑到API网关在系统中不止一个（以集群的方式做高可用），通常可以将Nginx至于API网关前，负责对API网关的负载均衡，然后再由网关决定进入根据判定到哪个真实的web 服务器。 让两者的分工更加明确，也就是：API网关聚合服务，Nginx请求转发。

- **业务网关**：对于具体的后端业务应用或者是服务和业务有一定关联性的策略网关。业务网关针对具体的业务需要提供特定的流控策略、缓存策略、鉴权认证策略
- **流量网关**：与业务网关相反，定义全局性的、跟具体的后端业务应用和服务完全无关的策略网关。流量网关通常只专注于全局的Api管理策略，比如全局流量监控、日志记录、全局限流、黑白名单控制、接入请求到业务系统的负载均衡等

业务网关一般部署在流量网关之后、业务系统之前，比流量网关更靠近业务系统。通常API网指的是业务网关。 有时候我们也会模糊流量网关和业务网关，让一个网关承担所有的工作,所以这两者之间并没有严格的界线。

![](/img/gateway-practice.svg)

## MGW

[MGW——美团点评高性能四层负载均衡](https://tech.meituan.com/2017/01/05/mgw.html)

MGW（Meituan Gateway）是一个提供10G/100G处理能力并且支持IPv6-IPv4双栈的四层网关服务，它能够提供业务外网ip到内网ip的转换，同时能够为业务多台机器提供负载均衡的功能。业务方一般用不太到。

名词解释：

- VIP：由MGW发布的虚拟ip地址，对外提供服务的入口地址；资源允许的情况下，一般一个业务需求使用一个独立的vip，在新增VS页面不用指定，由系统自动分配。
- VPORT：由MGW发布的虚拟端口，通过虚拟ip+虚拟端口对外提供服务。
- VS：vs=vip+vport+protocol，virtual server，是一个四层的概念，由VIP（virtual ip，虚拟ip）、VPORT（virtual port，虚拟端口）、PROTOCOL（协议 TCP/UDP）组成，能唯一确定一个四层服务。
- RIP：RS的IP地址
- RPORT：RS的端口
- RS:  rs=rip+rport， real server，指VS后端挂载的真实服务器，可以由RIP(real server ip，真实服务器ip地址)、RPORT（real server port，真实提供服务的端口）、协议（同vs的协议）确定。

![](/img/mgw.png)

## Oceanus 

[Oceanus：美团HTTP流量定制化路由的实践](https://tech.meituan.com/2018/09/06/oceanus-custom-traffic-routing.html)


Oceanus 是 HTTP 服务治理平台及七层负载均衡网关服务，致力于提供统一的自动化、智能化路由的解决方案，支持服务注册与发现、动态负载均衡、可视化管理、定制化路由、Session复用、熔断降级、一键截流和性能统计等功能。
业务主要用 Oceanus 管理 C 端的HTTP接口。

流量分发策略：HTTP请求 -> 匹配站点域名 -> 匹配映射规则 -> 匹配该映射规则关联的策略

![](/img/oceanus.svg)

## Shepherd

[百亿规模API网关服务Shepherd的设计与实现](https://tech.meituan.com/2021/05/20/shepherd-api-gateway.html)

Shepherd是一个高性能、高可用、易扩展的API网关，可以通过配置的方式，对外开放数据和能力，提供 API 完整生命周期的管理，包括API的创建，维护，发布和下线等，并提供鉴权认证、流量管控、熔断降级、数据缓存、流量路由等基础功能。
我们组业务一般用 Shepherd 管理 M端的HTTP接口，而C端接口在API层的处理逻辑特别复杂，需要很多定制化的实现，因此没有接入 Shepherd。

![](/img/shepherd-struct.svg)

从请求链路上看，Shepherd在Oceanus下游，HTTP请求经过Oceanus负载均衡转发到Shepherd，由Shepherd进行协议转换并调用内部服务。从产品定位上看，Oceanus是HTTP负载均衡服务，Shepherd是API托管服务。

![](/img/shepherd-overview.png)


## 参考

1. https://cloud.tencent.com/developer/article/2350984
2. https://segmentfault.com/a/1190000041317227
3. https://www.cnblogs.com/wzh2010/p/18133011
4. https://tech.meituan.com/2017/01/05/mgw.html
5. https://tech.meituan.com/2018/09/06/oceanus-custom-traffic-routing.html
6. https://tech.meituan.com/2021/05/20/shepherd-api-gateway.html

