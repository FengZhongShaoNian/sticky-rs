# sticky-rs

## Description（[中文简介](./README-CN.md)）
A Tauri-powered image sticky-note app（Support Linux）, enabling users to affix pictures to their desktop and keep them always on display. It comes equipped with various annotation capabilities.
Among the annotation options are:

- Rectangular framing
- Oval framing
- Line drawing
- Arrow creation
- Freehand sketching
- Highlighter marker
- Pixelated masking
- Gaussian blurring
- Text overlay
- Step-by-step numbering
- Virtual eraser

Have a look at the software's interface through the screenshot provided:
![UI截图](https://raw.gitmirror.com/FengZhongShaoNian/sticky-rs/master/screenshot/ui.png)

## Compile

```shell
cd sticky-rs
pnpm install
pnpm run tauri build
```

## Installation

For archlinux AUR users:
```shell
yay -S sticky-rs-git

#or:
yay -S sticky-rs-bin
```

## Usage

```shell
Usage: sticky-rs.sh --path <PATH>

Options:
  -p, --path <PATH>  Path of image to open
  -h, --help         Print help
  -V, --version      Print version
```

This software can be used with `gnome-screenshot` to achieve the effect of Snipaste software on Windows on Linux. The following is a script that takes screenshots and automatically pins them:
```shell
#!/bin/bash

mkdir -p /tmp/screenshot-sticky
time=$(date "+%Y%m%d-%H-%M-%S")
tmp_file="/tmp/screenshot-sticky/${time}.png"
gnome-screenshot -c -a -f $tmp_file && /usr/bin/sticky-rs.sh -p "$tmp_file"
```
You can set a shortcut key through the system's built-in shortcut key function, bind your favorite shortcut key to this script, and you can take screenshots and paste pictures with one click.

By the way, you can install gnome-screenshot in Archlinux like this:
```shell
sudo pacman -S gnome-screenshot
```