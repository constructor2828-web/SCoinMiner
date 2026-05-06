#!/bin/bash
# Lumina Miner - Debian Post-Installation Script
# Adds the Lumina repository to the system for automatic updates

set -e

REPO_URL="https://constructor2828-web.github.io/SchoolEconomy/repo/apt"
KEY_URL="https://constructor2828-web.github.io/SchoolEconomy/repo/lumina-key.gpg"

echo "Configurando repositorio de Lumina para actualizaciones automáticas..."

# Download and install the GPG key
mkdir -p /usr/share/keyrings
curl -fsSL "$KEY_URL" | gpg --dearmor -o /usr/share/keyrings/lumina-archive-keyring.gpg

# Add the sources list
echo "deb [signed-by=/usr/share/keyrings/lumina-archive-keyring.gpg] $REPO_URL ./" > /etc/apt/sources.list.d/lumina.list

echo "¡Repositorio Lumina configurado con éxito! Ahora puedes actualizar con 'sudo apt update'."
