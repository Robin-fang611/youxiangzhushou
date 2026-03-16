import { z } from 'zod'

export const SearchModuleSchema = z.enum([
  'logistics_usa_europe',
  'importer_usa_europe', 
  'china_forwarder',
  'china_exporter'
])

export type SearchModule = z.infer<typeof SearchModuleSchema>

export interface SearchOptions {
  keyword: string
  module: SearchModule
  page?: number
  numResults?: number
  region?: string
}

export interface SearchResult {
  title: string
  link: string
  snippet: string
  position?: number
}

export interface SearchResponse {
  organic: SearchResult[]
  searchParameters?: {
    q: string
    type: string
  }
}

const SERPER_API_URL = 'https://google.serper.dev/search'

export class Searcher {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.SERPER_API_KEY || ''
    if (!this.apiKey) {
        console.warn('[Searcher] SERPER_API_KEY not configured')
    }
  }

  async executeSearch(query: string, options?: {
    page?: number
    numResults?: number
  }): Promise<SearchResponse> {
    if (!this.apiKey) {
      throw new Error('SERPER_API_KEY not configured')
    }

    const payload = {
      q: query,
      num: options?.numResults || 20,
      page: options?.page || 1,
      gl: 'us',
      hl: 'en'
    }

    try {
      const response = await fetch(SERPER_API_URL, {
        method: 'POST',
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      console.error('[Searcher] Search failed:', error)
      throw error
    }
  }

  getSearchQuery(keyword: string, module: SearchModule): string {
    const queries: Record<SearchModule, string> = {
      logistics_usa_europe: `${keyword} International Freight Forwarder Logistics Company USA Europe contact email -China`,
      importer_usa_europe: `${keyword} Importer Distributor Wholesaler USA Europe contact email`,
      china_forwarder: `${keyword} 国际货运代理 物流公司 货代 联系方式`,
      china_exporter: `${keyword} Manufacturer Exporter Factory China contact email`
    }
    return queries[module]
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const query = this.getSearchQuery(options.keyword, options.module)
    console.log(`[Searcher] Executing search: ${query}`)
    
    return this.executeSearch(query, {
      page: options.page,
      numResults: options.numResults
    })
  }

  expandKeywords(baseKeyword: string, module: SearchModule): string[] {
    const queries: string[] = []
    
    const geoLocationsUSA = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Seattle']
    const geoLocationsEurope = ['London', 'Hamburg', 'Rotterdam', 'Amsterdam', 'Paris']
    const geoLocationsChina = ['Shenzhen', 'Shanghai', 'Ningbo', 'Qingdao', 'Guangzhou', 'Xiamen']

    const industryModifiers: Record<SearchModule, string[]> = {
      logistics_usa_europe: ['Air Freight', 'Ocean Freight', 'Customs Broker', 'Warehousing', 'Supply Chain'],
      importer_usa_europe: ['Distributor', 'Wholesaler', 'Dealer', 'Supplier', 'Buyer'],
      china_forwarder: ['海运', '空运', '专线', 'FBA', '铁路'],
      china_exporter: ['OEM Factory', 'Manufacturer', 'Supplier', 'Exporter', '工厂']
    }

    const modifiers = industryModifiers[module] || []
    
    if (module === 'logistics_usa_europe' || module === 'importer_usa_europe') {
      const allLocations = [...geoLocationsUSA, ...geoLocationsEurope]
      for (const mod of modifiers) {
        for (const loc of allLocations.slice(0, 5)) {
          queries.push(`${baseKeyword} ${mod} ${loc} contact email`)
        }
      }
    } else if (module === 'china_forwarder' || module === 'china_exporter') {
      for (const mod of modifiers) {
        for (const loc of geoLocationsChina.slice(0, 5)) {
          queries.push(`${baseKeyword} ${mod} ${loc} 联系方式`)
        }
      }
    }

    return queries
  }

  async batchSearch(
    keyword: string, 
    module: SearchModule, 
    maxQueries: number = 10
  ): Promise<SearchResponse[]> {
    const expandedQueries = this.expandKeywords(keyword, module).slice(0, maxQueries)
    const results: SearchResponse[] = []

    for (const query of expandedQueries) {
      try {
        const result = await this.executeSearch(query)
        results.push(result)
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`[Searcher] Batch search failed for query: ${query}`, error)
      }
    }

    return results
  }
}

export const searcher = new Searcher()
