#!/bin/bash

# Import the public key used by the package management system.
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927

# Create a list file for MongoDB
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list

# Reload local package database.
apt-get update
apt-get upgrade -y
apt-get install -y mongodb-org

# Replace default config
cp /etc/mongod.conf /etc/mongod.conf.backup
cp /home/ubuntu/host/mongod.dev.conf /etc/mongod.conf


cat > /lib/systemd/system/mongod.service << EOF
[Unit]
Description=High-performance, schema-free document-oriented database
After=network.target
Documentation=https://docs.mongodb.org/manual

[Service]
User=mongodb
Group=mongodb
ExecStart=/usr/bin/mongod --quiet --config /etc/mongod.conf

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload

systemctl start mongod
systemctl enable mongod
