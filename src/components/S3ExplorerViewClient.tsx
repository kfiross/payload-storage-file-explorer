'use client'

import React, {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

// Payload UI primitives — available in @payloadcms/ui
import {
  Button,
  Drawer,
  DrawerToggler,
  toast as payloadToast,
  TextInput,
  useDrawerSlug,
  useModal,
} from '@payloadcms/ui'

import type { PayloadStorageFileExplorerConfig } from '../index.js'
import type { S3Item, S3ListResult } from '../types/index.js'

// ─── Icon components ──────────────────────────────────────────────────────────

const Icon = {
  FileText: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="lucide lucide-file-text-icon lucide-file-text"
    >
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  ),
  FilePdf: () => (
    <svg
      width="19px"
      height="19px"
      viewBox="-4 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M25.6686 26.0962C25.1812 26.2401 24.4656 26.2563 23.6984 26.145C22.875 26.0256 22.0351 25.7739 21.2096 25.403C22.6817 25.1888 23.8237 25.2548 24.8005 25.6009C25.0319 25.6829 25.412 25.9021 25.6686 26.0962ZM17.4552 24.7459C17.3953 24.7622 17.3363 24.7776 17.2776 24.7939C16.8815 24.9017 16.4961 25.0069 16.1247 25.1005L15.6239 25.2275C14.6165 25.4824 13.5865 25.7428 12.5692 26.0529C12.9558 25.1206 13.315 24.178 13.6667 23.2564C13.9271 22.5742 14.193 21.8773 14.468 21.1894C14.6075 21.4198 14.7531 21.6503 14.9046 21.8814C15.5948 22.9326 16.4624 23.9045 17.4552 24.7459ZM14.8927 14.2326C14.958 15.383 14.7098 16.4897 14.3457 17.5514C13.8972 16.2386 13.6882 14.7889 14.2489 13.6185C14.3927 13.3185 14.5105 13.1581 14.5869 13.0744C14.7049 13.2566 14.8601 13.6642 14.8927 14.2326ZM9.63347 28.8054C9.38148 29.2562 9.12426 29.6782 8.86063 30.0767C8.22442 31.0355 7.18393 32.0621 6.64941 32.0621C6.59681 32.0621 6.53316 32.0536 6.44015 31.9554C6.38028 31.8926 6.37069 31.8476 6.37359 31.7862C6.39161 31.4337 6.85867 30.8059 7.53527 30.2238C8.14939 29.6957 8.84352 29.2262 9.63347 28.8054ZM27.3706 26.1461C27.2889 24.9719 25.3123 24.2186 25.2928 24.2116C24.5287 23.9407 23.6986 23.8091 22.7552 23.8091C21.7453 23.8091 20.6565 23.9552 19.2582 24.2819C18.014 23.3999 16.9392 22.2957 16.1362 21.0733C15.7816 20.5332 15.4628 19.9941 15.1849 19.4675C15.8633 17.8454 16.4742 16.1013 16.3632 14.1479C16.2737 12.5816 15.5674 11.5295 14.6069 11.5295C13.948 11.5295 13.3807 12.0175 12.9194 12.9813C12.0965 14.6987 12.3128 16.8962 13.562 19.5184C13.1121 20.5751 12.6941 21.6706 12.2895 22.7311C11.7861 24.0498 11.2674 25.4103 10.6828 26.7045C9.04334 27.3532 7.69648 28.1399 6.57402 29.1057C5.8387 29.7373 4.95223 30.7028 4.90163 31.7107C4.87693 32.1854 5.03969 32.6207 5.37044 32.9695C5.72183 33.3398 6.16329 33.5348 6.6487 33.5354C8.25189 33.5354 9.79489 31.3327 10.0876 30.8909C10.6767 30.0029 11.2281 29.0124 11.7684 27.8699C13.1292 27.3781 14.5794 27.011 15.985 26.6562L16.4884 26.5283C16.8668 26.4321 17.2601 26.3257 17.6635 26.2153C18.0904 26.0999 18.5296 25.9802 18.976 25.8665C20.4193 26.7844 21.9714 27.3831 23.4851 27.6028C24.7601 27.7883 25.8924 27.6807 26.6589 27.2811C27.3486 26.9219 27.3866 26.3676 27.3706 26.1461ZM30.4755 36.2428C30.4755 38.3932 28.5802 38.5258 28.1978 38.5301H3.74486C1.60224 38.5301 1.47322 36.6218 1.46913 36.2428L1.46884 3.75642C1.46884 1.6039 3.36763 1.4734 3.74457 1.46908H20.263L20.2718 1.4778V7.92396C20.2718 9.21763 21.0539 11.6669 24.0158 11.6669H30.4203L30.4753 11.7218L30.4755 36.2428ZM28.9572 10.1976H24.0169C21.8749 10.1976 21.7453 8.29969 21.7424 7.92417V2.95307L28.9572 10.1976ZM31.9447 36.2428V11.1157L21.7424 0.871022V0.823357H21.6936L20.8742 0H3.74491C2.44954 0 0 0.785336 0 3.75711V36.2435C0 37.5427 0.782956 40 3.74491 40H28.2001C29.4952 39.9997 31.9447 39.2143 31.9447 36.2428Z"
        fill="#EB5757"
      />
    </svg>
  ),
  FileAudio: () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className="lucide lucide-file-music-icon lucide-file-music"
    >
      <path d="M11.65 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v10.35" />
      <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      <path d="M8 20v-7l3 1.474" />
      <circle cx="6" cy="20" r="2" />
    </svg>
  ),
  Alert: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  ),
  CheckSquare: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  ChevronDown: () => (
    <svg
      fill="none"
      height="12"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width="12"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronRight: () => (
    <svg
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronUp: () => (
    <svg
      fill="none"
      height="12"
      stroke="currentColor"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
      width="12"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  ),
  Download: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  ),
  ExternalLink: () => (
    <svg
      fill="none"
      height="14"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" x2="21" y1="14" y2="3" />
    </svg>
  ),
  Eye: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  File: () => (
    <svg
      fill="none"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Folder: () => (
    <svg fill="currentColor" height="18" viewBox="0 0 24 24" width="18">
      <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
    </svg>
  ),
  FolderPlus: () => (
    <svg
      fill="none"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      <line x1="12" x2="12" y1="11" y2="17" />
      <line x1="9" x2="15" y1="14" y2="14" />
    </svg>
  ),
  Grid: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="7" width="7" x="3" y="3" />
      <rect height="7" width="7" x="14" y="3" />
      <rect height="7" width="7" x="14" y="14" />
      <rect height="7" width="7" x="3" y="14" />
    </svg>
  ),
  Image: () => (
    <svg
      fill="none"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <rect height="18" rx="2" width="18" x="3" y="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  List: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <line x1="8" x2="21" y1="6" y2="6" />
      <line x1="8" x2="21" y1="12" y2="12" />
      <line x1="8" x2="21" y1="18" y2="18" />
      <line x1="3" x2="3.01" y1="6" y2="6" />
      <line x1="3" x2="3.01" y1="12" y2="12" />
      <line x1="3" x2="3.01" y1="18" y2="18" />
    </svg>
  ),
  Refresh: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  ),
  Square: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <rect height="18" rx="2" ry="2" width="18" x="3" y="3" />
    </svg>
  ),
  Trash: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  ),
  Upload: () => (
    <svg
      fill="none"
      height="18"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  ),
  X: () => (
    <svg
      fill="none"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="16"
    >
      <line x1="18" x2="6" y1="6" y2="18" />
      <line x1="6" x2="18" y1="6" y2="18" />
    </svg>
  ),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B'
  }
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function isImageKey(key: string): boolean {
  return /\.(?:jpe?g|png|gif|webp|svg|ico)$/i.test(key)
}
function isPdfKey(key: string): boolean {
  return /\.pdf$/i.test(key)
}
function isVideoKey(key: string): boolean {
  return /\.(?:mp4|webm|ogg|mov)$/i.test(key)
}
function isAudioKey(key: string): boolean {
  return /\.(?:mp3|wav|ogg|m4a|flac)$/i.test(key)
}

function getFileIcon(key: string) {
  if (isImageKey(key)) {
    return <Icon.Image />
  }
  if (isPdfKey(key)) {
    return <Icon.FilePdf />
  }
  if (isAudioKey(key)) {
    return <Icon.FileAudio />
  }
  return <Icon.File />
}

function getFileColor(key: string): string {
  if (isImageKey(key)) {
    return '#8b5cf6'
  }
  if (isPdfKey(key)) {
    return '#ef4444'
  }
  if (isVideoKey(key)) {
    return '#3b82f6'
  }
  if (isAudioKey(key)) {
    return '#22c55e'
  }
  return '#6b7280'
}

function filenameFromKey(key: string, prefix: string): string {
  return key.replace(prefix, '').split('/').pop() ?? key
}

function folderNameFromKey(key: string): string {
  const subpath = key.split('/')
  if (subpath.length > 1) {
    return subpath[subpath.length - 2]
  }
  return subpath[0]
}

function isKnownExtension(ext: string) {
  if (ext === 'EMPTYFOLDERPLACEHOLDER') {
    return false
  }
  return true
}

function buildBreadcrumbs(prefix: string): { label: string; prefix: string }[] {
  const crumbs: { label: string; prefix: string }[] = [{ label: 'Root', prefix: '' }]
  if (!prefix) {
    return crumbs
  }
  const parts = prefix.replace(/\/$/, '').split('/')
  parts.forEach((part, i) => {
    crumbs.push({ label: part, prefix: parts.slice(0, i + 1).join('/') + '/' })
  })
  return crumbs
}

function getExtension(key: string): string {
  return key.split('.').pop()?.toUpperCase() ?? 'FILE'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SortField = 'lastModified' | 'name' | 'size'
type SortDir = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

interface UploadProgress {
  error?: string
  filename: string
  progress: number
  status: 'done' | 'error' | 'pending' | 'uploading'
}

interface ContextMenuState {
  x: number
  y: number
}

interface PreviewPane {
  downloadUrl?: string
  key: string
  lastModified: string
  name: string
  size: number
}

interface ExplorerProps {
  apiBasePath: string
  options: Pick<
    PayloadStorageFileExplorerConfig,
    | 'enableDelete'
    | 'enableDownload'
    | 'enableFolderCreate'
    | 'enableUpload'
    | 'maxUploadSize'
    | 'rootPrefix'
    | 'access'
    | 'pageTitle'
    | 'allowedExtensions'
    | 'allowedMimeTypes'
  >
}

// ─── Create Folder Drawer body ────────────────────────────────────────────────
// Payload's <Drawer> renders the title bar & close button for us.
// We only need to provide the form body inside it.

interface CreateFolderDrawerBodyProps {
  apiBasePath: string
  drawerSlug: string
  onCreated: () => void
  prefix: string
}

function CreateFolderDrawerBody({
  apiBasePath,
  drawerSlug,
  onCreated,
  prefix,
}: CreateFolderDrawerBodyProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [fieldError, setFieldError] = useState<null | string>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { closeModal } = useModal()

  // auto-focus the input when the drawer opens
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120)
    return () => clearTimeout(t)
  }, [])

  const closeDrawer = () => {
    closeModal(drawerSlug)
  }

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setFieldError('Folder name is required.')
      return
    }
    if (/[/\\]/.test(trimmed)) {
      setFieldError('Folder name must not contain slashes.')
      return
    }

    setSubmitting(true)
    setFieldError(null)
    try {
      const res = await fetch(`${apiBasePath}/folder`, {
        body: JSON.stringify({ name: trimmed, prefix }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const json = await res.json()
      if (!json.success) {
        throw new Error(json.error ?? 'Failed to create folder')
      }

      payloadToast.success(`Folder "${trimmed}" created`)
      setName('')
      onCreated()
      closeDrawer()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setFieldError(msg)
      payloadToast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={drawerBodyStyles.root}>
      <p style={drawerBodyStyles.hint}>
        Creating a new folder inside&nbsp;
        <code style={drawerBodyStyles.code}>{prefix || '/'}</code>
      </p>

      {/*
        Payload's <TextInput> renders with the admin theme's field chrome
        (label, error highlight, focus ring, dark-mode support) automatically.
      */}
      <TextInput
        // @ts-ignore
        error={fieldError ?? undefined}
        label="Folder name"
        onChange={(e: any) => {
          setName(e.target.value)
          if (fieldError) {
            setFieldError(null)
          }
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter') {
            void handleSubmit()
          }
          if (e.key === 'Escape') {
            setName('')
            closeDrawer()
          }
        }}
        path="folderName"
        placeholder="e.g. uploads, assets, 2025…"
        // @ts-ignore — ref forwarding API varies by Payload minor version
        ref={inputRef}
        required
        value={name}
      />

      <div style={drawerBodyStyles.actions}>
        {/* Payload's Button inherits admin theme colours & border-radius */}
        <Button
          buttonStyle="primary"
          disabled={submitting || !name.trim()}
          onClick={handleSubmit}
          size="medium"
        >
          {submitting ? 'Creating…' : 'Create folder'}
        </Button>

        <Button
          buttonStyle="secondary"
          onClick={() => {
            setName('')
            closeDrawer()
          }}
          size="medium"
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}

const drawerBodyStyles: Record<string, React.CSSProperties> = {
  actions: { display: 'flex', gap: 10, marginTop: 8, paddingTop: 4 },
  code: {
    background: 'var(--theme-elevation-100)',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
    padding: '1px 6px',
  },
  hint: {
    color: 'var(--theme-elevation-500)',
    fontSize: 13,
    margin: '0 0 4px',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    // Payload's Drawer gives us horizontal padding; we add top padding only
    padding: '20px 0 0',
  },
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function S3ExplorerViewClient({ apiBasePath, options }: ExplorerProps) {
  const [prefix, setPrefix] = useState(options.rootPrefix ?? '')
  const [listing, setListing] = useState<null | S3ListResult>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{
    key: string
    type: 'bulk' | 'file' | 'folder'
  } | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [preview, setPreview] = useState<null | PreviewPane>(null)

  const { openModal } = useModal()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // useDrawerSlug generates a stable, unique slug for the Drawer
  const folderDrawerSlug = useDrawerSlug('s3-create-folder')

  // ─── Data fetching ──────────────────────────────────────────────────────

  const fetchListing = useCallback(
    async (p: string) => {
      setLoading(true)
      setError(null)
      setSelected(new Set())
      try {
        const res = await fetch(`${apiBasePath}/list?prefix=${encodeURIComponent(p)}`)
        const json = await res.json()
        if (!json.success) {
          throw new Error(json.error ?? 'Failed to list objects')
        }
        setListing(json.data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setTimeout(() => setLoading(false), 150)
      }
    },
    [apiBasePath],
  )

  useEffect(() => {
    void fetchListing(prefix)
  }, [prefix, fetchListing])

  // ─── Close context menu on outside click ─────────────────────────────────

  useEffect(() => {
    const h = () => setContextMenu(null)
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  // ─── Sort ─────────────────────────────────────────────────────────────────

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortedItems = (): S3Item[] => {
  const folders = [...(listing?.folders ?? [])]
  const files = [...(listing?.files ?? [])]

  const cmp = (a: S3Item, b: S3Item): number => {
    let r = 0

    if (sortField === 'name') {
      const av = a.isFolder ? a.name : filenameFromKey(a.key, prefix)
      const bv = b.isFolder ? b.name : filenameFromKey(b.key, prefix)
      r = av.localeCompare(bv)
    } else if (sortField === 'size') {
      // Folders don't have size, default to 0 if missing, though cmp only runs folder-to-folder or file-to-file here
      const av = a.size ?? 0
      const bv = b.size ?? 0
      r = av - bv
    } else if (sortField === 'lastModified') {
      const av = a.lastModified ?? ''
      const bv = b.lastModified ?? ''
      
      // Handle Date objects or strings safely
      const t1 = av instanceof Date ? av.getTime() : String(av)
      const t2 = bv instanceof Date ? bv.getTime() : String(bv)
      
      r = t1 < t2 ? -1 : t1 > t2 ? 1 : 0
    }

    return sortDir === 'asc' ? r : -r
  }

  return [...folders.sort(cmp), ...files.sort(cmp)]
}

  // ─── Upload ───────────────────────────────────────────────────────────────

  const uploadFiles = useCallback(
    async (files: File[] | FileList) => {
      const arr = Array.from(files)
      if (!arr.length) {
        return
      }
      setUploads((prev) => [
        ...prev,
        ...arr.map((f) => ({ filename: f.name, progress: 0, status: 'pending' as const })),
      ])
      for (const file of arr) {
        const fn = file.name
        try {
          setUploads((prev) =>
            prev.map((u) =>
              u.filename === fn ? { ...u, progress: 10, status: 'uploading' as const } : u,
            ),
          )
          const pRes = await fetch(`${apiBasePath}/upload`, {
            body: JSON.stringify({ contentType: file.type, filename: fn, prefix }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          })
          const pJson = await pRes.json()
          if (!pJson.success) {
            throw new Error(pJson.error)
          }
          const { fields, url } = pJson.data
          const fd = new FormData()
          Object.entries(fields as Record<string, string>).forEach(([k, v]) => fd.append(k, v))
          fd.append('Content-Type', file.type || 'application/octet-stream')
          fd.append('file', file)
          setUploads((prev) => prev.map((u) => (u.filename === fn ? { ...u, progress: 50 } : u)))
          const uRes = await fetch(url, { body: fd, method: 'POST' })
          if (!uRes.ok) {
            throw new Error(`S3 upload failed: ${uRes.statusText}`)
          }
          setUploads((prev) =>
            prev.map((u) =>
              u.filename === fn ? { ...u, progress: 100, status: 'done' as const } : u,
            ),
          )
          payloadToast.success(`Uploaded ${fn}`)
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Upload failed'
          setUploads((prev) =>
            prev.map((u) =>
              u.filename === fn ? { ...u, error: msg, status: 'error' as const } : u,
            ),
          )
          payloadToast.error(`Failed to upload ${fn}: ${msg}`)
        }
      }
      setTimeout(() => {
        void fetchListing(prefix)
        setUploads([])
      }, 1500)
    },
    [apiBasePath, prefix, fetchListing],
  )

  // ─── Delete ───────────────────────────────────────────────────────────────

  const confirmDelete = useCallback(async () => {
    if (!deleteModal) {
      return
    }
    try {
      if (deleteModal.type === 'bulk') {
        const keys = Array.from(selected).filter((k) => !k.endsWith('/'))
        try {
          await Promise.all(
            keys.map(async (key) => {
              const response = await fetch(`${apiBasePath}/delete`, {
                body: JSON.stringify({ key }),
                headers: { 'Content-Type': 'application/json' },
                method: 'DELETE',
              });

              // Fetch resolves successfully for 403, so we must manually check !ok
              if (!response.ok) {
                throw new Error(`Failed to delete. Status: ${response.status}`);
              }
              return response;
            }),
          );

            payloadToast.success(`Deleted ${keys.length} file(s)`);
          } catch (error) {
            payloadToast.error("Failed to delete files. You may not have permission.");
          }
          finally {
            setSelected(new Set())
            setPreview(null)
          }
      } 
      else {
        const body =
          deleteModal.type === 'folder' ? { prefix: deleteModal.key } : { key: deleteModal.key }
        const res = await fetch(`${apiBasePath}/delete`, {
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
          method: 'DELETE',
        })
        const json = await res.json()
        if (!json.success) {
          throw new Error(json.error)
        }
        payloadToast.success(
          `${deleteModal.type === 'folder' ? `Folder '${deleteModal.key.replace('/', '')}'` : 'File'} deleted`,
        )
        setPreview(null)
      }
      setDeleteModal(null)
      await fetchListing(prefix)
    } catch (e: unknown) {
      payloadToast.error(e instanceof Error ? e.message : 'Delete failed')
      setDeleteModal(null)
    }
  }, [deleteModal, apiBasePath, fetchListing, prefix, selected])

  // ─── Download ─────────────────────────────────────────────────────────────

  const downloadFile = useCallback(
    async (key: string) => {
      try {
        const res = await fetch(`${apiBasePath}/download?key=${encodeURIComponent(key)}`)
        const json = await res.json()
        if (!json.success) {
          throw new Error(json.error)
        }
        window.open(json.data.url, '_blank')
      } catch (e: unknown) {
        payloadToast.error(e instanceof Error ? e.message : 'Download failed')
      }
    },
    [apiBasePath],
  )

  const downloadSelected = useCallback(async () => {
    for (const key of Array.from(selected).filter((k) => !k.endsWith('/'))) {
      await downloadFile(key)
    }
  }, [selected, downloadFile])

  // ─── Preview ──────────────────────────────────────────────────────────────

  const openPreview = useCallback(
    async (file: S3Item) => {
      if (file.isFolder) {
        return
      }
      const name = filenameFromKey(file.key, prefix)
      setPreview({ name, key: file.key, lastModified: file.lastModified?.toString(), size: file.size })
      try {
        const res = await fetch(`${apiBasePath}/download?key=${encodeURIComponent(file.key)}`)
        const json = await res.json()
        if (json.success) {
          setPreview((p) => (p ? { ...p, downloadUrl: json.data.url } : null))
        }
      } catch {
        /* no-op */
      }
    },
    [apiBasePath, prefix],
  )

  // ─── Drag & drop ──────────────────────────────────────────────────────────

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const handleDragLeave = () => setIsDragging(false)
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) {
      void uploadFiles(e.dataTransfer.files)
    }
  }

  // ─── Context menu ─────────────────────────────────────────────────────────

  const handleContextMenu = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row]')) {
      return
    }
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  // Open the Create Folder Drawer from the context menu
  const openFolderDrawerFromCtx = () => {
    setContextMenu(null)
    openModal(folderDrawerSlug)
  }

  // ─── Selection ────────────────────────────────────────────────────────────

  const toggleSelect = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })

  const allFileKeys = (listing?.files ?? []).map((f) => f.key)
  const allSelected = allFileKeys.length > 0 && allFileKeys.every((k) => selected.has(k))
  const someSelected = selected.size > 0
  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(allFileKeys))

  // ─── Sort indicator ───────────────────────────────────────────────────────

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <span style={{ marginLeft: 4, opacity: 0.3 }}>
          <Icon.ChevronDown />
        </span>
      )
    }
    return (
      <span style={{ color: 'var(--theme-elevation-1000)', marginLeft: 4 }}>
        {sortDir === 'asc' ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
      </span>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const breadcrumbs = buildBreadcrumbs(prefix)
  const items = sortedItems()
  const canCreate = options.enableFolderCreate ?? true
  const canUpload = options.enableUpload ?? true
  const canDelete = options.enableDelete ?? true
  const canDownload = options.enableDownload ?? true

  return (
    <div style={S.root}>
      <style>{`
       @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .s3x-row:hover { background: var(--theme-elevation-50) !important; }
        .s3x-row:hover .s3x-actions { opacity: 1 !important; }
        .s3x-act:hover { background: var(--theme-elevation-100) !important; color: var(--theme-text) !important; }
        .s3x-sort:hover { color: var(--theme-elevation-1000) !important; }
        .s3x-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1) !important; transform: translateY(-2px); }
        .s3x-card:hover .s3x-actions { opacity: 1 !important; }
        .s3x-bc:hover { background: var(--theme-elevation-100) !important; }
        .s3x-ctx:hover { background: var(--theme-elevation-100) !important; }
      `}</style>

      {/* ── Payload Drawer: Create Folder ─────────────────────────────────── */}
      {canCreate && (
        <Drawer gutter slug={folderDrawerSlug} title="New Folder">
          <CreateFolderDrawerBody
            apiBasePath={apiBasePath}
            drawerSlug={folderDrawerSlug}
            onCreated={() => void fetchListing(prefix)}
            prefix={prefix}
          />
        </Drawer>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <h2 style={S.title}>
          <Icon.Folder />
          <span>{options.pageTitle}</span>
        </h2>
        <div style={S.headerActions}>
          {/* List / Grid toggle */}
          <div style={S.viewToggle}>
            <button
              onClick={() => setViewMode('list')}
              style={{ ...S.viewBtn, ...(viewMode === 'list' ? S.viewBtnOn : {}) }}
              title="List view"
            >
              <Icon.List />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{ ...S.viewBtn, ...(viewMode === 'grid' ? S.viewBtnOn : {}) }}
              title="Grid view"
            >
              <Icon.Grid />
            </button>
          </div>

          {/* New Folder — opens Payload Drawer */}
          {canCreate && (
            <DrawerToggler
              slug={folderDrawerSlug}
              style={{ background: 'none', border: 'none', padding: '0px' }}
            >
              {/* el="div" prevents a <button> inside <button> warning */}
              <div style={{ 
                marginBottom: 0 ,
                alignItems: 'center',
                }}>
                <Button buttonStyle="secondary" el="div" size="medium">
                  <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
                    <Icon.FolderPlus />
                    <div>{"New Folder"}</div>
                  </div>
                </Button>
              </div>
            </DrawerToggler>
          )}

          {canUpload && (
            <Button
              buttonStyle="primary"
              onClick={() => fileInputRef.current?.click()}
              size="medium"
            >
              <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
                <Icon.Upload />
                <div>{"Upload Files"}</div>
              </div>
            </Button>
          )}

          <Button
            buttonStyle="secondary"
            onClick={() => void fetchListing(prefix)}
            size="medium"
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
              <Icon.Refresh />
              <div>{"Refresh"}</div>
            </div>
          </Button>
        </div>
      </div>

      {/* ── Breadcrumbs ───────────────────────────────────────────────────── */}
      <nav style={S.navbar} onContextMenu={handleContextMenu}>
        <div style={S.breadcrumb}>
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.prefix}>
            {i > 0 && (
              <span style={S.breadcrumbSep}>
                <Icon.ChevronRight />
              </span>
            )}
            <button
              className={i < breadcrumbs.length - 1 ? 's3x-bc' : ''}
              disabled={i === breadcrumbs.length - 1}
              onClick={() => setPrefix(crumb.prefix)}
              style={i === breadcrumbs.length - 1 ? S.breadcrumbActive : S.breadcrumbBtn}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
        </div>
        
        <div>
          {/* ── Bulk action bar ───────────────────────────────────────────────── */}          
          {someSelected && (
            <div style={S.bulkBar}>
              <span style={S.bulkCount}>{selected.size} selected</span>
              <div style={{ display: 'flex', gap: 12 }}>
                {canDownload && (
                  <Button buttonStyle="secondary" onClick={downloadSelected} size="small">
                    <Icon.Download />
                    &nbsp;Download All
                  </Button>
                )}
                {canDelete && (
                  <Button
                    buttonStyle="primary"
                    onClick={() => setDeleteModal({ type: 'bulk', key: '' })}
                    size="small"
                    //@ts-ignore
                    style={{
                      borderColor: 'var(--theme-error-300, #fca5a5)',
                      color: 'var(--theme-error-500, #ef4444)',
                    }}
                  >
                    <Icon.Trash />
                    &nbsp;Delete All
                  </Button>
                )}
                <Button buttonStyle="secondary" onClick={() => setSelected(new Set())} size="small">
                  <Icon.X />
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>



      {/* ── Upload progress ───────────────────────────────────────────────── */}
      {uploads.length > 0 && (
        <div style={S.uploadProgress}>
          {uploads.map((u) => (
            <div key={u.filename} style={S.uploadItem}>
              <span style={S.uploadName}>{u.filename}</span>
              <div style={S.progressBar}>
                <div
                  style={{
                    ...S.progressFill,
                    background:
                      u.status === 'error'
                        ? 'var(--theme-error-500,#ef4444)'
                        : u.status === 'done'
                          ? '#22c55e'
                          : 'var(--theme-elevation-1000)',
                    width: `${u.progress}%`,
                  }}
                />
              </div>
              <span
                style={{
                  color:
                    u.status === 'error'
                      ? 'var(--theme-error-500,#ef4444)'
                      : 'var(--theme-elevation-400)',
                  fontSize: 11,
                }}
              >
                {u.status === 'error'
                  ? (u.error ?? 'Error')
                  : u.status === 'done'
                    ? 'Done'
                    : `${u.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div
        style={{
          alignItems: 'flex-start',
          display: 'flex',
          height: 512,
          gap: 16,
        }}
      >
        {/* Drop zone */}
        <div
          onContextMenu={handleContextMenu}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            ...S.dropZone,
            ...(isDragging ? S.dropZoneActive : {}),
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isDragging && (
            <div style={S.dropOverlay}>
              <Icon.Upload />
              <span>Drop files to upload</span>
            </div>
          )}
          {loading && (
            <div style={S.emptyState}>
              <div style={S.spinner} />
              <span>Loading…</span>
            </div>
          )}
          {error && !loading && (
            <div style={S.errorState}>
              <Icon.Alert />
              <span>{error}</span>
            </div>
          )}

          {/* LIST VIEW */}
          {!loading && !error && viewMode === 'list' && (
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, }}>
              <div style={S.tableHeader}>
                <div style={{ flexShrink: 0, width: 28 }}>
                  <button
                    onClick={toggleSelectAll}
                    style={S.checkboxBtn}
                    title={allSelected ? 'Deselect all' : 'Select all'}
                  >
                    {allSelected ? (
                      <span style={{ color: 'var(--theme-elevation-1000)' }}>
                        <Icon.CheckSquare />
                      </span>
                    ) : (
                      <Icon.Square />
                    )}
                  </button>
                </div>
                {(['name', 'size', 'lastModified'] as SortField[]).map((field) => (
                  <button
                    className="s3x-sort"
                    key={field}
                    onClick={() => handleSort(field)}
                    style={{
                      ...S.sortBtn,
                      flex: field === 'name' ? 4 : field === 'lastModified' ? 1.5 : 1,
                    }}
                  >
                    {field === 'name' ? 'Name' : field === 'size' ? 'Size' : 'Modified'}
                    <SortIcon field={field} />
                  </button>
                ))}
                <div style={{ width: 110 }} />
              </div>

              {items.length === 0 && (
                <div style={{ ...S.emptyState, height: '60vh' }}>
                  <Icon.Folder />
                  <span>This folder is empty</span>
                  {canUpload && (
                    <span style={{ color: 'var(--theme-elevation-400)', fontSize: 13 }}>
                      Right-click or drag & drop to add files
                    </span>
                  )}
                </div>
              )}

              {items.map((item) => {
                if (item.isFolder) {
                  return (
                    <div className="s3x-row" data-row key={item.prefix} style={S.row}>
                      <div style={{ flexShrink: 0, width: 32 }} />
                      <div style={{ ...S.col, flex: 4, gap: 8 }}>
                        <span style={{ color: '#f59e0b' }}>
                          <Icon.Folder />
                        </span>
                        <button onClick={() => setPrefix(item.prefix)} style={S.nameBtn}>
                          {item.name}
                        </button>
                      </div>
                      <div style={{ ...S.col, color: 'var(--theme-elevation-400)', flex: 1 }}>
                        {item.size ? formatBytes(item.size) : '-'}
                      </div>
                      <div style={{ ...S.col, color: 'var(--theme-elevation-400)', flex: 1.5 }}>
                        {item.lastModified ? new Date(item.lastModified).toLocaleString() : '-'}
                      </div>
                      <div className="s3x-actions" style={S.rowActions}>
                        {canDelete && (
                          <button
                            className="s3x-act"
                            onClick={() => setDeleteModal({ type: 'folder', key: item.prefix })}
                            style={S.actBtn}
                            title="Delete folder"
                          >
                            <Icon.Trash />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                }

                const name = filenameFromKey(item.key, prefix)
                const isSel = selected.has(item.key)
                return (
                  <div
                    className="s3x-row"
                    data-row
                    key={item.key}
                    style={{ ...S.row, ...(isSel ? S.rowSel : {}) }}
                  >
                    <div style={{ flexShrink: 0, width: 32 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleSelect(item.key)
                        }}
                        style={S.checkboxBtn}
                      >
                        {isSel ? (
                          <span style={{ color: 'var(--theme-elevation-1000)' }}>
                            <Icon.CheckSquare />
                          </span>
                        ) : (
                          <Icon.Square />
                        )}
                      </button>
                    </div>
                    <div
                      onClick={() => openPreview(item)}
                      style={{ ...S.col, cursor: 'pointer', flex: 4, gap: 8 }}
                    >
                      <span style={{ color: getFileColor(item.key) }}>{getFileIcon(item.key)}</span>
                      <span style={S.fileName}>{name}</span>
                    </div>
                    <div
                      style={{
                        ...S.col,
                        color: 'var(--theme-elevation-500)',
                        flex: 1,
                        fontSize: 13,
                      }}
                    >
                      {formatBytes(item.size)}
                    </div>
                    <div
                      style={{
                        ...S.col,
                        color: 'var(--theme-elevation-500)',
                        flex: 1.5,
                        fontSize: 13,
                      }}
                    >
                      {new Date(item.lastModified).toLocaleString()}
                    </div>
                    <div
                      className="s3x-actions"
                      onClick={(e) => e.stopPropagation()}
                      style={S.rowActions}
                    >
                      <button
                        className="s3x-act"
                        onClick={() => openPreview(item)}
                        style={S.actBtn}
                        title="Preview"
                      >
                        <Icon.Eye />
                      </button>
                      {canDownload && (
                        <button
                          className="s3x-act"
                          onClick={() => downloadFile(item.key)}
                          style={S.actBtn}
                          title="Download"
                        >
                          <Icon.Download />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="s3x-act"
                          onClick={() => setDeleteModal({ type: 'file', key: item.key })}
                          style={{ ...S.actBtn, color: 'var(--theme-error-500,#ef4444)' }}
                          title="Delete"
                        >
                          <Icon.Trash />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* GRID VIEW */}
          {!loading && !error && viewMode === 'grid' && (
            <div style={S.grid}>
              {items.length === 0 && (
                <div style={{ ...S.emptyState, gridColumn: '1/-1' }}>
                  <Icon.Folder />
                  <span>This folder is empty</span>
                </div>
              )}
              {items.map((item) => {
                if (item.isFolder) {
                  return (
                    <div className="s3x-card" data-row key={item.prefix} style={S.card}>
                      <div
                        onClick={() => setPrefix(item.prefix)}
                        style={{
                          ...S.cardIcon,
                          background: 'var(--theme-elevation-50)',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: '#f59e0b' }}>
                          <svg fill="currentColor" height="40" viewBox="0 0 24 24" width="40">
                            <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                          </svg>
                        </span>
                      </div>
                      <span style={S.cardName}>{item.name}</span>
                      <span style={S.cardMeta}>Folder</span>
                      <div className="s3x-actions" style={S.cardActions}>
                        {canDelete && (
                          <button
                            className="s3x-act"
                            onClick={() => setDeleteModal({ type: 'folder', key: item.prefix })}
                            style={{ ...S.actBtn, color: 'var(--theme-error-500,#ef4444)' }}
                            title="Delete"
                          >
                            <Icon.Trash />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                }

                const name = filenameFromKey(item.key, prefix)
                const isSel = selected.has(item.key)
                const ext = getExtension(item.key)
                return (
                  <div
                    className="s3x-card"
                    data-row
                    key={item.key}
                    style={{ ...S.card, ...(isSel ? S.cardSel : {}) }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleSelect(item.key)
                      }}
                      style={{ ...S.checkboxBtn, left: 8, position: 'absolute', top: 8 }}
                    >
                      {isSel ? (
                        <span style={{ color: 'var(--theme-elevation-1000)' }}>
                          <Icon.CheckSquare />
                        </span>
                      ) : (
                        <Icon.Square />
                      )}
                    </button>
                    <div
                      onClick={() => openPreview(item)}
                      style={{
                        ...S.cardIcon,
                        background: 'var(--theme-elevation-50)',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      {isImageKey(item.key) ? (
                        <span style={{ color: '#8b5cf6' }}>
                          <svg
                            fill="none"
                            height="40"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                            width="40"
                          >
                            <rect height="18" rx="2" width="18" x="3" y="3" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </span>
                      ) : (
                        <div
                          style={{
                            alignItems: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <span style={{ color: getFileColor(item.key) }}>
                            <svg
                              fill="none"
                              height="40"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              viewBox="0 0 24 24"
                              width="40"
                            >
                              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </span>
                          <span
                            style={{
                              color: getFileColor(item.key),
                              fontSize: 10,
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                            }}
                          >
                            {isKnownExtension(ext) ? ext : ''}
                          </span>
                        </div>
                      )}
                    </div>
                    <span style={S.cardName} title={name}>
                      {name}
                    </span>
                    <span style={S.cardMeta}>{formatBytes(item.size)}</span>
                    <div className="s3x-actions" style={S.cardActions}>
                      <button
                        className="s3x-act"
                        onClick={() => openPreview(item)}
                        style={S.actBtn}
                        title="Preview"
                      >
                        <Icon.Eye />
                      </button>
                      {canDownload && (
                        <button
                          className="s3x-act"
                          onClick={() => downloadFile(item.key)}
                          style={S.actBtn}
                          title="Download"
                        >
                          <Icon.Download />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="s3x-act"
                          onClick={() => setDeleteModal({ type: 'file', key: item.key })}
                          style={{ ...S.actBtn, color: 'var(--theme-error-500,#ef4444)' }}
                          title="Delete"
                        >
                          <Icon.Trash />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Preview pane ─────────────────────────────────────────────── */}
        {preview && (
          <div style={S.previewPane}>
            <div style={S.previewHeader}>
              <span style={S.previewTitle} title={preview.name}>
                {preview.name}
              </span>
              <button onClick={() => setPreview(null)} style={S.actBtn} title="Close">
                <Icon.X />
              </button>
            </div>
            <div style={S.previewContent}>
              {isImageKey(preview.key) && preview.downloadUrl ? (
                <img
                  alt={preview.name}
                  src={preview.downloadUrl}
                  style={{
                    border: '1px solid var(--theme-elevation-100)',
                    borderRadius: 8,
                    maxHeight: 300,
                    maxWidth: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : isPdfKey(preview.key) && preview.downloadUrl ? (
                <iframe
                  src={preview.downloadUrl}
                  style={{ border: 'none', borderRadius: 8, height: 360, width: '100%' }}
                  title={preview.name}
                />
              ) : (
                <div
                  style={{
                    alignItems: 'center',
                    color: 'var(--theme-elevation-400)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    padding: '32px 0',
                  }}
                >
                  <span style={{ color: getFileColor(preview.key) }}>
                    <svg
                      fill="none"
                      height="64"
                      stroke="currentColor"
                      strokeWidth="1"
                      viewBox="0 0 24 24"
                      width="64"
                    >
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </span>
                  <span style={{ fontSize: 13 }}>No preview available</span>
                  <span
                    style={{
                      background: 'var(--theme-elevation-100)',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      padding: '2px 8px',
                    }}
                  >
                    {getExtension(preview.key)}
                  </span>
                </div>
              )}
            </div>
            <div style={S.previewMeta}>
              {[
                ['Name', preview.name],
                ['Size', formatBytes(preview.size)],
                ['Modified', new Date(preview.lastModified).toLocaleString()],
                ['Path', preview.key],
              ].map(([label, value]) => (
                <div key={label} style={S.previewMetaRow}>
                  <span style={S.previewMetaLabel}>{label}</span>
                  <span
                    style={{
                      ...S.previewMetaValue,
                      fontSize: label === 'Path' ? 11 : 12,
                      wordBreak: label === 'Path' ? 'break-all' : 'normal',
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
            {preview.downloadUrl && canDownload && (
              <div style={S.previewActions}>
                <a
                  href={preview.downloadUrl}
                  rel="noreferrer"
                  style={S.previewLinkPrimary}
                  target="_blank"
                >
                  <Icon.Download /> Download
                </a>
                <a
                  href={preview.downloadUrl}
                  rel="noreferrer"
                  style={S.previewLinkSecondary}
                  target="_blank"
                >
                  <Icon.ExternalLink /> Open
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Status bar ───────────────────────────────────────────────────── */}
      <div style={S.statusBar}>
        <span>
          {listing
            ? `${listing.folders.length} folder${listing.folders.length !== 1 ? 's' : ''}, ${listing.files.length} file${listing.files.length !== 1 ? 's' : ''}`
            : '—'}
        </span>
        {someSelected && (
          <span style={{ color: 'var(--theme-elevation-1000)' }}>{selected.size} selected</span>
        )}
        {listing?.isTruncated && (
          <span style={{ color: '#f59e0b' }}>Results truncated — bucket has more objects</span>
        )}
      </div>

      {/* ── Hidden file input ─────────────────────────────────────────────── */}
      <input
        multiple
        onChange={(e) => {
          if (e.target.files) {
            void uploadFiles(e.target.files)
          }
        }}
        accept={[
            ...(options.allowedExtensions?.map((ext) => `.${ext}`) || []),
            ...(Array.isArray(options.allowedMimeTypes) ? options.allowedMimeTypes : [])
        ].join(',')}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
      />

      {/* ── Right-click context menu ──────────────────────────────────────── */}
      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ ...S.ctxMenu, left: contextMenu.x, top: contextMenu.y }}
        >
          {canCreate && (
            <button className="s3x-ctx" onClick={openFolderDrawerFromCtx} style={S.ctxItem}>
              <Icon.FolderPlus /> New Folder
            </button>
          )}
          {canUpload && (
            <button
              className="s3x-ctx"
              onClick={() => {
                setContextMenu(null)
                fileInputRef.current?.click()
              }}
              style={S.ctxItem}
            >
              <Icon.Upload /> Upload File
            </button>
          )}
          <div style={S.ctxDivider} />
          <button
            className="s3x-ctx"
            onClick={() => {
              setContextMenu(null)
              void fetchListing(prefix)
            }}
            style={S.ctxItem}
          >
            <Icon.Refresh /> Refresh
          </button>
        </div>
      )}

      {/* ── Delete confirmation modal ─────────────────────────────────────── */}
      {/*
        Payload doesn't expose a generic confirm dialog, so we use our own.
        We use Payload's Button inside so destructive actions still feel on-brand.
      */}
      {deleteModal && (
        <div onClick={() => setDeleteModal(null)} style={S.modalBackdrop}>
          <div onClick={(e) => e.stopPropagation()} style={S.modal}>
            <h3 style={S.modalTitle}>Confirm Delete</h3>
            <p style={S.modalBody}>
              {deleteModal.type === 'bulk'
                ? `Permanently delete ${selected.size} selected file${selected.size !== 1 ? 's' : ''}? This cannot be undone.`
                : deleteModal.type === 'folder'
                  ? `Delete folder "${folderNameFromKey(deleteModal.key)}" and *ALL* its contents? This cannot be undone.`
                  : `Delete "${filenameFromKey(deleteModal.key, prefix)}"? This cannot be undone.`}
            </p>
            <div style={S.modalActions}>
              <Button buttonStyle="secondary" onClick={() => setDeleteModal(null)} size="medium">
                Cancel
              </Button>
              <Button buttonStyle="primary" onClick={confirmDelete} size="medium">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  actBtn: {
    alignItems: 'center',
    background: 'none',
    border: 'none',
    borderRadius: 4,
    color: 'var(--theme-elevation-500)',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    padding: '4px 6px',
    transition: 'background 0.1s, color 0.1s',
  },
  navbar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    display: 'flex',
    flexWrap: 'wrap',
    flexDirection: 'row',
    fontSize: 13,
    gap: 4,
    background: 'var(--theme-elevation-50)',
    border: '1px solid var(--theme-elevation-150)',
    marginBottom: 16,
  },
  breadcrumb: {
    alignItems: 'center',
    borderRadius: 8,
    display: 'flex',
    flex: 1,
    flexWrap: 'wrap',
    fontSize: 13,
    gap: 4,
    height: 42,
    // marginBottom: 16,
    padding: '8px 12px',
  },
  breadcrumbActive: {
    background: 'none',
    border: 'none',
    color: 'var(--theme-text)',
    cursor: 'default',
    fontSize: 13,
    fontWeight: 600,
    padding: '2px 4px',
  },
  breadcrumbBtn: {
    background: 'none',
    border: 'none',
    borderRadius: 4,
    color: 'var(--theme-elevation-1000)',
    cursor: 'pointer',
    fontSize: 13,
    padding: '2px 6px',
    transition: 'background 0.1s',
  },
  breadcrumbSep: { alignItems: 'center', color: 'var(--theme-elevation-400)', display: 'flex' },
  bulkBar: {
    alignItems: 'center',
    // background: 'var(--theme-elevation-50)',
    // border: '1px solid var(--theme-elevation-150)',
    borderRadius: 8,
    display: 'flex',
    gap: '24px',
    height: '42px',
    justifyContent: 'space-between',
    // marginBottom: 12,
    padding: '0px 16px',
  },
  bulkCount: { color: 'var(--theme-text)', fontSize: 13, fontWeight: 600 },
  card: {
    alignItems: 'center',
    background: 'var(--theme-bg)',
    border: '1px solid var(--theme-elevation-100)',
    borderRadius: 10,
    cursor: 'default',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '16px 12px 12px',
    position: 'relative',
    transition: 'box-shadow 0.2s, transform 0.2s',
  },
  cardActions: { display: 'flex', gap: 4, marginTop: 4, opacity: 0, transition: 'opacity 0.15s' },
  cardIcon: {
    alignItems: 'center',
    borderRadius: 8,
    display: 'flex',
    height: 80,
    justifyContent: 'center',
    width: '100%',
  },
  cardMeta: { color: 'var(--theme-elevation-400)', fontSize: 11, textAlign: 'center' as const },
  cardName: {
    fontSize: 12,
    fontWeight: 500,
    maxWidth: '100%',
    overflow: 'hidden',
    textAlign: 'center' as const,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
  cardSel: {
    borderColor: 'var(--theme-elevation-1000)',
    boxShadow: '0 0 0 2px rgba(59,130,246,0.2)',
  },
  checkboxBtn: {
    alignItems: 'center',
    background: 'none',
    border: 'none',
    borderRadius: 4,
    color: 'var(--theme-elevation-400)',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    padding: 2,
  },
  col: { alignItems: 'center', display: 'flex', overflow: 'hidden' },
  ctxDivider: { background: 'var(--theme-elevation-150)', height: 1, margin: '4px 0' },
  ctxItem: {
    alignItems: 'center',
    background: 'none',
    border: 'none',
    borderRadius: 5,
    color: 'var(--theme-text)',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 13,
    gap: 8,
    padding: '8px 12px',
    textAlign: 'left',
    transition: 'background 0.1s',
    width: '100%',
  },
  ctxMenu: {
    background: 'var(--theme-bg)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    minWidth: 180,
    overflow: 'hidden',
    padding: 4,
    position: 'fixed',
    zIndex: 9990,
  },
  dropOverlay: {
    alignItems: 'center',
    background: 'rgba(59,130,246,0.05)',
    color: 'var(--theme-elevation-1000)',
    display: 'flex',
    flexDirection: 'column',
    fontSize: 18,
    fontWeight: 600,
    gap: 8,
    inset: 0,
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 10,
  },
  dropZone: {
    background: 'var(--theme-bg)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 10,
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    
  },
  dropZoneActive: {
    borderColor: 'var(--theme-elevation-1000)',
    boxShadow: '0 0 0 3px rgba(59,130,246,0.12)',
  },
  emptyState: {
    alignItems: 'center',
    color: 'var(--theme-elevation-400)',
    display: 'flex',
    flexDirection: 'column',
    fontSize: 14,
    gap: 8,
    justifyContent: 'center',
    padding: '60px 20px',
    height: '100%',
    flex: 1,
  },
  errorState: {
    alignItems: 'center',
    color: 'var(--theme-error-500,#ef4444)',
    display: 'flex',
    fontSize: 14,
    gap: 8,
    justifyContent: 'center',
    padding: '40px 20px',
    height: '100%',
    flex: 1,
  },
  fileName: { fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  grid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    padding: 16,
    overflowY: 'auto',
    minHeight: 0
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerActions: { alignItems: 'center', display: 'flex', gap: 8 },
  modal: {
    background: 'var(--theme-bg)',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    maxWidth: 420,
    padding: '28px 32px',
    width: '90%',
  },
  modalActions: { display: 'flex', gap: 10, justifyContent: 'flex-end' },
  modalBackdrop: {
    alignItems: 'center',
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    position: 'fixed',
    zIndex: 9998,
  },
  modalBody: {
    color: 'var(--theme-elevation-500)',
    fontSize: 14,
    lineHeight: 1.6,
    marginBottom: 24,
  },
  modalTitle: { color: 'var(--theme-text)', fontSize: 18, fontWeight: 700, margin: '0 0 12px' },
  nameBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--theme-text)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 600,
    overflow: 'hidden',
    padding: 0,
    textAlign: 'left' as const,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewActions: {
    borderTop: '1px solid var(--theme-elevation-100)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    padding: '12px 16px',
  },
  previewContent: {
    alignItems: 'center',
    background: 'var(--theme-elevation-50)',
    borderBottom: '1px solid var(--theme-elevation-100)',
    display: 'flex',
    justifyContent: 'center',
    minHeight: 160,
    padding: 16,
  },
  previewHeader: {
    alignItems: 'center',
    borderBottom: '1px solid var(--theme-elevation-100)',
    display: 'flex',
    gap: 8,
    justifyContent: 'space-between',
    padding: '12px 16px',
  },
  previewLinkPrimary: {
    alignItems: 'center',
    background: 'var(--theme-elevation-1000)',
    border: 'none',
    borderRadius: 6,
    color: '#000',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 13,
    fontWeight: 600,
    gap: 6,
    padding: '8px 14px',
    textDecoration: 'none',
  },
  previewLinkSecondary: {
    alignItems: 'center',
    background: 'transparent',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 6,
    color: 'var(--theme-text)',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 13,
    fontWeight: 500,
    gap: 6,
    padding: '8px 14px',
    textDecoration: 'none',
  },
  previewMeta: { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 16px' },
  previewMetaLabel: {
    color: 'var(--theme-elevation-400)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.05em',
    minWidth: 72,
    textTransform: 'uppercase' as const,
  },
  previewMetaRow: { alignItems: 'flex-start', display: 'flex', gap: 8 },
  previewMetaValue: { color: 'var(--theme-text)', flex: 1, fontSize: 12 },
  previewPane: {
    background: 'var(--theme-bg)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
    width: 280,
  },
  previewTitle: {
    color: 'var(--theme-text)',
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  progressBar: {
    background: 'var(--theme-elevation-150)',
    borderRadius: 999,
    flex: 2,
    height: 6,
    overflow: 'hidden',
  },
  progressFill: { borderRadius: 999, height: '100%', transition: 'width 0.3s ease' },
  root: { color: 'var(--theme-text)', maxWidth: '100%', padding: '4px', position: 'relative' },
  row: {
    alignItems: 'center',
    borderBottom: '1px solid var(--theme-elevation-100)',
    cursor: 'default',
    display: 'flex',
    padding: '10px 16px',
    transition: 'background 0.1s',
  },
  rowActions: {
    alignItems: 'center',
    display: 'flex',
    gap: 4,
    justifyContent: 'flex-end',
    opacity: 0,
    transition: 'opacity 0.15s',
    width: 110,
  },
  rowSel: { background: 'rgba(59,130,246,0.05)' },
  sortBtn: {
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: 'var(--theme-elevation-400)',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    padding: 0,
    textTransform: 'uppercase' as const,
    transition: 'color 0.1s',
  },
  spinner: {
    animation: 'spin 0.8s linear infinite',
    border: '3px solid var(--theme-elevation-150)',
    borderRadius: '50%',
    borderTopColor: 'var(--theme-elevation-1000)',
    height: 24,
    width: 24,
  },
  statusBar: {
    alignItems: 'center',
    color: 'var(--theme-elevation-400)',
    display: 'flex',
    fontSize: 12,
    justifyContent: 'space-between',
    marginTop: 8,
    padding: '6px 14px',
  },
  tableHeader: {
    alignItems: 'center',
    background: 'var(--theme-elevation-50)',
    borderBottom: '1px solid var(--theme-elevation-100)',
    display: 'flex',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.05em',
    padding: '8px 16px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  title: {
    alignItems: 'center',
    color: 'var(--theme-text)',
    display: 'flex',
    fontSize: 22,
    fontWeight: 700,
    gap: 10,
    margin: 0,
  },
  uploadItem: { alignItems: 'center', display: 'flex', gap: 10 },
  uploadName: {
    flex: 1,
    fontSize: 13,
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  uploadProgress: {
    background: 'var(--theme-elevation-50)',
    border: '1px solid var(--theme-elevation-100)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginBottom: 16,
    padding: '12px 16px',
  },
  viewBtn: {
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    color: 'var(--theme-elevation-500)',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    padding: '6px 10px',
    transition: 'background 0.1s, color 0.1s',
  },
  viewBtnOn: {
    background: 'var(--theme-bg)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    color: 'var(--theme-elevation-1000)',
  },
  viewToggle: {
    background: 'var(--theme-elevation-50)',
    border: '1px solid var(--theme-elevation-100)',
    borderRadius: 6,
    display: 'flex',
    overflow: 'hidden',
  },
}
