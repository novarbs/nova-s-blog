#!/bin/zsh

sudo chown -R vscode:vscode node_modules
corepack enable
pnpm install --frozen-lockfile
