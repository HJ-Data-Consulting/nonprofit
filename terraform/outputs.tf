output "project_id" {
  description = "GCP Project ID"
  value       = var.project_id
}

output "firestore_database" {
  description = "Firestore database name"
  value       = google_firestore_database.grants_db.name
}

output "bigquery_dataset" {
  description = "BigQuery dataset ID"
  value       = google_bigquery_dataset.grants_warehouse.dataset_id
}

output "sync_function_service_account" {
  description = "Service account email for sync function"
  value       = google_service_account.sync_function.email
}

output "api_service_account" {
  description = "Service account email for API"
  value       = google_service_account.api.email
}

output "redis_host" {
  description = "Redis instance host (if enabled)"
  value       = var.enable_redis ? google_redis_instance.cache[0].host : null
}

output "redis_port" {
  description = "Redis instance port (if enabled)"
  value       = var.enable_redis ? google_redis_instance.cache[0].port : null
}

output "firebase_config" {
  description = "Firebase Client SDK Configuration"
  value = {
    apiKey            = data.google_firebase_web_app_config.default.api_key
    authDomain        = data.google_firebase_web_app_config.default.auth_domain
    projectId         = var.project_id
    storageBucket     = lookup(data.google_firebase_web_app_config.default, "storage_bucket", "")
    messagingSenderId = lookup(data.google_firebase_web_app_config.default, "messaging_sender_id", "")
    appId             = google_firebase_web_app.default.app_id
  }
}
