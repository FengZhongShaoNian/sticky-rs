#!/usr/bin/env bash

podman run -it --name sticky_rs -v "$PWD":/workspace   localhost/stick_rs/tauri