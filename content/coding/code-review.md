---
title: Code Review
date: 2023-07-15
---
## 风格 

- if 后面哪怕只有一条语句，也要加上大括号
- 判等时，只要有一方是对象，就尽量用 equals
- 日期转换统一使用 DateUtils 工具类
- 尽量使用各种工具类，如 Objects.isNull, StringUtils.isNotEmpty(), CollectionUtils.isEmpty(), DateUtils, JsonUtils 等等
- 错误日志统一使用`log.error("xxx: {}, xxx: {}", JsonUtils.toJson(object), JsonUtils.toJson(object), e);`占位符形式，且error要么记录进日志，要么继续向上抛出

## 规范

- Enum类型可以在初始化时，通过static代码段构造枚举的map集合，同时定义codeOf方法，快速关联枚举码和枚举类
- 分页查找时，应先根据条件过滤，再计算偏移和总数
- 新功能直接从入口 Controller 开始写单测接口
- 打印日志时，对象用 jsonUtils 转一下，避免后期对象变更需要重新加日志处理代码
- 定时任务这种统一放到 crane/job 包下
- 不要在循环中查库，一次性查出来配合 Stream 做处理


## Effective Java

推荐阅读：https://github.com/clxering/Effective-Java-3rd-edition-Chinese-English-bilingual  
双语版，其实原著的英文版读起来也不困难，主要是网上的中文版翻译太烂了，根本读不通...



## 其它 

1. 每当调用一个方法时，都要对它的行为保持怀疑，不要盲目地认为它一定会正常返回。越不熟悉的代码，就越应该对其代码行为保持怀疑。
