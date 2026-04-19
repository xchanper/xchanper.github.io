---
title: youtube-dl & ffmpeg 常用命令
date: 2021-05-10
---
## youtube-dl

1. 列出可下载的视频/音频格式
    ```bash
    youtube-dl -F https://www.youtube.com/watch?v=iJvr0VPsn-s -o output.mp4
    ```

2. 仅下载音频
    ```bash
    youtube-dl -x https://www.youtube.com/watch?v=iJvr0VPsn-s -o output.mp3
    ```

3. 下载最佳视频+音频并用ffmpeg合并
    ```bash
    youtube-dl -f bestvideo+bestaudio https://www.youtube.com/watch?v=iJvr0VPsn-s
    ```

4. 指定分辨率视频和音频，并合并
    ```bash
    youtube-dl -f 308+120 https://www.youtube.com/watch?v=iJvr0VPsn-s
    ```

5. 转码
    ```bash
    youtube-dl -i input.mkv output.mp4
    ```

## ffmpeg

1. ffmpeg缩放分辨率
    ```bash
    ffmpeg -i 1.mp4 -strict -2 -s 640x480 output.mp4

    #用-1按原比例缩放，保证视频不变型
    ffmpeg -i 1.mp4 -strict -2 -vf scale=-1:480 output.mp4  
    ```

2. ffmpeg 截取视频片段和视频帧
    ```bash
    ffmpeg -i BBB_2560x1440.mp4 -ss 0:00 -t 10 BBB_10s.mp4 
    # -ss 开始截取的时间, -t 截取时长, -ss 截取帧的时间，单位秒
    ffmpeg -i BBB_8Y.mp4 -ss 5 -f image2 BBB_8Y_5s.jpg 
    ```

3. ffmpeg 调整YUV格式视频亮度
    ```bash
    ffmpeg  -i input.mp4 -vf lutyuv=y=val*0.5:u=128:v=128  output.mp4
    ```

