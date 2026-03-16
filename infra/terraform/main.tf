terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Secret Manager setup
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-key"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret" "aisstream_key" {
  secret_id = "aisstream-key"
  replication {
    automatic = true
  }
}

# Cloud Firestore
resource "google_firestore_database" "osint_db" {
  project     = var.project_id
  name        = "(default)"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
}

# Cloud Storage
resource "google_storage_bucket" "images_bucket" {
  name          = "${var.project_id}-geosentinel-assets"
  location      = var.region
  force_destroy = true
}

# Outputs and specific Job config omitted for brevity, see deploy.sh for runtime logic
