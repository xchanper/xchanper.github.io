---
title: Windows平台搭建Dash系统
date: 2020-12-01
---
## 1. Dash简介

**Dynamic Adaptation Streaming over HTTP (Dash):**
HTTP上的动态自适应视频流技术，它将一个视频划分为许多个segment，每个segment有不同质量的副本，能够在播放时根据用户当前的网络状况选择最佳的码率，减少卡顿。详情: https://dashif.org/


## 2. 配置环境
+ 环境
  - 系统：Windows 10
  - 客户端：Chrome
+ 工具 (安装好并将`bin`目录加入系统环境变量)
  - 服务器：Nginx [安装教程](https://www.cnblogs.com/taiyonghai/p/9402734.html)
  - 编解码器：[FFmpeg](https://github.com/BtbN/FFmpeg-Builds/releases)
  - 视频切片工具：[Bento4](https://www.bento4.com/downloads/)
  - 播放器：[dash.js](https://github.com/Dash-Industry-Forum/dash.js)
+ 视频
  - Big Buck Bunny   可以去 https://download.blender.org/peach/bigbuckbunny_movies/ 下载


## 3. 对视频进行编码
- 目标编码格式：H.264/AVC
- 目标分辨率级别：
  - 1920×1080 (1080p)
  - 1280×720 (720p)
  - 854×480 (480p)
  - 640×360 (360p)
  - 256×144 (144p)
- 编码命令：
  ```bash
    ffmpeg -i Big_Buck_Bunny_1080p.avi -s 1920x1080 -c:v libx264 -keyint_min 48 -g 48 -sc_threshold 0 -an BBB_1920x1080.mp4
    ffmpeg -i Big_Buck_Bunny_1080p.avi -s 1280x720 -c:v libx264 -keyint_min 48 -g 48 -sc_threshold 0 -an BBB_1280x720.mp4
    ffmpeg -i Big_Buck_Bunny_1080p.avi -s 896x504 -c:v libx264 -keyint_min 48 -g 48 -sc_threshold 0 -an BBB_896x504.mp4
    ffmpeg -i Big_Buck_Bunny_1080p.avi -s 640x360 -c:v libx264 -keyint_min 48 -g 48 -sc_threshold 0 -an BBB_640x360.mp4
    ffmpeg -i Big_Buck_Bunny_1080p.avi -s 256x144 -c:v libx264 -keyint_min 48 -g 48 -sc_threshold 0 -an BBB_256x144.mp4
  ```
  + `-i`：输入文件名
  + `-s`：输出的分辨率
  + `-c:v libx264`：将视频编码为H.264/AVC格式
  + `-keyint_min 48 -g 48 -sc_threshold 0`：固定GOP长度为48帧(即2s，具体由帧率决定)。这里如果没有这个参数后面bento4切分时会报错，具体原因见 [FFmpeg的GOP（I帧）对齐问题](https://blog.csdn.net/LvGreat/article/details/103540007)
  + `-an`：不对音频进行编码，dash中音视频分开编码
  + 最后是输出文件名  
 
 可以写个bat，扔那边慢慢跑，视频小的话几十秒就好了。完成后：

![视频编码完成](/img/视频编码完成.png)
​
## 4. 视频切片
1. 使用bento4的`mp4fragment`对视频进行fragment
  ```bash
  mp4fragment --fragment-duration 2000 BBB_1920x1080.mp4 fragmented_1080p.mp4
  mp4fragment --fragment-duration 2000 BBB_1280x720.mp4 fragmented_720p.mp4
  mp4fragment --fragment-duration 2000 BBB_896x504.mp4 fragmented_480p.mp4
  mp4fragment --fragment-duration 2000 BBB_640x360.mp4 fragmented_360p.mp4
  mp4fragment --fragment-duration 2000 BBB_256x144.mp4 fragmented_144p.mp4
  ```
  `--fragment-duration`：指定fragment时长为2s

2. 使用`mp4dash`对已fragment的视频进行切片
   ```bash
   mp4dash fragmented_1080p.mp4 fragmented_720p.mp4 fragmented_480p.mp4 fragmented_360p.mp4 fragmented_144p.mp4
   ```
   成后目录中会自动生成out文件夹，里面有mpd文件和切分的segment
   
   ![视频切片完成](/img/视频切片完成.png)


## 5. 编写简易网页播放器
参考：https://github.com/Dash-Industry-Forum/dash.js​

将out里面的video文件夹和`stream.mpd`放到nginx的html文件夹里，下载`dash.all.min.js`也放入html文件夹中。

具体的目录结构可以自定义。我这边的目录如下：

![demo目录](/img/demo目录.png)



DashJS.html代码如下：
```html
<!doctype html>
<html>
    <head>
        <title>Dash.js Rocks</title>
        <style>
            video {
                width: 640px;
                height: 360px;
            }
        </style>
    </head>
    <body>
        <div>
            <video id="videoPlayer" controls></video>
        </div>
        <script src="./dash.all.min.js"></script>
        <script>
            (function(){
                var url = "./stream.mpd";
                var player = dashjs.MediaPlayer().create();
                player.initialize(document.querySelector("#videoPlayer"), url, true);
            })();
        </script>
    </body>
</html>
```
​

## 6. 配置Nginx服务器
配置访问控制，参考：[跨源资源共享（CORS） - HTTP | MDN](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)

修改Nginx的conf下的nginx.conf文件中的server段，主要是加入location /file那一块
```json
server {
    listen       8800;
    server_name  localhost;

    location / {
        root   html;
        index  index.html index.htm;
    }
    location /file {
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin $http_origin;
            add_header Access-Control-Allow-Methods             
            $http_access_control_request_method;
            add_header Access-Control-Allow-Credentials true;
            add_header Access-Control-Allow-Headers 
            $http_access_control_request_method;
            add_header Access-Control-Max-Age 1728000;
            return 204;
        }
    }

    #error_page  404              /404.html;
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
}
```

验证Nginx配置是否正确，正确后启动Nginx
```bash
nginx -t
start nginx
```

## 7. 验证

最后打开 http://localhost:8800/DashDemo/DashJS.html 验证是否成功即可

​

## 参考
- [1] [DSAH视频系统（服务器&播放器）搭建 - 代码先锋网](https://codeleading.com/article/26092631381/#5_Bento4_90)
- [2] [Nginx 搭建DASH服务器_山城过雨的博客-CSDN博客](https://blog.csdn.net/OCTODOG/article/details/79007302)
- [3] [Making Your Own Simple MPEG-DASH Server (Windows 10) : 12 Steps - Instructables](https://www.instructables.com/Making-Your-Own-Simple-DASH-MPEG-Server-Windows-10/)

