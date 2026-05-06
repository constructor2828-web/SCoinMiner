#!/bin/bash
# Script to generate APT and Pacman repository indexes

set -e

REPO_ROOT="repo"
mkdir -p $REPO_ROOT/apt $REPO_ROOT/pacman/x86_64

# Copy debs to apt repo
cp release/1.1.1/*.deb $REPO_ROOT/apt/ || true

# Copy pacman packages to pacman repo
cp release/1.1.1/*.pacman $REPO_ROOT/pacman/x86_64/ || true

# Generate APT index
cd $REPO_ROOT/apt
dpkg-scanpackages . /dev/null | gzip -9c > Packages.gz
cd ../..

# Generate Pacman index
cd $REPO_ROOT/pacman/x86_64
# Rename .pacman to .pkg.tar.zst if needed, or just use as is
for f in *.pacman; do
    mv "$f" "${f%.pacman}.pkg.tar.zst" || true
done
repo-add lumina.db.tar.gz *.pkg.tar.zst
cd ../../..

echo "Repositorio generado en la carpeta /repo"
