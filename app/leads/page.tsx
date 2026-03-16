'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, Users, Building2, Mail, Phone, MapPin, Globe, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Lead {
  id: string
  companyName: string
  location: string | null
  contactPerson: string | null
  email: string | null
  phone: string | null
  businessScope: string | null
  sourceUrl: string | null
  leadType: string
  searchModule: string | null
  verificationStatus: string
  verificationDetails: string | null
  lastVerifiedAt: string | null
  emailSentCount: number
  emailOpened: boolean
  emailReplied: boolean
  createdAt: string
}

interface SearchResult {
  success: boolean
  taskId?: string
  totalResults: number
  validLeads: number
  leads: Lead[]
  error?: string
}

const SEARCH_MODULES = [
  { value: 'logistics_usa_europe', label: '欧美物流商', description: '搜索美国/欧洲的物流公司' },
  { value: 'importer_usa_europe', label: '欧美进口商', description: '搜索美国/欧洲的进口商/分销商' },
  { value: 'china_forwarder', label: '中国货代同行', description: '搜索中国的货代公司' },
  { value: 'china_exporter', label: '中国出口工厂', description: '搜索中国的出口工厂/制造商' }
]

export default function LeadSearchPage() {
  const [keyword, setKeyword] = useState('')
  const [module, setModule] = useState('logistics_usa_europe')
  const [maxQueries, setMaxQueries] = useState(10)
  const [verifyEmails, setVerifyEmails] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [activeTab, setActiveTab] = useState('search')

  const handleSearch = async () => {
    if (!keyword.trim()) return

    setSearching(true)
    setSearchResult(null)

    try {
      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          module,
          maxQueries,
          verifyEmails
        })
      })

      const result = await response.json()
      setSearchResult(result)
      
      if (result.success && result.leads) {
        setLeads(result.leads)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResult({
        success: false,
        totalResults: 0,
        validLeads: 0,
        leads: [],
        error: 'Search request failed'
      })
    } finally {
      setSearching(false)
    }
  }

  const loadLeads = async (leadType?: string) => {
    setLoadingLeads(true)
    try {
      const url = leadType 
        ? `/api/leads/search?leadType=${leadType}&limit=100`
        : '/api/leads/search?limit=100'
      
      const response = await fetch(url)
      const data = await response.json()
      setLeads(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Load leads failed:', error)
    } finally {
      setLoadingLeads(false)
    }
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />已验证</Badge>
      case 'invalid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />无效</Badge>
      default:
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />待验证</Badge>
    }
  }

  const getLeadTypeBadge = (type: string) => {
    return type === 'peer_company' 
      ? <Badge variant="outline" className="border-blue-500 text-blue-500">同行</Badge>
      : <Badge variant="outline" className="border-purple-500 text-purple-500">直客</Badge>
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">线索搜索</h1>
          <p className="text-muted-foreground">智能搜索客户和同行数据</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search">搜索线索</TabsTrigger>
          <TabsTrigger value="leads">线索列表</TabsTrigger>
          <TabsTrigger value="peers">同行管理</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>搜索配置</CardTitle>
              <CardDescription>配置搜索参数，开始挖掘线索</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">搜索关键词</label>
                  <Input
                    placeholder="例如: Electronics, Furniture, Textile..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">搜索类型</label>
                  <Select value={module} onValueChange={setModule}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEARCH_MODULES.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          <div>
                            <div className="font-medium">{m.label}</div>
                            <div className="text-xs text-muted-foreground">{m.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">最大搜索次数</label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={maxQueries}
                    onChange={(e) => setMaxQueries(parseInt(e.target.value) || 10)}
                  />
                  <p className="text-xs text-muted-foreground">每次搜索会裂变多个关键词组合</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm-medium">选项</label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="verify"
                      checked={verifyEmails}
                      onCheckedChange={(checked) => setVerifyEmails(checked as boolean)}
                    />
                    <label htmlFor="verify" className="text-sm">
                      自动验证邮箱 (较慢但更准确)
                    </label>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleSearch} 
                disabled={searching || !keyword.trim()}
                className="w-full md:w-auto"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    搜索中...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    开始搜索
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {searchResult && (
            <Card>
              <CardHeader>
                <CardTitle>搜索结果</CardTitle>
              </CardHeader>
              <CardContent>
                {searchResult.success ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{searchResult.totalResults}</div>
                        <div className="text-sm text-muted-foreground">搜索结果</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{searchResult.leads.length}</div>
                        <div className="text-sm text-muted-foreground">提取线索</div>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold text-green-500">{searchResult.validLeads}</div>
                        <div className="text-sm text-muted-foreground">有效线索</div>
                      </div>
                    </div>

                    {searchResult.leads.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">提取的线索预览</h4>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                          {searchResult.leads.slice(0, 20).map((lead, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{lead.companyName}</div>
                                {getLeadTypeBadge(lead.leadType)}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {lead.location && <span>{lead.location}</span>}
                                {lead.email && <span className="ml-2">• {lead.email}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-destructive">
                    搜索失败: {searchResult.error}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>线索列表</CardTitle>
                  <CardDescription>已挖掘的线索数据</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => loadLeads('direct_customer')}>
                    <Users className="w-4 h-4 mr-2" />
                    直客
                  </Button>
                  <Button variant="outline" onClick={() => loadLeads('peer_company')}>
                    <Building2 className="w-4 h-4 mr-2" />
                    同行
                  </Button>
                  <Button onClick={() => loadLeads()}>
                    全部
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLeads ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无线索数据，请先搜索
                </div>
              ) : (
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <div key={lead.id} className="p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{lead.companyName}</span>
                            {getLeadTypeBadge(lead.leadType)}
                            {getVerificationBadge(lead.verificationStatus)}
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {lead.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {lead.location}
                              </div>
                            )}
                            {lead.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </div>
                            )}
                            {lead.businessScope && (
                              <div className="text-xs mt-2">
                                业务范围: {lead.businessScope}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <div>已发送: {lead.emailSentCount} 次</div>
                          {lead.emailOpened && <div className="text-green-500">已打开</div>}
                          {lead.emailReplied && <div className="text-blue-500">已回复</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="peers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>同行管理</CardTitle>
              <CardDescription>管理货代同行信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                同行管理功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
