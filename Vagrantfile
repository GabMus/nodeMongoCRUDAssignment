# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  config.vm.box = "ubuntu/xenial64"
  config.vm.provider "virtualbox" do |v|
    v.memory = 1024
    v.cpus = 1
    v.name = "ubuntu-mongo"
  end
  config.vm.network "forwarded_port", guest: 27017, host: 27017
  config.vm.provision "shell", path: "setup_mongo.sh"

  config.vm.synced_folder "./vagrantShare", "/home/ubuntu/host"
end
