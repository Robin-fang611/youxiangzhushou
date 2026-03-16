import { Resolver } from 'dns'
import { promisify } from 'util'
import net from 'net'

const resolveMx = promisify(Resolver.prototype.resolveMx)

export interface VerificationResult {
  email: string
  isValid: boolean
  stage: 'format' | 'mx' | 'smtp' | 'complete'
  error?: string
  details?: string
}

export class EmailVerifier {
  private timeout: number
  private retries: number

  constructor(options?: { timeout?: number; retries?: number }) {
    this.timeout = options?.timeout || 10000
    this.retries = options?.retries || 2
  }

  isValidFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async verifyMxRecords(domain: string): Promise<{ valid: boolean; mxHost?: string; error?: string }> {
    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const resolver = new Resolver()
        const addresses = await promisify(resolver.resolveMx.bind(resolver))(domain)
        
        if (!addresses || addresses.length === 0) {
          return { valid: false, error: 'No MX records found' }
        }

        const mxHost = addresses[0].exchange
        return { valid: true, mxHost }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        if (errorMessage.includes('ENOTFOUND')) {
          return { valid: false, error: 'Domain not found' }
        }
        
        if (attempt < this.retries) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        
        return { valid: false, error: errorMessage }
      }
    }
    
    return { valid: false, error: 'MX lookup failed after retries' }
  }

  async verifySmtpConnection(
    email: string, 
    mxHost: string
  ): Promise<{ valid: boolean; error?: string }> {
    const ports = [25, 587]
    
    for (const port of ports) {
      for (let attempt = 0; attempt <= this.retries; attempt++) {
        try {
          const result = await this.attemptSmtpConnection(mxHost, port, email)
          if (result.valid) {
            return result
          }
          
          if (result.error?.includes('5.7.1') || result.error?.includes('relayed')) {
            return { valid: true }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          if (attempt < this.retries) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            continue
          }
          
          if (port === ports[ports.length - 1] && attempt === this.retries) {
            return { valid: false, error: errorMessage }
          }
        }
      }
    }
    
    return { valid: false, error: 'SMTP connection failed' }
  }

  private attemptSmtpConnection(
    mxHost: string, 
    port: number, 
    email: string
  ): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket()
      let buffer = ''
      
      const timeoutId = setTimeout(() => {
        socket.destroy()
        reject(new Error('Connection timeout'))
      }, this.timeout)

      socket.connect(port, mxHost, () => {
        clearTimeout(timeoutId)
      })

      socket.on('data', (data) => {
        buffer += data.toString()
        
        if (buffer.includes('220')) {
          socket.write('HELO verify.superlink.com\r\n')
        } else if (buffer.includes('250') && buffer.includes('HELO')) {
          socket.write('MAIL FROM:<verify@superlink.com>\r\n')
        } else if (buffer.includes('250') && buffer.includes('MAIL FROM')) {
          socket.write(`RCPT TO:<${email}>\r\n`)
        } else if (buffer.includes('250') && buffer.includes('RCPT TO')) {
          socket.write('QUIT\r\n')
          socket.destroy()
          resolve({ valid: true })
        } else if (buffer.includes('550') || buffer.includes('551') || buffer.includes('553')) {
          socket.write('QUIT\r\n')
          socket.destroy()
          resolve({ valid: false, error: 'Mailbox does not exist' })
        } else if (buffer.includes('5.7.1') || buffer.includes('relayed')) {
          socket.write('QUIT\r\n')
          socket.destroy()
          resolve({ valid: true })
        }
      })

      socket.on('error', (error) => {
        clearTimeout(timeoutId)
        reject(error)
      })

      socket.on('close', () => {
        clearTimeout(timeoutId)
        if (!buffer.includes('250') || !buffer.includes('RCPT TO')) {
          resolve({ valid: false, error: 'Connection closed unexpectedly' })
        }
      })
    })
  }

  async verify(email: string): Promise<VerificationResult> {
    if (!email || email.trim() === '') {
      return {
        email,
        isValid: false,
        stage: 'format',
        error: 'Empty email'
      }
    }

    if (!this.isValidFormat(email)) {
      return {
        email,
        isValid: false,
        stage: 'format',
        error: 'Invalid email format'
      }
    }

    const domain = email.split('@')[1]
    if (!domain) {
      return {
        email,
        isValid: false,
        stage: 'format',
        error: 'Invalid domain'
      }
    }

    const mxResult = await this.verifyMxRecords(domain)
    if (!mxResult.valid) {
      return {
        email,
        isValid: false,
        stage: 'mx',
        error: mxResult.error
      }
    }

    const smtpResult = await this.verifySmtpConnection(email, mxResult.mxHost!)
    if (!smtpResult.valid) {
      return {
        email,
        isValid: false,
        stage: 'smtp',
        error: smtpResult.error,
        details: `MX: ${mxResult.mxHost}`
      }
    }

    return {
      email,
      isValid: true,
      stage: 'complete',
      details: `Verified via ${mxResult.mxHost}`
    }
  }

  async verifyBatch(emails: string[]): Promise<VerificationResult[]> {
    const results: VerificationResult[] = []
    
    for (const email of emails) {
      const result = await this.verify(email)
      results.push(result)
      
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    return results
  }

  async verifyBatchParallel(
    emails: string[], 
    concurrency: number = 3
  ): Promise<VerificationResult[]> {
    const results: VerificationResult[] = []
    
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency)
      const batchResults = await Promise.all(batch.map(email => this.verify(email)))
      results.push(...batchResults)
      
      if (i + concurrency < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    return results
  }
}

export const emailVerifier = new EmailVerifier()
