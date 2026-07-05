---
title: find those plugins which are making vim slow
date: 2019-12-10 17:53:36
tags: [vim]
---

## option 1: use **hyiltiz/vim-plugins-profile**
**hyiltiz/vim-plugins-profile** is a plugin which can find the top 10 plugins that slows down vim startup

```shell
Generating vim startup profile...
Parsing vim startup profile...
Crunching data and generating profile plot ...

Your plugins startup profile graph is saved
as `profile.png` under current directory.

==========================================
Top 10 Plugins That Slows Down Vim Startup
==========================================
   1	105.13	"vim-colorschemes"
   2	42.661	"vim-easytags"
   3	31.173	"vim-vendetta"
   4	22.02	"syntastic"
   5	13.362	"vim-online-thesaurus"
   6	7.888	"vim-easymotion"
   7	6.931	"vim-airline"
   8	6.608	"YankRing.vim"
   9	5.266	"nerdcommenter"
  10	5.017	"delimitMate"
==========================================
Done!
```

## option 2: use built-in profiling support
After launching vim do:

```
:profile start profile.log
:profile func *
:profile file *
" do some operations that you feel slow in vim
:profile pause

```
The `profile.log` is created in your vim sessions's current directory.
