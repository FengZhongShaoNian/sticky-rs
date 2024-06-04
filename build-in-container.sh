#!/usr/bin/env bash

source /root/.bashrc
export PATH=/root/.nvm/versions/node/v20.13.1/bin:$PATH
npm install -g pnpm --registry https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com

cat <<EOF > /root/.cargo/config.toml
[source.crates-io]
registry="https://github.com/rust-lang/crates.io-index" # 这行可以不要,只是说明原始地址
replace-with = 'tuna' # 指定使用下面哪个源，修改为source.后面的内容即可

# 中国科学技术大学
[source.ustc]
registry = "sparse+https://mirrors.ustc.edu.cn/crates.io-index/"

# 上海交通大学
[source.sjtu]
registry = "sparse+https://mirrors.sjtug.sjtu.edu.cn/crates.io-index/"

# 清华大学
[source.tuna]
registry = "sparse+https://mirrors.tuna.tsinghua.edu.cn/crates.io-index/"

# 阿里云
[source.aliyun]
registry = "sparse+https://mirrors.aliyun.com/crates.io-index/"

# https://rsproxy.cn/
[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"
EOF

# 解决打包成AppImage后无法使用fcitx5输入法输入中文的问题
apt install -y fcitx5-frontend-gtk3

cd /workspace && pnpm install && pnpm tauri build --debug --verbose

build_appimage(){
  # 构建AppImage
  # 为了解决 https://raw.githubusercontent.com/tauri-apps/linuxdeploy-plugin-gtk/master/linuxdeploy-plugin-gtk.sh 下载失败导致AppImage无法构建的问题，
  # 将 raw.githubusercontent.com 替换为 raw.staticdn.net 即可加速。项目中的build_appimage.sh中已经替换了域名。
  if [[ -d "/workspace/src-tauri/target/debug/bundle/appimage" ]];then
    cp -f /workspace/build_appimage.sh /workspace/src-tauri/target/debug/bundle/appimage/
    chmod +x /workspace/src-tauri/target/debug/bundle/appimage/build_appimage.sh
    cd /workspace/src-tauri/target/debug/bundle/appimage && ./build_appimage.sh
  else
    echo '[/workspace/src-tauri/target/debug/bundle/appimage]目录不存在，无法构建AppImage'
    exit 1
  fi
}

build_appimage