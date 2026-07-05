---
title: aws linux install docker
date: 2023-11-20 14:49:40
tags: [linux,docker]
---

```bash
ssh ec2-user@ec2-ip-address-dns-name-here

# install docker
sudo yum update
sudo yum search docker
sudo yum info docker
sudo yum install docker

# add user into docker group
sudo usermod -a -G docker ec2-user
id ec2-user
newgrp docker

# install docker-compose
wget https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)
sudo mv docker-compose-$(uname -s)-$(uname -m) /usr/local/bin/docker-compose
sudo chmod -v +x /usr/local/bin/docker-compose

# start service
sudo systemctl enable docker.service
sudo systemctl start docker.service
sudo systemctl status docker.service

```
