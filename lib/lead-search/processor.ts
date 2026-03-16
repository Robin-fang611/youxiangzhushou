import OpenAI from 'openai'
import { SearchResult } from './searcher'

export interface ExtractedLead {
  companyName: string
  location: string
  contactPerson: string
  email: string
  phone: string
  businessScope: string
  sourceUrl: string
  leadType: 'direct_customer' | 'peer_company'
}

export interface ProcessingResult {
  success: boolean
  leads: ExtractedLead[]
  error?: string
}

const SYSTEM_PROMPT = `You are a Strict Data Auditor. Your goal is to extract high-quality SME business leads from search results.

*** HARD FILTERING RULES (NON-NEGOTIABLE) ***
1. REVENUE CAP: STRICTLY EXCLUDE any company with annual revenue > $100 Million USD.
2. NO GIANTS: DIRECTLY REJECT large multinational corporations (e.g., DHL, FedEx, DB Schenker, Maersk, Amazon, Walmart, etc.).
   If the description implies massive global scale (e.g., 'global leader', 'billions in assets'), DISCARD IT.
3. NO IRRELEVANT SITES: Exclude news, government (.gov), wikipedia, directories (Yelp, YellowPages), or job boards.

*** EXTRACTION SCHEMA ***
For each valid SME, extract exactly these fields (use the Chinese keys provided):
- 公司名称 (Company Name)
- 注册国家/城市 (Registration Country/City)
- 业务负责人 (Key Contact Person, if found)
- 公开电话 (Public Phone)
- 公开邮箱 (Public Email)
- 业务范围 (Business Scope - specific products/services)
- 来源URL (Source URL)

Output Format: Return ONLY a valid JSON list of objects. No markdown, no explanations.`

export class LeadProcessor {
  private openai: OpenAI | null = null
  private provider: 'openai' | 'zhipu' = 'openai'

  constructor() {
    const qwenKey = process.env.QWEN_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY
    const zhipuKey = process.env.ZHIPUAI_API_KEY

    if (qwenKey) {
      this.provider = 'qwen'
      this.openai = new OpenAI({
        apiKey: qwenKey,
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
      })
    } else if (zhipuKey) {
      this.provider = 'zhipu'
      this.openai = new OpenAI({
        apiKey: zhipuKey,
        baseURL: 'https://open.bigmodel.cn/api/paas/v4/'
      })
    } else if (openaiKey) {
      this.provider = 'openai'
      this.openai = new OpenAI({ apiKey: openaiKey })
    } else {
      console.warn('[LeadProcessor] No API key configured')
    }
  }

  private getModel(): string {
    switch (this.provider) {
      case 'qwen':
        return 'qwen-coder-plus'
      case 'zhipu':
        return 'glm-4'
      case 'openai':
      default:
        return 'gpt-4-turbo-preview'
    }
  }

  async processSearchResults(
    results: SearchResult[],
    leadType: 'direct_customer' | 'peer_company'
  ): Promise<ProcessingResult> {
    if (!this.openai) {
      return {
        success: false,
        leads: [],
        error: 'No AI API key configured'
      }
    }

    if (!results || results.length === 0) {
      return {
        success: true,
        leads: []
      }
    }

    const contextText = results
      .map((item, index) => {
        return `[${index + 1}] Title: ${item.title}\nLink: ${item.link}\nDescription: ${item.snippet}`
      })
      .join('\n\n')

    const prompt = `${SYSTEM_PROMPT}

*** SEARCH RESULTS TO AUDIT ***
${contextText}

*** JSON OUTPUT ***`

    try {
      const response = await this.openai.chat.completions.create({
        model: this.getModel(),
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      })

      const content = response.choices[0].message.content
      if (!content) {
        return {
          success: false,
          leads: [],
          error: 'Empty response from AI'
        }
      }

      const leads = this.parseAIResponse(content, leadType)
      
      return {
        success: true,
        leads
      }
    } catch (error) {
      console.error('[LeadProcessor] AI processing failed:', error)
      return {
        success: false,
        leads: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private parseAIResponse(
    content: string, 
    leadType: 'direct_customer' | 'peer_company'
  ): ExtractedLead[] {
    let text = content.trim()

    if (text.includes('```json')) {
      text = text.split('```json')[1].split('```')[0].trim()
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim()
    }

    if (!text.startsWith('[')) {
      const startIdx = text.indexOf('[')
      const endIdx = text.lastIndexOf(']')
      if (startIdx !== -1 && endIdx !== -1) {
        text = text.substring(startIdx, endIdx + 1)
      }
    }

    try {
      const data = JSON.parse(text)
      const items = Array.isArray(data) ? data : [data]
      
      return items.map(item => ({
        companyName: item['公司名称'] || item.companyName || '',
        location: item['注册国家/城市'] || item.location || '',
        contactPerson: item['业务负责人'] || item.contactPerson || '',
        email: item['公开邮箱'] || item.email || '',
        phone: item['公开电话'] || item.phone || '',
        businessScope: item['业务范围'] || item.businessScope || '',
        sourceUrl: item['来源URL'] || item.sourceUrl || '',
        leadType
      }))
    } catch (error) {
      console.error('[LeadProcessor] Failed to parse AI response:', error)
      return []
    }
  }

  async processBatch(
    results: SearchResult[],
    leadType: 'direct_customer' | 'peer_company',
    batchSize: number = 15
  ): Promise<ExtractedLead[]> {
    const allLeads: ExtractedLead[] = []
    
    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize)
      const result = await this.processSearchResults(batch, leadType)
      
      if (result.success && result.leads.length > 0) {
        allLeads.push(...result.leads)
      }
      
      if (i + batchSize < results.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return this.deduplicate(allLeads)
  }

  private deduplicate(leads: ExtractedLead[]): ExtractedLead[] {
    const seen = new Map<string, ExtractedLead>()
    
    for (const lead of leads) {
      const key = lead.email.toLowerCase() || lead.companyName.toLowerCase()
      if (key && !seen.has(key)) {
        seen.set(key, lead)
      }
    }
    
    return Array.from(seen.values())
  }
}

export const leadProcessor = new LeadProcessor()
