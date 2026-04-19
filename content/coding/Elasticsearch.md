---
title:  Elasticsearch 学习
date: 2024-08-15
---
## 概述

Elasticsearch（简称ES）是一个分布式、高扩展、近实时的搜索与数据分析引擎，它能很方便的使大量数据具有搜索、分析和探索的能力，充分利用Elasticsearch的水平伸缩性，能使数据在生产环境变得更有价值。ES的使用场景非常丰富，即可用作传统的海量数据的检索引擎，也可以用作时序分析、大数据分析、NoSQL的索引引擎、日志存储等等。

![](/img/ES样例.png)

Elasticsearch、Kibana、Beats 和 Logstash 四大金刚构成 ES 技术服务栈，分别负责不同领域，囊括了大数据处理领域的方方面面，包括数据收集、写入、检索、监控、处理、分析、安全等：
- Elasticsearch：负责数据存储、分析、检索
- Kibana：可视化工具，可以实时呈现Elastichsearch聚合分析的数据，看到数据的趋势，为决策提供依据
- Beats：轻量型采集器的平台，集合了多种轻量级的、单一的数据采集器，几乎可以兼容所有的数据类型，这些采集器可以从成千上万的系统中采集数据并向Logstash和Elasticsearch发送数据
- LogStash：开源的服务器端数据处理管道，能够同时从多个来源采集数据，转换数据，然后将数据发送到支持的存储库中，包括ES、Redis、DB、Kafka等

![](/img/ES技术栈.png)


## 概念

### 集群

ES 集群一般是由多个节点共同组成的分布式集群，节点之间互通，彼此配合，共同对外提供搜索和索引服务。不同的节点会负责不同的角色，有的负责一个，有的可能负责多个：

- 数据节点：负责数据存储、数据处理的工作，例如 CRUD、搜索、聚合等各种 I/O、内存和 CPU 密集型操作。服务过载时可以通过添加数据节点进行扩容，保障集群的稳定性
- 主节点：负责轻量化整个集群范围内的操作，例如创建或删除索引、跟踪哪些节点是集群的一部分以及决定将哪些分片分配给哪些节点
- Ingest节点：负责预处理文档，然后将其索引到 Elasticsearch 中
- Coordinating节点：路由索引和搜索请求，处理搜索结果集

集群组：由多个集群组成的一个集合，这些集群的Appkey都是一样的，我们使用集群组进行集群内部流量路由、熔断降级，数据平台服务绑定等

健康状态：Green,表示集群所有数据完好，没有丢失；Yellow,集群至少有一个索引的数据副本丢失；Red,集群至少有一个索引的Primary数据有丢失


### 术语

ES作为一个数据存储系统，和 MySQL 有很多相似的地方，但是MySQL更擅长事务类型操作，可以确保数据的安全和一致性，ES更擅长海量数据的搜索、分析和计算。

> 和很多分布式系统一样，ES 也有很多相似的理念，比如数据分片、副本，还有类似计算机组成的概念如分段。


| 术语 | 描述  | 用法 | 数据库对比概念 |
|---------------|------------------|-----------------------------------|--------------|
| Index 索引    | 相同类型的文档的集合 | 例如把所有订单放在一个索引里，即订单索引 | 表           | 
| Document 文档 | ES是面向文档存储的，文档是可搜索的结构化数据单元，由多个字段组成，用于描述一整条记录。文档会被序列化为Json存储在ES中 | 例如一条商户信息、一个订单信息 | 记录行 | 
| Field 字段    | 用于表述每一个列的名字，字段是文档的组成单元，包含字段名称、字段属性和字段内容 | 例如订单号，订单金额等 | 列 |
| Mapping 映射  | 描述字段的约束信息   | 例如字段类型、是否索引、分词类型、子字段等 | 表的结构约束 Schema |
|              |                   |                                   |              |
| 正排          | 文档到字段对应关系组成的链表，勾选可过滤后会构建正排链表。doc1->id,type,create_time… | 设置docvalues=true | 行记录 |
| 倒排          | 词组到文档的对应关系组成的链表，勾选可搜索后会构建倒排链表。term1->doc1,doc2,doc3；term2->doc1,doc2 | 设置index=true，如果为false，对应的字段域将不能进行检索(即执行各种Query后返回的结果为空，或者直接报错) | 类似B+树索引。Mysql不设置索引还是可以进行查询，但是ES不设置，查询结果为空 |
| Analyzer     | 分词器模式         | 请求的时候指定分词模式，如ik_max_word  |             |
| 召回          | 通过用户查询的关键词进行分词，将分词后的词组通过查找倒排链表快速定位到文档，这个过程称为召回。 |   | 查询过程 |
| 召回量        | 召回得到的文档数为召回量，即 totalHits |                   | 查询返回的结果数 |
|              |                   |                                   |              |
| 段(Segment)  | 分片的组成单元，即多个段构成一个分片，段是检索的基本单元，所有的查询/更新都是基于段来查询的 |    |   |
| 段合并        | Lucene的删除是标记删除，更新是先删后增，随着数据不断的更新，一个分片中会累积很多段(这些段里存在很多已经删掉的文档)，段太多会导致查询性能变慢，因此我们需要一个段合并的过程，将那些没有用的数据清除，减少段的个数 |   |  |
| 副本 Replicas | ES 可以设置多个索引的副本，提高系统的容错性，并且支持负载均衡以提高查询效率。 |   |   |
| 分片(Shard)   | 一个索引由多个分片组成，分布到不同的节点上，构成分布式搜索。分片的数量只能在创建索引前指定。  | 一个索引分成N个shard，每一个Shard的内容就是这个完整索内容的1/N |  |


### 倒排索引

MySQL那样的索引是普通的正向索引，根据索引查找速度很快，但是如果用不上索引，比如模糊查询，性能就很低。（根据文档找词条）
而ES使用的倒排索引，会将每一个文档的数据利用分词算法计算得到一个个词条 term，然后创建词条到文档id的表索引。查询的时候，根据用户输入进行分词，用词条索引去查询文档id，再去查找具体文档。词条和文档id都建立了索引，所以查询速度非常快。（根据词条找文档）

![](/img/倒排索引.png)


### Mapping

映射属性，是对索引库中文档的约束，常见的包括：
- type：字段数据类型，常见的简单类型有：
  - 字符串：text 可分词的文本、keyword 精确值，例如：品牌、国家、ip地址（keyword只能整体搜索，不支持分词）
  - 数值：long、integer、short、byte、double、float、
  - 布尔：boolean
  - 日期：date
  - 对象：object
- index：是否创建索引，默认为true
- analyzer：使用哪种分词器
- properties：该字段的子字段


### 存储结构

从整体结构上来看，Lucene的文件可以分为3个不同的层次：
1. **Segment_N**：全局的索引文件元数据描述，其中 N 是下一个段号（36进制）。描述了当前索引的版本，最小兼容版本，包括哪些段(段号、段名、编码等信息)，以及用户自定义的数据。
2. **x.si**：段元数据相关信息，其中 x 表示段名。每个段都有自己对应的元数据文件，记录版本、大小、文件组成方式、诊断信息如OS、JVM、创建时间，以及 IndexSort 等信息
3. **段相关文件**：最复杂，也最重要的一些列文件，包括倒排索引(词典tim、tip，倒排链doc，位置相关pos，payload/offset相关pay,词向量相关的tvd、tvx、tvm,正则化相关的nvd、nvm)、正排数据(行存相关的fdt、fdx、fdm，列存相关的dvd、dvx，多维点模型的kvd、kdi、kvm)、数据实时变更的存活DocID集合(liv文件)、域元数据信息fnm等等




## 基本使用

ES服务器提供了HTTP接口来对索引和文档进行CRUD，同时ES官方也提供了各种不同语言的客户端SDK，来操作ES，SDK本质上是组装DSL语句，再发送HTTP请求。其中，Java 客户端包括Transport和Rest，Rest又分为 Java Rest Low Level Client（RLLC）和 Java Rest High Level  Client（RHLC），后者相比前者封装更高级，隐藏了大部分ES细节，实际也可以通过HLRC获得RLLC，不过这三者全都已经被官方废弃了。目前ES官方推出了 Java Api Client 作为替代方案。

| 客户端 |  说明 |  备注 |
| ----- | ---- | ---- |
| TransportClient客户端 | 底层跟集群交换数据是通过自定义的二进制协议通信，这个会导致不同的集群版本需要不同的TransportClient版本，不利于集群的平滑升级 | es7.x版本已经废除，停止迭代 |
| RestClient客户端      | 对官方客户端简单封装，里面涵盖了一些已经废弃的功能以及许多比较危险的操作，支持向后兼容(目前仅支持5.x和2.x版本)             | 2019年6月不再维护         |
| Poros客户端           | 集成了官方的ES客户端，对其查询做了限制，并不断新增新的功能特性，支持向后兼容(支持es 5.x，6.x，7.x版本)                  | 长期持续维护中             |

![](/img/ES-clients.svg)



### 引入依赖

客户端版本需要和使用的ES集群版本一致，还要排除掉其中的elasticsearch-rest-client。稳定版本号见：https://km.sankuai.com/collabpage/1127183403

```xml
<dependency>
    <groupId>org.elasticsearch.client</groupId>
    <artifactId>elasticsearch-rest-high-level-client</artifactId>
</dependency>
```


### 注入客户端

```java
@Bean
public RestHighLevelClient client(){
    return new RestHighLevelClient(RestClient.builder(
        HttpHost.create("http://192.168.150.101:9200")
	));
}
```


### 索引操作

#### 创建

ES的一个索引由三部分组成：
- mappings：包括三部分
  - dynamic mapping：设置动态映射（自动推断用户定义的字段）的行为，true动态添加，false忽略，strict抛异常
  - metadata：元数据域，包括index所属索引、id唯一标识、source等
  - properties：核心数据，定义索引的字段
- settings：描述该索引的全局配置，包括副本数、分片数等
- aliases：索引别名，可以关联一个或多个物理索引

```java
// HTTP DSL
PUT /索引库名
{
	  //字段配置
    "mappings":{  
        "properties":{
            "address":{
                "type":"text",
                "index": "true",
                "analyzer":"ik_smart"
            },
            "email":{
                "type":"keyword"
            }
        }
    },
    //索引的一些配置
    "settings":{
        "index":{
            "number_of_shards":2,
            "number_of_replicas":1
        }
    },
    //别名配置
    "aliases":{
    }
}


// 1.创建Request对象，指定索引名
CreateIndexRequest request = new CreateIndexRequest("hotel");
// 2.准备请求的参数：DSL语句和格式
request.source(MAPPING_TEMPLATE, XContentType.JSON);
// 3.发送请求
client.indices().create(request, RequestOptions.DEFAULT);
```


#### 查询

```java
GET /order

// 1.创建Request对象
GetIndexRequest request = new GetIndexRequest("hotel");
// 2.发送请求
boolean exists = client.indices().exists(request, RequestOptions.DEFAULT);
// 3.输出
System.err.println(exists ? "索引库已经存在！" : "索引库不存在！");
```

#### 删除

```java
DELETE /order

// 1.创建Request对象
DeleteIndexRequest request = new DeleteIndexRequest("hotel");
// 2.发送请求
client.indices().delete(request, RequestOptions.DEFAULT);
```


#### 修改

修改只能新增字段到mapping中。索引库一旦创建无法修改已有的mapping，否则需要重新创建索引。

```java
PUT /索引库名/_mapping
{
  "properties": {
    "新字段名":{
      "type": "integer"
    }
  }
}
```

### 文档操作

#### 创建

```java
POST /索引库名/_doc/文档id
{
    "info": "真相只有一个！",
    "email": "zy@itcast.cn",
    "name": {
        "firstName": "柯",
        "lastName": "南"
    }
}

// 1.创建Request
IndexRequest request = new IndexRequest("indexName").id("1");
// 2.准备Json参数
request.source(JSON_DOC, XContentType.JSON);
// 3.发送请求
client.index(request, RequestOptions.DEFAULT);
```

#### 查询

```java
GET /{索引库名称}/_doc/{id}
//批量查询：查询该索引库下的全部文档
GET /{索引库名称}/_search

// 1.准备Request
GetRequest request = new GetRequest("hotel", "61082");
// 2.发送请求，得到响应
GetResponse response = client.get(request, RequestOptions.DEFAULT);
// 3.解析响应结果
HotelDoc hotelDoc = JSON.parseObject(response.getSourceAsString(), HotelDoc.class);
```


#### 删除

```java
DELETE /{索引库名}/_doc/id值
```

#### 修改

```java
// 全量修改，本质是删除旧id的文档，新增一个新文档
PUT /{索引库名}/_doc/文档id
{
    "字段1": "值1",
    "字段2": "值2",
    // ... 略
}

// 增量修改，只修改指定id文档的部分字段
POST /{索引库名}/_update/文档id
{
    "doc": {
         "字段名": "新的值",
    }
}
```


### 搜索

基本步骤：
1. 创建 SearchRequest
2. 构造查询条件
3. 发送请求
4. 解析

```java
// 1. 创建SearchRequest对象
SearchRequest searchRequest = new SearchRequest("hotel");
// 2. 准备 DSL - Request.source(),QueryBuilders来构建查询条件
request.source().query(QueryBuilders.matchAllQuery());
// 3. 发送请求
SearchResponse response = client.search(request, RequestOptions.DEFAULT);
// 4. 解析结果（参考JSON结果，从外到内，逐层解析）
SearchHits searchHits = response.getHits();
long total = searchHits.getTotalHits().value;
System.out.println("共搜索到" + total + "条数据");
SearchHit[] hits = searchHits.getHits();
for (SearchHit hit : hits) {
    String json = hit.getSourceAsString();
    HotelDoc hotelDoc = JSON.parseObject(json, HotelDoc.class);
    System.out.println("hotelDoc = " + hotelDoc);
}



// 全文检索
QueryBuilders.matchQuery("all", "如家");
QueryBuilders.multiMatchQuery("如家", "field1", "field2");
// 精准查询
QueryBuilders.termQuery("city", "杭州");
// 范围
QueryBuilders.rangeQuery("price").gts(100).lte(150);
// 布尔
BoolQueryBuilder boolQuery = QueryBuilders.boolQuery();
boolQuery.must(QueryBuilders.termQuery("city", "杭州"));
// 聚合
request.source().aggregation(AggregationBuilders
							.terms("brandAgg")
                            .field("brand")
                            .size(100));
// 排序
request.source().sort("price", SortOrder.ASC);
// 分页
request.source().from((page - 1) * size).size(size);
// 高亮
request.source().highlighter(new HighlightBuilder().field("name").requireFieldMatch(false));
```



## Lucene

Elasticsearch 基于 Lucene 作为底层的检索库，Lucene是一个高效的，可扩展的，全文检索库，全部用Java实现，无需配置。Lucene仅支持纯文本文件的索引和搜索，不负责由其他格式的文件抽取纯文本文件，或从网络中抓取文件的过程。


### 功能

Lucene 的功能包括创建索引和搜索两步：

**创建索引**

1. 创建一个 IndexWriter 用来写索引文件
2. 创建一个 Document 代表我们要索引的文档
3. 将不同类型的信息 Field 加入到文档中
4. IndexWriter 调用函数 addDocument 将索引写到索引文件夹中


**搜索**

1. IndexReader 将磁盘上的索引信息读入到内存
2. 创建 IndexSearcher 准备进行搜索
3. 创建 Analyer 用来对查询语句进行词法分析和语言处理
4. 创建 QueryParser 用来对查询语句进行语法分析
5. QueryParser 调用 parser 进行语法分析，形成查询语法树，放到 Query，即用户查询中
6. IndexSearcher 调用 search 对查询语法树Query 进行搜索，得到结果 TopScoreDocCollector 





参考：
1. https://www.cnblogs.com/buczhizicai/p/17093719.html

