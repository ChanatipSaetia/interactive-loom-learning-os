export interface CategorySelected {
  type: 'CategorySelected'
  /** Title of the selected taxonomy category. */
  categoryTitle: string
  /** Index of the category within the taxonomy browser. */
  categoryIndex: number
  /** Timestamp of the selection. */
  timestamp: number
}

export interface GalleryItemViewed {
  type: 'GalleryItemViewed'
  /** ID of the viewed gallery item. */
  itemId: string
  /** Index of the item within the gallery. */
  itemIndex: number
  /** Caption of the viewed image. */
  caption: string
  /** Timestamp of the view. */
  timestamp: number
}

export type ProgressiveContentEvents = CategorySelected | GalleryItemViewed
