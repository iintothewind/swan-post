---
title: use update-alternatives to solve python no such file or directory problem
date: 2019-10-16 11:18:53
tags: [linux,centos8]
---

## the problem
Recently I am trying to use the centos 8 stream.
When I was trying to install python as a dependency for vim plugin `YouCompleteMe`.
The `install.py` was stopped by such a problem:

```
[vagrant@centos8 YouCompleteMe]$ ./install.py
/usr/bin/env: ‘python’: No such file or directory
```

I guess it is probably I installed the `python3`. The executable file mapped to `/usr/bin/python3` but not `/usr/bin/python`.
Therefore there is no executable mapped to `/usr/bin/python`

## the solution

The easy way to fix this is pretty straightforward,
I can just use `ln` to create a symbolic link for the real `python3` executable file and let it map to `/usr/bin/python` then everything seems to be fine.

But my gut feeling tells me there could be an elegant way to fix this problem.
By searching from internet, I found this command `update-alternatives`.

By running this command:

```
[vagrant@centos8 YouCompleteMe]$ sudo update-alternatives --config python

There are 2 programs which provide 'python'.

  Selection    Command
-----------------------------------------------
*+ 1           /usr/libexec/no-python
   2           /usr/bin/python3

Enter to keep the current selection[+], or type selection number: 2
```

We could see that there are currently two programs which provide `python`, and the second one is the right version we want.
So just simply type `2` as our selection, the `python` version would be changed to `python3`.

Now the problem is really solved.

P.S: BTW, I saw `neovim` is still not included in `epel` for centos8, and I am still waiting for it.
