import Imap from 'imap'
import { simpleParser } from 'mailparser'

class ImapService {
  constructor(config) {
    this.config = {
      user: config.username,
      password: config.password,
      host: config.host,
      port: config.port,
      tls: config.tls || true,
      tlsOptions: {
        rejectUnauthorized: false
      },
      authTimeout: 10000,
      connTimeout: 10000
    }
  }

  async testConnection() {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config)
      
      const timeout = setTimeout(() => {
        imap.destroy()
        reject(new Error('Connection timeout'))
      }, 15000)

      imap.once('ready', () => {
        clearTimeout(timeout)
        imap.end()
        resolve(true)
      })

      imap.once('error', (err) => {
        clearTimeout(timeout)
        reject(new Error(`IMAP Error: ${err.message}`))
      })

      try {
        imap.connect()
      } catch (error) {
        clearTimeout(timeout)
        reject(new Error(`Connection Error: ${error.message}`))
      }
    })
  }

  async fetchEmails(limit = 20) {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config)
      const emails = []
      
      const timeout = setTimeout(() => {
        imap.destroy()
        reject(new Error('Fetch timeout'))
      }, 30000)

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err, box) => {
          if (err) {
            clearTimeout(timeout)
            reject(new Error(`Failed to open inbox: ${err.message}`))
            return
          }

          if (box.messages.total === 0) {
            clearTimeout(timeout)
            imap.end()
            resolve([])
            return
          }

          // Fetch recent emails
          const start = Math.max(1, box.messages.total - limit + 1)
          const end = box.messages.total
          
          const fetch = imap.seq.fetch(`${start}:${end}`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
            struct: true
          })

          fetch.on('message', (msg, seqno) => {
            const email = { seqno }
            
            msg.on('body', (stream, info) => {
              let buffer = ''
              
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8')
              })
              
              stream.once('end', () => {
                if (info.which === 'TEXT') {
                  email.body = buffer
                } else {
                  // Parse headers
                  const lines = buffer.split('\r\n')
                  lines.forEach(line => {
                    const match = line.match(/^([^:]+):\s*(.+)$/)
                    if (match) {
                      const key = match[1].toLowerCase()
                      const value = match[2]
                      
                      switch (key) {
                        case 'from':
                          email.from = value
                          break
                        case 'to':
                          email.to = value
                          break
                        case 'subject':
                          email.subject = value
                          break
                        case 'date':
                          email.date = value
                          break
                      }
                    }
                  })
                }
              })
            })
            
            msg.once('attributes', (attrs) => {
              email.uid = attrs.uid
              email.flags = attrs.flags
              email.date = email.date || attrs.date
            })
            
            msg.once('end', () => {
              // Parse email body if available
              if (email.body) {
                try {
                  simpleParser(email.body)
                    .then(parsed => {
                      email.text = parsed.text
                      email.html = parsed.html
                      emails.push(email)
                    })
                    .catch(() => {
                      // If parsing fails, use raw body
                      email.text = email.body
                      emails.push(email)
                    })
                } catch {
                  email.text = email.body
                  emails.push(email)
                }
              } else {
                emails.push(email)
              }
            })
          })

          fetch.once('error', (err) => {
            clearTimeout(timeout)
            reject(new Error(`Fetch error: ${err.message}`))
          })

          fetch.once('end', () => {
            clearTimeout(timeout)
            imap.end()
            
            // Sort emails by date (newest first)
            emails.sort((a, b) => {
              const dateA = new Date(a.date || 0)
              const dateB = new Date(b.date || 0)
              return dateB - dateA
            })
            
            resolve(emails)
          })
        })
      })

      imap.once('error', (err) => {
        clearTimeout(timeout)
        reject(new Error(`IMAP Error: ${err.message}`))
      })

      imap.once('end', () => {
        clearTimeout(timeout)
      })

      try {
        imap.connect()
      } catch (error) {
        clearTimeout(timeout)
        reject(new Error(`Connection Error: ${error.message}`))
      }
    })
  }

  async markAsRead(uid) {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config)
      
      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) {
            reject(new Error(`Failed to open inbox: ${err.message}`))
            return
          }

          imap.addFlags(uid, ['\\Seen'], (err) => {
            imap.end()
            if (err) {
              reject(new Error(`Failed to mark as read: ${err.message}`))
            } else {
              resolve(true)
            }
          })
        })
      })

      imap.once('error', (err) => {
        reject(new Error(`IMAP Error: ${err.message}`))
      })

      imap.connect()
    })
  }

  async getMailboxes() {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.config)
      
      imap.once('ready', () => {
        imap.getBoxes((err, boxes) => {
          imap.end()
          if (err) {
            reject(new Error(`Failed to get mailboxes: ${err.message}`))
          } else {
            resolve(boxes)
          }
        })
      })

      imap.once('error', (err) => {
        reject(new Error(`IMAP Error: ${err.message}`))
      })

      imap.connect()
    })
  }
}

export default ImapService