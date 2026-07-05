---
title: use fastgit to boost git access
date: 2021-11-09 16:56:30
tags: [linux,git]
---

```bash

git config --global url."https://hub.fastgit.org/".insteadOf "https://github.com/"
git config --global protocol.https.allow always

```

```bash

# update /etc/hosts
199.232.5.194 github.global.ssl.fastly.net
140.82.114.4 github.com


```
