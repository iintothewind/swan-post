---
title: use yum downloadonly plugin to download rpms
date: 2021-07-17 09:27:40
tags: [linux,centos7]
---

# 使用yum downloadonly插件下载rpm安装文件

因为经常需要离线安装所需要的工具, 而rpm本身有很多依赖需要自己一个个去找很麻烦, 偶尔发现了这个插件很有用:

```bash
# 首先安装yum的downloadonly插件
sudo yum install yum-plugin-downloadonly

# 下载supervisor的所有rpm到当前目录
sudo yum install --downloadonly --downloaddir=. supervisor

```
