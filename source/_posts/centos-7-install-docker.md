---
title: centos 7 install docker
date: 2021-07-26T16:16:15.000Z
tags:
  - linux
  - centos7
header: true
footer: true
author: Ivar.Chen
source: 'https://iintothewind.github.io/'
---

```bash

sudo yum remove mariadb-libs

sudo yum-config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
sudo dnf config-manager --add-repo http://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

sudo yum install docker-ce docker-ce-cli
sudo dnf install docker-ce docker-ce-cli

sudo vim /etc/docker/daemon.json
```


```json
{
"registry-mirrors": ["https://registry.docker-cn.com","http://hub-mirror.c.163.com"],
"live-restore": true
}
```
