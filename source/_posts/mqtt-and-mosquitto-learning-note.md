---
title: mqtt and mosquitto learning note
date: 2020-05-03 17:22:00
tags: [mqtt]
---
mqtt是一个设计的非常好用的轻量级消息传输协议.
它广泛被应用在机器直接交互的物联网场景之中. 它的特点相信在网上很多文章中已经介绍的够多了.
我这里只说一些我感兴趣的:

## QoS

- QoS 0: At most once delivery
- QoS 1: At least once delivery
- QoS 2: Exactly once delivery

## Session存储

mqtt broker是支持持久化的. 消费端连接的时候可以提供一个id, 并保留连接的状态.
这样当消费端断开, 下次重连的时候, 服务器可以把之前没有被消费端消费的消息再次发送到消费端.
这个功能需要两个前提, 一个是消费连接的时候提供了id, 并且声明不会清除session, 另一个是发送到服务器的消息的QoS必须是1或者2.

## Topic Wildcards 主题通配符订阅和主题过滤

这个功能允许消费端订阅多个主题并且过滤其中某些主题

## 基于websocket的网络传输

这个对于web服务有多重要不言而喻了吧.

## 官方mqtt消息服务器 mosquitto

### 安装

mosquitto提供了debian的官方repo, centos系也可以从epel安装.
当然了, 如果你想docker运行, 也可以使用官方docker镜像`eclipse-mosquitto:1.6.9`, 它也是支持x86和arm等多种架构的.

### 开启websoket支持

目前mosquitto(1.6.9)这个broker是支持websocket协议的, 不过在默认的配置文件里面没有打开.
如果需要对websocket提供支持, 在mosquitto.conf文件中需要这样修改:

```bash
port 1883
listener 1884
protocol websockets
```

`port 1883`对应的是mqtt协议的端口.
`listener 1884`对应的是websokets协议的端口

### 一些发送端和消费端命令

```bash

# 向localhost的默认端口发送消息
# q开关指定消息的QoS为2, 表示如果消息没有发送到消费端的话会保存在session里面, 等客户端连接的时候会尝试发送
mosquitto_pub -h localhost -t topic01 -q 2 -m "hello world"

# c开关表示不清除session, 需要指定client id
# q开关指定消息的QoS为2, 表示如果消息没有发送到消费端的话会保存在session里面, 等客户端连接的时候会尝试发送
# v开关打印接收到的消息, 调试需要
mosquitto_sub -h localhost -i client_id_01 -q 2 -c -v -t topic01
```

## 窗口界面的mqtt客户端工具 mqttx

在[mqttx.app](https://mqttx.app/)下载


