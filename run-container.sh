#!/usr/bin/env bash

container_name="sticky_rs"

is_container_exists(){
  local output=$(podman ps  -a --format "table {{.Names}}" | grep sticky_rs)
  if [[ "$output" == "$container_name" ]];then
    return 0;
  else
    return 1;
  fi
}

is_container_running(){
  local output=$(podman ps --format "table {{.Names}}" | grep sticky_rs)
    if [[ "$output" == "$container_name" ]];then
      return 0;
    else
      return 1;
    fi
}

if ! is_container_exists ;then
  podman run -itd --name "$container_name" -v "$PWD":/workspace   localhost/stick_rs/tauri
fi

if ! is_container_running ;then
  podman start "$container_name"
fi
podman exec -it "$container_name" bash