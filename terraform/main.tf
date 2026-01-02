# Enable required GCP APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "firestore.googleapis.com",
    "bigquery.googleapis.com",
    "run.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "redis.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Firestore Database (Canadian data residency)
resource "google_firestore_database" "grants_db" {
  project     = var.project_id
  name        = "(default)"
  location_id = "northamerica-northeast1"  # Montreal, Canada
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.required_apis]
}

# BigQuery Dataset (Canadian data residency)
resource "google_bigquery_dataset" "grants_warehouse" {
  dataset_id    = "grants_warehouse"
  friendly_name = "Grants Data Warehouse"
  description   = "OLAP layer for grants intelligence platform"
  location      = "northamerica-northeast1"  # Montreal, Canada

  labels = {
    environment = var.environment
  }

  depends_on = [google_project_service.required_apis]
}

# BigQuery Table: grants_flat (main serving table)
resource "google_bigquery_table" "grants_flat" {
  dataset_id = google_bigquery_dataset.grants_warehouse.dataset_id
  table_id   = "grants_flat"

  schema = file("${path.module}/schemas/grants_flat.json")

  require_partition_filter = true

  time_partitioning {
    type          = "DAY"
    field         = "deadline_close"
    expiration_ms = 63072000000  # 730 days (2 years)
  }

  clustering = ["province", "status", "last_verified_at"]

  labels = {
    environment = var.environment
  }
}

# BigQuery Table: grants_by_category_daily (derived)
resource "google_bigquery_table" "grants_by_category_daily" {
  dataset_id = google_bigquery_dataset.grants_warehouse.dataset_id
  table_id   = "grants_by_category_daily"

  schema = jsonencode([
    {
      name = "date"
      type = "DATE"
      mode = "REQUIRED"
    },
    {
      name = "category"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "open_grant_count"
      type = "INT64"
      mode = "REQUIRED"
    },
    {
      name = "avg_max_amount"
      type = "FLOAT64"
      mode = "NULLABLE"
    }
  ])

  labels = {
    environment = var.environment
  }
}

# BigQuery Table: funders_activity (derived)
resource "google_bigquery_table" "funders_activity" {
  dataset_id = google_bigquery_dataset.grants_warehouse.dataset_id
  table_id   = "funders_activity"

  schema = jsonencode([
    {
      name = "funder_name"
      type = "STRING"
      mode = "REQUIRED"
    },
    {
      name = "open_grants"
      type = "INT64"
      mode = "REQUIRED"
    },
    {
      name = "avg_award"
      type = "FLOAT64"
      mode = "NULLABLE"
    },
    {
      name = "last_posted"
      type = "DATE"
      mode = "NULLABLE"
    }
  ])

  labels = {
    environment = var.environment
  }
}

# Service Account for Cloud Functions (Firestore → BigQuery sync)
resource "google_service_account" "sync_function" {
  account_id   = "grants-sync-function"
  display_name = "Grants Sync Function Service Account"
  description  = "Service account for Firestore to BigQuery sync"
}

# Grant Firestore read access to sync function
resource "google_project_iam_member" "sync_firestore_read" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.sync_function.email}"
}

# Grant BigQuery write access to sync function
resource "google_project_iam_member" "sync_bigquery_write" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.sync_function.email}"
}

# Grant BigQuery job user to Sync Function (required for Load Jobs)
resource "google_project_iam_member" "sync_bigquery_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.sync_function.email}"
}

# Service Account for API (Cloud Run)
resource "google_service_account" "api" {
  account_id   = "grants-api"
  display_name = "Grants API Service Account"
  description  = "Service account for Grants API Cloud Run service"
}

# Grant BigQuery read access to API
resource "google_project_iam_member" "api_bigquery_read" {
  project = var.project_id
  role    = "roles/bigquery.dataViewer"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Grant BigQuery job user (to run queries)
resource "google_project_iam_member" "api_bigquery_job_user" {
  project = var.project_id
  role    = "roles/bigquery.jobUser"
  member  = "serviceAccount:${google_service_account.api.email}"
}

# Secret Manager: API Keys (placeholder - keys added manually)
resource "google_secret_manager_secret" "api_keys" {
  secret_id = "grants-api-keys"

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
  }

  depends_on = [google_project_service.required_apis]
}

# Memorystore Redis (optional, prod only)
resource "google_redis_instance" "cache" {
  count = var.enable_redis ? 1 : 0

  name           = "grants-cache"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region

  redis_version = "REDIS_7_0"

  labels = {
    environment = var.environment
  }

  depends_on = [google_project_service.required_apis]
}

# Cloud Scheduler: Hourly sync job
resource "google_cloud_scheduler_job" "hourly_sync" {
  name        = "grants-hourly-sync"
  description = "Trigger Firestore to BigQuery sync every hour"
  schedule    = "0 * * * *"  # Every hour at minute 0
  time_zone   = "America/Toronto"  # Ontario timezone

  http_target {
    uri         = "https://${var.region}-${var.project_id}.cloudfunctions.net/sync-to-bigquery"
    http_method = "POST"

    oidc_token {
      service_account_email = google_service_account.sync_function.email
    }
  }

  depends_on = [google_project_service.required_apis]
}

# Billing Budget Alert (Temporarily disabled due to ADC quota issue)
# resource "google_billing_budget" "monthly_budget" {
#   billing_account = var.billing_account_id
#   display_name    = "${var.environment} Monthly Budget"
#
#   budget_filter {
#     projects = ["projects/${var.project_id}"]
#   }
#
#   amount {
#     specified_amount {
#       currency_code = "USD"
#       units         = tostring(var.billing_budget_amount)
#     }
#   }
#
#   threshold_rules {
#     threshold_percent = 0.5  # Alert at 50%
#   }
#
#   threshold_rules {
#     threshold_percent = 0.9  # Alert at 90%
#   }
#
#   threshold_rules {
#     threshold_percent = 1.0  # Alert at 100%
#   }
# }
