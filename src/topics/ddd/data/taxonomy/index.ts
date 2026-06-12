import type { TaxonomyCategory } from '../../../../sections/taxonomy-browser'
import {
  entityCategory,
  valueObjectCategory,
  aggregateCategory,
  repositoryCategory,
  domainServiceCategory,
  domainEventCategory,
  factoryCategory,
} from './tactical-blocks'
import {
  partnershipCategory,
  sharedKernelCategory,
  aclCategory,
  customerSupplierCategory,
  conformistCategory,
  ohsCategory,
  publishedLanguageCategory,
  separateWaysCategory,
} from './context-mapping'
import {
  coreDomainCategory,
  supportingSubdomainCategory,
  genericSubdomainCategory,
} from './subdomains'
import { scenariosCategories } from './scenarios'

export const tacticalBlockCategories: TaxonomyCategory[] = [
  entityCategory,
  valueObjectCategory,
  aggregateCategory,
  repositoryCategory,
  domainServiceCategory,
  domainEventCategory,
  factoryCategory,
]

export const contextMappingCategories: TaxonomyCategory[] = [
  partnershipCategory,
  sharedKernelCategory,
  aclCategory,
  customerSupplierCategory,
  conformistCategory,
  ohsCategory,
  publishedLanguageCategory,
  separateWaysCategory,
]

export const subdomainCategories: TaxonomyCategory[] = [
  coreDomainCategory,
  supportingSubdomainCategory,
  genericSubdomainCategory,
]

export { scenariosCategories }
