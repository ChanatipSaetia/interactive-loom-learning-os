import * as yaml from 'js-yaml'
import type { OKFSectionMeta } from '../okf/types'

export interface SectionSaveFiles {
  sectionMd: string
  dataYaml: string
}

export function buildSectionSaveFiles(
  meta: OKFSectionMeta,
  yamlData: string,
  sectionBody: string
): SectionSaveFiles {
  const frontmatterMeta = {
    type: meta.type,
    ...(meta.title ? { title: meta.title } : {}),
    ...(meta.heading ? { heading: meta.heading } : {}),
    ...(meta.ordered !== undefined ? { ordered: meta.ordered } : {}),
    resource: 'data.yaml',
    ...(meta.intro ? { intro: meta.intro } : {}),
  }

  const frontmatterYaml = yaml.dump(frontmatterMeta, { lineWidth: -1, noRefs: true }).trim()
  const sectionMd = `---\n${frontmatterYaml}\n---\n\n${sectionBody.trim()}`

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
  sectionBody: string
): { sectionMd: DownloadFile; dataYaml: DownloadFile } {
  const { sectionMd: mdContent, dataYaml: yamlContent } = buildSectionSaveFiles(meta, yamlData, sectionBody)
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
