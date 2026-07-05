---
title: bash command cheat sheet
date: 2020-05-03 11:53:30
tags: [linux,bash]
---

My WizNote service has been expired.
I did not pay to renew the service.
It is good and convenient though.
So I decided to move all my previous learning notes to here.
Most of them are not originally created by me.
I would try to include the source.
Please remind me to delete them if you are the author and you feel it is a violation of your copyright.

```bash

# last parameter
$_

# word replace
^before^after

# check alias
type -a ll

alias sudo='sudo '
# greps
alias grep='grep --color'
alias egrep='egrep --color'
alias fgrep='fgrep --color'

# utils
alias sudo="sudo "
alias ll="ls -lthF"
alias la="ls -lthFA"
alias md="mkdir "
alias rm="rm -i"
alias mdate="date "+%Y-%m-%d %H:%M:%S""

# fedora
alias vim="gvim -v"
alias xcp="xclip -selection clipboard"
alias xcv="xclip -o"
alias rmrtlan="sudo route del default enp0s31f6"
alias scrnoff="xset dpms force off "
alias printpath="echo $PATH | tr : \\n"
alias lstcp="lsof -i -n -P | grep TCP"

# list top 5 files/ folders

du -h | sort -rh | head -n 5
# list only directories
ls -l | grep ^d

# tree list
find . -type d |sed 's:[^-][^/]*/:--:g; s:^-: |:'


find / -name file1  # 从 '/' 开始进入根文件系统搜索文件和目录
find / -user user1  # 搜索属于用户 'user1' 的文件和目录
find /home/user1 -name \*.bin    # 在目录 '/ home/user1' 中搜索带有'.bin' 结尾的文件
find /usr/bin -type f -atime +100   # 搜索在过去 100 天内未被使用过的执行文件
find /usr/bin -type f -mtime -10   #    搜索在 10 天内被创建或者修改过的文件
find / -name *.rpm -exec chmod 755 '{}' \;  # 搜索以 '.rpm' 结尾的文件并定义其权限
find / -xdev -name \*.rpm   # 搜索以 '.rpm' 结尾的文件，忽略光驱、捷盘等可移动设备
find ./code -name "*.c" |xargs grep -in "hello" # 在~/code 目录搜索并显示文件名后缀为.c 并且包含字符串 hello 的文件和行数
find . -type f -exec chmod 644 {} \;  # 文件加 644
find . -type d -exec chmod 755 {} \; # 目录加 755
find ./ -type f | xargs sudo chmod 644

# display thread

ps -efL
# display top 5 processes which has taken most memory and cpu resources
ps -ef --sort -pmem,+pcpu | head -n 6
# change output format
ps -eo pic,user,args
# monitor threads of process with name contains java
pidstat -C java -t

sudo localectl set-locale.utf8

wget -e use_proxy=on --no-check-certificate https://nodejs.org/dist/v5.1.0/node-v5.1.0-x64.msi
wget -t0 -c --no-check-certificate http://mirror.bit.edu.cn/apache/kafka/0.10.0.0/kafka_2.11-0.10.0.0.tgz -O ~/Downloads/kafka.tgz

# yum install and yum local install can both be replaced with:
sudo dnf install <anypackage>

# list services

systemctl list-unit-files | grep smb
# config service to be auto-start
systemctl enable smb.service
# start service
systemctl start service
# stop servie
systemctl stop service
# disable service
systemctl disable service
