/* eslint-disable @typescript-eslint/no-explicit-any */
import * as yaml from 'js-yaml'
import type { OKFSectionMeta, OKFSectionData } from '../../../learning-engine/composition/okf/types'

export interface SectionSaveFiles {
  sectionMd: string
  dataYaml: string
}

export function stripFrontmatter(content: string): string {
  const trimmed = content.trim()
  if (!trimmed.startsWith('---')) return trimmed

  const secondDivider = trimmed.indexOf('---', 3)
  if (secondDivider === -1) return trimmed

  return trimmed.slice(secondDivider + 3).trim()
}

export function buildSectionSaveFiles(
  meta: OKFSectionMeta,
  yamlData: string,
  sectionBody: string,
  data?: OKFSectionData
): SectionSaveFiles {
  const cleanBody = stripFrontmatter(sectionBody)
  const isTextSection = meta.type === 'text' || data?.type === 'text'

  let bodyText = cleanBody
  if (isTextSection && data && 'paragraphs' in data && Array.isArray((data as any).paragraphs)) {
    const paragraphs = (data as any).paragraphs as string[]
    if (paragraphs.length > 0) {
      bodyText = paragraphs.join('\n\n')
    }
  }

  const frontmatterMeta = {
    type: meta.type,
    ...(meta.title ? { title: meta.title } : {}),
    ...(meta.heading ? { heading: meta.heading } : {}),
    ...(meta.ordered !== undefined ? { ordered: meta.ordered } : {}),
    ...(!isTextSection ? { resource: 'data.yaml' } : {}),
    ...(meta.intro ? { intro: meta.intro } : {}),
  }

  const frontmatterYaml = yaml.dump(frontmatterMeta, { lineWidth: -1, noRefs: true }).trim()
  const sectionMd = bodyText ? `---\n${frontmatterYaml}\n---\n\n${bodyText.trim()}` : `---\n${frontmatterYaml}\n---`

  return {
    sectionMd,
    dataYaml: yamlData.trim(),
  }
}

export interface DownloadFile {
  filename: string
  content: string
  mimeType: string
}

export function triggerDownload(file: DownloadFile): void {
  const blob = new Blob([file.content], { type: file.mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function buildDownloadFiles(
  meta: OKFSectionMeta,
  yamlData: string,
  sectionBody: string,
  data?: OKFSectionData
): { sectionMd: DownloadFile; dataYaml: DownloadFile } {
  const { sectionMd: mdContent, dataYaml: yamlContent } = buildSectionSaveFiles(meta, yamlData, sectionBody, data)
  return {
    sectionMd: {
      filename: 'section.md',
      content: mdContent,
      mimeType: 'text/markdown;charset=utf-8',
    },
    dataYaml: {
      filename: 'data.yaml',
      content: yamlContent,
      mimeType: 'text/yaml;charset=utf-8',
    },
  }
}
