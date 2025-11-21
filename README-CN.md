# sticky-rs

## 简介
这是一款使用Tauri开发的贴图软件（支持Linux系统），可以将图片钉在桌面上并置顶，还可以对图片进行标注。
支持如下标注工具：
- 矩形
- 椭圆
- 直线
- 箭头
- 铅笔
- 马克笔
- 马赛克
- 高斯模糊
- 文本
- 序号
- 橡皮擦

下面是软件界面的截图：
![UI截图](https://raw.gitmirror.com/FengZhongShaoNian/sticky-rs/master/screenshot/ui.png)

## 编译

```shell
cd sticky-rs
pnpm install
pnpm run tauri build
```

## 安装

对于使用archlinux AUR 的用户:
```shell
yay -S sticky-rs-git

# 或者使用如下的预构建好的包：
yay -S sticky-rs-bin
```

## 用法

```shell
Usage: sticky-rs.sh [OPTIONS]

Options:
  -p, --path <PATH>  Path of image to open
  -c, --capture      Capture screen region
  -h, --help         Print help
  -V, --version      Print version
```
这款软件可以搭配`gnome-screenshot`一起使用，从而在Linux上实现Windows上的Snipaste软件的效果。下面是一个脚本，实现了截图并自动贴图：

```shell
#!/bin/bash

mkdir -p /tmp/screenshot-sticky
time=$(date "+%Y%m%d-%H-%M-%S")
tmp_file="/tmp/screenshot-sticky/${time}.png"
gnome-screenshot -c -a -f $tmp_file && /usr/bin/sticky-rs.sh -p "$tmp_file"
```


可以通过系统自带的快捷键功能设置一个快捷键，将自己喜欢的快捷键绑定到这个脚本，就可以实现一键截图并贴图了。
顺带一提，在Archlinux中可以这样安装gnome-screenshot:
```shell
sudo pacman -S gnome-screenshot
```

### 截图功能
由于gnome-screenshot已经无法在Gnome 49+上使用，因此sticky-rs的最新版本内置了简单的区域截图功能。可以通过以下命令启动区域截图：
```shell
sticky-rs.sh -c
```

说明：如果系统开启了分数缩放，那么需要通过STICKY_RS_SCALE_FACTOR环境变量指定缩放参数：
```shell
# 假如系统缩放是125%,那么：
export STICKY_RS_SCALE_FACTOR=1.25
# 截图
sticky-rs.sh -c
```