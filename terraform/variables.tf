variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region (Canadian data residency)"
  type        = string
  default     = "northamerica-northeast1"  # Montreal, Canada
}

variable "environment" {
  description = "Environment (dev or prod)"
  type        = string
  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "Environment must be dev or prod"
  }
}

variable "billing_budget_amount" {
  description = "Monthly billing budget in USD"
  type        = number
  default     = 100
}

variable "enable_redis" {
  description = "Enable Memorystore Redis (costs ~$30/month)"
  type        = bool
  default     = false
}

variable "api_tiers" {
  description = "API tier configurations"
  type = map(object({
    daily_quota = number
    description = string
  }))
  default = {
    free = {
      daily_quota = 100
      description = "Free tier - 100 requests/day"
    }
    pro = {
      daily_quota = 10000
      description = "Pro tier - 10k requests/day, advanced filters"
    }
    enterprise = {
      daily_quota = 100000
      description = "Enterprise tier - custom SLAs, bulk access"
    }
  }
}
