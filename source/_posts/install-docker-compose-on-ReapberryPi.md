---
title: install docker-compose on ReapberryPi
date: 2020-05-03 17:13:37
tags: [linux]
---

Arm Arch based docker-compose is not officially provided.
To install it, we should use:

```bash
sudo apt install python3 python3-dev python3-pip python3-setuptools python3-wheel
sudo apt install libffi-dev
pip3 install --user docker-compose
```

Do not use `pip`, because some dependencies may not support python2.

