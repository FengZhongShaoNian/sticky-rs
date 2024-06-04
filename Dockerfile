FROM ubuntu:20.04

# 换源
RUN sed -i "s@http://.*archive.ubuntu.com@http://repo.huaweicloud.com@g" /etc/apt/sources.list
RUN sed -i "s@http://.*security.ubuntu.com@http://repo.huaweicloud.com@g" /etc/apt/sources.list

RUN echo "Asia/Shanghai" > /etc/timezone
RUN rm -rf /etc/localtime
RUN ln -s /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

RUN apt update && apt install -y libwebkit2gtk-4.0-dev \
    git \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

# installs nvm (Node Version Manager)
RUN git clone https://gitee.com/fengzhongshaonian/nvm.git /root/.nvm
RUN chmod +x /root/.nvm/nvm.sh
RUN echo 'export NVM_DIR=/root/.nvm' >> /root/.bashrc
RUN echo 'source "$NVM_DIR/nvm.sh"' >> /root/.bashrc

# download and install Node.js
RUN bash -c "source /root/.nvm/nvm.sh && nvm install v20.13.1"

# Install RUST
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs > /root/rustup.sh
RUN chmod +x /root/rustup.sh
RUN RUSTUP_DIST_SERVER=https://mirrors.tuna.tsinghua.edu.cn/rustup RUSTUP_UPDATE_ROOT=https://mirrors.ustc.edu.cn/rust-static/rustup /root/rustup.sh -y

VOLUME ["/workspace"]
WORKDIR /workspace
CMD bash