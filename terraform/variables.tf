variable "project_id" {}
variable "region" {}
variable "zone" {}
variable "app_name" {}
variable "instance_type" {}
variable "username" {}
variable "pem_key" {
    sensitive = true
}
variable new_ssh_port {}
variable "app_port" {}
variable "disk_size" {}
variable "disk_image" {}
variable "mongo_user" {}
variable "mongo_pass" {
    sensitive = true
}
variable "mongo_port" {}
variable "ssh_pub_key" {}
variable "email" {}
variable "domain" {}
variable "freedns_ip" {}