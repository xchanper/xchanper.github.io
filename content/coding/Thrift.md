---
title: RPC-Thrift
date: 2023-06-07
---
Thrift 是一种接口描述语言和二进制通讯协议，它被用来定义和创建跨语言的服务，被当作一个远程过程调用（RPC）框架来使用。

## 使用步骤
- 通过 IDL 定义需要远程方法调用的接口
- 通过 thrift 编译器生成代码，包含接口定义、Client、Processor等，用于结构化数据的解析、发送、接受
   `thrift -r -gen java file`
- 创建实现类定义具体的远程执行逻辑
- Server 端通过定义具体的远程执行逻辑，创建服务器
    ```java
    System.out.println("服务端开启......");
    TProcessor tProcessor=new Hello.Processor<Hello.Iface>(new HelloImpl());
    TServerSocket serverSocket = new TServerSocket(8999);

    TServer.Args tArgs = new TServer.Args(serverSocket);
    tArgs.processor(tProcessor);
    tArgs.protocolFactory(new TBinaryProtocol.Factory());
    TServer server = new TSimpleServer(tArgs);
    server.serve();
    ```
- Client 端通过创建实现了指定接口的Client调用对应的远程方法
    ```java
    System.out.println("客户端启动.....");
    TTransport transport = new TSocket("localhost", 8999, 30000);
    // 协议要和服务端一致
    TProtocol protocol = new TBinaryProtocol(transport);
    Hello.Client client = new Hello.Client(protocol);
    transport.open();
    String result = client.helloWorld("Client invoke -- ");
    System.out.println(result);
    ```

## 框架层次

- Thrift是一种C/S的架构体系.在最上层是用户自行实现的业务逻辑代码
- 第二层是由Thrift编译器自动生成的代码，主要用于结构化数据的解析，发送和接收。
  - TServer主要任务是高效的接受客户端请求，并将请求转发Processor处理。
  - Processor负责对客户端的请求做出响应，包括RPC请求转发，调用参数解析和用户逻辑调用，返回值写回等处理。
- 从TProtocol以下部分是thirft的传输协议和底层I/O通信。
  - TProtocol是用于数据类型解析的，将结构化数据转化为字节流给TTransport进行传输。
  - TTransport是与底层数据传输密切相关的传输层，负责以字节流方式接收和发送消息体，不关注是什么数据类型。
  - 底层IO负责实际的数据传输，包括socket、文件和压缩数据流等。


## 传输形式

### 数据类型

- Base Types：基本类型
- Struct：结构体类型
- Container：容器类型，即List、Set、Map
- Exception：异常类型
- Service： 定义对象的接口，和一系列方法

### 协议

总体上分 文本text 和 二进制binary 两种格式，一般为了节省带宽使用 binary。

- TBinaryProtocol – 二进制编码格式进行数据传输。
- TCompactProtocol – 这种协议非常有效的，使用Variable-Length Quantity (VLQ) 编码对数据进行压缩。
- TJSONProtocol – 使用JSON的数据编码协议进行数据传输。
- TSimpleJSONProtocol – 这种节约只提供JSON只写的协议，适用于通过脚本语言解析。
- TDebugProtocol – 在开发的过程中帮助开发人员调试用的，以文本的形式展现方便阅读。


### 传输层

- TSocket- 使用堵塞式I/O进行传输，也是最常见的模式。
- TFramedTransport- 使用非阻塞方式，按块的大小，进行传输，类似于Java中的NIO。
- TFileTransport- 顾名思义按照文件的方式进程传输，虽然这种方式不提供Java的实现，但是实现起来非常简单。
- TMemoryTransport- 使用内存I/O，就好比Java中的ByteArrayOutputStream实现。
- TZlibTransport- 使用执行zlib压缩，不提供Java的实现。

### 服务端类型

- TSimpleServer - 单线程服务器端使用标准的堵塞式I/O。
- TThreadPoolServer - 多线程服务器端使用标准的堵塞式I/O。
- TNonblockingServer – 多线程服务器端使用非堵塞式I/O，并且实现了Java中的NIO通道。
