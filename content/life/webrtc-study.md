---
title: WebRTC 学习
date: 2021-10-26
---
## 1. 获取音视频设备
```javascript
navigator.mediaDevices.enumerateDevices()
    .then(gotDevices)
    .catch(handleError);
```
## 2. 获取音视频访问+约束
```javascript
var constraints =  {
            video: {width: 640, 
                    height: 320,
                    frameRate: { ideal: 60, max: 120}, 
                    facingMode: 'environment',
                    deviceId: videoDeviceId ? videoDeviceId : undefined
            },
            // audio: true
        };
navigator.mediaDevices.getUserMedia(constraints)
        .then(gotMediaStream)
        .catch(handleError);
```
## 3. 视频特效
```html
<style>
        .none {
            -webkit-filter: none;
        }
        .blur {
            -webkit-filter: blur(5px);
        }
        .grayscale {
            -webkit-filter: grayscale(1);
        }
        .invert {
            -webkit-filter: invert(1);
        }
        .sepia {
            -webkit-filter: sepia(1);
        }
</style>
......
<label>Filter: </label>
<select id="filter">
<option value="none">None</option>
<option value="blur">blur</option> 				<!-- 模糊 -->
<option value="grayscale">Grayscale</option>	<!-- 灰度 -->
<option value="invert">invert</option>			<!-- 反色 -->
<option value="sepia">sepia</option>			<!-- 褐度 -->
</select>
```
```javascript
videPlayer.className = filterSelect.value;
```
## 4. 截取视频帧
```javascript
// picutre是canvas元素
picture.getContext('2d').drawImage(videPlayer, 0, 0, picture.width, picture.height);
```
## 5. MediaStream API 
+ MediaStream.addTrack()
+ MediaStream.removeTrack()
+ MediaStream.getVideoTracks()
+ MediaStream.getAudioTracks()
+ MediaStream.onaddtrack()
+ MediaStream.onremovetrack()
+ MediaStream.onended()
+ videoTrack.getSettings()

## 6. 音视频录制-MediaRecorder
+ MediaRecorder.start(millisec)
+ MediaRecorder.pause()
+ MediaRecorder.stop()
```javascript
	var options = {
        mimeType: 'video/webm;codecs=vp9'
    }

    if (!MediaRecorder.isTypeSupported(options.mimeType)){
        console.error(`${options.mimeType} is not supported!`);
        return;
    }

    try{
    	// stream是录制源
    	// navigator.mediaDevices.getUserMedia(constraints) 录制视频流
    	// nnavigator.mediaDevices.getDisplayMedia() 录制桌面显示流(experimental)
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch(e){
        console.error('Failed to create MediaRecorder: ', e);
        return;
    }

	// 交付数据时的回调，数据放入buffer，用buffer创建Blob，最后生成URL
    mediaRecorder.ondataavailable = handleDataAvailable;
    // 每10ms返回一段数据
    mediaRecorder.start(10);
```
## 7. SocketIO 
WebSocket实现客户端和服务器之间的双向通信，SocketIO将WebSocket、AJAX等封装成统一的接口，解决了兼容性问题。

```javascript
// 创建
var socketIo = require('socket.io');
var io = socketIo.listen(https_server);

// 监听客户端连接
io.sockets.on('connection', function(socket))
// 给所有用户 msg={join, leave...}
socket.emit("msg", data);
// 给除了自己以外的客户端广播消息
socket.broadcast.emit('msg', data);
// 发送给除自己之外的用户
socket.to(room).emit('msg', data);
// 发送给房间内所有人
io.in(room).emit('msg', data);

// 监听事件
socket.on('joined', function(data));
socket.on('message', function(data));
socket.on('leaved', function(data));
socket.on('disconnect', function(data));
```

## 8. Stun/Turn/ICE
1. **Stun** 协议 （Session Traversal Utilities for NAT）
利用NAT将内网地址映射到一个公网ip和端口
参考： [evilpan_Stun](https://evilpan.com/2015/12/12/p2p-standard-protocol-stun/)
2. **Turn** 协议 (Traversal Using Relays around NAT)
用于对称型NAT，实现无法直接连通的客户端的中继服务。
参考：[evilpan_Turn](https://evilpan.com/2015/12/15/p2p-standard-protocol-turn/)
3. **ICE** 协议 (Interactive Connectivity Establishment)
	为Peers选取最佳的连通方式(Candidate)，包括：1）局域网内直接连通；2）Stun/Turn 映射地址连通； 3）Turn 中继连通。
	**SDP**: （Session Description Protocol）会话描述协议，信息格式的描述标准，描述支持的媒体格式、Candidate等等。
	参考：[evilpan_ICE](https://evilpan.com/2015/12/20/p2p-standard-protocol-ice/)
	步骤：
	+ 形成Candidate Pair：Peer A收集所有Candidate后通过信令传给Peer B，B收到后也收集自己的Candidate，双方都拿到全部列表后，将候选者形成配对
	+ 连通性检查：候选对优先级排序，对每个候选对进行发送检查和接受检查

## 9. 媒体协商过程
**RTCPeerConnection** 类 

```javascript
pc = new RTCPeerConnection([configs]);
```
方法分类：
		 - 媒体协商 	 
		 - Stream/Track 
		 - 传输相关方法 
		 - 统计相关方法

1. 媒体协商过程
 ![媒体协商过程](/img/b7bf81c9ec88471081e981668e645273.png)
Peer A创建Offer，并执行 **pc1.setLocalDescription** (收集A的candidates)，发送给signal, Peer B 收到后执行 **pc2.setRemoteDescription**，然后创建Answer，执行 **pc2.setLocalDescription** (收集B的candidates)，发送给signal，A收到后，执行 **pc1.setRemoteDescription**。完成后，双方就知道对方的信息了，就可以协商传输的媒体类型。

具体方法：
+ pc.createOfffer([options])
+ pc.createAnswer([options])
+ pc.setLocalDescription(sessionDescription)
+ pc.setRemoteDescription(sessionDescription)
+ pc.addTrack(track, stream)
+ pc.remove(track, stream)
+ onnegotiationneeded
+ onicecandidate
![端对端连接过程](/img/5d4eafef3e5e4bf6838c6c2fbb551533.png)


## 10. SDP规范
1. 分为两层：
+ 会话层包括：会话名称、目的、存活时间、多个媒体信息等
+ 媒体层：媒体格式、传输协议、传输IP和端口、媒体负载类型等

Session Description | Media Desciption
-------- | -----
v=协议版本		 | 		
o=所有者/id		 | 		m=媒体名称和传输地址		
s=会话名称		 | 		b=带宽信息
c=连接信息 		 | 		c=连接信息
a=全局属性		 | 		a=会话属性

示例：
o=- 70717123728795 2 IN IP4 127.0.0.1
o=&lt;username&gt;&lt;session id&gt;&lt;version&gt;&lt;network type&gt;&lt;address type&gt;&lt;address&gt;
c=IN IP4 0.0.0.0
c=&lt;network type&gt;&lt;address type&gt;&lt;connection type&gt;
m=audio 1024 UDP/TLS/RTP/ASVPF 111 103 104 9 0 8 106
m=&lt;media&gt;&lt;port&gt;&lt;transport&gt;&lt;fmt/payload type list&gt;
a=framerate:30
a=rtpmap:103 ISAC/16000
a=fmtp:103 apt=106
a=&lt;type&gt;:&lt;value&gt;

2. WebRTC 中的SDP

分为：
+ 会话元(v, o, t)
+ 网络描述(c, a=candidate)
+ 流描述(m,a=rtpmap, a=fmtp)
+ 安全描述(a=crypto, a=ice-frag, a=ice-pwd, a=fingerprint)
+ 服务质量 (a=rtcp-fb, a=group, a=rtcpmux)
