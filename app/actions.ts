'use server'

import { prisma } from '@/lib/prisma'
import { emailService } from '@/lib/email-service'
import { parseVariables, validateEmail, formatEmailError } from '@/lib/utils'
import { read, utils } from 'xlsx'
import Papa from 'papaparse'
import { revalidatePath } from 'next/cache'

export interface Customer {
  email: string
  name?: string
  company?: string
}

export interface ParseResult {
  validCustomers: Customer[]
  validCount: number
  invalidCount: number
  error?: string
}

export interface ParseProgress {
  current: number
  total: number
  percentage: number
  status: 'parsing' | 'validating' | 'completed' | 'error'
}

export interface CampaignResult {
  success: boolean
  campaignId?: string
  error?: string
}

export interface CampaignStatus {
  id: string
  status: string
  totalRecipients: number
  successCount: number
  failedCount: number
  progress: number
  logs: CampaignLog[]
}

export interface CampaignLog {
  id: string
  level: string
  message: string
  createdAt: string
  details?: any
}

export interface SendProgress {
  total: number
  success: number
  failed: number
  pending: number
  percentage: number
  currentBatch: number
  totalBatches: number
  estimatedTimeRemaining?: number
}

export interface SendResult {
  email: string
  success: boolean
  error?: string
  retryCount?: number
}

async function parseCSVFile(file: File): Promise<any[]> {
  const text = await file.text()
  
  // 自动检测分隔符：优先使用英文逗号，如果没有则尝试中文逗号
  const hasEnglishComma = text.includes(',')
  const hasChineseComma = text.includes('，')
  
  let delimiter = ','
  if (!hasEnglishComma && hasChineseComma) {
    delimiter = '，'
    console.log('[parseCSVFile] 检测到中文逗号分隔符')
  }
  
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8',
    delimiter: delimiter as string,
    fastMode: true // 启用快速模式，提升性能
  })
  
  console.log('[parseCSVFile] CSV 解析结果:', result.data)
  return result.data as any[]
}

async function parseExcelFile(file: File): Promise<any[]> {
  console.log('[parseExcelFile] 开始解析文件:', file.name)
  
  const buffer = await file.arrayBuffer()
  const workbook = read(buffer, { 
    type: 'array',
    cellStyles: false, // 不读取样式，提升性能
    cellDates: false, // 不转换日期
    cellFormula: false // 不读取公式
  })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  
  console.log('[parseExcelFile] 工作表名称:', sheetName)
  
  // 使用数组格式读取所有数据
  const jsonData = utils.sheet_to_json(sheet, { 
    header: 1,
    defval: '' // 空单元格使用空字符串
  }) as any[][]
  
  console.log('[parseExcelFile] 原始数据行数:', jsonData.length)
  
  if (jsonData.length === 0) {
    console.log('[parseExcelFile] 数据为空')
    return []
  }

  // 检测第一行（可能是 header 或数据）
  const firstRow = jsonData[0]
  console.log('[parseExcelFile] 第一行数据:', firstRow)
  
  // 检查第一行是否包含邮箱格式的数据
  const firstRowHasEmail = firstRow.some((cell: any) => {
    const str = String(cell || '')
    return str.includes('@') && validateEmail(str)
  })
  
  console.log('[parseExcelFile] 第一行是否包含邮箱:', firstRowHasEmail)
  
  let dataRows = jsonData
  let headerRow: any[] = []
  let emailIndex = -1
  let nameIndex = 0
  let companyIndex = -1
  
  if (firstRowHasEmail) {
    // 第一行就是数据，没有 header
    console.log('[parseExcelFile] 第一行是数据，自动识别列')
    
    // 扫描前 3 行数据找邮箱列
    for (let i = 0; i < Math.min(jsonData.length, 3); i++) {
      const row = jsonData[i]
      for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || '').trim()
        if (cell.includes('@') && validateEmail(cell)) {
          emailIndex = j
          console.log('[parseExcelFile] 找到邮箱列索引:', j, '值:', cell)
          break
        }
      }
      if (emailIndex !== -1) break
    }
    
    // 如果找到邮箱列，假设前一列是姓名，后一列是公司
    if (emailIndex !== -1) {
      nameIndex = emailIndex > 0 ? emailIndex - 1 : 0
      companyIndex = emailIndex + 1
      console.log('[parseExcelFile] 推断列索引 - 姓名:', nameIndex, '邮箱:', emailIndex, '公司:', companyIndex)
    }
  } else {
    // 第一行是 header
    console.log('[parseExcelFile] 第一行是 header')
    headerRow = firstRow.map((h: any) => String(h).trim().toLowerCase())
    dataRows = jsonData.slice(1)
    
    console.log('[parseExcelFile] Header 行:', headerRow)
    
    // 查找邮箱列
    emailIndex = headerRow.findIndex((h: string) => 
      h.includes('email') || h.includes('邮箱') || h.includes('mail') || h.includes('e-mail')
    )
    
    // 查找姓名列
    nameIndex = headerRow.findIndex((h: string) => 
      h.includes('name') || h.includes('姓名') || h.includes('fullname')
    )
    
    // 查找公司列
    companyIndex = headerRow.findIndex((h: string) => 
      h.includes('company') || h.includes('公司') || h.includes('corp') || h.includes('unit')
    )
  }
  
  console.log('[parseExcelFile] 最终列索引 - 邮箱:', emailIndex, '姓名:', nameIndex, '公司:', companyIndex)
  
  // 转换数据为对象数组
  const result = []
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    if (!row || row.length === 0) continue

    const obj: any = {
      name: '',  // 默认值为空字符串
      company: '' // 默认值为空字符串
    }
    
    // 获取邮箱
    if (emailIndex !== -1 && row[emailIndex] !== undefined && row[emailIndex] !== null) {
      const emailVal = String(row[emailIndex]).trim()
      if (emailVal && validateEmail(emailVal)) {
        obj.email = emailVal
        console.log('[parseExcelFile] 行', i, '找到邮箱:', emailVal)
      } else {
        console.log('[parseExcelFile] 行', i, '邮箱无效:', emailVal, '索引:', emailIndex)
      }
    } else {
      console.log('[parseExcelFile] 行', i, '邮箱索引无效或值为空 - 索引:', emailIndex, '值:', row[emailIndex])
    }
    
    // 获取姓名（允许为空，使用空字符串）
    if (nameIndex !== -1 && row[nameIndex] !== undefined && row[nameIndex] !== null) {
      const nameVal = String(row[nameIndex]).trim()
      obj.name = nameVal || ''
    }
    
    // 获取公司（允许为空，使用空字符串）
    if (companyIndex !== -1 && row[companyIndex] !== undefined && row[companyIndex] !== null) {
      const companyVal = String(row[companyIndex]).trim()
      obj.company = companyVal || ''
    }

    // 如果找到了邮箱，添加到结果中
    if (obj.email) {
      result.push(obj)
      console.log('[parseExcelFile] 添加联系人:', obj)
    } else {
      console.log('[parseExcelFile] 跳过无效行:', row, '原因：无有效邮箱')
    }
  }
  
  console.log('[parseExcelFile] 解析完成，有效联系人:', result.length)
  
  return result
}

async function parseCSVFileWithHeader(file: File): Promise<any[]> {
  const text = await file.text()
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    encoding: 'UTF-8'
  })
  return result.data as any[]
}

function getFieldValue(row: any, candidates: string[]): string | undefined {
  for (const key of candidates) {
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]).trim()
    }
  }
  
  const rowKeys = Object.keys(row)
  for (const rowKey of rowKeys) {
    const normalizedRowKey = rowKey.trim().toLowerCase()
    for (const candidate of candidates) {
      if (normalizedRowKey === candidate.toLowerCase()) {
        const val = row[rowKey]
        if (val !== undefined && val !== null) {
          return String(val).trim()
        }
      }
    }
  }
  
  return undefined
}

export async function parseFile(formData: FormData): Promise<ParseResult> {
  try {
    const file = formData.get('file') as File
    if (!file) {
      return { validCustomers: [], validCount: 0, invalidCount: 0, error: '未找到文件' }
    }

    let rawData: any[] = []

    if (file.name.endsWith('.csv')) {
      rawData = await parseCSVFileWithHeader(file)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      rawData = await parseExcelFile(file)
    } else {
      return { validCustomers: [], validCount: 0, invalidCount: 0, error: '不支持的文件格式，请上传 CSV 或 Excel 文件' }
    }

    console.log('[parseFile] 解析到的原始数据:', JSON.stringify(rawData, null, 2))

    const validCustomers: Customer[] = []
    let invalidCount = 0

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i]
      console.log('[parseFile] 处理行', i, ':', row)
      
      // 尝试多种方式获取邮箱
      let emailVal = getFieldValue(row, ['email', 'Email', 'EMAIL', '邮箱', 'mail', 'Mail'])
      console.log('[parseFile] 行', i, '- 通过 getFieldValue 获取邮箱:', emailVal)
      
      // 如果没有找到，直接使用 email 字段
      if (!emailVal && row.email) {
        emailVal = String(row.email).trim()
        console.log('[parseFile] 行', i, '- 通过 row.email 获取:', emailVal)
      }
      
      // 如果还没有，检查所有字段
      if (!emailVal) {
        for (const key of Object.keys(row)) {
          const val = String(row[key]).trim()
          if (validateEmail(val)) {
            emailVal = val
            console.log('[parseFile] 行', i, '- 通过遍历字段获取邮箱:', emailVal, '字段名:', key)
            break
          }
        }
      }

      const email = emailVal || ''
      console.log('[parseFile] 行', i, '- 最终邮箱:', email, '验证结果:', validateEmail(email))

      if (!email || !validateEmail(email)) {
        invalidCount++
        console.log('[parseFile] 无效行 - 邮箱:', email, '是否通过验证:', validateEmail(email))
        continue
      }

      const nameVal = getFieldValue(row, ['name', 'Name', 'NAME', '姓名', 'fullname']) || row.name || ''
      const companyVal = getFieldValue(row, ['company', 'Company', 'COMPANY', '公司', 'corp', 'Corp']) || row.company || ''
      
      console.log('[parseFile] 行', i, '- 姓名:', nameVal, '公司:', companyVal)

      const customer = {
        email,
        name: nameVal ? String(nameVal) : '',  // 确保是字符串，避免 undefined
        company: companyVal ? String(companyVal) : ''  // 确保是字符串，避免 undefined
      }
      console.log('[parseFile] 行', i, '- 创建的联系人:', customer)
      
      validCustomers.push(customer)
    }

    console.log('[parseFile] 有效客户:', validCustomers.length, '无效数量:', invalidCount)
    console.log('[parseFile] 最终联系人列表:', JSON.stringify(validCustomers, null, 2))

    return {
      validCustomers,
      validCount: validCustomers.length,
      invalidCount
    }
  } catch (error) {
    console.error('[parseFile] Error:', error)
    return {
      validCustomers: [],
      validCount: 0,
      invalidCount: 0,
      error: error instanceof Error ? error.message : '文件解析失败'
    }
  }
}

export async function createCampaign(
  contacts: Customer[],
  subject: string,
  body: string,
  campaignName?: string
): Promise<CampaignResult> {
  try {
    if (!contacts || contacts.length === 0) {
      return { success: false, error: '联系人列表为空' }
    }

    if (!subject || !body) {
      return { success: false, error: '邮件主题和正文不能为空' }
    }

    const name = campaignName || `营销活动 ${new Date().toLocaleString('zh-CN')}`

    let tempUserId = 'temp-user-id'
    
    let user = await prisma.user.findUnique({
      where: { email: 'system@local.dev' }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: 'temp-user-id',
          email: 'system@local.dev',
          password: 'temp-password-hash',
          name: 'System User'
        }
      })
    } else {
      tempUserId = user.id
    }
    
    const createdCustomers = await Promise.all(
      contacts.map(contact => 
        prisma.customer.create({
          data: {
            userId: tempUserId,
            email: contact.email,
            name: contact.name || '',
            company: contact.company || ''
          }
        })
      )
    )

    const tempTemplate = await prisma.emailTemplate.create({
      data: {
        userId: tempUserId,
        name: `模板-${name}`,
        subject: subject,
        content: body,
        plainText: body,
        variables: '[]'
      }
    })

    const tempSenderAccount = await prisma.senderAccount.create({
      data: {
        userId: tempUserId,
        name: '默认发件账户',
        email: process.env.QQ_EMAIL || 'default@example.com',
        smtpConfig: JSON.stringify({
          host: 'smtp.qq.com',
          port: 465,
          secure: true
        })
      }
    })

    const campaign = await prisma.campaign.create({
      data: {
        userId: tempUserId,
        name,
        templateId: tempTemplate.id,
        senderAccountId: tempSenderAccount.id,
        subject,
        body,
        status: 'DRAFT',
        totalRecipients: contacts.length,
        contacts: {
          create: createdCustomers.map(customer => ({
            customerId: customer.id,
            email: customer.email,
            name: customer.name || '',
            company: customer.company || '',
            status: 'PENDING'
          }))
        }
      },
      include: {
        contacts: true
      }
    })

    revalidatePath('/campaigns')
    
    return {
      success: true,
      campaignId: campaign.id
    }
  } catch (error) {
    console.error('[createCampaign] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '创建营销活动失败'
    }
  }
}

export async function startCampaign(campaignId: string): Promise<CampaignResult> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { contacts: true }
    })

    if (!campaign) {
      return { success: false, error: '营销活动不存在' }
    }

    if (campaign.status !== 'DRAFT') {
      return { success: false, error: '该营销活动无法启动' }
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENDING',
        startedAt: new Date()
      }
    })

    revalidatePath('/campaigns')

    setTimeout(() => {
      executeCampaign(campaignId)
    }, 1000)

    return {
      success: true,
      campaignId
    }
  } catch (error) {
    console.error('[startCampaign] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '启动营销活动失败'
    }
  }
}

async function executeCampaign(campaignId: string) {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { contacts: true }
    })

    if (!campaign || campaign.status !== 'SENDING') {
      return
    }

    let successCount = 0
    let failedCount = 0

    for (const contact of campaign.contacts) {
      if (contact.status !== 'PENDING') {
        continue
      }

      const variables = {
        name: contact.name || '',
        company: contact.company || ''
      }

      const personalizedSubject = parseVariables(campaign.subject, variables)
      const personalizedBody = parseVariables(campaign.body, variables)

      const result = await emailService.sendEmail(
        contact.email,
        personalizedSubject,
        personalizedBody
      )

      await prisma.campaignContact.update({
        where: { id: contact.id },
        data: {
          status: result.success ? 'SENT' : 'FAILED',
          sentAt: result.success ? new Date() : null,
          errorMsg: result.error || null
        }
      })

      await prisma.campaignLog.create({
        data: {
          campaignId,
          level: result.success ? 'INFO' : 'ERROR',
          message: result.success 
            ? `邮件已发送至 ${contact.email}` 
            : `发送失败 ${contact.email}: ${result.error}`,
          details: JSON.stringify({ email: contact.email, ...result })
        }
      })

      if (result.success) {
        successCount++
      } else {
        failedCount++
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        successCount: { increment: successCount },
        failedCount: { increment: failedCount }
      }
    })

    revalidatePath('/campaigns')
  } catch (error) {
    console.error('[executeCampaign] Error:', error)
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' }
    })
  }
}

export async function getCampaignStatus(campaignId: string): Promise<CampaignStatus | null> {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        contacts: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!campaign) {
      return null
    }

    const progress = campaign.totalRecipients > 0
      ? Math.round(((campaign.successCount + campaign.failedCount) / campaign.totalRecipients) * 100)
      : 0

    return {
      id: campaign.id,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      successCount: campaign.successCount,
      failedCount: campaign.failedCount,
      progress,
      logs: campaign.logs.map(log => ({
        id: log.id,
        level: log.level,
        message: log.message,
        createdAt: log.createdAt.toISOString()
      }))
    }
  } catch (error) {
    console.error('[getCampaignStatus] Error:', error)
    return null
  }
}

export async function getAllCampaigns() {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { contacts: true }
        }
      }
    })

    return campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      totalRecipients: campaign.totalRecipients,
      successCount: campaign.successCount,
      failedCount: campaign.failedCount,
      progress: campaign.totalRecipients > 0
        ? Math.round(((campaign.successCount + campaign.failedCount) / campaign.totalRecipients) * 100)
        : 0,
      createdAt: campaign.createdAt.toISOString(),
      completedAt: campaign.completedAt?.toISOString()
    }))
  } catch (error) {
    console.error('[getAllCampaigns] Error:', error)
    return []
  }
}

export async function deleteCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.campaign.delete({
      where: { id: campaignId }
    })

    revalidatePath('/campaigns')
    
    return { success: true }
  } catch (error) {
    console.error('[deleteCampaign] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除营销活动失败'
    }
  }
}
