{{- define "infrastructure.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "infrastructure.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{- define "infrastructure.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "infrastructure.labels" -}}
helm.sh/chart: {{ include "infrastructure.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: cloudmart
{{- end }}

{{/*
Component-specific labels for infrastructure resources
*/}}
{{- define "infrastructure.componentLabels" -}}
helm.sh/chart: {{ include "infrastructure.chart" .context }}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/instance: {{ .context.Release.Name }}
app.kubernetes.io/managed-by: {{ .context.Release.Service }}
app.kubernetes.io/part-of: cloudmart
{{- end }}

{{- define "infrastructure.componentSelectorLabels" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/instance: {{ .context.Release.Name }}
{{- end }}

{{/*
Network Policy labels
*/}}
{{- define "infrastructure.networkPolicyLabels" -}}
helm.sh/chart: {{ include "infrastructure.chart" .context }}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/component: network-policy
app.kubernetes.io/managed-by: {{ .context.Release.Service }}
app.kubernetes.io/part-of: cloudmart
{{- end }}
