---
title: set user and group in docker compose
date: 2021-09-11T18:05:59.000Z
tags:
  - docker
header: true
footer: true
author: Ivar.Chen
source: 'https://iintothewind.github.io/'
---
## Step 1: Add user entry in docker-compose.yml

```yaml
version: '3'
services:
    app:
        image: alpine
        user: "${UID}:${GID}"
```

### step 2: run docker-compose

```bash
env UID=${UID} GID=${GID} docker-compose run app id
```

