provider "google" {
  project = var.project_id
  credentials = file("credentials.json")
  region = var.region
  zone = var.zone
}

resource "google_compute_address" "static" {
  name = "ipv4-address"
}

resource "google_compute_instance" "schwifty" {
    name = var.app_name
    machine_type = var.instance_type
    zone = var.zone
    allow_stopping_for_update = "true"
    tags = [var.app_name]
    connection {
      type = "ssh"
      user = var.username
      private_key = file(var.pem_key)
      host = google_compute_address.static.address
      port = 22
    }
    boot_disk {
      initialize_params {
        size  = var.disk_size
        image = var.disk_image
        type = "pd-standard"
      }
    }
    network_interface {
      network = google_compute_network.schwifty_network.self_link
      subnetwork = google_compute_subnetwork.schwifty_subnet.self_link
      access_config {
        nat_ip = google_compute_address.static.address
      }
    }
    provisioner "file" {
      source      = "files/"
      destination = "/tmp"
    }
    provisioner "remote-exec"{
      inline = [
        # Start database
        "sudo apt-get update",
        "sudo apt-get install -y podman dbus-user-session snapd",
        "systemctl --user start dbus", # removes podman warnings
        "sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 80 -j REDIRECT --to-port 3000",
        "sudo iptables -t nat -A PREROUTING -i ens4 -p tcp --dport 443 -j REDIRECT --to-port ${var.app_port}",
        "podman network create shared",
        "podman pull docker.io/mongodb/mongodb-community-server:latest",
        "podman tag docker.io/mongodb/mongodb-community-server:latest mongo",
        "export MONGO_INITDB_ROOT_USERNAME=${var.mongo_user}",
        "export MONGO_INITDB_ROOT_PASSWORD=${var.mongo_pass}",
        "podman run -d --env 'MONGO*' -p ${var.mongo_port}:${var.mongo_port} --network shared --name mongo-pod mongo --port ${var.mongo_port}",
        "podman generate systemd --name mongo-pod > $HOME/.config/systemd/user/mongo-pod.service",
        "podman stop mongo-pod",
        "systemctl --user start mongo-pod.service",
        "echo 'mongo running on port ${var.mongo_port}!!!'",
        
        # Install mongosh for data querying
        "wget -qO- https://www.mongodb.org/static/pgp/server-7.0.asc | sudo tee /etc/apt/trusted.gpg.d/server-7.0.asc",
        "echo 'deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list",
        "sudo apt-get update",
        "sudo apt-get install -y mongodb-mongosh unzip",
        
        # Install mongo-tools and transfer mongo dump data
        "curl -O https://fastdl.mongodb.org/tools/db/mongodb-database-tools-debian12-x86_64-100.9.4.deb",
        "sudo apt install ./mongodb-database-tools-*.deb && rm mongodb-database-tools-*.deb",
        "unzip /tmp/dump.zip",
        "mongorestore -u ${var.mongo_user} -p ${var.mongo_pass} --port=${var.mongo_port} dump/ && rm -r dump",
        
        # Start application
        "unzip -o -q /tmp/public.zip",
        "mv /tmp/Dockerfile ./ && mv /tmp/.env ./",
        "echo 'MONGO_PORT=${var.mongo_port}' >> .env",
        "podman --cgroup-manager cgroupfs build . -t ${var.app_name}",
        "podman run -ti --network shared -v ./public:/opt/app/public/ --restart=always -d -p ${var.app_port}:${var.app_port} --name ${var.app_name}-pod ${var.app_name}",
        
        # Add cron to restart app every 6 months, domain ip update, certbot for https
        "(crontab -l 2>/dev/null; echo '0 0 1 */2 * podman restart ${var.app_name}-pod') | crontab -",
        "curl ${var.freedns_ip}",
        "sudo snap install core",
        "sudo snap install --classic certbot",
        "sudo ln -s /snap/bin/certbot /usr/bin/certbot",
        "sudo certbot -d ${var.domain} --webroot certonly --webroot -m ${var.email} --agree-tos --non-interactive -w /home/${var.username}/public",
        "sudo cp -RL /etc/letsencrypt/live/${var.domain}/fullchain.pem public/chain.pem",
        "sudo cp -RL /etc/letsencrypt/live/${var.domain}/privkey.pem public/key.pem",
        "sudo chown alvro:alvro public/chain.pem",
        "sudo chown alvro:alvro public/key.pem",
        "echo 'PROD=true' >> .env",
        "podman stop ${var.app_name}-pod",
        "podman --cgroup-manager cgroupfs build . -t ${var.app_name}",
        "podman run -ti --network shared -v ./public:/opt/app/public/ -d -p ${var.app_port}:${var.app_port} --name ${var.app_name}-pod ${var.app_name}",
        "podman generate systemd --name ${var.app_name}-pod > $HOME/.config/systemd/user/${var.app_name}-pod.service",
        "podman stop ${var.app_name}-pod",
        "systemctl --user start ${var.app_name}-pod.service",
        "sudo sed -i 's/^#Port 22.*/Port ${var.new_ssh_port}/' /etc/ssh/sshd_config",
        "sudo service sshd restart",
      ]
    }
}

resource "google_compute_network" "schwifty_network" {
  name = "${var.app_name}-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "schwifty_subnet" {
  name = "${var.app_name}-subnet"
  ip_cidr_range = "10.20.0.0/16"
  region = var.region
  network = google_compute_network.schwifty_network.id
}

resource "google_compute_firewall" "schwifty_firewall" {
  name    = var.app_name
  network = google_compute_network.schwifty_network.name
  allow {
    protocol = "tcp"
    ports    = ["80", "443", var.app_port, var.new_ssh_port, "22", var.mongo_port ] // Change ssh port
  }
  source_tags = [var.app_name]
  source_ranges = ["0.0.0.0/0"]
}

resource "google_compute_project_metadata" "alvro_key" {
  project = var.project_id
  metadata = {
    ssh-keys = var.ssh_pub_key
  }
}
