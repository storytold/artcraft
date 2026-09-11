Local Development nginx proxy
=============================

It isn't necessary to use nginx for development, but it can be nice. Nginx allows for a more 
sophisticated testing setup that makes cookie and CORS issues less of a pain.

You can use nginx to serve (locally-signed) SSL, redirect traffic to different ports, or run 
multiple copies of the app side by side.

### Hosts file

Set the following configs in your `/etc/hosts` file (as you would probably do even without nginx),

```
127.0.0.1    dev.fakeyou.com
127.0.0.1    api.dev.fakeyou.com
127.0.0.1    devproxy.fakeyou.com

127.0.0.1    dev.storyteller.ai
127.0.0.1    api.dev.storyteller.ai
127.0.0.1    devproxy.storyteller.ai

# Deprecated development hostnames :
127.0.0.1    jungle.horse
127.0.0.1    api.jungle.horse
```

### Nginx installation and administration

Configure Nginx per the checked in Nginx configs (and instructions) in
the directory `/_develop/localdev/nginx-http-config`.

This should be straightforward, but if it isn't, contribute docs here.

### [Fix] Python 3.6 on Apple M1 Mac

Python3.6 isn't supported on Apple silicon, and it's not in homebrew. It can be installed with 
[nix using Rosetta](https://stackoverflow.com/a/65980989):

Download: https://nixos.org/download.html#nix-quick-install

```
nix run nixpkgs.python36 -c python
```

Install venv:

```
nix run nixpkgs.python36 -c python -m venv python
```

Install other packages on Mac that aren't used in venv:

```
python3 -m pip install --user requests gdown youtube_dl
```
