#!/bin/bash
# https://cloud.google.com/sql/docs/mysql/connect-kubernetes-engine

# Enable workload identity for your cluster
gcloud container clusters update above-the-clouds \
  --workload-pool=above-the-clouds-app.svc.id.goog

# Create Kubernetes Sevice Account (KSA)
kubectl apply -f cloud-sql-proxy-sa.yaml

# Enable the IAM binding between your YOUR-GSA-NAME and YOUR-KSA-NAME:
gcloud iam service-accounts add-iam-policy-binding \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:above-the-clouds-app.svc.id.goog[default/cloud-sql-proxy-sa]" \
  cloud-sql-proxy-sa@above-the-clouds-app.iam.gserviceaccount.com

# Add the iam.gke.io/gcp-service-account=GSA_NAME@PROJECT_ID annotation to the Kubernetes service account, using the email address of the Google service account.
kubectl annotate serviceaccount \
  --namespace default \
  cloud-sql-proxy-sa \
  iam.gke.io/gcp-service-account=cloud-sql-proxy-sa@above-the-clouds-app.iam.gserviceaccount.com
