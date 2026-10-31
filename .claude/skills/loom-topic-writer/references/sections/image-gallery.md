# image-gallery

Visual recognition and concrete references. What does it look like? Compare examples, textures, objects or screenshots.

Read [shared components](../core/components.md) and [narration](../core/narration.md) before writing.

## Component signatures

ImageGallery(title: string, images: GalleryImage[], heading?: string, lead?: Lead) — Gallery of captioned images.
  - title: Section title, shown in the topic outline and as the section header.
  - images: The images, as GalleryImage references, in order.
  - heading: Optional sub-heading shown under the section title.
  - lead: Optional Lead(...) intro card: what the section shows, why it matters, what comes next.
GalleryImage(id: string, url: string, caption: string, credit?: string) — An image in a gallery.
  - id: Image ID, unique within the gallery.
  - url: Image URL or path.
  - caption: Caption shown under the image.
  - credit: Optional attribution.

## Presentation beats

`title`, then `image1`, `image2`, … one per image
