#!/bin/bash
# Lumina Miner - Pacman Post-Installation Script
# Suggests adding the Lumina repository to pacman.conf

set -e

REPO_NAME="lumina"
REPO_URL="https://constructor2828-web.github.io/SchoolEconomy/repo/pacman/\$arch"

if ! grep -q "\[$REPO_NAME\]" /etc/pacman.conf; then
    echo "" >> /etc/pacman.conf
    echo "[$REPO_NAME]" >> /etc/pacman.conf
    echo "SigLevel = Optional TrustAll" >> /etc/pacman.conf
    echo "Server = $REPO_URL" >> /etc/pacman.conf
    echo "¡Repositorio Lumina añadido a /etc/pacman.conf!"
fi
