---
title: firewalld command cheet sheet
date: 2020-05-03 15:50:42
tags: [linux,bash]
---

启动一个服务：

```bash
systemctl --type=service
systemctl start firewalld.service
```

关闭一个服务：

```bash
systemctl stop firewalld.service
```

重启一个服务：

```bash
systemctl restart firewalld.service
```

显示状态： 

```bash
firewall-cmd --state
```

zone

```bash
firewall-cmd --get-default-zone
firewall-cmd --get-active-zones
```

查看所有打开的端口： 

```bash
firewall-cmd --zone=public --list-ports
firewall-cmd --zone=FedoraServer --list-ports
```

更新防火墙规则： 

```bash
firewall-cmd --reload
```

添加一个端口：

```bash
firewall-cmd --zone=public --add-port=80/tcp --permanent 
firewall-cmd --zone=FedoraServer --add-port=80/tcp --permanent 
firewall-cmd --zone=FedoraServer --add-port=5060-5061/udp
```

删除一个端口：

```bash
firewall-cmd --zone=public --remove-port=80/tcp --permanent 
firewall-cmd --zone=FedoraServer --remove-port=80/tcp --permanent 
firewall-cmd --zone=FedoraServer --remove-port=80/tcp --permanent 
```


