---
title: warning messages and solutions in redis docker deployment
date: 2021-01-15 21:42:02
tags: [linux,bash]
---

# warning

The TCP backlog setting of 511 cannot be enforced because /proc/sys/net/core/somaxconn is set to the lower value of 128.


## solution

```bash
vim /etc/sysctl.conf
net.core.somaxconn = 2048

sysctl -p
```

# warning

overcommit_memory is set to 0! Background save may fail under low memory condition. To fix this issue add 'vm.overcommit_memory = 1' to /etc/sysctl.conf and then reboot or run the command 'sysctl vm.overcommit_memory=1' for this to take effect.

## solution

```bash
vim /etc/sysctl.conf
vm.overcommit_memory = 1
```

# warning

you have Transparent Huge Pages (THP) support enabled in your kernel. This will create latency and memory usage issues with Redis. To fix this issue run the command 'echo never > /sys/kernel/mm/transparent_hugepage/enabled' as root, and add it to your /etc/rc.local in order to retain the setting after a reboot. Redis must be restarted after THP is disabled.

## solution

```bash
echo never > /sys/kernel/mm/transparent_hugepage/enabled

vim /etc/rc.local
if test -f /sys/kernel/mm/transparent_hugepage/enabled; then
  echo never > /sys/kernel/mm/transparent_hugepage/enabled
fi
```

